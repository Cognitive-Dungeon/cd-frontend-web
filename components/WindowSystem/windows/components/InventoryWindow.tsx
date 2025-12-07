/**
 * InventoryWindow Component
 *
 * Displays player inventory in a grid layout with drag-and-drop support
 * and context menu actions (USE, DROP).
 *
 * Features:
 * - Grid layout (4 columns)
 * - Only shows filled slots
 * - Right-click context menu for USE/DROP actions
 * - Drag-and-drop visual feedback (infrastructure for future item swapping)
 * - Empty state when no items
 * - Target requirement detection
 *
 * TODOs:
 * - [ ] Implement server synchronization for real-time updates
 * - [ ] Add target selection UI for items requiring targets
 * - [ ] Create entity list window for drag-and-drop targets
 * - [ ] Implement item swapping between slots
 *
 * Usage:
 * ```tsx
 * <InventoryWindow
 *   items={player.inventory}
 *   onUseItem={(item, targetId) => sendCommand("USE", { name: item.name, targetId })}
 *   onDropItem={(item) => sendCommand("DROP", { name: item.name })}
 * />
 * ```
 */

import { Package, Trash2, Sparkles } from "lucide-react";
import { FC, useState, useRef, useEffect } from "react";

import { Item } from "../../../../types";

import { InventorySlot } from "./InventorySlot";

interface InventoryWindowProps {
  items: Item[];
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
}

interface ContextMenuState {
  item: Item;
  x: number;
  y: number;
}

export const InventoryWindow: FC<InventoryWindowProps> = ({
  items,
  onUseItem,
  onDropItem,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [contextMenu]);

  const handleContextMenu = (item: Item, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      item,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleUseItem = (item: Item) => {
    setContextMenu(null);

    // TODO: Server sync required - check item action type to determine if target is needed
    // For now, just call the handler
    if (item.action?.requiresTarget) {
      // TODO: Show target selection UI
      // This would need to integrate with the game's target selection system
      onUseItem?.(item);
    } else {
      onUseItem?.(item);
    }
  };

  const handleDropItem = (item: Item) => {
    setContextMenu(null);
    onDropItem?.(item);
  };

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // TODO: Implement drag to entity list window (when it's created)
  const handleDrop = (targetItem: Item) => {
    if (draggedItem && draggedItem.id !== targetItem.id) {
      // TODO: Implement item swap logic
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-gray-300 font-mono relative">
      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <Package size={48} className="mb-3 opacity-50" />
            <p className="text-sm">Your inventory is empty</p>
            <p className="text-xs mt-1">Pick up items to see them here</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {items.map((item) => (
              <InventorySlot
                key={item.id}
                item={item}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Count */}
      <div className="absolute bottom-2 right-2 text-gray-400 text-xs px-2 py-1 pointer-events-none">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-neutral-800 border border-neutral-600 rounded shadow-xl z-[10000] min-w-48"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="p-2 border-b border-neutral-700 text-xs text-gray-400">
            {contextMenu.item.name}
          </div>
          <div className="py-1">
            <button
              onClick={() => handleUseItem(contextMenu.item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-700 text-green-400 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Use</span>
              {contextMenu.item.action?.requiresTarget && (
                <span className="ml-auto text-xs text-gray-500">
                  (needs target)
                </span>
              )}
            </button>
            <button
              onClick={() => handleDropItem(contextMenu.item)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-700 text-red-400 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Drop</span>
            </button>
          </div>
          {contextMenu.item.description && (
            <div className="p-2 border-t border-neutral-700 text-xs text-gray-500 italic">
              {contextMenu.item.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
