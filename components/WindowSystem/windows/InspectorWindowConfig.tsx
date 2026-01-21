import {FileJson} from "lucide-react";

import type {WindowConfig} from "../types";

import type {InspectorKind} from "./components/InspectorWindow/InspectorWindow";
import {InspectorWindow} from "./components/InspectorWindow/InspectorWindow";

export const INSPECTOR_WINDOW_ID = "inspector";

interface CreateInspectorWindowConfigProps {
  kind: InspectorKind;
  title: string;
  entityType?: string;
  data: unknown;
  stableId?: string;
}

export const createInspectorWindowConfig = ({
  kind,
  title,
  entityType,
  data,
  stableId,
}: CreateInspectorWindowConfigProps): WindowConfig => {
  const idSuffix = stableId ? `${kind}-${stableId}` : `${kind}-${Date.now()}`;

  return {
    id: `${INSPECTOR_WINDOW_ID}-${idSuffix}`,
    title,
    icon: <FileJson size={16} />,
    defaultOrigin: { x: 0, y: 0 },
    defaultPosition: { x: 0.1, y: 0.1 },
    defaultSize: { width: 520, height: 640 },
    minSize: { width: 420, height: 420 },
    resizable: true,
    content: (
      <InspectorWindow
        kind={kind}
        title={title}
        entityType={entityType}
        data={data}
      />
    ),
  };
};
