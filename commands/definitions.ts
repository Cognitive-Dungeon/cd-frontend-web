/**
 * Commands - Predefined Definitions
 *
 * Предопределённые команды для общих игровых действий.
 * Используются для привязки клавиш и быстрого создания команд.
 */

import {GameCommand} from "./types";

// ============================================================================
// Movement Commands
// ============================================================================

export const CommandUp: GameCommand = {
  action: "MOVE",
  payload: { dx: 0, dy: -1 },
  label: "Move Up",
  description: "Вы пошли наверх",
};

export const CommandDown: GameCommand = {
  action: "MOVE",
  payload: { dx: 0, dy: 1 },
  label: "Move Down",
  description: "Вы пошли вниз",
};

export const CommandLeft: GameCommand = {
  action: "MOVE",
  payload: { dx: -1, dy: 0 },
  label: "Move Left",
  description: "Вы пошли влево",
};

export const CommandRight: GameCommand = {
  action: "MOVE",
  payload: { dx: 1, dy: 0 },
  label: "Move Right",
  description: "Вы пошли направо",
};

// ============================================================================
// Custom Command
// ============================================================================

export const CommandCustom: GameCommand = {
  action: "CUSTOM",
  payload: {},
  label: "Custom Command",
  description: "Вы выполнили кастомную команду",
  requiresEntityTarget: false,
  requiresPositionTarget: false,
};

// ============================================================================
// Entity Target Commands
// ============================================================================

export const CommandAttack: GameCommand = {
  action: "ATTACK",
  label: "Attack",
  description: "Вы атаковали {targetName}",
  requiresEntityTarget: true,
};

export const CommandTalk: GameCommand = {
  action: "TALK",
  label: "Talk",
  description: "Вы поговорили с {targetName}",
  requiresEntityTarget: true,
};

export const CommandInspect: GameCommand = {
  action: "INSPECT",
  label: "Inspect",
  description: "Вы осмотрели {targetName}",
  requiresEntityTarget: true,
};

export const CommandPickup: GameCommand = {
  action: "PICKUP",
  label: "Pick Up",
  description: "Вы подобрали {name}",
};

export const CommandInteract: GameCommand = {
  action: "INTERACT",
  label: "Interact",
  description: "Вы взаимодействовали с {targetName}",
  requiresEntityTarget: true,
};

export const CommandTrade: GameCommand = {
  action: "TRADE",
  label: "Trade",
  description: "Вы начали торговлю с {targetName}",
  requiresEntityTarget: true,
};

// ============================================================================
// Position Target Commands
// ============================================================================

export const CommandTeleport: GameCommand = {
  action: "TELEPORT",
  label: "Teleport",
  description: "Вы телепортировались на позицию {position}",
  requiresPositionTarget: true,
};

export const CommandCastArea: GameCommand = {
  action: "CAST_AREA",
  label: "Cast Area Spell",
  description: "Вы применили заклинание на область {position}",
  requiresPositionTarget: true,
};

// ============================================================================
// Inventory Commands
// ============================================================================

/** БРОСИТЬ - Drop item from inventory to current location */
export const CommandDrop: GameCommand = {
  action: "DROP",
  label: "Drop",
  description: "Вы бросили {name}",
};

/** ИСПОЛЬЗОВАТЬ - Use item from inventory */
export const CommandUse: GameCommand = {
  action: "USE",
  label: "Use",
  description: "Вы использовали {name}",
};

/** НАДЕТЬ - Equip item from inventory */
export const CommandEquip: GameCommand = {
  action: "EQUIP",
  label: "Equip",
  description: "Вы надели {name}",
};

/** СНЯТЬ - Unequip item */
export const CommandUnequip: GameCommand = {
  action: "UNEQUIP",
  label: "Unequip",
  description: "Вы сняли {name}",
};

// ============================================================================
// Speech Commands
// ============================================================================
// TODO: Ждем контракта от бекенда, надо будет переделать

/** ГОВОРИТЬ */
export const CommandSay: GameCommand = {
  action: "SAY",
  label: "Say",
  description: "Вы сказали: {text}",
};

/** ШЕПТАТЬ */
export const CommandWhisper: GameCommand = {
  action: "WHISPER",
  label: "Whisper",
  description: "Вы прошептали: {text}",
};

/** КРИЧАТЬ */
export const CommandYell: GameCommand = {
  action: "YELL",
  label: "Yell",
  description: "Вы крикнули: {text}",
};

// ============================================================================
// Wait Command
// ============================================================================

export const CommandWait: GameCommand = {
  action: "WAIT",
  payload: {},
  label: "Wait",
  description: "Вы пропустили ход",
};

// ============================================================================
// All Commands Collection
// ============================================================================

/**
 * Коллекция всех предопределённых команд
 */
export const ALL_PREDEFINED_COMMANDS: GameCommand[] = [
  // Movement
  CommandUp,
  CommandDown,
  CommandLeft,
  CommandRight,
  // Entity Target
  CommandAttack,
  CommandTalk,
  CommandInspect,
  CommandPickup,
  CommandInteract,
  CommandTrade,
  // Position Target
  CommandTeleport,
  CommandCastArea,
  // Inventory
  CommandDrop,
  CommandUse,
  CommandEquip,
  CommandUnequip,
  // Speech
  CommandSay,
  CommandWhisper,
  CommandYell,
  // Other
  CommandWait,
  CommandCustom,
];

/**
 * Маппинг action → GameCommand для быстрого поиска
 */
export const COMMAND_BY_ACTION: Record<string, GameCommand> = {
  MOVE_UP: CommandUp,
  MOVE_DOWN: CommandDown,
  MOVE_LEFT: CommandLeft,
  MOVE_RIGHT: CommandRight,
  ATTACK: CommandAttack,
  TALK: CommandTalk,
  INSPECT: CommandInspect,
  PICKUP: CommandPickup,
  INTERACT: CommandInteract,
  TRADE: CommandTrade,
  TELEPORT: CommandTeleport,
  CAST_AREA: CommandCastArea,
  DROP: CommandDrop,
  USE: CommandUse,
  EQUIP: CommandEquip,
  UNEQUIP: CommandUnequip,
  SAY: CommandSay,
  WHISPER: CommandWhisper,
  YELL: CommandYell,
  WAIT: CommandWait,
  CUSTOM: CommandCustom,
};
