import type { ApiRequest, AuthConfig } from "@core/types";

interface AuthPanelProps {
  request: ApiRequest;
  onChange: (request: ApiRequest) => void;
}

type AuthType = AuthConfig["type"];

export function AuthPanel({ request, onChange }: AuthPanelProps) {
  const setAuth = (auth: AuthConfig) => {
    onChange({ ...request, auth });
  };

  const updateAuth = (patch: Partial<AuthConfig>) => {
    setAuth({ ...request.auth, ...patch } as AuthConfig);
  };

  const onTypeChange = (type: AuthType) => {
    if (type === "none") {
      setAuth({ type: "none" });
    }
    if (type === "bearer") {
      setAuth({ type: "bearer", token: "" });
    }
    if (type === "basic") {
      setAuth({ type: "basic", username: "", password: "" });
    }
    if (type === "apiKey") {
      setAuth({ type: "apiKey", key: "", value: "", target: "header" });
    }
    if (type === "oauth2") {
      setAuth({ type: "oauth2", accessToken: "" });
    }
  };

  return (
    <div className="auth-grid">
      <select
        className="auth-select"
        value={request.auth.type}
        onChange={(event) => onTypeChange(event.target.value as AuthType)}
        aria-label="Authentication type"
      >
        <option value="none">No Auth</option>
        <option value="bearer">Bearer Token</option>
        <option value="basic">Basic Auth</option>
        <option value="apiKey">API Key</option>
        <option value="oauth2">OAuth2</option>
      </select>

      {request.auth.type === "none" && <div className="empty-state">No auth.</div>}

      {request.auth.type === "bearer" && (
        <input
          className="form-control"
          value={request.auth.token}
          placeholder="{{token}}"
          onChange={(event) => updateAuth({ token: event.target.value })}
        />
      )}

      {request.auth.type === "basic" && (
        <div className="auth-fields">
          <input
            className="form-control"
            value={request.auth.username}
            placeholder="Username"
            onChange={(event) => updateAuth({ username: event.target.value })}
          />
          <input
            className="form-control"
            value={request.auth.password}
            placeholder="Password"
            type="password"
            onChange={(event) => updateAuth({ password: event.target.value })}
          />
        </div>
      )}

      {request.auth.type === "apiKey" && (
        <div className="auth-fields">
          <input
            className="form-control"
            value={request.auth.key}
            placeholder="Key"
            onChange={(event) => updateAuth({ key: event.target.value })}
          />
          <input
            className="form-control"
            value={request.auth.value}
            placeholder="Value"
            onChange={(event) => updateAuth({ value: event.target.value })}
          />
          <select
            className="auth-select"
            value={request.auth.target}
            onChange={(event) => updateAuth({ target: event.target.value as "header" | "query" })}
            aria-label="API key target"
          >
            <option value="header">Header</option>
            <option value="query">Query</option>
          </select>
        </div>
      )}

      {request.auth.type === "oauth2" && (
        <input
          className="form-control"
          value={request.auth.accessToken}
          placeholder="Access token"
          onChange={(event) => updateAuth({ accessToken: event.target.value })}
        />
      )}
    </div>
  );
}
