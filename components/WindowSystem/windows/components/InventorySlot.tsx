/**
 * InventorySlot Component
 *
 * Represents a single inventory slot with item display and interaction support.
 *
 * Features:
 * - Visual item display with icon, name, and quantity
 * - Drag-and-drop support (LMB)
 * - Context menu on right-click
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
 *   onContextMenu={(item, e) => showContextMenu(item, e)}
 *   onDragStart={(item) => setDraggedItem(item)}
 *   onDragEnd={() => setDraggedItem(null)}
 *   onDrop={(item) => handleItemSwap(item)}
 * />
 * ```
 */

import { FC, useState, DragEvent } from "react";

import { Item } from "../../../../types";

interface InventorySlotProps {
  item: Item | null;

  onContextMenu?: (item: Item, event: React.MouseEvent) => void;

  onDragStart?: (item: Item) => void;

  onDragEnd?: () => void;

  onDrop?: (item: Item) => void;

  className?: string;

  unavailable?: boolean;
}

export const InventorySlot: FC<InventorySlotProps> = ({
  item,

  onContextMenu,

  onDragStart,

  onDragEnd,

  onDrop,

  className,

  unavailable = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!item) {
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("itemId", item.id);
    onDragStart?.(item);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
    if (item && itemId !== item.id) {
      onDrop?.(item);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item) {
      onContextMenu?.(item, e);
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

  return (
    <div
      draggable={!!item && !unavailable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
  );
};
