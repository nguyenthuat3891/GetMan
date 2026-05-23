import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";
import { Button, Tooltip } from "@fluentui/react-components";
import type { ResponseChainRule } from "@core/types";
import { createId } from "@core/utils";

interface ResponseChainEditorProps {
  rows: ResponseChainRule[];
  onChange: (rows: ResponseChainRule[]) => void;
}

export function ResponseChainEditor({ rows, onChange }: ResponseChainEditorProps) {
  const updateRow = (rowId: string, patch: Partial<ResponseChainRule>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const removeRow = (rowId: string) => {
    onChange(rows.filter((row) => row.id !== rowId));
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: createId("chain"),
        enabled: true,
        name: "Capture value",
        path: "$.",
        variableName: ""
      }
    ]);
  };

  return (
    <div className="kv-table">
      {rows.map((row) => (
        <div className="kv-row chain-row" key={row.id}>
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => updateRow(row.id, { enabled: event.target.checked })}
            aria-label="Enable chain rule"
          />
          <input
            className="form-control"
            value={row.name}
            placeholder="Name"
            onChange={(event) => updateRow(row.id, { name: event.target.value })}
          />
          <input
            className="form-control"
            value={row.path}
            placeholder="$.data.id"
            onChange={(event) => updateRow(row.id, { path: event.target.value })}
          />
          <input
            className="form-control"
            value={row.variableName}
            placeholder="variableName"
            onChange={(event) => updateRow(row.id, { variableName: event.target.value })}
          />
          <Tooltip content="Remove chain rule" relationship="label">
            <button type="button" className="icon-only" onClick={() => removeRow(row.id)}>
              <Delete24Regular />
            </button>
          </Tooltip>
        </div>
      ))}

      <div>
        <Button appearance="subtle" icon={<Add24Regular />} onClick={addRow}>
          Add rule
        </Button>
      </div>
    </div>
  );
}
