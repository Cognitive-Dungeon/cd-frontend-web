import { Search } from "lucide-react";

import { Entity } from "../../../types";
import { WindowConfig } from "../types";

import { EntityInspectorWindow } from "./components/EntityInspectorWindow";

export const ENTITY_INSPECTOR_WINDOW_ID = "entity-inspector";

interface CreateEntityInspectorWindowConfigProps {
  entity: Entity;
  entities: Entity[];
}

export const createEntityInspectorWindowConfig = ({
  entity,
  entities,
}: CreateEntityInspectorWindowConfigProps): WindowConfig => {
  return {
    id: `${ENTITY_INSPECTOR_WINDOW_ID}-${entity.id}`,
    title: `Inspector: ${entity.name}`,
    icon: <Search size={16} />,
    defaultPosition: { x: 100, y: 100 },
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 400, height: 400 },
    resizable: true,
    content: <EntityInspectorWindow entityId={entity.id} entities={entities} />,
  };
};
