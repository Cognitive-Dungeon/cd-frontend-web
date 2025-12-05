import {
  WindowsStorage,
  StoredWindowState,
  WindowPosition,
  WindowSize,
  DockedPosition,
  MagneticSnap,
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
  position: WindowPosition,
  size: WindowSize,
  isMinimized: boolean,
  docked?: DockedPosition,
  magneticSnap?: MagneticSnap,
): void => {
  const currentState = loadWindowsState();
  currentState[windowId] = {
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

export const clampPosition = (
  position: WindowPosition,
  windowWidth: number,
  windowHeight: number,
): WindowPosition => {
  // Получаем размеры вьюпорта
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Вычисляем границы для позиции окна
  // Окно должно полностью оставаться в пределах вьюпорта
  const minX = 0;
  const maxX = Math.max(0, viewportWidth - windowWidth);

  const minY = 0;
  const maxY = Math.max(0, viewportHeight - windowHeight);

  // Ограничиваем позицию окна в этих пределах
  const clampedX = Math.max(minX, Math.min(position.x, maxX));
  const clampedY = Math.max(minY, Math.min(position.y, maxY));

  return {
    x: clampedX,
    y: clampedY,
  };
};
