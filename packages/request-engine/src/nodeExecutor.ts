import { fetch, FormData } from "undici";
import { byteLength, createKeyValueRow } from "@core/utils";
import type { ResponseSnapshot } from "@core/types";
import type { SerializableRequestPayload } from "./requestEngine";

export async function executeSerializableRequest(payload: SerializableRequestPayload): Promise<ResponseSnapshot> {
  const startedAt = performance.now();
  const response = await fetch(payload.url, buildUndiciInit(payload));
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

function buildUndiciInit(payload: SerializableRequestPayload): Parameters<typeof fetch>[1] {
  const init: Parameters<typeof fetch>[1] = {
    method: payload.method,
    headers: { ...payload.headers }
  };

  if (payload.body.kind === "none") {
    return init;
  }

  if (payload.body.kind === "form-data") {
    const form = new FormData();
    payload.body.values?.forEach((row) => form.append(row.key, row.value));
    deleteCaseInsensitive(init.headers as Record<string, string>, "Content-Type");
    init.body = form;
    return init;
  }

  if (payload.body.kind === "binary" && payload.body.binary) {
    init.body = dataUrlToBuffer(payload.body.binary.dataUrl);
    return init;
  }

  init.body = payload.body.value ?? "";
  return init;
}

function deleteCaseInsensitive(headers: Record<string, string>, key: string): void {
  const existing = Object.keys(headers).find((header) => header.toLowerCase() === key.toLowerCase());
  if (existing) {
    delete headers[existing];
  }
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}
