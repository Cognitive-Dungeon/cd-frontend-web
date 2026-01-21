import {Settings} from "lucide-react";

import {KeyBindingManager} from "../../../commands";
import type {GameRendererType, ThreeRenderMode} from "../../../types";
import {WindowConfig} from "../types";

import KeybindingsSettings from "./components/KeybindingsSettings";

export const SETTINGS_WINDOW_ID = "settings";

interface SettingsWindowOptions {
  keyBindingManager: KeyBindingManager;
  resetWindowLayout: () => Promise<void>;
  onOpenCasino: () => void;
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;

  graphicsRenderer: GameRendererType;
  onGraphicsRendererChange: (renderer: GameRendererType) => void;
  threeRenderMode: ThreeRenderMode;
  onThreeRenderModeChange: (mode: ThreeRenderMode) => void;
}

export const createSettingsWindowConfig = ({
  keyBindingManager,
  resetWindowLayout,
  onOpenCasino,
  splashNotificationsEnabled,
  onToggleSplashNotifications,
  graphicsRenderer,
  onGraphicsRendererChange,
  threeRenderMode,
  onThreeRenderModeChange,
}: SettingsWindowOptions): WindowConfig => ({
  id: SETTINGS_WINDOW_ID,
  title: "Settings",
  closeable: false,
  minimizable: true,
  resizable: true,
  pinned: true,
  icon: <Settings size={20} />,
  defaultOrigin: { x: 0, y: 0 }, // top-left corner of window
  defaultPosition: { x: 0.1, y: 0.1 }, // slightly offset from top-left of viewport
  defaultSize: { width: 600, height: 500 },
  content: (
    <KeybindingsSettings
      keyBindingManager={keyBindingManager}
      resetWindowLayout={resetWindowLayout}
      onOpenCasino={onOpenCasino}
      splashNotificationsEnabled={splashNotificationsEnabled}
      onToggleSplashNotifications={onToggleSplashNotifications}
      graphicsRenderer={graphicsRenderer}
      onGraphicsRendererChange={onGraphicsRendererChange}
      threeRenderMode={threeRenderMode}
      onThreeRenderModeChange={onThreeRenderModeChange}
    />
  ),
});
