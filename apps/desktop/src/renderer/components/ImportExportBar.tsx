import { useRef } from "react";
import { ArrowDownload24Regular, ArrowUpload24Regular } from "@fluentui/react-icons";
import { Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Button } from "@fluentui/react-components";
import { useWorkspaceStore } from "../store/workspaceStore";

type ImportTarget = "postman-collection" | "postman-environment" | "workspace";

export function ImportExportBar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importTargetRef = useRef<ImportTarget>("postman-collection");
  const workspace = useWorkspaceStore((state) => state.workspace);
  const importPostmanCollectionFile = useWorkspaceStore((state) => state.importPostmanCollectionFile);
  const importPostmanEnvironmentFile = useWorkspaceStore((state) => state.importPostmanEnvironmentFile);
  const importWorkspaceFile = useWorkspaceStore((state) => state.importWorkspaceFile);
  const exportWorkspaceFile = useWorkspaceStore((state) => state.exportWorkspaceFile);
  const exportCollectionFile = useWorkspaceStore((state) => state.exportCollectionFile);
  const exportEnvironmentFile = useWorkspaceStore((state) => state.exportEnvironmentFile);

  const openImport = (target: ImportTarget) => {
    importTargetRef.current = target;
    fileInputRef.current?.click();
  };

  const onFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    const raw = await file.text();
    if (importTargetRef.current === "postman-collection") {
      importPostmanCollectionFile(raw);
    }
    if (importTargetRef.current === "postman-environment") {
      importPostmanEnvironmentFile(raw);
    }
    if (importTargetRef.current === "workspace") {
      importWorkspaceFile(raw);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="inline-actions">
      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
      />

      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" icon={<ArrowUpload24Regular />}>
            Import
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => openImport("postman-collection")}>Postman collection</MenuItem>
            <MenuItem onClick={() => openImport("postman-environment")}>Postman environment</MenuItem>
            <MenuItem onClick={() => openImport("workspace")}>GetMan workspace</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" icon={<ArrowDownload24Regular />}>
            Export
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => downloadJson("getman-workspace.json", exportWorkspaceFile())}>
              GetMan workspace
            </MenuItem>
            {workspace.collections.map((collection) => (
              <MenuItem
                key={collection.id}
                onClick={() =>
                  downloadJson(`${sanitizeFileName(collection.name)}.postman_collection.json`, exportCollectionFile(collection.id))
                }
              >
                {collection.name}
              </MenuItem>
            ))}
            {workspace.environments.map((environment) => (
              <MenuItem
                key={environment.id}
                onClick={() =>
                  downloadJson(
                    `${sanitizeFileName(environment.name)}.postman_environment.json`,
                    exportEnvironmentFile(environment.id)
                  )
                }
              >
                {environment.name}
              </MenuItem>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
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
