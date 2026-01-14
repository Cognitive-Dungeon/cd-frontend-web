import {useCallback, useMemo} from "react";

import {
  CommandAction,
  CommandAttack,
  CommandDrop,
  CommandEquip,
  CommandHandlersMap,
  CommandInteract,
  CommandPayloadMap,
  CommandPickup,
  CommandTalk,
  CommandUnequip,
  CommandUse,
  CreateClientCommandFn,
  GameCommand,
  getCommandMetadata,
  LoginPayload,
} from "../commands";
import {
  ClientToServerCommand,
  ClientToServerCustomPayload,
  ClientToServerEntityTargetPayload,
  ClientToServerItemPayload,
  ClientToServerMovePayload,
  ClientToServerTextPayload,
  Entity,
  Item,
  LogType,
  Position,
} from "../types";

interface UseCommandSystemProps {
  player: Entity | null;
  activeEntityId: string | null;
  entityRegistry: Map<string, Entity>;
  sendCommand: (command: ClientToServerCommand) => boolean;
  addLog: (
    text: string,
    type: LogType,
    commandData?: { action: string; payload?: any },
    position?: Position,
    playerPosition?: Position,
  ) => void;
}

export const useCommandSystem = ({
  player,
  activeEntityId,
  entityRegistry,
  sendCommand: wsSendCommand,
  addLog,
}: UseCommandSystemProps) => {
  // Маппинг обработчиков команд с улучшенной типизацией
  const commandHandlers: CommandHandlersMap = useMemo(
    () => ({
      LOGIN: (p: LoginPayload): ClientToServerCommand | null =>
        p.token ? { action: "LOGIN", token: p.token } : null,

      MOVE: (p: ClientToServerMovePayload): ClientToServerCommand => ({
        action: "MOVE",
        payload: { dx: p.dx, dy: p.dy, x: p.x, y: p.y },
      }),

      ATTACK: (
        p: ClientToServerEntityTargetPayload,
      ): ClientToServerCommand | null =>
        p.targetId
          ? { action: "ATTACK", payload: { targetId: p.targetId } }
          : null,

      TALK: (
        p: ClientToServerEntityTargetPayload,
      ): ClientToServerCommand | null =>
        p.targetId
          ? { action: "TALK", payload: { targetId: p.targetId } }
          : null,

      INTERACT: (
        p: ClientToServerEntityTargetPayload,
      ): ClientToServerCommand | null =>
        p.targetId
          ? { action: "INTERACT", payload: { targetId: p.targetId } }
          : null,

      WAIT: (): ClientToServerCommand => ({
        action: "WAIT",
        payload: {},
      }),

      PICKUP: (p: ClientToServerItemPayload): ClientToServerCommand | null =>
        p.itemId ? { action: "PICKUP", payload: { itemId: p.itemId } } : null,

      DROP: (p: ClientToServerItemPayload): ClientToServerCommand | null =>
        p.itemId
          ? { action: "DROP", payload: { itemId: p.itemId, count: p.count } }
          : null,

      USE: (p: ClientToServerItemPayload): ClientToServerCommand | null =>
        p.itemId ? { action: "USE", payload: { itemId: p.itemId } } : null,

      EQUIP: (p: ClientToServerItemPayload): ClientToServerCommand | null =>
        p.itemId ? { action: "EQUIP", payload: { itemId: p.itemId } } : null,

      UNEQUIP: (p: ClientToServerItemPayload): ClientToServerCommand | null =>
        p.itemId ? { action: "UNEQUIP", payload: { itemId: p.itemId } } : null,

      CUSTOM: (p: ClientToServerCustomPayload): ClientToServerCommand => ({
        action: "CUSTOM",
        payload: p,
      }),

      SAY: (p: ClientToServerTextPayload): ClientToServerCommand => ({
        action: "SAY",
        payload: { text: p.text },
      }),

      WHISPER: (p: ClientToServerTextPayload): ClientToServerCommand => ({
        action: "WHISPER",
        payload: { text: p.text },
      }),

      YELL: (p: ClientToServerTextPayload): ClientToServerCommand => ({
        action: "YELL",
        payload: { text: p.text },
      }),
    }),
    [],
  );

  /**
   * Создает типизированную команду из action и payload
   *
   * Эта функция обеспечивает полную проверку типов на этапе компиляции:
   * TypeScript автоматически выводит тип payload из типа action.
   *
   * @example
   * ```typescript
   * // TypeScript знает, что для MOVE нужен ClientToServerMovePayload
   * createClientCommand("MOVE", { dx: 1, dy: 0 }); // ✅ OK
   * createClientCommand("MOVE", { targetId: "123" }); // ❌ Type error!
   *
   * // TypeScript знает, что для ATTACK нужен ClientToServerEntityTargetPayload
   * createClientCommand("ATTACK", { targetId: "123" }); // ✅ OK
   * createClientCommand("ATTACK", { dx: 1 }); // ❌ Type error!
   * ```
   */
  const createClientCommand: CreateClientCommandFn = useCallback(
    <T extends CommandAction>(
      action: T,
      payload: CommandPayloadMap[T],
    ): ClientToServerCommand | null => {
      const handler = commandHandlers[action];
      return handler ? handler(payload as any) : null;
    },
    [commandHandlers],
  );

  /**
   * Отправляет команду на сервер с валидацией и логированием
   *
   * Для полной типобезопасности используйте типизированные методы:
   * - handleMovePlayer() для MOVE
   * - handleLogin() для LOGIN
   * и т.д.
   */
  const sendCommand = useCallback(
    (action: string, payload?: any, description?: string) => {
      // Получаем метаданные команды для проверки доступности
      const metadata = getCommandMetadata(action as CommandAction);

      // Check if it's player's turn (except for non-gameplay commands)
      if (
        activeEntityId &&
        player &&
        activeEntityId !== player.id &&
        metadata &&
        !metadata.availableOutOfTurn
      ) {
        addLog("Сейчас не ваш ход — действие отклонено", LogType.INFO);
        return;
      }

      // Создаем типизированную команду
      const command = createClientCommand(
        action as CommandAction,
        payload ?? {},
      );
      if (!command) {
        addLog(`Неизвестная команда: ${action}`, LogType.ERROR);
        return;
      }

      // Отправляем через WebSocket
      const success = wsSendCommand(command);
      if (!success) {
        return;
      }

      // Если описание не передано, пытаемся найти команду и взять её описание
      let commandDescription = description;
      if (!commandDescription) {
        const commandMap: Record<string, GameCommand> = {
          ATTACK: CommandAttack,
          TALK: CommandTalk,
          INTERACT: CommandInteract,
          PICKUP: CommandPickup,
          DROP: CommandDrop,
          USE: CommandUse,
          EQUIP: CommandEquip,
          UNEQUIP: CommandUnequip,
        };
        const foundCommand = commandMap[action];
        if (foundCommand) {
          commandDescription = foundCommand.description;
        }
      }

      // Форматируем сообщение лога с поддержкой шаблонов
      let logMessage: string;

      if (commandDescription) {
        logMessage = commandDescription;

        // Замена {targetName} или {target} с кликабельной ссылкой
        if (payload?.targetId) {
          const targetEntity = entityRegistry.get(payload.targetId);
          const targetName = targetEntity
            ? targetEntity.name
            : `ID:${payload.targetId}`;
          const clickableTarget = `<span class="cursor-pointer text-cyan-400 hover:underline" data-entity-id="${payload.targetId}">${targetName}</span>`;
          logMessage = logMessage
            .replace(/\{targetName\}/g, clickableTarget)
            .replace(/\{target\}/g, clickableTarget);
        }

        // Замена {x} и {y}
        if (payload?.x !== undefined) {
          logMessage = logMessage.replace(/\{x\}/g, String(payload.x));
        }
        if (payload?.y !== undefined) {
          logMessage = logMessage.replace(/\{y\}/g, String(payload.y));
        }

        // Замена {position} с кликабельной ссылкой
        if (payload?.x !== undefined && payload?.y !== undefined) {
          const clickablePosition = `<span class="cursor-pointer text-orange-400 hover:underline" data-position-x="${payload.x}" data-position-y="${payload.y}">(${payload.x}, ${payload.y})</span>`;
          logMessage = logMessage.replace(/\{position\}/g, clickablePosition);
        }

        // Замена {text} для речевых команд
        if (payload?.text !== undefined) {
          logMessage = logMessage.replace(/\{text\}/g, String(payload.text));
        }

        // Замена {name} для предметов
        if (payload?.name !== undefined) {
          logMessage = logMessage.replace(/\{name\}/g, String(payload.name));
        }
      } else if (payload?.targetId) {
        const targetEntity = entityRegistry.get(payload.targetId);
        const targetName = targetEntity
          ? targetEntity.name
          : `ID:${payload.targetId}`;
        logMessage = `Вы выполнили ${action} на ${targetName}`;
      } else if (payload?.x !== undefined && payload?.y !== undefined) {
        logMessage = `Вы выполнили ${action} на позицию (${payload.x}, ${payload.y})`;
      } else {
        logMessage = `Вы выполнили ${action}`;
      }

      // Определяем позицию события для лога
      let logPosition: Position | undefined;
      if (payload?.targetId) {
        const targetEntity = entityRegistry.get(payload.targetId);
        if (targetEntity) {
          logPosition = { x: targetEntity.pos.x, y: targetEntity.pos.y };
        }
      } else if (payload?.x !== undefined && payload?.y !== undefined) {
        logPosition = { x: payload.x, y: payload.y };
      }

      // Позиция игрока в момент команды
      const playerPosition = player
        ? { x: player.pos.x, y: player.pos.y }
        : undefined;

      // Сохраняем полные данные команды для отображения JSON
      addLog(
        logMessage,
        LogType.COMMAND,
        { action, payload },
        logPosition,
        playerPosition,
      );
    },
    [
      createClientCommand,
      entityRegistry,
      player,
      activeEntityId,
      addLog,
      wsSendCommand,
    ],
  );

  /**
   * Отправляет текстовую команду (речь)
   */
  const sendTextCommand = useCallback(
    (text: string, type: "SAY" | "WHISPER" | "YELL" = "SAY") => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      sendCommand(type, { text: trimmed });
    },
    [sendCommand],
  );

  /**
   * Обрабатывает использование предмета
   */
  const handleUseItem = useCallback(
    (item: Item) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      sendCommand("USE", { itemId: item.id }, `использовали ${item.name}`);
    },
    [player, activeEntityId, sendCommand, addLog],
  );

  /**
   * Обрабатывает выброс предмета
   */
  const handleDropItem = useCallback(
    (item: Item) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      sendCommand("DROP", { itemId: item.id }, `бросили ${item.name}`);
    },
    [player, activeEntityId, sendCommand, addLog],
  );

  /**
   * Обрабатывает подбор предмета
   */
  const handlePickupItem = useCallback(
    (item: Item) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      sendCommand("PICKUP", { itemId: item.id }, `подобрали ${item.name}`);
    },
    [player, activeEntityId, sendCommand, addLog],
  );

  /**
   * Обрабатывает экипировку предмета
   */
  const handleEquipItem = useCallback(
    (item: Item) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      sendCommand("EQUIP", { itemId: item.id }, `надели ${item.name}`);
    },
    [player, activeEntityId, sendCommand, addLog],
  );

  /**
   * Обрабатывает снятие экипировки
   */
  const handleUnequipItem = useCallback(
    (item: Item) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      sendCommand("UNEQUIP", { itemId: item.id }, `сняли ${item.name}`);
    },
    [player, activeEntityId, sendCommand, addLog],
  );

  /**
   * Обрабатывает вход в игру
   */
  const handleLogin = useCallback(
    (entityId: string) => {
      sendCommand("LOGIN", { token: entityId }, `Авторизация как ${entityId}`);
      addLog(`Отправлен запрос на авторизацию: ${entityId}`, LogType.INFO);
    },
    [sendCommand, addLog],
  );

  /**
   * Обрабатывает перемещение игрока
   */
  const handleMovePlayer = useCallback(
    (x: number, y: number) => {
      if (!player) {
        return;
      }

      if (activeEntityId && activeEntityId !== player.id) {
        addLog("Не ваш ход!", LogType.ERROR);
        return;
      }

      const dx = x - player.pos.x;
      const dy = y - player.pos.y;

      sendCommand("MOVE", { dx, dy }, `переместились на (${x}, ${y})`);
    },
    [player, sendCommand, activeEntityId, addLog],
  );

  return {
    sendCommand,
    sendTextCommand,
    handleUseItem,
    handleDropItem,
    handlePickupItem,
    handleEquipItem,
    handleUnequipItem,
    handleLogin,
    handleMovePlayer,
  };
};
