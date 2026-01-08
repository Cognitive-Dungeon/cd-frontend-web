import {FileJson, Focus, Hand, MessageCircle, Navigation, Sparkles, Sword, Zap,} from "lucide-react";
import {FC, useEffect, useRef} from "react";
import {createPortal} from "react-dom";

import {useContextMenuPosition} from "../hooks";
import {ContextMenuData, Entity, Position} from "../types";

interface ContextMenuProps {
  data: ContextMenuData;
  onClose: () => void;
  onSelectEntity?: (entityId: string | null) => void;
  onFollowEntity?: (entityId: string | null) => void;
  onSendCommand?: (action: string, payload?: any) => void;
  onSelectPosition?: (x: number, y: number) => void;
  onGoToPathfinding?: (position: Position) => void;
  onInspectEntity?: (entity: Entity) => void;
}

export const ContextMenu: FC<ContextMenuProps> = ({
  data,
  onClose,
  onSelectEntity,
  onFollowEntity,
  onSendCommand,
  onSelectPosition,
  onGoToPathfinding,
  onInspectEntity,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const position = useContextMenuPosition({
    initialPosition: { x: data.x, y: data.y },
    menuRef,
    isOpen: true,
    approximateSize: { width: 200, height: 400 },
  });

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      data-context-menu
      className="fixed bg-window-base border border-window-border rounded shadow-xl z-[9999] min-w-48 text-window-text"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="p-2 border-b border-window-border text-xs text-dock-text-dim">
        Клетка ({data.cellX}, {data.cellY})
      </div>

      {data.entities.length > 0 && (
        <div className="py-1">
          <div className="px-3 py-1 text-xs text-dock-text-dim uppercase">
            Сущности:
          </div>
          {data.entities.map((entity) => (
            <div
              key={entity.id}
              className="border-b border-window-border last:border-0"
            >
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-dock-item-hover flex items-center gap-2"
                onMouseDown={() => {
                  if (onSelectEntity) {
                    onSelectEntity(entity.id);
                  }
                  onClose();
                }}
              >
                <span className={`text-xl ${entity.color}`}>
                  {entity.symbol}
                </span>
                <span className="text-sm text-window-text">{entity.name}</span>
                {entity.label && (
                  <span className="ml-auto text-xs bg-log-combat px-1 rounded">
                    {entity.label}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-ui-tab-active-text flex items-center gap-1.5"
                onMouseDown={() => {
                  if (onFollowEntity) {
                    onFollowEntity(entity.id);
                  }
                  onClose();
                }}
              >
                <Focus className="w-3 h-3" />
                <span>Следить за {entity.name}</span>
              </button>
              <button
                type="button"
                className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-narrative flex items-center gap-1.5"
                onMouseDown={() => {
                  if (onInspectEntity) {
                    onInspectEntity(entity);
                  }
                  onClose();
                }}
              >
                <FileJson className="w-3 h-3" />
                <span>Открыть в редакторе</span>
              </button>

              <div className="border-t border-window-border mt-1 pt-1">
                <button
                  type="button"
                  className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-combat flex items-center gap-1.5"
                  onMouseDown={() => {
                    if (onSendCommand) {
                      onSendCommand("ATTACK", { targetId: entity.id });
                    }
                    onClose();
                  }}
                >
                  <Sword className="w-3 h-3" />
                  <span>Атаковать</span>
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-speech flex items-center gap-1.5"
                  onMouseDown={() => {
                    if (onSendCommand) {
                      onSendCommand("TALK", { targetId: entity.id });
                    }
                    onClose();
                  }}
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Поговорить</span>
                </button>
                {/* TODO: Uncomment when INSPECT is implemented on server
                <button
                  type="button"
                  className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-info flex items-center gap-1.5"
                  onMouseDown={() => {
                    if (onSendCommand) {
                      onSendCommand("INSPECT", { targetId: entity.id });
                    }
                    onClose();
                  }}
                >
                  <Eye className="w-3 h-3" />
                  <span>Осмотреть</span>
                </button>
                */}
                {entity.type === "ITEM" && (
                  <button
                    type="button"
                    className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-success flex items-center gap-1.5"
                    onMouseDown={() => {
                      if (onSendCommand) {
                        onSendCommand("PICKUP", { itemId: entity.id });
                      }
                      onClose();
                    }}
                  >
                    <Hand className="w-3 h-3" />
                    <span>Подобрать</span>
                  </button>
                )}
                <button
                  type="button"
                  className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-ui-tab-active-text flex items-center gap-1.5"
                  onMouseDown={() => {
                    if (onSendCommand) {
                      onSendCommand("INTERACT", { targetId: entity.id });
                    }
                    onClose();
                  }}
                >
                  <Hand className="w-3 h-3" />
                  <span>Взаимодействовать</span>
                </button>
                {/* TODO: Uncomment when TRADE is implemented on server
                <button
                  type="button"
                  className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-narrative flex items-center gap-1.5"
                  onMouseDown={() => {
                    if (onSendCommand) {
                      onSendCommand("TRADE", { targetId: entity.id });
                    }
                    onClose();
                  }}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Торговать</span>
                </button>
                */}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.entities.length === 0 && (
        <div className="px-3 py-2 text-sm text-dock-text-dim italic">
          Пустая клетка
        </div>
      )}

      <div className="border-t border-window-border py-1">
        <button
          type="button"
          className="w-full px-3 py-2 text-left text-xs hover:bg-dock-item-hover text-dock-text-dim"
          onMouseDown={() => {
            if (onSelectPosition) {
              onSelectPosition(data.cellX, data.cellY);
            }
            onClose();
          }}
        >
          Выбрать позицию
        </button>
        <button
          type="button"
          className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-success flex items-center gap-1.5"
          onMouseDown={() => {
            if (onGoToPathfinding) {
              onGoToPathfinding({
                x: data.cellX,
                y: data.cellY,
              });
            }
            onClose();
          }}
        >
          <Navigation className="w-3 h-3" />
          <span>Перейти к</span>
        </button>
        <button
          type="button"
          className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-ui-tab-active-text flex items-center gap-1.5"
          onMouseDown={() => {
            if (onSendCommand) {
              onSendCommand("TELEPORT", {
                x: data.cellX,
                y: data.cellY,
              });
            }
            onClose();
          }}
        >
          <Zap className="w-3 h-3" />
          <span>Телепорт</span>
        </button>
        <button
          type="button"
          className="w-full px-3 py-1 text-left text-xs hover:bg-dock-item-hover text-log-narrative flex items-center gap-1.5"
          onMouseDown={() => {
            if (onSendCommand) {
              onSendCommand("CAST_AREA", {
                x: data.cellX,
                y: data.cellY,
              });
            }
            onClose();
          }}
        >
          <Sparkles className="w-3 h-3" />
          <span>Заклинание на область</span>
        </button>
      </div>
    </div>,
    document.body,
  );
};
