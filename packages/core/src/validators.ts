import type { ApiRequest, Environment, KeyValueRow, ValidationIssue, ValidationResult } from "./types";

export function validationResult(issues: ValidationIssue[] = []): ValidationResult {
  return {
    ok: issues.length === 0,
    issues
  };
}

export function validateRequest(request: ApiRequest): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!request.name.trim()) {
    issues.push({ path: "name", message: "Request name is required." });
  }

  if (!request.url.trim()) {
    issues.push({ path: "url", message: "URL is required." });
  }

  validateRows(request.headers, "headers", issues);
  validateRows(request.queryParams, "queryParams", issues);

  if (request.body.type === "json" && request.body.raw.trim()) {
    try {
      JSON.parse(request.body.raw);
    } catch {
      if (!request.body.raw.includes("{{")) {
        issues.push({ path: "body.raw", message: "JSON body is not valid." });
      }
    }
  }

  if (request.auth.type === "apiKey" && (!request.auth.key.trim() || !request.auth.value.trim())) {
    issues.push({ path: "auth.apiKey", message: "API key auth needs both key and value." });
  }

  return validationResult(issues);
}

export function validateEnvironment(environment: Environment): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!environment.name.trim()) {
    issues.push({ path: "name", message: "Environment name is required." });
  }

  validateRows(environment.variables, "variables", issues);
  return validationResult(issues);
}

export function validateImportJson(value: string): ValidationResult {
  try {
    JSON.parse(value);
    return validationResult();
  } catch {
    return validationResult([{ path: "json", message: "The selected file is not valid JSON." }]);
  }
}

function validateRows(rows: KeyValueRow[], prefix: string, issues: ValidationIssue[]): void {
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    if (!row.enabled || (!row.key.trim() && !row.value.trim())) {
      return;
    }

    if (!row.key.trim()) {
      issues.push({ path: `${prefix}.${index}.key`, message: "Key is required when the row is enabled." });
      return;
    }

    const key = row.key.trim().toLowerCase();
    if (seen.has(key)) {
      issues.push({ path: `${prefix}.${index}.key`, message: "Duplicate keys can create ambiguous requests." });
    }

    seen.add(key);
  });
}
