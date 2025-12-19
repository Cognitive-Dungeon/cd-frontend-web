/**
 * Game Log Types
 *
 * Типы для игрового лога и состояния игры
 */

import type { Position } from "../protocol";

// ============================================================================
// Game State
// ============================================================================

/**
 * Состояние игры
 */
export enum GameState {
  /** Режим исследования */
  EXPLORATION = "EXPLORATION",
  /** Режим боя */
  COMBAT = "COMBAT",
  /** Игра окончена */
  GAME_OVER = "GAME_OVER",
}

// ============================================================================
// Log Types
// ============================================================================

/**
 * Типы сообщений в логе
 */
export enum LogType {
  /** Информационное сообщение */
  INFO = "INFO",
  /** Боевое сообщение */
  COMBAT = "COMBAT",
  /** Нарративное сообщение (AI Generated) */
  NARRATIVE = "NARRATIVE",
  /** Речь персонажа */
  SPEECH = "SPEECH",
  /** Сообщение об ошибке */
  ERROR = "ERROR",
  /** Команда игрока */
  COMMAND = "COMMAND",
  /** Успешное действие */
  SUCCESS = "SUCCESS",
}

/**
 * Данные команды в логе
 */
export interface LogCommandData {
  /** Тип действия */
  action: string;
  /** Payload команды */
  payload?: any;
}

/**
 * Сообщение в игровом логе (клиентская модель)
 */
export interface LogMessage {
  /** Уникальный идентификатор */
  id: string;
  /** Текст сообщения */
  text: string;
  /** Тип сообщения */
  type: LogType;
  /** Время создания (Unix milliseconds) */
  timestamp: number;
  /** Позиция события (цель/место действия) */
  position?: Position;
  /** Позиция игрока в момент выполнения команды */
  playerPosition?: Position;
  /** Данные команды (для отображения JSON) */
  commandData?: LogCommandData;
}
