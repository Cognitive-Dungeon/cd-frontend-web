import { useRef, useEffect, useCallback } from "react";

import {
  WebSocketService,
  WebSocketEvent,
  WebSocketConfig,
  MessageEventData,
  DisconnectedEventData,
  ReconnectAttemptEventData,
  ErrorEventData,
} from "../services";
import { ClientToServerCommand, LogType } from "../types";

interface UseWebSocketProps {
  onMessage: (data: any) => void;
  onConnectionChange: (isConnected: boolean) => void;
  onAuthenticationChange: (isAuthenticated: boolean) => void;
  onReconnectChange: (isReconnecting: boolean, attempt: number) => void;
  onLoginError: (error: string | null) => void;
  addLog: (text: string, type: LogType) => void;
  config?: WebSocketConfig;
}

/**
 * React Hook для управления WebSocket соединением
 *
 * Использует WebSocketService для всей логики работы с WebSocket.
 * Предоставляет простой интерфейс для отправки команд и получения событий.
 *
 * @example
 * ```typescript
 * const { sendCommand, isConnected } = useWebSocket({
 *   onMessage: handleServerMessage,
 *   onConnectionChange: setIsConnected,
 *   // ... остальные callbacks
 * });
 * ```
 */
export const useWebSocket = ({
  onMessage,
  onConnectionChange,
  onAuthenticationChange,
  onReconnectChange,
  onLoginError,
  addLog,
  config = {},
}: UseWebSocketProps) => {
  const serviceRef = useRef<WebSocketService | null>(null);

  // Store callbacks in refs to avoid recreation
  const onMessageRef = useRef(onMessage);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onAuthenticationChangeRef = useRef(onAuthenticationChange);
  const onReconnectChangeRef = useRef(onReconnectChange);
  const onLoginErrorRef = useRef(onLoginError);
  const addLogRef = useRef(addLog);

  // Keep refs up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  useEffect(() => {
    onAuthenticationChangeRef.current = onAuthenticationChange;
  }, [onAuthenticationChange]);

  useEffect(() => {
    onReconnectChangeRef.current = onReconnectChange;
  }, [onReconnectChange]);

  useEffect(() => {
    onLoginErrorRef.current = onLoginError;
  }, [onLoginError]);

  useEffect(() => {
    addLogRef.current = addLog;
  }, [addLog]);

  // Initialize WebSocketService and setup event listeners
  useEffect(() => {
    // Создаем сервис с конфигурацией
    const serviceConfig: WebSocketConfig = {
      maxReconnectAttempts: 10,
      reconnectDelay: 3000,
      autoReconnect: true,
      debug: false,
      ...config,
    };
    const service = new WebSocketService(serviceConfig);

    serviceRef.current = service;

    // Обработка события подключения
    service.on(WebSocketEvent.CONNECTED, () => {
      onConnectionChangeRef.current(true);
      onReconnectChangeRef.current(false, 0);
      onLoginErrorRef.current(null);
      addLogRef.current("Connected to server", LogType.INFO);
    });

    // Обработка события отключения
    service.on(WebSocketEvent.DISCONNECTED, (data: DisconnectedEventData) => {
      onConnectionChangeRef.current(false);
      addLogRef.current(
        `Disconnected from server (${data.code})`,
        LogType.INFO,
      );
    });

    // Обработка входящих сообщений
    service.on(WebSocketEvent.MESSAGE, (data: MessageEventData) => {
      try {
        const msg = data.data;

        // Handle error responses from server
        if (msg?.error) {
          addLogRef.current(`Server error: ${msg.error}`, LogType.ERROR);

          // If error during login (like "Entity not found"), reset authentication
          if (
            msg.error.includes("Entity not found") ||
            msg.error.includes("not found")
          ) {
            service.setAuthenticated(false);
            onLoginErrorRef.current(msg.error);
          }
        }

        // Pass message to handler
        onMessageRef.current(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        addLogRef.current(`Error processing message: ${error}`, LogType.ERROR);
      }
    });

    // Обработка попыток переподключения
    service.on(
      WebSocketEvent.RECONNECT_ATTEMPT,
      (data: ReconnectAttemptEventData) => {
        onReconnectChangeRef.current(true, data.attempt);
        addLogRef.current(
          `Reconnecting... (attempt ${data.attempt}/${data.maxAttempts})`,
          LogType.INFO,
        );
      },
    );

    // Обработка ошибок
    service.on(WebSocketEvent.ERROR, (data: ErrorEventData) => {
      console.error(`[WebSocket Error] ${data.type}:`, data.message);

      if (data.type === "connection") {
        addLogRef.current(`Connection error: ${data.message}`, LogType.ERROR);

        // Если превышено максимальное количество попыток
        if (data.message.includes("Maximum reconnection")) {
          onReconnectChangeRef.current(false, 0);
        }
      }
    });

    // Обработка изменения аутентификации
    service.on(WebSocketEvent.AUTH_CHANGE, (data) => {
      onAuthenticationChangeRef.current(data.isAuthenticated);
    });

    // Подключаемся к серверу
    service.connect();

    // Cleanup при размонтировании
    return () => {
      service.destroy();
      serviceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей - запускаем только один раз, config стабилен

  /**
   * Отправка команды на сервер
   *
   * @param command - Команда для отправки
   * @returns true если команда отправлена, false если нет подключения
   */
  const sendCommand = useCallback((command: ClientToServerCommand): boolean => {
    if (!serviceRef.current) {
      addLogRef.current("WebSocket service not initialized", LogType.ERROR);
      return false;
    }

    const result = serviceRef.current.send(command, {
      queue: true, // Добавлять в очередь, если не подключено
    });

    if (!result.success && !result.queued) {
      addLogRef.current(
        result.error || "Failed to send command",
        LogType.ERROR,
      );
      return false;
    }

    if (result.queued) {
      addLogRef.current(
        "Command queued (will be sent when connected)",
        LogType.INFO,
      );
    }

    return result.success || result.queued;
  }, []);

  /**
   * Проверка состояния подключения
   *
   * @returns true если подключено к серверу
   */
  const isConnected = useCallback((): boolean => {
    return serviceRef.current?.isConnected() ?? false;
  }, []);

  /**
   * Установка статуса аутентификации
   *
   * @param value - Статус аутентификации
   */
  const setAuthenticated = useCallback((value: boolean): void => {
    serviceRef.current?.setAuthenticated(value);
  }, []);

  /**
   * Получение метрик соединения
   *
   * @returns Метрики WebSocket соединения
   */
  const getMetrics = useCallback(() => {
    return serviceRef.current?.getMetrics();
  }, []);

  /**
   * Ручное переподключение
   */
  const reconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      setTimeout(() => {
        serviceRef.current?.connect();
      }, 100);
    }
  }, []);

  return {
    sendCommand,
    isConnected,
    setAuthenticated,
    getMetrics,
    reconnect,
  };
};
