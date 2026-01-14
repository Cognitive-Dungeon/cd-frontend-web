import {createContext, FC, useCallback, useContext, useEffect, useRef, useState,} from "react";

import {
    DockedPosition,
    findClosestSnap,
    getViewportSnapPointPx,
    getWindowSnapPointPx,
    MinimizeBehavior,
    SNAP_POINTS,
    SnapPoint,
    WindowState,
} from "./types";
import {useWindowManager} from "./WindowManager";

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
  const allowOverflowOutsideWindow = windowState.id === "server-selection";
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMovedThreshold, setHasMovedThreshold] = useState(false);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [snapZone, setSnapZone] = useState<DockedPosition>("none");
  const [activeSnap, setActiveSnap] = useState<{
    windowPoint: SnapPoint;
    viewportPoint: SnapPoint;
  } | null>(null);

  const SNAP_THRESHOLD = 20;
  const MAGNETIC_THRESHOLD = 30; // Threshold for 9-point snap system
  const DRAG_START_THRESHOLD = 5; // Minimum pixels to move before showing snap visualization

  // Get current pixel position - use drag position during drag for immediate feedback
  const basePixelPosition = getWindowPixelPosition(windowState);
  const pixelPosition =
    isDragging && dragPosition ? dragPosition : basePixelPosition;

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
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasMovedThreshold(false);
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

      const viewportWidth = globalThis.innerWidth;
      const viewportHeight = globalThis.innerHeight;

      // Find closest snap using 9-point system
      const snap = findClosestSnap(
        { x, y },
        windowState.size,
        viewportWidth,
        viewportHeight,
        MAGNETIC_THRESHOLD,
      );

      if (snap) {
        // Calculate the new position that aligns the snap points
        const viewportSnapPx = getViewportSnapPointPx(
          viewportWidth,
          viewportHeight,
          snap.viewportPoint,
        );

        // New top-left = viewport_snap_point - window_snap_offset
        const newX =
          viewportSnapPx.x - windowState.size.width * snap.windowPoint.x;
        const newY =
          viewportSnapPx.y - windowState.size.height * snap.windowPoint.y;

        // Update magnetic snap state with the snap points
        updateMagneticSnap(windowState.id, {
          windowPoint: snap.windowPoint,
          viewportPoint: snap.viewportPoint,
        });

        // Update visual snap indicator
        setActiveSnap({
          windowPoint: snap.windowPoint,
          viewportPoint: snap.viewportPoint,
        });

        return { x: newX, y: newY };
      }

      // No snap - clear magnetic snap state and visual indicator
      updateMagneticSnap(windowState.id, {});
      setActiveSnap(null);
      return { x, y };
    },
    [
      windowState.dockable,
      windowState.size,
      windowState.id,
      updateMagneticSnap,
    ],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Check if we've moved beyond the threshold
      if (!hasMovedThreshold) {
        const distanceX = Math.abs(e.clientX - dragStartPos.x);
        const distanceY = Math.abs(e.clientY - dragStartPos.y);
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance >= DRAG_START_THRESHOLD) {
          setHasMovedThreshold(true);
        }
      }

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const zone = detectSnapZone(e.clientX);
      setSnapZone(zone);

      const snapped = applyMagneticSnap(newX, newY);
      setDragPosition(snapped);
      updateWindowPositionPx(windowState.id, { x: snapped.x, y: snapped.y });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      setHasMovedThreshold(false);
      setDragPosition(null);
      setActiveSnap(null);

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
    dragStartPos,
    hasMovedThreshold,
    windowState.id,
    windowState.dockable,
    updateWindowPositionPx,
    dockWindow,
    applyMagneticSnap,
    detectSnapZone,
  ]);

  const handleResizeStart =
    (direction: string) => (e: React.MouseEvent) => {
      if (
        !windowState.resizable &&
        !windowState.resizableX &&
        !windowState.resizableY
      ) {
        return;
      }

      // Check specific axis constraints
      if (
        (direction.includes("e") || direction.includes("w")) &&
        windowState.resizableX === false
      ) {
        return;
      }
      if (
        (direction.includes("n") || direction.includes("s")) &&
        windowState.resizableY === false
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      const pos = getWindowPixelPosition(windowState);
      setResizeStart({
        x: pos.x,
        y: pos.y,
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

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      // Handle Width (East/West)
      if (resizeDirection.includes("e")) {
         newWidth = Math.max(200, resizeStart.width + deltaX);
      } else if (resizeDirection.includes("w")) {
         const proposedWidth = resizeStart.width - deltaX;
         newWidth = Math.max(200, proposedWidth);
         // Shift X only by the amount width actually changed
         newX = resizeStart.x + (resizeStart.width - newWidth);
      }

      // Handle Height (South/North)
      if (resizeDirection.includes("s")) {
         newHeight = Math.max(150, resizeStart.height + deltaY);
      } else if (resizeDirection.includes("n")) {
         const proposedHeight = resizeStart.height - deltaY;
         newHeight = Math.max(150, proposedHeight);
         // Shift Y only by the amount height actually changed
         newY = resizeStart.y + (resizeStart.height - newHeight);
      }

      // Apply constraints if needed (though checks in handleResizeStart mostly cover start)
      // Double check constraints if specific axes are disabled but passed through generic
      if (windowState.resizableX === false) {
         newWidth = resizeStart.width;
         newX = resizeStart.x;
      }
      if (windowState.resizableY === false) {
         newHeight = resizeStart.height;
         newY = resizeStart.y;
      }

      if (newWidth !== windowState.size.width || newHeight !== windowState.size.height) {
        updateWindowSize(windowState.id, { width: newWidth, height: newHeight });
      }
      
      if (newX !== resizeStart.x || newY !== resizeStart.y) {
         updateWindowPositionPx(windowState.id, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection("");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp); // Add mouseup to document to catch release outside window

    return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeStart,
    resizeDirection,
    windowState.id,
    windowState.size,
    windowState.resizableX,
    windowState.resizableY,
    updateWindowSize,
    updateWindowPositionPx,
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
      {/* Dock zone visualization */}
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

      {/* 9-point snap visualization */}
      {isDragging && hasMovedThreshold && (
        <div className="fixed inset-0 pointer-events-none z-[9997]">
          {/* Viewport snap points */}
          {SNAP_POINTS.map((point, index) => {
            const vpPoint = getViewportSnapPointPx(
              globalThis.innerWidth,
              globalThis.innerHeight,
              point,
            );
            const isActive =
              activeSnap?.viewportPoint.x === point.x &&
              activeSnap?.viewportPoint.y === point.y;

            return (
              <div
                key={`vp-${index}`}
                className={`absolute transition-all duration-150 ${
                  isActive
                    ? "w-4 h-4 bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-400/50"
                    : "w-2 h-2 bg-white/40 border border-white/60"
                }`}
                style={{
                  left: vpPoint.x,
                  top: vpPoint.y,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                }}
              />
            );
          })}

          {/* Window snap points */}
          {SNAP_POINTS.map((point, index) => {
            const winPoint = getWindowSnapPointPx(
              pixelPosition,
              windowState.size,
              point,
            );
            const isActive =
              activeSnap?.windowPoint.x === point.x &&
              activeSnap?.windowPoint.y === point.y;

            return (
              <div
                key={`win-${index}`}
                className={`absolute transition-all duration-150 ${
                  isActive
                    ? "w-4 h-4 bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/50"
                    : "w-2 h-2 bg-amber-500/40 border border-amber-300/60"
                }`}
                style={{
                  left: winPoint.x,
                  top: winPoint.y,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                }}
              />
            );
          })}

          {/* Connection line when snapped */}
          {activeSnap && (
            <>
              {(() => {
                const vpPoint = getViewportSnapPointPx(
                  globalThis.innerWidth,
                  globalThis.innerHeight,
                  activeSnap.viewportPoint,
                );
                const winPoint = getWindowSnapPointPx(
                  pixelPosition,
                  windowState.size,
                  activeSnap.windowPoint,
                );
                return (
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ overflow: "visible" }}
                  >
                    <line
                      x1={winPoint.x}
                      y1={winPoint.y}
                      x2={vpPoint.x}
                      y2={vpPoint.y}
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                  </svg>
                );
              })()}
            </>
          )}
        </div>
      )}

      <div
        ref={windowRef}
        data-window
        className={`absolute transition-all ${
          allowOverflowOutsideWindow ? "overflow-visible" : "overflow-hidden"
        } ${
          windowState.docked !== "none" ? "duration-300" : "duration-0"
        } ${
          windowState.isMinimized && windowState.minimizeBehavior === "collapse"
            ? "bg-black/40 rounded-lg backdrop-blur-sm border border-neutral-700/50"
            : windowState.decorated
              ? `bg-window-base border rounded-lg ${
                  windowState.isFocused
                    ? "border-window-border-focus"
                    : "border-window-border"
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
                  ? "bg-window-header-focus border-window-header-border-focus"
                  : "bg-window-header border-window-header-border"
              }`}
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <span className="text-sm font-medium text-window-text">
                {windowState.title}
              </span>
              <div className="flex items-center gap-1">
                {/* Кнопка свернуть (только если minimizable === true) */}
                {windowState.minimizable && (
                  <button
                    onClick={() => minimizeWindow(windowState.id)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-window-button-hover transition-colors"
                    title="Minimize"
                  >
                    <svg
                      className="w-3 h-3 text-window-icon-color"
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
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-window-button-close-hover transition-colors"
                    title="Close"
                  >
                    <svg
                      className="w-3 h-3 text-window-icon-color"
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
          className={`w-full ${
            allowOverflowOutsideWindow ? "overflow-visible" : "overflow-auto"
          } ${
            windowState.isMinimized &&
            windowState.minimizeBehavior === "collapse"
              ? "h-auto bg-transparent"
              : windowState.decorated
                ? "h-[calc(100%-40px)] bg-window-content"
                : "h-full"
          }`}
        >
          {windowState.content}
        </div>

        {/* Resize handles */}
        {!windowState.isMinimized &&
          (windowState.resizable ||
            windowState.resizableX ||
            windowState.resizableY) && (
            <>
              {/* Sides */}
              <div
                 onMouseDown={handleResizeStart("e")}
                 className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-cyan-500/50 z-10"
              />
              <div
                 onMouseDown={handleResizeStart("s")}
                 className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-cyan-500/50 z-10"
              />
              <div
                 onMouseDown={handleResizeStart("w")}
                 className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-cyan-500/50 z-10"
              />
              <div
                 onMouseDown={handleResizeStart("n")}
                 className="absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-cyan-500/50 z-10"
              />

              {/* Corners */}
              <div
                 onMouseDown={handleResizeStart("se")}
                 className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20"
              />
              <div
                 onMouseDown={handleResizeStart("sw")}
                 className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-20"
              />
              <div
                 onMouseDown={handleResizeStart("nw")}
                 className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-20"
              />
              <div
                 onMouseDown={handleResizeStart("ne")}
                 className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-20"
              />

              {/* Visual grip for SE corner (traditional look) */}
              <div className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none z-10">
                 <div className="absolute bottom-0 right-0 w-full h-[2px] bg-window-resize-handle/50" />
                 <div className="absolute bottom-0 right-0 w-[2px] h-full bg-window-resize-handle/50" />
                 <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-window-resize-handle/30" />
              </div>
            </>
          )}
      </div>
    </WindowContext.Provider>
  );
};

export default Window;
