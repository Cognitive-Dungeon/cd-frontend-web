/**
 * InventoryWindow Component
 *
 * Displays player inventory in a grid layout with drag-and-drop support
 * and context menu actions (USE, DROP, EQUIP).
 *
 * Features:
 * - Grid layout (4 columns)
 * - Only shows filled slots
 * - Right-click context menu for USE/DROP/EQUIP actions
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
 *   onEquipItem={(item) => sendCommand("EQUIP", { itemId: item.id })}
 * />
 * ```
 */

import {Package} from "lucide-react";
import {FC, useEffect, useState} from "react";

import {Item, ServerToClientEquipmentView} from "../../../../types";

import {InventorySlot} from "./InventorySlot";

interface InventoryWindowProps {
  items: Item[];
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  onInspectItem?: (item: Item) => void;
  inventoryData?: {
    maxSlots?: number;
    currentWeight?: number;
    maxWeight?: number;
  } | null;
  equipment?: ServerToClientEquipmentView | null;
}

export const InventoryWindow: FC<InventoryWindowProps> = ({
  items,
  onUseItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onInspectItem,
  inventoryData,
  equipment,
}) => {
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  // Global drop listener to handle drops on game grid
  useEffect(() => {
    const handleGlobalDrop = (e: globalThis.DragEvent) => {
      const target = e.target as HTMLElement;
      const isOnSlot = target.closest("[data-inventory-slot]");
      const isOnGameGrid = target.closest("[data-game-grid]");

      if (!isOnSlot && isOnGameGrid && draggedItem) {
        onDropItem?.(draggedItem);
        setDraggedItem(null);
      }
    };

    window.addEventListener("drop", handleGlobalDrop as EventListener);
    return () =>
      window.removeEventListener("drop", handleGlobalDrop as EventListener);
  }, [draggedItem, onDropItem]);

  const handleUseItem = (item: Item) => {
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

  const handleEquipItem = (item: Item) => {
    onEquipItem?.(item);
  };

  const handleUnequipItem = (item: Item) => {
    onUnequipItem?.(item);
  };

  const isItemEquipped = (item: Item): boolean => {
    if (!equipment) {
      return false;
    }
    return equipment.weapon?.id === item.id || equipment.armor?.id === item.id;
  };

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div
      className="flex flex-col h-full bg-window-content text-window-text font-mono relative"
      onDragOver={handleDragOver}
    >
      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dock-text-dim">
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
                onUse={handleUseItem}
                onEquip={handleEquipItem}
                onUnequip={handleUnequipItem}
                onInspect={onInspectItem}
                isEquipped={isItemEquipped(item)}
                onDragStart={(itm) => handleDragStart(itm)}
                onDragEnd={() => handleDragEnd()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inventory Stats Footer */}
      <div className="border-t border-window-border px-4 py-2 bg-window-content">
        <div className="flex items-center justify-between text-xs text-dock-text-dim">
          <div className="flex items-center gap-4">
            <span>
              Items: {items.length}
              {inventoryData?.maxSlots && ` / ${inventoryData.maxSlots}`}
            </span>
            {inventoryData?.currentWeight !== undefined && (
              <span>
                Weight: {inventoryData.currentWeight}
                {inventoryData?.maxWeight && ` / ${inventoryData.maxWeight}`}
              </span>
            )}
          </div>
          {inventoryData?.maxWeight !== undefined &&
            inventoryData?.currentWeight !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-ui-input-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
                  style={{
                    width: `${Math.min((inventoryData.currentWeight / inventoryData.maxWeight) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
