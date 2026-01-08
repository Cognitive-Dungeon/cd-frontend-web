import { Plus, RefreshCw, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { ServerInfo, ServerStatus, ServerVersionInfo } from "../../../../types/server";
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
  const [versions, setVersions] = useState<Map<string, ServerVersionInfo>>(new Map());
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

  // --- LOGIC ---

  // Check single server availability AND version
  const checkServer = useCallback(async (server: ServerInfo) => {
    // 1. Сбрасываем текущий статус на "проверяется" (визуально можно обыграть в item)
    setStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(server.id, {
        serverId: server.id,
        isAvailable: false,
        lastChecked: Date.now(),
      });
      return newMap;
    });

    // 2. Сначала проверяем WebSocket (для Latency), это важнее для игры
    const status = await ServerManager.checkServerAvailability(server);
    ServerManager.cacheStatus(status);

    setStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(server.id, status);
      return newMap;
    });

    // 3. Если сервер жив (WebSocket ответил), запрашиваем версию через HTTP
    if (status.isAvailable) {
      try {
        const versionInfo = await ServerManager.getServerVersion(server);

        setVersions((prev) => {
          const newMap = new Map(prev);
          newMap.set(server.id, versionInfo);
          return newMap;
        });
      } catch (error) {
        console.warn(`Could not fetch version for server ${server.name}`, error);
      }
    }
  }, []);

  // Check all servers
  const checkAllServers = useCallback(async () => {
    setIsCheckingAll(true);
    setVersions(new Map());
    await Promise.all(servers.map((server) => checkServer(server)));
    setIsCheckingAll(false);
  }, [servers, checkServer]);

  // Check all servers on mount
  useEffect(() => {
    checkAllServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setVersions((prev) => {
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
    <div 
      className="relative flex flex-col h-full bg-window-base text-window-text"
      style={{
        backgroundImage: "url('/assets/images/server_selection_background.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
      }}
    >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
      
      {/* Content wrapper with relative positioning */}
      <div className="relative flex flex-col h-full">

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
          <div className="flex flex-col items-center justify-center h-full text-dock-text-dim">
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
                version={versions.get(server.id)}
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
      <div className="p-4 border-t border-window-border flex flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
            <button
              onClick={checkAllServers}
              disabled={isCheckingAll}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-ui-button-disabled-bg text-ui-button-disabled-text hover:bg-window-button-hover rounded transition-colors disabled:opacity-50"
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
              className="flex items-center gap-1 px-3 py-1 text-sm bg-ui-button-primary-bg text-ui-button-primary-text hover:bg-ui-button-primary-hover rounded transition-colors"
            >
              <Plus size={14} />
              Add Server
            </button>
        </div>
        <button
          onClick={handleConnect}
          disabled={!selectedServerId}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-ui-button-primary-bg text-ui-button-primary-text hover:bg-ui-button-primary-hover rounded transition-colors"
        >
          Connect to Server
        </button>
      </div>
      </div>
    </div>
  );
};