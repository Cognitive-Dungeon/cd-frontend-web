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

export interface MagneticSnap {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  windowId?: string; // ID of window this is snapped to
  windowEdge?: "left" | "right" | "top" | "bottom"; // Which edge of target window we're snapped to
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
  if (!magneticSnap) {
    return currentOrigin;
  }

  let originX = currentOrigin.x;
  let originY = currentOrigin.y;

  if (magneticSnap.left) {
    originX = 0;
  } else if (magneticSnap.right) {
    originX = 1;
  }

  if (magneticSnap.top) {
    originY = 0;
  } else if (magneticSnap.bottom) {
    originY = 1;
  }

  return { x: originX, y: originY };
}
