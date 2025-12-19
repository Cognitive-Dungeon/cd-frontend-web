/**
 * Protocol: Client → Server
 *
 * Все типы команд, отправляемых клиентом на сервер.
 * Соответствует протоколу: https://github.com/Cognitive-Dungeon/cd-techdoc
 */

// ============================================================================
// Payload Types
// ============================================================================

/**
 * Payload для команды перемещения
 */
export interface ClientToServerMovePayload {
  /** Смещение по оси X (-1, 0, 1) */
  dx?: number;
  /** Смещение по оси Y (-1, 0, 1) */
  dy?: number;
  /** Абсолютная координата X (альтернатива dx/dy) */
  x?: number;
  /** Абсолютная координата Y (альтернатива dx/dy) */
  y?: number;
}

/**
 * Payload для команд, требующих цель-сущность
 */
export interface ClientToServerEntityTargetPayload {
  /** ID целевой сущности */
  targetId: string;
}

/**
 * Payload для команд, требующих целевую позицию
 */
export interface ClientToServerPositionTargetPayload {
  /** Координата X целевой позиции */
  x: number;
  /** Координата Y целевой позиции */
  y: number;
}

/**
 * Payload для команд использования предметов
 */
export interface ClientToServerUsePayload {
  /** Название предмета */
  name: string;
  /** Опциональный ID целевой сущности */
  targetId?: string;
}

/**
 * Payload для команд выброса предметов
 */
export interface ClientToServerDropPayload {
  /** Название предмета */
  name: string;
}

/**
 * Payload для команд с предметами
 */
export interface ClientToServerItemPayload {
  /** ID предмета */
  itemId: string;
  /** Количество (для стакающихся предметов) */
  count?: number;
}

/**
 * Payload для текстовых команд
 */
export interface ClientToServerTextPayload {
  /** Текст сообщения */
  text: string;
}

/**
 * Payload для кастомных команд
 */
export interface ClientToServerCustomPayload {
  [key: string]: any;
}

// ============================================================================
// Command Union Type
// ============================================================================

/**
 * Типы действий команд
 */
export type ClientToServerAction =
  | "LOGIN"
  | "MOVE"
  | "ATTACK"
  | "TALK"
  | "INTERACT"
  | "WAIT"
  | "PICKUP"
  | "DROP"
  | "USE"
  | "EQUIP"
  | "UNEQUIP"
  | "CUSTOM";

/**
 * Команда от клиента к серверу
 *
 * Дискриминированный union тип на основе action для типобезопасности payload
 */
export type ClientToServerCommand =
  | {
      action: "LOGIN";
      token: string;
    }
  | {
      action: "MOVE";
      payload: ClientToServerMovePayload;
    }
  | {
      action: "ATTACK" | "TALK" | "INTERACT";
      payload: ClientToServerEntityTargetPayload;
    }
  | {
      action: "WAIT";
      payload?: Record<string, never> | null;
    }
  | {
      action: "PICKUP" | "DROP" | "USE" | "EQUIP" | "UNEQUIP";
      payload: ClientToServerItemPayload;
    }
  | {
      action: "CUSTOM";
      payload: ClientToServerCustomPayload;
    };

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Извлекает тип action из ClientToServerCommand
 */
export type CommandAction = ClientToServerCommand["action"];

/**
 * Маппинг action → payload для типобезопасного создания команд
 */
export type CommandPayloadMap = {
  LOGIN: { token: string };
  MOVE: ClientToServerMovePayload;
  ATTACK: ClientToServerEntityTargetPayload;
  TALK: ClientToServerEntityTargetPayload;
  INTERACT: ClientToServerEntityTargetPayload;
  WAIT: Record<string, never> | null | undefined;
  PICKUP: ClientToServerItemPayload;
  DROP: ClientToServerItemPayload;
  USE: ClientToServerItemPayload;
  EQUIP: ClientToServerItemPayload;
  UNEQUIP: ClientToServerItemPayload;
  CUSTOM: ClientToServerCustomPayload;
};

// ============================================================================
// Serialization
// ============================================================================

/**
 * Сериализует команду клиента в JSON строку для отправки по WebSocket
 *
 * @param command - Команда для отправки
 * @returns JSON строка, готовая для отправки через WebSocket.send()
 *
 * @example
 * ```typescript
 * // LOGIN command
 * const loginCommand: ClientToServerCommand = {
 *   action: "LOGIN",
 *   token: "player-entity-id"
 * };
 * socket.send(serializeClientCommand(loginCommand));
 *
 * // MOVE command
 * const moveCommand: ClientToServerCommand = {
 *   action: "MOVE",
 *   payload: { dx: 0, dy: -1 }
 * };
 * socket.send(serializeClientCommand(moveCommand));
 * ```
 */
export function serializeClientCommand(command: ClientToServerCommand): string {
  return JSON.stringify(command);
}
