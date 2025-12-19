/**
 * Commands - Type Definitions
 *
 * Объединённые типы для командной системы.
 * Протокольные типы (CommandAction, CommandPayloadMap, etc.) реэкспортируются
 * из types/protocol для избежания дублирования.
 */

// ============================================================================
// Re-export Protocol Types
// ============================================================================

export type {
  ClientToServerCommand,
  ClientToServerAction,
  ClientToServerMovePayload,
  ClientToServerEntityTargetPayload,
  ClientToServerPositionTargetPayload,
  ClientToServerItemPayload,
  ClientToServerCustomPayload,
  ClientToServerTextPayload,
  CommandAction,
  CommandPayloadMap,
} from "../types/protocol/client-to-server";

export { serializeClientCommand } from "../types/protocol/client-to-server";

// ============================================================================
// Game Command Types (for UI/Key Bindings)
// ============================================================================

/**
 * Представляет игровую команду для привязки клавиш и UI
 *
 * В отличие от ClientToServerCommand (протокольный тип),
 * GameCommand содержит метаданные для отображения в UI.
 */
export interface GameCommand {
  /** Тип действия (e.g., "MOVE", "PICKUP", "WAIT") */
  action: string;
  /** Опциональные данные для действия (e.g., direction для движения) */
  payload?: Record<string, unknown>;
  /** Человекочитаемое название для UI настроек (e.g., "Move Up", "Pick up item") */
  label?: string;
  /** Человекочитаемое описание в прошедшем времени для логов (e.g., "moved up") */
  description?: string;
  /** Требует ли команда выбора целевой сущности (добавляет targetId в payload) */
  requiresEntityTarget?: boolean;
  /** Требует ли команда выбора целевой позиции (добавляет x, y в payload) */
  requiresPositionTarget?: boolean;
}

/**
 * Привязка клавиши к игровой команде
 */
export interface KeyBinding {
  /** Код клавиши (e.g., "KeyW", "ArrowUp") - layout-independent */
  code: string;
  /** Команда для выполнения при нажатии */
  command: GameCommand;
}

// ============================================================================
// Command Metadata Types
// ============================================================================

/**
 * Расширенная информация о команде для UI
 */
export interface CommandMetadata {
  /** Тип команды */
  action: string;
  /** Человекочитаемое название */
  displayName: string;
  /** Описание команды */
  description: string;
  /** Требуется ли цель-сущность */
  requiresTarget: boolean;
  /** Требуется ли позиция */
  requiresPosition: boolean;
  /** Доступна ли команда вне хода игрока */
  availableOutOfTurn: boolean;
}

// ============================================================================
// Command Handler Types
// ============================================================================

// Import types inline to avoid circular dependencies
import type {
  CommandAction as CA,
  CommandPayloadMap as CPM,
  ClientToServerCommand as CTSC,
} from "../types/protocol/client-to-server";

/**
 * Типизированная функция создания команды
 *
 * @template T - Тип action, должен быть одним из CommandAction
 */
export type CreateClientCommandFn = <T extends CA>(
  action: T,
  payload: CPM[T],
) => CTSC | null;

/**
 * Обработчик команды с типизированным payload
 *
 * @template T - Тип action
 */
export type TypedCommandHandler<T extends CA = CA> = (
  payload: CPM[T],
) => CTSC | null;

/**
 * Маппинг обработчиков команд с правильной типизацией
 */
export type CommandHandlersMap = {
  [K in CA]: TypedCommandHandler<K>;
};

// ============================================================================
// Payload Helper Types
// ============================================================================

/**
 * Payload для команды LOGIN
 */
export interface LoginPayload {
  token: string;
}

/**
 * Пустой payload для команды WAIT
 */
export type WaitPayload = Record<string, never> | null | undefined;

/**
 * Helper type: извлекает тип payload для конкретного action
 *
 * @example
 * ```typescript
 * type MovePayload = PayloadForAction<"MOVE">; // ClientToServerMovePayload
 * ```
 */
export type PayloadForAction<T extends CA> = CPM[T];
