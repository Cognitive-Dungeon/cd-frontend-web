import {Braces, Check, ChevronDown, ChevronRight, Copy} from "lucide-react";
import {FC, useMemo, useState} from "react";

interface JSONViewerProps {
  data: any;
  title?: string;
}

interface JSONNodeProps {
  data: any;
  keyName?: string;
  level: number;
  isLast?: boolean;
}

const JSONNode: FC<JSONNodeProps> = ({ data, keyName, level, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const indent = level * 16;

  const dataType = useMemo(() => {
    if (data === null) {
      return "null";
    }
    if (Array.isArray(data)) {
      return "array";
    }
    return typeof data;
  }, [data]);

  const isExpandable = dataType === "object" || dataType === "array";
  const isEmpty =
    isExpandable &&
    (dataType === "array" ? data.length === 0 : Object.keys(data).length === 0);

  const renderValue = () => {
    switch (dataType) {
      case "string":
        return <span className="text-log-success">&quot;{data}&quot;</span>;
      case "number":
        return <span className="text-log-command">{data}</span>;
      case "boolean":
        return <span className="text-log-narrative">{String(data)}</span>;
      case "null":
        return <span className="text-log-info">null</span>;
      case "undefined":
        return <span className="text-log-info">undefined</span>;
      default:
        return null;
    }
  };

  const getObjectPreview = () => {
    if (dataType === "array") {
      return isEmpty ? "[]" : `[${data.length}]`;
    }
    if (dataType === "object") {
      const keys = Object.keys(data);
      return isEmpty ? "{}" : `{${keys.length}}`;
    }
    return "";
  };

  if (!isExpandable) {
    return (
      <div
        className="flex items-start font-mono text-sm py-0.5"
        style={{ paddingLeft: `${indent}px` }}
      >
        {keyName && (
          <>
            <span className="text-blue-300">{keyName}</span>
            <span className="text-log-info mx-1">:</span>
          </>
        )}
        {renderValue()}
        {!isLast && <span className="text-log-info">,</span>}
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div
        className="flex items-center py-0.5 hover:bg-ui-tab-hover-bg cursor-pointer"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="p-0 mr-1 text-window-icon-color hover:text-window-text">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {keyName && (
          <>
            <span className="text-blue-300">{keyName}</span>
            <span className="text-log-info mx-1">:</span>
          </>
        )}
        <span className="text-gray-400">{getObjectPreview()}</span>
      </div>

      {isExpanded && !isEmpty && (
        <div>
          {dataType === "array"
            ? data.map((item: any, index: number) => (
                <JSONNode
                  key={index}
                  data={item}
                  keyName={String(index)}
                  level={level + 1}
                  isLast={index === data.length - 1}
                />
              ))
            : Object.entries(data).map(([key, value], index, arr) => (
                <JSONNode
                  key={key}
                  data={value}
                  keyName={key}
                  level={level + 1}
                  isLast={index === arr.length - 1}
                />
              ))}
        </div>
      )}
    </div>
  );
};

export const JSONViewer: FC<JSONViewerProps> = ({ data, title }) => {
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
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Braces className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">
            {title || "JSON Viewer"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>

      {/* JSON Tree */}
      <div className="flex-1 overflow-auto p-3">
        <JSONNode data={data} level={0} />
      </div>
    </div>
  );
};
