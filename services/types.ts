/**
 * Типы для WebSocket сервиса
 *
 * Этот файл содержит все типы, используемые WebSocketService
 * для типобезопасной работы с WebSocket соединением.
 *
 * Некоторые типы теперь определены в модулях websocket/ и реэкспортируются здесь
 * для обратной совместимости.
 */

import { ClientToServerCommand } from "../types";

// Re-export from websocket modules for backward compatibility
export type { QueuedMessage, WebSocketMetrics } from "./websocket";

/**
 * Состояние WebSocket соединения
 */
export enum WebSocketState {
  /** Соединение устанавливается */
  CONNECTING = "CONNECTING",
  /** Соединение установлено */
  CONNECTED = "CONNECTED",
  /** Соединение закрывается */
  CLOSING = "CLOSING",
  /** Соединение закрыто */
  CLOSED = "CLOSED",
  /** Происходит попытка переподключения */
  RECONNECTING = "RECONNECTING",
}

/**
 * Причина закрытия соединения
 */
export enum DisconnectReason {
  /** Соединение закрыто вручную (через disconnect()) */
  MANUAL = "MANUAL",
  /** Ошибка сети */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** Сервер закрыл соединение */
  SERVER_CLOSED = "SERVER_CLOSED",
  /** Таймаут соединения */
  TIMEOUT = "TIMEOUT",
  /** Превышено максимальное количество попыток переподключения */
  MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
  /** Неизвестная причина */
  UNKNOWN = "UNKNOWN",
}

/**
 * События, генерируемые WebSocketService
 */
export enum WebSocketEvent {
  /** Соединение установлено */
  CONNECTED = "connected",
  /** Соединение закрыто */
  DISCONNECTED = "disconnected",
  /** Получено сообщение от сервера */
  MESSAGE = "message",
  /** Произошла ошибка */
  ERROR = "error",
  /** Начата попытка переподключения */
  RECONNECT_ATTEMPT = "reconnect_attempt",
  /** Изменилось состояние соединения */
  STATE_CHANGE = "state_change",
  /** Отправлено сообщение на сервер */
  MESSAGE_SENT = "message_sent",
  /** Изменился статус аутентификации */
  AUTH_CHANGE = "auth_change",
}

/**
 * Конфигурация WebSocket сервиса
 */
export interface WebSocketConfig {
  /** URL для подключения (если не указан, определяется автоматически) */
  url?: string;

  /** Максимальное количество попыток переподключения */
  maxReconnectAttempts?: number;

  /** Начальная задержка перед первой попыткой переподключения (мс) */
  reconnectDelay?: number;

  /** Максимальная задержка между попытками переподключения (мс) */
  maxReconnectDelay?: number;

  /** Множитель для экспоненциального увеличения задержки */
  reconnectDelayMultiplier?: number;

  /** Таймаут для операции подключения (мс) */
  connectionTimeout?: number;

  /** Интервал отправки heartbeat пингов (мс, 0 = отключено) */
  heartbeatInterval?: number;

  /** Таймаут ожидания ответа на heartbeat (мс) */
  heartbeatTimeout?: number;

  /** Автоматически переподключаться при разрыве соединения */
  autoReconnect?: boolean;

  /** Максимальный размер очереди сообщений для отправки */
  maxQueueSize?: number;

  /** Включить подробное логирование */
  debug?: boolean;
}

/**
 * Слушатель событий WebSocket сервиса
 */
export type WebSocketEventListener<T = any> = (data: T) => void;

/**
 * Данные события подключения
 */
export interface ConnectedEventData {
  /** Время подключения */
  timestamp: number;
  /** Количество попыток до успешного подключения */
  attempts: number;
}

/**
 * Данные события отключения
 */
export interface DisconnectedEventData {
  /** Причина отключения */
  reason: DisconnectReason;
  /** Код закрытия WebSocket */
  code: number;
  /** Текст причины закрытия */
  reasonText: string;
  /** Было ли соединение аутентифицировано */
  wasAuthenticated: boolean;
  /** Время отключения */
  timestamp: number;
}

/**
 * Данные события сообщения
 */
export interface MessageEventData<T = any> {
  /** Содержимое сообщения */
  data: T;
  /** Время получения сообщения */
  timestamp: number;
  /** Сырые данные (до парсинга) */
  raw: string;
}

/**
 * Данные события ошибки
 */
export interface ErrorEventData {
  /** Тип ошибки */
  type: "connection" | "message" | "send" | "parse" | "unknown";
  /** Сообщение об ошибке */
  message: string;
  /** Объект ошибки (если есть) */
  error?: Error;
  /** Время возникновения ошибки */
  timestamp: number;
}

/**
 * Данные события попытки переподключения
 */
export interface ReconnectAttemptEventData {
  /** Номер текущей попытки */
  attempt: number;
  /** Максимальное количество попыток */
  maxAttempts: number;
  /** Задержка до следующей попытки (мс) */
  delay: number;
  /** Время начала попытки */
  timestamp: number;
}

/**
 * Данные события изменения состояния
 */
export interface StateChangeEventData {
  /** Предыдущее состояние */
  previousState: WebSocketState;
  /** Новое состояние */
  currentState: WebSocketState;
  /** Время изменения состояния */
  timestamp: number;
}

/**
 * Данные события отправки сообщения
 */
export interface MessageSentEventData {
  /** Отправленная команда */
  command: ClientToServerCommand;
  /** Сериализованные данные */
  serialized: string;
  /** Время отправки */
  timestamp: number;
}

/**
 * Данные события изменения аутентификации
 */
export interface AuthChangeEventData {
  /** Статус аутентификации */
  isAuthenticated: boolean;
  /** Время изменения */
  timestamp: number;
}

/**
 * Маппинг типов событий на их данные
 */
export interface WebSocketEventDataMap {
  [WebSocketEvent.CONNECTED]: ConnectedEventData;
  [WebSocketEvent.DISCONNECTED]: DisconnectedEventData;
  [WebSocketEvent.MESSAGE]: MessageEventData;
  [WebSocketEvent.ERROR]: ErrorEventData;
  [WebSocketEvent.RECONNECT_ATTEMPT]: ReconnectAttemptEventData;
  [WebSocketEvent.STATE_CHANGE]: StateChangeEventData;
  [WebSocketEvent.MESSAGE_SENT]: MessageSentEventData;
  [WebSocketEvent.AUTH_CHANGE]: AuthChangeEventData;
}

// QueuedMessage and WebSocketMetrics are now defined in websocket/ modules
// and re-exported at the top of this file

/**
 * Опции для отправки команды
 */
export interface SendOptions {
  /** Таймаут отправки (мс) */
  timeout?: number;
  /** Добавить в очередь, если не подключено */
  queue?: boolean;
  /** Приоритет в очереди (больше = выше) */
  priority?: number;
  /** Callback успешной отправки */
  onSuccess?: () => void;
  /** Callback ошибки отправки */
  onError?: (error: Error) => void;
}

/**
 * Результат попытки отправки команды
 */
export interface SendResult {
  /** Успешно ли отправлено */
  success: boolean;
  /** Добавлено ли в очередь */
  queued: boolean;
  /** Сообщение об ошибке (если неуспешно) */
  error?: string;
  /** Время отправки */
  timestamp: number;
}
