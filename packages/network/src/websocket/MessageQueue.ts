/**
 * MessageQueue - Очередь сообщений для WebSocket
 *
 * Управляет очередью сообщений, которые должны быть отправлены
 * при восстановлении соединения.
 */

import type { ClientToServerCommand } from "../protocol";

// ============================================================================
// Types
// ============================================================================

/**
 * Сообщение в очереди отправки
 */
export interface QueuedMessage {
  /** Команда для отправки */
  command: ClientToServerCommand;
  /** Время добавления в очередь */
  timestamp: number;
  /** Количество попыток отправки */
  attempts: number;
  /** Callback успешной отправки */
  onSuccess?: () => void;
  /** Callback ошибки отправки */
  onError?: (error: Error) => void;
}

/**
 * Конфигурация очереди сообщений
 */
export interface MessageQueueConfig {
  /** Максимальный размер очереди */
  maxSize: number;
  /** Включить логирование */
  debug?: boolean;
}

/**
 * Опции добавления сообщения в очередь
 */
export interface EnqueueOptions {
  /** Callback успешной отправки */
  onSuccess?: () => void;
  /** Callback ошибки отправки */
  onError?: (error: Error) => void;
}

// ============================================================================
// MessageQueue Class
// ============================================================================

/**
 * Очередь сообщений для WebSocket
 *
 * Используется для буферизации сообщений, когда соединение недоступно.
 * При восстановлении соединения сообщения отправляются в порядке FIFO.
 *
 * @example
 * ```typescript
 * const queue = new MessageQueue({ maxSize: 100 });
 *
 * // Добавить сообщение
 * queue.enqueue({ action: "MOVE", payload: { dx: 1, dy: 0 } });
 *
 * // Получить и отправить все сообщения
 * const messages = queue.flush();
 * messages.forEach(msg => ws.send(JSON.stringify(msg.command)));
 * ```
 */
export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private config: MessageQueueConfig;

  constructor(config: Partial<MessageQueueConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      debug: config.debug ?? false,
    };
  }

  /**
   * Добавить сообщение в очередь
   *
   * @param command - Команда для добавления
   * @param options - Опции (callbacks)
   * @returns true если добавлено, false если очередь переполнена
   */
  enqueue(
    command: ClientToServerCommand,
    options: EnqueueOptions = {},
  ): boolean {
    // Если очередь переполнена, удаляем самое старое сообщение
    if (this.queue.length >= this.config.maxSize) {
      const dropped = this.queue.shift();
      if (dropped?.onError) {
        dropped.onError(new Error("Message dropped: queue overflow"));
      }
      this.log(`Queue overflow, dropped oldest message`);
    }

    const message: QueuedMessage = {
      command,
      timestamp: Date.now(),
      attempts: 0,
      onSuccess: options.onSuccess,
      onError: options.onError,
    };

    this.queue.push(message);
    this.log(`Message queued, queue size: ${this.queue.length}`);

    return true;
  }

  /**
   * Извлечь все сообщения из очереди
   *
   * Очищает очередь и возвращает все сообщения для отправки.
   *
   * @returns Массив сообщений
   */
  flush(): QueuedMessage[] {
    const messages = [...this.queue];
    this.queue = [];
    this.log(`Flushed ${messages.length} messages`);
    return messages;
  }

  /**
   * Получить следующее сообщение без удаления
   *
   * @returns Следующее сообщение или undefined
   */
  peek(): QueuedMessage | undefined {
    return this.queue[0];
  }

  /**
   * Извлечь следующее сообщение
   *
   * @returns Следующее сообщение или undefined
   */
  dequeue(): QueuedMessage | undefined {
    return this.queue.shift();
  }

  /**
   * Очистить очередь
   *
   * @param notifyErrors - Вызвать onError для каждого сообщения
   */
  clear(notifyErrors: boolean = false): void {
    if (notifyErrors) {
      const error = new Error("Queue cleared");
      this.queue.forEach((msg) => {
        if (msg.onError) {
          msg.onError(error);
        }
      });
    }
    this.queue = [];
    this.log("Queue cleared");
  }

  /**
   * Получить текущий размер очереди
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Проверить, пуста ли очередь
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Проверить, заполнена ли очередь
   */
  get isFull(): boolean {
    return this.queue.length >= this.config.maxSize;
  }

  /**
   * Получить максимальный размер очереди
   */
  get maxSize(): number {
    return this.config.maxSize;
  }

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[MessageQueue] ${message}`);
    }
  }
}
