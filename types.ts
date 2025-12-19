/**
 * Types - Main Barrel Export
 *
 * Этот файл реэкспортирует все типы из новой модульной структуры.
 * Сохранена обратная совместимость с существующими импортами.
 *
 * Новая структура:
 * - types/protocol/ - Типы протокола клиент-сервер
 * - types/game/     - Типы игровых сущностей
 * - types/ui/       - Типы UI компонентов
 *
 * @see https://github.com/Cognitive-Dungeon/cd-techdoc
 */

// ============================================================================
// Protocol Types (Client ↔ Server)
// ============================================================================

// Common
export type { Position } from "./types/protocol";

// Client → Server
export type {
  ClientToServerMovePayload,
  ClientToServerEntityTargetPayload,
  ClientToServerPositionTargetPayload,
  ClientToServerUsePayload,
  ClientToServerDropPayload,
  ClientToServerItemPayload,
  ClientToServerTextPayload,
  ClientToServerCustomPayload,
  ClientToServerAction,
  ClientToServerCommand,
  CommandAction,
  CommandPayloadMap,
} from "./types/protocol";

export { serializeClientCommand } from "./types/protocol";

// Server → Client
export type {
  ServerToClientGridMeta,
  ServerToClientTileView,
  ServerToClientStatsView,
  ServerToClientEntityRender,
  ServerToClientItemView,
  ServerToClientInventoryView,
  ServerToClientEquipmentView,
  ServerToClientEntityView,
  ServerToClientLogType,
  ServerToClientLogEntry,
  ServerToClientUpdate,
  ServerToClientError,
  ServerToClientMessage,
} from "./types/protocol";

// ============================================================================
// Game Types
// ============================================================================

// Entity
export type {
  Stats,
  Entity,
  NpcType,
  Personality,
  AiState,
} from "./types/game";

export { EntityType } from "./types/game";

// Item
export type { Item, ItemAction } from "./types/game";

export { ItemType, ItemActionType } from "./types/game";

// World
export type { Tile, TileEnv, GameWorld } from "./types/game";

// Log
export type { LogMessage, LogCommandData } from "./types/game";

export { GameState, LogType } from "./types/game";

// ============================================================================
// UI Types
// ============================================================================

export type { ContextMenuData } from "./types/ui";

export type { SpeechBubble } from "./types/ui";

// ============================================================================
// Server Manager (deprecated location - use services/ServerManager)
// ============================================================================

export {
  ServerManager,
  DEFAULT_SERVERS,
  type ServerInfo,
  type ServerStatus,
} from "./types/server";
