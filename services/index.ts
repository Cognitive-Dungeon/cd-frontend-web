/**
 * Services - Barrel Export
 *
 * Этот файл реэкспортирует сервисы для обратной совместимости.
 * Новый код должен импортировать напрямую из @cognitive-dungeon/agent-sdk.
 *
 * @deprecated Import from "@cognitive-dungeon/agent-sdk" instead
 */

// ============================================================================
// Network Services - Re-exported from @cognitive-dungeon/agent-sdk package
// ============================================================================

export {
  WebSocketService,
  ServerManager,
  DEFAULT_SERVERS,
} from "@cognitive-dungeon/agent-sdk";

// ============================================================================
// Network Types - Re-exported from @cognitive-dungeon/agent-sdk package
// ============================================================================

// Enums
export {
  WebSocketState,
  WebSocketEvent,
  DisconnectReason,
} from "@cognitive-dungeon/agent-sdk";

// WebSocket Configuration & State
export type {
  WebSocketConfig,
  WebSocketEventListener,
  WebSocketEventDataMap,
  SendOptions,
  SendResult,
} from "@cognitive-dungeon/agent-sdk";

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
} from "@cognitive-dungeon/agent-sdk";

// Internal Types (for advanced usage)
export type { QueuedMessage, WebSocketMetrics } from "@cognitive-dungeon/agent-sdk";

// Server Management Types
export type { ServerInfo, ServerStatus } from "@cognitive-dungeon/agent-sdk";

// ============================================================================
// WebSocket Internal Modules (for direct access if needed)
// ============================================================================

export {
  MessageQueue,
  ConnectionMetrics,
  HeartbeatManager,
  ReconnectionManager,
} from "@cognitive-dungeon/agent-sdk";

// ============================================================================
// Other Services (not part of network layer)
// ============================================================================

// Gemini AI Service remains here as it's not part of the network layer
export * from "./geminiService";
