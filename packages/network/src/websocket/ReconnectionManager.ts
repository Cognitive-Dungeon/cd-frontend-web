/**
 * ReconnectionManager - Управление переподключением WebSocket
 *
 * Отвечает за:
 * - Автоматическое переподключение при разрыве соединения
 * - Экспоненциальную задержку между попытками
 * - Ограничение максимального количества попыток
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Конфигурация переподключения
 */
export interface ReconnectionConfig {
  /** Максимальное количество попыток переподключения */
  maxAttempts: number;
  /** Начальная задержка перед первой попыткой (мс) */
  initialDelay: number;
  /** Максимальная задержка между попытками (мс) */
  maxDelay: number;
  /** Множитель для экспоненциального увеличения задержки */
  delayMultiplier: number;
  /** Включить логирование */
  debug?: boolean;
}

/**
 * Callback для выполнения попытки переподключения
 */
export type ReconnectFn = () => void;

/**
 * Callback при начале попытки переподключения
 */
export type OnAttemptFn = (
  attempt: number,
  maxAttempts: number,
  delay: number,
) => void;

/**
 * Callback при исчерпании попыток
 */
export type OnMaxAttemptsReachedFn = () => void;

/**
 * Состояние переподключения
 */
export interface ReconnectionState {
  /** Текущее количество попыток */
  attempts: number;
  /** Максимальное количество попыток */
  maxAttempts: number;
  /** Текущая задержка (мс) */
  currentDelay: number;
  /** Запланировано ли переподключение */
  isScheduled: boolean;
}

// ============================================================================
// ReconnectionManager Class
// ============================================================================

/**
 * Менеджер переподключения WebSocket
 *
 * Реализует экспоненциальную задержку (exponential backoff) для переподключения.
 * Каждая следующая попытка выполняется с увеличенной задержкой.
 *
 * @example
 * ```typescript
 * const reconnection = new ReconnectionManager({
 *   maxAttempts: 10,
 *   initialDelay: 1000,
 *   maxDelay: 30000,
 *   delayMultiplier: 1.5,
 * });
 *
 * reconnection.schedule(
 *   () => ws.connect(),
 *   (attempt, max, delay) => console.log(`Attempt ${attempt}/${max} in ${delay}ms`),
 *   () => console.log("Max attempts reached!")
 * );
 *
 * // При успешном подключении
 * reconnection.reset();
 *
 * // При отмене
 * reconnection.cancel();
 * ```
 */
export class ReconnectionManager {
  private config: Required<ReconnectionConfig>;

  // State
  private attempts: number = 0;
  private currentDelay: number;
  private timeoutId: number | null = null;
  private isScheduled: boolean = false;

  // Callbacks
  private reconnectFn: ReconnectFn | null = null;
  private onAttempt: OnAttemptFn | null = null;
  private onMaxAttemptsReached: OnMaxAttemptsReachedFn | null = null;

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 10,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      delayMultiplier: config.delayMultiplier ?? 1.5,
      debug: config.debug ?? false,
    };

    this.currentDelay = this.config.initialDelay;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Запланировать попытку переподключения
   *
   * @param reconnect - Функция переподключения
   * @param onAttempt - Callback при начале попытки
   * @param onMaxAttemptsReached - Callback при исчерпании попыток
   */
  schedule(
    reconnect: ReconnectFn,
    onAttempt?: OnAttemptFn,
    onMaxAttemptsReached?: OnMaxAttemptsReachedFn,
  ): void {
    // Проверяем, не исчерпаны ли попытки
    if (this.attempts >= this.config.maxAttempts) {
      this.log("Max reconnect attempts reached");

      if (onMaxAttemptsReached) {
        onMaxAttemptsReached();
      } else if (this.onMaxAttemptsReached) {
        this.onMaxAttemptsReached();
      }

      return;
    }

    // Сохраняем callbacks
    this.reconnectFn = reconnect;
    if (onAttempt) {
      this.onAttempt = onAttempt;
    }
    if (onMaxAttemptsReached) {
      this.onMaxAttemptsReached = onMaxAttemptsReached;
    }

    // Увеличиваем счетчик попыток
    this.attempts++;
    this.isScheduled = true;

    // Вычисляем задержку
    const delay = Math.min(this.currentDelay, this.config.maxDelay);

    this.log(
      `Scheduling reconnect attempt ${this.attempts}/${this.config.maxAttempts} in ${delay}ms`,
    );

    // Уведомляем о попытке
    if (this.onAttempt) {
      this.onAttempt(this.attempts, this.config.maxAttempts, delay);
    }

    // Планируем выполнение
    this.timeoutId = window.setTimeout(() => {
      this.executeReconnect();
    }, delay);

    // Увеличиваем задержку для следующей попытки
    this.currentDelay = Math.floor(
      this.currentDelay * this.config.delayMultiplier,
    );
  }

  /**
   * Отменить запланированное переподключение
   */
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isScheduled = false;
    this.log("Reconnection cancelled");
  }

  /**
   * Сбросить состояние (после успешного подключения)
   */
  reset(): void {
    this.cancel();
    this.attempts = 0;
    this.currentDelay = this.config.initialDelay;
    this.reconnectFn = null;
    this.onAttempt = null;
    this.onMaxAttemptsReached = null;
    this.log("State reset");
  }

  /**
   * Получить текущее состояние
   */
  getState(): ReconnectionState {
    return {
      attempts: this.attempts,
      maxAttempts: this.config.maxAttempts,
      currentDelay: this.currentDelay,
      isScheduled: this.isScheduled,
    };
  }

  /**
   * Проверить, исчерпаны ли попытки
   */
  get isMaxAttemptsReached(): boolean {
    return this.attempts >= this.config.maxAttempts;
  }

  /**
   * Проверить, запланировано ли переподключение
   */
  get scheduled(): boolean {
    return this.isScheduled;
  }

  /**
   * Получить текущее количество попыток
   */
  get attemptCount(): number {
    return this.attempts;
  }

  /**
   * Получить текущую задержку
   */
  get delay(): number {
    return this.currentDelay;
  }

  /**
   * Обновить конфигурацию
   *
   * @param config - Новая конфигурация
   */
  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Сбрасываем задержку если изменилась начальная
    if (config.initialDelay !== undefined && this.attempts === 0) {
      this.currentDelay = config.initialDelay;
    }

    this.log(
      `Config updated: maxAttempts=${this.config.maxAttempts}, initialDelay=${this.config.initialDelay}ms`,
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Выполнить попытку переподключения
   */
  private executeReconnect(): void {
    this.timeoutId = null;
    this.isScheduled = false;

    if (this.reconnectFn) {
      this.log(`Executing reconnect attempt ${this.attempts}`);
      this.reconnectFn();
    }
  }

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[ReconnectionManager] ${message}`);
    }
  }
}
