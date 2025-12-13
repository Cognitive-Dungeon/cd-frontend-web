import ReactJson from "@microlink/react-json-view";
import { FC } from "react";

import { Item } from "../../../../../types";

interface ItemInspectorWindowProps {
  item: Item;
}

export const ItemInspectorWindow: FC<ItemInspectorWindowProps> = ({
  item,
}) => {
  return (
    <div className="flex flex-col h-full bg-neutral-950 text-gray-300 font-mono">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <span
            className="text-3xl"
            style={{ color: item.color || "#9CA3AF" }}
          >
            {item.symbol || "?"}
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
            <p className="text-xs text-gray-500">
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
