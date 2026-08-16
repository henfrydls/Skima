"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaBunSQLiteAdapterFactory = exports.PrismaBunSQLiteAdapter = void 0;
const driver_adapter_utils_1 = require("@prisma/driver-adapter-utils");
const async_mutex_1 = require("async-mutex");
const bun_sqlite_1 = require("bun:sqlite");
// Path adjusted for the vendored layout (upstream lived in dist/, one level
// below its package.json; here they're siblings).
const package_json_1 = require("./package.json");
const errors_1 = require("./errors");
const conversion_1 = require("./conversion");
const debug = (0, driver_adapter_utils_1.Debug)("prisma:driver-adapter:bun-sqlite");
const LOCK_TAG = Symbol();
// SqlQueryable implementation using bun:sqlite
class BunSQLiteQueryable {
    db;
    provider = "sqlite";
    adapterName = package_json_1.name;
    constructor(db) {
        this.db = db;
    }
    async queryRaw(query) {
        const tag = "[js::queryRaw]";
        debug(`${tag} %O`, query);
        const { columnNames, declaredTypes, values } = await this.performIO(query);
        const rows = values;
        const columnTypes = (0, conversion_1.getColumnTypes)(declaredTypes, rows);
        return {
            columnNames,
            columnTypes,
            rows: rows.map((row) => (0, conversion_1.mapRow)(row, columnTypes)),
        };
    }
    async executeRaw(query) {
        const tag = "[js::executeRaw]";
        debug(`${tag} %O`, query);
        return (await this.executeIO(query)).changes;
    }
    async executeIO(query) {
        try {
            // Check if this is a multi-statement script
            const statements = query.sql.split(';').filter(s => s.trim()).filter(s => !s.startsWith('--'));
            if (statements.length > 1) {
                debug("Executing multi-statement script by splitting into individual statements");
                // For multi-statement scripts, execute each statement individually
                if (query.args && query.args.length > 0) {
                    throw new Error("Multi-statement scripts with parameters are not supported");
                }
                let totalChanges = 0;
                for (const statement of statements) {
                    const trimmed = statement.trim();
                    if (trimmed) {
                        try {
                            const stmt = this.db.query(trimmed);
                            const result = stmt.run();
                            totalChanges += result.changes;
                        }
                        catch (stmtError) {
                            debug("Statement failed: %s, Error: %O", trimmed.substring(0, 50), stmtError);
                            throw stmtError;
                        }
                    }
                }
                return Promise.resolve({ changes: totalChanges });
            }
            // Single statement
            const stmt = this.db.query(query.sql);
            const args = (0, conversion_1.mapQueryArgs)(query.args, query.argTypes);
            const result = stmt.run(...args);
            return Promise.resolve({ changes: result.changes });
        }
        catch (e) {
            this.onError(e);
        }
    }
    getTableFromQuery(sql) {
        // Simple regex to extract table name from SELECT queries
        // This handles common cases like SELECT ... FROM table, SELECT ... FROM "table", etc.
        const match = sql.match(/\bFROM\s+(?:`([^`]+)`|"([^"]+)"|(\w+))/i);
        return match ? (match[1] || match[2] || match[3]) : null;
    }
    async getColumnTypes(tableName, columnNames) {
        try {
            const tableInfoStmt = this.db.query(`PRAGMA table_info(${tableName})`);
            const tableInfo = tableInfoStmt.all();
            // Create a map of column names to types
            const typeMap = new Map();
            tableInfo.forEach(col => {
                typeMap.set(col.name, col.type);
            });
            // Return types in the same order as columnNames
            return columnNames.map(name => typeMap.get(name) || null);
        }
        catch (e) {
            debug("Failed to get column types for table %s: %O", tableName, e);
            // Fall back to null types if we can't get schema info
            return columnNames.map(() => null);
        }
    }
    async performIO(query) {
        try {
            const stmt = this.db.query(query.sql);
            const args = (0, conversion_1.mapQueryArgs)(query.args, query.argTypes);
            const columns = stmt.columnNames;
            if (columns.length === 0) {
                stmt.run(...args);
                return Promise.resolve({
                    columnNames: [],
                    declaredTypes: [],
                    values: [],
                });
            }
            // Try to get proper column types from table schema
            let declaredTypes;
            const tableName = this.getTableFromQuery(query.sql);
            if (tableName) {
                declaredTypes = await this.getColumnTypes(tableName, columns);
            }
            else {
                declaredTypes = columns.map((col) => null);
            }
            const resultSet = {
                declaredTypes,
                columnNames: columns,
                values: stmt.values(...args),
            };
            return Promise.resolve(resultSet);
        }
        catch (e) {
            this.onError(e);
        }
    }
    onError(error) {
        debug("Error in query execution: %O", error);
        throw new driver_adapter_utils_1.DriverAdapterError((0, errors_1.convertDriverError)(error));
    }
}
// Transaction wrapper
class BunSQLiteTransaction extends BunSQLiteQueryable {
    options;
    unlockParent;
    _state = 'active';
    constructor(db, options, unlockParent) {
        super(db);
        this.options = options;
        this.unlockParent = unlockParent;
    }
    async queryRaw(query) {
        if (this._state !== 'active') {
            throw new driver_adapter_utils_1.DriverAdapterError({
                kind: "TransactionAlreadyClosed",
                cause: "Cannot execute query on a closed transaction.",
            });
        }
        return super.queryRaw(query);
    }
    async executeRaw(query) {
        if (this._state !== 'active') {
            throw new driver_adapter_utils_1.DriverAdapterError({
                kind: "TransactionAlreadyClosed",
                cause: "Cannot execute query on a closed transaction.",
            });
        }
        // Handle COMMIT/ROLLBACK statements specially to avoid double execution
        const sql = query.sql.trim().toUpperCase();
        if (sql === 'COMMIT') {
            await this.commit();
            return 0; // Return 0 for successful commit
        }
        if (sql === 'ROLLBACK') {
            await this.rollback();
            return 0; // Return 0 for successful rollback
        }
        return super.executeRaw(query);
    }
    commit() {
        debug(`[js::commit]`);
        if (this._state !== 'active') {
            debug(`[js::commit] Transaction already closed (state: ${this._state}), ignoring commit`);
            return Promise.resolve();
        }
        try {
            // Execute COMMIT directly on database
            this.db.query("COMMIT").run();
            this._state = 'committed';
        }
        catch (e) {
            this._state = 'rolled_back';
            debug("Error in commit: %O", e);
            throw new driver_adapter_utils_1.DriverAdapterError((0, errors_1.convertDriverError)(e));
        }
        finally {
            this.unlockParent();
        }
        return Promise.resolve();
    }
    rollback() {
        debug(`[js::rollback]`);
        if (this._state !== 'active') {
            debug(`[js::rollback] Transaction already closed (state: ${this._state}), ignoring rollback`);
            return Promise.resolve();
        }
        try {
            // Execute ROLLBACK directly on database
            this.db.query("ROLLBACK").run();
            this._state = 'rolled_back';
        }
        catch (e) {
            this._state = 'rolled_back';
            debug("Error in rollback: %O", e);
            throw new driver_adapter_utils_1.DriverAdapterError((0, errors_1.convertDriverError)(e));
        }
        finally {
            this.unlockParent();
        }
        return Promise.resolve();
    }
}
// Primary adapter
class PrismaBunSQLiteAdapter extends BunSQLiteQueryable {
    [LOCK_TAG] = new async_mutex_1.Mutex();
    constructor(db) {
        super(db);
        // Enable foreign key constraints
        try {
            db.query("PRAGMA foreign_keys = ON").run();
        }
        catch (e) {
            // Ignore if pragma fails
        }
    }
    executeScript(script) {
        try {
            if (script.trim() === "") {
                return Promise.resolve();
            }
            debug("[js::executeScript] Running script: %s", script.substring(0, 100) + (script.length > 100 ? '...' : ''));
            // Check if we can test database connectivity first
            try {
                this.db.query("SELECT 1").get();
                debug("[js::executeScript] Database connectivity verified");
            }
            catch (dbError) {
                debug("[js::executeScript] Database connectivity issue: %O", dbError);
                throw dbError;
            }
            // Use the same logic as executeIO for consistency
            const statements = script.split(';').filter(s => s.trim()).filter(s => !s.startsWith('--'));
            if (statements.length > 1) {
                debug("[js::executeScript] Multi-statement script detected (%d statements), executing individually", statements.length);
                for (let i = 0; i < statements.length; i++) {
                    const trimmed = statements[i].trim();
                    if (trimmed) {
                        try {
                            debug("[js::executeScript] Executing statement %d: %s", i + 1, trimmed.substring(0, 50) + '...');
                            const stmt = this.db.query(trimmed);
                            stmt.run();
                        }
                        catch (stmtError) {
                            debug("[js::executeScript] Statement %d failed: %s", i + 1, trimmed.substring(0, 100));
                            debug("[js::executeScript] Statement error: %O", stmtError);
                            throw stmtError;
                        }
                    }
                }
            }
            else {
                // Single statement or fallback to exec
                this.db.exec(script);
            }
            debug("[js::executeScript] Script completed successfully");
        }
        catch (e) {
            debug("[js::executeScript] Script failed: %O", e);
            this.onError(e);
        }
        return Promise.resolve();
    }
    async startTransaction(isolationLevel) {
        if (isolationLevel && isolationLevel !== "SERIALIZABLE") {
            throw new driver_adapter_utils_1.DriverAdapterError({
                kind: "InvalidIsolationLevel",
                level: isolationLevel,
            });
        }
        const options = { usePhantomQuery: false };
        debug("[js::startTransaction] options: %O", options);
        const release = await this[LOCK_TAG].acquire();
        try {
            this.db.query("BEGIN").run();
            return new BunSQLiteTransaction(this.db, options, release);
        }
        catch (e) {
            release();
            this.onError(e);
        }
    }
    dispose() {
        this.db.close();
        return Promise.resolve();
    }
}
exports.PrismaBunSQLiteAdapter = PrismaBunSQLiteAdapter;
class PrismaBunSQLiteAdapterFactory {
    config;
    provider = "sqlite";
    adapterName = package_json_1.name;
    constructor(config) {
        this.config = config;
    }
    connect() {
        return Promise.resolve(new PrismaBunSQLiteAdapter(createBunSqliteClient({ ...this.config })));
    }
    connectToShadowDb() {
        const url = (this.config.shadowDatabaseURL ?? ":memory:");
        return Promise.resolve(new PrismaBunSQLiteAdapter(createBunSqliteClient({ ...this.config, url })));
    }
}
exports.PrismaBunSQLiteAdapterFactory = PrismaBunSQLiteAdapterFactory;
function createBunSqliteClient(input) {
    const { url, walMode } = input;
    const filename = url.replace(/^file:/, '');
    const db = new bun_sqlite_1.Database(filename, { safeIntegers: true });
    // Configure WAL mode if enabled
    if (walMode) {
        try {
            configureWALMode(db, walMode);
        }
        catch (e) {
            db.close();
            throw new driver_adapter_utils_1.DriverAdapterError({
                kind: "GenericJs",
                id: 0,
                originalMessage: `Failed to configure WAL mode: ${e instanceof Error ? e.message : String(e)}`,
            });
        }
    }
    return db;
}
function configureWALMode(db, walConfig) {
    // Normalize config
    const config = typeof walConfig === 'boolean'
        ? { enabled: walConfig }
        : walConfig;
    if (!config.enabled) {
        return;
    }
    // Set journal mode to WAL
    const journalResult = db.query("PRAGMA journal_mode = WAL;").get();
    const currentMode = journalResult?.journal_mode?.toLowerCase();
    // Memory databases don't support WAL mode, silently ignore
    if (currentMode === 'memory') {
        debug("WAL mode not supported for in-memory database, skipping");
        return;
    }
    if (!journalResult || currentMode !== 'wal') {
        throw new Error(`Failed to enable WAL mode. Current mode: ${currentMode || 'unknown'}`);
    }
    debug("WAL mode enabled successfully");
    // Configure synchronous mode if specified
    if (config.synchronous) {
        db.exec(`PRAGMA synchronous = ${config.synchronous};`);
        debug(`WAL synchronous mode set to: ${config.synchronous}`);
    }
    // Configure WAL autocheckpoint if specified
    if (config.walAutocheckpoint !== undefined) {
        db.exec(`PRAGMA wal_autocheckpoint = ${config.walAutocheckpoint};`);
        debug(`WAL autocheckpoint set to: ${config.walAutocheckpoint}`);
    }
    // Configure busy timeout if specified
    if (config.busyTimeout !== undefined) {
        db.exec(`PRAGMA busy_timeout = ${config.busyTimeout};`);
        debug(`Busy timeout set to: ${config.busyTimeout}ms`);
    }
}
//# sourceMappingURL=adapter.js.map