import mysql from "mysql2/promise";
import { MySqlConfig } from "./mysql.config";

/**
 * Represents a MongoDB data source.
 */
export class MySqlSource {
  /**
   * Creates a new MySqlSource instance and establishes a connection to the MySQL server.
   * @param {MySqlConfig} config - The configuration object for the MySQL connection.
   * @returns {Promise<mysql.Connection>} A promise that resolves to a new Connection instance.
   */
  public static async create(config: MySqlConfig): Promise<mysql.Connection> {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      database: "test",
      // port: 3306,
      // password: '',
    });

    return connection;
  }
}
