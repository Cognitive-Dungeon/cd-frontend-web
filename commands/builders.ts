/**
 * Commands - Builders
 *
 * Типизированные функции для создания команд клиент-сервер.
 * Обеспечивают полную type-safety при создании команд,
 * автоматически проверяя правильность payload на этапе компиляции.
 */

import {
  ClientToServerCommand,
  ClientToServerMovePayload,
  ClientToServerCustomPayload,
} from "./types";

// ============================================================================
// Authentication Commands
// ============================================================================

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

// ============================================================================
// Movement Commands
// ============================================================================

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

// ============================================================================
// Entity Target Commands
// ============================================================================

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

// ============================================================================
// Inventory Commands
// ============================================================================

/**
 * Создает команду PICKUP
 *
 * @param itemId - ID предмета для подбора
 * @param count - Количество (опционально)
 * @returns Команда PICKUP или null если itemId пустой
 *
 * @example
 * ```typescript
 * const cmd = createPickupCommand("gold-coin-123");
 * const cmdWithCount = createPickupCommand("arrows-456", 10);
 * ```
 */
export function createPickupCommand(
  itemId: string,
  count?: number,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action: "PICKUP",
    payload: count !== undefined ? { itemId, count } : { itemId },
  };
}

/**
 * Создает команду DROP
 *
 * @param itemId - ID предмета для выбрасывания
 * @param count - Количество (опционально)
 * @returns Команда DROP или null если itemId пустой
 *
 * @example
 * ```typescript
 * const cmd = createDropCommand("old-sword-123");
 * ```
 */
export function createDropCommand(
  itemId: string,
  count?: number,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action: "DROP",
    payload: count !== undefined ? { itemId, count } : { itemId },
  };
}

/**
 * Создает команду USE
 *
 * @param itemId - ID предмета для использования
 * @param count - Количество (опционально)
 * @returns Команда USE или null если itemId пустой
 *
 * @example
 * ```typescript
 * const cmd = createUseCommand("health-potion-123");
 * ```
 */
export function createUseCommand(
  itemId: string,
  count?: number,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action: "USE",
    payload: count !== undefined ? { itemId, count } : { itemId },
  };
}

/**
 * Создает команду EQUIP
 *
 * @param itemId - ID предмета для экипировки
 * @returns Команда EQUIP или null если itemId пустой
 *
 * @example
 * ```typescript
 * const cmd = createEquipCommand("iron-sword-123");
 * ```
 */
export function createEquipCommand(
  itemId: string,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action: "EQUIP",
    payload: { itemId },
  };
}

/**
 * Создает команду UNEQUIP
 *
 * @param itemId - ID предмета для снятия
 * @returns Команда UNEQUIP или null если itemId пустой
 *
 * @example
 * ```typescript
 * const cmd = createUnequipCommand("iron-sword-123");
 * ```
 */
export function createUnequipCommand(
  itemId: string,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action: "UNEQUIP",
    payload: { itemId },
  };
}

/**
 * Создает команду для работы с инвентарем
 *
 * @param action - Тип действия
 * @param itemId - ID предмета
 * @param count - Количество (опционально)
 * @returns Команда или null если itemId пустой
 *
 * @example
 * ```typescript
 * const dropCmd = createInventoryCommand("DROP", "old-armor-123");
 * const useCmd = createInventoryCommand("USE", "potion-456", 1);
 * ```
 */
export function createInventoryCommand(
  action: "PICKUP" | "DROP" | "USE" | "EQUIP" | "UNEQUIP",
  itemId: string,
  count?: number,
): ClientToServerCommand | null {
  if (!itemId) {
    return null;
  }

  return {
    action,
    payload: count !== undefined ? { itemId, count } : { itemId },
  };
}

// ============================================================================
// Other Commands
// ============================================================================

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
