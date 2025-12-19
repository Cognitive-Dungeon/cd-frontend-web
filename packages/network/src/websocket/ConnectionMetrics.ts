/**
 * ConnectionMetrics - Метрики WebSocket соединения
 *
 * Собирает и хранит статистику работы WebSocket соединения:
 * - Время подключения/отключения
 * - Количество отправленных/полученных сообщений
 * - Статистика переподключений
 * - Latency (задержка)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Метрики WebSocket соединения
 */
export interface WebSocketMetrics {
  /** Время установки текущего соединения */
  connectedAt: number | null;
  /** Время последнего отключения */
  disconnectedAt: number | null;
  /** Общее количество отправленных сообщений */
  messagesSent: number;
  /** Общее количество полученных сообщений */
  messagesReceived: number;
  /** Количество попыток переподключения */
  reconnectAttempts: number;
  /** Количество успешных переподключений */
  reconnectSuccesses: number;
  /** Количество ошибок */
  errors: number;
  /** Текущая задержка переподключения (мс) */
  currentReconnectDelay: number;
  /** Размер очереди отправки */
  queueSize: number;
  /** Среднее время roundtrip (мс) */
  averageLatency: number;
  /** Последнее время roundtrip (мс) */
  lastLatency: number;
}

/**
 * Конфигурация метрик
 */
export interface ConnectionMetricsConfig {
  /** Максимальное количество измерений latency для усреднения */
  maxLatencyMeasurements?: number;
  /** Включить логирование */
  debug?: boolean;
}

// ============================================================================
// ConnectionMetrics Class
// ============================================================================

/**
 * Сборщик метрик WebSocket соединения
 *
 * @example
 * ```typescript
 * const metrics = new ConnectionMetrics();
 *
 * // При подключении
 * metrics.recordConnect();
 *
 * // При отправке сообщения
 * metrics.recordMessageSent();
 *
 * // Получить текущие метрики
 * const stats = metrics.getMetrics();
 * console.log(`Отправлено: ${stats.messagesSent}`);
 * ```
 */
export class ConnectionMetrics {
  private config: Required<ConnectionMetricsConfig>;

  // Connection timestamps
  private connectedAt: number | null = null;
  private disconnectedAt: number | null = null;

  // Message counters
  private messagesSent: number = 0;
  private messagesReceived: number = 0;

  // Reconnection stats
  private reconnectAttempts: number = 0;
  private reconnectSuccesses: number = 0;

  // Error counter
  private errors: number = 0;

  // Latency tracking
  private latencyMeasurements: number[] = [];
  private lastLatency: number = 0;

  // External state (set by WebSocketService)
  private currentReconnectDelay: number = 0;
  private queueSize: number = 0;

  constructor(config: ConnectionMetricsConfig = {}) {
    this.config = {
      maxLatencyMeasurements: config.maxLatencyMeasurements ?? 10,
      debug: config.debug ?? false,
    };
  }

  // ============================================================================
  // Recording Methods
  // ============================================================================

  /**
   * Записать событие подключения
   */
  recordConnect(): void {
    this.connectedAt = Date.now();
    this.log("Connection recorded");
  }

  /**
   * Записать событие отключения
   */
  recordDisconnect(): void {
    this.disconnectedAt = Date.now();
    this.log("Disconnection recorded");
  }

  /**
   * Записать отправленное сообщение
   */
  recordMessageSent(): void {
    this.messagesSent++;
  }

  /**
   * Записать полученное сообщение
   */
  recordMessageReceived(): void {
    this.messagesReceived++;
  }

  /**
   * Записать попытку переподключения
   */
  recordReconnectAttempt(): void {
    this.reconnectAttempts++;
    this.log(`Reconnect attempt #${this.reconnectAttempts}`);
  }

  /**
   * Записать успешное переподключение
   */
  recordReconnectSuccess(): void {
    this.reconnectSuccesses++;
    this.log(`Reconnect success (total: ${this.reconnectSuccesses})`);
  }

  /**
   * Записать ошибку
   */
  recordError(): void {
    this.errors++;
  }

  /**
   * Записать измерение latency
   *
   * @param latency - Время roundtrip в миллисекундах
   */
  recordLatency(latency: number): void {
    this.lastLatency = latency;
    this.latencyMeasurements.push(latency);

    // Ограничиваем количество измерений
    if (this.latencyMeasurements.length > this.config.maxLatencyMeasurements) {
      this.latencyMeasurements.shift();
    }

    this.log(`Latency recorded: ${latency}ms`);
  }

  /**
   * Установить текущую задержку переподключения
   *
   * @param delay - Задержка в миллисекундах
   */
  setReconnectDelay(delay: number): void {
    this.currentReconnectDelay = delay;
  }

  /**
   * Установить размер очереди сообщений
   *
   * @param size - Размер очереди
   */
  setQueueSize(size: number): void {
    this.queueSize = size;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Получить среднюю latency
   */
  get averageLatency(): number {
    if (this.latencyMeasurements.length === 0) {
      return 0;
    }

    const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencyMeasurements.length);
  }

  /**
   * Получить все метрики
   */
  getMetrics(): Readonly<WebSocketMetrics> {
    return {
      connectedAt: this.connectedAt,
      disconnectedAt: this.disconnectedAt,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      reconnectAttempts: this.reconnectAttempts,
      reconnectSuccesses: this.reconnectSuccesses,
      errors: this.errors,
      currentReconnectDelay: this.currentReconnectDelay,
      queueSize: this.queueSize,
      averageLatency: this.averageLatency,
      lastLatency: this.lastLatency,
    };
  }

  /**
   * Получить время с момента подключения (мс)
   */
  getConnectionDuration(): number | null {
    if (!this.connectedAt) {
      return null;
    }

    const endTime = this.disconnectedAt ?? Date.now();
    return endTime - this.connectedAt;
  }

  // ============================================================================
  // Reset
  // ============================================================================

  /**
   * Сбросить все метрики
   */
  reset(): void {
    this.connectedAt = null;
    this.disconnectedAt = null;
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.reconnectAttempts = 0;
    this.reconnectSuccesses = 0;
    this.errors = 0;
    this.latencyMeasurements = [];
    this.lastLatency = 0;
    this.currentReconnectDelay = 0;
    this.queueSize = 0;
    this.log("Metrics reset");
  }

  /**
   * Сбросить только счетчики переподключений
   */
  resetReconnectCounters(): void {
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = 0;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[ConnectionMetrics] ${message}`);
    }
  }
}
