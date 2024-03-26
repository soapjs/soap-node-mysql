import { ConfigVars } from "@soapjs/soap";

export class MySqlConfig {
  /**
   * Builds a MySQL configuration object based on the provided configuration variables.
   *
   * @param {ConfigVars} configVars - The configuration variables object.
   * @param {string} [prefix=''] - The prefix to prepend to the configuration variable names.
   * @returns {MySqlConfig} The MySQL configuration object.
   */
  static create(configVars: ConfigVars, prefix = "") {
    const p = prefix
      ? prefix.endsWith("_")
        ? prefix.toUpperCase()
        : prefix.toUpperCase() + "_"
      : "";

    return new MySqlConfig(
      configVars.getStringEnv(`${p}MYSQL_DB_NAME`),
      configVars.getArrayEnv(`${p}MYSQL_HOSTS`),
      configVars.getArrayEnv(`${p}MYSQL_PORTS`),
      configVars.getStringEnv(`${p}MYSQL_USER`),
      configVars.getStringEnv(`${p}MYSQL_PASSWORD`),
      configVars.getBooleanEnv(`${p}MYSQL_SSL`),
      configVars.getNumberEnv(`${p}MYSQL_CONNECTION_LIMIT`),
      configVars.getNumberEnv(`${p}MYSQL_CONNECT_TIMEOUT`),
      configVars.getBooleanEnv(`${p}MYSQL_WAIT_FOR_CONNECTIONS`),
      configVars.getStringEnv(`${p}MYSQL_CHARSET`),
      configVars.getStringEnv(`${p}MYSQL_TIMEZONE`)
    );
  }
  constructor(
    public readonly database: string,
    public readonly hosts: string[],
    public readonly ports?: string[],
    public readonly user?: string,
    public readonly password?: string,
    public readonly ssl?: boolean,
    public readonly connectionLimit?: number,
    public readonly connectTimeout?: number,
    public readonly waitForConnections?: boolean,
    public readonly charset?: string,
    public readonly timezone?: string
  ) {}
}

export class MySqlModuleVersion {
  static create(version: string) {
    const [major, minor, patch] = version.split(".");
    return new MySqlModuleVersion(version, +major, +minor, +patch);
  }

  private constructor(
    private version: string,
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number
  ) {}

  toString() {
    return this.version;
  }
}
