import type { FC } from "react";

import { KeyBindingManager } from "../commands";
import type { Entity, GameState, LogMessage, Item } from "../types";

import StatusPanel from "./StatusPanel";
import { WindowSystem } from "./WindowSystem";

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
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;
  playerInventory: Item[];
  onUseItem: (item: Item, targetEntityId?: string) => void;
  onDropItem: (item: Item) => void;
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
  splashNotificationsEnabled,
  onToggleSplashNotifications,
  playerInventory,
  onUseItem,
  onDropItem,
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
        splashNotificationsEnabled={splashNotificationsEnabled}
        onToggleSplashNotifications={onToggleSplashNotifications}
        playerInventory={playerInventory}
        onUseItem={onUseItem}
        onDropItem={onDropItem}
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
