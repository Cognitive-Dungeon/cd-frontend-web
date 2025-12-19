/**
 * Protocol Types - Barrel Export
 *
 * Экспортирует все типы протокола клиент-сервер
 */

// Common types
export type { Position } from "./common";

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
} from "./client-to-server";

export { serializeClientCommand } from "./client-to-server";

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
