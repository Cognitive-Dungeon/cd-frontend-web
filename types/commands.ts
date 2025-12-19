/**
 * Types - Commands (Backward Compatibility)
 *
 * Этот файл сохранён для обратной совместимости.
 * Все типы и функции теперь находятся в модуле `commands/`.
 *
 * @deprecated Импортируйте напрямую из "../commands/" для новых файлов
 *
 * @example
 * ```typescript
 * // Legacy (этот файл)
 * import { CommandMetadata, COMMAND_METADATA } from "./types/commands";
 *
 * // Рекомендуемый способ
 * import { CommandMetadata, COMMAND_METADATA } from "./commands/";
 * ```
 */

import {
  ClientToServerCommand,
  CommandAction,
  CommandPayloadMap,
} from "./protocol/client-to-server";

// ============================================================================
// Re-export Protocol Types
// ============================================================================

export type { CommandAction, CommandPayloadMap };

// ============================================================================
// Payload Types
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

/**
 * Типизированная функция создания команды
 *
 * @template T - Тип action, должен быть одним из CommandAction
 */
export type CreateClientCommandFn = <T extends CommandAction>(
  action: T,
  payload: CommandPayloadMap[T],
) => ClientToServerCommand | null;

/**
 * Обработчик команды с типизированным payload
 *
 * @template T - Тип action
 */
export type TypedCommandHandler<T extends CommandAction = CommandAction> = (
  payload: CommandPayloadMap[T],
) => ClientToServerCommand | null;

/**
 * Маппинг обработчиков команд с правильной типизацией
 */
export type CommandHandlersMap = {
  [K in CommandAction]: TypedCommandHandler<K>;
};

/**
 * Helper type: извлекает тип payload для конкретного action
 */
export type PayloadForAction<T extends CommandAction> = CommandPayloadMap[T];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Type guard: проверяет, является ли строка валидным типом команды
 */
export function isValidCommandAction(action: string): action is CommandAction {
  const validActions: CommandAction[] = [
    "LOGIN",
    "MOVE",
    "ATTACK",
    "TALK",
    "INTERACT",
    "WAIT",
    "PICKUP",
    "DROP",
    "USE",
    "EQUIP",
    "UNEQUIP",
    "CUSTOM",
  ];
  return validActions.includes(action as CommandAction);
}

/**
 * Валидирует payload для конкретного типа команды
 */
export function validateCommandPayload(
  action: CommandAction,
  payload: unknown,
): boolean {
  if (payload === null || payload === undefined) {
    return action === "WAIT";
  }

  if (typeof payload !== "object") {
    return false;
  }

  const p = payload as Record<string, unknown>;

  switch (action) {
    case "LOGIN":
      return typeof p.token === "string" && (p.token as string).length > 0;

    case "MOVE":
      return (
        (typeof p.dx === "number" && typeof p.dy === "number") ||
        (typeof p.x === "number" && typeof p.y === "number")
      );

    case "ATTACK":
    case "TALK":
    case "INTERACT":
      return (
        typeof p.targetId === "string" && (p.targetId as string).length > 0
      );

    case "WAIT":
      return Object.keys(p).length === 0;

    case "PICKUP":
    case "DROP":
    case "USE":
    case "EQUIP":
    case "UNEQUIP":
      return typeof p.itemId === "string" && (p.itemId as string).length > 0;

    case "CUSTOM":
      return true;

    default:
      return false;
  }
}

// ============================================================================
// Command Metadata
// ============================================================================

/**
 * Метаданные всех команд для UI и валидации
 */
export const COMMAND_METADATA: Record<CommandAction, CommandMetadata> = {
  LOGIN: {
    action: "LOGIN",
    displayName: "Войти",
    description: "Авторизация в игре",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: true,
  },
  MOVE: {
    action: "MOVE",
    displayName: "Движение",
    description: "Переместиться на другую клетку",
    requiresTarget: false,
    requiresPosition: true,
    availableOutOfTurn: false,
  },
  ATTACK: {
    action: "ATTACK",
    displayName: "Атака",
    description: "Атаковать цель",
    requiresTarget: true,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  TALK: {
    action: "TALK",
    displayName: "Говорить",
    description: "Поговорить с существом",
    requiresTarget: true,
    requiresPosition: false,
    availableOutOfTurn: true,
  },
  INTERACT: {
    action: "INTERACT",
    displayName: "Взаимодействие",
    description: "Взаимодействовать с объектом",
    requiresTarget: true,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  WAIT: {
    action: "WAIT",
    displayName: "Ждать",
    description: "Пропустить ход",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  PICKUP: {
    action: "PICKUP",
    displayName: "Подобрать",
    description: "Подобрать предмет",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  DROP: {
    action: "DROP",
    displayName: "Бросить",
    description: "Бросить предмет",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  USE: {
    action: "USE",
    displayName: "Использовать",
    description: "Использовать предмет",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  EQUIP: {
    action: "EQUIP",
    displayName: "Надеть",
    description: "Надеть предмет",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  UNEQUIP: {
    action: "UNEQUIP",
    displayName: "Снять",
    description: "Снять предмет",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: false,
  },
  CUSTOM: {
    action: "CUSTOM",
    displayName: "Кастомная команда",
    description: "Произвольная команда",
    requiresTarget: false,
    requiresPosition: false,
    availableOutOfTurn: true,
  },
};

/**
 * Получает метаданные команды
 */
export function getCommandMetadata(action: CommandAction): CommandMetadata {
  return COMMAND_METADATA[action];
}
