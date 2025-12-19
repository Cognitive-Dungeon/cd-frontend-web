/**
 * Protocol Types - Barrel Export
 *
 * Экспортирует все типы протокола клиент-сервер
 */

// Common types
export type { Position } from "./common";

// Client → Server (re-exported from @cd/agent-sdk)
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
} from "@cd/agent-sdk";

export { serializeClientCommand } from "@cd/agent-sdk";

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
} from "./server-to-client";
