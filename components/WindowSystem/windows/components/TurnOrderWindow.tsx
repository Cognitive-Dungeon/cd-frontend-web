import {Coins, Heart, Shield, Sword, User, Users, Zap} from "lucide-react";
import {FC} from "react";

import {Entity} from "../../../../types";

interface TurnOrderWindowProps {
  entities: Entity[];
  activeEntityId: string | null;
  playerId: string | null;
}

export const TurnOrderWindow: FC<TurnOrderWindowProps> = ({
  entities,
  activeEntityId,
  playerId,
}) => {
  // Sort entities by nextActionTick to create turn order
  const sortedEntities = [...entities].sort(
    (a, b) => a.nextActionTick - b.nextActionTick,
  );

  const getEntityIcon = (entity: Entity) => {
    if (entity.id === playerId) {
      return <User size={24} className="text-blue-400" />;
    }
    if (entity.isHostile) {
      return <Sword size={24} className="text-red-400" />;
    }
    return <Users size={24} className="text-green-400" />;
  };

  const getEntityTypeLabel = (entity: Entity) => {
    if (entity.id === playerId) {
      return "Player";
    }
    if (entity.isHostile) {
      return "Hostile";
    }
    if (entity.npcType) {
      return entity.npcType;
    }
    return "NPC";
  };

  const getStatusClass = (entity: Entity) => {
    if (entity.isDead) {
      return "text-gray-500";
    }
    if (entity.id === activeEntityId) {
      return "text-cyan-400";
    }
    if (entity.id === playerId) {
      return "text-blue-400";
    }
    if (entity.isHostile) {
      return "text-red-400";
    }
    return "text-green-400";
  };

  return (
    <div className="flex flex-col h-full bg-window-base text-window-text">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedEntities.map((entity, index) => (
          <div
            key={entity.id}
            className={`relative bg-window-content border-2 rounded-lg p-4 transition-all ${
              entity.id === activeEntityId
                ? "border-ui-tab-active-text bg-ui-tab-active-bg shadow-lg shadow-cyan-500/20"
                : entity.id === playerId
                  ? "border-ui-button-primary-bg"
                  : entity.isHostile
                    ? "border-log-combat"
                    : "border-window-border"
            } ${entity.isDead ? "opacity-50" : ""}`}
          >
            {/* Position badge */}
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-window-base border-2 border-window-border rounded-full flex items-center justify-center font-bold text-xs">
              {index + 1}
            </div>

            {/* Active indicator */}
            {entity.id === activeEntityId && (
              <div className="absolute -top-2 -right-2">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 bg-ui-tab-active-text rounded-full animate-ping opacity-75" />
                  <div className="absolute inset-0 bg-ui-tab-active-text rounded-full" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-window-base rounded-full flex items-center justify-center">
                {getEntityIcon(entity)}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-bold text-lg truncate ${getStatusClass(entity)}`}
                  >
                    {entity.name}
                  </h3>
                  <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-window-content rounded">
                    {entity.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-dock-text-dim">
                    {getEntityTypeLabel(entity)}
                  </span>
                  {entity.isDead && (
                    <span className="text-xs px-2 py-0.5 bg-log-combat/20 text-log-combat rounded border border-log-combat">
                      Dead
                    </span>
                  )}
                  {entity.aiState && (
                    <span className="text-xs px-2 py-0.5 bg-window-content text-window-text rounded">
                      {entity.aiState}
                    </span>
                  )}
                  {entity.personality && (
                    <span className="text-xs px-2 py-0.5 bg-log-narrative/20 text-log-narrative rounded border border-log-narrative">
                      {entity.personality}
                    </span>
                  )}
                </div>

                {/* Stats */}
                {entity.stats && (
                  <div className="space-y-2">
                    {/* HP Bar */}
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-log-combat flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-dock-text-dim">HP</span>
                          <span className="font-mono">
                            {entity.stats.hp}/{entity.stats.maxHp}
                          </span>
                        </div>
                        <div className="h-2 bg-window-content rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-log-combat to-log-combat transition-all duration-300"
                            style={{
                              width: `${(entity.stats.hp / entity.stats.maxHp) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stamina Bar */}
                    <div className="flex items-center gap-2">
                      <Zap
                        size={14}
                        className="text-log-warning flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-dock-text-dim">Stamina</span>
                          <span className="font-mono">
                            {entity.stats.stamina}/{entity.stats.maxStamina}
                          </span>
                        </div>
                        <div className="h-2 bg-window-content rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-log-warning to-log-warning transition-all duration-300"
                            style={{
                              width: `${(entity.stats.stamina / entity.stats.maxStamina) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional stats */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Shield size={12} className="text-dock-text-dim" />
                        <span className="text-dock-text-dim">STR:</span>
                        <span className="font-mono font-bold">
                          {entity.stats.strength}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Coins size={12} className="text-log-warning" />
                        <span className="text-dock-text-dim">Gold:</span>
                        <span className="font-mono font-bold text-log-warning">
                          {entity.stats.gold}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Turn info */}
                <div className="mt-3 pt-3 border-t border-window-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dock-text-dim">Next Action Tick:</span>
                    <span className="font-mono font-bold text-ui-tab-active-text">
                      {entity.nextActionTick}
                    </span>
                  </div>
                </div>

                {/* Position */}
                <div className="mt-2 text-xs text-dock-text-dim">
                  Position: ({entity.pos.x}, {entity.pos.y})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with active turn info */}
      {activeEntityId && (
        <div className="border-t border-window-border p-3 bg-window-content">
          {activeEntityId === playerId ? (
            <div className="flex items-center justify-center gap-2 text-ui-tab-active-text font-bold">
              <div className="w-2 h-2 bg-ui-tab-active-text rounded-full animate-pulse" />
              <span>YOUR TURN</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-log-warning">
              <div className="w-2 h-2 bg-log-warning rounded-full animate-pulse" />
              <span>
                Waiting for{" "}
                {sortedEntities.find((e) => e.id === activeEntityId)?.name ||
                  "Unknown"}
                &apos;s turn...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
