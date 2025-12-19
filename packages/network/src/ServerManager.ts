/**
 * ServerManager - Управление игровыми серверами
 *
 * Этот сервис отвечает за:
 * - Хранение списка серверов в localStorage
 * - Проверку доступности серверов
 * - Кэширование статуса серверов
 * - Управление выбранным сервером
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Информация о сервере
 */
export interface ServerInfo {
  /** Уникальный идентификатор сервера */
  id: string;
  /** Отображаемое имя сервера */
  name: string;
  /** Хост сервера */
  host: string;
  /** Порт сервера */
  port: number;
  /** Является ли сервер дефолтным (нельзя удалить) */
  isDefault?: boolean;
  /** Время добавления сервера */
  addedAt: number;
}

/**
 * Статус доступности сервера
 */
export interface ServerStatus {
  /** ID сервера */
  serverId: string;
  /** Доступен ли сервер */
  isAvailable: boolean;
  /** Задержка соединения (мс) */
  latency?: number;
  /** Время последней проверки */
  lastChecked: number;
  /** Текст ошибки (если недоступен) */
  error?: string;
}

// ============================================================================
// Default Servers
// ============================================================================

/**
 * Список серверов по умолчанию
 */
export const DEFAULT_SERVERS: ServerInfo[] = [
  {
    id: "local",
    name: "Local Server",
    host: "localhost",
    port: 8080,
    isDefault: true,
    addedAt: Date.now(),
  },
];

// ============================================================================
// ServerManager Class
// ============================================================================

/**
 * Менеджер серверов
 *
 * Управляет списком игровых серверов, проверяет их доступность
 * и сохраняет настройки в localStorage.
 *
 * @example
 * ```typescript
 * // Получить список серверов
 * const servers = ServerManager.getServers();
 *
 * // Добавить новый сервер
 * const newServer = ServerManager.addServer({
 *   name: "My Server",
 *   host: "192.168.1.100",
 *   port: 8080
 * });
 *
 * // Проверить доступность
 * const status = await ServerManager.checkServerAvailability(newServer);
 * ```
 */
export class ServerManager {
  private static STORAGE_KEY = "cd_servers";
  private static STATUS_CACHE_KEY = "cd_server_status";
  private static SELECTED_SERVER_KEY = "cd_selected_server";
  private static CACHE_DURATION = 30000; // 30 seconds

  // ============================================================================
  // Server CRUD Operations
  // ============================================================================

