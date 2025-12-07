import { FC, useEffect, useRef, useCallback } from "react";

import { KeyBindingManager } from "../../commands";
import {
  Entity,
  LogMessage,
  Position,
  ContextMenuData,
  Item,
} from "../../types";

import { getStoredWindowState } from "./utils";
import Window from "./Window";
import { useWindowManager } from "./WindowManager";
import {
  DOCK_WINDOW_ID,
  createDockWindowConfig,
  SETTINGS_WINDOW_ID,
  createSettingsWindowConfig,
  TURN_ORDER_BAR_WINDOW_ID,
  createTurnOrderBarWindowConfig,
  TURN_ORDER_WINDOW_ID,
  createTurnOrderWindowConfig,
  CASINO_WINDOW_ID,
  createCasinoWindowConfig,
  GAME_LOG_WINDOW_ID,
  createGameLogWindowConfig,
  INVENTORY_WINDOW_ID,
  createInventoryWindowConfig,
} from "./windows";

interface WindowSystemProps {
  keyBindingManager: KeyBindingManager;
  entities?: Entity[];
  activeEntityId?: string | null;
  playerId?: string | null;
  onEntityClick?: (entityId: string) => void;
  logs?: LogMessage[];
  onGoToPosition?: (position: Position) => void;
  onGoToEntity?: (entityId: string) => void;
  onSendCommand?: (text: string, type: "SAY" | "WHISPER" | "YELL") => void;
  onContextMenu?: (data: ContextMenuData) => void;
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;
  playerInventory?: Item[];
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
}

const WindowSystem: FC<WindowSystemProps> = ({
  keyBindingManager,
  entities = [],
  activeEntityId = null,
  playerId = null,
  onEntityClick,
  logs = [],
  onGoToPosition,
  onGoToEntity,
  onSendCommand,
  onContextMenu,
  splashNotificationsEnabled,
  onToggleSplashNotifications,
  playerInventory = [],
  onUseItem,
  onDropItem,
}) => {
  const {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    updateWindowContent,
    resetWindowLayout,
  } = useWindowManager();
  const turnOrderBarInitializedRef = useRef(false);

  const handleOpenCasino = useCallback(() => {
    openWindow(
      createCasinoWindowConfig({
        onClose: () => closeWindow(CASINO_WINDOW_ID),
      }),
    );
  }, [openWindow, closeWindow]);

  // Автоматически открываем Dock и Settings при монтировании
  useEffect(() => {
    const dockExists = windows.some((w) => w.id === DOCK_WINDOW_ID);
    if (!dockExists) {
      openWindow(createDockWindowConfig());
    }

    const settingsExists = windows.some((w) => w.id === SETTINGS_WINDOW_ID);
    if (!settingsExists) {
      openWindow(
        createSettingsWindowConfig({
          keyBindingManager,
          resetWindowLayout,
          onOpenCasino: handleOpenCasino,
          splashNotificationsEnabled,
          onToggleSplashNotifications,
        }),
      );

      const stored = getStoredWindowState(SETTINGS_WINDOW_ID);
      if (!stored) {
        setTimeout(() => {
          minimizeWindow(SETTINGS_WINDOW_ID);
        }, 0);
      }
    }

    const gameLogExists = windows.some((w) => w.id === GAME_LOG_WINDOW_ID);
    if (!gameLogExists) {
      openWindow(
        createGameLogWindowConfig({
          logs,
          onGoToPosition,
          onGoToEntity,
          onSendCommand,
        }),
      );
    }

    const inventoryExists = windows.some((w) => w.id === INVENTORY_WINDOW_ID);
    if (!inventoryExists) {
      openWindow(
        createInventoryWindowConfig({
          items: playerInventory,
          onUseItem,
          onDropItem,
        }),
      );
    }

    const turnOrderBarExists = windows.some(
      (w) => w.id === TURN_ORDER_BAR_WINDOW_ID,
    );
    if (
      !turnOrderBarExists &&
      entities.length > 0 &&
      !turnOrderBarInitializedRef.current
    ) {
      turnOrderBarInitializedRef.current = true;

      openWindow(
        createTurnOrderBarWindowConfig({
          entities,
          activeEntityId,
          playerId,
          onEntityClick,
          onContextMenu,
        }),
      );
    }
  }, [
    windows,
    openWindow,
    minimizeWindow,
    entities,
    activeEntityId,
    playerId,
    onEntityClick,
    handleOpenCasino,
    keyBindingManager,
    resetWindowLayout,
    logs,
    onGoToPosition,
    onGoToEntity,
    onSendCommand,
    onContextMenu,
    playerInventory,
    onUseItem,
    onDropItem,
    splashNotificationsEnabled,
    onToggleSplashNotifications,
  ]);

  // Update TurnOrderBar content when entities or turn data changes
  useEffect(() => {
    if (entities.length > 0) {
      const barConfig = createTurnOrderBarWindowConfig({
        entities,
        activeEntityId,
        playerId,
        onEntityClick,
        onContextMenu,
      });
      updateWindowContent(TURN_ORDER_BAR_WINDOW_ID, barConfig.content);
    }
  }, [
    entities,
    activeEntityId,
    playerId,
    onEntityClick,
    updateWindowContent,
    onContextMenu,
  ]);

  // Update Settings window content when splash notifications setting changes
  useEffect(() => {
    const settingsConfig = createSettingsWindowConfig({
      keyBindingManager,
      resetWindowLayout,
      onOpenCasino: handleOpenCasino,
      splashNotificationsEnabled,
      onToggleSplashNotifications,
    });
    updateWindowContent(SETTINGS_WINDOW_ID, settingsConfig.content);
  }, [
    splashNotificationsEnabled,
    onToggleSplashNotifications,
    keyBindingManager,
    resetWindowLayout,
    handleOpenCasino,
    updateWindowContent,
  ]);

  // Update TurnOrderWindow content when entities or turn data changes
  useEffect(() => {
    if (entities.length > 0) {
      const orderConfig = createTurnOrderWindowConfig({
        entities,
        activeEntityId,
        playerId,
      });
      updateWindowContent(TURN_ORDER_WINDOW_ID, orderConfig.content);
    }
  }, [entities, activeEntityId, playerId, updateWindowContent]);

  // Update GameLogWindow content when logs change
  useEffect(() => {
    const logConfig = createGameLogWindowConfig({
      logs,
      onGoToPosition,
      onGoToEntity,
      onSendCommand,
    });
    updateWindowContent(GAME_LOG_WINDOW_ID, logConfig.content);
  }, [logs, onGoToPosition, onGoToEntity, onSendCommand, updateWindowContent]);

  // Update InventoryWindow content when player inventory changes
  useEffect(() => {
    const inventoryConfig = createInventoryWindowConfig({
      items: playerInventory,
      onUseItem,
      onDropItem,
    });
    updateWindowContent(INVENTORY_WINDOW_ID, inventoryConfig.content);
  }, [playerInventory, onUseItem, onDropItem, updateWindowContent]);

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
