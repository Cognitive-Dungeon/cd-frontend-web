/**
 * InventorySlot Component
 *
 * Represents a single inventory slot with item display and interaction support.
 *
 * Features:
 * - Visual item display with icon, name, and quantity
 * - Drag-and-drop support (LMB)
 * - Inline context menu on right-click
 * - Visual states: normal, hover, dragging, drop target
 * - Server-driven item symbols and colors
 * - Tooltip with item info
 *
 * Item Display:
 * - Uses `item.symbol` from server (e.g., "†", "!", "$")
 * - Uses `item.color` from server (e.g., "#C0C0C0", "#FFD700")
 * - Fallback: "?" symbol with gray color if not provided
 *
 * Usage:
 * ```tsx
 * <InventorySlot
 *   item={item}
 *   onUse={(item) => handleUse(item)}
 *   onEquip={(item) => handleEquip(item)}
 *   onDrop={(item) => handleDrop(item)}
 *   onInspect={(item) => handleInspect(item)}
 *   isEquipped={true}
 *   onDragStart={(item) => setDraggedItem(item)}
 *   onDragEnd={() => setDraggedItem(null)}
 * />
 * ```
 */

import {Search, Shield, ShieldOff, Sparkles, Trash2} from "lucide-react";
import {DragEvent, FC, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import {useContextMenuPosition} from "../../../../hooks";
import {Item} from "../../../../types";

interface InventorySlotProps {
  item: Item | null;

  onUse?: (item: Item) => void;
  onEquip?: (item: Item) => void;
  onUnequip?: (item: Item) => void;
  onDrop?: (item: Item) => void;
  onInspect?: (item: Item) => void;

  isEquipped?: boolean;

  onDragStart?: (item: Item) => void;

  onDragEnd?: () => void;

  onDropOnSlot?: (item: Item) => void;

  className?: string;

  unavailable?: boolean;
}

export const InventorySlot: FC<InventorySlotProps> = ({
  item,

  onUse,
  onEquip,
  onUnequip,
  onDrop,
  onInspect,

  isEquipped = false,

  onDragStart,

  onDragEnd,

  onDropOnSlot,

  className,

  unavailable = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [initialMenuPosition, setInitialMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  const menuPosition = useContextMenuPosition({
    initialPosition: initialMenuPosition,
    menuRef: contextMenuRef,
    isOpen: showContextMenu,
    approximateSize: { width: 160, height: 200 },
  });

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showContextMenu]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!item) {
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("itemId", item.id);
    // Store source information for drop handling
    e.dataTransfer.setData(
      "dragSource",
      onDropOnSlot ? "inventory" : "quickaccess",
    );
    onDragStart?.(item);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Don't stopPropagation - allow parent wrappers to handle drag events
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const itemId = e.dataTransfer.getData("itemId");

    // Allow drop if:
    // 1. Dropping on empty slot (item is null/undefined) OR
    // 2. Dropping on different item (item exists and IDs don't match)
    if (!item || (item && itemId !== item.id)) {
      onDropOnSlot?.(item);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item && !unavailable) {
      if (!showContextMenu && slotRef.current) {
        const rect = slotRef.current.getBoundingClientRect();
        setInitialMenuPosition({
          x: rect.right + 8,
          y: rect.top,
        });
      }
      setShowContextMenu(!showContextMenu);
    }
  };

  const handleUse = () => {
    if (item) {
      onUse?.(item);
      setShowContextMenu(false);
    }
  };

  const handleEquip = () => {
    if (item) {
      onEquip?.(item);
      setShowContextMenu(false);
    }
  };

  const handleUnequip = () => {
    if (item) {
      onUnequip?.(item);
      setShowContextMenu(false);
    }
  };

  const handleDropItem = () => {
    if (item) {
      onDrop?.(item);
      setShowContextMenu(false);
    }
  };

  const handleInspect = () => {
    if (item) {
      onInspect?.(item);
      setShowContextMenu(false);
    }
  };

  const getItemIcon = (item: Item) => {
    // Use symbol from server data
    return item.symbol || "?";
  };

  const getItemColor = (item: Item) => {
    // Use color from server data, fallback to gray
    return item.color || "#9CA3AF";
  };

  const handleClick = (e: React.MouseEvent) => {
    if (item && !unavailable && onUse) {
      e.preventDefault();
      e.stopPropagation();
      onUse(item);
    }
  };

  return (
    <>
      <div
        ref={slotRef}
        data-inventory-slot="true"
        draggable={!!item && !unavailable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`

        relative w-16 h-16 border-2 rounded

        ${item ? "bg-neutral-800 border-neutral-600 cursor-move" : "bg-transparent border-neutral-800/50"}

        ${isDragging ? "opacity-50" : ""}

        ${isOver ? "border-cyan-500 bg-cyan-900/20" : ""}

        ${unavailable ? "opacity-40 cursor-not-allowed" : "hover:border-neutral-500"}

        transition-all duration-100

        flex items-center justify-center

        group

        ${className ?? ""}
      `}
        title={
          item
            ? `${item.name}${item.description ? ` - ${item.description}` : ""}${unavailable ? " (Not in inventory)" : ""}`
            : "Empty Slot"
        }
      >
        {item ? (
          <>
            <div
              className={`text-3xl ${unavailable ? "grayscale" : ""}`}
              style={{ color: getItemColor(item) }}
            >
              {getItemIcon(item)}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[8px] text-center px-1 py-0.5 truncate">
              {item.name}
            </div>
            {item.value > 1 && item.type === "GOLD" && (
              <div className="absolute top-1 right-1 bg-yellow-600 text-white text-[10px] font-bold px-1 rounded">
                {item.value}
              </div>
            )}
            <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors rounded pointer-events-none" />
          </>
        ) : (
          <div className="text-neutral-700 text-2xl">+</div>
        )}
      </div>

      {/* Context Menu via Portal */}
      {showContextMenu &&
        item &&
        createPortal(
          <div
            ref={contextMenuRef}
            className="fixed bg-neutral-800 border border-neutral-600 rounded shadow-xl z-[10000] min-w-40"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            data-interactive="true"
          >
            <div className="p-1.5 border-b border-neutral-700 text-[10px] text-gray-400 truncate">
              {item.name}
            </div>
            <div className="py-1">
              {onUse && (
                <button
                  onClick={handleUse}
                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-neutral-700 text-green-400 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use</span>
                </button>
              )}
              {isEquipped
                ? onUnequip && (
                    <button
                      onClick={handleUnequip}
                      className="w-full px-2 py-1.5 text-left text-xs hover:bg-neutral-700 text-yellow-400 flex items-center gap-1.5"
                    >
                      <ShieldOff className="w-3 h-3" />
                      <span>Unequip</span>
                    </button>
                  )
                : onEquip && (
                    <button
                      onClick={handleEquip}
                      className="w-full px-2 py-1.5 text-left text-xs hover:bg-neutral-700 text-cyan-400 flex items-center gap-1.5"
                    >
                      <Shield className="w-3 h-3" />
                      <span>Equip</span>
                    </button>
                  )}
              {onDrop && (
                <button
                  onClick={handleDropItem}
                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-neutral-700 text-red-400 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Drop</span>
                </button>
              )}
              {onInspect && (
                <button
                  onClick={handleInspect}
                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-neutral-700 text-purple-400 flex items-center gap-1.5"
                >
                  <Search className="w-3 h-3" />
                  <span>Open in Inspector</span>
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
