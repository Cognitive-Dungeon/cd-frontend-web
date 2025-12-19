/**
 * Services - Barrel Export
 *
 * Экспортирует все сервисы приложения
 */

// WebSocket Service
export { WebSocketService } from "./WebSocketService";

// WebSocket Types
export type {
  WebSocketConfig,
  WebSocketEventListener,
  WebSocketEventDataMap,
  QueuedMessage,
  WebSocketMetrics,
  SendOptions,
  SendResult,
  ConnectedEventData,
  DisconnectedEventData,
  MessageEventData,
  ErrorEventData,
  ReconnectAttemptEventData,
  StateChangeEventData,
  MessageSentEventData,
  AuthChangeEventData,
} from "./types";

export { WebSocketState, WebSocketEvent, DisconnectReason } from "./types";

// Server Manager
export {
  ServerManager,
  DEFAULT_SERVERS,
  type ServerInfo,
  type ServerStatus,
} from "./ServerManager";
