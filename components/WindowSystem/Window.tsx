import { useRef, useState, useEffect, FC } from "react";

import { WindowState } from "./types";
import { useWindowManager } from "./WindowManager";

interface WindowProps {
  window: WindowState;
}

const Window: FC<WindowProps> = ({ window }) => {
  const { closeWindow, focusWindow, minimizeWindow, updateWindowPosition } =
    useWindowManager();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Для неоформленных окон - перетаскивание работает везде
    // Для оформленных - игнорируем клики по кнопкам
    if (window.decorated && (e.target as HTMLElement).closest("button")) {
      return;
    }

    focusWindow(window.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateWindowPosition(window.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, window.id, updateWindowPosition]);

  if (window.isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={`absolute overflow-hidden ${
        window.decorated
          ? `bg-neutral-900 border rounded-lg shadow-2xl ${
              window.isFocused ? "border-gray-500" : "border-neutral-700"
            }`
          : "bg-transparent"
      }`}
      style={{
        left: `${window.position.x}px`,
        top: `${window.position.y}px`,
        width: `${window.size.width}px`,
        height: `${window.size.height}px`,
        zIndex: window.zIndex,
        cursor: isDragging ? "grabbing" : window.decorated ? "default" : "grab",
      }}
      onMouseDown={(e) => {
        if (!window.decorated) {
          handleMouseDown(e);
        } else {
          focusWindow(window.id);
        }
      }}
    >
      {/* Заголовок окна (только если decorated === true) */}
      {window.decorated && (
        <div
          className={`flex items-center justify-between px-3 py-2 border-b select-none ${
            window.isFocused
              ? "bg-neutral-800 border-neutral-700"
              : "bg-neutral-850 border-neutral-750"
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <span className="text-sm font-medium text-gray-300">
            {window.title}
          </span>
          <div className="flex items-center gap-1">
            {/* Кнопка свернуть (только если minimizable === true) */}
            {window.minimizable && (
              <button
                onClick={() => minimizeWindow(window.id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-700 transition-colors"
                title="Minimize"
              >
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
            )}
            {/* Кнопка закрыть (только если closeable === true) */}
            {window.closeable && (
              <button
                onClick={() => closeWindow(window.id)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-600 transition-colors"
                title="Close"
              >
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Содержимое окна */}
      <div
        className={`w-full overflow-auto ${
          window.decorated ? "h-[calc(100%-40px)] bg-neutral-900" : "h-full"
        }`}
      >
        {window.content}
      </div>
    </div>
  );
};

export default Window;
