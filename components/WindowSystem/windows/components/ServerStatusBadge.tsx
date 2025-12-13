import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import type { FC } from "react";

import type { ServerStatus } from "../../../../types/server";

interface ServerStatusBadgeProps {
  status?: ServerStatus;
}

export const ServerStatusBadge: FC<ServerStatusBadgeProps> = ({ status }) => {
  if (!status) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <AlertCircle size={12} />
        Unknown
      </span>
    );
  }

  if (status.isAvailable) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <Wifi size={12} />
        Online {status.latency ? `(${status.latency}ms)` : ""}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <WifiOff size={12} />
      Offline
    </span>
  );
};
