import {createContext, FC, ReactNode, useCallback, useContext, useEffect, useState,} from "react";

import {
    calculateNormalizedPosition,
    calculateWindowTopLeftPx,
    DockedPosition,
    getOriginFromMagneticSnap,
    MagneticSnap,
    WindowBounds,
    WindowConfig,
    WindowOrigin,
    WindowPosition,
    WindowSize,
    WindowState,
} from "./types";
import {
    applyDefaultLayout,
    clampPositionPx,
    getStoredWindowState,
    resetToDefaultLayout,
    saveWindowState,
} from "./utils";

interface WindowManagerContextType {
  windows: WindowState[];
  openWindow: (config: WindowConfig) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateWindowPositionPx: (
    id: string,
    topLeftPx: { x: number; y: number },
  ) => void;
  updateWindowSize: (id: string, size: WindowSize) => void;
  updateWindowContent: (id: string, content: ReactNode) => void;
  updateWindowBadge: (id: string, badge: string | number | undefined) => void;
  dockWindow: (id: string, position: DockedPosition) => void;
  undockWindow: (id: string) => void;
  getDockedBounds: (position: DockedPosition) => WindowBounds;
  updateMagneticSnap: (id: string, snap: MagneticSnap) => void;
  resetWindowLayout: () => Promise<void>;
  getWindowPixelPosition: (windowState: WindowState) => {
    x: number;
    y: number;
  };
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(
  null,
);

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error(
      "useWindowManager must be used within WindowManagerProvider",
    );
  }
  return context;
};

interface WindowManagerProviderProps {
  children: ReactNode;
}

