import { app, BrowserWindow, ipcMain } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkspaceModel } from "@core/types";
import { executeSerializableRequest } from "@request-engine/nodeExecutor";
import type { SerializableRequestPayload } from "@request-engine/requestEngine";
import { SQLiteRepository } from "@storage/sqliteRepository";

const currentDir = dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
let repository: SQLiteRepository | null = null;

function getRepository(): SQLiteRepository | null {
  if (repository) {
    return repository;
  }

  try {
    repository = new SQLiteRepository(join(app.getPath("userData"), "getman.sqlite"));
    return repository;
  } catch (error) {
    console.warn(
      "SQLite storage is unavailable. Run `npm.cmd run sqlite:rebuild` after installing dependencies, then restart Electron.",
      error
    );
    return null;
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#F8FAFC",
    title: "GetMan API Client",
    webPreferences: {
      preload: join(currentDir, "../preload/preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(join(currentDir, "../renderer/index.html"));
  }
}

ipcMain.handle("request:send", async (_event, payload: SerializableRequestPayload) => {
  return executeSerializableRequest(payload);
});

ipcMain.handle("workspace:load", () => {
  return getRepository()?.seedIfEmpty() ?? null;
});

ipcMain.handle("workspace:save", (_event, workspace: WorkspaceModel) => {
  getRepository()?.saveWorkspace(workspace);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
