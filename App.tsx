import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { KeyBindingManager, DEFAULT_KEY_BINDINGS } from "./commands";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { GameView } from "./components/GameView";
import { HUD } from "./components/HUD";
import {
  SplashNotification,
  useSplashNotifications,
} from "./components/SplashNotification";
import { SplashScreen } from "./components/SplashScreen";
import {
  WindowManagerProvider,
  useWindowManager,
} from "./components/WindowSystem";
import { createServerSelectionWindowConfig } from "./components/WindowSystem/windows";
import {
  useGameState,
  useWebSocket,
  useCamera,
  usePathfinding,
  useCommandSystem,
  useInputHandling,
} from "./hooks";
import { ContextMenuData, ServerInfo, ServerManager, LogType } from "./types";

const App: React.FC = () => {
  const keyBindingManager = useMemo(() => {
    const manager = new KeyBindingManager(DEFAULT_KEY_BINDINGS);
    manager.loadFromLocalStorage();
    return manager;
  }, []);

  // Game state hook
  const {
    world,
    player,
    entities,
    logs,
    gameState,
    activeEntityId,
    speechBubbles,
    entityRegistry,
    addLog,
    handleServerMessage,
  } = useGameState();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // UI State
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveEntityIdRef = useRef<string | null>(null);
  const [inspectEntityHandler, setInspectEntityHandler] = useState<
    ((entity: any) => void) | null
      >(null);

  // Memoized callback to prevent infinite loop in WindowSystem
  const handleInspectEntityCallback = useCallback(
    (handler: (entity: any) => void) => {
      setInspectEntityHandler(() => handler);
    },
    [],
  );

  // UI Settings
  const [splashNotificationsEnabled, setSplashNotificationsEnabled] = useState(
    () => {
      const saved = localStorage.getItem("splashNotificationsEnabled");
      const value = saved !== null ? JSON.parse(saved) : true;
      return value;
    },
  );

  const [autoSkipEnabled, setAutoSkipEnabled] = useState(false);

  const handleToggleAutoSkip = useCallback(() => {
    setAutoSkipEnabled(prev => !prev);
  }, []);

  // Splash Notifications
  const {
    notifications: splashNotifications,
    showNotification: showSplashNotification,
    removeNotification: removeSplashNotification,
  } = useSplashNotifications();

  const handleToggleSplashNotifications = useCallback((enabled: boolean) => {
    setSplashNotificationsEnabled(enabled);
    localStorage.setItem("splashNotificationsEnabled", JSON.stringify(enabled));
  }, []);

  // Server state
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);

  // WebSocket hook (no auto-connect)
  const {
    sendCommand: wsSendCommand,
    setAuthenticated,
    connect: wsConnect,
    isInitialized: wsInitialized,
  } = useWebSocket({
    onMessage: handleServerMessage,
    onConnectionChange: setIsConnected,
    onAuthenticationChange: (authenticated) => {
      setIsAuthenticated(authenticated);
      setAuthenticated(authenticated);
    },
    onReconnectChange: setIsReconnecting,
    onLoginError: setLoginError,
    addLog,
    autoConnect: false,
  });

  // Handle server selection and connect
  const handleServerConnect = useCallback(
    (server: ServerInfo) => {
      setSelectedServer(server);
      const url = ServerManager.getServerUrl(server);
      addLog(`Connecting to ${server.name} (${url})...`, LogType.INFO);
      wsConnect(url);
    },
    [wsConnect, addLog],
  );

  // Camera hook
  const {
    zoom,
    isZooming,
    isPanning,
    followedEntityId,
    cameraOffset,
    handleWheel,
    goToPosition,
    goToEntity,
    followEntity,
    resetZoom,
    toggleFollow,
  } = useCamera({
    world,
    player,
    entityRegistry,
    containerRef,
    onPanningChange: (panning) => {
      if (panning) {
        setContextMenu(null);
      }
    },
  });

  // Command system hook
  const {
    sendCommand,
    sendTextCommand,
    handleUseItem,
    handleDropItem,
    handleEquipItem,
    handleUnequipItem,
    handleLogin: commandLogin,
    handleMovePlayer,
  } = useCommandSystem({
    player,
    activeEntityId,
    entityRegistry,
    sendCommand: wsSendCommand,
    addLog,
  });

  // Pathfinding hook
  const { pathfindingTarget, currentPath, handleGoToPathfinding } =
    usePathfinding({
      player,
      world,
      activeEntityId,
      addLog,
      sendCommand,
    });

  // Auto-skip turn logic
  useEffect(() => {
    if (
      autoSkipEnabled &&
      activeEntityId &&
      player &&
      activeEntityId === player.id
    ) {
      const timer = setTimeout(() => {
        sendCommand("WAIT");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoSkipEnabled, activeEntityId, player, sendCommand]);

  // Input handling hook
  const {
    selectedTargetEntityId,
    selectedTargetPosition,
    handleSelectEntity,
    handleSelectPosition,
    handleContextMenu,
  } = useInputHandling({
    keyBindingManager,
    selectedTargetEntityId: null,
    selectedTargetPosition: null,
    radialMenuOpen,
    contextMenu,
    sendCommand,
    setRadialMenuOpen,
    setContextMenu,
  });

  // Handle login with authentication state update
  const handleLogin = useCallback(
    (entityId: string) => {
      setLoginError(null);
      commandLogin(entityId);
      setIsAuthenticated(true);
      setAuthenticated(true);
    },
    [commandLogin, setAuthenticated],
  );

  // Handle entity selection and navigation
  const handleGoToEntityWrapper = useCallback(
    (entityId: string) => {
      handleSelectEntity(entityId);
      const entity = entityRegistry.get(entityId);
      if (entity) {
        handleSelectPosition(entity.pos.x, entity.pos.y);
      }
      goToEntity(entityId);
    },
    [handleSelectEntity, handleSelectPosition, goToEntity, entityRegistry],
  );

  // Handle position navigation
  const handleGoToPositionWrapper = useCallback(
    (position: { x: number; y: number }) => {
      handleSelectPosition(position.x, position.y);
      goToPosition(position);
    },
    [handleSelectPosition, goToPosition],
  );

  // Close context menu when panning starts (moved to camera hook to avoid cascading renders)

  // Show "Ваш ход" notification when turn changes to player
  useEffect(() => {
    if (
      splashNotificationsEnabled &&
      activeEntityId &&
      player &&
      activeEntityId === player.id &&
      prevActiveEntityIdRef.current !== player.id
    ) {
      showSplashNotification("Ваш ход");
    }
    prevActiveEntityIdRef.current = activeEntityId;
  }, [
    activeEntityId,
    player,
    showSplashNotification,
    splashNotificationsEnabled,
  ]);

  const selectedTarget = selectedTargetEntityId
    ? entities.find((e) => e.id === selectedTargetEntityId)
    : null;

  // Component to handle server selection window
  const ServerSelectionHandler = () => {
    const { openWindow, windows, closeWindow } = useWindowManager();

    useEffect(() => {
      // Only show server selection if not connected and window not already open
      if (!selectedServer && wsInitialized) {
        const serverWindowExists = windows.some(
          (w) => w.id === "server-selection",
        );
        if (!serverWindowExists) {
          openWindow(
            createServerSelectionWindowConfig({
              onConnect: handleServerConnect,
            }),
          );
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServer, wsInitialized, windows, openWindow]);

    // Close server selection window after connecting
    useEffect(() => {
      if (selectedServer && isConnected) {
        const serverWindowExists = windows.some(
          (w) => w.id === "server-selection",
        );
        if (serverWindowExists) {
          closeWindow("server-selection");
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServer, isConnected, windows, closeWindow]);

    return null;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 overflow-hidden text-gray-300 font-mono">
      {/* Connection Status Indicators */}
      <ConnectionStatus
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        reconnectAttempt={reconnectAttempt}
        loginError={loginError}
      />

      {/* HUD - Status Panel and Windows */}
      <WindowManagerProvider>
        <ServerSelectionHandler />
        <HUD
          player={player}
          entities={entities}
          gameState={gameState}
          globalTick={world?.globalTick ?? 0}
          selectedTarget={selectedTarget}
          activeEntityId={activeEntityId}
          logs={logs}
          keyBindingManager={keyBindingManager}
          onEntityClick={handleGoToEntityWrapper}
          onGoToPosition={handleGoToPositionWrapper}
          onGoToEntity={handleGoToEntityWrapper}
          onSendCommand={sendTextCommand}
          onContextMenu={handleContextMenu}
          onInspectEntity={handleInspectEntityCallback}
          splashNotificationsEnabled={splashNotificationsEnabled}
          onToggleSplashNotifications={handleToggleSplashNotifications}
          playerInventory={player?.inventory ?? []}
          playerInventoryData={player?.inventoryData}
          playerEquipment={player?.equipment}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onLogin={handleLogin}
          isAuthenticated={isAuthenticated}
          wsConnected={isConnected}
          loginError={loginError}
          radialMenuOpen={radialMenuOpen}
          contextMenuOpen={contextMenu !== null}
        />
      </WindowManagerProvider>

      {/* Game View - Game Grid and Camera */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-black flex flex-col relative border-r border-neutral-800">
          <GameView
            ref={containerRef}
            world={world}
            player={player}
            entities={entities}
            zoom={zoom}
            isZooming={isZooming}
            isPanning={isPanning}
            followedEntityId={followedEntityId}
            cameraOffset={cameraOffset}
            speechBubbles={speechBubbles}
            radialMenuOpen={radialMenuOpen}
            selectedTargetEntityId={selectedTargetEntityId}
            selectedTargetPosition={selectedTargetPosition}
            pathfindingTarget={pathfindingTarget}
            currentPath={currentPath}
            contextMenu={contextMenu}
            entityRegistry={entityRegistry}
            onWheel={handleWheel}
            onResetZoom={resetZoom}
            onToggleFollow={toggleFollow}
            onMovePlayer={handleMovePlayer}
            onSelectEntity={handleSelectEntity}
            onSelectPosition={handleSelectPosition}
            onFollowEntity={followEntity}
            onSendCommand={sendCommand}
            onGoToPathfinding={handleGoToPathfinding}
            onContextMenu={handleContextMenu}
            onRadialMenuChange={setRadialMenuOpen}
            onCloseContextMenu={() => setContextMenu(null)}
            onInspectEntity={(entity) => inspectEntityHandler?.(entity)}
            autoSkipEnabled={autoSkipEnabled}
            onToggleAutoSkip={handleToggleAutoSkip}
          />
        </div>
      </div>

      {/* Splash Notifications */}
      {splashNotifications.map((notification) => (
        <SplashNotification
          key={notification.id}
          notification={notification}
          onComplete={removeSplashNotification}
        />
      ))}

      {/* App Splash Screen */}
      {showSplashScreen && (
        <SplashScreen onComplete={() => setShowSplashScreen(false)} />
      )}
    </div>
  );
};

export default App;
