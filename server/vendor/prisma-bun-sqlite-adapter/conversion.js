"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColumnTypes = getColumnTypes;
exports.mapRow = mapRow;
exports.mapQueryArgs = mapQueryArgs;
const driver_adapter_utils_1 = require("@prisma/driver-adapter-utils");
const debug = (0, driver_adapter_utils_1.Debug)("prisma:driver-adapter:bun-sqlite:conversion");
// Mirrors sqlite/conversion.rs in quaint
function mapDeclType(declType) {
    if (declType === null) {
        return null;
    }
    // Normalize the type string by removing length specifiers and extra spaces
    const normalizedType = declType.toUpperCase().trim();
    // Handle types with length specifiers (e.g., VARCHAR(255), CHAR(10))
    const baseType = normalizedType.replace(/\([^)]*\)/, '').trim();
    switch (baseType) {
        case "":
            return null;
        case "DECIMAL":
            return driver_adapter_utils_1.ColumnTypeEnum.Numeric;
        case "FLOAT":
            return driver_adapter_utils_1.ColumnTypeEnum.Float;
        case "DOUBLE":
        case "DOUBLE PRECISION":
        case "NUMERIC":
        case "REAL":
            return driver_adapter_utils_1.ColumnTypeEnum.Double;
        case "TINYINT":
        case "TINYINT UNSIGNED":
        case "SMALLINT":
        case "SMALLINT UNSIGNED":
        case "MEDIUMINT":
        case "MEDIUMINT UNSIGNED":
        case "INT":
        case "INT UNSIGNED":
        case "INTEGER":
        case "INTEGER UNSIGNED":
        case "SERIAL":
        case "INT2":
            return driver_adapter_utils_1.ColumnTypeEnum.Int32;
        case "BIGINT":
        case "BIGINT UNSIGNED":
        case "UNSIGNED BIG INT":
        case "INT8":
            return driver_adapter_utils_1.ColumnTypeEnum.Int64;
        case "DATETIME":
        case "TIMESTAMP":
            return driver_adapter_utils_1.ColumnTypeEnum.DateTime;
        case "TIME":
            return driver_adapter_utils_1.ColumnTypeEnum.Time;
        case "DATE":
            return driver_adapter_utils_1.ColumnTypeEnum.Date;
        case "TEXT":
        case "CLOB":
        case "CHAR":
        case "CHARACTER":
        case "VARCHAR":
        case "VARYING CHARACTER":
        case "NCHAR":
        case "NATIVE CHARACTER":
        case "NVARCHAR":
            return driver_adapter_utils_1.ColumnTypeEnum.Text;
        case "BLOB":
            return driver_adapter_utils_1.ColumnTypeEnum.Bytes;
        case "BOOLEAN":
            return driver_adapter_utils_1.ColumnTypeEnum.Boolean;
        case "JSON":
        case "JSONB":
            return driver_adapter_utils_1.ColumnTypeEnum.Json;
        default:
            debug("unknown decltype:", declType);
            return null;
    }
}
function mapDeclaredColumnTypes(columnTypes) {
    const emptyIndices = new Set();
    const result = columnTypes.map((typeName, index) => {
        const mappedType = mapDeclType(typeName);
        if (mappedType === null) {
            emptyIndices.add(index);
        }
        return mappedType;
    });
    return [result, emptyIndices];
}
function getColumnTypes(declaredTypes, rows) {
    const [columnTypes, emptyIndices] = mapDeclaredColumnTypes(declaredTypes);
    if (emptyIndices.size === 0) {
        return columnTypes;
    }
    columnLoop: for (const columnIndex of emptyIndices) {
        // No declared column type in db schema, infer using first non-null value
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const candidateValue = rows[rowIndex][columnIndex];
            // Ensure candidateValue is strictly not null and not undefined before inferring.
            // While the Row type implies it won't be undefined, defensive check is good.
            if (candidateValue !== null && candidateValue !== undefined) {
                columnTypes[columnIndex] = inferColumnType(candidateValue);
                continue columnLoop;
            }
        }
        // No non-null value found for this column, fall back to Int32 to mimic what quaint does
        // This case should cover columns where all values are NULL, or unexpectedly undefined.
        columnTypes[columnIndex] = driver_adapter_utils_1.ColumnTypeEnum.Int32;
    }
    return columnTypes;
}
function inferColumnType(value) {
    switch (typeof value) {
        case "string":
            return driver_adapter_utils_1.ColumnTypeEnum.Text;
        case "bigint":
            return driver_adapter_utils_1.ColumnTypeEnum.Int64;
        case "boolean":
            return driver_adapter_utils_1.ColumnTypeEnum.Boolean;
        case "number":
            return driver_adapter_utils_1.ColumnTypeEnum.UnknownNumber;
        case "object":
            return inferObjectType(value);
        default:
            throw new UnexpectedTypeError(value);
    }
}
function inferObjectType(value) {
    // bun:sqlite returns blobs as Uint8Array
    if (value instanceof Uint8Array) {
        return driver_adapter_utils_1.ColumnTypeEnum.Bytes;
    }
    // The original code had a check for ArrayBuffer, but bun:sqlite consistently returns Uint8Array for BLOBs.
    // If ArrayBuffer is expected from other contexts, this check might still be useful,
    // but for direct bun:sqlite results, Uint8Array is the primary type.
    throw new UnexpectedTypeError(value);
}
class UnexpectedTypeError extends Error {
    name = "UnexpectedTypeError";
    constructor(value) {
        const type = typeof value;
        const repr = type === "object" ? JSON.stringify(value) : String(value);
        super(`unexpected value of type ${type}: ${repr}`);
    }
}
function mapRow(row, columnTypes) {
    // `Row` doesn't have map, so we copy the array once and modify it in-place
    // to avoid allocating and copying twice if we used `Array.from(row).map(...)`.
    const result = Array.from(row);
    for (let i = 0; i < result.length; i++) {
        const value = result[i];
        // Convert Uint8Array to arrays of bytes.
        // bun:sqlite returns blobs as Uint8Array.
        if (value instanceof Uint8Array) {
            result[i] = Array.from(value);
            continue;
        }
        // If an integer is required and the current number isn't one,
        // discard the fractional part.
        if (typeof value === "number" &&
            (columnTypes[i] === driver_adapter_utils_1.ColumnTypeEnum.Int32 ||
                columnTypes[i] === driver_adapter_utils_1.ColumnTypeEnum.Int64) &&
            !Number.isInteger(value)) {
            result[i] = Math.trunc(value);
            continue;
        }
        // Handle DateTime values - can be numeric timestamps or ISO strings
        if (columnTypes[i] === driver_adapter_utils_1.ColumnTypeEnum.DateTime) {
            if (["number", "bigint"].includes(typeof value)) {
                // Numeric timestamps (native quaint format)
                result[i] = new Date(Number(value)).toISOString();
                continue;
            }
            else if (typeof value === "string") {
                // ISO string format (SQLite default DATETIME format)
                // Handle various SQLite datetime formats:
                // - "2025-08-20 14:42:26" (DATETIME)
                // - "2025-08-20T14:42:26.556+00:00" (ISO format)
                // - "2025-08-20T14:42:26.556Z" (ISO format with Z)
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    result[i] = date.toISOString();
                }
                else {
                    // If it's not a valid date string, leave as is (shouldn't happen)
                    debug("Invalid datetime string:", value);
                    result[i] = value;
                }
                continue;
            }
        }
        // Convert bigint to string as we can only use JSON-encodable types here.
        if (typeof value === "bigint") {
            result[i] = value.toString();
            continue;
        }
    }
    return result;
}
function mapQueryArgs(args, argTypes) {
    return args.map((arg, i) => {
        // SKIMA PATCH: null guard first — upstream let null Int?/Float? args
        // fall into Number.parseInt(null) => NaN, which only landed as NULL by
        // an undocumented double coercion. The official adapter returns null
        // first; mirror that. (Hot path: Assessment.snapshotId is Int? null.)
        if (arg === null || arg === undefined) {
            return null;
        }
        const argType = argTypes[i];
        if (argType.scalarType === "int") {
            return Number.parseInt(arg);
        }
        if (argType.scalarType === "float" || argType.scalarType === "decimal") {
            return Number.parseFloat(arg);
        }
        if (typeof arg === "boolean") {
            return arg ? 1 : 0; // SQLite does not natively support booleans
        }
        // SKIMA PATCH: store DateTime as unix-epoch-ms INTEGER (the legacy Rust
        // engine dialect used by every existing v1.4.x database, and what our
        // better-sqlite3 adapter writes via timestampFormat 'unixepoch-ms').
        // Upstream wrote ISO text here, which would mix formats on disk.
        // Reads already accept both numeric and ISO values (see mapRow above).
        if (argType.scalarType === "datetime" && arg !== null && arg !== undefined) {
            const ms = arg instanceof Date ? arg.getTime() : new Date(arg).getTime();
            if (!Number.isNaN(ms))
                return ms;
        }
        if (arg instanceof Date) {
            return arg.getTime(); // SKIMA PATCH (same reason as above)
        }
        // bun:sqlite expects blobs as Uint8Array
        if (arg instanceof Uint8Array) {
            return arg;
        }
        // Convert ArrayBuffer to Uint8Array for blobs, as bun:sqlite works with Uint8Array
        if (arg instanceof ArrayBuffer) {
            return new Uint8Array(arg);
        }
        return arg;
    });
}

// SKIMA PATCH: extract the table name from a SELECT. Prisma's query compiler
// emits SCHEMA-QUALIFIED tables — FROM `main`.`Collaborator` — and upstream's
// regex captured the first identifier ("main"), so PRAGMA table_info(main)
// returned nothing, declaredTypes fell to null, and every DateTime read came
// back null (silent data loss in reads AND exports; caught in the
// v1.5.0-rc.4 install-over validation). Capture the full dotted identifier
// chain and keep the LAST segment (the actual table).
function getTableNameFromQuery(sql) {
    const match = sql.match(/\bFROM\s+((?:`[^`]+`|"[^"]+"|\w+)(?:\s*\.\s*(?:`[^`]+`|"[^"]+"|\w+))*)/i);
    if (!match)
        return null;
    const segments = match[1].split('.').map((s) => s.trim().replace(/^[`"]|[`"]$/g, ''));
    return segments[segments.length - 1] || null;
}
exports.getTableNameFromQuery = getTableNameFromQuery;
//# sourceMappingURL=conversion.js.map