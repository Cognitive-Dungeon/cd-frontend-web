import type {FC} from "react";

import {KeyBindingManager} from "../commands";
import type {Entity, GameState, Item, LogMessage, ServerToClientEquipmentView,} from "../types";

import StatusPanel from "./StatusPanel";
import {WindowSystem} from "./WindowSystem";

interface HUDProps {
  player: Entity | null;
  entities: Entity[];
  gameState: GameState;
  globalTick: number;
  selectedTarget: Entity | null;
  activeEntityId: string | null;
  logs: LogMessage[];
  keyBindingManager: KeyBindingManager;
  onEntityClick: (entityId: string) => void;
  onGoToPosition: (position: { x: number; y: number }) => void;
  onGoToEntity: (entityId: string) => void;
  onSendCommand: (text: string, type: "SAY" | "WHISPER" | "YELL") => void;
  onContextMenu: (data: any) => void;
  onInspectEntity?: (handler: (entity: Entity) => void) => void;
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;
  playerInventory: Item[];
  playerInventoryData?: {
    maxSlots?: number;
    currentWeight?: number;
    maxWeight?: number;
  } | null;
  playerEquipment?: ServerToClientEquipmentView | null;
  onUseItem: (item: Item, targetEntityId?: string) => void;
  onDropItem: (item: Item) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (item: Item) => void;
  onLogin: (entityId: string) => void;
  isAuthenticated: boolean;
  wsConnected: boolean;
  loginError: string | null;
  radialMenuOpen: boolean;
  contextMenuOpen: boolean;
}

export const HUD: FC<HUDProps> = ({
  player,
  entities,
  gameState,
  globalTick,
  selectedTarget,
  activeEntityId,
  logs,
  keyBindingManager,
  onEntityClick,
  onGoToPosition,
  onGoToEntity,
  onSendCommand,
  onContextMenu,
  onInspectEntity,
  splashNotificationsEnabled,
  onToggleSplashNotifications,
  playerInventory,
  playerInventoryData,
  playerEquipment,
  onUseItem,
  onDropItem,
  onEquipItem,
  onUnequipItem,
  onLogin,
  isAuthenticated,
  wsConnected,
  loginError,
  radialMenuOpen,
  contextMenuOpen,
}) => {
  return (
    <>
      {/* Status Panel */}
      {player && (
        <StatusPanel
          player={player}
          gameState={gameState}
          globalTick={globalTick}
          target={selectedTarget}
        />
      )}

      {/* Window System */}
      <WindowSystem
        keyBindingManager={keyBindingManager}
        entities={player ? [player, ...entities] : entities}
        activeEntityId={activeEntityId}
        playerId={player?.id ?? null}
        onEntityClick={onEntityClick}
        logs={logs}
        onGoToPosition={onGoToPosition}
        onGoToEntity={onGoToEntity}
        onSendCommand={onSendCommand}
        onContextMenu={onContextMenu}
        onInspectEntity={onInspectEntity}
        splashNotificationsEnabled={splashNotificationsEnabled}
        onToggleSplashNotifications={onToggleSplashNotifications}
        playerInventory={playerInventory}
        playerInventoryData={playerInventoryData}
        playerEquipment={playerEquipment}
        onUseItem={onUseItem}
        onDropItem={onDropItem}
        onEquipItem={onEquipItem}
        onUnequipItem={onUnequipItem}
        onLogin={onLogin}
        isAuthenticated={isAuthenticated}
        wsConnected={wsConnected}
        loginError={loginError}
        radialMenuOpen={radialMenuOpen}
        contextMenuOpen={contextMenuOpen}
      />
    </>
  );
};
