import type { ReactNode } from "react";
import { useState } from "react";
import {
  Add24Regular,
  Box24Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Clock24Regular,
  FolderAdd24Regular,
  Folder24Regular,
  Globe24Regular,
  History24Regular,
  MoreHorizontal24Regular,
  Star24Filled,
  Star24Regular,
  Wand24Regular
} from "@fluentui/react-icons";
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip } from "@fluentui/react-components";
import type { ApiRequest, CollectionNode, Environment, FolderNode, HistoryEntry, SidebarView } from "@core/types";
import { formatBytes } from "@core/utils";
import { KeyValueEditor } from "./KeyValueEditor";
import { useWorkspaceStore } from "../store/workspaceStore";

const sidebarViews: Array<{
  id: SidebarView;
  label: string;
  icon: ReactNode;
  className: string;
}> = [
  { id: "collections", label: "Collections", icon: <Box24Regular />, className: "collection-icon" },
  { id: "history", label: "History", icon: <History24Regular />, className: "history-icon" },
  { id: "environments", label: "Environments", icon: <Globe24Regular />, className: "environment-icon" },
  { id: "favorites", label: "Favorites", icon: <Star24Regular />, className: "favorite-icon" }
];

export function Sidebar() {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const activeTab = useWorkspaceStore((state) => state.activeTab());
  const setSidebarView = useWorkspaceStore((state) => state.setSidebarView);
  const addCollection = useWorkspaceStore((state) => state.addCollection);
  const renameCollection = useWorkspaceStore((state) => state.renameCollection);
  const addFolder = useWorkspaceStore((state) => state.addFolder);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const renameRequest = useWorkspaceStore((state) => state.renameRequest);
  const duplicateCollection = useWorkspaceStore((state) => state.duplicateCollection);
  const duplicateFolder = useWorkspaceStore((state) => state.duplicateFolder);
  const duplicateRequest = useWorkspaceStore((state) => state.duplicateRequest);
  const deleteCollection = useWorkspaceStore((state) => state.deleteCollection);
  const deleteFolder = useWorkspaceStore((state) => state.deleteFolder);
  const deleteRequest = useWorkspaceStore((state) => state.deleteRequest);
  const exportCollectionFile = useWorkspaceStore((state) => state.exportCollectionFile);
  const exportFolderFile = useWorkspaceStore((state) => state.exportFolderFile);
  const exportRequestFile = useWorkspaceStore((state) => state.exportRequestFile);
  const addEnvironment = useWorkspaceStore((state) => state.addEnvironment);
  const openRequest = useWorkspaceStore((state) => state.openRequest);
  const restoreHistoryEntry = useWorkspaceStore((state) => state.restoreHistoryEntry);
  const clearHistory = useWorkspaceStore((state) => state.clearHistory);
  const setActiveEnvironment = useWorkspaceStore((state) => state.setActiveEnvironment);
  const updateEnvironment = useWorkspaceStore((state) => state.updateEnvironment);
  const updateEnvironmentRows = useWorkspaceStore((state) => state.updateEnvironmentRows);

  return (
    <aside className="panel sidebar-panel">
      <nav className="sidebar-tabs" aria-label="Sidebar">
        {sidebarViews.map((view) => (
          <Tooltip content={view.label} relationship="label" key={view.id}>
            <button
              type="button"
              className={`sidebar-tab ${workspace.sidebarView === view.id ? "active" : ""} ${view.className}`}
              onClick={() => setSidebarView(view.id)}
              aria-label={view.label}
            >
              {view.icon}
            </button>
          </Tooltip>
        ))}
      </nav>

      <div className="sidebar-content">
        {workspace.sidebarView === "collections" && (
          <CollectionsView
            collections={workspace.collections}
            activeRequestId={activeTab?.draft.id ?? null}
            onAddCollection={addCollection}
            onAddFolder={addFolder}
            onRenameCollection={renameCollection}
            onRenameFolder={renameFolder}
            onRenameRequest={renameRequest}
            onDuplicateCollection={duplicateCollection}
            onDuplicateFolder={duplicateFolder}
            onDuplicateRequest={duplicateRequest}
            onDeleteCollection={deleteCollection}
            onDeleteFolder={deleteFolder}
            onDeleteRequest={deleteRequest}
            onExportCollection={exportCollectionFile}
            onExportFolder={exportFolderFile}
            onExportRequest={exportRequestFile}
            onOpenRequest={openRequest}
          />
        )}

        {workspace.sidebarView === "history" && (
          <HistoryView entries={workspace.history} onRestore={restoreHistoryEntry} onClear={clearHistory} />
        )}

        {workspace.sidebarView === "environments" && (
          <EnvironmentsView
            environments={workspace.environments}
            activeEnvironmentId={workspace.activeEnvironmentId}
            onAdd={addEnvironment}
            onSelect={setActiveEnvironment}
            onUpdate={updateEnvironment}
            onUpdateRows={updateEnvironmentRows}
          />
        )}

        {workspace.sidebarView === "favorites" && (
          <FavoritesView
            collections={workspace.collections}
            activeRequestId={activeTab?.draft.id ?? null}
            onOpen={openRequest}
            onRename={renameRequest}
            onDuplicate={duplicateRequest}
            onDelete={deleteRequest}
            onExport={exportRequestFile}
          />
        )}
      </div>
    </aside>
  );
}

