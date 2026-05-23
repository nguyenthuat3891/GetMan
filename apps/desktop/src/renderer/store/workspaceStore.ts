import { create } from "zustand";
import { readJsonPath } from "@core/jsonPath";
import type {
  ApiRequest,
  CollectionNode,
  Environment,
  HistoryEntry,
  KeyValueRow,
  RequestTab,
  ResponseSnapshot,
  SidebarView,
  VariableScope,
  WorkspaceModel
} from "@core/types";
import {
  clone,
  createEmptyRequest,
  createEnvironment,
  createId,
  createKeyValueRow,
  createRequestTab,
  createStarterWorkspace,
  enabledRows,
  findRequest,
  nowIso,
  upsertRequest
} from "@core/utils";
import { validateRequest } from "@core/validators";
import { rowsToScope } from "@faker-engine/variableResolver";
import { executeApiRequest } from "@request-engine/requestEngine";
import {
  exportPostmanFolderAsCollection,
  exportPostmanCollection,
  exportPostmanEnvironment,
  exportPostmanRequestAsCollection,
  importPostmanCollection,
  importPostmanEnvironment
} from "@postman/postmanCollection";
import {
  exportWorkspace,
  importWorkspace,
  loadWorkspace,
  saveWorkspace
} from "@storage/localStorageRepository";

interface ToastState {
  tone: "info" | "success" | "danger";
  message: string;
}

interface WorkspaceStore {
  workspace: WorkspaceModel;
  loaded: boolean;
  sending: boolean;
  toast: ToastState | null;
  initialize: () => Promise<void>;
  activeTab: () => RequestTab | null;
  activeEnvironment: () => Environment | null;
  activeScopes: () => VariableScope[];
  setSidebarView: (view: SidebarView) => void;
  setActiveEnvironment: (environmentId: string) => void;
  addEnvironment: () => void;
  updateEnvironment: (environmentId: string, patch: Partial<Environment>) => void;
  updateEnvironmentRows: (environmentId: string, rows: KeyValueRow[]) => void;
  newRequest: () => void;
  openRequest: (request: ApiRequest) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateActiveDraft: (updater: (draft: ApiRequest) => ApiRequest) => void;
  saveActiveRequest: () => void;
  sendActiveRequest: () => Promise<void>;
  toggleFavorite: (requestId: string) => void;
  addCollection: () => void;
  renameCollection: (collectionId: string, name: string) => void;
  addFolder: (collectionId: string, parentId: string | null) => void;
  renameFolder: (folderId: string, name: string) => void;
  renameRequest: (requestId: string, name: string) => void;
  duplicateCollection: (collectionId: string) => void;
  duplicateFolder: (folderId: string) => void;
  duplicateRequest: (requestId: string) => void;
  deleteCollection: (collectionId: string) => void;
  deleteFolder: (folderId: string) => void;
  deleteRequest: (requestId: string) => void;
  importPostmanCollectionFile: (raw: string) => void;
  importPostmanEnvironmentFile: (raw: string) => void;
  importWorkspaceFile: (raw: string) => void;
  exportWorkspaceFile: () => string;
  exportCollectionFile: (collectionId: string) => string;
  exportFolderFile: (folderId: string) => string;
  exportRequestFile: (requestId: string) => string;
  exportEnvironmentFile: (environmentId: string) => string;
  restoreHistoryEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  dismissToast: () => void;
}

