# @cd/network

Сетевой модуль для Cognitive Dungeon - изолированный пакет для управления WebSocket соединениями и серверами.

## Описание

Этот пакет предоставляет все необходимое для работы с сетевым слоем приложения:

- **WebSocketService** - управление WebSocket соединением с автоматическим переподключением
- **ServerManager** - управление списком игровых серверов
- **Protocol Types** - типизация команд клиент-сервер
- **Internal Modules** - модульные компоненты (MessageQueue, HeartbeatManager, и др.)

## Установка

Пакет является частью monorepo и используется через workspace:

```typescript
import { WebSocketService, ServerManager } from '@cd/network';
```

## Использование

### WebSocketService

```typescript
import { WebSocketService, WebSocketEvent, WebSocketConfig } from '@cd/network';

// Создание сервиса с конфигурацией
const config: WebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  autoReconnect: true,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  debug: true
};

const wsService = new WebSocketService(config);

// Подписка на события
wsService.on(WebSocketEvent.CONNECTED, (data) => {
  console.log('Connected!', data);
});

wsService.on(WebSocketEvent.MESSAGE, (data) => {
  console.log('Message received:', data.data);
});

wsService.on(WebSocketEvent.DISCONNECTED, (data) => {
  console.log('Disconnected:', data.reason);
});

// Подключение
await wsService.connect();

// Отправка команды
const command = {
  action: 'MOVE',
  payload: { dx: 1, dy: 0 }
};

wsService.send(command, { queue: true });

// Отключение
wsService.disconnect();
```

### ServerManager

```typescript
import { ServerManager, ServerInfo } from '@cd/network';

// Получение списка серверов
const servers = ServerManager.getServers();

// Добавление нового сервера
const newServer = ServerManager.addServer({
  name: 'My Server',
  host: 'game.example.com',
  port: 8080
});

// Проверка доступности
const status = await ServerManager.checkServerAvailability(newServer);
console.log(`Server available: ${status.isAvailable}`);
console.log(`Latency: ${status.latency}ms`);

// Выбор сервера
ServerManager.setSelectedServerId(newServer.id);

// Получение WebSocket URL
const wsUrl = ServerManager.getServerUrl(newServer);
```

### React Hook Example

```typescript
import { useRef, useEffect } from 'react';
import { WebSocketService, WebSocketEvent } from '@cd/network';

function useWebSocket(onMessage: (data: any) => void) {
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const ws = new WebSocketService({
      url: 'ws://localhost:8080/ws',
      autoReconnect: true
    });

    ws.on(WebSocketEvent.MESSAGE, (data) => {
      onMessage(data.data);
    });

    ws.connect();
    wsRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, [onMessage]);

  return wsRef.current;
}
```

## API Reference

### WebSocketService

#### Constructor

```typescript
new WebSocketService(config?: WebSocketConfig)
```

#### Методы

- `connect(): Promise<void>` - Установить соединение
- `disconnect(): void` - Закрыть соединение
- `send(command, options?): SendResult` - Отправить команду
- `login(token): Promise<void>` - Аутентификация
- `on(event, listener)` - Подписаться на событие
- `off(event, listener)` - Отписаться от события
- `getState(): WebSocketState` - Получить текущее состояние
- `isConnected(): boolean` - Проверить подключение
- `isAuthenticated(): boolean` - Проверить аутентификацию
- `getMetrics(): WebSocketMetrics` - Получить метрики

#### События

- `CONNECTED` - Соединение установлено
- `DISCONNECTED` - Соединение закрыто
- `MESSAGE` - Получено сообщение
- `ERROR` - Произошла ошибка
- `RECONNECT_ATTEMPT` - Попытка переподключения
- `STATE_CHANGE` - Изменилось состояние
- `MESSAGE_SENT` - Сообщение отправлено
- `AUTH_CHANGE` - Изменился статус аутентификации

### ServerManager

#### Статические методы

- `getServers(): ServerInfo[]` - Получить список серверов
- `addServer(server): ServerInfo` - Добавить сервер
- `removeServer(serverId)` - Удалить сервер
- `updateServer(serverId, updates)` - Обновить сервер
- `getServerUrl(server): string` - Получить WebSocket URL
- `checkServerAvailability(server): Promise<ServerStatus>` - Проверить доступность
- `getSelectedServerId(): string | null` - Получить ID выбранного сервера
- `setSelectedServerId(serverId)` - Установить выбранный сервер
- `getSelectedServer(): ServerInfo | null` - Получить выбранный сервер

## Типы

### WebSocketConfig

```typescript
interface WebSocketConfig {
  url?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectDelayMultiplier?: number;
  connectionTimeout?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  autoReconnect?: boolean;
  maxQueueSize?: number;
  debug?: boolean;
}
```

### ClientToServerCommand

```typescript
type ClientToServerCommand =
  | { action: "LOGIN"; token: string }
  | { action: "MOVE"; payload: { dx?: number; dy?: number; x?: number; y?: number } }
  | { action: "ATTACK" | "TALK" | "INTERACT"; payload: { targetId: string } }
  | { action: "WAIT"; payload?: {} }
  | { action: "PICKUP" | "DROP" | "USE"; payload: { itemId: string; count?: number } }
  | { action: "CUSTOM"; payload: Record<string, any> };
```

### ServerInfo

```typescript
interface ServerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  isDefault?: boolean;
  addedAt: number;
}
```

## Архитектура

Пакет использует модульную архитектуру с разделением ответственности:

```
@cd/network/
├── WebSocketService      # Главный сервис (facade)
├── ServerManager         # Управление серверами
├── protocol             # Типы протокола
└── websocket/           # Внутренние модули
    ├── MessageQueue     # Очередь сообщений
    ├── ConnectionMetrics # Сбор метрик
    ├── HeartbeatManager # Heartbeat пинги
    └── ReconnectionManager # Переподключение
```

## Особенности

✅ **Автоматическое переподключение** с экспоненциальной задержкой  
✅ **Очередь сообщений** для отправки при восстановлении соединения  
✅ **Heartbeat мониторинг** для обнаружения разрывов  
✅ **Метрики соединения** (RTT, потерянные сообщения, uptime)  
✅ **Типобезопасность** для всех команд и событий  
✅ **Event-driven API** для реактивной интеграции  
✅ **Управление серверами** с проверкой доступности и кешированием  

## Зависимости

Пакет не имеет внешних зависимостей и использует только нативные Web APIs:
- WebSocket API
- LocalStorage API

## Разработка

```bash
# Установка зависимостей
npm install

# Линтинг
npm run lint

# Проверка типов
npx tsc --noEmit
```

## Лицензия

Private package - часть проекта Cognitive Dungeon.