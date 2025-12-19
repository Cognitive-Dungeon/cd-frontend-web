/**
 * Commands - Metadata
 *
 * Метаданные команд для UI и валидации.
 * Содержит информацию о каждой команде: названия, описания, требования.
 */

import { CommandMetadata, CommandAction } from "./types";

// ============================================================================
// Command Metadata Registry
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

// ============================================================================
// Metadata Utilities
// ============================================================================

/**
 * Получает метаданные команды
 *
 * @param action - Тип команды
 * @returns Метаданные команды или undefined если action неизвестен
 *
 * @example
 * ```typescript
 * const metadata = getCommandMetadata("ATTACK");
 * console.log(metadata.requiresTarget); // true
 * ```
 */
export function getCommandMetadata(action: CommandAction): CommandMetadata;
export function getCommandMetadata(action: string): CommandMetadata | undefined;
export function getCommandMetadata(
  action: string,
): CommandMetadata | undefined {
  return COMMAND_METADATA[action as CommandAction];
}

/**
 * Проверяет, требует ли команда цель-сущность
 *
 * @param action - Тип команды
 * @returns true если команда требует выбора цели
 */
export function commandRequiresTarget(action: CommandAction): boolean {
  return COMMAND_METADATA[action]?.requiresTarget ?? false;
}

/**
 * Проверяет, требует ли команда позицию
 *
 * @param action - Тип команды
 * @returns true если команда требует выбора позиции
 */
export function commandRequiresPosition(action: CommandAction): boolean {
  return COMMAND_METADATA[action]?.requiresPosition ?? false;
}

/**
 * Проверяет, доступна ли команда вне хода игрока
 *
 * @param action - Тип команды
 * @returns true если команда может быть выполнена вне хода
 */
export function commandAvailableOutOfTurn(action: CommandAction): boolean {
  return COMMAND_METADATA[action]?.availableOutOfTurn ?? false;
}

/**
 * Получает человекочитаемое название команды
 *
 * @param action - Тип команды
 * @returns Локализованное название или сам action если не найден
 */
export function getCommandDisplayName(action: string): string {
  return COMMAND_METADATA[action as CommandAction]?.displayName ?? action;
}

/**
 * Получает описание команды
 *
 * @param action - Тип команды
 * @returns Локализованное описание или пустую строку
 */
export function getCommandDescription(action: string): string {
  return COMMAND_METADATA[action as CommandAction]?.description ?? "";
}

/**
 * Получает все команды определённого типа
 *
 * @param filter - Функция фильтрации
 * @returns Массив action типов, удовлетворяющих фильтру
 *
 * @example
 * ```typescript
 * // Все команды, требующие цель
 * const targetCommands = getCommandsByFilter(m => m.requiresTarget);
 * // ["ATTACK", "TALK", "INTERACT"]
 * ```
 */
export function getCommandsByFilter(
  filter: (metadata: CommandMetadata) => boolean,
): CommandAction[] {
  return (Object.entries(COMMAND_METADATA) as [CommandAction, CommandMetadata][])
    .filter(([, metadata]) => filter(metadata))
    .map(([action]) => action);
}

/**
 * Получает все команды, которые требуют цель
 */
export function getTargetRequiringCommands(): CommandAction[] {
  return getCommandsByFilter((m) => m.requiresTarget);
}

/**
 * Получает все команды, которые требуют позицию
 */
export function getPositionRequiringCommands(): CommandAction[] {
  return getCommandsByFilter((m) => m.requiresPosition);
}

/**
 * Получает все команды, доступные вне хода
 */
export function getOutOfTurnCommands(): CommandAction[] {
  return getCommandsByFilter((m) => m.availableOutOfTurn);
}

/**
 * Получает все команды, доступные только в ход игрока
 */
export function getInTurnCommands(): CommandAction[] {
  return getCommandsByFilter((m) => !m.availableOutOfTurn);
}
