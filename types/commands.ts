/**
 * Улучшенная типизация для командной системы
 *
 * Этот файл содержит строгую типизацию для всех команд клиент-сервер,
 * обеспечивая полную проверку типов на этапе компиляции.
 */

import {
  ClientToServerCommand,
  ClientToServerMovePayload,
  ClientToServerEntityTargetPayload,
  ClientToServerCustomPayload,
} from "../types";

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
 * Маппинг типов действий на соответствующие payload типы
 *
 * Этот тип связывает каждое действие команды с точным типом его payload,
 * обеспечивая type-safety при создании команд.
 *
 * @example
 * ```typescript
 * // Правильно: TypeScript знает, что MOVE требует ClientToServerMovePayload
 * const payload: CommandPayloadMap["MOVE"] = { dx: 1, dy: 0 };
 *
 * // Ошибка: TypeScript не позволит использовать неправильный тип
 * const payload: CommandPayloadMap["ATTACK"] = { dx: 1, dy: 0 }; // Type error!
 * ```
 */
export type CommandPayloadMap = {
  LOGIN: LoginPayload;
  MOVE: ClientToServerMovePayload;
  ATTACK: ClientToServerEntityTargetPayload;
  TALK: ClientToServerEntityTargetPayload;
  INTERACT: ClientToServerEntityTargetPayload;
  WAIT: WaitPayload;
  CUSTOM: ClientToServerCustomPayload;
};

/**
 * Извлекает тип action из ClientToServerCommand
 */
export type CommandAction = ClientToServerCommand["action"];

/**
 * Типизированная функция создания команды
 *
 * Эта сигнатура функции обеспечивает, что payload соответствует типу action:
 * - Если action = "MOVE", payload должен быть ClientToServerMovePayload
 * - Если action = "ATTACK", payload должен быть ClientToServerEntityTargetPayload
 * - И так далее для всех типов команд
 *
 * @template T - Тип action, должен быть одним из CommandAction
 * @param action - Тип команды
 * @param payload - Payload, соответствующий типу команды
 * @returns Типизированная команда или null если команда невалидна
 *
 * @example
 * ```typescript
 * // TypeScript автоматически выводит тип payload из action
 * createClientCommand("MOVE", { dx: 1, dy: 0 }); // ✅ Правильно
 * createClientCommand("MOVE", { targetId: "123" }); // ❌ Ошибка типа!
 *
 * createClientCommand("ATTACK", { targetId: "123" }); // ✅ Правильно
 * createClientCommand("ATTACK", { dx: 1 }); // ❌ Ошибка типа!
 * ```
 */
export type CreateClientCommandFn = <T extends CommandAction>(
  action: T,
  payload: CommandPayloadMap[T]
) => ClientToServerCommand | null;

/**
 * Обработчик команды с типизированным payload
 *
 * @template T - Тип action
 */
export type TypedCommandHandler<T extends CommandAction> = (
  payload: CommandPayloadMap[T]
) => ClientToServerCommand | null;

/**
 * Маппинг всех обработчиков команд с правильной типизацией
 */
export type CommandHandlersMap = {
  [K in CommandAction]: TypedCommandHandler<K>;
};

/**
 * Helper type: извлекает тип payload для конкретного action
 *
 * @example
 * ```typescript
 * type MovePayload = PayloadForAction<"MOVE">; // ClientToServerMovePayload
 * type AttackPayload = PayloadForAction<"ATTACK">; // ClientToServerEntityTargetPayload
 * ```
 */
export type PayloadForAction<T extends CommandAction> = CommandPayloadMap[T];

/**
 * Type guard: проверяет, является ли строка валидным типом команды
 *
 * @param action - Строка для проверки
 * @returns true если action является валидным CommandAction
 *
 * @example
 * ```typescript
 * if (isValidCommandAction(userInput)) {
 *   // TypeScript знает, что userInput это CommandAction
 *   createClientCommand(userInput, payload);
 * }
 * ```
 */
export function isValidCommandAction(action: string): action is CommandAction {
  const validActions: CommandAction[] = [
    "LOGIN",
    "MOVE",
    "ATTACK",
    "TALK",
    "INTERACT",
    "WAIT",
    "CUSTOM",
  ];
  return validActions.includes(action as CommandAction);
}

/**
 * Валидирует payload для конкретного типа команды
 *
 * @param action - Тип команды
 * @param payload - Payload для проверки
 * @returns true если payload валиден для данного action
 *
 * @example
 * ```typescript
 * const isValid = validateCommandPayload("MOVE", { dx: 1, dy: 0 }); // true
 * const isInvalid = validateCommandPayload("MOVE", { targetId: "123" }); // false
 * ```
 */
export function validateCommandPayload(
  action: CommandAction,
  payload: any
): payload is CommandPayloadMap[typeof action] {
  switch (action) {
    case "LOGIN":
      return typeof payload === "object" && typeof payload.token === "string";

    case "MOVE":
      return (
        typeof payload === "object" &&
        (typeof payload.dx === "number" || typeof payload.x === "number")
      );

    case "ATTACK":
    case "TALK":
    case "INTERACT":
      return (
        typeof payload === "object" && typeof payload.targetId === "string"
      );

    case "WAIT":
      return payload == null || Object.keys(payload).length === 0;

    case "CUSTOM":
      return typeof payload === "object";

    default:
      return false;
  }
}

/**
 * Расширенная информация о команде для UI
 */
export interface CommandMetadata {
  /** Тип команды */
  action: CommandAction;
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
 *
 * @param action - Тип команды
 * @returns Метаданные команды
 *
 * @example
 * ```typescript
 * const metadata = getCommandMetadata("ATTACK");
 * console.log(metadata.requiresTarget); // true
 * ```
 */
export function getCommandMetadata(action: CommandAction): CommandMetadata {
  return COMMAND_METADATA[action];
}
