import {
  useRef,
  useState,
  useEffect,
  FC,
  useCallback,
  createContext,
  useContext,
} from "react";

import {
  WindowState,
  DockedPosition,
  MinimizeBehavior,
  MagneticSnap,
} from "./types";
import { useWindowManager } from "./WindowManager";

interface WindowProps {
  window: WindowState;
}

interface WindowContextType {
  isMinimized: boolean;
  minimizeBehavior?: MinimizeBehavior;
  windowId: string;
  restoreWindow: () => void;
}

export const WindowContext = createContext<WindowContextType>({
  isMinimized: false,
  windowId: "",
  restoreWindow: () => {},
});

export const useWindowContext = () => useContext(WindowContext);

const Window: FC<WindowProps> = ({ window: windowState }) => {
  const {
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowPositionPx,
    updateWindowSize,
    dockWindow,
    undockWindow,
    updateMagneticSnap,
    getWindowPixelPosition,
  } = useWindowManager();

  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [snapZone, setSnapZone] = useState<DockedPosition>("none");

  const SNAP_THRESHOLD = 20;
  const MAGNETIC_THRESHOLD = 10;

  // Get current pixel position
  const pixelPosition = getWindowPixelPosition(windowState);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Игнорируем клики по любым интерактивным элементам
    const interactiveSelector = [
      "button",
      "input",
      "textarea",
      "select",
      "a",
      "[draggable='true']",
      "[contenteditable='true']",
      "[role='button']",
      "[data-interactive='true']",
    ].join(", ");

    if (target.closest(interactiveSelector)) {
      return;
    }

    focusWindow(windowState.id);

    if (windowState.docked !== "none" && windowState.dockable !== false) {
      undockWindow(windowState.id);
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pixelPosition.x,
      y: e.clientY - pixelPosition.y,
    });
  };

  const detectSnapZone = useCallback(
    (mouseX: number): DockedPosition => {
      if (!windowState.dockable) {
        return "none";
      }

      const viewportWidth = globalThis.innerWidth;

      if (mouseX < SNAP_THRESHOLD) {
        return "left";
      } else if (mouseX > viewportWidth - SNAP_THRESHOLD) {
        return "right";
      }

      return "none";
    },
    [windowState.dockable],
  );

  const applyMagneticSnap = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!windowState.dockable) {
        return { x, y };
      }

      let newX = x;
      let newY = y;
      const viewportWidth = globalThis.innerWidth;
      const viewportHeight = globalThis.innerHeight;

      const magneticSnap: MagneticSnap = {};

      // Snap to viewport edges only
      if (Math.abs(x) < MAGNETIC_THRESHOLD) {
        newX = 0;
        magneticSnap.left = true;
      } else if (
        Math.abs(x + windowState.size.width - viewportWidth) <
        MAGNETIC_THRESHOLD
      ) {
        newX = viewportWidth - windowState.size.width;
        magneticSnap.right = true;
      }

      if (Math.abs(y) < MAGNETIC_THRESHOLD) {
        newY = 0;
        magneticSnap.top = true;
      } else if (
        Math.abs(y + windowState.size.height - viewportHeight) <
        MAGNETIC_THRESHOLD
      ) {
        newY = viewportHeight - windowState.size.height;
        magneticSnap.bottom = true;
      }

      // Update magnetic snap state
      if (Object.keys(magneticSnap).length > 0) {
        updateMagneticSnap(windowState.id, magneticSnap);
      } else {
        updateMagneticSnap(windowState.id, {});
      }

      return { x: newX, y: newY };
    },
    [
      windowState.dockable,
      windowState.size.width,
      windowState.size.height,
      windowState.id,
      updateMagneticSnap,
    ],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const zone = detectSnapZone(e.clientX);
      setSnapZone(zone);

      const snapped = applyMagneticSnap(newX, newY);
      updateWindowPositionPx(windowState.id, { x: snapped.x, y: snapped.y });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);

      const zone = detectSnapZone(e.clientX);
      if (zone !== "none" && windowState.dockable !== false) {
        dockWindow(windowState.id, zone);
      }

      setSnapZone("none");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    dragOffset,
    windowState.id,
    windowState.dockable,
    updateWindowPositionPx,
    dockWindow,
    applyMagneticSnap,
    detectSnapZone,
  ]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (
      !windowState.resizable &&
      !windowState.resizableX &&
      !windowState.resizableY
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: windowState.size.width,
      height: windowState.size.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;

      const newWidth =
        windowState.resizableX !== false
          ? Math.max(200, resizeStart.width + deltaX)
          : resizeStart.width;
      const newHeight =
        windowState.resizableY !== false
          ? Math.max(150, resizeStart.height + deltaY)
          : resizeStart.height;

      updateWindowSize(windowState.id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeStart,
    windowState.id,
    updateWindowSize,
    windowState.resizableX,
    windowState.resizableY,
  ]);

  if (windowState.isMinimized && windowState.minimizeBehavior !== "collapse") {
    return null;
  }

  return (
    <WindowContext.Provider
      value={{
        isMinimized: windowState.isMinimized,
        minimizeBehavior: windowState.minimizeBehavior,
        windowId: windowState.id,
        restoreWindow: () => restoreWindow(windowState.id),
      }}
    >
      {isDragging && snapZone !== "none" && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          {snapZone === "left" && (
            <div
              className="absolute bg-cyan-500/30 border-2 border-cyan-400 transition-all duration-200"
              style={{
                left: 0,
                top: 0,
                width: `${globalThis.innerWidth / 2}px`,
                height: `${globalThis.innerHeight}px`,
              }}
            >
              <div className="flex items-center justify-center h-full">
                <div className="bg-cyan-500/50 px-6 py-3 rounded-lg backdrop-blur-sm">
                  <span className="text-white font-bold text-lg uppercase tracking-wide">
                    Left
                  </span>
                </div>
              </div>
            </div>
          )}
          {snapZone === "right" && (
            <div
              className="absolute bg-cyan-500/30 border-2 border-cyan-400 transition-all duration-200"
              style={{
                left: `${globalThis.innerWidth / 2}px`,
                top: 0,
                width: `${globalThis.innerWidth / 2}px`,
                height: `${globalThis.innerHeight}px`,
              }}
            >
              <div className="flex items-center justify-center h-full">
                <div className="bg-cyan-500/50 px-6 py-3 rounded-lg backdrop-blur-sm">
                  <span className="text-white font-bold text-lg uppercase tracking-wide">
                    Right
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={windowRef}
        data-window
        className={`absolute overflow-hidden transition-all ${
          windowState.docked !== "none" ? "duration-300" : "duration-0"
        } ${
          windowState.isMinimized && windowState.minimizeBehavior === "collapse"
            ? "bg-black/40 rounded-lg backdrop-blur-sm border border-neutral-700/50"
            : windowState.decorated
              ? `bg-neutral-900 border rounded-lg ${
                  windowState.isFocused
                    ? "border-gray-500"
                    : "border-neutral-700"
                }`
              : "bg-transparent"
        }`}
        style={{
          left: `${pixelPosition.x}px`,
          top:
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
              ? "auto"
              : `${pixelPosition.y}px`,
          bottom:
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
              ? `${globalThis.innerHeight - (pixelPosition.y + windowState.size.height)}px`
              : "auto",
          width: `${windowState.size.width}px`,
          height:
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
              ? "auto"
              : `${windowState.size.height}px`,
          zIndex: windowState.zIndex,
          cursor: isDragging
            ? "grabbing"
            : windowState.decorated
              ? "default"
              : "grab",
          boxShadow:
            windowState.decorated && !windowState.isMinimized
              ? windowState.isFocused
                ? "0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 40px rgba(0, 0, 0, 0.4), 0 20px 60px rgba(0, 0, 0, 0.3)"
                : "0 0 0 1px rgba(255, 255, 255, 0.04), 0 4px 15px rgba(0, 0, 0, 0.4), 0 8px 30px rgba(0, 0, 0, 0.3)"
              : undefined,
        }}
        onMouseDown={(e) => {
          if (!windowState.decorated) {
            handleMouseDown(e);
          } else {
            focusWindow(windowState.id);
          }
        }}
      >
        {/* Заголовок окна (только если decorated === true) */}
        {windowState.decorated &&
          !(
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
          ) && (
            <div
              data-window-header
              className={`flex items-center justify-between px-3 py-2 border-b select-none ${
                windowState.isFocused
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-neutral-850 border-neutral-750"
              }`}
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <span className="text-sm font-medium text-gray-300">
                {windowState.title}
              </span>
              <div className="flex items-center gap-1">
                {/* Кнопка свернуть (только если minimizable === true) */}
                {windowState.minimizable && (
                  <button
                    onClick={() => minimizeWindow(windowState.id)}
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
                {windowState.closeable && (
                  <button
                    onClick={() => closeWindow(windowState.id)}
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
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
              ? "h-auto bg-transparent"
              : windowState.decorated
                ? "h-[calc(100%-40px)] bg-neutral-900"
                : "h-full"
          }`}
        >
          {windowState.content}
        </div>

        {/* Resize handle (только если resizable или resizableX/resizableY === true) */}
        {!windowState.isMinimized &&
          (windowState.resizable ||
            windowState.resizableX ||
            windowState.resizableY) && (
            <div
              onMouseDown={handleResizeMouseDown}
              className={`absolute bottom-0 right-0 w-5 h-5 group ${
                windowState.resizableX && windowState.resizableY
                  ? "cursor-nwse-resize"
                  : windowState.resizableX
                    ? "cursor-ew-resize"
                    : "cursor-ns-resize"
              }`}
              style={{ zIndex: 10 }}
              title="Изменить размер"
            >
              <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-gray-500 group-hover:border-gray-300 transition-colors opacity-60 group-hover:opacity-100" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-gray-500 group-hover:border-gray-300 transition-colors opacity-40 group-hover:opacity-80" />
            </div>
          )}
      </div>
    </WindowContext.Provider>
  );
};

export default Window;
