/**
 * Commands - Key Binding Manager
 *
 * Управление привязками клавиш к игровым командам.
 * Поддерживает кастомизацию, сохранение в localStorage, сброс к дефолтным.
 */

import {
    CommandAttack,
    CommandCastArea,
    CommandDown,
    CommandInspect,
    CommandLeft,
    CommandPickup,
    CommandRight,
    CommandTalk,
    CommandTeleport,
    CommandTrade,
    CommandUp,
} from "./definitions";
import {GameCommand, KeyBinding} from "./types";

// ============================================================================
// Default Key Bindings
// ============================================================================

/**
 * Конфигурация привязок клавиш по умолчанию
 *
 * Поддерживает:
 * - WASD движение
 * - Движение стрелками
 * - Основные roguelike действия
 *
 * Может быть переопределена загрузкой из localStorage или настроек пользователя
 */
export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  // WASD Movement (using KeyboardEvent.code for layout independence)
  { code: "KeyW", command: CommandUp },
  { code: "KeyA", command: CommandLeft },
  { code: "KeyS", command: CommandDown },
  { code: "KeyD", command: CommandRight },

  // Arrow Keys Movement
  { code: "ArrowUp", command: CommandUp },
  { code: "ArrowLeft", command: CommandLeft },
  { code: "ArrowDown", command: CommandDown },
  { code: "ArrowRight", command: CommandRight },

  // Entity Target Commands
  { code: "KeyF", command: CommandAttack },
  { code: "KeyT", command: CommandTalk },
  { code: "KeyE", command: CommandInspect },
  { code: "KeyG", command: CommandPickup },
  { code: "KeyR", command: CommandTrade },

  // Position Target Commands
  { code: "KeyV", command: CommandTeleport },
  { code: "KeyC", command: CommandCastArea },
];

// ============================================================================
// Key Binding Manager
// ============================================================================

/**
 * Ключ для сохранения привязок в localStorage
 */
const LOCAL_STORAGE_KEY = "keyBindings";

/**
 * Управляет привязками клавиш и маппингом команд
 *
 * Функции:
 * - Поиск команд по нажатию клавиши
 * - Динамическое обновление/удаление привязок
 * - Сохранение настроек в localStorage
 * - Поддержка UI настроек
 *
 * @example
 * ```typescript
 * const manager = new KeyBindingManager();
 * const command = manager.getCommand('KeyW'); // Returns CommandUp
 * manager.setBinding('KeyQ', CommandWait); // Rebind Q to wait
 * manager.saveToLocalStorage(); // Persist changes
 * ```
 */
export class KeyBindingManager {
  private bindings: Map<string, GameCommand>;

  constructor(bindingList: KeyBinding[] = DEFAULT_KEY_BINDINGS) {
    this.bindings = new Map();
    this.loadBindings(bindingList);
  }

  /**
   * Загружает привязки из списка во внутренний Map
   */
  private loadBindings(bindingList: KeyBinding[]): void {
    bindingList.forEach((binding) => {
      this.bindings.set(binding.code, binding.command);
    });
  }

  /**
   * Получает команду, связанную с нажатием клавиши
   *
   * @param code - Код клавиши (e.g., "KeyW", "ArrowUp")
   * @returns Связанная команда или undefined если не привязана
   */
  getCommand(code: string): GameCommand | undefined {
    return this.bindings.get(code);
  }

  /**
   * Проверяет, привязана ли клавиша
   *
   * @param code - Код клавиши для проверки
   * @returns true если клавиша имеет привязку
   */
  hasBinding(code: string): boolean {
    return this.bindings.has(code);
  }

  /**
   * Обновляет или создаёт привязку клавиши
   *
   * @param code - Код клавиши для привязки
   * @param command - Команда для выполнения
   */
  setBinding(code: string, command: GameCommand): void {
    this.bindings.set(code, command);
  }

  /**
   * Удаляет привязку клавиши
   *
   * @param code - Код клавиши для отвязки
   */
  removeBinding(code: string): void {
    this.bindings.delete(code);
  }

  /**
   * Получает все текущие привязки как Map
   *
   * @returns Копия карты привязок (для UI настроек)
   */
  getAllBindings(): Map<string, GameCommand> {
    return new Map(this.bindings);
  }

