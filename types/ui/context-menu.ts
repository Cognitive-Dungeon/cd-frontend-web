/**
 * Context Menu Types
 *
 * Типы для контекстного меню в UI
 */

import type { Entity } from "../game/entity";

/**
 * Данные контекстного меню
 */
export interface ContextMenuData {
  /** Координата X меню на экране (пиксели) */
  x: number;
  /** Координата Y меню на экране (пиксели) */
  y: number;
  /** Координата X клетки на карте */
  cellX: number;
  /** Координата Y клетки на карте */
  cellY: number;
  /** Сущности в данной клетке */
  entities: Entity[];
}
