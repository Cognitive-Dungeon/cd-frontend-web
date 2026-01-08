import ReactJson from "@microlink/react-json-view";
import {FC, useMemo} from "react";

import {Entity} from "../../../../../types";

interface EntityInspectorWindowProps {
  entityId: string;
  entities: Entity[];
}

export const EntityInspectorWindow: FC<EntityInspectorWindowProps> = ({
  entityId,
  entities,
}) => {
  const entity = useMemo(() => {
    return entities.find((e) => e.id === entityId);
  }, [entities, entityId]);

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-window-content text-dock-text-dim font-mono">
        <p className="text-sm">Entity not found: {entityId}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-window-content text-window-text font-mono">
      {/* Header */}
      <div className="p-4 border-b border-window-border">
        <div className="flex items-center gap-3">
          <span className={`text-3xl ${entity.color}`}>{entity.symbol}</span>
          <div>
            <h3 className="text-lg font-bold text-window-text">{entity.name}</h3>
            <p className="text-xs text-dock-text-dim">
              ID: {entity.id} | Type: {entity.type}
            </p>
          </div>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="flex-1 overflow-y-auto p-4">
        <ReactJson
          src={entity}
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
