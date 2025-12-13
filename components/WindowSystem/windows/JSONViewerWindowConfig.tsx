import { Code } from "lucide-react";

import { WindowConfig } from "../types";

import { JSONViewer } from "./components/json/JSONViewer";

export const JSON_VIEWER_WINDOW_ID = "json-viewer";

interface CreateJSONViewerWindowConfigProps {
  data: any;
  title?: string;
}

export const createJSONViewerWindowConfig = ({
  data,
  title,
}: CreateJSONViewerWindowConfigProps): WindowConfig => {
  return {
    id: `${JSON_VIEWER_WINDOW_ID}-${Date.now()}`,
    title: title || "JSON Viewer",
    icon: <Code size={16} />,
    defaultOrigin: { x: 0.5, y: 0.5 }, // center of window
    defaultPosition: { x: 0.5, y: 0.5 }, // center of viewport
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 400, height: 400 },
    content: <JSONViewer data={data} title={title} />,
  };
};