function CollectionsView({
  collections,
  activeRequestId,
  onAddCollection,
  onAddFolder,
  onRenameCollection,
  onRenameFolder,
  onRenameRequest,
  onDuplicateCollection,
  onDuplicateFolder,
  onDuplicateRequest,
  onDeleteCollection,
  onDeleteFolder,
  onDeleteRequest,
  onExportCollection,
  onExportFolder,
  onExportRequest,
  onOpenRequest
}: {
  collections: CollectionNode[];
  activeRequestId: string | null;
  onAddCollection: () => void;
  onAddFolder: (collectionId: string, parentId: string | null) => void;
  onRenameCollection: (collectionId: string, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRenameRequest: (requestId: string, name: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onDuplicateFolder: (folderId: string) => void;
  onDuplicateRequest: (requestId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onExportCollection: (collectionId: string) => string;
  onExportFolder: (folderId: string) => string;
  onExportRequest: (requestId: string) => string;
  onOpenRequest: (request: ApiRequest) => void;
}) {
  return (
    <>
      <div className="panel-header compact-header">
        <div>
          <div className="panel-title">Collections</div>
          <div className="panel-subtitle">{collections.length} total</div>
        </div>
        <Tooltip content="Add collection" relationship="label">
          <Button appearance="subtle" icon={<Add24Regular />} onClick={onAddCollection} />
        </Tooltip>
      </div>

      {collections.map((collection) => (
        <CollectionBlock
          key={collection.id}
          collection={collection}
          activeRequestId={activeRequestId}
          onAddFolder={onAddFolder}
          onRenameCollection={onRenameCollection}
          onRenameFolder={onRenameFolder}
          onRenameRequest={onRenameRequest}
          onDuplicateCollection={onDuplicateCollection}
          onDuplicateFolder={onDuplicateFolder}
          onDuplicateRequest={onDuplicateRequest}
          onDeleteCollection={onDeleteCollection}
          onDeleteFolder={onDeleteFolder}
          onDeleteRequest={onDeleteRequest}
          onExportCollection={onExportCollection}
          onExportFolder={onExportFolder}
          onExportRequest={onExportRequest}
          onOpenRequest={onOpenRequest}
        />
      ))}
    </>
  );
}

function CollectionBlock({
  collection,
  activeRequestId,
  onAddFolder,
  onRenameCollection,
  onRenameFolder,
  onRenameRequest,
  onDuplicateCollection,
  onDuplicateFolder,
  onDuplicateRequest,
  onDeleteCollection,
  onDeleteFolder,
  onDeleteRequest,
  onExportCollection,
  onExportFolder,
  onExportRequest,
  onOpenRequest
}: {
  collection: CollectionNode;
  activeRequestId: string | null;
  onAddFolder: (collectionId: string, parentId: string | null) => void;
  onRenameCollection: (collectionId: string, name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRenameRequest: (requestId: string, name: string) => void;
  onDuplicateCollection: (collectionId: string) => void;
  onDuplicateFolder: (folderId: string) => void;
  onDuplicateRequest: (requestId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onExportCollection: (collectionId: string) => string;
  onExportFolder: (folderId: string) => string;
  onExportRequest: (requestId: string) => string;
  onOpenRequest: (request: ApiRequest) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = collection.folders.length > 0 || collection.requests.length > 0;

  return (
    <div className="tree-block">
      <div className="tree-heading">
        <button
          type="button"
          className="tree-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {collapsed ? <ChevronRight20Regular /> : <ChevronDown20Regular />}
        </button>
        <Box24Regular className="collection-icon" />
        <input
          className="tree-name-input"
          value={collection.name}
          onChange={(event) => onRenameCollection(collection.id, event.target.value)}
          aria-label="Collection name"
        />
        <Tooltip content="Add folder" relationship="label">
          <button type="button" className="tree-icon-button" onClick={() => onAddFolder(collection.id, null)}>
            <FolderAdd24Regular />
          </button>
        </Tooltip>
        <ItemActions
          name={collection.name}
          onExport={() =>
            downloadJson(`${sanitizeFileName(collection.name)}.postman_collection.json`, onExportCollection(collection.id))
          }
          onRename={(name) => onRenameCollection(collection.id, name)}
          onDuplicate={() => onDuplicateCollection(collection.id)}
          onDelete={() => onDeleteCollection(collection.id)}
        />
      </div>
      {!collapsed && (
        <>
          {collection.folders.map((folder) => (
            <FolderTree
              key={folder.id}
              folder={folder}
              activeRequestId={activeRequestId}
              onAddFolder={onAddFolder}
              onRenameFolder={onRenameFolder}
              onRenameRequest={onRenameRequest}
              onDuplicateFolder={onDuplicateFolder}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteFolder={onDeleteFolder}
              onDeleteRequest={onDeleteRequest}
              onExportFolder={onExportFolder}
              onExportRequest={onExportRequest}
              onOpenRequest={onOpenRequest}
            />
          ))}
          {collection.requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              active={request.id === activeRequestId}
              onRename={onRenameRequest}
              onDuplicate={onDuplicateRequest}
              onDelete={onDeleteRequest}
              onExport={onExportRequest}
              onOpen={() => onOpenRequest(request)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FolderTree({
  folder,
  activeRequestId,
  onAddFolder,
  onRenameFolder,
  onRenameRequest,
  onDuplicateFolder,
  onDuplicateRequest,
  onDeleteFolder,
  onDeleteRequest,
  onExportFolder,
  onExportRequest,
  onOpenRequest
}: {
  folder: FolderNode;
  activeRequestId: string | null;
  onAddFolder: (collectionId: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRenameRequest: (requestId: string, name: string) => void;
  onDuplicateFolder: (folderId: string) => void;
  onDuplicateRequest: (requestId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onExportFolder: (folderId: string) => string;
  onExportRequest: (requestId: string) => string;
  onOpenRequest: (request: ApiRequest) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = folder.folders.length > 0 || folder.requests.length > 0;

  return (
    <div>
      <div className="folder-row">
        <button
          type="button"
          className="tree-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {collapsed ? <ChevronRight20Regular /> : <ChevronDown20Regular />}
        </button>
        <Folder24Regular className="favorite-icon" />
        <input
          className="tree-name-input"
          value={folder.name}
          onChange={(event) => onRenameFolder(folder.id, event.target.value)}
          aria-label="Folder name"
        />
        <Tooltip content="Add subfolder" relationship="label">
          <button type="button" className="tree-icon-button" onClick={() => onAddFolder(folder.collectionId, folder.id)}>
            <FolderAdd24Regular />
          </button>
        </Tooltip>
        <ItemActions
          name={folder.name}
          onExport={() =>
            downloadJson(`${sanitizeFileName(folder.name)}.postman_collection.json`, onExportFolder(folder.id))
          }
          onRename={(name) => onRenameFolder(folder.id, name)}
          onDuplicate={() => onDuplicateFolder(folder.id)}
          onDelete={() => onDeleteFolder(folder.id)}
        />
      </div>
      {!collapsed && hasChildren && (
        <div className="folder-children">
          {folder.folders.map((child) => (
            <FolderTree
              key={child.id}
              folder={child}
              activeRequestId={activeRequestId}
              onAddFolder={onAddFolder}
              onRenameFolder={onRenameFolder}
              onRenameRequest={onRenameRequest}
              onDuplicateFolder={onDuplicateFolder}
              onDuplicateRequest={onDuplicateRequest}
              onDeleteFolder={onDeleteFolder}
              onDeleteRequest={onDeleteRequest}
              onExportFolder={onExportFolder}
              onExportRequest={onExportRequest}
              onOpenRequest={onOpenRequest}
            />
          ))}
          {folder.requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              active={request.id === activeRequestId}
              onRename={onRenameRequest}
              onDuplicate={onDuplicateRequest}
              onDelete={onDeleteRequest}
              onExport={onExportRequest}
              onOpen={() => onOpenRequest(request)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request,
  active,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onExport
}: {
  request: ApiRequest;
  active: boolean;
  onOpen: () => void;
  onRename: (requestId: string, name: string) => void;
  onDuplicate: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onExport: (requestId: string) => string;
}) {
  return (
    <div className={`request-row ${active ? "active" : ""}`}>
      <button type="button" className="request-main" onClick={onOpen}>
        <span className={`method-pill method-${request.method.toLowerCase()}`}>{request.method}</span>
        <span className="truncate">{request.name}</span>
      </button>
      {request.favorite ? <Star24Filled className="favorite-icon" /> : null}
      <ItemActions
        name={request.name}
        onExport={() =>
          downloadJson(`${sanitizeFileName(request.name)}.postman_collection.json`, onExport(request.id))
        }
        onRename={(name) => onRename(request.id, name)}
        onDuplicate={() => onDuplicate(request.id)}
        onDelete={() => onDelete(request.id)}
      />
    </div>
  );
}

function ItemActions({
  name,
  onExport,
  onRename,
  onDuplicate,
  onDelete
}: {
  name: string;
  onExport: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const rename = () => {
    const next = window.prompt("Rename", name);
    if (next?.trim()) {
      onRename(next.trim());
    }
  };

  const remove = () => {
    if (window.confirm(`Delete "${name}" and all children?`)) {
      onDelete();
    }
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <button type="button" className="tree-more-button" aria-label={`Actions for ${name}`}>
          <MoreHorizontal24Regular />
        </button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem onClick={onExport}>Export</MenuItem>
          <MenuItem onClick={rename}>Rename</MenuItem>
          <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
          <MenuItem onClick={remove}>Delete</MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

function HistoryView({
  entries,
  onRestore,
  onClear
}: {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}) {
  return (
    <>
      <div className="panel-header compact-header">
        <div>
          <div className="panel-title">History</div>
          <div className="panel-subtitle">{entries.length} saved runs</div>
        </div>
        <Button appearance="subtle" onClick={onClear}>
          Clear
        </Button>
      </div>

      {entries.length === 0 && <div className="empty-state">No history yet.</div>}

      {entries.map((entry) => (
        <button type="button" className="history-row" key={entry.id} onClick={() => onRestore(entry)}>
          <Clock24Regular className="history-icon" />
          <div className="truncate">
            <div className="truncate">{entry.requestName}</div>
            <div className="small-text muted truncate">
              {entry.status ?? "-"} / {entry.timeMs ?? "-"} ms / {entry.sizeBytes ? formatBytes(entry.sizeBytes) : "-"}
            </div>
          </div>
        </button>
      ))}
    </>
  );
}

function EnvironmentsView({
  environments,
  activeEnvironmentId,
  onAdd,
  onSelect,
  onUpdate,
  onUpdateRows
}: {
  environments: Environment[];
  activeEnvironmentId: string | null;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Environment>) => void;
  onUpdateRows: (id: string, rows: Environment["variables"]) => void;
}) {
  const activeEnvironment = environments.find((environment) => environment.id === activeEnvironmentId) ?? environments[0];

  return (
    <>
      <div className="panel-header compact-header">
        <div>
          <div className="panel-title">Environments</div>
          <div className="panel-subtitle">{environments.length} scopes</div>
        </div>
        <Tooltip content="Add environment" relationship="label">
          <Button appearance="subtle" icon={<Add24Regular />} onClick={onAdd} />
        </Tooltip>
      </div>

      {environments.map((environment) => (
        <button
          type="button"
          className={`environment-row ${environment.id === activeEnvironmentId ? "active" : ""}`}
          key={environment.id}
          onClick={() => onSelect(environment.id)}
        >
          <Globe24Regular className="environment-icon" />
          <span className="truncate">{environment.name}</span>
          <span className="small-text muted">{environment.type}</span>
        </button>
      ))}

      {activeEnvironment && (
        <div className="environment-editor">
          <input
            className="form-control"
            value={activeEnvironment.name}
            onChange={(event) => onUpdate(activeEnvironment.id, { name: event.target.value })}
            aria-label="Environment name"
          />
          <select
            className="env-select"
            value={activeEnvironment.type}
            onChange={(event) => onUpdate(activeEnvironment.id, { type: event.target.value as Environment["type"] })}
            aria-label="Environment type"
          >
            <option value="local">Local</option>
            <option value="dev">Dev</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <KeyValueEditor rows={activeEnvironment.variables} onChange={(rows) => onUpdateRows(activeEnvironment.id, rows)} />
        </div>
      )}
    </>
  );
}

function FavoritesView({
  collections,
  activeRequestId,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onExport
}: {
  collections: CollectionNode[];
  activeRequestId: string | null;
  onOpen: (request: ApiRequest) => void;
  onRename: (requestId: string, name: string) => void;
  onDuplicate: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onExport: (requestId: string) => string;
}) {
  const favorites = collectFavorites(collections);

  return (
    <>
      <div className="panel-header compact-header">
        <div>
          <div className="panel-title">Favorites</div>
          <div className="panel-subtitle">{favorites.length} pinned requests</div>
        </div>
        <Wand24Regular className="favorite-icon" />
      </div>

      {favorites.length === 0 && <div className="empty-state">No favorites yet.</div>}

      {favorites.map((request) => (
        <RequestRow
          key={request.id}
          request={request}
          active={request.id === activeRequestId}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onExport={onExport}
          onOpen={() => onOpen(request)}
        />
      ))}
    </>
  );
}

function collectFavorites(collections: CollectionNode[]): ApiRequest[] {
  const requests: ApiRequest[] = [];

  for (const collection of collections) {
    requests.push(...collection.requests.filter((request) => request.favorite));
    collectFolderFavorites(collection.folders, requests);
  }

  return requests;
}

function collectFolderFavorites(folders: FolderNode[], requests: ApiRequest[]): void {
  for (const folder of folders) {
    requests.push(...folder.requests.filter((request) => request.favorite));
    collectFolderFavorites(folder.folders, requests);
  }
}

function downloadJson(filename: string, value: string): void {
  const blob = new Blob([value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "export";
}
