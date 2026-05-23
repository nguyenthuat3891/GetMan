import type {
  ApiRequest,
  AuthConfig,
  BodyType,
  CollectionNode,
  Environment,
  FolderNode,
  HttpMethod,
  KeyValueRow,
  PostmanEvent
} from "@core/types";
import { createEmptyRequest, createId, createKeyValueRow, nowIso } from "@core/utils";

const SCHEMA_URL = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";

type PostmanAuth = Record<string, unknown> | null | undefined;
type PostmanHeader = { key?: string; value?: string; disabled?: boolean; description?: string };
type PostmanVariable = { key?: string; value?: unknown; disabled?: boolean; type?: string };
type PostmanQuery = { key?: string; value?: string; disabled?: boolean; description?: string };

interface PostmanBody {
  mode?: string;
  raw?: string;
  formdata?: PostmanVariable[];
  urlencoded?: PostmanVariable[];
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanRequest {
  method?: string;
  url?: string | { raw?: string; query?: PostmanQuery[] };
  header?: PostmanHeader[];
  body?: PostmanBody;
  auth?: PostmanAuth;
}

interface PostmanItem {
  name?: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  event?: PostmanEvent[];
}

interface PostmanCollectionObject {
  info?: {
    name?: string;
    schema?: string;
    _postman_id?: string;
  };
  item?: PostmanItem[];
  variable?: PostmanVariable[];
}

interface PostmanEnvironmentObject {
  id?: string;
  name?: string;
  values?: PostmanVariable[];
}

export function importPostmanCollection(raw: string | PostmanCollectionObject): CollectionNode {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as PostmanCollectionObject) : raw;

  if (!isPostmanCollection21(parsed)) {
    throw new Error("The file is not a compatible Postman Collection v2.1 document.");
  }

  const collectionId = createId("col");
  const items = parsed.item ?? [];
  const requests: ApiRequest[] = [];
  const folders: FolderNode[] = [];

  for (const item of items) {
    if (item.item) {
      folders.push(importFolder(item, collectionId, null));
    } else if (item.request) {
      requests.push(importRequest(item));
    }
  }

  return {
    id: collectionId,
    name: parsed.info?.name ?? "Imported Collection",
    variables: importRows(parsed.variable),
    folders,
    requests,
    createdAt: nowIso()
  };
}

export function exportPostmanCollection(collection: CollectionNode): PostmanCollectionObject {
  return {
    info: {
      _postman_id: collection.id,
      name: collection.name,
      schema: SCHEMA_URL
    },
    item: [...collection.folders.map(exportFolder), ...collection.requests.map(exportRequestItem)],
    variable: collection.variables
      .filter((row) => row.key.trim())
      .map((row) => ({
        key: row.key,
        value: row.value,
        disabled: !row.enabled,
        type: "string"
      }))
  };
}

export function exportPostmanFolderAsCollection(folder: FolderNode): PostmanCollectionObject {
  return {
    info: {
      _postman_id: folder.id,
      name: folder.name,
      schema: SCHEMA_URL
    },
    item: [exportFolder(folder)],
    variable: []
  };
}

export function exportPostmanRequestAsCollection(request: ApiRequest): PostmanCollectionObject {
  return {
    info: {
      _postman_id: request.id,
      name: request.name,
      schema: SCHEMA_URL
    },
    item: [exportRequestItem(request)],
    variable: []
  };
}

export function importPostmanEnvironment(raw: string | PostmanEnvironmentObject): Environment {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as PostmanEnvironmentObject) : raw;

  return {
    id: parsed.id ?? createId("env"),
    name: parsed.name ?? "Imported Environment",
    type: "local",
    variables: importRows(parsed.values)
  };
}

export function exportPostmanEnvironment(environment: Environment): PostmanEnvironmentObject {
  return {
    id: environment.id,
    name: environment.name,
    values: environment.variables
      .filter((row) => row.key.trim())
      .map((row) => ({
        key: row.key,
        value: row.value,
        type: "text",
        disabled: !row.enabled
      }))
  };
}

function importFolder(item: PostmanItem, collectionId: string, parentId: string | null): FolderNode {
  const folderId = createId("fld");
  const folders: FolderNode[] = [];
  const requests: ApiRequest[] = [];

  for (const child of item.item ?? []) {
    if (child.item) {
      folders.push(importFolder(child, collectionId, folderId));
    } else if (child.request) {
      requests.push(importRequest(child));
    }
  }

  return {
    id: folderId,
    collectionId,
    parentId,
    name: item.name ?? "Folder",
    folders,
    requests
  };
}

function importRequest(item: PostmanItem): ApiRequest {
  const request = createEmptyRequest(item.name ?? "Imported Request", normalizeMethod(item.request?.method));
  const postmanRequest = item.request;

  if (!postmanRequest) {
    return request;
  }

  const url = normalizeUrl(postmanRequest.url);

  return {
    ...request,
    url: url.raw,
    queryParams: url.query,
    headers: importRows(postmanRequest.header),
    body: importBody(postmanRequest.body),
    auth: importAuth(postmanRequest.auth),
    postmanEvents: item.event ?? []
  };
}

function importBody(postmanBody: PostmanBody | undefined): ApiRequest["body"] {
  const mode = postmanBody?.mode;
  const rawLanguage = postmanBody?.options?.raw?.language?.toLowerCase();
  let type: BodyType = "none";

  if (mode === "raw") {
    type = rawLanguage === "xml" ? "xml" : rawLanguage === "text" ? "text" : "json";
  }

  if (mode === "formdata") {
    type = "form-data";
  }

  if (mode === "urlencoded") {
    type = "urlencoded";
  }

  if (mode === "file") {
    type = "binary";
  }

  return {
    type,
    raw: postmanBody?.raw ?? "",
    formData: importRows(postmanBody?.formdata),
    urlencoded: importRows(postmanBody?.urlencoded),
    binary: null
  };
}

