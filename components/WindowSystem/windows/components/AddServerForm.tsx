import type {FC} from "react";

interface AddServerFormProps {
  newServerName: string;
  newServerHost: string;
  newServerPort: string;
  onNameChange: (value: string) => void;
  onHostChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const AddServerForm: FC<AddServerFormProps> = ({
  newServerName,
  newServerHost,
  newServerPort,
  onNameChange,
  onHostChange,
  onPortChange,
  onCancel,
  onSubmit,
}) => {
  const isValid = newServerName.trim() && newServerHost.trim();

  return (
    <div className="p-4 bg-window-content border-b border-window-border">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Server Name"
          value={newServerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="px-3 py-2 bg-ui-input-bg border border-ui-input-border rounded text-sm focus:outline-none focus:border-window-border-focus text-ui-input-text placeholder-ui-input-placeholder"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Host (e.g. localhost)"
            value={newServerHost}
            onChange={(e) => onHostChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-ui-input-bg border border-ui-input-border rounded text-sm focus:outline-none focus:border-window-border-focus text-ui-input-text placeholder-ui-input-placeholder"
          />
          <input
            type="number"
            placeholder="Port"
            value={newServerPort}
            onChange={(e) => onPortChange(e.target.value)}
            className="w-24 px-3 py-2 bg-ui-input-bg border border-ui-input-border rounded text-sm focus:outline-none focus:border-window-border-focus text-ui-input-text placeholder-ui-input-placeholder"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-ui-button-disabled-bg text-ui-button-disabled-text hover:bg-window-button-hover rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isValid}
            className="px-3 py-1 text-sm bg-ui-button-primary-bg text-ui-button-primary-text hover:bg-ui-button-primary-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
