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
// Command Types (re-exported from commands/ module for convenience)
// Note: Primary source is ../commands/, these are for backward compatibility
// ============================================================================

export type {
  CommandMetadata,
  CreateClientCommandFn,
  TypedCommandHandler,
  CommandHandlersMap,
  PayloadForAction,
  LoginPayload,
  WaitPayload,
  GameCommand,
  KeyBinding,
} from "../commands/types";

export {
  isValidCommandAction,
  validateCommandPayload,
} from "../commands/validators";

export { getCommandMetadata, COMMAND_METADATA } from "../commands/metadata";

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

// Re-export with aliases for code that uses old names
export type {
  CommandPayloadMap as LegacyCommandPayloadMap,
  CommandAction as LegacyCommandAction,
} from "./protocol/client-to-server";
