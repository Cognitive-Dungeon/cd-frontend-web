import { FileJson } from "lucide-react";

import { Item } from "../../../types";
import { WindowConfig } from "../types";

import { ItemInspectorWindow } from "./components/ItemInspectorWindow";

export const ITEM_INSPECTOR_WINDOW_ID = "item-inspector";

interface CreateItemInspectorWindowConfigProps {
  item: Item;
}

export const createItemInspectorWindowConfig = ({
  item,
}: CreateItemInspectorWindowConfigProps): WindowConfig => {
  return {
    id: `${ITEM_INSPECTOR_WINDOW_ID}-${item.id}`,
    title: `Inspector: ${item.name}`,
    icon: <FileJson size={16} />,
    defaultPosition: { x: 100, y: 100 },
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 400, height: 400 },
    resizable: true,
    content: <ItemInspectorWindow item={item} />,
  };
};
