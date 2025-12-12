export interface ServerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  isDefault?: boolean;
  addedAt: number;
}

export interface ServerStatus {
  serverId: string;
  isAvailable: boolean;
  latency?: number;
  lastChecked: number;
  error?: string;
}

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

export class ServerManager {
  private static STORAGE_KEY = "cd_servers";
  private static STATUS_CACHE_KEY = "cd_server_status";
  private static CACHE_DURATION = 30000; // 30 seconds

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

  static saveServers(servers: ServerInfo[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error("Failed to save servers:", error);
    }
  }

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

  static removeServer(serverId: string): void {
    const servers = this.getServers();
    const filtered = servers.filter((s) => s.id !== serverId && !s.isDefault);
    this.saveServers(filtered);
  }

  static updateServer(serverId: string, updates: Partial<ServerInfo>): void {
    const servers = this.getServers();
    const index = servers.findIndex((s) => s.id === serverId);
    if (index !== -1) {
      servers[index] = { ...servers[index], ...updates };
      this.saveServers(servers);
    }
  }

  static getServerUrl(server: ServerInfo): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${server.host}:${server.port}/ws`;
  }

  static async checkServerAvailability(
    server: ServerInfo,
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

      return {
        serverId: server.id,
        isAvailable: true,
        latency,
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        serverId: server.id,
        isAvailable: false,
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static getCachedStatus(serverId: string): ServerStatus | null {
    try {
      const cached = localStorage.getItem(
        `${this.STATUS_CACHE_KEY}_${serverId}`,
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

  static cacheStatus(status: ServerStatus): void {
    try {
      localStorage.setItem(
        `${this.STATUS_CACHE_KEY}_${status.serverId}`,
        JSON.stringify(status),
      );
    } catch (error) {
      console.error("Failed to cache status:", error);
    }
  }

  static getSelectedServerId(): string | null {
    try {
      return localStorage.getItem("cd_selected_server");
    } catch (error) {
      return null;
    }
  }

  static setSelectedServerId(serverId: string): void {
    try {
      localStorage.setItem("cd_selected_server", serverId);
    } catch (error) {
      console.error("Failed to save selected server:", error);
    }
  }

  static clearSelectedServer(): void {
    try {
      localStorage.removeItem("cd_selected_server");
    } catch (error) {
      console.error("Failed to clear selected server:", error);
    }
  }
}
