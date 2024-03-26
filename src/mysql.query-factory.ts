/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AggregationParams,
  CountParams,
  FindParams,
  Mapper,
  QueryFactory,
  RemoveParams,
  Where,
} from "@soapjs/soap";
import {
  MySqlAggregateParams,
  MySqlCountQueryParams,
  MySqlDeleteQueryParams,
  MySqlFindQueryParams,
  MySqlUpdateQueryParams,
  MySqlUpdateRow,
} from "./mysql.types";
import { MySqlWhereParser } from "./mysql.where.parser";

/**
 * Represents a MySql query factory for constructing various types of queries.
 */
export class MySqlQueryFactory implements QueryFactory {
  /**
   * Constructs a new instance of the MongoQueryBuilders class.
   *
   * If a Mapper instance is provided, it can be used to convert entity keys
   * and values into a format suitable for MySql. This can be especially useful
   * in situations where the case of keys or format of values in the original entity
   * doesn't match MySql's requirements.
   *
   * @param {Mapper} [mapper] - An optional Mapper instance for entity key and value conversion.
   */
  constructor(private mapper?: Mapper) {}

  /**
   * Builds a find query for MySql.
   * @param {FindParams} params - The parameters for the find query.
   * @returns {MongoFindQueryParams} The find query parameters.
   */
  public createFindQuery(params: FindParams): MySqlFindQueryParams {
    const { limit, offset, sort, where } = params;
    const result: MySqlFindQueryParams = {};

    if (where) {
      result.where = `WHERE ${MySqlWhereParser.parse(where.result).query}`;
    }

    if (sort && typeof sort === "object") {
      const sorts = Object.keys(sort)
        .reduce((acc, key) => {
          acc.push(`${key} ${sort[key] === -1 ? "DESC" : "ASC"}`);
          return acc;
        }, [])
        .join(", ");
      result.sort = `ORDER BY ${sorts}`;
    }

    if (Number.isFinite(limit) && Number.isFinite(offset)) {
      result.limit = `LIMIT ${offset}, ${limit}`;
    } else if (limit) {
      result.limit = `LIMIT ${limit}`;
    }

    return result;
  }

  /**
   * Builds a count query for MySql.
   * @param {CountParams} params - The parameters for the count query.
   * @returns {MySqlCountQueryParams} The count query parameters.
   */
  public createCountQuery(params: CountParams): MySqlCountQueryParams {
    return {
      where: `WHERE ${
        params.where ? MySqlWhereParser.parse(params.where.result).query : ""
      }`,
    };
  }

  /**
   * Builds an update query for MySql.
   * @template UpdateType - The type of the update operation.
   * @param {UpdateType[]} updates - The updates to be performed.
   * @param {Where[]} where - The conditions for updating documents.
   * @param {UpdateMethod[]} methods - The update methods for each update operation.
   * @returns {MySqlUpdateQueryParams} The update query parameters or bulk write operations.
   */
  public createUpdateQuery<UpdateType = unknown>(
    updates: UpdateType[],
    where: Where[]
  ): MySqlUpdateQueryParams {
    const rows: MySqlUpdateRow[] = [];
    const diff = updates.length - where.length;

    if (diff > 0) {
      const lastWhere = where.at(-1);
      for (let i = 0; i < diff; i++) {
        where.push(lastWhere);
      }
    }

    updates.forEach((update, i) => {
      const row = {
        keys: Object.keys(update).map((key) => `${key} = ?`),
        values: Object.values(update),
        where: MySqlWhereParser.parse(where[i].result).query,
      };
      rows.push(row);
    });

    return { updates: rows };
  }

  /**
   * Builds a remove query for MySql.
   * @param {RemoveParams} params - The parameters for the remove query.
   * @returns {MySqlDeleteQueryParams} The remove query parameters.
   */
  public createRemoveQuery(params: RemoveParams): MySqlDeleteQueryParams {
    if (params.where.result) {
      return {
        where: `WHERE ${MySqlWhereParser.parse(params.where.result).query}`,
      };
    }

    return { where: "" };
  }

  /**
   * Builds an aggregation query for MySql.
   * @param {AggregationParams} params - The parameters for the aggregation query.
   * @returns {MySqlAggregateParams} The aggregation query parameters.
   */
  public createAggregationQuery(
    params: AggregationParams
  ): MySqlAggregateParams {
    let select: string[] = [];
    const { sum, average, min, max, count } = params;

    if (sum) select.push(`SUM(${sum}) AS totalSum`);
    if (average) select.push(`AVG(${average}) AS average`);
    if (min) select.push(`MIN(${min}) AS min`);
    if (max) select.push(`MAX(${max}) AS max`);
    if (count) select.push(`COUNT(*) AS count`);

    return {
      pipeline: select.length ? select.join(", ") : "*",
      where: params.where ? `WHERE ${params.where}` : "",
      sort: params.sort ? `ORDER BY ${params.sort}` : "",
      groupBy: params.groupBy?.length
        ? `GROUP BY ${params.groupBy.join(", ")}`
        : "",
    };
  }
}