  /**
   * Получает все привязки в формате для UI настроек
   *
   * @returns Массив привязок с кодом, типом действия и названием
   */
  getAllBindingsForUI(): Array<{
    code: string;
    action: string;
    label: string;
  }> {
    const result: Array<{ code: string; action: string; label: string }> = [];
    this.bindings.forEach((command, code) => {
      result.push({
        code,
        action: command.action,
        label: command.label || command.action,
      });
    });
    return result.sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Получает все клавиши, привязанные к определённому действию
   *
   * @param action - Тип действия для поиска
   * @returns Массив кодов клавиш
   */
  getBindingsForAction(action: string): string[] {
    const codes: string[] = [];
    this.bindings.forEach((command, code) => {
      if (command.action === action) {
        codes.push(code);
      }
    });
    return codes;
  }

  /**
   * Находит клавишу, привязанную к определённой команде
   *
   * @param targetCommand - Команда для поиска
   * @returns Код клавиши или undefined
   */
  findBindingForCommand(targetCommand: GameCommand): string | undefined {
    for (const [code, command] of this.bindings) {
      if (
        command.action === targetCommand.action &&
        JSON.stringify(command.payload) ===
          JSON.stringify(targetCommand.payload)
      ) {
        return code;
      }
    }
    return undefined;
  }

  /**
   * Сохраняет текущие привязки в браузерный localStorage
   * Позволяет сохранить настройки между сессиями
   */
  saveToLocalStorage(): void {
    const bindingsArray = Array.from(this.bindings.entries()).map(
      ([code, command]) => ({ code, command }),
    );
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bindingsArray));
    } catch (error) {
      console.error("Failed to save key bindings to localStorage:", error);
    }
  }

  /**
   * Загружает привязки из браузерного localStorage
   * Если сохранённых привязок нет, текущие остаются без изменений
   */
  loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const bindingsArray = JSON.parse(saved);
        this.bindings.clear();
        bindingsArray.forEach(
          ({ code, command }: { code: string; command: GameCommand }) => {
            this.bindings.set(code, command);
          },
        );
      }
    } catch (error) {
      console.error("Failed to load key bindings from localStorage:", error);
    }
  }

  /**
   * Сбрасывает привязки к конфигурации по умолчанию
   * Очищает текущие привязки и загружает дефолтные
   */
  resetToDefaults(): void {
    this.bindings.clear();
    this.loadBindings(DEFAULT_KEY_BINDINGS);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove key bindings from localStorage:", error);
    }
  }

  /**
   * Возвращает количество текущих привязок
   */
  get size(): number {
    return this.bindings.size;
  }

  /**
   * Очищает все привязки
   */
  clear(): void {
    this.bindings.clear();
  }

  /**
   * Импортирует привязки из JSON строки
   *
   * @param json - JSON строка с массивом привязок
   * @returns true если импорт успешен
   */
  importFromJSON(json: string): boolean {
    try {
      const bindingsArray = JSON.parse(json) as Array<{
        code: string;
        command: GameCommand;
      }>;
      this.bindings.clear();
      bindingsArray.forEach(({ code, command }) => {
        this.bindings.set(code, command);
      });
      return true;
    } catch (error) {
      console.error("Failed to import key bindings from JSON:", error);
      return false;
    }
  }

  /**
   * Экспортирует привязки в JSON строку
   *
   * @returns JSON строка с массивом привязок
   */
  exportToJSON(): string {
    const bindingsArray = Array.from(this.bindings.entries()).map(
      ([code, command]) => ({ code, command }),
    );
    return JSON.stringify(bindingsArray, null, 2);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Глобальный экземпляр KeyBindingManager
 * Используйте для доступа к привязкам из любого места приложения
 */
let globalKeyBindingManager: KeyBindingManager | null = null;

/**
 * Получает глобальный экземпляр KeyBindingManager
 * Создаёт новый при первом вызове
 */
export function getKeyBindingManager(): KeyBindingManager {
  if (!globalKeyBindingManager) {
    globalKeyBindingManager = new KeyBindingManager();
  }
  return globalKeyBindingManager;
}

/**
 * Сбрасывает глобальный экземпляр KeyBindingManager
 * Полезно для тестирования
 */
export function resetKeyBindingManager(): void {
  globalKeyBindingManager = null;
}
