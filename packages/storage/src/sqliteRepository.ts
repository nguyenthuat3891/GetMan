import { createRequire } from "node:module";
import type {
  ApiRequest,
  CollectionNode,
  Environment,
  FolderNode,
  HistoryEntry,
  RequestTab,
  WorkspaceModel
} from "@core/types";
import { createStarterWorkspace } from "@core/utils";
import { sqliteSchema } from "./schema";

const require = createRequire(import.meta.url);

interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  transaction<T extends unknown[]>(fn: (...args: T) => void): (...args: T) => void;
}

interface Statement {
  run(...args: unknown[]): unknown;
  get(...args: unknown[]): Record<string, unknown> | undefined;
  all(...args: unknown[]): Array<Record<string, unknown>>;
}

interface BetterSqlite3Factory {
  new (filePath: string): Database;
}

export class SQLiteRepository {
  private readonly db: Database;

  constructor(filePath: string) {
    const BetterSqlite3 = require("better-sqlite3") as BetterSqlite3Factory;
    this.db = new BetterSqlite3(filePath);
    this.db.exec(sqliteSchema);
  }

  loadWorkspace(): WorkspaceModel | null {
    const collections = this.loadCollections();
    const environments = this.db
      .prepare("SELECT id, name, type, variables FROM environments ORDER BY name")
      .all()
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        type: row.type as Environment["type"],
        variables: JSON.parse(String(row.variables))
      }));

    if (collections.length === 0 && environments.length === 0) {
      return null;
    }

    const tabs = readState<RequestTab[]>(this.db, "tabs", []);
    const activeTabId = readState<string | null>(this.db, "activeTabId", tabs[0]?.id ?? null);
    const activeEnvironmentId = readState<string | null>(
      this.db,
      "activeEnvironmentId",
      environments[0]?.id ?? null
    );
    const sidebarView = readState<WorkspaceModel["sidebarView"]>(this.db, "sidebarView", "collections");

    return {
      collections,
      environments,
      activeEnvironmentId,
      tabs,
      activeTabId,
      history: this.loadHistory(),
      sidebarView
    };
  }

  saveWorkspace(workspace: WorkspaceModel): void {
    const save = this.db.transaction((model: WorkspaceModel) => {
      this.db.prepare("DELETE FROM app_state").run();
      this.db.prepare("DELETE FROM histories").run();
      this.db.prepare("DELETE FROM requests").run();
      this.db.prepare("DELETE FROM folders").run();
      this.db.prepare("DELETE FROM collections").run();
      this.db.prepare("DELETE FROM environments").run();

      const insertCollection = this.db.prepare(
        "INSERT INTO collections (id, name, created_at) VALUES (?, ?, ?)"
      );
      const insertFolder = this.db.prepare(
        "INSERT INTO folders (id, collection_id, parent_id, name, sort_order) VALUES (?, ?, ?, ?, ?)"
      );
      const insertRequest = this.db.prepare(
        "INSERT INTO requests (id, collection_id, folder_id, method, url, name, headers, query_params, body, auth, tests, postman_events, favorite, created_at, updated_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const insertEnvironment = this.db.prepare(
        "INSERT INTO environments (id, name, type, variables) VALUES (?, ?, ?, ?)"
      );
      const insertHistory = this.db.prepare(
        "INSERT INTO histories (id, request_snapshot, response_snapshot, created_at) VALUES (?, ?, ?, ?)"
      );

      model.collections.forEach((collection) => {
        insertCollection.run(collection.id, collection.name, collection.createdAt);
        collection.requests.forEach((request, index) =>
          writeRequest(insertRequest, collection.id, null, request, index)
        );
        collection.folders.forEach((folder, index) =>
          writeFolder(insertFolder, insertRequest, collection.id, folder, index)
        );
      });

      model.environments.forEach((environment) => {
        insertEnvironment.run(environment.id, environment.name, environment.type, JSON.stringify(environment.variables));
      });

      model.history.slice(0, 200).forEach((history) => {
        insertHistory.run(
          history.id,
          JSON.stringify(history.requestSnapshot),
          history.responseSnapshot ? JSON.stringify(history.responseSnapshot) : null,
          history.createdAt
        );
      });

      writeState(this.db, "tabs", model.tabs);
      writeState(this.db, "activeTabId", model.activeTabId);
      writeState(this.db, "activeEnvironmentId", model.activeEnvironmentId);
      writeState(this.db, "sidebarView", model.sidebarView);
    });

    save(workspace);
  }

  seedIfEmpty(): WorkspaceModel {
    const current = this.loadWorkspace();
    if (current) {
      return current;
    }

    const starter = createStarterWorkspace();
    this.saveWorkspace(starter);
    return starter;
  }

  private loadCollections(): CollectionNode[] {
    const collectionRows = this.db.prepare("SELECT id, name, created_at FROM collections ORDER BY created_at").all();
    const folderRows = this.db
      .prepare("SELECT id, collection_id, parent_id, name FROM folders ORDER BY sort_order")
      .all();
    const requestRows = this.db
      .prepare("SELECT * FROM requests ORDER BY sort_order")
      .all();

    return collectionRows.map((row) => {
      const collectionId = String(row.id);
      const folders = buildFolders(folderRows, requestRows, collectionId, null);
      const requests = requestRows
        .filter((request) => request.collection_id === collectionId && request.folder_id === null)
        .map(readRequest);

      return {
        id: collectionId,
        name: String(row.name),
        variables: [],
        folders,
        requests,
        createdAt: String(row.created_at)
      };
    });
  }

  private loadHistory(): HistoryEntry[] {
    return this.db
      .prepare("SELECT id, request_snapshot, response_snapshot, created_at FROM histories ORDER BY created_at DESC LIMIT 200")
      .all()
      .map((row) => {
        const requestSnapshot = JSON.parse(String(row.request_snapshot)) as ApiRequest;
        const responseSnapshot = row.response_snapshot ? JSON.parse(String(row.response_snapshot)) : null;

        return {
          id: String(row.id),
          requestId: requestSnapshot.id,
          requestName: requestSnapshot.name,
          method: requestSnapshot.method,
          url: requestSnapshot.url,
          status: responseSnapshot?.status ?? null,
          timeMs: responseSnapshot?.timeMs ?? null,
          sizeBytes: responseSnapshot?.sizeBytes ?? null,
          createdAt: String(row.created_at),
          requestSnapshot,
          responseSnapshot
        };
      });
  }
}

