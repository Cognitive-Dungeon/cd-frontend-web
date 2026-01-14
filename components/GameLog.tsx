import {Code, MapPin} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import {LogMessage, LogType, Position} from "../types";

interface GameLogProps {
  logs: LogMessage[];
  onGoToPosition?: (position: Position) => void;
  onGoToEntity?: (entityId: string) => void;
}

const GameLog: React.FC<GameLogProps> = ({
  logs,
  onGoToPosition,
  onGoToEntity,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Обработчик кликов по кликабельным элементам в тексте
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) {return;}

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Клик по сущности
      const entityId = target.getAttribute("data-entity-id");
      if (entityId && onGoToEntity) {
        onGoToEntity(entityId);
        return;
      }

      // Клик по позиции
      const posX = target.getAttribute("data-position-x");
      const posY = target.getAttribute("data-position-y");
      if (posX && posY && onGoToPosition) {
        onGoToPosition({ x: parseInt(posX), y: parseInt(posY) });
        return;
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [onGoToPosition, onGoToEntity]);

  const toggleJsonView = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const getLogColor = (type: LogType) => {
    switch (type) {
    case LogType.COMBAT:
      return "text-red-400";
    case LogType.NARRATIVE:
      return "text-purple-400 italic";
    case LogType.SPEECH:
      return "text-yellow-300";
    case LogType.ERROR:
      return "text-red-600 font-bold";
    case LogType.COMMAND:
      return "text-cyan-600 font-bold";
    case LogType.INFO:
    default:
      return "text-gray-400";
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 p-4 font-mono text-sm overflow-hidden game-log-container">
      <div className="mb-2 text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1">
        Журнал Приключений
      </div>
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2"
      >
        {logs.map((log) => (
          <div key={log.id} className="space-y-1">
            <div
              className={`${getLogColor(log.type)} break-words leading-tight flex items-start justify-between group`}
            >
              <div className="flex-1">
                {log.type !== LogType.COMMAND && (
                  <span className="opacity-30 mr-2 text-xs select-none">
                    [
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                    ]
                  </span>
                )}
                {log.type === LogType.NARRATIVE && (
                  <span className="mr-1">◈</span>
                )}
                {log.type === LogType.COMMAND && (
                  <span className="mr-2 text-gray-600">{">"}</span>
                )}
                <span dangerouslySetInnerHTML={{ __html: log.text }} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {log.playerPosition && onGoToPosition && (
                  <button
                    onClick={() => onGoToPosition(log.playerPosition!)}
                    className="p-1 rounded hover:bg-neutral-800"
                    title={`Перейти к позиции игрока (${log.playerPosition.x}, ${log.playerPosition.y})`}
                  >
                    <MapPin size={14} className="text-blue-400" />
                  </button>
                )}
                {log.commandData && (
                  <button
                    onClick={() => toggleJsonView(log.id)}
                    className="p-1 rounded hover:bg-neutral-800"
                    title="Показать JSON"
                  >
                    <Code size={14} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            {log.commandData && expandedLogId === log.id && (
              <div className="ml-6 p-2 bg-neutral-900 rounded border border-neutral-700 text-xs font-mono text-gray-400">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(log.commandData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default GameLog;
