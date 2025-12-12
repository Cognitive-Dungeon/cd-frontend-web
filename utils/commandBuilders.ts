/**
 * Типизированные хелперы для создания команд клиент-сервер
 *
 * Эти функции обеспечивают полную type-safety при создании команд,
 * автоматически проверяя правильность payload на этапе компиляции.
 */

import {
  ClientToServerCommand,
  ClientToServerMovePayload,
  ClientToServerCustomPayload,
} from "../types";

/**
 * Создает команду LOGIN
 *
 * @param token - Токен авторизации (ID сущности игрока)
 * @returns Команда LOGIN
 *
 * @example
 * ```typescript
 * const cmd = createLoginCommand("player-123");
 * ws.send(JSON.stringify(cmd));
 * ```
 */
export function createLoginCommand(token: string): ClientToServerCommand {
  return {
    action: "LOGIN",
    token,
  };
}

/**
 * Создает команду MOVE с относительным смещением
 *
 * @param dx - Смещение по оси X (-1, 0, 1)
 * @param dy - Смещение по оси Y (-1, 0, 1)
 * @returns Команда MOVE
 *
 * @example
 * ```typescript
 * // Движение вверх
 * const cmd = createMoveCommand(0, -1);
 *
 * // Движение вправо-вниз
 * const cmd = createMoveCommand(1, 1);
 * ```
 */
export function createMoveCommand(
  dx: number,
  dy: number,
): ClientToServerCommand {
  return {
    action: "MOVE",
    payload: { dx, dy },
  };
}

/**
 * Создает команду MOVE с абсолютными координатами
 *
 * @param x - Целевая координата X
 * @param y - Целевая координата Y
 * @returns Команда MOVE
 *
 * @example
 * ```typescript
 * const cmd = createMoveToPositionCommand(10, 5);
 * ```
 */
export function createMoveToPositionCommand(
  x: number,
  y: number,
): ClientToServerCommand {
  return {
    action: "MOVE",
    payload: { x, y },
  };
}

/**
 * Создает команду MOVE из полного payload
 *
 * @param payload - Payload движения (может содержать dx/dy или x/y)
 * @returns Команда MOVE
 *
 * @example
 * ```typescript
 * const cmd = createMoveCommandFromPayload({ dx: 1, dy: 0 });
 * const cmd2 = createMoveCommandFromPayload({ x: 10, y: 5 });
 * ```
 */
export function createMoveCommandFromPayload(
  payload: ClientToServerMovePayload,
): ClientToServerCommand {
  return {
    action: "MOVE",
    payload,
  };
}

/**
 * Создает команду ATTACK
 *
 * @param targetId - ID целевой сущности для атаки
 * @returns Команда ATTACK или null если targetId пустой
 *
 * @example
 * ```typescript
 * const cmd = createAttackCommand("goblin-123");
 * ```
 */
export function createAttackCommand(
  targetId: string,
): ClientToServerCommand | null {
  if (!targetId) {
    return null;
  }

  return {
    action: "ATTACK",
    payload: { targetId },
  };
}

/**
 * Создает команду TALK
 *
 * @param targetId - ID сущности для разговора
 * @returns Команда TALK или null если targetId пустой
 *
 * @example
 * ```typescript
 * const cmd = createTalkCommand("npc-merchant-456");
 * ```
 */
export function createTalkCommand(
  targetId: string,
): ClientToServerCommand | null {
  if (!targetId) {
    return null;
  }

  return {
    action: "TALK",
    payload: { targetId },
  };
}

/**
 * Создает команду INTERACT
 *
 * @param targetId - ID объекта для взаимодействия
 * @returns Команда INTERACT или null если targetId пустой
 *
 * @example
 * ```typescript
 * const cmd = createInteractCommand("chest-789");
 * ```
 */
export function createInteractCommand(
  targetId: string,
): ClientToServerCommand | null {
  if (!targetId) {
    return null;
  }

  return {
    action: "INTERACT",
    payload: { targetId },
  };
}

/**
 * Создает команду WAIT
 *
 * @returns Команда WAIT
 *
 * @example
 * ```typescript
 * const cmd = createWaitCommand();
 * ```
 */
export function createWaitCommand(): ClientToServerCommand {
  return {
    action: "WAIT",
    payload: {},
  };
}

/**
 * Создает команду CUSTOM
 *
 * @param payload - Произвольный payload
 * @returns Команда CUSTOM
 *
 * @example
 * ```typescript
 * const cmd = createCustomCommand({
 *   action: "SPECIAL_ABILITY",
 *   abilityId: "fireball",
 *   power: 10
 * });
 * ```
 */
export function createCustomCommand(
  payload: ClientToServerCustomPayload,
): ClientToServerCommand {
  return {
    action: "CUSTOM",
    payload,
  };
}

/**
 * Создает команду с целью-сущностью (ATTACK, TALK или INTERACT)
 *
 * @param action - Тип команды
 * @param targetId - ID целевой сущности
 * @returns Команда с целью или null если targetId пустой
 *
 * @example
 * ```typescript
 * const attackCmd = createEntityTargetCommand("ATTACK", "enemy-123");
 * const talkCmd = createEntityTargetCommand("TALK", "npc-456");
 * ```
 */
export function createEntityTargetCommand(
  action: "ATTACK" | "TALK" | "INTERACT",
  targetId: string,
): ClientToServerCommand | null {
  if (!targetId) {
    return null;
  }

  return {
    action,
    payload: { targetId },
  };
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
 * Type guard: проверяет, является ли команда командой с целью
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
 * Валидирует команду перед отправкой
 *
 * @param command - Команда для валидации
 * @returns true если команда валидна
 *
 * @example
 * ```typescript
 * const cmd = createAttackCommand("enemy-123");
 * if (validateCommand(cmd)) {
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

    case "CUSTOM":
      return typeof command.payload === "object";

    default:
      return false;
  }
}

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
