import type {
  ApiRequest,
  CollectionNode,
  Environment,
  FolderNode,
  KeyValueRow,
  RequestBody,
  RequestTab,
  WorkspaceModel
} from "./types";

export function createId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${random.replace(/-/g, "").slice(0, 16)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createKeyValueRow(key = "", value = "", enabled = true): KeyValueRow {
  return {
    id: createId("row"),
    key,
    value,
    enabled
  };
}

export function createRequestBody(type: RequestBody["type"] = "json"): RequestBody {
  return {
    type,
    raw: type === "json" ? "{\n  \n}" : "",
    formData: [createKeyValueRow()],
    urlencoded: [createKeyValueRow()],
    binary: null
  };
}

export function createEmptyRequest(name = "Untitled Request", method: ApiRequest["method"] = "GET"): ApiRequest {
  const timestamp = nowIso();

  return {
    id: createId("req"),
    name,
    type: "rest",
    method,
    url: "",
    queryParams: [createKeyValueRow()],
    headers: [createKeyValueRow("Accept", "application/json")],
    body: createRequestBody(method === "GET" ? "none" : "json"),
    auth: { type: "none" },
    tests: [],
    postmanEvents: [],
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createRequestTab(request = createEmptyRequest()): RequestTab {
  return {
    id: createId("tab"),
    title: request.name,
    sourceRequestId: request.id,
    draft: clone(request),
    dirty: false,
    response: null
  };
}

export function createEnvironment(name: string, type: Environment["type"]): Environment {
  return {
    id: createId("env"),
    name,
    type,
    variables: [createKeyValueRow("baseUrl", "https://jsonplaceholder.typicode.com")]
  };
}

export function createStarterWorkspace(): WorkspaceModel {
  const createdAt = nowIso();
  const sampleRequest: ApiRequest = {
    ...createEmptyRequest("List posts", "GET"),
    url: "{{baseUrl}}/posts",
    queryParams: [createKeyValueRow("_limit", "5")],
    tests: [
      {
        id: createId("chain"),
        enabled: true,
        name: "Capture first post id",
        path: "$.0.id",
        variableName: "lastPostId"
      }
    ]
  };

  const createPost: ApiRequest = {
    ...createEmptyRequest("Create post", "POST"),
    url: "{{baseUrl}}/posts",
    body: {
      ...createRequestBody("json"),
      raw: "{\n  \"title\": \"{{randomName}}\",\n  \"body\": \"Created at {{timestamp}}\",\n  \"userId\": {{randomInt(1,10)}}\n}"
    }
  };

  const collection: CollectionNode = {
    id: createId("col"),
    name: "Starter Collection",
    variables: [createKeyValueRow("collectionName", "Starter Collection")],
    folders: [
      {
        id: createId("fld"),
        collectionId: "starter",
        parentId: null,
        name: "JSONPlaceholder",
        folders: [],
        requests: [sampleRequest, createPost]
      }
    ],
    requests: [],
    createdAt
  };

  collection.folders[0].collectionId = collection.id;

  const env = createEnvironment("Local", "local");
  const activeTab = createRequestTab(sampleRequest);

  return {
    collections: [collection],
    environments: [env],
    activeEnvironmentId: env.id,
    tabs: [activeTab],
    activeTabId: activeTab.id,
    history: [],
    sidebarView: "collections"
  };
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function enabledRows(rows: KeyValueRow[]): KeyValueRow[] {
  return rows.filter((row) => row.enabled && row.key.trim().length > 0);
}

export function rowsToRecord(rows: KeyValueRow[]): Record<string, string> {
  return Object.fromEntries(enabledRows(rows).map((row) => [row.key.trim(), row.value]));
}

export function recordToRows(record: Record<string, unknown> | undefined): KeyValueRow[] {
  if (!record) {
    return [createKeyValueRow()];
  }

  const rows = Object.entries(record).map(([key, value]) => createKeyValueRow(key, String(value ?? "")));
  return rows.length > 0 ? rows : [createKeyValueRow()];
}

export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function tryFormatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function findRequest(collections: CollectionNode[], requestId: string): ApiRequest | null {
  for (const collection of collections) {
    const direct = collection.requests.find((request) => request.id === requestId);
    if (direct) {
      return direct;
    }

    const nested = findRequestInFolders(collection.folders, requestId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function upsertRequest(collections: CollectionNode[], request: ApiRequest): CollectionNode[] {
  const next = clone(collections);

  for (const collection of next) {
    const index = collection.requests.findIndex((item) => item.id === request.id);
    if (index >= 0) {
      collection.requests[index] = { ...request, updatedAt: nowIso() };
      return next;
    }

    if (upsertRequestInFolders(collection.folders, request)) {
      return next;
    }
  }

  if (next.length === 0) {
    next.push({
      id: createId("col"),
      name: "My Collection",
      variables: [],
      folders: [],
      requests: [],
      createdAt: nowIso()
    });
  }

  next[0].requests.push({ ...request, updatedAt: nowIso() });
  return next;
}

function findRequestInFolders(folders: FolderNode[], requestId: string): ApiRequest | null {
  for (const folder of folders) {
    const direct = folder.requests.find((request) => request.id === requestId);
    if (direct) {
      return direct;
    }

    const nested = findRequestInFolders(folder.folders, requestId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function upsertRequestInFolders(folders: FolderNode[], request: ApiRequest): boolean {
  for (const folder of folders) {
    const index = folder.requests.findIndex((item) => item.id === request.id);
    if (index >= 0) {
      folder.requests[index] = { ...request, updatedAt: nowIso() };
      return true;
    }

    if (upsertRequestInFolders(folder.folders, request)) {
      return true;
    }
  }

  return false;
}
