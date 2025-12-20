import {LayoutGrid, Minimize2} from "lucide-react";
import {FC} from "react";

import {useWindowManager} from "./WindowManager";

const Dock: FC = () => {
  const { windows, minimizeWindow, restoreWindow } = useWindowManager();

  // Фильтруем окна, которые должны отображаться в доке
  const dockWindows = windows.filter((w) => w.showInDock);

  // Разделяем на закрепленные и обычные окна
  const pinnedWindows = dockWindows.filter((w) => w.pinned);
  const regularWindows = dockWindows.filter((w) => !w.pinned);

  const handleWindowClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      restoreWindow(windowId);
    } else {
      minimizeWindow(windowId);
    }
  };

  const renderWindow = (window: any) => (
    <button
      key={window.id}
      onClick={() => handleWindowClick(window.id, window.isMinimized)}
      className={`relative flex items-center justify-center p-2 rounded transition-colors shrink-0 ${
        window.isFocused && !window.isMinimized
          ? "bg-gray-600 text-white"
          : window.isMinimized
            ? "bg-neutral-800 text-gray-500 opacity-60"
            : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
      }`}
      title={
        window.isMinimized
          ? `Restore ${window.title}`
          : `Minimize ${window.title}`
      }
    >
      {window.icon || <LayoutGrid size={20} />}
      {window.isMinimized && (
        <Minimize2
          size={10}
          className="absolute -bottom-0.5 -right-0.5 text-gray-400"
        />
      )}
      {window.badge !== undefined &&
        window.badge !== null &&
        window.badge !== "" && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full border border-neutral-900 shadow-sm">
            {window.badge}
          </span>
        )}
    </button>
  );

  return (
    <div className="p-2 text-gray-300 bg-neutral-900 rounded-lg border border-neutral-700 shadow-lg">
      <div className="flex items-center gap-2 overflow-x-auto">
        {dockWindows.length === 0 ? (
          <div className="text-gray-600 text-xs italic px-2">No windows</div>
        ) : (
          <>
            {pinnedWindows.map(renderWindow)}
            {pinnedWindows.length > 0 && regularWindows.length > 0 && (
              <div className="w-px h-6 bg-neutral-600 mx-1 shrink-0" />
            )}
            {regularWindows.map(renderWindow)}
          </>
        )}
      </div>
    </div>
  );
};

export default Dock;