const starterWorkspace = createStarterWorkspace();

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: starterWorkspace,
  loaded: false,
  sending: false,
  toast: null,

  initialize: async () => {
    const workspace = await loadWorkspace();
    set({ workspace, loaded: true });
  },

  activeTab: () => {
    const { workspace } = get();
    return workspace.tabs.find((tab) => tab.id === workspace.activeTabId) ?? null;
  },

  activeEnvironment: () => {
    const { workspace } = get();
    return workspace.environments.find((environment) => environment.id === workspace.activeEnvironmentId) ?? null;
  },

  activeScopes: () => {
    const { workspace } = get();
    const tab = get().activeTab();
    const scopes: VariableScope[] = [];
    const environment = get().activeEnvironment();

    if (environment) {
      scopes.push(rowsToScope(environment.name, environment.variables));
    }

    const collection = tab?.sourceRequestId
      ? findCollectionForRequest(workspace.collections, tab.sourceRequestId)
      : workspace.collections[0] ?? null;

    if (collection) {
      scopes.push(rowsToScope(collection.name, collection.variables));
    }

    return scopes;
  },

  setSidebarView: (view) => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.sidebarView = view;
    });
  },

  setActiveEnvironment: (environmentId) => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.activeEnvironmentId = environmentId;
    });
  },

  addEnvironment: () => {
    mutateWorkspace(get, set, (workspace) => {
      const environment = createEnvironment(`Environment ${workspace.environments.length + 1}`, "dev");
      workspace.environments.push(environment);
      workspace.activeEnvironmentId = environment.id;
    });
  },

  updateEnvironment: (environmentId, patch) => {
    mutateWorkspace(get, set, (workspace) => {
      const environment = workspace.environments.find((item) => item.id === environmentId);
      if (environment) {
        Object.assign(environment, patch);
      }
    });
  },

  updateEnvironmentRows: (environmentId, rows) => {
    mutateWorkspace(get, set, (workspace) => {
      const environment = workspace.environments.find((item) => item.id === environmentId);
      if (environment) {
        environment.variables = rows;
      }
    });
  },

  newRequest: () => {
    mutateWorkspace(get, set, (workspace) => {
      const request = createEmptyRequest();
      const tab: RequestTab = {
        ...createRequestTab(request),
        sourceRequestId: null,
        dirty: true
      };
      workspace.tabs.push(tab);
      workspace.activeTabId = tab.id;
    });
  },

  openRequest: (request) => {
    mutateWorkspace(get, set, (workspace) => {
      const existing = workspace.tabs.find((tab) => tab.sourceRequestId === request.id);
      if (existing) {
        workspace.activeTabId = existing.id;
        return;
      }

      const tab = createRequestTab(request);
      workspace.tabs.push(tab);
      workspace.activeTabId = tab.id;
    });
  },

  closeTab: (tabId) => {
    if (get().workspace.tabs.length === 1) return;
    mutateWorkspace(get, set, (workspace) => {
      const index = workspace.tabs.findIndex((tab) => tab.id === tabId);
      workspace.tabs = workspace.tabs.filter((tab) => tab.id !== tabId);
      if (workspace.activeTabId === tabId) {
        workspace.activeTabId = workspace.tabs[Math.max(0, index - 1)]?.id ?? workspace.tabs[0]?.id ?? null;
      }
    });
  },

  setActiveTab: (tabId) => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.activeTabId = tabId;
    });
  },

  updateActiveDraft: (updater) => {
    mutateWorkspace(get, set, (workspace) => {
      const tab = workspace.tabs.find((item) => item.id === workspace.activeTabId);
      if (!tab) {
        return;
      }

      tab.draft = updater(clone(tab.draft));
      tab.title = tab.draft.name;
      tab.dirty = true;
    });
  },

  saveActiveRequest: () => {
    mutateWorkspace(get, set, (workspace) => {
      const tab = workspace.tabs.find((item) => item.id === workspace.activeTabId);
      if (!tab) {
        return;
      }

      tab.draft.updatedAt = nowIso();
      workspace.collections = upsertRequest(workspace.collections, tab.draft);
      tab.sourceRequestId = tab.draft.id;
      tab.title = tab.draft.name;
      tab.dirty = false;
    });
    setToast(set, "success", "Request saved.");
  },

  sendActiveRequest: async () => {
    const tab = get().activeTab();
    if (!tab) {
      return;
    }

    const validation = validateRequest(tab.draft);
    if (!validation.ok) {
      setToast(set, "danger", validation.issues[0].message);
      return;
    }

    set({ sending: true, toast: null });
    try {
      const response = await executeApiRequest(tab.draft, { scopes: get().activeScopes() });
      mutateWorkspace(get, set, (workspace) => {
        const current = workspace.tabs.find((item) => item.id === tab.id);
        if (current) {
          current.response = response;
        }

        workspace.history = [createHistoryEntry(tab.draft, response), ...workspace.history].slice(0, 200);
        applyResponseChaining(workspace, tab.draft, response);
      });
    } catch (error) {
      setToast(set, "danger", error instanceof Error ? error.message : "Request failed.");
    } finally {
      set({ sending: false });
    }
  },

  toggleFavorite: (requestId) => {
    mutateWorkspace(get, set, (workspace) => {
      const request = findRequest(workspace.collections, requestId);
      if (request) {
        request.favorite = !request.favorite;
      }

      workspace.tabs.forEach((tab) => {
        if (tab.draft.id === requestId) {
          tab.draft.favorite = !tab.draft.favorite;
        }
      });
    });
  },

  addCollection: () => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.collections.push({
        id: createId("col"),
        name: `Collection ${workspace.collections.length + 1}`,
        variables: [createKeyValueRow()],
        folders: [],
        requests: [],
        createdAt: nowIso()
      });
    });
  },

  renameCollection: (collectionId, name) => {
    mutateWorkspace(get, set, (workspace) => {
      const collection = workspace.collections.find((item) => item.id === collectionId);
      if (collection) {
        collection.name = name;
      }
    });
  },

  addFolder: (collectionId, parentId) => {
    mutateWorkspace(get, set, (workspace) => {
      const collection = workspace.collections.find((item) => item.id === collectionId);
      if (!collection) {
        return;
      }

      const folder = {
        id: createId("fld"),
        collectionId,
        parentId,
        name: "New Folder",
        folders: [],
        requests: []
      };

      if (!parentId) {
        collection.folders.push(folder);
        return;
      }

      const parent = findFolder(collection.folders, parentId);
      parent?.folders.push(folder);
    });
  },

  renameFolder: (folderId, name) => {
    mutateWorkspace(get, set, (workspace) => {
      for (const collection of workspace.collections) {
        const folder = findFolder(collection.folders, folderId);
        if (folder) {
          folder.name = name;
          return;
        }
      }
    });
  },

  renameRequest: (requestId, name) => {
    mutateWorkspace(get, set, (workspace) => {
      const request = findRequest(workspace.collections, requestId);
      if (request) {
        request.name = name;
        request.updatedAt = nowIso();
      }

      workspace.tabs.forEach((tab) => {
        if (tab.draft.id === requestId) {
          tab.draft.name = name;
          tab.title = name;
          tab.dirty = true;
        }
      });
    });
  },

  duplicateCollection: (collectionId) => {
    mutateWorkspace(get, set, (workspace) => {
      const collection = workspace.collections.find((item) => item.id === collectionId);
      if (collection) {
        workspace.collections.push(cloneCollection(collection, `${collection.name} Copy`));
      }
    });
  },

  duplicateFolder: (folderId) => {
    mutateWorkspace(get, set, (workspace) => {
      for (const collection of workspace.collections) {
        const folder = findFolder(collection.folders, folderId);
        if (folder) {
          const copy = cloneFolder(folder, collection.id, folder.parentId, `${folder.name} Copy`);
          if (folder.parentId) {
            findFolder(collection.folders, folder.parentId)?.folders.push(copy);
          } else {
            collection.folders.push(copy);
          }
          return;
        }
      }
    });
  },

  duplicateRequest: (requestId) => {
    mutateWorkspace(get, set, (workspace) => {
      for (const collection of workspace.collections) {
        const directIndex = collection.requests.findIndex((request) => request.id === requestId);
        if (directIndex >= 0) {
          collection.requests.splice(directIndex + 1, 0, cloneRequest(collection.requests[directIndex]));
          return;
        }

        const result = findRequestContainer(collection.folders, requestId);
        if (result) {
          result.requests.splice(result.index + 1, 0, cloneRequest(result.requests[result.index]));
          return;
        }
      }
    });
  },

  deleteCollection: (collectionId) => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.collections = workspace.collections.filter((collection) => collection.id !== collectionId);
    });
  },

  deleteFolder: (folderId) => {
    mutateWorkspace(get, set, (workspace) => {
      for (const collection of workspace.collections) {
        collection.folders = removeFolder(collection.folders, folderId);
      }
    });
  },

  deleteRequest: (requestId) => {
    mutateWorkspace(get, set, (workspace) => {
      for (const collection of workspace.collections) {
        collection.requests = collection.requests.filter((request) => request.id !== requestId);
        removeRequestFromFolders(collection.folders, requestId);
      }
    });
  },

  importPostmanCollectionFile: (raw) => {
    const collection = importPostmanCollection(raw);
    mutateWorkspace(get, set, (workspace) => {
      workspace.collections.push(collection);
      const firstRequest = firstRequestInCollection(collection);
      if (firstRequest) {
        const tab = createRequestTab(firstRequest);
        workspace.tabs.push(tab);
        workspace.activeTabId = tab.id;
      }
    });
    setToast(set, "success", "Postman collection imported.");
  },

  importPostmanEnvironmentFile: (raw) => {
    const environment = importPostmanEnvironment(raw);
    mutateWorkspace(get, set, (workspace) => {
      workspace.environments.push(environment);
      workspace.activeEnvironmentId = environment.id;
    });
    setToast(set, "success", "Postman environment imported.");
  },

  importWorkspaceFile: (raw) => {
    const workspace = importWorkspace(raw);
    set({ workspace, toast: { tone: "success", message: "Workspace imported." } });
    void saveWorkspace(workspace);
  },

  exportWorkspaceFile: () => exportWorkspace(get().workspace),

  exportCollectionFile: (collectionId) => {
    const collection = get().workspace.collections.find((item) => item.id === collectionId);
    if (!collection) {
      throw new Error("Collection not found.");
    }

    return JSON.stringify(exportPostmanCollection(collection), null, 2);
  },

  exportFolderFile: (folderId) => {
    for (const collection of get().workspace.collections) {
      const folder = findFolder(collection.folders, folderId);
      if (folder) {
        return JSON.stringify(exportPostmanFolderAsCollection(folder), null, 2);
      }
    }

    throw new Error("Folder not found.");
  },

  exportRequestFile: (requestId) => {
    const request = findRequest(get().workspace.collections, requestId);
    if (!request) {
      throw new Error("Request not found.");
    }

    return JSON.stringify(exportPostmanRequestAsCollection(request), null, 2);
  },

  exportEnvironmentFile: (environmentId) => {
    const environment = get().workspace.environments.find((item) => item.id === environmentId);
    if (!environment) {
      throw new Error("Environment not found.");
    }

    return JSON.stringify(exportPostmanEnvironment(environment), null, 2);
  },

  restoreHistoryEntry: (entry) => {
    mutateWorkspace(get, set, (workspace) => {
      const request = {
        ...clone(entry.requestSnapshot),
        id: createId("req"),
        name: `${entry.requestName} copy`,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      const tab: RequestTab = {
        ...createRequestTab(request),
        sourceRequestId: null,
        dirty: true,
        response: entry.responseSnapshot
      };
      workspace.tabs.push(tab);
      workspace.activeTabId = tab.id;
    });
  },

  clearHistory: () => {
    mutateWorkspace(get, set, (workspace) => {
      workspace.history = [];
    });
  },

  dismissToast: () => set({ toast: null })
}));

