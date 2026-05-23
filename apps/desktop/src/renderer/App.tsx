import { useEffect } from "react";
import { Add24Regular, Dismiss24Regular, Save24Regular, Send24Regular } from "@fluentui/react-icons";
import { Button, Spinner, Tooltip } from "@fluentui/react-components";
import { EnvironmentSelect } from "./components/EnvironmentSelect";
import { ImportExportBar } from "./components/ImportExportBar";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import { useWorkspaceStore } from "./store/workspaceStore";

export default function App() {
  const loaded = useWorkspaceStore((state) => state.loaded);
  const sending = useWorkspaceStore((state) => state.sending);
  const toast = useWorkspaceStore((state) => state.toast);
  const initialize = useWorkspaceStore((state) => state.initialize);
  const newRequest = useWorkspaceStore((state) => state.newRequest);
  const saveActiveRequest = useWorkspaceStore((state) => state.saveActiveRequest);
  const sendActiveRequest = useWorkspaceStore((state) => state.sendActiveRequest);
  const dismissToast = useWorkspaceStore((state) => state.dismissToast);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void sendActiveRequest();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveActiveRequest();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newRequest();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newRequest, saveActiveRequest, sendActiveRequest]);

  if (!loaded) {
    return (
      <div className="app-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div>
            <div className="brand-title">GetMan</div>
            <div className="brand-subtitle">API Client</div>
          </div>
        </div>

        <div className="topbar-actions">
          <Tooltip content="New request" relationship="label">
            <Button appearance="subtle" icon={<Add24Regular />} onClick={newRequest}>
              New
            </Button>
          </Tooltip>
          <Tooltip content="Save request" relationship="label">
            <Button appearance="subtle" icon={<Save24Regular />} onClick={saveActiveRequest}>
              Save
            </Button>
          </Tooltip>
          <Tooltip content="Send request" relationship="label">
            <Button appearance="primary" icon={<Send24Regular />} disabled={sending} onClick={() => void sendActiveRequest()}>
              {sending ? "Sending" : "Send"}
            </Button>
          </Tooltip>
          <EnvironmentSelect />
          <ImportExportBar />
        </div>
      </header>

      <ResizableWorkspace />

      {toast && (
        <div className={`toast toast-${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button type="button" className="icon-only" onClick={dismissToast} aria-label="Dismiss">
            <Dismiss24Regular />
          </button>
        </div>
      )}
    </div>
  );
}
