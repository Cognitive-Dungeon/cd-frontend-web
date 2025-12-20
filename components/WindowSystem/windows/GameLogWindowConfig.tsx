import {MessageSquare} from "lucide-react";

import {LogMessage, Position} from "../../../types";
import {WindowConfig} from "../types";

import {GameLogWindow} from "./components/GameLogWindow";

export const GAME_LOG_WINDOW_ID = "game-log-window";

interface CreateGameLogWindowConfigProps {
  logs: LogMessage[];
  onGoToPosition?: (position: Position) => void;
  onGoToEntity?: (entityId: string) => void;
  onSendCommand?: (text: string, type: "SAY" | "WHISPER" | "YELL") => void;
}

export const createGameLogWindowConfig = ({
  logs,
  onGoToPosition,
  onGoToEntity,
  onSendCommand,
}: CreateGameLogWindowConfigProps): WindowConfig => {
  return {
    id: GAME_LOG_WINDOW_ID,
    title: "Game Log",
    icon: <MessageSquare size={16} />,
    defaultOrigin: { x: 0, y: 0 }, // top-left corner of window
    defaultPosition: { x: 0.02, y: 0.4 }, // left side, slightly below middle of viewport
    defaultSize: { width: 450, height: 300 },
    minSize: { width: 300, height: 200 },
    closeable: false,
    minimizable: true,
    minimizeBehavior: "collapse",
    resizable: true,
    showInDock: true,
    decorated: true,
    content: (
      <GameLogWindow
        logs={logs}
        onGoToPosition={onGoToPosition}
        onGoToEntity={onGoToEntity}
        onSendCommand={onSendCommand}
      />
    ),
  };
};
