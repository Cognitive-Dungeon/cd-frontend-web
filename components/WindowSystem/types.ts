export interface WindowOrigin {
  x: number; // 0 = left edge, 1 = right edge
  y: number; // 0 = top edge, 1 = bottom edge
}

export interface WindowPosition {
  x: number; // 0 = left edge of viewport, 1 = right edge of viewport
  y: number; // 0 = top edge of viewport, 1 = bottom edge of viewport
}

export interface WindowSize {
  width: number;
  height: number;
}

export type DockedPosition = "none" | "left" | "right";

export type MinimizeBehavior = "hide" | "collapse";

// 9-point snap system
// Each point is defined by normalized coordinates (0, 0.5, or 1)
export type SnapPointValue = 0 | 0.5 | 1;

export interface SnapPoint {
  x: SnapPointValue;
  y: SnapPointValue;
}

// All 9 snap points
export const SNAP_POINTS: SnapPoint[] = [
  { x: 0, y: 0 }, // top-left
  { x: 0.5, y: 0 }, // top-center
  { x: 1, y: 0 }, // top-right
  { x: 0, y: 0.5 }, // middle-left
  { x: 0.5, y: 0.5 }, // center
  { x: 1, y: 0.5 }, // middle-right
  { x: 0, y: 1 }, // bottom-left
  { x: 0.5, y: 1 }, // bottom-center
  { x: 1, y: 1 }, // bottom-right
];

export interface MagneticSnap {
  // Which snap point of the window is snapped
  windowPoint?: SnapPoint;
  // Which snap point of the viewport it's snapped to
  viewportPoint?: SnapPoint;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  title: string;
  isMinimized: boolean;
  minimizeBehavior?: MinimizeBehavior;
  isFocused: boolean;
  origin: WindowOrigin;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  closeable: boolean;
  minimizable: boolean;
  resizable: boolean;
  resizableX?: boolean;
  resizableY?: boolean;
  showInDock: boolean;
  decorated: boolean;
  pinned?: boolean;
  lockSize?: boolean;
  lockHeight?: boolean;
  dockable?: boolean;
  docked?: DockedPosition;
  beforeDockedState?: {
    origin: WindowOrigin;
    position: WindowPosition;
    size: WindowSize;
  };
  magneticSnap?: MagneticSnap;
  icon?: React.ReactNode;
  badge?: string | number; // Badge to display on dock icon
  content: React.ReactNode;
}

export interface WindowConfig {
  id: string;
  title: string;
  minimizeBehavior?: MinimizeBehavior;
  closeable?: boolean;
  minimizable?: boolean;
  resizable?: boolean;
  resizableX?: boolean;
  resizableY?: boolean;
  showInDock?: boolean;
  decorated?: boolean;
  pinned?: boolean;
  lockSize?: boolean;
  lockHeight?: boolean;
  dockable?: boolean;
  icon?: React.ReactNode;
  badge?: string | number; // Badge to display on dock icon
  defaultOrigin?: WindowOrigin;
  defaultPosition?: WindowPosition;
  defaultSize?: WindowSize;
  minSize?: WindowSize;
  content: React.ReactNode;
}

export interface StoredWindowState {
  origin: WindowOrigin;
  position: WindowPosition;
  size: WindowSize;
  isMinimized: boolean;
  docked?: DockedPosition;
  magneticSnap?: MagneticSnap;
}

export type WindowsStorage = Record<string, StoredWindowState>;

// Helper function to calculate window top-left position in pixels
// window_top_left_position_px = viewport_size_px * position - window_size_px * origin
export function calculateWindowTopLeftPx(
  origin: WindowOrigin,
  position: WindowPosition,
  windowSize: WindowSize,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  return {
    x: viewportWidth * position.x - windowSize.width * origin.x,
    y: viewportHeight * position.y - windowSize.height * origin.y,
  };
}

// Helper function to convert pixel position back to normalized position
// Given a top-left pixel position and origin, calculate the normalized position
export function calculateNormalizedPosition(
  topLeftPx: { x: number; y: number },
  origin: WindowOrigin,
  windowSize: WindowSize,
  viewportWidth: number,
  viewportHeight: number,
): WindowPosition {
  // window_top_left_px = viewport_size * position - window_size * origin
  // position = (window_top_left_px + window_size * origin) / viewport_size
  return {
    x: (topLeftPx.x + windowSize.width * origin.x) / viewportWidth,
    y: (topLeftPx.y + windowSize.height * origin.y) / viewportHeight,
  };
}

// Helper to determine origin based on magnetic snap
export function getOriginFromMagneticSnap(
  magneticSnap: MagneticSnap | undefined,
  currentOrigin: WindowOrigin,
): WindowOrigin {
  if (!magneticSnap || !magneticSnap.windowPoint) {
    return currentOrigin;
  }

  return {
    x: magneticSnap.windowPoint.x,
    y: magneticSnap.windowPoint.y,
  };
}

// Helper to get position from magnetic snap
export function getPositionFromMagneticSnap(
  magneticSnap: MagneticSnap | undefined,
  currentPosition: WindowPosition,
): WindowPosition {
  if (!magneticSnap || !magneticSnap.viewportPoint) {
    return currentPosition;
  }

  return {
    x: magneticSnap.viewportPoint.x,
    y: magneticSnap.viewportPoint.y,
  };
}

// Calculate pixel position of a snap point on a window
export function getWindowSnapPointPx(
  windowTopLeftPx: { x: number; y: number },
  windowSize: WindowSize,
  snapPoint: SnapPoint,
): { x: number; y: number } {
  return {
    x: windowTopLeftPx.x + windowSize.width * snapPoint.x,
    y: windowTopLeftPx.y + windowSize.height * snapPoint.y,
  };
}

// Calculate pixel position of a snap point on the viewport
export function getViewportSnapPointPx(
  viewportWidth: number,
  viewportHeight: number,
  snapPoint: SnapPoint,
): { x: number; y: number } {
  return {
    x: viewportWidth * snapPoint.x,
    y: viewportHeight * snapPoint.y,
  };
}

// Find the closest snap between window and viewport points
export function findClosestSnap(
  windowTopLeftPx: { x: number; y: number },
  windowSize: WindowSize,
  viewportWidth: number,
  viewportHeight: number,
  threshold: number,
): {
  windowPoint: SnapPoint;
  viewportPoint: SnapPoint;
  distance: number;
} | null {
  let closestSnap: {
    windowPoint: SnapPoint;
    viewportPoint: SnapPoint;
    distance: number;
  } | null = null;

  for (const windowPoint of SNAP_POINTS) {
    const windowPx = getWindowSnapPointPx(
      windowTopLeftPx,
      windowSize,
      windowPoint,
    );

    for (const viewportPoint of SNAP_POINTS) {
      const viewportPx = getViewportSnapPointPx(
        viewportWidth,
        viewportHeight,
        viewportPoint,
      );

      const dx = windowPx.x - viewportPx.x;
      const dy = windowPx.y - viewportPx.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold) {
        if (!closestSnap || distance < closestSnap.distance) {
          closestSnap = { windowPoint, viewportPoint, distance };
        }
      }
    }
  }

  return closestSnap;
}
