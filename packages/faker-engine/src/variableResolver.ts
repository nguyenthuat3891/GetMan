import { faker } from "@faker-js/faker";
import type { KeyValueRow, VariableScope } from "@core/types";
import { enabledRows } from "@core/utils";

export interface VariableResolutionOptions {
  scopes: VariableScope[];
}

export interface VariableResolutionResult {
  value: string;
  unresolved: string[];
}

const TOKEN_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function rowsToScope(name: string, rows: KeyValueRow[]): VariableScope {
  return {
    name,
    values: Object.fromEntries(enabledRows(rows).map((row) => [row.key.trim(), row.value]))
  };
}

export function resolveVariables(input: string, options: VariableResolutionOptions): VariableResolutionResult {
  const unresolved = new Set<string>();

  const envResolved = input.replace(TOKEN_PATTERN, (match, token: string) => {
    const value = lookupScopedValue(token.trim(), options.scopes);
    if (value === undefined) {
      return match;
    }

    return value;
  });

  const dynamicResolved = envResolved.replace(TOKEN_PATTERN, (match, token: string) => {
    const value = resolveDynamicToken(token.trim());
    if (value === undefined) {
      unresolved.add(token.trim());
      return match;
    }

    return value;
  });

  return {
    value: dynamicResolved,
    unresolved: [...unresolved]
  };
}

export function resolveUnknown(value: unknown, options: VariableResolutionOptions): unknown {
  if (typeof value === "string") {
    return resolveVariables(value, options).value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveUnknown(item, options));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, resolveUnknown(entry, options)])
    );
  }

  return value;
}

function lookupScopedValue(token: string, scopes: VariableScope[]): string | undefined {
  for (const scope of scopes) {
    if (Object.prototype.hasOwnProperty.call(scope.values, token)) {
      return scope.values[token];
    }
  }

  return undefined;
}

function resolveDynamicToken(token: string): string | undefined {
  if (token === "uuid") {
    return crypto.randomUUID();
  }

  if (token === "timestamp") {
    return String(Date.now());
  }

  if (token === "randomEmail") {
    return faker.internet.email();
  }

  if (token === "randomPhone") {
    return faker.phone.number();
  }

  if (token === "randomName") {
    return faker.person.fullName();
  }

  const randomIntMatch = token.match(/^randomInt\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
  if (randomIntMatch) {
    const min = Number(randomIntMatch[1]);
    const max = Number(randomIntMatch[2]);
    return String(faker.number.int({ min, max }));
  }

  if (token.startsWith("faker.")) {
    return resolveFakerToken(token);
  }

  return undefined;
}

function resolveFakerToken(token: string): string | undefined {
  const path = token.slice("faker.".length).split(".");
  let cursor: unknown = faker;

  for (const part of path) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[part];
  }

  if (typeof cursor !== "function") {
    return undefined;
  }

  const value = cursor.call(resolveFakerContext(path));
  return String(value);
}

function resolveFakerContext(path: string[]): unknown {
  let cursor: unknown = faker;

  for (const part of path.slice(0, -1)) {
    if (!cursor || typeof cursor !== "object") {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[part];
  }

  return cursor;
}
