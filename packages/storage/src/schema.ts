export const sqliteSchema = `
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(collection_id) REFERENCES collections(id)
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  folder_id TEXT,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  headers TEXT NOT NULL,
  query_params TEXT NOT NULL,
  body TEXT NOT NULL,
  auth TEXT NOT NULL,
  tests TEXT NOT NULL,
  postman_events TEXT NOT NULL DEFAULT '[]',
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(collection_id) REFERENCES collections(id),
  FOREIGN KEY(folder_id) REFERENCES folders(id)
);

CREATE TABLE IF NOT EXISTS environments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  variables TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS histories (
  id TEXT PRIMARY KEY,
  request_snapshot TEXT NOT NULL,
  response_snapshot TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
