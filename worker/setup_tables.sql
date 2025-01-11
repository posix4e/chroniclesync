DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
  client_id TEXT PRIMARY KEY,
  last_sync DATETIME,
  data_size INTEGER
);
