import {AlertCircle, Wifi, WifiOff} from "lucide-react";
import type {FC} from "react";

import type {ServerStatus} from "../../../../types/server";

interface ServerStatusBadgeProps {
  status?: ServerStatus;
}

export const ServerStatusBadge: FC<ServerStatusBadgeProps> = ({ status }) => {
  if (!status) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        Unknown
      </span>
    );
  }

  if (status.isAvailable) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        {status.latency ? `${status.latency}ms` : ""}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      Offline
    </span>
  );
};
