/**
 * Commands - Barrel Export
 *
 * Унифицированный модуль командной системы.
 * Объединяет типы, определения, билдеры, валидаторы и метаданные.
 *
 * @example
 * ```typescript
 * import {
 *   // Types
 *   GameCommand,
 *   KeyBinding,
 *   ClientToServerCommand,
 *
 *   // Predefined commands
 *   CommandUp,
 *   CommandAttack,
 *
 *   // Builders
 *   createMoveCommand,
 *   createAttackCommand,
 *
 *   // Validators
 *   validateCommand,
 *   isMoveCommand,
 *
 *   // Metadata
 *   COMMAND_METADATA,
 *   getCommandMetadata,
 *
 *   // Key Bindings
 *   KeyBindingManager,
 *   DEFAULT_KEY_BINDINGS,
 * } from "./commands";
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Protocol types (re-exported from types/protocol)
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
  // Game command types
  GameCommand,
  KeyBinding,
  CommandMetadata,
  // Handler types
  CreateClientCommandFn,
  TypedCommandHandler,
  CommandHandlersMap,
  // Payload types
  LoginPayload,
  WaitPayload,
  PayloadForAction,
} from "./types";

export { serializeClientCommand } from "./types";

// ============================================================================
// Predefined Command Definitions
// ============================================================================

export {
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
  // Collections
  ALL_PREDEFINED_COMMANDS,
  COMMAND_BY_ACTION,
} from "./definitions";

// ============================================================================
// Command Builders
// ============================================================================

export {
  // Authentication
  createLoginCommand,
  // Movement
  createMoveCommand,
  createMoveToPositionCommand,
  createMoveCommandFromPayload,
  // Entity Target
  createAttackCommand,
  createTalkCommand,
  createInteractCommand,
  createEntityTargetCommand,
  // Inventory
  createPickupCommand,
  createDropCommand,
  createUseCommand,
  createEquipCommand,
  createUnequipCommand,
  createInventoryCommand,
  // Other
  createWaitCommand,
  createCustomCommand,
} from "./builders";

// ============================================================================
// Validators & Type Guards
// ============================================================================

export {
  // Type Guards
  isValidCommandAction,
  isMoveCommand,
  isEntityTargetCommand,
  isLoginCommand,
  isInventoryCommand,
  isWaitCommand,
  isCustomCommand,
  // Validators
  validateCommandPayload,
  validateCommand,
  // Extraction utilities
  extractTargetId,
  extractMoveCoordinates,
  extractItemId,
  // Serialization
  safeSerializeCommand,
} from "./validators";

// ============================================================================
// Command Metadata
// ============================================================================

export {
  COMMAND_METADATA,
  getCommandMetadata,
  commandRequiresTarget,
  commandRequiresPosition,
  commandAvailableOutOfTurn,
  getCommandDisplayName,
  getCommandDescription,
  getCommandsByFilter,
  getTargetRequiringCommands,
  getPositionRequiringCommands,
  getOutOfTurnCommands,
  getInTurnCommands,
} from "./metadata";

// ============================================================================
// Key Binding Management
// ============================================================================

export {
  DEFAULT_KEY_BINDINGS,
  KeyBindingManager,
  getKeyBindingManager,
  resetKeyBindingManager,
} from "./KeyBindingManager";