function importAuth(auth: PostmanAuth): AuthConfig {
  if (!auth || typeof auth !== "object") {
    return { type: "none" };
  }

  const type = String(auth.type ?? "none");

  if (type === "bearer") {
    return { type: "bearer", token: valueFromAuthList(auth.bearer, "token") };
  }

  if (type === "basic") {
    return {
      type: "basic",
      username: valueFromAuthList(auth.basic, "username"),
      password: valueFromAuthList(auth.basic, "password")
    };
  }

  if (type === "apikey") {
    const target = valueFromAuthList(auth.apikey, "in") === "query" ? "query" : "header";
    return {
      type: "apiKey",
      key: valueFromAuthList(auth.apikey, "key"),
      value: valueFromAuthList(auth.apikey, "value"),
      target
    };
  }

  if (type === "oauth2") {
    return { type: "oauth2", accessToken: valueFromAuthList(auth.oauth2, "accessToken") };
  }

  return { type: "none" };
}

function exportFolder(folder: FolderNode): PostmanItem {
  return {
    name: folder.name,
    item: [...folder.folders.map(exportFolder), ...folder.requests.map(exportRequestItem)]
  };
}

function exportRequestItem(request: ApiRequest): PostmanItem {
  return {
    name: request.name,
    request: {
      method: request.method,
      url: {
        raw: request.url,
        query: request.queryParams
          .filter((row) => row.key.trim())
          .map((row) => ({
            key: row.key,
            value: row.value,
            disabled: !row.enabled,
            description: row.description
          }))
      },
      header: request.headers
        .filter((row) => row.key.trim())
        .map((row) => ({
          key: row.key,
          value: row.value,
          disabled: !row.enabled,
          description: row.description
        })),
      body: exportBody(request),
      auth: exportAuth(request.auth)
    },
    event: request.postmanEvents
  };
}

function exportBody(request: ApiRequest): PostmanBody | undefined {
  if (request.method === "GET" || request.body.type === "none") {
    return undefined;
  }

  if (request.body.type === "form-data") {
    return {
      mode: "formdata",
      formdata: exportVariables(request.body.formData)
    };
  }

  if (request.body.type === "urlencoded") {
    return {
      mode: "urlencoded",
      urlencoded: exportVariables(request.body.urlencoded)
    };
  }

  if (request.body.type === "binary") {
    return {
      mode: "file",
      raw: request.body.binary?.name ?? ""
    };
  }

  const language = request.body.type === "xml" ? "xml" : request.body.type === "text" ? "text" : "json";
  return {
    mode: "raw",
    raw: request.body.raw,
    options: {
      raw: {
        language
      }
    }
  };
}

function exportAuth(auth: AuthConfig): Record<string, unknown> | undefined {
  if (auth.type === "none") {
    return undefined;
  }

  if (auth.type === "bearer") {
    return {
      type: "bearer",
      bearer: [{ key: "token", value: auth.token, type: "string" }]
    };
  }

  if (auth.type === "basic") {
    return {
      type: "basic",
      basic: [
        { key: "username", value: auth.username, type: "string" },
        { key: "password", value: auth.password, type: "string" }
      ]
    };
  }

  if (auth.type === "apiKey") {
    return {
      type: "apikey",
      apikey: [
        { key: "key", value: auth.key, type: "string" },
        { key: "value", value: auth.value, type: "string" },
        { key: "in", value: auth.target, type: "string" }
      ]
    };
  }

  return {
    type: "oauth2",
    oauth2: [{ key: "accessToken", value: auth.accessToken, type: "string" }]
  };
}

function normalizeMethod(method: string | undefined): HttpMethod {
  const normalized = String(method ?? "GET").toUpperCase();
  return ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(normalized) ? (normalized as HttpMethod) : "GET";
}

function normalizeUrl(url: PostmanRequest["url"]): { raw: string; query: KeyValueRow[] } {
  if (typeof url === "string") {
    return { raw: url, query: [createKeyValueRow()] };
  }

  return {
    raw: url?.raw ?? "",
    query: importRows(url?.query)
  };
}

function importRows(rows: Array<PostmanHeader | PostmanVariable | PostmanQuery> | undefined): KeyValueRow[] {
  const next =
    rows?.map((row) =>
      createKeyValueRow(String(row.key ?? ""), String(row.value ?? ""), !Boolean(row.disabled))
    ) ?? [];

  return next.length > 0 ? next : [createKeyValueRow()];
}

function exportVariables(rows: KeyValueRow[]): PostmanVariable[] {
  return rows
    .filter((row) => row.key.trim())
    .map((row) => ({
      key: row.key,
      value: row.value,
      disabled: !row.enabled,
      type: "text"
    }));
}

function valueFromAuthList(value: unknown, key: string): string {
  if (!Array.isArray(value)) {
    return "";
  }

  const item = value.find((entry) => entry?.key === key);
  return String(item?.value ?? "");
}

function isPostmanCollection21(value: unknown): value is PostmanCollectionObject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const collection = value as PostmanCollectionObject;
  const schema = collection.info?.schema;

  if (schema && !schema.includes("/v2.1.0/")) {
    return false;
  }

  return Array.isArray(collection.item);
}
