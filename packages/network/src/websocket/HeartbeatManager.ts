/**
 * HeartbeatManager - Управление heartbeat пингами WebSocket
 *
 * Отвечает за:
 * - Периодическую отправку PING сообщений
 * - Отслеживание PONG ответов
 * - Определение "мертвых" соединений по таймауту
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Конфигурация heartbeat
 */
export interface HeartbeatConfig {
  /** Интервал отправки heartbeat (мс). 0 = отключено */
  interval: number;
  /** Таймаут ожидания ответа (мс) */
  timeout: number;
  /** Включить логирование */
  debug?: boolean;
}

/**
 * Callback для отправки ping сообщения
 */
export type SendPingFn = () => boolean;

/**
 * Callback при таймауте heartbeat (соединение "мертво")
 */
export type OnTimeoutFn = () => void;

/**
 * Callback при получении pong (с latency)
 */
export type OnPongFn = (latency: number) => void;

// ============================================================================
// HeartbeatManager Class
// ============================================================================

/**
 * Менеджер heartbeat пингов
 *
 * Периодически отправляет PING сообщения и ожидает PONG ответы.
 * Если ответ не получен в течение таймаута, вызывается onTimeout callback.
 *
 * @example
 * ```typescript
 * const heartbeat = new HeartbeatManager({
 *   interval: 30000,  // каждые 30 секунд
 *   timeout: 10000,   // таймаут 10 секунд
 * });
 *
 * heartbeat.start(
 *   () => ws.send(JSON.stringify({ type: "PING" })),
 *   () => console.log("Connection dead!"),
 *   (latency) => console.log(`Latency: ${latency}ms`)
 * );
 *
 * // При получении PONG от сервера
 * heartbeat.handlePong();
 *
 * // При отключении
 * heartbeat.stop();
 * ```
 */
export class HeartbeatManager {
  private config: Required<HeartbeatConfig>;

  // Callbacks
  private sendPing: SendPingFn | null = null;
  private onTimeout: OnTimeoutFn | null = null;
  private onPong: OnPongFn | null = null;

  // Timers
  private intervalId: number | null = null;
  private timeoutId: number | null = null;

  // State
  private lastPingTime: number = 0;
  private isRunning: boolean = false;

  constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = {
      interval: config.interval ?? 0,
      timeout: config.timeout ?? 10000,
      debug: config.debug ?? false,
    };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Запустить heartbeat
   *
   * @param sendPing - Функция отправки PING
   * @param onTimeout - Callback при таймауте (соединение мертво)
   * @param onPong - Callback при получении PONG (опционально)
   */
  start(sendPing: SendPingFn, onTimeout: OnTimeoutFn, onPong?: OnPongFn): void {
    // Сначала останавливаем, если уже запущен
    this.stop();

    // Проверяем, что heartbeat не отключен
    if (this.config.interval <= 0) {
      this.log("Heartbeat disabled (interval = 0)");
      return;
    }

    this.sendPing = sendPing;
    this.onTimeout = onTimeout;
    this.onPong = onPong ?? null;
    this.isRunning = true;

    // Запускаем периодическую отправку
    this.intervalId = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.config.interval);

    this.log(`Started with interval ${this.config.interval}ms`);
  }

  /**
   * Остановить heartbeat
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isRunning = false;
    this.sendPing = null;
    this.onTimeout = null;
    this.onPong = null;

    this.log("Stopped");
  }

  /**
   * Обработать получение PONG ответа
   *
   * Должен вызываться при получении PONG сообщения от сервера.
   */
  handlePong(): void {
    // Отменяем таймаут
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Вычисляем latency
    if (this.lastPingTime > 0) {
      const latency = Date.now() - this.lastPingTime;
      this.log(`Pong received, latency: ${latency}ms`);

      if (this.onPong) {
        this.onPong(latency);
      }
    }
  }

  /**
   * Проверить, запущен ли heartbeat
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Проверить, включен ли heartbeat в конфигурации
   */
  get enabled(): boolean {
    return this.config.interval > 0;
  }

  /**
   * Обновить конфигурацию
   *
   * @param config - Новая конфигурация
   * @note Требуется перезапуск для применения изменений
   */
  updateConfig(config: Partial<HeartbeatConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.log(
      `Config updated: interval=${this.config.interval}ms, timeout=${this.config.timeout}ms`,
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Отправить heartbeat ping
   */
  private sendHeartbeat(): void {
    if (!this.sendPing) {
      return;
    }

    this.lastPingTime = Date.now();

    try {
      const sent = this.sendPing();

      if (!sent) {
        this.log("Failed to send ping");
        return;
      }

      this.log("Ping sent");

      // Устанавливаем таймаут ожидания ответа
      this.timeoutId = window.setTimeout(() => {
        this.handleHeartbeatTimeout();
      }, this.config.timeout);
    } catch (error) {
      this.log(`Error sending ping: ${error}`);
    }
  }

  /**
   * Обработать таймаут heartbeat
   */
  private handleHeartbeatTimeout(): void {
    this.log("Heartbeat timeout - connection may be dead");
    this.timeoutId = null;

    if (this.onTimeout) {
      this.onTimeout();
    }
  }

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[HeartbeatManager] ${message}`);
    }
  }
}
