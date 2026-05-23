export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestType = "rest" | "graphql" | "websocket" | "grpc";

export type BodyType = "none" | "json" | "text" | "xml" | "form-data" | "urlencoded" | "binary";

export type EnvironmentType = "local" | "dev" | "staging" | "production";

export type SidebarView = "collections" | "history" | "environments" | "favorites";

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface BinaryBody {
  name: string;
  mediaType: string;
  size: number;
  dataUrl: string;
}

export interface RequestBody {
  type: BodyType;
  raw: string;
  formData: KeyValueRow[];
  urlencoded: KeyValueRow[];
  binary: BinaryBody | null;
}

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "apiKey"; key: string; value: string; target: "header" | "query" }
  | { type: "oauth2"; accessToken: string };

export interface ResponseChainRule {
  id: string;
  enabled: boolean;
  name: string;
  path: string;
  variableName: string;
}

export interface PostmanEvent {
  listen: string;
  script?: {
    type?: string;
    exec?: string[];
  };
}

export interface ApiRequest {
  id: string;
  name: string;
  type: RequestType;
  method: HttpMethod;
  url: string;
  queryParams: KeyValueRow[];
  headers: KeyValueRow[];
  body: RequestBody;
  auth: AuthConfig;
  tests: ResponseChainRule[];
  postmanEvents: PostmanEvent[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode {
  id: string;
  collectionId: string;
  parentId: string | null;
  name: string;
  folders: FolderNode[];
  requests: ApiRequest[];
}

export interface CollectionNode {
  id: string;
  name: string;
  variables: KeyValueRow[];
  folders: FolderNode[];
  requests: ApiRequest[];
  createdAt: string;
}

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  variables: KeyValueRow[];
}

export interface ResponseSnapshot {
  status: number;
  statusText: string;
  headers: KeyValueRow[];
  body: string;
  timeMs: number;
  sizeBytes: number;
  contentType: string;
  receivedAt: string;
}

export interface HistoryEntry {
  id: string;
  requestId: string | null;
  requestName: string;
  method: HttpMethod;
  url: string;
  status: number | null;
  timeMs: number | null;
  sizeBytes: number | null;
  createdAt: string;
  requestSnapshot: ApiRequest;
  responseSnapshot: ResponseSnapshot | null;
}

export interface RequestTab {
  id: string;
  title: string;
  sourceRequestId: string | null;
  draft: ApiRequest;
  dirty: boolean;
  response: ResponseSnapshot | null;
}

export interface WorkspaceModel {
  collections: CollectionNode[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  tabs: RequestTab[];
  activeTabId: string | null;
  history: HistoryEntry[];
  sidebarView: SidebarView;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface VariableScope {
  name: string;
  values: Record<string, string>;
}

export interface ResolvedVariables {
  source: string;
  value: string;
}
