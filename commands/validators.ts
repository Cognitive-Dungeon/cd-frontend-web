/**
 * Commands - Validators
 *
 * Функции валидации команд и type guards.
 * Обеспечивают проверку корректности команд перед отправкой.
 */

import {
  ClientToServerCommand,
  CommandAction,
} from "./types";

// ============================================================================
// Type Guards
// ============================================================================

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
 * Type guard: проверяет, является ли команда командой движения
 *
 * @param command - Команда для проверки
 * @returns true если это команда MOVE
 */
export function isMoveCommand(
  command: ClientToServerCommand,
): command is Extract<ClientToServerCommand, { action: "MOVE" }> {
  return command.action === "MOVE";
}

/**
 * Type guard: проверяет, является ли команда командой с целью-сущностью
 *
 * @param command - Команда для проверки
 * @returns true если это ATTACK, TALK или INTERACT
 */
export function isEntityTargetCommand(
  command: ClientToServerCommand,
): command is Extract<
  ClientToServerCommand,
  { action: "ATTACK" | "TALK" | "INTERACT" }
> {
  return (
    command.action === "ATTACK" ||
    command.action === "TALK" ||
    command.action === "INTERACT"
  );
}

/**
 * Type guard: проверяет, является ли команда командой LOGIN
 *
 * @param command - Команда для проверки
 * @returns true если это команда LOGIN
 */
export function isLoginCommand(
  command: ClientToServerCommand,
): command is Extract<ClientToServerCommand, { action: "LOGIN" }> {
  return command.action === "LOGIN";
}

/**
 * Type guard: проверяет, является ли команда командой инвентаря
 *
 * @param command - Команда для проверки
 * @returns true если это PICKUP, DROP, USE, EQUIP или UNEQUIP
 */
export function isInventoryCommand(
  command: ClientToServerCommand,
): command is Extract<
  ClientToServerCommand,
  { action: "PICKUP" | "DROP" | "USE" | "EQUIP" | "UNEQUIP" }
> {
  return (
    command.action === "PICKUP" ||
    command.action === "DROP" ||
    command.action === "USE" ||
    command.action === "EQUIP" ||
    command.action === "UNEQUIP"
  );
}

/**
 * Type guard: проверяет, является ли команда командой WAIT
 *
 * @param command - Команда для проверки
 * @returns true если это команда WAIT
 */
export function isWaitCommand(
  command: ClientToServerCommand,
): command is Extract<ClientToServerCommand, { action: "WAIT" }> {
  return command.action === "WAIT";
}

/**
 * Type guard: проверяет, является ли команда кастомной командой
 *
 * @param command - Команда для проверки
 * @returns true если это команда CUSTOM
 */
export function isCustomCommand(
  command: ClientToServerCommand,
): command is Extract<ClientToServerCommand, { action: "CUSTOM" }> {
  return command.action === "CUSTOM";
}

// ============================================================================
// Payload Validators
// ============================================================================

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
      return typeof p.token === "string" && p.token.length > 0;

    case "MOVE":
      return (
        (typeof p.dx === "number" && typeof p.dy === "number") ||
        (typeof p.x === "number" && typeof p.y === "number")
      );

    case "ATTACK":
    case "TALK":
    case "INTERACT":
      return typeof p.targetId === "string" && p.targetId.length > 0;

    case "WAIT":
      return Object.keys(p).length === 0;

    case "PICKUP":
    case "DROP":
    case "USE":
    case "EQUIP":
    case "UNEQUIP":
      return typeof p.itemId === "string" && p.itemId.length > 0;

    case "CUSTOM":
      return true;

    default:
      return false;
  }
}

// ============================================================================
// Command Validators
// ============================================================================

/**
 * Валидирует команду перед отправкой
 *
 * @param command - Команда для валидации
 * @returns true если команда валидна
 *
 * @example
 * ```typescript
 * const cmd = createAttackCommand("enemy-123");
 * if (cmd && validateCommand(cmd)) {
 *   ws.send(JSON.stringify(cmd));
 * }
 * ```
 */
export function validateCommand(command: ClientToServerCommand): boolean {
  switch (command.action) {
    case "LOGIN":
      return typeof command.token === "string" && command.token.length > 0;

    case "MOVE":
      return (
        (typeof command.payload.dx === "number" &&
          typeof command.payload.dy === "number") ||
        (typeof command.payload.x === "number" &&
          typeof command.payload.y === "number")
      );

    case "ATTACK":
    case "TALK":
    case "INTERACT":
      return (
        typeof command.payload.targetId === "string" &&
        command.payload.targetId.length > 0
      );

    case "WAIT":
      return true;

    case "PICKUP":
    case "DROP":
    case "USE":
    case "EQUIP":
    case "UNEQUIP":
      return (
        typeof command.payload.itemId === "string" &&
        command.payload.itemId.length > 0
      );

    case "CUSTOM":
      return typeof command.payload === "object";

    default:
      return false;
  }
}

// ============================================================================
// Extraction Utilities
// ============================================================================

/**
 * Извлекает targetId из команды с целью
 *
 * @param command - Команда для извлечения
 * @returns targetId или undefined
 *
 * @example
 * ```typescript
 * const cmd = createAttackCommand("enemy-123");
 * const targetId = extractTargetId(cmd); // "enemy-123"
 * ```
 */
export function extractTargetId(
  command: ClientToServerCommand,
): string | undefined {
  if (isEntityTargetCommand(command)) {
    return command.payload.targetId;
  }
  return undefined;
}

/**
 * Извлекает координаты из команды движения
 *
 * @param command - Команда для извлечения
 * @returns Объект с координатами или undefined
 *
 * @example
 * ```typescript
 * const cmd = createMoveCommand(1, 0);
 * const coords = extractMoveCoordinates(cmd); // { dx: 1, dy: 0 }
 * ```
 */
export function extractMoveCoordinates(
  command: ClientToServerCommand,
): { dx?: number; dy?: number; x?: number; y?: number } | undefined {
  if (isMoveCommand(command)) {
    return command.payload;
  }
  return undefined;
}

/**
 * Извлекает itemId из команды инвентаря
 *
 * @param command - Команда для извлечения
 * @returns itemId или undefined
 *
 * @example
 * ```typescript
 * const cmd = createUseCommand("potion-123");
 * const itemId = extractItemId(cmd); // "potion-123"
 * ```
 */
export function extractItemId(
  command: ClientToServerCommand,
): string | undefined {
  if (isInventoryCommand(command)) {
    return command.payload.itemId;
  }
  return undefined;
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Безопасно сериализует команду в JSON
 *
 * @param command - Команда для сериализации
 * @returns JSON строка или null при ошибке
 *
 * @example
 * ```typescript
 * const cmd = createMoveCommand(1, 0);
 * const json = safeSerializeCommand(cmd);
 * if (json) {
 *   ws.send(json);
 * }
 * ```
 */
export function safeSerializeCommand(
  command: ClientToServerCommand,
): string | null {
  try {
    if (!validateCommand(command)) {
      console.error("Invalid command:", command);
      return null;
    }
    return JSON.stringify(command);
  } catch (error) {
    console.error("Failed to serialize command:", error);
    return null;
  }
}
