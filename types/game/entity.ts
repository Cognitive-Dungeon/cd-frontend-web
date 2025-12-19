/**
 * Game Entity Types
 *
 * Типы для игровых сущностей (игрок, враги, NPC и т.д.)
 */

import type { Position } from "../protocol/common";
import type {
  ServerToClientInventoryView,
  ServerToClientEquipmentView,
} from "../protocol/server-to-client";

import type { Item } from "./item";

// ============================================================================
// Entity Type Enum
// ============================================================================

/**
 * Типы сущностей в игре
 */
export enum EntityType {
  PLAYER = "PLAYER",
  ENEMY_GOBLIN = "GOBLIN",
  ENEMY_ORC = "ORC",
  CHEST = "CHEST",
  ITEM = "ITEM",
  EXIT = "EXIT",
  NPC = "NPC",
}

// ============================================================================
// Stats
// ============================================================================

/**
 * Характеристики сущности (клиентская модель)
 */
export interface Stats {
  /** Текущее здоровье */
  hp: number;
  /** Максимальное здоровье */
  maxHp: number;
  /** Текущая выносливость */
  stamina: number;
  /** Максимальная выносливость */
  maxStamina: number;
  /** Сила */
  strength: number;
  /** Золото */
  gold: number;
}

// ============================================================================
// Entity
// ============================================================================

/**
 * Тип NPC
 */
export type NpcType = "MERCHANT" | "HEALER" | "GUARD";

/**
 * Личность сущности (для AI)
 */
export type Personality = "Cowardly" | "Furious";

/**
 * Состояние AI сущности
 */
export type AiState = "IDLE" | "AGGRESSIVE" | "FLEEING";

/**
 * Игровая сущность (клиентская модель)
 *
 * Это внутренняя модель клиента, которая создается из ServerToClientEntityView
 * и содержит дополнительные поля для UI и игровой логики.
 */
export interface Entity {
  /** Уникальный идентификатор */
  id: string;
  /** Визуальная метка для таргетинга (A, B, C...) */
  label: string;
  /** Тип сущности */
  type: EntityType;
  /** Символ для отображения */
  symbol: string;
  /** Цвет символа */
  color: string;
  /** Позиция на карте */
  pos: Position;
  /** Характеристики */
  stats: Stats;
  /** Инвентарь (клиентская модель) */
  inventory: Item[];
  /** Инвентарь (серверная модель) */
  inventoryData?: ServerToClientInventoryView | null;
  /** Экипировка (серверная модель) */
  equipment?: ServerToClientEquipmentView | null;
  /** Данные предмета (если сущность — предмет на земле) */
  itemData?: Item;
  /** Имя сущности */
  name: string;
  /** Враждебна ли сущность */
  isHostile: boolean;
  /** Мертва ли сущность */
  isDead: boolean;
  /** Тип NPC (если это NPC) */
  npcType?: NpcType;

  // Time System
  /** Тик следующего действия */
  nextActionTick: number;

  // AI & Narrative
  /** Личность (для AI) */
  personality?: Personality;
  /** Состояние AI */
  aiState?: AiState;
}
