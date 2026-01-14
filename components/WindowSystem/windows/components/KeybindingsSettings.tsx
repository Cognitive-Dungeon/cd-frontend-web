import {Plus, Trash2} from "lucide-react";
import {FC, useEffect, useState} from "react";

import {
  CommandAttack,
  CommandCastArea,
  CommandCustom,
  CommandDown,
  CommandInspect,
  CommandLeft,
  CommandPickup,
  CommandRight,
  CommandTalk,
  CommandTeleport,
  CommandTrade,
  CommandUp,
  GameCommand,
  KeyBindingManager,
} from "../../../../commands";

interface KeybindingsSettingsProps {
  keyBindingManager: KeyBindingManager;
  resetWindowLayout: () => Promise<void>;
  onOpenCasino: () => void;
  splashNotificationsEnabled: boolean;
  onToggleSplashNotifications: (enabled: boolean) => void;
}

interface KeyBindingRow {
  id: string;
  code: string;
  command: GameCommand | null;
  isEditing: boolean;
}

// Список доступных команд для выбора
const AVAILABLE_COMMANDS: GameCommand[] = [
  CommandUp,
  CommandDown,
  CommandLeft,
  CommandRight,
  CommandAttack,
  CommandTalk,
  CommandInspect,
  CommandPickup,
  CommandTrade,
  CommandTeleport,
  CommandCastArea,
  CommandCustom,
  // TODO: Добавить возможность перетащить из инвентаря сущность и назначить
];

// Функция для сравнения команд (учитывает action и payload)
const commandsEqual = (
  cmd1: GameCommand | null,
  cmd2: GameCommand,
): boolean => {
  if (!cmd1) {
    return false;
  }
  if (cmd1.action !== cmd2.action) {
    return false;
  }
  // Для кастомных команд не сравниваем, так как каждая уникальна
  if (cmd1.action === "CUSTOM" || cmd2.action === "CUSTOM") {
    return false;
  }
  // Сравниваем payload через JSON (простое глубокое сравнение)
  return JSON.stringify(cmd1.payload) === JSON.stringify(cmd2.payload);
};

