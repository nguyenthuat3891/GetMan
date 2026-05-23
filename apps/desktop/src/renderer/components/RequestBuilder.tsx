import { useState } from "react";
import {
  Dismiss24Regular,
  Save24Regular,
  Send24Regular
} from "@fluentui/react-icons";
import { Button, Tooltip } from "@fluentui/react-components";
import type { ApiRequest, HttpMethod } from "@core/types";
import { AuthPanel } from "./AuthPanel";
import { BodyEditor } from "./BodyEditor";
import { KeyValueEditor } from "./KeyValueEditor";
import { ResponseChainEditor } from "./ResponseChainEditor";
import { useWorkspaceStore } from "../store/workspaceStore";

type EditorTab = "params" | "headers" | "body" | "auth" | "tests";

const editorTabs: Array<{ id: EditorTab; label: string }> = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "auth", label: "Auth" },
  { id: "tests", label: "Tests" }
];

const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function RequestBuilder() {
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>("params");
  const workspace = useWorkspaceStore((state) => state.workspace);
  const activeTab = useWorkspaceStore((state) => state.activeTab());
  const sending = useWorkspaceStore((state) => state.sending);
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const updateActiveDraft = useWorkspaceStore((state) => state.updateActiveDraft);
  const saveActiveRequest = useWorkspaceStore((state) => state.saveActiveRequest);
  const sendActiveRequest = useWorkspaceStore((state) => state.sendActiveRequest);

  if (!activeTab) {
    return (
      <section className="panel request-panel">
        <div className="empty-state">No active request.</div>
      </section>
    );
  }

  const request = activeTab.draft;
  const updateRequest = (updater: (request: ApiRequest) => ApiRequest) => updateActiveDraft(updater);
  const patchRequest = (patch: Partial<ApiRequest>) => updateRequest((draft) => ({ ...draft, ...patch }));

  return (
    <section className="panel request-panel">
      <div>
        <div className="request-tabs">
          {workspace.tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`request-tab ${tab.id === workspace.activeTabId ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.dirty && <span className="dirty-dot" />}
              <span className="truncate">{tab.title}</span>
              <span
                role="button"
                tabIndex={0}
                className="tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }
                }}
                aria-label={`Close ${tab.title}`}
              >
                <Dismiss24Regular />
              </span>
            </button>
          ))}
        </div>

        <div className="request-line">
          <select
            className="method-select"
            value={request.method}
            onChange={(event) => patchRequest({ method: event.target.value as HttpMethod })}
            aria-label="HTTP method"
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            className="form-control"
            value={request.url}
            placeholder="https://api.example.com/{{resource}}"
            onChange={(event) => patchRequest({ url: event.target.value })}
            aria-label="Request URL"
          />
          <div className="inline-actions">
            <Tooltip content="Save request" relationship="label">
              <Button appearance="subtle" icon={<Save24Regular />} onClick={saveActiveRequest} />
            </Tooltip>
            <Tooltip content="Send request" relationship="label">
              <Button
                appearance="primary"
                icon={<Send24Regular />}
                disabled={sending}
                onClick={() => void sendActiveRequest()}
              >
                {sending ? "Sending" : "Send"}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="editor-tabs">
          {editorTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`editor-tab ${activeEditorTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveEditorTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-pane">
          {activeEditorTab === "params" && (
            <KeyValueEditor
              rows={request.queryParams}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
              onChange={(queryParams) => patchRequest({ queryParams })}
            />
          )}

          {activeEditorTab === "headers" && (
            <KeyValueEditor
              rows={request.headers}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
              onChange={(headers) => patchRequest({ headers })}
            />
          )}

          {activeEditorTab === "body" && (
            <BodyEditor request={request} onChange={(nextRequest) => patchRequest(nextRequest)} />
          )}

          {activeEditorTab === "auth" && (
            <AuthPanel request={request} onChange={(nextRequest) => patchRequest(nextRequest)} />
          )}

          {activeEditorTab === "tests" && (
            <ResponseChainEditor rows={request.tests} onChange={(tests) => patchRequest({ tests })} />
          )}
        </div>
      </div>
    </section>
  );
}
