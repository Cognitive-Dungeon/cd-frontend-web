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

// WebSocket Modules (for direct access if needed)
export {
  MessageQueue,
  ConnectionMetrics,
  HeartbeatManager,
  ReconnectionManager,
} from "./websocket";

export type {
  MessageQueueConfig,
  EnqueueOptions,
  ConnectionMetricsConfig,
  HeartbeatConfig,
  ReconnectionConfig,
  ReconnectionState,
} from "./websocket";

// Server Manager
export {
  ServerManager,
  DEFAULT_SERVERS,
  type ServerInfo,
  type ServerStatus,
} from "./ServerManager";
