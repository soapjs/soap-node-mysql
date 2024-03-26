export type MySqlFindQueryParams = {
  where?: string;
  limit?: string;
  sort?: string;
};

export type MySqlUpdateRow = { keys: string[]; values: any[]; where: string };

export type   MySqlUpdateQueryParams = {
  updates: MySqlUpdateRow[];
};

export type MySqlCountQueryParams = {
  where?: string;
};

export type MySqlDeleteQueryParams = {
  where: string;
};

export type MySqlInsertQueryParams<T = unknown> = {
  documents: T[];
};

export type MySqlAggregateParams = {
  pipeline: string;
  where?: string;
  groupBy?: string;
  sort?: string;
};