import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Copy24Regular, DocumentText24Regular } from "@fluentui/react-icons";
import { Button, Tooltip } from "@fluentui/react-components";
import { formatBytes, tryFormatJson } from "@core/utils";
import { useWorkspaceStore } from "../store/workspaceStore";

type ResponseTab = "body" | "headers" | "raw";

const responseTabs: Array<{ id: ResponseTab; label: string }> = [
  { id: "body", label: "Body" },
  { id: "headers", label: "Headers" },
  { id: "raw", label: "Raw" }
];

export function ResponseViewer() {
  const [activeResponseTab, setActiveResponseTab] = useState<ResponseTab>("body");
  const activeTab = useWorkspaceStore((state) => state.activeTab());
  const response = activeTab?.response ?? null;
  const body = response?.body ?? "";
  const prettyBody = useMemo(() => tryFormatJson(body), [body]);
  const language = response?.contentType.includes("json")
    ? "json"
    : response?.contentType.includes("xml")
      ? "xml"
      : "plaintext";

  return (
    <section className="panel response-panel">
      <div className="panel-header response-header">
        <div>
          <div className="panel-title response-title">Response</div>
          <div className="panel-subtitle">{response ? new Date(response.receivedAt).toLocaleTimeString() : "Idle"}</div>
        </div>

        <div className="response-meta">
          {response && (
            <>
            <span className={`status-badge ${statusClass(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="status-badge">{response.timeMs} ms</span>
            <span className="status-badge">{formatBytes(response.sizeBytes)}</span>
            <Tooltip content="Copy response body" relationship="label">
              <Button
                appearance="subtle"
                icon={<Copy24Regular />}
                onClick={() => void navigator.clipboard.writeText(response.body)}
              />
            </Tooltip>
            </>
          )}
        </div>
      </div>

      <div className="response-content">
        <div className="response-tabs">
          {responseTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`editor-tab ${activeResponseTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveResponseTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="response-body">
          {!response && (
            <div className="empty-state">
              <DocumentText24Regular />
              <span>No response yet.</span>
            </div>
          )}

          {response && activeResponseTab === "body" && (
            <div className="monaco-box response-monaco">
              <Editor
                height="100%"
                language={language}
                value={prettyBody}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true
                }}
              />
            </div>
          )}

          {response && activeResponseTab === "headers" && (
            <div className="headers-table">
              {response.headers.map((header) => (
                <div className="headers-row" key={header.id}>
                  <strong className="truncate">{header.key}</strong>
                  <span className="truncate">{header.value}</span>
                </div>
              ))}
            </div>
          )}

          {response && activeResponseTab === "raw" && (
            <div className="monaco-box response-monaco">
              <Editor
                height="100%"
                language="plaintext"
                value={body}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function statusClass(status: number): string {
  if (status >= 200 && status < 300) {
    return "status-success";
  }

  if (status >= 400) {
    return "status-danger";
  }

  return "status-warning";
}
