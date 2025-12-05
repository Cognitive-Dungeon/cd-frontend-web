import { Settings } from "lucide-react";
import { FC, useEffect } from "react";

import Dock from "./Dock";
import { useWindowManager } from "./WindowManager";
import { getStoredWindowState } from "./utils";
import Window from "./Window";

const DOCK_WINDOW_ID = "system-dock";
const SETTINGS_WINDOW_ID = "settings";

const WindowSystem: FC = () => {
  const { windows, openWindow, minimizeWindow } = useWindowManager();

  // Автоматически открываем Dock и Settings при монтировании
  useEffect(() => {
    const dockExists = windows.some((w) => w.id === DOCK_WINDOW_ID);
    if (!dockExists) {
      openWindow({
        id: DOCK_WINDOW_ID,
        title: "Dock",
        closeable: false,
        minimizable: false,
        showInDock: false,
        decorated: false,
        defaultPosition: { x: 20, y: window.innerHeight - 80 },
        defaultSize: { width: 400, height: 54 },
        content: <Dock />,
      });
    }

    const settingsExists = windows.some((w) => w.id === SETTINGS_WINDOW_ID);
    if (!settingsExists) {
      openWindow({
        id: SETTINGS_WINDOW_ID,
        title: "Settings",
        closeable: false,
        minimizable: true,
        pinned: true,
        icon: <Settings size={20} />,
        defaultPosition: { x: 400, y: 100 },
        defaultSize: { width: 450, height: 350 },
        content: (
          <div className="p-4 text-gray-300">
            <p>Тут будут настройки. Возможно</p>
          </div>
        ),
      });

      const stored = getStoredWindowState(SETTINGS_WINDOW_ID);
      if (!stored) {
        setTimeout(() => {
          minimizeWindow(SETTINGS_WINDOW_ID);
        }, 0);
      }
    }
  }, [windows, openWindow, minimizeWindow]);

  return (
    <>
      {/* Render all windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}
    </>
  );
};

export default WindowSystem;
