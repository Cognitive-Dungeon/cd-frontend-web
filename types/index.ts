/**
 * Types - Internal Barrel Export
 *
 * Экспортирует все типы из модульной структуры.
 * Для использования в приложении импортируйте из "../types" (types.ts)
 */

// ============================================================================
// Protocol Types
// ============================================================================

export * from "./protocol";

// ============================================================================
// Game Types
// ============================================================================

export * from "./game";

// ============================================================================
// UI Types
// ============================================================================

export * from "./ui";

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

// Commands types (will be moved to commands/ module later)
export type {
  LoginPayload,
  WaitPayload,
  CommandPayloadMap as LegacyCommandPayloadMap,
  CommandAction as LegacyCommandAction,
  CreateClientCommandFn,
  TypedCommandHandler,
  CommandHandlersMap,
  PayloadForAction,
  CommandMetadata,
} from "./commands";

export {
  isValidCommandAction,
  validateCommandPayload,
  getCommandMetadata,
  COMMAND_METADATA,
} from "./commands";
