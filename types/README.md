# Types Structure

Документация по организации типов в проекте.

## Структура папок

```
types/
├── protocol/           # Типы протокола клиент-сервер
│   └── index.ts        # Реэкспорт всех типов из @cd/agent-sdk
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
└── index.ts            # Barrel export всех типов
```

## Правила организации

### 1. Где размещать новые типы

| Тип данных | Место | Действие |
|------------|-------|----------|
| Протокол сервера | `@cd/agent-sdk` | Обновить SDK, затем `npm update` |
| Игровые сущности (UI) | `types/game/` | Добавить локально |
| UI компоненты | `types/ui/` | Добавить локально |

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

### Прямой импорт протокола (из SDK)

```typescript
import type { Position, ServerToClientUpdate } from "@cd/agent-sdk";
```

### Прямой импорт игровых типов

```typescript
import type { Entity } from "../types/game/entity";
```

## Изменение протокола

Типы протокола находятся в пакете `@cd/agent-sdk` и соответствуют документации:
https://github.com/Cognitive-Dungeon/cd-techdoc

При изменении протокола:

1. Обнови файл `src/protocol.ts` в репозитории `cd-agent-sdk-ts`
2. Обнови `src/index.ts` для экспорта новых типов
3. Собери SDK: `npm run build`
4. Обнови SDK во фронтенде: `npm update @cd/agent-sdk`
5. Проверь, что импорты работают: `npm run build`
