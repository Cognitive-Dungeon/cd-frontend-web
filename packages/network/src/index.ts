/**
 * Network Package - Main Entry Point
 *
 * Этот модуль предоставляет все сетевые сервисы и типы для приложения Cognitive Dungeon.
 * Включает WebSocket соединение, управление серверами и все связанные типы.
 */

// ============================================================================
// Core Services
// ============================================================================

export { WebSocketService } from './WebSocketService';
export { ServerManager, DEFAULT_SERVERS } from './ServerManager';

// Protocol
export { serializeClientCommand } from './protocol';

// ============================================================================
// Types - WebSocket Configuration & State
// ============================================================================

export {
  WebSocketState,
  WebSocketEvent,
  DisconnectReason,
} from './types';

export type {
  WebSocketConfig,
  WebSocketEventListener,
  WebSocketEventDataMap,
  SendOptions,
  SendResult,
} from './types';

// ============================================================================
// Types - WebSocket Event Data
// ============================================================================

export type {
  ConnectedEventData,
  DisconnectedEventData,
  MessageEventData,
  ErrorEventData,
  ReconnectAttemptEventData,
  StateChangeEventData,
  MessageSentEventData,
  AuthChangeEventData,
} from './types';

// ============================================================================
// Types - Internal (re-exported for convenience)
// ============================================================================

export type {
  QueuedMessage,
  WebSocketMetrics,
} from './types';

// ============================================================================
// Types - Protocol (Client-Server Commands)
// ============================================================================

export type {
  ClientToServerCommand,
  ClientToServerAction,
  CommandAction,
  CommandPayloadMap,
  ClientToServerMovePayload,
  ClientToServerEntityTargetPayload,
  ClientToServerPositionTargetPayload,
  ClientToServerUsePayload,
  ClientToServerDropPayload,
  ClientToServerItemPayload,
  ClientToServerTextPayload,
  ClientToServerCustomPayload,
} from './protocol';

// ============================================================================
// Types - Server Management
// ============================================================================

export type {
  ServerInfo,
  ServerStatus,
} from './ServerManager';

// ============================================================================
// WebSocket Internal Components (optional, for advanced usage)
// ============================================================================

export {
  MessageQueue,
  ConnectionMetrics,
  HeartbeatManager,
  ReconnectionManager,
} from './websocket';
