import { Pin } from "lucide-react";

import type { Item } from "../../../types";
import type { WindowConfig } from "../types";

import { QuickAccessWindow } from "./components/QuickAccessWindow";

export const QUICK_ACCESS_WINDOW_ID = "quick-access-window";

interface CreateQuickAccessWindowConfigProps {
  slots: Array<Item | null>;
  totalSlots?: number;
  inventoryItems: Item[];
  onUsePinnedItem?: (item: Item) => void;
  onDropItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  onInspectItem?: (item: Item) => void;
  equipment?: Array<Item>;
}

/**
 * Factory for QuickAccessWindow configuration
 * - A compact pinned-items window for quick usage
 * - Drag-and-drop from InventoryWindow to pin items
 * - Right-click "Use" action triggers server command via callback
 */
export const createQuickAccessWindowConfig = ({
  slots,
  totalSlots,
  inventoryItems,
  onUsePinnedItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onInspectItem,
  equipment,
}: CreateQuickAccessWindowConfigProps): WindowConfig => {
  const pinnedCount = slots.filter(Boolean).length;

  return {
    id: QUICK_ACCESS_WINDOW_ID,
    title: "",
    icon: <Pin size={16} />,
    badge: pinnedCount > 0 ? pinnedCount : undefined,
    defaultPosition: { x: 920, y: 100 },
    defaultSize: { width: 350, height: 55 },
    minSize: { width: 350, height: 55 },
    closeable: false,
    minimizable: true,
    minimizeBehavior: "hide",
    resizable: false,
    lockSize: true,
    showInDock: false,
    decorated: false,
    content: (
      <QuickAccessWindow
        slots={slots}
        totalSlots={totalSlots}
        inventoryItems={inventoryItems}
        onUsePinnedItem={onUsePinnedItem}
        onDropItem={onDropItem}
        onEquipItem={onEquipItem}
        onUnequipItem={onUnequipItem}
        onInspectItem={onInspectItem}
        equipment={equipment}
      />
    ),
  };
};
