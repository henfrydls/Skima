import { ArgType, ColumnType } from "@prisma/driver-adapter-utils";
type Value = null | string | number | bigint | boolean | Uint8Array;
export type Row = {
    /** Number of columns in this row.
     *
     * All rows in one {@link ResultSet} have the same number and names of columns.
     */
    length: number;
    /** Columns can be accessed like an array by numeric indexes. */
    [index: number]: Value;
};
export declare function getColumnTypes(declaredTypes: Array<string | null>, rows: Row[]): ColumnType[];
export declare function mapRow(row: Row, columnTypes: ColumnType[]): unknown[];
export declare function mapQueryArgs(args: unknown[], argTypes: ArgType[]): unknown[];
export {};
//# sourceMappingURL=conversion.d.ts.map