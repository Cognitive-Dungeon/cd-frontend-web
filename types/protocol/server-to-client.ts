/**
 * Protocol: Server → Client
 *
 * Все типы сообщений, отправляемых сервером клиенту.
 * Соответствует протоколу: https://github.com/Cognitive-Dungeon/cd-techdoc
 */

import type { Position } from "./common";

// ============================================================================
// Grid & Map Types
// ============================================================================

/**
 * Метаданные о размере игровой карты
 */
export interface ServerToClientGridMeta {
  /** Ширина карты в тайлах */
  w: number;
  /** Высота карты в тайлах */
  h: number;
}

/**
 * Вид тайла карты, видимый клиенту
 */
export interface ServerToClientTileView {
  /** Координата X тайла */
  x: number;
  /** Координата Y тайла */
  y: number;
  /** Символ для отображения (e.g., `.` для пола, `#` для стены) */
  symbol: string;
  /** Цвет символа (e.g., `#333333`) */
  color: string;
  /** `true`, если тайл является непроходимой стеной */
  isWall: boolean;
  /** `true`, если тайл находится в текущем поле зрения */
  isVisible: boolean;
  /** `true`, если сущность когда-либо видела этот тайл (для "тумана войны") */
  isExplored: boolean;
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Характеристики сущности
 */
export interface ServerToClientStatsView {
  /** Текущее здоровье */
  hp: number;
  /** Максимальное здоровье */
  maxHp: number;
  /** Выносливость (опционально) */
  stamina?: number;
  /** Максимальная выносливость (опционально) */
  maxStamina?: number;
  /** Золото (опционально) */
  gold?: number;
  /** Сила (опционально) */
  strength?: number;
  /** `true`, если сущность мертва */
  isDead: boolean;
}

/**
 * Данные для отображения сущности
 */
export interface ServerToClientEntityRender {
  /** Символ для отображения */
  symbol: string;
  /** Цвет символа */
  color: string;
}

/**
 * Вид предмета
 */
export interface ServerToClientItemView {
  /** Уникальный ID предмета */
  id: string;
  /** Название предмета */
  name: string;
  /** Символ для отображения */
  symbol: string;
  /** Цвет символа */
  color: string;
  /** Категория предмета */
  category: string;
  /** Можно ли складывать в стак */
  isStackable: boolean;
  /** Текущий размер стака */
  stackSize: number;
  /** Урон (для оружия) */
  damage?: number;
  /** Защита (для брони) */
  defense?: number;
  /** Вес предмета */
  weight: number;
  /** Стоимость предмета */
  value: number;
  /** Является ли предмет разумным */
  isSentient: boolean;
}

/**
 * Инвентарь сущности
 */
export interface ServerToClientInventoryView {
  /** Список предметов */
  items: ServerToClientItemView[];
  /** Максимальное количество слотов */
  maxSlots: number;
  /** Текущий вес */
  currentWeight: number;
  /** Максимальный вес */
  maxWeight: number;
}

/**
 * Экипировка сущности
 */
export interface ServerToClientEquipmentView {
  /** Экипированное оружие */
  weapon?: ServerToClientItemView;
  /** Экипированная броня */
  armor?: ServerToClientItemView;
}

/**
 * Вид сущности, видимый клиенту
 */
export interface ServerToClientEntityView {
  /** Уникальный идентификатор сущности */
  id: string;
  /** Тип сущности (`PLAYER`, `ENEMY`, `NPC`, `ITEM`) */
  type: string;
  /** Имя (e.g., "Герой", "Хитрый Гоблин") */
  name: string;
  /** Координаты сущности */
  pos: Position;
  /** Данные для отображения */
  render: ServerToClientEntityRender;
  /** Характеристики сущности (опционально) */
  stats?: ServerToClientStatsView;
  /** Инвентарь (виден только владельцу) */
  inventory?: ServerToClientInventoryView;
  /** Экипировка (видна только владельцу) */
  equipment?: ServerToClientEquipmentView;
}

// ============================================================================
// Log Types
// ============================================================================

/**
 * Тип лога для стилизации
 */
export type ServerToClientLogType = "INFO" | "COMBAT" | "SPEECH" | "ERROR";

/**
 * Запись в игровом логе
 */
export interface ServerToClientLogEntry {
  /** Уникальный ID */
  id: string;
  /** Текст сообщения */
  text: string;
  /** Тип лога для стилизации */
  type: ServerToClientLogType;
  /** Время создания сообщения (Unix milliseconds) */
  timestamp: number;
}

// ============================================================================
// Main Update Message
// ============================================================================

/**
 * Основной контейнер ответа сервера
 *
 * Сервер отправляет клиенту единственный тип сообщения — `ServerToClientUpdate`,
 * который содержит полный снимок игрового состояния.
 */
export interface ServerToClientUpdate {
  /** Тип сообщения. На данный момент `"UPDATE"` или `"INIT"` */
  type: "UPDATE" | "INIT";
  /** Текущее глобальное время в игре */
  tick: number;
  /** ID сущности, которой управляет данный клиент */
  myEntityId: string;
  /**
   * ID сущности, чей ход сейчас.
   * Если `activeEntityId === myEntityId`, фронтенд должен разрешить игроку ввод.
   */
  activeEntityId: string;
  /** Объект с метаданными о размере карты */
  grid: ServerToClientGridMeta;
  /** Массив всех видимых и исследованных клиентом тайлов */
  map: ServerToClientTileView[];
  /** Массив всех видимых клиентом сущностей */
  entities: ServerToClientEntityView[];
  /** Массив новых игровых сообщений */
  logs: ServerToClientLogEntry[];
}

/**
 * Сообщение об ошибке от сервера
 */
export interface ServerToClientError {
  /** Тип сообщения */
  type: "ERROR";
  /** Текст ошибки */
  error: string;
  /** Код ошибки (опционально) */
  code?: string;
}

/**
 * Любое сообщение от сервера
 */
export type ServerToClientMessage = ServerToClientUpdate | ServerToClientError;
