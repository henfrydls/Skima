import type { IsolationLevel, SqlDriverAdapter, SqlMigrationAwareDriverAdapterFactory, SqlQuery, SqlQueryable, SqlResultSet, Transaction } from "@prisma/driver-adapter-utils";
import { Mutex } from "async-mutex";
import { Database } from "bun:sqlite";
declare const LOCK_TAG: unique symbol;
declare class BunSQLiteQueryable implements SqlQueryable {
    protected readonly db: Database;
    readonly provider = "sqlite";
    readonly adapterName: string;
    constructor(db: Database);
    queryRaw(query: SqlQuery): Promise<SqlResultSet>;
    executeRaw(query: SqlQuery): Promise<number>;
    private executeIO;
    private getTableFromQuery;
    private getColumnTypes;
    private performIO;
    protected onError(error: any): never;
}
export declare class PrismaBunSQLiteAdapter extends BunSQLiteQueryable implements SqlDriverAdapter {
    [LOCK_TAG]: Mutex;
    constructor(db: Database);
    executeScript(script: string): Promise<void>;
    startTransaction(isolationLevel?: IsolationLevel): Promise<Transaction>;
    dispose(): Promise<void>;
}
export type WALConfig = {
    enabled: boolean;
    synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
    walAutocheckpoint?: number;
    busyTimeout?: number;
};
type BunSQLiteFactoryParams = {
    url: ":memory:" | (string & {});
    shadowDatabaseURL?: ":memory:" | (string & {});
    walMode?: boolean | WALConfig;
};
export declare class PrismaBunSQLiteAdapterFactory implements SqlMigrationAwareDriverAdapterFactory {
    private readonly config;
    readonly provider = "sqlite";
    readonly adapterName: string;
    constructor(config: BunSQLiteFactoryParams);
    connect(): Promise<SqlDriverAdapter>;
    connectToShadowDb(): Promise<SqlDriverAdapter>;
}
export {};
//# sourceMappingURL=adapter.d.ts.map