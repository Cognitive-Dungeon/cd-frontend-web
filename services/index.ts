/**
 * Services - Barrel Export
 *
 * Этот файл реэкспортирует сервисы для обратной совместимости.
 * Новый код должен импортировать напрямую из @cd/agent-sdk.
 *
 * @deprecated Import from "@cd/agent-sdk" instead
 */

// ============================================================================
// Network Services - Re-exported from @cd/agent-sdk package
// ============================================================================

export {
  WebSocketService,
  ServerManager,
  DEFAULT_SERVERS,
} from "@cd/agent-sdk";

// ============================================================================
// Network Types - Re-exported from @cd/agent-sdk package
// ============================================================================

// Enums
export {
  WebSocketState,
  WebSocketEvent,
  DisconnectReason,
} from "@cd/agent-sdk";

// WebSocket Configuration & State
export type {
  WebSocketConfig,
  WebSocketEventListener,
  WebSocketEventDataMap,
  SendOptions,
  SendResult,
} from "@cd/agent-sdk";

// WebSocket Event Data
export type {
  ConnectedEventData,
  DisconnectedEventData,
  MessageEventData,
  ErrorEventData,
  ReconnectAttemptEventData,
  StateChangeEventData,
  MessageSentEventData,
  AuthChangeEventData,
} from "@cd/agent-sdk";

// Internal Types (for advanced usage)
export type { QueuedMessage, WebSocketMetrics } from "@cd/agent-sdk";

// Server Management Types
export type { ServerInfo, ServerStatus } from "@cd/agent-sdk";

// ============================================================================
// WebSocket Internal Modules (for direct access if needed)
// ============================================================================

export {
  MessageQueue,
  ConnectionMetrics,
  HeartbeatManager,
  ReconnectionManager,
} from "@cd/agent-sdk";

// ============================================================================
// Other Services (not part of network layer)
// ============================================================================

// Gemini AI Service remains here as it's not part of the network layer
export * from "./geminiService";
