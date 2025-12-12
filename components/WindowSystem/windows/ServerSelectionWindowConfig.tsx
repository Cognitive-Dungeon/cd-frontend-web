import { Server } from "lucide-react";

import { ServerInfo } from "../../../types/server";
import { WindowConfig } from "../types";

import { ServerSelectionWindow } from "./components/ServerSelectionWindow";

export const SERVER_SELECTION_WINDOW_ID = "server-selection";

interface CreateServerSelectionWindowConfigProps {
  onConnect: (server: ServerInfo) => void;
}

export const createServerSelectionWindowConfig = ({
  onConnect,
}: CreateServerSelectionWindowConfigProps): WindowConfig => {
  return {
    id: SERVER_SELECTION_WINDOW_ID,
    title: "Connect to Server",
    icon: <Server size={16} />,
    defaultPosition: {
      x: window.innerWidth / 2 - 300,
      y: window.innerHeight / 2 - 250,
    },
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 500, height: 400 },
    closeable: false,
    minimizable: false,
    resizable: true,
    showInDock: false,
    decorated: true,
    content: <ServerSelectionWindow onConnect={onConnect} />,
  };
};
