import { Package } from "lucide-react";

import { Item } from "../../../types";
import { WindowConfig } from "../types";

import { InventoryWindow } from "./components/InventoryWindow";

export const INVENTORY_WINDOW_ID = "inventory-window";

interface CreateInventoryWindowConfigProps {
  items: Item[];
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
}

export const createInventoryWindowConfig = ({
  items,
  onUseItem,
  onDropItem,
}: CreateInventoryWindowConfigProps): WindowConfig => {
  return {
    id: INVENTORY_WINDOW_ID,
    title: "Inventory",
    icon: <Package size={16} />,
    defaultPosition: { x: 500, y: 100 },
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
        onUseItem={onUseItem}
        onDropItem={onDropItem}
      />
    ),
  };
};