export const WindowManagerProvider: FC<WindowManagerProviderProps> = ({
  children,
}) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);

  // Load default layout on first mount
  useEffect(() => {
    applyDefaultLayout();
  }, []);

  // Helper to get pixel position for a window
  const getWindowPixelPosition = useCallback(
    (w: WindowState): { x: number; y: number } => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const topLeftPx = calculateWindowTopLeftPx(
        w.origin,
        w.position,
        w.size,
        viewportWidth,
        viewportHeight,
      );

      return clampPositionPx(topLeftPx, w.size.width, w.size.height);
    },
    [],
  );

  const getDockedBounds = useCallback(
    (position: DockedPosition): WindowBounds => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      switch (position) {
        case "left":
          return {
            x: 0,
            y: 0,
            width: viewportWidth / 2,
            height: viewportHeight,
          };
        case "right":
          return {
            x: viewportWidth / 2,
            y: 0,
            width: viewportWidth / 2,
            height: viewportHeight,
          };
        case "none":
        default:
          return { x: 0, y: 0, width: 0, height: 0 };
      }
    },
    [],
  );

  // Recalculate window positions on viewport resize
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setWindows((prev) =>
        prev.map((w) => {
          // Update docked windows to new viewport size
          if (w.docked !== "none") {
            const bounds = getDockedBounds(w.docked);
            return {
              ...w,
              position: {
                x: bounds.x / viewportWidth,
                y: bounds.y / viewportHeight,
              },
              size: { width: bounds.width, height: bounds.height },
            };
          }

          // For non-docked windows, the origin/position system handles resize automatically
          // We just need to recalculate and clamp the pixel position
          const topLeftPx = calculateWindowTopLeftPx(
            w.origin,
            w.position,
            w.size,
            viewportWidth,
            viewportHeight,
          );

          const clampedPx = clampPositionPx(
            topLeftPx,
            w.size.width,
            w.size.height,
          );

          // Check if position changed due to clamping
          if (clampedPx.x !== topLeftPx.x || clampedPx.y !== topLeftPx.y) {
            // Update the normalized position to match clamped pixel position
            const newPosition = calculateNormalizedPosition(
              clampedPx,
              w.origin,
              w.size,
              viewportWidth,
              viewportHeight,
            );

            saveWindowState(
              w.id,
              w.origin,
              newPosition,
              w.size,
              w.isMinimized,
              w.docked,
              w.magneticSnap,
            );

            return { ...w, position: newPosition };
          }

          return w;
        }),
      );
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [getDockedBounds]);

  const openWindow = useCallback(
    (config: WindowConfig) => {
      setWindows((prev) => {
        // Проверяем, не открыто ли уже окно с таким id
        const existing = prev.find((w) => w.id === config.id);
        if (existing) {
          // Если окно уже открыто, просто фокусируемся на нем
          return prev.map((w) =>
            w.id === config.id
              ? {
                  ...w,
                  isFocused: true,
                  isMinimized: false,
                  zIndex: nextZIndex,
                }
              : { ...w, isFocused: false },
          );
        }

        // Загружаем сохраненное состояние или используем defaults
        const stored = getStoredWindowState(config.id);

        // Restore docked and magneticSnap state from storage
        const restoredDocked = stored?.docked ?? "none";
        const restoredMagneticSnap = stored?.magneticSnap ?? {};

        const defaultOrigin: WindowOrigin = config.defaultOrigin || {
          x: 0,
          y: 0,
        };
        const defaultPosition: WindowPosition = config.defaultPosition || {
          x: 0.1,
          y: 0.1,
        };
        const defaultSize: WindowSize = config.defaultSize || {
          width: 400,
          height: 300,
        };

        // Для окон с lockSize всегда используем defaultSize, игнорируем localStorage
        // Для окон с lockHeight блокируем только высоту
        const origin = stored?.origin || defaultOrigin;
        const position = stored?.position || defaultPosition;
        const size =
          config.lockSize === true
            ? defaultSize
            : config.lockHeight === true && stored?.size
              ? { width: stored.size.width, height: defaultSize.height }
              : stored?.size || defaultSize;
        const isMinimized = stored?.isMinimized || false;

        const newWindow: WindowState = {
          id: config.id,
          title: config.title,
          isMinimized,
          minimizeBehavior: config.minimizeBehavior,
          isFocused: true,
          origin,
          position,
          size,
          zIndex: nextZIndex,
          closeable: config.closeable ?? true,
          minimizable: config.minimizable ?? true,
          resizable: config.resizable ?? true,
          resizableX: config.resizableX ?? config.resizable ?? true,
          resizableY: config.resizableY ?? config.resizable ?? true,
          showInDock: config.showInDock ?? true,
          decorated: config.decorated ?? true,
          pinned: config.pinned ?? false,
          lockSize: config.lockSize ?? false,
          lockHeight: config.lockHeight ?? false,
          dockable: config.dockable ?? true,
          docked: restoredDocked,
          beforeDockedState: undefined,
          magneticSnap: restoredMagneticSnap,
          icon: config.icon,
          badge: config.badge,
          content: config.content,
        };

        setNextZIndex((z) => z + 1);

        // Снимаем фокус со всех остальных окон
        return [...prev.map((w) => ({ ...w, isFocused: false })), newWindow];
      });
    },
    [nextZIndex],
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      setWindows((prev) => {
        const targetWindow = prev.find((w) => w.id === id);
        if (!targetWindow) {
          return prev;
        }

        setNextZIndex((z) => z + 1);

        return prev.map((w) =>
          w.id === id
            ? { ...w, isFocused: true, zIndex: nextZIndex }
            : { ...w, isFocused: false },
        );
      });
    },
    [nextZIndex],
  );

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, isMinimized: true, isFocused: false };
          saveWindowState(
            id,
            w.origin,
            w.position,
            w.size,
            true,
            w.docked,
            w.magneticSnap,
          );
          return updated;
        }
        return w;
      }),
    );
  }, []);

  const restoreWindow = useCallback(
    (id: string) => {
      setWindows((prev) => {
        setNextZIndex((z) => z + 1);

        return prev.map((w) => {
          if (w.id === id) {
            const updated = {
              ...w,
              isMinimized: false,
              isFocused: true,
              zIndex: nextZIndex,
            };
            saveWindowState(
              id,
              w.origin,
              w.position,
              w.size,
              false,
              w.docked,
              w.magneticSnap,
            );
            return updated;
          }
          return { ...w, isFocused: false };
        });
      });
    },
    [nextZIndex],
  );

  // Update window position from pixel coordinates
  const updateWindowPositionPx = useCallback(
    (id: string, topLeftPx: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Clamp pixel position
            const clampedPx = clampPositionPx(
              topLeftPx,
              w.size.width,
              w.size.height,
            );

            // Check if we have a snap - if so, use snap points directly
            if (w.magneticSnap?.windowPoint && w.magneticSnap?.viewportPoint) {
              // When snapped, origin = windowPoint, position = viewportPoint
              const newOrigin: WindowOrigin = {
                x: w.magneticSnap.windowPoint.x,
                y: w.magneticSnap.windowPoint.y,
              };
              const newPosition: WindowPosition = {
                x: w.magneticSnap.viewportPoint.x,
                y: w.magneticSnap.viewportPoint.y,
              };

              saveWindowState(
                id,
                newOrigin,
                newPosition,
                w.size,
                w.isMinimized,
                w.docked,
                w.magneticSnap,
              );

              return { ...w, origin: newOrigin, position: newPosition };
            }

            // No snap - calculate position normally
            const newOrigin = w.origin;
            const newPosition = calculateNormalizedPosition(
              clampedPx,
              newOrigin,
              w.size,
              viewportWidth,
              viewportHeight,
            );

            saveWindowState(
              id,
              newOrigin,
              newPosition,
              w.size,
              w.isMinimized,
              w.docked,
              w.magneticSnap,
            );

            return { ...w, origin: newOrigin, position: newPosition };
          }
          return w;
        }),
      );
    },
    [],
  );

  const updateWindowSize = useCallback((id: string, size: WindowSize) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          saveWindowState(
            id,
            w.origin,
            w.position,
            size,
            w.isMinimized,
            w.docked,
            w.magneticSnap,
          );
          return { ...w, size };
        }
        return w;
      }),
    );
  }, []);

  const updateWindowContent = useCallback((id: string, content: ReactNode) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, content };
        }
        return w;
      }),
    );
  }, []);

  const updateWindowBadge = useCallback(
    (id: string, badge: string | number | undefined) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            return { ...w, badge };
          }
          return w;
        }),
      );
    },
    [],
  );

  const undockWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id && w.docked !== "none" && w.beforeDockedState) {
          const updated = {
            ...w,
            docked: "none" as DockedPosition,
            origin: w.beforeDockedState.origin,
            position: w.beforeDockedState.position,
            size: w.beforeDockedState.size,
            beforeDockedState: undefined,
          };
          // Save the undocked state
          saveWindowState(
            w.id,
            w.beforeDockedState.origin,
            w.beforeDockedState.position,
            w.beforeDockedState.size,
            w.isMinimized,
            "none",
            w.magneticSnap,
          );
          return updated;
        }
        return w;
      }),
    );
  }, []);

  const dockWindow = useCallback(
    (id: string, position: DockedPosition) => {
      if (position === "none") {
        undockWindow(id);
        return;
      }

      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === id && w.dockable !== false) {
            const bounds = getDockedBounds(position);
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // For docked windows, use simple pixel-based position
            const dockedOrigin: WindowOrigin = { x: 0, y: 0 };
            const dockedPosition: WindowPosition = {
              x: bounds.x / viewportWidth,
              y: bounds.y / viewportHeight,
            };

            const updated = {
              ...w,
              docked: position,
              beforeDockedState:
                w.docked === "none"
                  ? { origin: w.origin, position: w.position, size: w.size }
                  : w.beforeDockedState,
              origin: dockedOrigin,
              position: dockedPosition,
              size: { width: bounds.width, height: bounds.height },
            };
            // Save the docked state
            saveWindowState(
              w.id,
              dockedOrigin,
              dockedPosition,
              { width: bounds.width, height: bounds.height },
              w.isMinimized,
              position,
              w.magneticSnap,
            );
            return updated;
          }
          return w;
        }),
      );
    },
    [getDockedBounds, undockWindow],
  );

  const updateMagneticSnap = useCallback((id: string, snap: MagneticSnap) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          // Update origin based on new magnetic snap
          const newOrigin = getOriginFromMagneticSnap(snap, w.origin);
          return { ...w, magneticSnap: snap, origin: newOrigin };
        }
        return w;
      }),
    );
  }, []);

  const resetWindowLayout = useCallback(async () => {
    const success = await resetToDefaultLayout();
    if (success) {
      // Force reload to apply new layout
      window.location.reload();
    }
  }, []);

  const value: WindowManagerContextType = {
    windows,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowPositionPx,
    updateWindowSize,
    updateWindowContent,
    updateWindowBadge,
    dockWindow,
    undockWindow,
    getDockedBounds,
    updateMagneticSnap,
    resetWindowLayout,
    getWindowPixelPosition,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
};
