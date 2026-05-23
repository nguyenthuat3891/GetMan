export function readJsonPath(source: unknown, path: string): unknown {
  const trimmed = path.trim();

  if (!trimmed || trimmed === "$") {
    return source;
  }

  const normalized = trimmed.startsWith("$.") ? trimmed.slice(2) : trimmed.replace(/^\$?\.?/, "");
  const parts = normalized
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  let cursor = source;
  for (const part of parts) {
    if (cursor === null || cursor === undefined) {
      return undefined;
    }

    if (Array.isArray(cursor)) {
      const index = Number(part);
      cursor = Number.isInteger(index) ? cursor[index] : undefined;
      continue;
    }

    if (typeof cursor === "object") {
      cursor = (cursor as Record<string, unknown>)[part];
      continue;
    }

    return undefined;
  }

  return cursor;
}
