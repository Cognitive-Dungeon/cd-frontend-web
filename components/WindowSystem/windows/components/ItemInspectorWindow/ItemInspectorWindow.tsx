import ReactJson from "@microlink/react-json-view";
import {FC} from "react";

import {Item} from "../../../../../types";

interface ItemInspectorWindowProps {
  item: Item;
}

export const ItemInspectorWindow: FC<ItemInspectorWindowProps> = ({
  item,
}) => {
  return (
    <div className="flex flex-col h-full bg-window-base text-window-text font-mono">
      {/* Header */}
      <div className="p-4 border-b border-window-border">
        <div className="flex items-center gap-3">
          <span
            className="text-3xl"
            style={{ color: item.color || "#9CA3AF" }}
          >
            {item.symbol || "?"}
          </span>
          <div>
            <h3 className="text-lg font-bold text-window-text">{item.name}</h3>
            <p className="text-xs text-dock-text-dim">
              ID: {item.id} | Type: {item.type}
            </p>
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="flex-1 overflow-y-auto p-4">
        <ReactJson
          src={item}
          theme="monokai"
          style={{
            backgroundColor: "transparent",
            fontSize: "12px",
          }}
          displayDataTypes={false}
          displayObjectSize={true}
          enableClipboard={true}
          collapsed={1}
          name={false}
          iconStyle="triangle"
        />
      </div>
    </div>
  );
};
