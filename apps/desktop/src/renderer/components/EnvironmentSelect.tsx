import { Globe24Regular } from "@fluentui/react-icons";
import { Tooltip } from "@fluentui/react-components";
import { useWorkspaceStore } from "../store/workspaceStore";

export function EnvironmentSelect() {
  const environments = useWorkspaceStore((state) => state.workspace.environments);
  const activeEnvironmentId = useWorkspaceStore((state) => state.workspace.activeEnvironmentId);
  const setActiveEnvironment = useWorkspaceStore((state) => state.setActiveEnvironment);

  return (
    <label className="env-picker">
      <Tooltip content="Active environment" relationship="label">
        <Globe24Regular className="environment-icon" />
      </Tooltip>
      <select
        className="env-select"
        value={activeEnvironmentId ?? ""}
        onChange={(event) => setActiveEnvironment(event.target.value)}
        aria-label="Active environment"
      >
        {environments.map((environment) => (
          <option key={environment.id} value={environment.id}>
            {environment.name}
          </option>
        ))}
      </select>
    </label>
  );
}
