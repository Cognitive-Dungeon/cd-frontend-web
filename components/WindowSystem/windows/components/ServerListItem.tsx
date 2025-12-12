import type { FC } from "react";
import { Check, RefreshCw, Trash2 } from "lucide-react";

import type { ServerInfo, ServerStatus } from "../../../../types/server";

import { ServerStatusBadge } from "./ServerStatusBadge";

interface ServerListItemProps {
  server: ServerInfo;
  status?: ServerStatus;
  isSelected: boolean;
  onSelect: (serverId: string) => void;
  onCheck: (server: ServerInfo) => void;
  onRemove: (serverId: string) => void;
}

export const ServerListItem: FC<ServerListItemProps> = ({
  server,
  status,
  isSelected,
  onSelect,
  onCheck,
  onRemove,
}) => {
  return (
    <div
      onClick={() => onSelect(server.id)}
      className={`relative p-4 rounded border cursor-pointer transition-all ${
        isSelected
          ? "bg-blue-900/30 border-blue-500"
          : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
      }`}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check size={16} className="text-blue-400" />
        </div>
      )}

      {/* Server Info */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{server.name}</h3>
            {server.isDefault && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded">
                DEFAULT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {server.host}:{server.port}
          </p>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <ServerStatusBadge status={status} />
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheck(server);
            }}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
            title="Check server"
          >
            <RefreshCw size={14} />
          </button>
          {!server.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(server.id);
              }}
              className="p-1 hover:bg-red-900 hover:text-red-400 rounded transition-colors"
              title="Remove server"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
