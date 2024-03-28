import {
  WhereCondition,
  Condition,
  NestedCondition,
  WhereOperator,
  Where,
} from "@soapjs/soap";

export class MySqlWhereParser {
  static parse(data: Where | WhereCondition | null): {
    query: string;
    values: any[];
  } {
    if (!data) {
      return { query: "1=1", values: [] };
    }

    if (data instanceof Where) {
      return MySqlWhereParser.parse(data.result);
    }

    if ("left" in data) {
      return MySqlWhereParser.parseSimpleCondition(data);
    }

    if ("conditions" in data) {
      return MySqlWhereParser.parseNestedCondition(data);
    }

    throw new Error("Invalid condition format");
  }

  private static parseSimpleCondition(condition: Condition): {
    query: string;
    values: any[];
  } {
    const { left, operator, right } = condition;
    let sqlOperator = MySqlWhereParser.convertOperatorToSql(operator);
    let query = `${left} ${sqlOperator} ?`;
    let values = [right];

    return { query, values };
  }

  private static parseNestedCondition(nestedCondition: NestedCondition): {
    query: string;
    values: any[];
  } {
    const { conditions, operator } = nestedCondition;
    let sqlParts = [];
    let values = [];

    for (const condition of conditions) {
      let parsed = MySqlWhereParser.parse(condition);
      sqlParts.push(`(${parsed.query})`);
      values.push(...parsed.values);
    }

    let query = sqlParts.join(` ${operator.toUpperCase()} `);
    return { query, values };
  }

  private static convertOperatorToSql(operator: WhereOperator): string {
    switch (operator) {
      case "eq":
        return "=";
      case "ne":
        return "!=";
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "gte":
        return ">=";
      case "lte":
        return "<=";
      case "in":
        return "IN";
      case "nin":
        return "NOT IN";
      case "like":
        return "LIKE";
      default:
        throw new Error(`Unsupported operator ${operator}`);
    }
  }
}
