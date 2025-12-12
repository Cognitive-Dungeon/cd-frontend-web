/**
 * WebSocketService - Профессиональный сервис для управления WebSocket соединением
 *
 * Основные возможности:
 * - Автоматическое переподключение с экспоненциальной задержкой
 * - Очередь сообщений для отправки при восстановлении соединения
 * - Система событий для уведомлений о состоянии
 * - Heartbeat для проверки живости соединения
 * - Метрики и статистика соединения
 * - Graceful shutdown
 * - Сериализация/десериализация сообщений
 */

import { ClientToServerCommand, serializeClientCommand } from "../types";

import {
  WebSocketConfig,
  WebSocketState,
  WebSocketEvent,
  WebSocketEventListener,
  WebSocketEventDataMap,
  DisconnectReason,
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

/**
 * Конфигурация по умолчанию
 */
const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  url: "",
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectDelayMultiplier: 1.5,
  connectionTimeout: 10000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
  autoReconnect: true,
  maxQueueSize: 100,
  debug: false,
};

export class WebSocketService {
  private config: Required<WebSocketConfig>;
  private socket: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.CLOSED;
  private isAuthenticated: boolean = false;

  // Reconnection state
  private reconnectAttempts: number = 0;
  private reconnectTimeout: number | null = null;
  private currentReconnectDelay: number;

  // Connection timeout
  private connectionTimeoutId: number | null = null;

  // Heartbeat state
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private lastHeartbeatTime: number = 0;

  // Message queue
  private messageQueue: QueuedMessage[] = [];

  // Event listeners
  private listeners: Map<WebSocketEvent, Set<WebSocketEventListener<any>>> =
    new Map();

  // Metrics
  private metrics: WebSocketMetrics = {
    connectedAt: null,
    disconnectedAt: null,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectAttempts: 0,
    reconnectSuccesses: 0,
    errors: 0,
    currentReconnectDelay: 0,
    queueSize: 0,
    averageLatency: 0,
    lastLatency: 0,
  };

  // Latency tracking
  private latencyMeasurements: number[] = [];
  private maxLatencyMeasurements: number = 10;

  // Flags
  private isManualDisconnect: boolean = false;
  private isDestroyed: boolean = false;

  constructor(config: WebSocketConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentReconnectDelay = this.config.reconnectDelay;

    if (this.config.debug) {
      this.log("WebSocketService initialized with config:", this.config);
    }
  }

  /**
   * Подключение к WebSocket серверу
   */
  public connect(): void {
    if (this.isDestroyed) {
      throw new Error("WebSocketService has been destroyed");
    }

    if (
      this.state === WebSocketState.CONNECTING ||
      this.state === WebSocketState.CONNECTED
    ) {
      this.log("Already connected or connecting");
      return;
    }

    this.isManualDisconnect = false;
    this.setState(WebSocketState.CONNECTING);
    this.createConnection();
  }

