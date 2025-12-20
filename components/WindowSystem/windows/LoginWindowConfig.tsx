import {LogIn} from "lucide-react";

import {WindowConfig} from "../types";

import {LoginWindow} from "./components/LoginWindow";

export const LOGIN_WINDOW_ID = "login-window";

interface CreateLoginWindowConfigProps {
  onConnect: (entityId: string) => void;
  isConnected: boolean;
  wsConnected: boolean;
  loginError?: string | null;
}

export const createLoginWindowConfig = ({
  onConnect,
  isConnected,
  wsConnected,
  loginError = null,
}: CreateLoginWindowConfigProps): WindowConfig => {
  // Adjust height based on content
  const hasError = loginError && !isConnected;
  const height = hasError ? 320 : 250;

  return {
    id: LOGIN_WINDOW_ID,
    title: "Login",
    icon: <LogIn size={16} />,
    defaultOrigin: { x: 0.5, y: 0.5 }, // center of window
    defaultPosition: { x: 0.5, y: 0.4 }, // slightly above center of viewport
    defaultSize: { width: 500, height },
    closeable: isConnected,
    minimizable: isConnected,
    resizable: false,
    showInDock: isConnected,
    decorated: true,
    pinned: !isConnected,
    lockSize: true,
    content: (
      <LoginWindow
        onConnect={onConnect}
        isConnected={isConnected}
        wsConnected={wsConnected}
        loginError={loginError}
      />
    ),
  };
};
