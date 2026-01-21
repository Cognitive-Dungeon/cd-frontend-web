import {Braces, Check, Copy} from "lucide-react";
import type {FC} from "react";
import {useMemo, useState} from "react";

import {JSONViewer} from "../json/JSONViewer";

export type InspectorKind = "tile" | "entity";

interface InspectorWindowProps {
  kind: InspectorKind;
  title: string;
  entityType?: string;
  data: unknown;
}

export const InspectorWindow: FC<InspectorWindowProps> = ({
  kind,
  title,
  entityType,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Error serializing data";
    }
  }, [data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-gray-300">
      <div className="flex items-center justify-between p-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <Braces className="w-4 h-4 text-cyan-400" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="text-xs text-gray-400 truncate">
              <span>Type: {kind === "tile" ? "Tile" : "Entity"}</span>
              {kind === "entity" && entityType ? (
                <>
                  <span className="mx-1">|</span>
                  <span>Entity type: {entityType}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <JSONViewer data={data} showHeader={false} />
      </div>
    </div>
  );
};
