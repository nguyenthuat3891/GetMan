import type { WorkspaceModel } from "@core/types";
import { createStarterWorkspace } from "@core/utils";

const STORAGE_KEY = "getman.workspace.v1";

export async function loadWorkspace(): Promise<WorkspaceModel> {
  if (typeof window !== "undefined") {
    const bridge = (window as Window & StorageBridge).getman;
    if (bridge?.loadWorkspace) {
      const electronWorkspace = await bridge.loadWorkspace();
      if (electronWorkspace) {
        return normalizeWorkspace(electronWorkspace);
      }
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createStarterWorkspace();
  }

  try {
    return normalizeWorkspace(JSON.parse(raw) as WorkspaceModel);
  } catch {
    return createStarterWorkspace();
  }
}

export async function saveWorkspace(workspace: WorkspaceModel): Promise<void> {
  if (typeof window !== "undefined") {
    const bridge = (window as Window & StorageBridge).getman;
    if (bridge?.saveWorkspace) {
      await bridge.saveWorkspace(workspace);
      return;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

interface StorageBridge {
  getman?: {
    loadWorkspace?: () => Promise<WorkspaceModel | null>;
    saveWorkspace?: (workspace: WorkspaceModel) => Promise<void>;
  };
}

export function exportWorkspace(workspace: WorkspaceModel): string {
  return JSON.stringify(workspace, null, 2);
}

export function importWorkspace(raw: string): WorkspaceModel {
  return normalizeWorkspace(JSON.parse(raw) as WorkspaceModel);
}

function normalizeWorkspace(workspace: WorkspaceModel): WorkspaceModel {
  const starter = createStarterWorkspace();

  return {
    collections: workspace.collections ?? starter.collections,
    environments: workspace.environments ?? starter.environments,
    activeEnvironmentId: workspace.activeEnvironmentId ?? workspace.environments?.[0]?.id ?? starter.activeEnvironmentId,
    tabs: workspace.tabs?.length ? workspace.tabs : starter.tabs,
    activeTabId: workspace.activeTabId ?? workspace.tabs?.[0]?.id ?? starter.activeTabId,
    history: workspace.history ?? [],
    sidebarView: workspace.sidebarView ?? "collections"
  };
}
