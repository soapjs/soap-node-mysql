import {
  OperationStatus,
  Collection,
  CollectionError,
  RemoveStats,
  UpdateStats,
} from "@soapjs/soap";
import { Pool, ResultSetHeader } from "mysql2/promise";
import {
  MySqlUpdateQueryParams,
  MySqlDeleteQueryParams,
  MySqlFindQueryParams,
  MySqlInsertQueryParams,
  MySqlUpdateRow,
  MySqlCountQueryParams,
  MySqlAggregateParams,
} from "./mysql.types";

/**
 * Represents MySQL data source.
 * @class
 * @implements {Collection<T>}
 */
export class MySqlCollection<T> implements Collection<T> {
  protected pool: Pool;
  private __collectionName: string;

  /**
   * Constructs a new MySqlCollection.
   * @constructor
   * @param {Pool} pool - The MySQL pool connection.
   * @param {string} tableName - The name of the table.
   */
  constructor(pool: Pool, tableName: string) {
    this.pool = pool;
    this.__collectionName = tableName;
  }

  get collectionName() {
    return this.__collectionName;
  }

  /**
   * Executes a SELECT query on the table based on the provided query parameters.
   * @param {MySqlFindQueryParams | string} [query] - The query parameters or query string.
   * @returns {Promise<T[]>} - A promise that resolves to an array of found records.
   */
  public async find(query?: MySqlFindQueryParams | string): Promise<T[]> {
    try {
      let sql;
      if (typeof query === "string") {
        sql = query;
      } else {
        const parts = [`SELECT * FROM ${this.__collectionName}`];
        if (query?.where) {
          parts.push(query.where);
        }
        if (query?.sort) {
          parts.push(query.sort);
        }
        if (query?.limit) {
          parts.push(query.limit);
        }
        sql = parts.join(" ");
      }
      const [rows] = await this.pool.query(sql);
      return rows as T[];
    } catch (error) {
      throw CollectionError.createError(error);
    }
  }

  /**
   * Executes an INSERT query to add a new record to the table.
   * @param {T} query - The record(s) to insert / insert string.
   * @returns {Promise<T>} - A promise that resolves to the inserted record.
   */
  public async insert(query: MySqlInsertQueryParams | string): Promise<T[]> {
    try {
      if (typeof query === "string") {
        await this.pool.query<ResultSetHeader>(query);
        return [];
      }

      const columns = Object.keys(query[0]).join(", ");
      const placeholders = query.documents
        .map(
          () =>
            `(${Object.keys(query[0])
              .map(() => "?")
              .join(", ")})`
        )
        .join(", ");
      const values = query.documents.reduce((acc: T[], record: T) => {
        acc.push(...Object.values(record));
        return acc;
      }, []);
      const sql = `INSERT INTO ${this.__collectionName} (${columns}) VALUES ${placeholders}`;
      const [result] = await this.pool.query<ResultSetHeader>(sql, values);

      return query.documents.map((record, index) => ({
        ...(record as T),
        id: result.insertId + index,
      }));
    } catch (error) {
      throw CollectionError.createError(error);
    }
  }

  /**
   * Executes a DELETE query to remove records from the table based on the provided conditions.
   * @param {MySqlDeleteQueryParams | string} query - The conditions for deleting records.
   * @returns {Promise<RemoveStats>} - A promise that resolves to the count of deleted records.
   */
  public async remove(
    query?: MySqlDeleteQueryParams | string
  ): Promise<RemoveStats> {
    try {
      let sql;
      if (typeof query === "string") {
        sql = query;
      } else {
        const parts = [`DELETE FROM ${this.__collectionName}`];
        if (query?.where) {
          parts.push(query.where);
        }
        sql = parts.join(" ");
      }
      const [result] = await this.pool.query<ResultSetHeader>(sql);
      return {
        status: "ok",
        deletedCount: result.affectedRows,
      };
    } catch (error) {
      throw CollectionError.createError(error);
    }
  }

  private async updateMany(updates: MySqlUpdateRow[]): Promise<UpdateStats> {
    try {
      await this.pool.beginTransaction();
      const updatePromises = updates.map((row) =>
        this.pool.query<ResultSetHeader>(
          `UPDATE ${this.__collectionName} SET ${row.keys.join(", ")} ${
            row.where
          }`,
          row.values
        )
      );
      const results = await Promise.all(updatePromises);
      await this.pool.commit();
      const modifiedCount = results.reduce(
        (acc, [result]) => acc + result.affectedRows,
        0
      );
      return {
        status: OperationStatus.Success,
        modifiedCount,
      };
    } catch (error) {
      console.error("Error during batch update:", error);
      await this.pool.rollback();
      return {
        status: OperationStatus.Failure,
      };
    }
  }

  private async updateOne(updates: MySqlUpdateRow): Promise<UpdateStats> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        `UPDATE ${this.__collectionName} SET ${updates.keys.join(", ")} ${
          updates.where
        }`,
        updates.values
      );

      return {
        status: OperationStatus.Success,
        modifiedCount: result.affectedRows,
      };
    } catch (error) {
      return {
        status: OperationStatus.Failure,
      };
    }
  }

  /**
   * Executes an UPDATE query to modify records in the table based on the provided conditions and updates.
   * @param {T} updates - The updates to apply.
   * @param {string} conditions - The conditions for updating records.
   * @returns {Promise<number>} - A promise that resolves to the count of updated records.
   */
  public async update(
    query: MySqlUpdateQueryParams | string
  ): Promise<UpdateStats> {
    if (typeof query === "string") {
      try {
        const [result] = await this.pool.query<ResultSetHeader>(query);
        return {
          status: OperationStatus.Success,
          modifiedCount: result.affectedRows,
        };
      } catch (error) {
        throw CollectionError.createError(error);
      }
    }

    if (query.updates.length === 1) {
      return this.updateOne(query.updates[0]);
    }

    return this.updateMany(query.updates);
  }

  public async count(query?: MySqlCountQueryParams | string): Promise<number> {
    try {
      let sql;
      if (typeof query === "string") {
        sql = query;
      } else {
        const parts = [
          `SELECT COUNT(*) AS count FROM ${this.__collectionName}`,
        ];
        if (query?.where) {
          parts.push(query.where);
        }
        sql = parts.join(" ");
      }

      const [result] = await this.pool.query<ResultSetHeader>(sql);

      if (Number.isInteger(result[0]?.count)) {
        return result[0].count;
      }

      return Number.NaN;
    } catch (error) {
      throw CollectionError.createError(error);
    }
  }

  public async aggregate<T>(query: MySqlAggregateParams): Promise<T[]> {
    // TODO: Implement the correct method, this is a simplified version
    try {
      const sql = `SELECT ${query.pipeline} FROM ${this.__collectionName} ${query.where} ${query.groupBy} ${query.sort}`;
      const [rows] = await this.pool.query(sql);
      return rows as T[];
    } catch (error) {
      console.error("Error during MySQL aggregation:", error);
      throw CollectionError.createError(error);
    }
  }

  public async startTransaction(): Promise<void> {
    return this.pool.beginTransaction();
  }

  public async commitTransaction(): Promise<void> {
    return this.pool.commit();
  }

  public async rollbackTransaction(): Promise<void> {
    return this.pool.rollback();
  }
}
