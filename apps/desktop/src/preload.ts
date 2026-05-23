import { contextBridge, ipcRenderer } from "electron";
import type { WorkspaceModel } from "@core/types";
import type { SerializableRequestPayload } from "@request-engine/requestEngine";

contextBridge.exposeInMainWorld("getman", {
  platform: "electron",
  sendRequest: (payload: SerializableRequestPayload) => ipcRenderer.invoke("request:send", payload),
  loadWorkspace: () => ipcRenderer.invoke("workspace:load") as Promise<WorkspaceModel | null>,
  saveWorkspace: (workspace: WorkspaceModel) => ipcRenderer.invoke("workspace:save", workspace)
});
