import { FC, useEffect, useRef, useCallback } from "react";

import { KeyBindingManager } from "../../commands";

import {
  Entity,
  LogMessage,
  Position,
  ContextMenuData,
  Item,
  ServerToClientEquipmentView,
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
  LOGIN_WINDOW_ID,
  createLoginWindowConfig,
  ENTITY_INSPECTOR_WINDOW_ID,
  createEntityInspectorWindowConfig,
  ITEM_INSPECTOR_WINDOW_ID,
  createItemInspectorWindowConfig,
  QUICK_ACCESS_WINDOW_ID,
  createQuickAccessWindowConfig,
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
  onInspectEntity?: (handler: (entity: Entity) => void) => void;
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;
  playerInventory?: Item[];
  playerInventoryData?: {
    maxSlots?: number;
    currentWeight?: number;
    maxWeight?: number;
  } | null;
  playerEquipment?: ServerToClientEquipmentView | null;
  onUseItem?: (item: Item, targetEntityId?: string) => void;
  onDropItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  onLogin?: (entityId: string) => void;
  isAuthenticated?: boolean;
  wsConnected?: boolean;
  loginError?: string | null;
  radialMenuOpen?: boolean;
  contextMenuOpen?: boolean;
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
  onInspectEntity,
  splashNotificationsEnabled,
  onToggleSplashNotifications,
  playerInventory = [],
  playerInventoryData,
  playerEquipment,
  onUseItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onLogin,
  isAuthenticated = false,
  wsConnected = false,
  loginError = null,
  radialMenuOpen = false,
  contextMenuOpen = false,
}) => {
  const {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    updateWindowContent,
    updateWindowBadge,
    resetWindowLayout,
  } = useWindowManager();
  const turnOrderBarInitializedRef = useRef(false);
  const loginWindowClosedRef = useRef(false);
  const windowsRef = useRef(windows);
  const prevEntitiesRef = useRef<Entity[]>([]);
  const handleInspectEntityRef = useRef<(entity: Entity) => void>(() => {});
  const handleInspectItemRef = useRef<(item: Item) => void>(() => {});

  // Handle opening entity inspector - update ref on every render
  handleInspectEntityRef.current = (entity: Entity) => {
    openWindow(
      createEntityInspectorWindowConfig({ entity, entities: entities || [] }),
    );
  };

  // Handle opening item inspector - update ref on every render
  handleInspectItemRef.current = (item: Item) => {
    openWindow(createItemInspectorWindowConfig({ item }));
  };

  // Expose stable wrapper through onInspectEntity prop (only once on mount)
  useEffect(() => {
    if (onInspectEntity) {
      onInspectEntity((entity: Entity) => {
        handleInspectEntityRef.current?.(entity);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep ref in sync with windows state
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

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

          inventoryData: playerInventoryData,

          onUseItem,
          onDropItem,
          onEquipItem,
          onInspectItem: (item) => handleInspectItemRef.current?.(item),
        }),
      );
    }

    const quickAccessExists = windows.some(
      (w) => w.id === QUICK_ACCESS_WINDOW_ID,
    );

    if (!quickAccessExists) {
      openWindow(
        createQuickAccessWindowConfig({
          slots: playerInventory,

          inventoryItems: playerInventory,
          totalSlots: 6,

          onUsePinnedItem: (item) => onUseItem?.(item),
          onDropItem: (item) => onDropItem?.(item),
          onEquipItem: (item) => onEquipItem?.(item),
          onUnequipItem: (item) => onUnequipItem?.(item),
          onInspectItem: (item) => handleInspectItemRef.current?.(item),
          equipment: playerEquipment
            ? ([playerEquipment.weapon, playerEquipment.armor].filter(
                Boolean,
              ) as Item[])
            : [],
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

    // Always open login window when not authenticated (but only if connected to server)
    if (onLogin && !isAuthenticated && wsConnected) {
      const loginExists = windows.some((w) => w.id === LOGIN_WINDOW_ID);
      const loginWindow = windows.find((w) => w.id === LOGIN_WINDOW_ID);

      if (!loginExists) {
        openWindow(
          createLoginWindowConfig({
            onConnect: onLogin,
            isConnected: isAuthenticated,
            wsConnected,
            loginError,
          }),
        );
      } else if (loginWindow?.isMinimized) {
        restoreWindow(LOGIN_WINDOW_ID);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    onLogin,
    isAuthenticated,
    wsConnected,
    loginError,
    // restoreWindow is stable from context, safe to use without dependency
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

      inventoryData: playerInventoryData,

      equipment: playerEquipment,

      onUseItem,

      onDropItem,

      onEquipItem,

      onUnequipItem,

      onInspectItem: (item) => handleInspectItemRef.current?.(item),
    });

    updateWindowContent(INVENTORY_WINDOW_ID, inventoryConfig.content);

    updateWindowBadge(INVENTORY_WINDOW_ID, inventoryConfig.badge);
  }, [
    playerInventory,

    playerInventoryData,

    playerEquipment,

    onUseItem,

    onDropItem,

    onEquipItem,

    onUnequipItem,

    updateWindowContent,

    updateWindowBadge,
  ]);

  // Update QuickAccessWindow content when player inventory or use handler changes
  useEffect(() => {
    const quickAccessConfig = createQuickAccessWindowConfig({
      slots: playerInventory,
      inventoryItems: playerInventory,
      totalSlots: 6,
      onUsePinnedItem: (item) => onUseItem?.(item),
      onDropItem: (item) => onDropItem?.(item),
      onEquipItem: (item) => onEquipItem?.(item),
      onUnequipItem: (item) => onUnequipItem?.(item),
      onInspectItem: (item) => handleInspectItemRef.current?.(item),
      equipment: playerEquipment
        ? ([playerEquipment.weapon, playerEquipment.armor].filter(
            Boolean,
          ) as Item[])
        : [],
    });
    updateWindowContent(QUICK_ACCESS_WINDOW_ID, quickAccessConfig.content);
  }, [
    playerInventory,
    playerEquipment,
    onUseItem,
    onDropItem,
    onEquipItem,
    onUnequipItem,
    updateWindowContent,
  ]);

  // Update EntityInspectorWindow content when entities change
  useEffect(() => {
    // Find all open entity inspector windows
    const inspectorWindows = windowsRef.current.filter((window) =>
      window.id.startsWith(ENTITY_INSPECTOR_WINDOW_ID),
    );

    if (inspectorWindows.length === 0) {
      return;
    }

    // Check if any relevant entity changed
    let shouldUpdate = false;
    const prevEntities = prevEntitiesRef.current;

    inspectorWindows.forEach((window) => {
      const entityId = window.id.replace(`${ENTITY_INSPECTOR_WINDOW_ID}-`, "");
      const currentEntity = entities.find((e) => e.id === entityId);
      const prevEntity = prevEntities.find((e) => e.id === entityId);

      if (JSON.stringify(currentEntity) !== JSON.stringify(prevEntity)) {
        shouldUpdate = true;
      }
    });

    if (!shouldUpdate) {
      return;
    }

    prevEntitiesRef.current = entities;

    // Update content for each inspector window
    inspectorWindows.forEach((window) => {
      const entityId = window.id.replace(`${ENTITY_INSPECTOR_WINDOW_ID}-`, "");
      const entity = entities.find((e) => e.id === entityId);
      if (entity) {
        const inspectorConfig = createEntityInspectorWindowConfig({
          entity,
          entities,
        });
        updateWindowContent(window.id, inspectorConfig.content);
      }
    });
  }, [entities, updateWindowContent]);

  // Update LoginWindow content when connection state changes
  useEffect(() => {
    if (onLogin) {
      const loginConfig = createLoginWindowConfig({
        onConnect: onLogin,
        isConnected: isAuthenticated,
        wsConnected,
        loginError,
      });
      updateWindowContent(LOGIN_WINDOW_ID, loginConfig.content);
    }
  }, [onLogin, isAuthenticated, wsConnected, loginError, updateWindowContent]);

  // Auto-close login window after successful authentication
  useEffect(() => {
    if (isAuthenticated && !loginWindowClosedRef.current) {
      loginWindowClosedRef.current = true;
      // Wait a bit to show the success message, then close
      setTimeout(() => {
        closeWindow(LOGIN_WINDOW_ID);
      }, 2000);
    }
  }, [isAuthenticated, closeWindow]);

  // Escape key handler to close/minimize windows by z-index
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return;
      }

      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Don't handle if radial menu or context menu is open (higher priority)
      if (radialMenuOpen || contextMenuOpen) {
        return;
      }

      // Find focused window first, fallback to highest zIndex
      const currentWindows = windowsRef.current;
      if (currentWindows.length > 0) {
        // First, try to find a focused window
        let targetWindow = currentWindows.find((w) => w.isFocused);

        // If no focused window, find the one with highest zIndex
        if (!targetWindow) {
          targetWindow = currentWindows.reduce((top, current) => {
            return current.zIndex > top.zIndex ? current : top;
          });
        }

        // Try to close the window, if it can't be closed, try to minimize it
        if (targetWindow.closeable) {
          closeWindow(targetWindow.id);
          e.preventDefault();
          e.stopImmediatePropagation(); // Prevent other Escape handlers from firing
        } else if (targetWindow.minimizable) {
          minimizeWindow(targetWindow.id);
          e.preventDefault();
          e.stopImmediatePropagation(); // Prevent other Escape handlers from firing
        }
        // If neither closeable nor minimizable, do nothing (e.g., Dock, TurnOrderBar)
      }
    };

    window.addEventListener("keydown", handleEscape, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleEscape, { capture: true });
    };
  }, [closeWindow, minimizeWindow, radialMenuOpen, contextMenuOpen]);

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