function mutateWorkspace(
  get: () => WorkspaceStore,
  set: (partial: Partial<WorkspaceStore>) => void,
  mutator: (workspace: WorkspaceModel) => void
): void {
  const workspace = clone(get().workspace);
  mutator(workspace);
  set({ workspace });
  void saveWorkspace(workspace);
}

function setToast(set: (partial: Partial<WorkspaceStore>) => void, tone: ToastState["tone"], message: string): void {
  set({ toast: { tone, message } });
}

function createHistoryEntry(request: ApiRequest, response: ResponseSnapshot): HistoryEntry {
  return {
    id: createId("his"),
    requestId: request.id,
    requestName: request.name,
    method: request.method,
    url: request.url,
    status: response.status,
    timeMs: response.timeMs,
    sizeBytes: response.sizeBytes,
    createdAt: nowIso(),
    requestSnapshot: clone(request),
    responseSnapshot: response
  };
}

function applyResponseChaining(workspace: WorkspaceModel, request: ApiRequest, response: ResponseSnapshot): void {
  const environment = workspace.environments.find((item) => item.id === workspace.activeEnvironmentId);
  if (!environment || !request.tests.some((rule) => rule.enabled)) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.body);
  } catch {
    return;
  }

  for (const rule of request.tests) {
    if (!rule.enabled || !rule.variableName.trim() || !rule.path.trim()) {
      continue;
    }

    const value = readJsonPath(parsed, rule.path);
    if (value === undefined) {
      continue;
    }

    const existing = environment.variables.find((row) => row.key === rule.variableName);
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (existing) {
      existing.value = serialized;
      existing.enabled = true;
    } else {
      environment.variables.push(createKeyValueRow(rule.variableName, serialized));
    }
  }
}

