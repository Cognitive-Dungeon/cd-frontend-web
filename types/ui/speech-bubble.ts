/**
 * Speech Bubble Types
 *
 * Типы для речевых пузырей в UI
 */

/**
 * Речевой пузырь над сущностью
 */
export interface SpeechBubble {
  /** Уникальный идентификатор пузыря */
  id: string;
  /** ID сущности, над которой показывается пузырь */
  entityId: string;
  /** Текст в пузыре */
  text: string;
  /** Время создания (Unix milliseconds) */
  timestamp: number;
}
