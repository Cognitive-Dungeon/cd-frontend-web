import { Code, MapPin, Send } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";

import { LogMessage, LogType, Position } from "../../../../types";
import { useWindowContext } from "../../Window";

interface GameLogWindowProps {
  logs: LogMessage[];
  onGoToPosition?: (position: Position) => void;
  onGoToEntity?: (entityId: string) => void;
  onSendCommand?: (text: string, type: "SAY" | "WHISPER" | "YELL") => void;
}

type LogFilter = "ALL" | "COMBAT" | "NARRATIVE" | "CHAT" | "SYSTEM";

export const GameLogWindow: React.FC<GameLogWindowProps> = ({
  logs,
  onGoToPosition,
  onGoToEntity,
  onSendCommand,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<LogFilter>("ALL");
  const [inputValue, setInputValue] = useState("");
  const [messageType, setMessageType] = useState<"SAY" | "WHISPER" | "YELL">(
    "SAY",
  );

  const { isMinimized } = useWindowContext();
  const [transientLogs, setTransientLogs] = useState<LogMessage[]>([]);
  const lastLogIdRef = useRef<string | null>(null);

  // Handle transient logs
  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      if (lastLog.id !== lastLogIdRef.current) {
        if (isMinimized) {
          setTimeout(() => {
            setTransientLogs((prev) => [...prev, lastLog]);
          }, 0);
          setTimeout(() => {
            setTransientLogs((prev) => prev.filter((l) => l.id !== lastLog.id));
          }, 5000);
        }
        lastLogIdRef.current = lastLog.id;
      }
    }
  }, [logs, isMinimized]);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, activeFilter]);

  // Handle clicks on interactive elements in logs
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Click on entity
      const entityId = target.getAttribute("data-entity-id");
      if (entityId && onGoToEntity) {
        onGoToEntity(entityId);
        return;
      }

      // Click on position
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
      case LogType.SUCCESS:
        return "text-green-400";
      case LogType.INFO:
      default:
        return "text-gray-400";
    }
  };

  const filteredLogs = useMemo(() => {
    if (activeFilter === "ALL") {
      return logs;
    }
    return logs.filter((log) => {
      switch (activeFilter) {
        case "COMBAT":
          return log.type === LogType.COMBAT;
        case "NARRATIVE":
          return log.type === LogType.NARRATIVE;
        case "CHAT":
          return log.type === LogType.SPEECH;
        case "SYSTEM":
          return (
            log.type === LogType.INFO ||
            log.type === LogType.ERROR ||
            log.type === LogType.COMMAND ||
            log.type === LogType.SUCCESS
          );
        default:
          return true;
      }
    });
  }, [logs, activeFilter]);

  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }
    onSendCommand?.(inputValue, messageType);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col ${isMinimized ? "h-auto bg-transparent" : "h-full bg-neutral-950"} font-mono text-sm overflow-hidden`}
    >
      {/* Logs Area */}
      {!isMinimized ? (
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto space-y-2 p-2"
        >
          {filteredLogs.map((log) => (
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
                  {log.type === LogType.SPEECH && (
                    <span className="mr-2">💬</span>
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
      ) : (
        <div className="flex flex-col space-y-1 p-2 min-h-0">
          {transientLogs.map((log) => (
            <div
              key={log.id}
              className={`${getLogColor(log.type)} text-xs break-words p-1`}
            >
              <span dangerouslySetInnerHTML={{ __html: log.text }} />
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        className={`border-t border-neutral-800 ${isMinimized ? "bg-transparent" : "bg-neutral-900"} p-2`}
      >
        <div className="flex gap-2">
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as any)}
            className="bg-neutral-800 text-gray-300 text-xs rounded px-2 py-1 border border-neutral-700 outline-none focus:border-neutral-500"
          >
            <option value="SAY">Say</option>
            <option value="WHISPER">Whisper</option>
            <option value="YELL">Yell</option>
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command or message..."
              className="w-full bg-neutral-800 text-gray-200 text-sm rounded px-3 py-1.5 border border-neutral-700 outline-none focus:border-neutral-500 pr-8"
            />
            <button
              onClick={handleSend}
              className="absolute right-1.5 top-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className={`flex border-t border-neutral-800 ${isMinimized ? "bg-transparent" : "bg-neutral-900"}`}
      >
        {(["ALL", "COMBAT", "NARRATIVE", "CHAT", "SYSTEM"] as LogFilter[]).map(
          (filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                activeFilter === filter
                  ? "text-white border-cyan-500 bg-neutral-800"
                  : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-neutral-800"
              }`}
            >
              {filter}
            </button>
          ),
        )}
      </div>
    </div>
  );
};
