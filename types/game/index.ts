/**
 * Game Types - Barrel Export
 *
 * Экспортирует все типы игровых сущностей.
 * Порядок экспортов важен для избежания циклических зависимостей.
 */

// Item types (export first - no dependencies on other game types)
export type { Item, ItemAction } from "./item";

export { ItemType, ItemActionType } from "./item";

// World types (no dependencies on entity/item)
export type { Tile, TileEnv, GameWorld } from "./world";

// Log types (depends only on Position from protocol)
export type { LogMessage, LogCommandData } from "./log";

export { GameState, LogType } from "./log";

// Entity types (depends on Item, so export last)
export type { Stats, Entity, NpcType, Personality, AiState } from "./entity";

export { EntityType } from "./entity";