function writeFolder(
  insertFolder: Statement,
  insertRequest: Statement,
  collectionId: string,
  folder: FolderNode,
  sortOrder: number
): void {
  insertFolder.run(folder.id, collectionId, folder.parentId, folder.name, sortOrder);
  folder.requests.forEach((request, index) => writeRequest(insertRequest, collectionId, folder.id, request, index));
  folder.folders.forEach((child, index) => writeFolder(insertFolder, insertRequest, collectionId, child, index));
}

function writeRequest(
  insertRequest: Statement,
  collectionId: string,
  folderId: string | null,
  request: ApiRequest,
  sortOrder: number
): void {
  insertRequest.run(
    request.id,
    collectionId,
    folderId,
    request.method,
    request.url,
    request.name,
    JSON.stringify(request.headers),
    JSON.stringify(request.queryParams),
    JSON.stringify(request.body),
    JSON.stringify(request.auth),
    JSON.stringify(request.tests),
    JSON.stringify(request.postmanEvents),
    request.favorite ? 1 : 0,
    request.createdAt,
    request.updatedAt,
    sortOrder
  );
}

function buildFolders(
  folderRows: Array<Record<string, unknown>>,
  requestRows: Array<Record<string, unknown>>,
  collectionId: string,
  parentId: string | null
): FolderNode[] {
  return folderRows
    .filter((row) => row.collection_id === collectionId && row.parent_id === parentId)
    .map((row) => {
      const folderId = String(row.id);

      return {
        id: folderId,
        collectionId,
        parentId,
        name: String(row.name),
        folders: buildFolders(folderRows, requestRows, collectionId, folderId),
        requests: requestRows
          .filter((request) => request.collection_id === collectionId && request.folder_id === folderId)
          .map(readRequest)
      };
    });
}

function readRequest(row: Record<string, unknown>): ApiRequest {
  return {
    id: String(row.id),
    name: String(row.name),
    type: "rest",
    method: row.method as ApiRequest["method"],
    url: String(row.url),
    queryParams: JSON.parse(String(row.query_params)),
    headers: JSON.parse(String(row.headers)),
    body: JSON.parse(String(row.body)),
    auth: JSON.parse(String(row.auth)),
    tests: JSON.parse(String(row.tests)),
    postmanEvents: row.postman_events ? JSON.parse(String(row.postman_events)) : [],
    favorite: Boolean(row.favorite),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function writeState(db: Database, key: string, value: unknown): void {
  db.prepare("INSERT INTO app_state (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

function readState<T>(db: Database, key: string, fallback: T): T {
  const row = db.prepare("SELECT value FROM app_state WHERE key = ?").get(key);
  if (!row) {
    return fallback;
  }

  return JSON.parse(String(row.value)) as T;
}
