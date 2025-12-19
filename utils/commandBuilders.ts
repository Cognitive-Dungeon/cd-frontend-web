/**
 * Utils - Command Builders (Backward Compatibility)
 *
 * Этот файл сохранён для обратной совместимости.
 * Все функции теперь находятся в модуле `commands/`.
 *
 * @deprecated Импортируйте напрямую из "../commands/" для новых файлов
 *
 * @example
 * ```typescript
 * // Legacy (этот файл)
 * import { createMoveCommand, createAttackCommand } from "./utils/commandBuilders";
 *
 * // Рекомендуемый способ
 * import { createMoveCommand, createAttackCommand } from "./commands/";
 * ```
 */

// Re-export all builders from commands module
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
} from "../commands/builders";

// Re-export validators that were in this file
export {
  // Type Guards
  isMoveCommand,
  isEntityTargetCommand,
  isLoginCommand,
  isInventoryCommand,
  isWaitCommand,
  isCustomCommand,
  // Validators
  validateCommand,
  // Extraction utilities
  extractTargetId,
  extractMoveCoordinates,
  extractItemId,
  // Serialization
  safeSerializeCommand,
} from "../commands/validators";