const KeybindingsSettings: FC<KeybindingsSettingsProps> = ({
  keyBindingManager,
  resetWindowLayout,
  onOpenCasino,
  splashNotificationsEnabled,
  onToggleSplashNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<"keybindings" | "windows" | "ui">(
    "keybindings",
  );
  const [bindings, setBindings] = useState<KeyBindingRow[]>(() => {
    // Инициализируем state сразу при создании
    const currentBindings = keyBindingManager.getAllBindings();
    const rows: KeyBindingRow[] = [];

    currentBindings.forEach((command, code) => {
      rows.push({
        id: `${code}-${command.action}`,
        code,
        command,
        isEditing: false,
      });
    });

    return rows;
  });
  const [capturingKeyFor, setCapturingKeyFor] = useState<string | null>(null);
  const [editingCustomCommand, setEditingCustomCommand] = useState<
    string | null
  >(null);
  const [customAction, setCustomAction] = useState("");
  const [customPayload, setCustomPayload] = useState("");
  const [requiresEntityTarget, setRequiresEntityTarget] = useState(false);
  const [requiresPositionTarget, setRequiresPositionTarget] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAddBinding = () => {
    const newRow: KeyBindingRow = {
      id: `new-${Date.now()}`,
      code: "",
      command: null,
      isEditing: true,
    };
    setBindings([...bindings, newRow]);
  };

  const handleRemoveBinding = (id: string, code: string) => {
    if (code) {
      keyBindingManager.removeBinding(code);
      keyBindingManager.saveToLocalStorage();
    }
    setBindings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleStartCapture = (id: string) => {
    setCapturingKeyFor(id);
  };

  const handleCommandChange = (id: string, commandIndex: number) => {
    const command = AVAILABLE_COMMANDS[commandIndex];

    // Если выбрана кастомная команда, открываем режим редактирования
    if (command.action === "CUSTOM") {
      setEditingCustomCommand(id);
      const binding = bindings.find((b) => b.id === id);
      if (binding?.command && binding.command.action === "CUSTOM") {
        setCustomAction(binding.command.action);
        setRequiresEntityTarget(binding.command.requiresEntityTarget || false);
        setRequiresPositionTarget(
          binding.command.requiresPositionTarget || false,
        );
        setCustomPayload(
          JSON.stringify(binding.command.payload || {}, null, 2),
        );
      } else {
        setCustomAction("");
        setCustomPayload("{}");
        setRequiresEntityTarget(false);
        setRequiresPositionTarget(false);
      }
      return;
    }

    setBindings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, command };
          // Если есть и клавиша и команда - сохраняем
          if (b.code && command) {
            keyBindingManager.setBinding(b.code, command);
            keyBindingManager.saveToLocalStorage();
          }
          return updated;
        }
        return b;
      }),
    );
  };

  const handleSaveCustomCommand = (id: string) => {
    try {
      const payload = JSON.parse(customPayload);

      const customCommand: GameCommand = {
        action: customAction,
        payload,
        label: `Custom: ${customAction}`,
        description: `выполнили ${customAction}`,
        requiresEntityTarget: requiresEntityTarget,
        requiresPositionTarget: requiresPositionTarget,
      };

      setBindings((prev) =>
        prev.map((b) => {
          if (b.id === id) {
            const updated = { ...b, command: customCommand };
            // Если есть и клавиша и команда - сохраняем
            if (b.code) {
              keyBindingManager.setBinding(b.code, customCommand);
              keyBindingManager.saveToLocalStorage();
            }
            return updated;
          }
          return b;
        }),
      );

      setEditingCustomCommand(null);
      setCustomAction("");
      setCustomPayload("");
      setRequiresEntityTarget(false);
      setRequiresPositionTarget(false);
    } catch {
      alert("Ошибка в JSON payload. Проверьте формат.");
    }
  };

  const handleCancelCustomCommand = () => {
    setEditingCustomCommand(null);
    setCustomAction("");
    setCustomPayload("");
    setRequiresEntityTarget(false);
    setRequiresPositionTarget(false);
  };

  const handleSaveAllBindings = () => {
    keyBindingManager.saveToLocalStorage();
    setSaveMessage("Настройки сохранены!");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetToDefaults = () => {
    if (
      !confirm(
        "Вы уверены, что хотите сбросить все настройки клавиш на значения по умолчанию?",
      )
    ) {
      return;
    }

    // Сбрасываем на defaults
    keyBindingManager.resetToDefaults();

    // Обновляем UI
    const currentBindings = keyBindingManager.getAllBindings();
    const rows: KeyBindingRow[] = [];

    currentBindings.forEach((command, code) => {
      rows.push({
        id: `${code}-${command.action}`,
        code,
        command,
        isEditing: false,
      });
    });

    setBindings(rows);
    setSaveMessage("Настройки сброшены на значения по умолчанию");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Обработчик нажатия клавиши для захвата
  useEffect(() => {
    if (!capturingKeyFor) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const code = e.code;

      setBindings((prev) =>
        prev.map((b) => {
          if (b.id === capturingKeyFor) {
            const updated = { ...b, code, isEditing: false };
            // Если есть и клавиша и команда - сохраняем
            if (code && b.command) {
              keyBindingManager.setBinding(code, b.command);
              keyBindingManager.saveToLocalStorage();
            }
            return updated;
          }
          return b;
        }),
      );

      setCapturingKeyFor(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [capturingKeyFor, keyBindingManager]);

  const formatKeyCode = (code: string): string => {
    if (!code) {
      return "Нажмите клавишу...";
    }
    // Форматируем код клавиши для читаемости
    return code.replace("Key", "").replace("Arrow", "").replace("Digit", "");
  };

  return (
    <div className="flex h-full text-window-text">
      {/* Sidebar with tabs */}
      <div className="w-48 bg-window-content border-r border-window-border p-2 flex flex-col gap-1">
        <button
          onClick={() => setActiveTab("keybindings")}
          className={`px-4 py-2 rounded text-left transition-colors ${
            activeTab === "keybindings"
              ? "bg-ui-tab-active-bg text-ui-tab-active-text"
              : "text-ui-tab-inactive-text hover:bg-ui-tab-hover-bg hover:text-window-text"
          }`}
        >
          Управление
        </button>
        <button
          onClick={() => setActiveTab("windows")}
          className={`px-4 py-2 rounded text-left transition-colors ${
            activeTab === "windows"
              ? "bg-ui-tab-active-bg text-ui-tab-active-text"
              : "text-ui-tab-inactive-text hover:bg-ui-tab-hover-bg hover:text-window-text"
          }`}
        >
          Система окон
        </button>
        <button
          onClick={() => setActiveTab("ui")}
          className={`px-4 py-2 rounded text-left transition-colors ${
            activeTab === "ui"
              ? "bg-ui-tab-active-bg text-ui-tab-active-text"
              : "text-ui-tab-inactive-text hover:bg-ui-tab-hover-bg hover:text-window-text"
          }`}
        >
          UI
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "keybindings" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Настройка клавиш</h2>
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className="text-sm text-log-success animate-pulse">
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={handleResetToDefaults}
                  className="px-3 py-1 bg-ui-button-disabled-bg hover:bg-dock-item-hover border border-ui-input-border rounded transition-colors text-sm"
                  title="Сбросить на значения по умолчанию"
                >
                  Сбросить
                </button>
                <button
                  onClick={handleSaveAllBindings}
                  className="px-3 py-1 bg-ui-button-primary-bg hover:bg-ui-button-primary-hover border border-ui-button-primary-bg rounded transition-colors text-sm font-semibold text-ui-button-primary-text"
                  title="Сохранить все изменения"
                >
                  Сохранить
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-window-border">
                      <th className="text-left py-2 px-2">Клавиша</th>
                      <th className="text-left py-2 px-2">Команда</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bindings.map((binding) => (
                      <tr
                        key={binding.id}
                        className="border-b border-window-border hover:bg-ui-tab-hover-bg"
                      >
                        <td className="py-2 px-2">
                          <button
                            onClick={() => handleStartCapture(binding.id)}
                            className={`px-3 py-1 rounded border transition-colors ${
                              capturingKeyFor === binding.id
                                ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                                : "border-ui-input-border bg-ui-input-bg hover:bg-dock-item-hover"
                            }`}
                          >
                            {capturingKeyFor === binding.id
                              ? "Нажмите клавишу..."
                              : formatKeyCode(binding.code)}
                          </button>
                        </td>
                        <td className="py-2 px-2">
                          {editingCustomCommand === binding.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Action (например: ATTACK)"
                                value={customAction}
                                onChange={(e) =>
                                  setCustomAction(e.target.value)
                                }
                                className="w-full bg-ui-input-bg border border-ui-input-border rounded px-2 py-1 text-window-text text-sm focus:outline-none focus:border-window-border-focus"
                              />
                              <textarea
                                placeholder='Payload JSON (например: {"target": "enemy"})'
                                value={customPayload}
                                onChange={(e) =>
                                  setCustomPayload(e.target.value)
                                }
                                rows={3}
                                className="w-full bg-ui-input-bg border border-ui-input-border rounded px-2 py-1 text-window-text text-sm font-mono focus:outline-none focus:border-window-border-focus"
                              />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`requires-entity-${binding.id}`}
                                    checked={requiresEntityTarget}
                                    onChange={(e) =>
                                      setRequiresEntityTarget(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-ui-input-border bg-ui-input-bg text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`requires-entity-${binding.id}`}
                                    className="text-sm text-window-text"
                                  >
                                    Требует выбор Сущности (targetId)
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`requires-position-${binding.id}`}
                                    checked={requiresPositionTarget}
                                    onChange={(e) =>
                                      setRequiresPositionTarget(
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 rounded border-ui-input-border bg-ui-input-bg text-blue-600 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`requires-position-${binding.id}`}
                                    className="text-sm text-window-text"
                                  >
                                    Требует выбор Позиции (x, y)
                                  </label>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleSaveCustomCommand(binding.id)
                                  }
                                  className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white"
                                >
                                  Сохранить
                                </button>
                                <button
                                  onClick={handleCancelCustomCommand}
                                  className="px-2 py-1 bg-ui-button-disabled-bg hover:bg-dock-item-hover rounded text-xs text-window-text"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : binding.command &&
                            !AVAILABLE_COMMANDS.some((c) =>
                              commandsEqual(binding.command, c),
                            ) ? (
                              <div className="text-sm">
                                <div className="font-semibold text-log-narrative">
                                Custom: {binding.command.action}
                                </div>
                                <div className="text-xs text-dock-text-dim mt-1 font-mono">
                                  {JSON.stringify(binding.command.payload)}
                                </div>
                                {(binding.command.requiresEntityTarget ||
                                binding.command.requiresPositionTarget) && (
                                  <div className="text-xs text-log-speech mt-1">
                                    {binding.command.requiresEntityTarget &&
                                    "⚠ Требует выбор сущности"}
                                    {binding.command.requiresEntityTarget &&
                                    binding.command.requiresPositionTarget &&
                                    " • "}
                                    {binding.command.requiresPositionTarget &&
                                    "⚠ Требует выбор позиции"}
                                  </div>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingCustomCommand(binding.id);
                                    setCustomAction(
                                      binding.command?.action || "",
                                    );
                                    setRequiresEntityTarget(
                                      binding.command?.requiresEntityTarget ||
                                      false,
                                    );
                                    setRequiresPositionTarget(
                                      binding.command?.requiresPositionTarget ||
                                      false,
                                    );
                                    setCustomPayload(
                                      JSON.stringify(
                                        binding.command?.payload || {},
                                        null,
                                        2,
                                      ),
                                    );
                                  }}
                                  className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                Редактировать
                                </button>
                              </div>
                            ) : (
                              <select
                                value={
                                  binding.command
                                    ? AVAILABLE_COMMANDS.findIndex((c) =>
                                      commandsEqual(binding.command, c),
                                    )
                                    : -1
                                }
                                onChange={(e) =>
                                  handleCommandChange(
                                    binding.id,
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-full bg-ui-input-bg border border-ui-input-border rounded px-2 py-1 text-window-text hover:bg-dock-item-hover focus:outline-none focus:border-window-border-focus"
                              >
                                <option value={-1} disabled>
                                Выберите команду...
                                </option>
                                {AVAILABLE_COMMANDS.map((cmd, idx) => (
                                  <option key={idx} value={idx}>
                                    {cmd.label || cmd.action}
                                  </option>
                                ))}
                              </select>
                            )}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() =>
                              handleRemoveBinding(binding.id, binding.code)
                            }
                            className="p-1 rounded hover:bg-red-600/20 text-log-combat hover:text-red-300 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleAddBinding}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-ui-input-bg hover:bg-dock-item-hover border border-ui-input-border rounded transition-colors text-sm"
              >
                <Plus size={16} />
                Добавить привязку
              </button>
            </div>

            <div className="mt-6 p-3 bg-ui-input-bg/50 border border-window-border rounded text-xs text-dock-text-dim">
              <p className="font-semibold mb-1">Примечание:</p>
              <p>• Нажмите на поле клавиши, затем нажмите нужную клавишу</p>
              <p>• Выберите команду из выпадающего списка</p>
              <p>
                • Для кастомных команд выберите &ldquo;Custom Command&rdquo; и
                заполните:
              </p>
              <p className="ml-4">
                - Action: тип команды (например: ATTACK, USE)
              </p>
              <p className="ml-4">- Payload: данные в формате JSON</p>
              <p className="ml-4">
                - Требует выбор Сущности: добавит targetId в payload
              </p>
              <p className="ml-4">
                - Требует выбор Позиции: добавит x, y в payload
              </p>
              <p className="mt-2">
                • Изменения сохраняются автоматически, но можно нажать
                &ldquo;Сохранить&rdquo; для гарантии
              </p>
              <p className="mt-2 text-yellow-500">
                TODO: Добавить возможность перетащить из инвентаря сущность и
                назначить
              </p>
            </div>
          </>
        )}

        {activeTab === "windows" && (
          <>
            <h2 className="text-lg font-bold mb-4">Система окон</h2>

            {resetWindowLayout && (
              <div className="p-4 bg-ui-input-bg/50 border border-window-border rounded mb-4">
                <h3 className="text-md font-semibold mb-2">
                  Расположение окон
                </h3>
                <p className="text-sm text-dock-text-dim mb-3">
                  Сбросить расположение всех окон к значениям по умолчанию
                </p>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Сбросить расположение окон к значениям по умолчанию? Страница будет перезагружена.",
                      )
                    ) {
                      await resetWindowLayout();
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 border border-orange-500 rounded transition-colors text-sm font-semibold"
                >
                  Сбросить расположение окон
                </button>
              </div>
            )}

            {onOpenCasino && (
              <div className="p-4 bg-ui-input-bg/50 border border-window-border rounded">
                <h3 className="text-md font-semibold mb-2">Gacha</h3>
                <p className="text-sm text-dock-text-dim mb-3">
                  Покрути баннер чтобы выбить новую собачку!
                </p>
                <button
                  onClick={onOpenCasino}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500 rounded transition-colors text-sm font-semibold"
                >
                  Крутить баннер!
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "ui" && (
          <>
            <h2 className="text-lg font-bold mb-4">Настройки интерфейса</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-ui-input-bg rounded-lg">
                <div>
                  <h3 className="font-medium text-window-text mb-1">
                    Всплывающие уведомления
                  </h3>
                  <p className="text-sm text-dock-text-dim">
                    Показывать текстовые уведомления в центре экрана (например,
                    &quot;Ваш ход&quot;)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={splashNotificationsEnabled}
                    onChange={(e) =>
                      onToggleSplashNotifications(e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            {/* Информация о билде */}
            <div className="mt-auto pt-6 border-t border-window-border">
              <div className="text-xs text-dock-text-dim space-y-1">
                <p>
                  <span className="text-window-icon-color">Коммит:</span>{" "}
                  <span className="font-mono">{__GIT_COMMIT__}</span>
                  <span className="text-dock-text-dim"> ({__GIT_BRANCH__})</span>
                </p>
                <p>
                  <span className="text-window-icon-color">Сборка:</span>{" "}
                  {new Date(__BUILD_TIME__).toLocaleString("ru-RU")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KeybindingsSettings;
