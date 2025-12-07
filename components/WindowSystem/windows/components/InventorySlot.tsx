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
 * - Item type-based coloring and icons
 * - Tooltip with item info
 *
 * Item Icons:
 * - 🧪 POTION (green)
 * - ⚔️ WEAPON (red)
 * - 💰 GOLD (yellow)
 * - 📦 Default (gray)
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
}

export const InventorySlot: FC<InventorySlotProps> = ({
  item,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDrop,
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
    // TODO: Add proper icons/images based on item type
    switch (item.type) {
      case "POTION":
        return "!";
      case "WEAPON":
        return "/";
      case "GOLD":
        return "$";
      default:
        return "?";
    }
  };

  const getItemColor = (item: Item) => {
    switch (item.type) {
      case "POTION":
        return "text-green-400";
      case "WEAPON":
        return "text-red-400";
      case "GOLD":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      draggable={!!item}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      className={`
        relative w-16 h-16 border-2 rounded
        ${item ? "bg-neutral-800 border-neutral-600 cursor-move" : "bg-neutral-900/50 border-neutral-800"}
        ${isDragging ? "opacity-50" : ""}
        ${isOver ? "border-cyan-500 bg-cyan-900/20" : ""}
        hover:border-neutral-500
        transition-all duration-100
        flex items-center justify-center
        group
      `}
      title={
        item
          ? `${item.name}${item.description ? ` - ${item.description}` : ""}`
          : "Empty Slot"
      }
    >
      {item ? (
        <>
          <div className={`text-3xl ${getItemColor(item)}`}>
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
