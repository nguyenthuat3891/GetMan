import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";
import { Button, Tooltip } from "@fluentui/react-components";
import type { KeyValueRow } from "@core/types";
import { createKeyValueRow } from "@core/utils";

interface KeyValueEditorProps {
  rows: KeyValueRow[];
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  onChange: (rows: KeyValueRow[]) => void;
}

export function KeyValueEditor({
  rows,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  onChange
}: KeyValueEditorProps) {
  const updateRow = (rowId: string, patch: Partial<KeyValueRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const removeRow = (rowId: string) => {
    const next = rows.filter((row) => row.id !== rowId);
    onChange(next.length > 0 ? next : [createKeyValueRow()]);
  };

  return (
    <div className="kv-table">
      {rows.map((row) => (
        <div className="kv-row" key={row.id}>
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => updateRow(row.id, { enabled: event.target.checked })}
            aria-label="Enable row"
          />
          <input
            className="form-control"
            value={row.key}
            placeholder={keyPlaceholder}
            onChange={(event) => updateRow(row.id, { key: event.target.value })}
          />
          <input
            className="form-control"
            value={row.value}
            placeholder={valuePlaceholder}
            onChange={(event) => updateRow(row.id, { value: event.target.value })}
          />
          <Tooltip content="Remove row" relationship="label">
            <button type="button" className="icon-only" onClick={() => removeRow(row.id)}>
              <Delete24Regular />
            </button>
          </Tooltip>
        </div>
      ))}

      <div>
        <Button appearance="subtle" icon={<Add24Regular />} onClick={() => onChange([...rows, createKeyValueRow()])}>
          Add row
        </Button>
      </div>
    </div>
  );
}
