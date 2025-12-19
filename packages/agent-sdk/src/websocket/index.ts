/**
 * WebSocket Modules - Barrel Export
 *
 * Экспортирует модули для работы с WebSocket соединением.
 * Эти модули используются WebSocketService через композицию.
 */

// Message Queue
export { MessageQueue } from "./MessageQueue";
export type {
  QueuedMessage,
  MessageQueueConfig,
  EnqueueOptions,
} from "./MessageQueue";

// Connection Metrics
export { ConnectionMetrics } from "./ConnectionMetrics";
export type {
  WebSocketMetrics,
  ConnectionMetricsConfig,
} from "./ConnectionMetrics";

// Heartbeat Manager
export { HeartbeatManager } from "./HeartbeatManager";
export type {
  HeartbeatConfig,
  SendPingFn,
  OnTimeoutFn,
  OnPongFn,
} from "./HeartbeatManager";

// Reconnection Manager
export { ReconnectionManager } from "./ReconnectionManager";
export type {
  ReconnectionConfig,
  ReconnectFn,
  OnAttemptFn,
  OnMaxAttemptsReachedFn,
  ReconnectionState,
} from "./ReconnectionManager";
