import {Check, RefreshCw, Trash2} from "lucide-react";
import type {FC} from "react";

import {ServerInfo, ServerManager, ServerStatus, ServerVersionInfo} from "../../../../types/server";

import {ServerStatusBadge} from "./ServerStatusBadge";

interface ServerListItemProps {
  server: ServerInfo;
  status?: ServerStatus;
  version?: ServerVersionInfo;
  isSelected: boolean;
  onSelect: (serverId: string) => void;
  onCheck: (server: ServerInfo) => void;
  onRemove: (serverId: string) => void;
}

export const ServerListItem: FC<ServerListItemProps> = ({
  server,
  status,
  version,
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
          : " border-neutral-700 hover:border-neutral-600"
      }`}
    >
      {/* Selected Indicator */}
      {/* {isSelected && (
        <div className="absolute top-2 right-2">z
          <Check size={16} className="text-blue-400" />
        </div>
      )} */}

      {/* Server Info */}
      <div className="flex items-start justify-between">
        <div className="flex-1 overflow-hidden"> {/* overflow-hidden для truncate */}
          <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{server.name}</h3>
            {/* {server.isDefault && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded shrink-0">
                DEFAULT
              </span>
            )} */}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {server.host}:{server.port}
          </p>

          {/* === ОТОБРАЖЕНИЕ ВЕРСИИ === */}
          {version && status?.isAvailable && (
            <p
              className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate"
              title={`Commit: ${version.Commit}\nBranch: ${version.Branch}`}
            >
              {ServerManager.formatVersionString(version)}
            </p>
          )}
          {(!version || !status?.isAvailable) && (
            <p
              className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate"
            >
              No build information available
            </p>
          )}
        </div>
        <div className="h-full flex flex-col items-end justify-between">
          <ServerStatusBadge status={status} />
          <div className="flex items-end justify-between">

              <div className="flex items-center gap-2">
                {!server.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(server.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                    title="Remove server"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                
              </div>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
    </div>
  );
};
