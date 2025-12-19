# Types Structure

Документация по организации типов в проекте.

## Структура папок

```
types/
├── protocol/           # Типы протокола клиент-сервер
│   ├── common.ts       # Общие типы (Position)
│   ├── client-to-server.ts  # Команды Client → Server
│   └── server-to-client.ts  # Сообщения Server → Client
│
├── game/               # Типы игровых сущностей
│   ├── entity.ts       # Entity, EntityType, Stats
│   ├── item.ts         # Item, ItemType, ItemAction
│   ├── world.ts        # GameWorld, Tile, TileEnv
│   └── log.ts          # LogMessage, LogType, GameState
│
├── ui/                 # Типы UI компонентов
│   ├── context-menu.ts # ContextMenuData
│   └── speech-bubble.ts # SpeechBubble
│
└── commands.ts         # Типизация командной системы (legacy)
```

## Правила организации

### 1. Где размещать новые типы

| Тип данных | Папка | Пример |
|------------|-------|--------|
| Протокол сервера | `protocol/` | Новый payload, новый тип сообщения |
| Игровые сущности | `game/` | Новый тип врага, новый эффект |
| UI компоненты | `ui/` | Модальные окна, тултипы |

### 2. Именование

- **Интерфейсы**: PascalCase, существительные — `Entity`, `GameWorld`
- **Enums**: PascalCase — `EntityType`, `LogType`
- **Type aliases**: PascalCase — `TileEnv`, `NpcType`
- **Протокол Server→Client**: префикс `ServerToClient` — `ServerToClientUpdate`
- **Протокол Client→Server**: префикс `ClientToServer` — `ClientToServerCommand`

### 3. Документирование

Каждый тип должен иметь JSDoc комментарий:

```typescript
/**
 * Краткое описание типа
 *
 * Дополнительные детали при необходимости.
 */
export interface MyType {
  /** Описание поля */
  field: string;
}
```

### 4. Экспорты

- Каждая папка имеет `index.ts` (barrel export)
- Типы экспортируются через `export type { ... }`
- Enums и функции экспортируются через `export { ... }`
- Главный `types.ts` в корне реэкспортирует всё для обратной совместимости

### 5. Избегание циклических зависимостей

- В `index.ts` сначала экспортируй типы без зависимостей
- Используй `import type` где возможно
- Если A зависит от B, экспортируй B раньше A

## Импорты

### Рекомендуемый способ (из корневого types.ts)

```typescript
import { Entity, Position, LogType } from "../types";
```

### Прямой импорт (для изоляции)

```typescript
import type { Position } from "../types/protocol/common";
import type { Entity } from "../types/game/entity";
```

## Протокол

Типы протокола соответствуют документации:
https://github.com/Cognitive-Dungeon/cd-techdoc

При изменении протокола:
1. Обнови соответствующий файл в `protocol/`
2. Проверь, что `types.ts` реэкспортирует новые типы
3. Обнови эту документацию при необходимости