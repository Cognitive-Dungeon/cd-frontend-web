import { useState, useCallback } from "react";
import { Server, Plus, RefreshCw } from "lucide-react";

import type { ServerInfo, ServerStatus } from "../../../../types/server";
import { ServerManager } from "../../../../types/server";

import { AddServerForm } from "./AddServerForm";
import { ServerListItem } from "./ServerListItem";

interface ServerSelectionWindowProps {
  onConnect: (server: ServerInfo) => void;
}

export const ServerSelectionWindow: React.FC<ServerSelectionWindowProps> = ({
  onConnect,
}) => {
  // Initialize state with loaded data
  const [servers, setServers] = useState<ServerInfo[]>(() =>
    ServerManager.getServers(),
  );
  const [statuses, setStatuses] = useState<Map<string, ServerStatus>>(() => {
    const loadedServers = ServerManager.getServers();
    const cachedStatuses = new Map<string, ServerStatus>();
    loadedServers.forEach((server) => {
      const cached = ServerManager.getCachedStatus(server.id);
      if (cached) {
        cachedStatuses.set(server.id, cached);
      }
    });
    return cachedStatuses;
  });
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    () => {
      const selectedId = ServerManager.getSelectedServerId();
      if (selectedId) {
        return selectedId;
      }
      const loadedServers = ServerManager.getServers();
      return loadedServers.length > 0 ? loadedServers[0].id : null;
    },
  );
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerHost, setNewServerHost] = useState("");
  const [newServerPort, setNewServerPort] = useState("8080");

  // Check single server availability
  const checkServer = useCallback(async (server: ServerInfo) => {
    setStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(server.id, {
        serverId: server.id,
        isAvailable: false,
        lastChecked: Date.now(),
      });
      return newMap;
    });

    const status = await ServerManager.checkServerAvailability(server);
    ServerManager.cacheStatus(status);

    setStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(server.id, status);
      return newMap;
    });
  }, []);

  // Check all servers
  const checkAllServers = useCallback(async () => {
    setIsCheckingAll(true);
    await Promise.all(servers.map((server) => checkServer(server)));
    setIsCheckingAll(false);
  }, [servers, checkServer]);

  // Add new server
  const handleAddServer = useCallback(() => {
    if (!newServerName.trim() || !newServerHost.trim()) {
      return;
    }

    const port = parseInt(newServerPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return;
    }

    const newServer = ServerManager.addServer({
      name: newServerName.trim(),
      host: newServerHost.trim(),
      port,
    });

    setServers((prev) => [...prev, newServer]);
    setNewServerName("");
    setNewServerHost("");
    setNewServerPort("8080");
    setShowAddForm(false);

    // Check new server
    checkServer(newServer);
  }, [newServerName, newServerHost, newServerPort, checkServer]);

  // Remove server
  const handleRemoveServer = useCallback(
    (serverId: string) => {
      ServerManager.removeServer(serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      setStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.delete(serverId);
        return newMap;
      });

      if (selectedServerId === serverId) {
        const remaining = servers.filter((s) => s.id !== serverId);
        if (remaining.length > 0) {
          setSelectedServerId(remaining[0].id);
        } else {
          setSelectedServerId(null);
        }
      }
    },
    [selectedServerId, servers],
  );

  // Connect to selected server
  const handleConnect = useCallback(() => {
    if (!selectedServerId) {
      return;
    }

    const server = servers.find((s) => s.id === selectedServerId);
    if (server) {
      ServerManager.setSelectedServerId(server.id);
      onConnect(server);
    }
  }, [selectedServerId, servers, onConnect]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <Server size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold">Server Selection</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkAllServers}
            disabled={isCheckingAll}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
            title="Refresh all servers"
          >
            <RefreshCw
              size={14}
              className={isCheckingAll ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={14} />
            Add Server
          </button>
        </div>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <AddServerForm
          newServerName={newServerName}
          newServerHost={newServerHost}
          newServerPort={newServerPort}
          onNameChange={setNewServerName}
          onHostChange={setNewServerHost}
          onPortChange={setNewServerPort}
          onCancel={() => setShowAddForm(false)}
          onSubmit={handleAddServer}
        />
      )}

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-4">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Server size={48} className="mb-2 opacity-50" />
            <p>No servers configured</p>
            <p className="text-sm">
              Click &quot;Add Server&quot; to get started
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {servers.map((server) => (
              <ServerListItem
                key={server.id}
                server={server}
                status={statuses.get(server.id)}
                isSelected={selectedServerId === server.id}
                onSelect={setSelectedServerId}
                onCheck={checkServer}
                onRemove={handleRemoveServer}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-700">
        <button
          onClick={handleConnect}
          disabled={!selectedServerId}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect to Server
        </button>
      </div>
    </div>
  );
};
