import {Package} from "lucide-react";

import {Item, ServerToClientEquipmentView} from "../../../types";
import {WindowConfig} from "../types";

import {InventoryWindow} from "./components/InventoryWindow";

export const INVENTORY_WINDOW_ID = "inventory-window";

interface CreateInventoryWindowConfigProps {
  items: Item[];
  inventoryData?: {
    maxSlots?: number;
    currentWeight?: number;
    maxWeight?: number;
  } | null;
  equipment?: ServerToClientEquipmentView | null;
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  onInspectItem?: (item: Item) => void;
}

export const createInventoryWindowConfig = ({
  items,
  inventoryData,
  equipment,
  onUseItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onInspectItem,
}: CreateInventoryWindowConfigProps): WindowConfig => {
  const itemCount = items.length;

  return {
    id: INVENTORY_WINDOW_ID,
    title: "Inventory",
    icon: <Package size={16} />,
    badge: itemCount > 0 ? itemCount : undefined,
    defaultOrigin: { x: 1, y: 0 }, // top-right corner of window
    defaultPosition: { x: 0.9, y: 0.1 }, // near top-right of viewport
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 300, height: 300 },
    closeable: false,
    minimizable: true,
    minimizeBehavior: "hide",
    resizable: true,
    showInDock: true,
    decorated: true,
    content: (
      <InventoryWindow
        items={items}
        inventoryData={inventoryData}
        equipment={equipment}
        onUseItem={onUseItem}
        onDropItem={onDropItem}
        onEquipItem={onEquipItem}
        onUnequipItem={onUnequipItem}
        onInspectItem={onInspectItem}
      />
    ),
  };
};
