import {FC, useState} from "react";

interface LoginWindowProps {
  onConnect: (entityId: string) => void;
  isConnected: boolean;
  wsConnected?: boolean;
  loginError?: string | null;
}

export const LoginWindow: FC<LoginWindowProps> = ({
  onConnect,
  isConnected,
  wsConnected = false,
  loginError = null,
}) => {
  const [entityId, setEntityId] = useState("");

  const handleConnect = () => {
    const trimmedId = entityId.trim();
    if (trimmedId) {
      onConnect(trimmedId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!isConnected && wsConnected) {
        handleConnect();
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <label
          htmlFor="entity-id-input"
          className="block mb-3 font-semibold text-window-text text-base"
        >
          Entity ID:
        </label>
        <input
          id="entity-id-input"
          type="text"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isConnected || !wsConnected}
          placeholder={
            wsConnected ? "Enter your entity ID" : "Waiting for connection..."
          }
          className="w-full p-4 text-base border border-ui-input-border rounded-md bg-ui-input-bg text-ui-input-text outline-none box-border placeholder-ui-input-placeholder focus:border-window-border-focus transition-colors"
          autoFocus={wsConnected}
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={!entityId.trim() || isConnected || !wsConnected}
        className={`w-full p-4 text-base font-semibold rounded-md transition-all duration-200 ${
            !entityId.trim() || isConnected || !wsConnected
            ? "bg-ui-button-disabled-bg text-ui-button-disabled-text cursor-not-allowed opacity-60"
            : "bg-ui-button-primary-bg text-ui-button-primary-text hover:bg-ui-button-primary-hover cursor-pointer opacity-100"
        }`}
      >
        {isConnected
          ? "Authenticated"
          : !wsConnected
            ? "Waiting for connection..."
            : "Login"}
      </button>

      {isConnected && (
        <div className="mt-6 p-4 bg-green-900/40 border border-green-700/50 rounded-md text-green-400 text-sm font-medium">
          ✓ Authenticated as {entityId}
        </div>
      )}

      {loginError && !isConnected && (
        <div className="mt-6 p-4 bg-red-900/40 border border-red-700/50 rounded-md text-red-400 text-sm font-medium">
          ✗ {loginError}
        </div>
      )}
    </div>
  );
};