  /**
   * Отключение от WebSocket сервера
   */
  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    this.closeConnection(DisconnectReason.MANUAL);
  }

  /**
   * Отправка команды на сервер
   */
  public send(
    command: ClientToServerCommand,
    options: SendOptions = {},
  ): SendResult {
    const timestamp = Date.now();

    // Проверка состояния соединения
    if (this.state !== WebSocketState.CONNECTED) {
      if (
        options.queue !== false &&
        this.messageQueue.length < this.config.maxQueueSize
      ) {
        // Добавляем в очередь
        this.addToQueue(command, options);
        return {
          success: false,
          queued: true,
          timestamp,
        };
      } else {
        const error = "Not connected to server";
        if (options.onError) {
          options.onError(new Error(error));
        }
        return {
          success: false,
          queued: false,
          error,
          timestamp,
        };
      }
    }

    try {
      const serialized = serializeClientCommand(command);
      this.socket!.send(serialized);

      // Обновляем метрики
      this.metrics.messagesSent++;

      // Вызываем события
      this.emit(WebSocketEvent.MESSAGE_SENT, {
        command,
        serialized,
        timestamp,
      } as MessageSentEventData);

      if (options.onSuccess) {
        options.onSuccess();
      }

      this.log("Message sent:", command.action);

      return {
        success: true,
        queued: false,
        timestamp,
      };
    } catch (error) {
      this.metrics.errors++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.emit(WebSocketEvent.ERROR, {
        type: "send",
        message: `Failed to send message: ${errorMessage}`,
        error: error instanceof Error ? error : undefined,
        timestamp,
      } as ErrorEventData);

      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(errorMessage),
        );
      }

      return {
        success: false,
        queued: false,
        error: errorMessage,
        timestamp,
      };
    }
  }

  /**
   * Подписка на событие
   */
  public on<E extends WebSocketEvent>(
    event: E,
    listener: WebSocketEventListener<WebSocketEventDataMap[E]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Отписка от события
   */
  public off<E extends WebSocketEvent>(
    event: E,
    listener: WebSocketEventListener<WebSocketEventDataMap[E]>,
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Однократная подписка на событие
   */
  public once<E extends WebSocketEvent>(
    event: E,
    listener: WebSocketEventListener<WebSocketEventDataMap[E]>,
  ): void {
    const onceWrapper = (data: WebSocketEventDataMap[E]) => {
      listener(data);
      this.off(event, onceWrapper as any);
    };
    this.on(event, onceWrapper as any);
  }

  /**
   * Установка статуса аутентификации
   */
  public setAuthenticated(isAuthenticated: boolean): void {
    if (this.isAuthenticated !== isAuthenticated) {
      this.isAuthenticated = isAuthenticated;
      this.emit(WebSocketEvent.AUTH_CHANGE, {
        isAuthenticated,
        timestamp: Date.now(),
      } as AuthChangeEventData);
      this.log(`Authentication status changed: ${isAuthenticated}`);
    }
  }

  /**
   * Получение текущего состояния
   */
  public getState(): WebSocketState {
    return this.state;
  }

  /**
   * Проверка подключения
   */
  public isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  /**
   * Проверка аутентификации
   */
  public isAuth(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Получение метрик
   */
  public getMetrics(): Readonly<WebSocketMetrics> {
    return {
      ...this.metrics,
      queueSize: this.messageQueue.length,
      currentReconnectDelay: this.currentReconnectDelay,
    };
  }

  /**
   * Очистка очереди сообщений
   */
  public clearQueue(): void {
    this.messageQueue = [];
    this.log("Message queue cleared");
  }

  /**
   * Уничтожение сервиса
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.listeners.clear();
    this.messageQueue = [];
    this.log("WebSocketService destroyed");
  }

  // ==================== Private Methods ====================

  /**
   * Создание WebSocket соединения
   */
  private createConnection(): void {
    try {
      const url = this.config.url || this.getDefaultUrl();
      this.log(`Connecting to ${url}`);

      this.socket = new WebSocket(url);

      // Установка таймаута подключения
      this.connectionTimeoutId = window.setTimeout(() => {
        if (this.state === WebSocketState.CONNECTING) {
          this.log("Connection timeout");
          this.handleConnectionError(DisconnectReason.TIMEOUT);
        }
      }, this.config.connectionTimeout);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      this.metrics.errors++;
      this.log("Failed to create WebSocket:", error);
      this.handleConnectionError(DisconnectReason.NETWORK_ERROR);
    }
  }

  /**
   * Обработка открытия соединения
   */
  private handleOpen(): void {
    this.clearConnectionTimeout();
    this.setState(WebSocketState.CONNECTED);

    const timestamp = Date.now();
    this.metrics.connectedAt = timestamp;

    if (this.reconnectAttempts > 0) {
      this.metrics.reconnectSuccesses++;
    }

    const attempts = this.reconnectAttempts;
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = this.config.reconnectDelay;

    this.emit(WebSocketEvent.CONNECTED, {
      timestamp,
      attempts,
    } as ConnectedEventData);

    this.log(`Connected (attempts: ${attempts})`);

    // Запуск heartbeat
    if (this.config.heartbeatInterval > 0) {
      this.startHeartbeat();
    }

    // Отправка сообщений из очереди
    this.flushQueue();
  }

  /**
   * Обработка входящего сообщения
   */
  private handleMessage(event: MessageEvent): void {
    const timestamp = Date.now();
    this.metrics.messagesReceived++;

    try {
      const data = JSON.parse(event.data);

      // Обработка heartbeat ответа
      if (data.type === "PONG") {
        this.handleHeartbeatResponse();
        return;
      }

      this.emit(WebSocketEvent.MESSAGE, {
        data,
        timestamp,
        raw: event.data,
      } as MessageEventData);

      this.log("Message received:", data.type || "unknown");
    } catch (error) {
      this.metrics.errors++;
      this.emit(WebSocketEvent.ERROR, {
        type: "parse",
        message: `Failed to parse message: ${error}`,
        error: error instanceof Error ? error : undefined,
        timestamp,
      } as ErrorEventData);
    }
  }

  /**
   * Обработка ошибки WebSocket
   */
  private handleError(): void {
    // Детали ошибки недоступны в браузерном WebSocket API
    // Реальная ошибка придет через onclose
    this.log("WebSocket error occurred");
  }

  /**
   * Обработка закрытия соединения
   */
  private handleClose(event: CloseEvent): void {
    this.clearConnectionTimeout();
    this.stopHeartbeat();

    const timestamp = Date.now();
    this.metrics.disconnectedAt = timestamp;

    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = false;

    let reason = DisconnectReason.UNKNOWN;
    if (this.isManualDisconnect) {
      reason = DisconnectReason.MANUAL;
    } else if (event.code === 1006) {
      reason = DisconnectReason.NETWORK_ERROR;
    } else if (event.code >= 1000 && event.code < 1004) {
      reason = DisconnectReason.SERVER_CLOSED;
    }

    this.setState(WebSocketState.CLOSED);

    this.emit(WebSocketEvent.DISCONNECTED, {
      reason,
      code: event.code,
      reasonText: event.reason,
      wasAuthenticated,
      timestamp,
    } as DisconnectedEventData);

    this.log(`Disconnected (code: ${event.code}, reason: ${reason})`);

    // Попытка переподключения
    if (!this.isManualDisconnect && this.config.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Планирование попытки переподключения
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log("Max reconnect attempts reached");
      this.emit(WebSocketEvent.ERROR, {
        type: "connection",
        message: "Maximum reconnection attempts exceeded",
        timestamp: Date.now(),
      } as ErrorEventData);
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.reconnectAttempts++;
    this.metrics.reconnectAttempts++;

    const delay = Math.min(
      this.currentReconnectDelay,
      this.config.maxReconnectDelay,
    );

    this.emit(WebSocketEvent.RECONNECT_ATTEMPT, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      delay,
      timestamp: Date.now(),
    } as ReconnectAttemptEventData);

    this.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);

    // Экспоненциальное увеличение задержки
    this.currentReconnectDelay = Math.floor(
      this.currentReconnectDelay * this.config.reconnectDelayMultiplier,
    );
  }

  /**
   * Обработка ошибки подключения
   */
  private handleConnectionError(reason: DisconnectReason): void {
    this.closeConnection(reason);
  }

  /**
   * Закрытие соединения
   */
  private closeConnection(reason: DisconnectReason): void {
    this.clearConnectionTimeout();
    this.stopHeartbeat();

    if (this.socket) {
      try {
        this.socket.close(1000, reason);
      } catch (error) {
        this.log("Error closing socket:", error);
      }
      this.socket = null;
    }

    if (this.state !== WebSocketState.CLOSED) {
      this.setState(WebSocketState.CLOSED);
    }
  }

  /**
   * Запуск heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);

    this.log("Heartbeat started");
  }

  /**
   * Остановка heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Отправка heartbeat пинга
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      return;
    }

    this.lastHeartbeatTime = Date.now();

    try {
      this.socket!.send(JSON.stringify({ type: "PING" }));

      // Установка таймаута ожидания ответа
      this.heartbeatTimeout = window.setTimeout(() => {
        this.log("Heartbeat timeout - connection may be dead");
        this.handleConnectionError(DisconnectReason.TIMEOUT);
      }, this.config.heartbeatTimeout);
    } catch (error) {
      this.log("Failed to send heartbeat:", error);
    }
  }

  /**
   * Обработка ответа на heartbeat
   */
  private handleHeartbeatResponse(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    const latency = Date.now() - this.lastHeartbeatTime;
    this.updateLatency(latency);
    this.log(`Heartbeat received (latency: ${latency}ms)`);
  }

  /**
   * Обновление статистики latency
   */
  private updateLatency(latency: number): void {
    this.metrics.lastLatency = latency;
    this.latencyMeasurements.push(latency);

    if (this.latencyMeasurements.length > this.maxLatencyMeasurements) {
      this.latencyMeasurements.shift();
    }

    this.metrics.averageLatency =
      this.latencyMeasurements.reduce((a, b) => a + b, 0) /
      this.latencyMeasurements.length;
  }

  /**
   * Добавление сообщения в очередь
   */
  private addToQueue(
    command: ClientToServerCommand,
    options: SendOptions,
  ): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.log("Message queue is full, dropping oldest message");
      this.messageQueue.shift();
    }

    this.messageQueue.push({
      command,
      timestamp: Date.now(),
      attempts: 0,
      onSuccess: options.onSuccess,
      onError: options.onError,
    });

    this.log(`Message queued (queue size: ${this.messageQueue.length})`);
  }

  /**
   * Отправка сообщений из очереди
   */
  private flushQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    this.log(`Flushing message queue (${this.messageQueue.length} messages)`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queue) {
      const result = this.send(message.command, {
        onSuccess: message.onSuccess,
        onError: message.onError,
      });

      if (!result.success) {
        this.log(`Failed to send queued message: ${result.error}`);
      }
    }
  }

  /**
   * Очистка таймаута переподключения
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Очистка таймаута подключения
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  /**
   * Установка состояния
   */
  private setState(newState: WebSocketState): void {
    if (this.state === newState) {
      return;
    }

    const previousState = this.state;
    this.state = newState;

    this.emit(WebSocketEvent.STATE_CHANGE, {
      previousState,
      currentState: newState,
      timestamp: Date.now(),
    } as StateChangeEventData);

    this.log(`State changed: ${previousState} -> ${newState}`);
  }

  /**
   * Вызов события
   */
  private emit<E extends WebSocketEvent>(
    event: E,
    data: WebSocketEventDataMap[E],
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Получение URL по умолчанию
   */
  private getDefaultUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isDev = window.location.port === "3000";

    if (isDev) {
      // Development: используем Vite proxy
      return `${protocol}//${window.location.host}/ws`;
    } else {
      // Production: подключаемся напрямую к backend (порт 8080)
      const backendHost = window.location.hostname;
      const backendPort = "8080";
      return `${protocol}//${backendHost}:${backendPort}/ws`;
    }
  }

  /**
   * Логирование
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log("[WebSocketService]", ...args);
    }
  }
}
