/**
 * Barrel export для сервисов
 *
 * Экспортирует WebSocketService и все связанные типы
 * для удобного импорта в других частях приложения.
 */

// Экспорт основного сервиса
export { WebSocketService } from "./WebSocketService";

// Экспорт всех типов
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

// Экспорт enum'ов
export { WebSocketState, WebSocketEvent, DisconnectReason } from "./types";