  /**
   * Получить список всех серверов
   *
   * @returns Массив серверов из localStorage или дефолтные серверы
   */
  static getServers(): ServerInfo[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const servers = JSON.parse(stored) as ServerInfo[];
        return servers;
      }
    } catch (error) {
      console.error("Failed to load servers:", error);
    }
    return [...DEFAULT_SERVERS];
  }

  /**
   * Сохранить список серверов
   *
   * @param servers - Массив серверов для сохранения
   */
  static saveServers(servers: ServerInfo[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error("Failed to save servers:", error);
    }
  }

  /**
   * Добавить новый сервер
   *
   * @param server - Данные сервера (без id и addedAt)
   * @returns Созданный сервер с генерированным id
   */
  static addServer(server: Omit<ServerInfo, "id" | "addedAt">): ServerInfo {
    const servers = this.getServers();
    const newServer: ServerInfo = {
      ...server,
      id: `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: Date.now(),
    };
    servers.push(newServer);
    this.saveServers(servers);
    return newServer;
  }

  /**
   * Удалить сервер
   *
   * @param serverId - ID сервера для удаления
   * @note Дефолтные серверы не могут быть удалены
   */
  static removeServer(serverId: string): void {
    const servers = this.getServers();
    const filtered = servers.filter((s) => s.id !== serverId && !s.isDefault);
    this.saveServers(filtered);
  }

  /**
   * Обновить данные сервера
   *
   * @param serverId - ID сервера для обновления
   * @param updates - Частичные обновления
   */
  static updateServer(serverId: string, updates: Partial<ServerInfo>): void {
    const servers = this.getServers();
    const index = servers.findIndex((s) => s.id === serverId);
    if (index !== -1) {
      servers[index] = { ...servers[index], ...updates };
      this.saveServers(servers);
    }
  }

  // ============================================================================
  // Server URL
  // ============================================================================

  /**
   * Получить WebSocket URL для сервера
   *
   * @param server - Информация о сервере
   * @returns WebSocket URL (ws:// или wss://)
   */
  static getServerUrl(server: ServerInfo): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${server.host}:${server.port}/ws`;
  }

  // ============================================================================
  // Availability Check
  // ============================================================================

  /**
   * Проверить доступность сервера
   *
   * Пытается установить WebSocket соединение и измеряет latency.
   *
   * @param server - Информация о сервере
   * @returns Статус доступности
   */
  static async checkServerAvailability(
    server: ServerInfo
  ): Promise<ServerStatus> {
    const startTime = Date.now();
    const url = this.getServerUrl(server);

    try {
      // Try to establish WebSocket connection
      const ws = await new Promise<WebSocket>((resolve, reject) => {
        const socket = new WebSocket(url);
        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error("Connection timeout"));
        }, 5000);

        socket.onopen = () => {
          clearTimeout(timeout);
          resolve(socket);
        };

        socket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Connection failed"));
        };
      });

      const latency = Date.now() - startTime;
      ws.close();

      const status: ServerStatus = {
        serverId: server.id,
        isAvailable: true,
        latency,
        lastChecked: Date.now(),
      };

      this.cacheStatus(status);
      return status;
    } catch (error) {
      const status: ServerStatus = {
        serverId: server.id,
        isAvailable: false,
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      this.cacheStatus(status);
      return status;
    }
  }

  // ============================================================================
  // Status Cache
  // ============================================================================

  /**
   * Получить закэшированный статус сервера
   *
   * @param serverId - ID сервера
   * @returns Статус или null если кэш устарел/отсутствует
   */
  static getCachedStatus(serverId: string): ServerStatus | null {
    try {
      const cached = localStorage.getItem(
        `${this.STATUS_CACHE_KEY}_${serverId}`
      );
      if (cached) {
        const status = JSON.parse(cached) as ServerStatus;
        // Check if cache is still valid
        if (Date.now() - status.lastChecked < this.CACHE_DURATION) {
          return status;
        }
      }
    } catch (error) {
      console.error("Failed to load cached status:", error);
    }
    return null;
  }

  /**
   * Сохранить статус в кэш
   *
   * @param status - Статус сервера
   */
  static cacheStatus(status: ServerStatus): void {
    try {
      localStorage.setItem(
        `${this.STATUS_CACHE_KEY}_${status.serverId}`,
        JSON.stringify(status)
      );
    } catch (error) {
      console.error("Failed to cache status:", error);
    }
  }

  // ============================================================================
  // Selected Server
  // ============================================================================

  /**
   * Получить ID выбранного сервера
   *
   * @returns ID сервера или null
   */
  static getSelectedServerId(): string | null {
    try {
      return localStorage.getItem(this.SELECTED_SERVER_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Установить выбранный сервер
   *
   * @param serverId - ID сервера
   */
  static setSelectedServerId(serverId: string): void {
    try {
      localStorage.setItem(this.SELECTED_SERVER_KEY, serverId);
    } catch (error) {
      console.error("Failed to save selected server:", error);
    }
  }

  /**
   * Очистить выбранный сервер
   */
  static clearSelectedServer(): void {
    try {
      localStorage.removeItem(this.SELECTED_SERVER_KEY);
    } catch (error) {
      console.error("Failed to clear selected server:", error);
    }
  }

  /**
   * Получить выбранный сервер
   *
   * @returns Информация о выбранном сервере или null
   */
  static getSelectedServer(): ServerInfo | null {
    const serverId = this.getSelectedServerId();
    if (!serverId) {
      return null;
    }

    const servers = this.getServers();
    return servers.find((s) => s.id === serverId) || null;
  }
}
