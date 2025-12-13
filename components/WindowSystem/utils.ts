import {
  WindowsStorage,
  StoredWindowState,
  WindowPosition,
  WindowOrigin,
  WindowSize,
  DockedPosition,
  MagneticSnap,
  calculateWindowTopLeftPx,
  calculateNormalizedPosition,
} from "./types";

const STORAGE_KEY = "cd-window-system";
const DEFAULT_LAYOUT_LOADED_KEY = "cd-default-layout-loaded";

export const loadWindowsState = (): WindowsStorage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load windows state from localStorage:", error);
  }
  return {};
};

export const saveWindowsState = (state: WindowsStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save windows state to localStorage:", error);
  }
};

export const saveWindowState = (
  windowId: string,
  origin: WindowOrigin,
  position: WindowPosition,
  size: WindowSize,
  isMinimized: boolean,
  docked?: DockedPosition,
  magneticSnap?: MagneticSnap,
): void => {
  const currentState = loadWindowsState();
  currentState[windowId] = {
    origin,
    position,
    size,
    isMinimized,
    docked,
    magneticSnap,
  };
  saveWindowsState(currentState);
};

export const getStoredWindowState = (
  windowId: string,
): StoredWindowState | null => {
  const state = loadWindowsState();
  return state[windowId] || null;
};

export const removeWindowState = (windowId: string): void => {
  const currentState = loadWindowsState();
  delete currentState[windowId];
  saveWindowsState(currentState);
};

export const loadDefaultLayout = async (): Promise<WindowsStorage | null> => {
  try {
    const response = await fetch("/assets/default-window-layout.json");
    if (!response.ok) {
      console.warn("Default window layout file not found");
      return null;
    }
    const data = await response.json();
    return data.windows || null;
  } catch (error) {
    console.error("Failed to load default window layout:", error);
    return null;
  }
};

export const isDefaultLayoutLoaded = (): boolean => {
  return localStorage.getItem(DEFAULT_LAYOUT_LOADED_KEY) === "true";
};

export const markDefaultLayoutAsLoaded = (): void => {
  localStorage.setItem(DEFAULT_LAYOUT_LOADED_KEY, "true");
};

export const applyDefaultLayout = async (): Promise<boolean> => {
  if (isDefaultLayoutLoaded()) {
    return false; // Already loaded
  }

  const defaultLayout = await loadDefaultLayout();
  if (!defaultLayout) {
    return false;
  }

  // Merge default layout with existing state (existing takes priority)
  const currentState = loadWindowsState();
  const mergedState = { ...defaultLayout, ...currentState };

  saveWindowsState(mergedState);
  markDefaultLayoutAsLoaded();

  return true;
};

export const resetToDefaultLayout = async (): Promise<boolean> => {
  const defaultLayout = await loadDefaultLayout();
  if (!defaultLayout) {
    return false;
  }

  // Replace entire state with default layout
  saveWindowsState(defaultLayout);
  localStorage.removeItem(DEFAULT_LAYOUT_LOADED_KEY);
  markDefaultLayoutAsLoaded();

  return true;
};

// Clamp position in pixel coordinates to keep window within viewport
export const clampPositionPx = (
  topLeftPx: { x: number; y: number },
  windowWidth: number,
  windowHeight: number,
): { x: number; y: number } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const minX = 0;
  const maxX = Math.max(0, viewportWidth - windowWidth);
  const minY = 0;
  const maxY = Math.max(0, viewportHeight - windowHeight);

  const clampedX = Math.max(minX, Math.min(topLeftPx.x, maxX));
  const clampedY = Math.max(minY, Math.min(topLeftPx.y, maxY));

  return {
    x: clampedX,
    y: clampedY,
  };
};

// Calculate pixel position from origin/position and clamp it
export const getClampedPixelPosition = (
  origin: WindowOrigin,
  position: WindowPosition,
  windowSize: WindowSize,
): { x: number; y: number } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const topLeftPx = calculateWindowTopLeftPx(
    origin,
    position,
    windowSize,
    viewportWidth,
    viewportHeight,
  );

  return clampPositionPx(topLeftPx, windowSize.width, windowSize.height);
};

// Update normalized position after clamping to keep consistency
export const clampAndUpdatePosition = (
  origin: WindowOrigin,
  position: WindowPosition,
  windowSize: WindowSize,
): { clampedPx: { x: number; y: number }; updatedPosition: WindowPosition } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const clampedPx = getClampedPixelPosition(origin, position, windowSize);

  const updatedPosition = calculateNormalizedPosition(
    clampedPx,
    origin,
    windowSize,
    viewportWidth,
    viewportHeight,
  );

  return { clampedPx, updatedPosition };
};

// Convert pixel position to normalized position with given origin
export const pixelToNormalizedPosition = (
  topLeftPx: { x: number; y: number },
  origin: WindowOrigin,
  windowSize: WindowSize,
): WindowPosition => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return calculateNormalizedPosition(
    topLeftPx,
    origin,
    windowSize,
    viewportWidth,
    viewportHeight,
  );
};

// Legacy compatibility: clampPosition that works with the new system
export const clampPosition = (
  origin: WindowOrigin,
  position: WindowPosition,
  windowWidth: number,
  windowHeight: number,
): { origin: WindowOrigin; position: WindowPosition } => {
  const { updatedPosition } = clampAndUpdatePosition(origin, position, {
    width: windowWidth,
    height: windowHeight,
  });
  return { origin, position: updatedPosition };
};
