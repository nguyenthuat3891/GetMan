import Editor from "@monaco-editor/react";
import type { ApiRequest, BodyType } from "@core/types";
import { KeyValueEditor } from "./KeyValueEditor";

interface BodyEditorProps {
  request: ApiRequest;
  onChange: (request: ApiRequest) => void;
}

const bodyTypes: BodyType[] = ["none", "json", "text", "xml", "form-data", "urlencoded", "binary"];

export function BodyEditor({ request, onChange }: BodyEditorProps) {
  const setBody = (patch: Partial<ApiRequest["body"]>) => {
    onChange({ ...request, body: { ...request.body, ...patch } });
  };

  const onBinaryChange = (file: File | null) => {
    if (!file) {
      setBody({ binary: null });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBody({
        binary: {
          name: file.name,
          mediaType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl: String(reader.result)
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="body-toolbar">
        <select
          className="body-select"
          value={request.body.type}
          onChange={(event) => setBody({ type: event.target.value as BodyType })}
          aria-label="Body type"
        >
          {bodyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <span className="small-text muted">
          {request.body.type === "none" ? "No request body" : request.body.type}
        </span>
      </div>

      {["json", "text", "xml"].includes(request.body.type) && (
        <div className="monaco-box">
          <Editor
            height="330px"
            defaultLanguage={request.body.type === "xml" ? "xml" : request.body.type === "text" ? "plaintext" : "json"}
            language={request.body.type === "xml" ? "xml" : request.body.type === "text" ? "plaintext" : "json"}
            value={request.body.raw}
            onChange={(value) => { if (value !== undefined && value !== request.body.raw) setBody({ raw: value }); }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true
            }}
          />
        </div>
      )}

      {request.body.type === "form-data" && (
        <KeyValueEditor
          rows={request.body.formData}
          keyPlaceholder="Field"
          valuePlaceholder="Value"
          onChange={(formData) => setBody({ formData })}
        />
      )}

      {request.body.type === "urlencoded" && (
        <KeyValueEditor
          rows={request.body.urlencoded}
          keyPlaceholder="Field"
          valuePlaceholder="Value"
          onChange={(urlencoded) => setBody({ urlencoded })}
        />
      )}

      {request.body.type === "binary" && (
        <label className="binary-drop">
          <input
            className="file-input"
            type="file"
            onChange={(event) => onBinaryChange(event.target.files?.[0] ?? null)}
          />
          {request.body.binary
            ? `${request.body.binary.name} (${Math.ceil(request.body.binary.size / 1024)} KB)`
            : "Choose binary file"}
        </label>
      )}

      {request.body.type === "none" && <div className="empty-state">No body.</div>}
    </div>
  );
}
