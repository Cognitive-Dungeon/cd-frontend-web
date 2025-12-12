import type { FC } from "react";

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
    <div className="p-4 bg-neutral-800 border-b border-neutral-700">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Server Name"
          value={newServerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Host (e.g. localhost)"
            value={newServerHost}
            onChange={(e) => onHostChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Port"
            value={newServerPort}
            onChange={(e) => onPortChange(e.target.value)}
            className="w-24 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isValid}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
