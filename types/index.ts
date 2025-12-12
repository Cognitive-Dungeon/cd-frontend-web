/**
 * Barrel export для типов команд
 *
 * Экспортирует все типы, связанные с командной системой,
 * для удобного импорта в других частях приложения.
 */

export type {
  LoginPayload,
  WaitPayload,
  CommandPayloadMap,
  CommandAction,
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
