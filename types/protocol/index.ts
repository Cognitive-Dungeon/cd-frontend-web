/**
 * Protocol Types - Barrel Export
 *
 * Экспортирует все типы протокола клиент-сервер.
 * Все типы реэкспортируются из @cognitive-dungeon/agent-sdk для единого источника истины.
 *
 * @see https://github.com/Cognitive-Dungeon/cd-techdoc
 * @see https://github.com/Cognitive-Dungeon/cd-agent-sdk-ts
 */

// ============================================================================
// Common Types
// ============================================================================

export type { Position } from "@cognitive-dungeon/agent-sdk";

// ============================================================================
// Client → Server
// ============================================================================

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
} from "@cognitive-dungeon/agent-sdk";

export { serializeClientCommand } from "@cognitive-dungeon/agent-sdk";

// ============================================================================
// Server → Client
// ============================================================================

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
} from "@cognitive-dungeon/agent-sdk";