function findCollectionForRequest(collections: CollectionNode[], requestId: string): CollectionNode | null {
  for (const collection of collections) {
    if (collection.requests.some((request) => request.id === requestId)) {
      return collection;
    }

    if (folderContainsRequest(collection.folders, requestId)) {
      return collection;
    }
  }

  return null;
}

function folderContainsRequest(folders: CollectionNode["folders"], requestId: string): boolean {
  return folders.some(
    (folder) =>
      folder.requests.some((request) => request.id === requestId) || folderContainsRequest(folder.folders, requestId)
  );
}

function firstRequestInCollection(collection: CollectionNode): ApiRequest | null {
  if (collection.requests[0]) {
    return collection.requests[0];
  }

  for (const folder of collection.folders) {
    const request = firstRequestInFolder(folder);
    if (request) {
      return request;
    }
  }

  return null;
}

function firstRequestInFolder(folder: CollectionNode["folders"][number]): ApiRequest | null {
  if (folder.requests[0]) {
    return folder.requests[0];
  }

  for (const child of folder.folders) {
    const request = firstRequestInFolder(child);
    if (request) {
      return request;
    }
  }

  return null;
}

function findFolder(folders: CollectionNode["folders"], folderId: string): CollectionNode["folders"][number] | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }

    const nested = findFolder(folder.folders, folderId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function cloneCollection(collection: CollectionNode, name = collection.name): CollectionNode {
  const collectionId = createId("col");
  return {
    ...clone(collection),
    id: collectionId,
    name,
    createdAt: nowIso(),
    folders: collection.folders.map((folder) => cloneFolder(folder, collectionId, folder.parentId)),
    requests: collection.requests.map(cloneRequest)
  };
}

function cloneFolder(
  folder: CollectionNode["folders"][number],
  collectionId: string,
  parentId: string | null,
  name = folder.name
): CollectionNode["folders"][number] {
  const folderId = createId("fld");
  return {
    ...clone(folder),
    id: folderId,
    collectionId,
    parentId,
    name,
    folders: folder.folders.map((child) => cloneFolder(child, collectionId, folderId)),
    requests: folder.requests.map(cloneRequest)
  };
}

function cloneRequest(request: ApiRequest): ApiRequest {
  const timestamp = nowIso();
  return {
    ...clone(request),
    id: createId("req"),
    name: `${request.name} Copy`,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function findRequestContainer(
  folders: CollectionNode["folders"],
  requestId: string
): { requests: ApiRequest[]; index: number } | null {
  for (const folder of folders) {
    const index = folder.requests.findIndex((request) => request.id === requestId);
    if (index >= 0) {
      return { requests: folder.requests, index };
    }

    const nested = findRequestContainer(folder.folders, requestId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function removeFolder(
  folders: CollectionNode["folders"],
  folderId: string
): CollectionNode["folders"] {
  return folders
    .filter((folder) => folder.id !== folderId)
    .map((folder) => ({
      ...folder,
      folders: removeFolder(folder.folders, folderId)
    }));
}

function removeRequestFromFolders(folders: CollectionNode["folders"], requestId: string): void {
  for (const folder of folders) {
    folder.requests = folder.requests.filter((request) => request.id !== requestId);
    removeRequestFromFolders(folder.folders, requestId);
  }
}
