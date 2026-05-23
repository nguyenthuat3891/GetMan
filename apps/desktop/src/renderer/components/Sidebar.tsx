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
  const activeTab = useWorkspaceStore((state) => state.workspace.tabs.find((t) => t.id === state.workspace.activeTabId) ?? null);
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
  const toggleFavorite = useWorkspaceStore((state) => state.toggleFavorite);

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
            onToggleFavorite={toggleFavorite}
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
            onToggleFavorite={toggleFavorite}
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
  onOpenRequest,
  onToggleFavorite
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
  onToggleFavorite: (requestId: string) => void;
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
          onToggleFavorite={onToggleFavorite}
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
  onOpenRequest,
  onToggleFavorite
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
  onToggleFavorite: (requestId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const hasChildren = collection.folders.length > 0 || collection.requests.length > 0;

  const startRename = () => {
    setEditName(collection.name);
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed) onRenameCollection(collection.id, trimmed);
    else setEditName(collection.name);
    setIsEditing(false);
  };

  const cancelRename = () => {
    setEditName(collection.name);
    setIsEditing(false);
  };

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
        {isEditing ? (
          <input
            className="tree-name-input"
            value={editName}
            autoFocus
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Collection name"
          />
        ) : (
          <span className="tree-name-text">{collection.name}</span>
        )}
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
          onStartRename={startRename}
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
              onToggleFavorite={onToggleFavorite}
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
              onToggleFavorite={onToggleFavorite}
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
  onOpenRequest,
  onToggleFavorite
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
  onToggleFavorite: (requestId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const hasChildren = folder.folders.length > 0 || folder.requests.length > 0;

  const startRename = () => {
    setEditName(folder.name);
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed) onRenameFolder(folder.id, trimmed);
    else setEditName(folder.name);
    setIsEditing(false);
  };

  const cancelRename = () => {
    setEditName(folder.name);
    setIsEditing(false);
  };

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
        {isEditing ? (
          <input
            className="tree-name-input folder-name-input"
            value={editName}
            autoFocus
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Folder name"
          />
        ) : (
          <span className="tree-name-text folder-name-text">{folder.name}</span>
        )}
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
          onStartRename={startRename}
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
              onToggleFavorite={onToggleFavorite}
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
              onToggleFavorite={onToggleFavorite}
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
  onExport,
  onToggleFavorite
}: {
  request: ApiRequest;
  active: boolean;
  onOpen: () => void;
  onRename: (requestId: string, name: string) => void;
  onDuplicate: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onExport: (requestId: string) => string;
  onToggleFavorite: (requestId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(request.name);

  const startRename = () => {
    setEditName(request.name);
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed) onRename(request.id, trimmed);
    else setEditName(request.name);
    setIsEditing(false);
  };

  const cancelRename = () => {
    setEditName(request.name);
    setIsEditing(false);
  };

  return (
    <div className={`request-row ${active ? "active" : ""}`}>
      {isEditing ? (
        <input
          className="request-rename-input"
          value={editName}
          autoFocus
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") cancelRename();
          }}
          aria-label="Request name"
        />
      ) : (
        <button type="button" className="request-main" onClick={onOpen}>
          <span className={`method-pill method-${request.method.toLowerCase()}`}>{request.method}</span>
          <span className="truncate">{request.name}</span>
        </button>
      )}
      {request.favorite && !isEditing ? <Star24Filled className="favorite-icon" /> : null}
      <ItemActions
        name={request.name}
        onExport={() =>
          downloadJson(`${sanitizeFileName(request.name)}.postman_collection.json`, onExport(request.id))
        }
        onStartRename={startRename}
        onDuplicate={() => onDuplicate(request.id)}
        onDelete={() => onDelete(request.id)}
        onToggleFavorite={() => onToggleFavorite(request.id)}
        isFavorite={request.favorite}
      />
    </div>
  );
}

function ItemActions({
  name,
  onExport,
  onStartRename,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  isFavorite
}: {
  name: string;
  onExport: () => void;
  onStartRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}) {
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
          <MenuItem onClick={onStartRename}>Rename</MenuItem>
          <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
          {onToggleFavorite && (
            <MenuItem onClick={onToggleFavorite}>
              {isFavorite ? "Remove from favorites" : "Add to favorites"}
            </MenuItem>
          )}
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
  onExport,
  onToggleFavorite
}: {
  collections: CollectionNode[];
  activeRequestId: string | null;
  onOpen: (request: ApiRequest) => void;
  onRename: (requestId: string, name: string) => void;
  onDuplicate: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onExport: (requestId: string) => string;
  onToggleFavorite: (requestId: string) => void;
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
          onToggleFavorite={onToggleFavorite}
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
