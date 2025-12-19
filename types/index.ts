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
// Command Types (from types/commands.ts - no circular dependency)
// Note: CommandAction and CommandPayloadMap are already exported from ./protocol
// ============================================================================

export type {
  CommandMetadata,
  CreateClientCommandFn,
  TypedCommandHandler,
  CommandHandlersMap,
  PayloadForAction,
  LoginPayload,
  WaitPayload,
} from "./commands";

export {
  isValidCommandAction,
  validateCommandPayload,
  getCommandMetadata,
  COMMAND_METADATA,
} from "./commands";

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

// Re-export with aliases for code that uses old names
export type {
  CommandPayloadMap as LegacyCommandPayloadMap,
  CommandAction as LegacyCommandAction,
} from "./protocol/client-to-server";
