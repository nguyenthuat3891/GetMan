import type { ApiRequest, KeyValueRow, ResponseSnapshot, VariableScope } from "@core/types";
import { byteLength, createKeyValueRow, enabledRows } from "@core/utils";
import { resolveVariables } from "@faker-engine/variableResolver";

export interface SerializableBody {
  kind: "none" | "raw" | "form-data" | "urlencoded" | "binary";
  value?: string;
  values?: Array<{ key: string; value: string }>;
  binary?: {
    name: string;
    mediaType: string;
    dataUrl: string;
  };
}

export interface SerializableRequestPayload {
  method: ApiRequest["method"];
  url: string;
  headers: Record<string, string>;
  body: SerializableBody;
}

export interface ExecuteRequestOptions {
  scopes: VariableScope[];
}

export async function executeApiRequest(
  request: ApiRequest,
  options: ExecuteRequestOptions
): Promise<ResponseSnapshot> {
  const payload = prepareSerializableRequest(request, options);

  if (typeof window !== "undefined") {
    const bridge = (window as Window & RequestBridge).getman;
    if (bridge?.sendRequest) {
      return bridge.sendRequest(payload);
    }
  }

  const startedAt = performance.now();
  const response = await fetch(payload.url, buildFetchInit(payload));
  const body = await response.text();
  const timeMs = Math.round(performance.now() - startedAt);

  return {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()].map(([key, value]) => createKeyValueRow(key, value)),
    body,
    timeMs,
    sizeBytes: byteLength(body),
    contentType: response.headers.get("content-type") ?? "",
    receivedAt: new Date().toISOString()
  };
}

interface RequestBridge {
  getman?: {
    sendRequest?: (payload: SerializableRequestPayload) => Promise<ResponseSnapshot>;
  };
}

export function prepareSerializableRequest(
  request: ApiRequest,
  options: ExecuteRequestOptions
): SerializableRequestPayload {
  const headers: Record<string, string> = {};

  for (const row of enabledRows(request.headers)) {
    const key = resolveVariables(row.key, options).value.trim();
    if (!key) {
      continue;
    }

    headers[key] = resolveVariables(row.value, options).value;
  }

  let url = resolveVariables(request.url, options).value.trim();
  const queryParams = enabledRows(request.queryParams).map((row) => ({
    key: resolveVariables(row.key, options).value,
    value: resolveVariables(row.value, options).value
  }));

  const authResult = applyAuth(url, headers, request, options);
  url = appendQueryParams(authResult.url, [...queryParams, ...authResult.queryParams]);

  return {
    method: request.method,
    url,
    headers,
    body: serializeBody(request, headers, options)
  };
}

function serializeBody(
  request: ApiRequest,
  headers: Record<string, string>,
  options: ExecuteRequestOptions
): SerializableBody {
  if (request.method === "GET" || request.body.type === "none") {
    return { kind: "none" };
  }

  if (request.body.type === "form-data") {
    return {
      kind: "form-data",
      values: enabledRows(request.body.formData).map((row) => ({
        key: resolveVariables(row.key, options).value,
        value: resolveVariables(row.value, options).value
      }))
    };
  }

  if (request.body.type === "urlencoded") {
    setHeaderIfMissing(headers, "Content-Type", "application/x-www-form-urlencoded");
    const params = new URLSearchParams();
    enabledRows(request.body.urlencoded).forEach((row) => {
      params.append(resolveVariables(row.key, options).value, resolveVariables(row.value, options).value);
    });

    return {
      kind: "urlencoded",
      value: params.toString()
    };
  }

  if (request.body.type === "binary" && request.body.binary) {
    setHeaderIfMissing(headers, "Content-Type", request.body.binary.mediaType || "application/octet-stream");
    return {
      kind: "binary",
      binary: {
        name: request.body.binary.name,
        mediaType: request.body.binary.mediaType,
        dataUrl: request.body.binary.dataUrl
      }
    };
  }

  if (request.body.type === "json") {
    setHeaderIfMissing(headers, "Content-Type", "application/json");
  }

  if (request.body.type === "xml") {
    setHeaderIfMissing(headers, "Content-Type", "application/xml");
  }

  if (request.body.type === "text") {
    setHeaderIfMissing(headers, "Content-Type", "text/plain");
  }

  return {
    kind: "raw",
    value: resolveVariables(request.body.raw, options).value
  };
}

function applyAuth(
  url: string,
  headers: Record<string, string>,
  request: ApiRequest,
  options: ExecuteRequestOptions
): { url: string; queryParams: Array<{ key: string; value: string }> } {
  const auth = request.auth;

  if (auth.type === "bearer") {
    setHeaderIfMissing(headers, "Authorization", `Bearer ${resolveVariables(auth.token, options).value}`);
  }

  if (auth.type === "oauth2") {
    setHeaderIfMissing(headers, "Authorization", `Bearer ${resolveVariables(auth.accessToken, options).value}`);
  }

  if (auth.type === "basic") {
    const username = resolveVariables(auth.username, options).value;
    const password = resolveVariables(auth.password, options).value;
    setHeaderIfMissing(headers, "Authorization", `Basic ${encodeBase64(`${username}:${password}`)}`);
  }

  if (auth.type === "apiKey") {
    const key = resolveVariables(auth.key, options).value;
    const value = resolveVariables(auth.value, options).value;

    if (auth.target === "header") {
      setHeaderIfMissing(headers, key, value);
      return { url, queryParams: [] };
    }

    return { url, queryParams: [{ key, value }] };
  }

  return { url, queryParams: [] };
}

function buildFetchInit(payload: SerializableRequestPayload): RequestInit {
  const init: RequestInit = {
    method: payload.method,
    headers: { ...payload.headers }
  };

  if (payload.body.kind === "none") {
    return init;
  }

  if (payload.body.kind === "form-data") {
    const formData = new FormData();
    payload.body.values?.forEach((row) => formData.append(row.key, row.value));
    deleteHeader(init.headers, "Content-Type");
    init.body = formData;
    return init;
  }

  if (payload.body.kind === "binary" && payload.body.binary) {
    init.body = dataUrlToBlob(payload.body.binary.dataUrl, payload.body.binary.mediaType);
    return init;
  }

  init.body = payload.body.value ?? "";
  return init;
}

function appendQueryParams(url: string, params: Array<{ key: string; value: string }>): string {
  const filtered = params.filter((param) => param.key.trim());
  if (filtered.length === 0) {
    return url;
  }

  try {
    const next = new URL(url);
    filtered.forEach((param) => next.searchParams.append(param.key, param.value));
    return next.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${filtered
      .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
      .join("&")}`;
  }
}

function setHeaderIfMissing(headers: Record<string, string>, key: string, value: string): void {
  const existing = Object.keys(headers).find((header) => header.toLowerCase() === key.toLowerCase());
  if (!existing) {
    headers[key] = value;
  }
}

function deleteHeader(headers: HeadersInit | undefined, key: string): void {
  if (!headers || Array.isArray(headers) || headers instanceof Headers) {
    return;
  }

  const existing = Object.keys(headers).find((header) => header.toLowerCase() === key.toLowerCase());
  if (existing) {
    delete headers[existing];
  }
}

function encodeBase64(value: string): string {
  if (typeof btoa === "function") {
    return btoa(value);
  }

  return Buffer.from(value).toString("base64");
}

function dataUrlToBlob(dataUrl: string, mediaType: string): Blob {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mediaType });
}
