import {Focus, Navigation} from "lucide-react";
import {forwardRef} from "react";

import type {ContextMenuData, Entity, GameRendererType, GameWorld, Position, SpeechBubble, ThreeRenderMode, Tile,} from "../types";

import {ContextMenu} from "./ContextMenu";
import GameGrid from "./GameGrid";
import { ThreeGameRenderer } from "./ThreeGameRenderer";

interface GameViewProps {
  world: GameWorld | null;
  player: Entity | null;
  entities: Entity[];
  zoom: number;
  isZooming: boolean;
  isPanning: boolean;
  followedEntityId: string | null;
  cameraOffset: { x: number; y: number };
  movementSmoothing: number;
  teleportSnapDistance: number;
  speechBubbles: SpeechBubble[];
  radialMenuOpen: boolean;
  selectedTargetEntityId: string | null;
  selectedTargetPosition: Position | null;
  pathfindingTarget: Position | null;
  currentPath: Position[];
  contextMenu: ContextMenuData | null;
  entityRegistry: Map<string, Entity>;
  onWheel: (e: React.WheelEvent) => void;
  onResetZoom: () => void;
  onToggleFollow: () => void;
  onMovePlayer: (dx: number, dy: number) => void;
  onSelectEntity: (entityId: string | null) => void;
  onSelectPosition: (x: number, y: number) => void;
  onFollowEntity: (entityId: string) => void;
  onSendCommand: (action: string, payload?: unknown) => void;
  onGoToPathfinding: (target: Position) => void;
  onContextMenu: (data: ContextMenuData) => void;
  onRadialMenuChange: (open: boolean) => void;
  onCloseContextMenu: () => void;
  onInspectEntity?: (entity: Entity) => void;
  onInspectTile?: (tile: Tile, position: { x: number; y: number }) => void;
  autoSkipEnabled: boolean;
  onToggleAutoSkip: () => void;

  graphicsRenderer: GameRendererType;
  threeRenderMode: ThreeRenderMode;
}

export const GameView = forwardRef<HTMLDivElement, GameViewProps>(
  (
    {
      world,
      player,
      entities,
      zoom,
      isZooming,
      isPanning,
      followedEntityId,
      cameraOffset,
      movementSmoothing,
      teleportSnapDistance,
      speechBubbles,
      radialMenuOpen,
      selectedTargetEntityId,
      selectedTargetPosition,
      pathfindingTarget,
      currentPath,
      contextMenu,
      entityRegistry,
      onWheel,
      onResetZoom,
      onToggleAutoSkip,
      autoSkipEnabled,
      onToggleFollow,
      onMovePlayer,
      onSelectEntity,
      onSelectPosition,
      onFollowEntity,

      onSendCommand,
      onGoToPathfinding,
      onContextMenu,
      onRadialMenuChange,
      onCloseContextMenu,
      onInspectEntity,
      onInspectTile,
      graphicsRenderer,
      threeRenderMode,
    },
    containerRef,
  ) => {
    return (
      <>
        <div
          ref={containerRef}
          className={`absolute inset-0 overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          onWheel={onWheel}
        >
          {/* Сообщение ожидания данных */}
          {(!world || !player) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-xl mb-4">
                  Ожидание данных от сервера...
                </div>
                <div className="text-gray-600 text-sm">
                  Подключитесь к серверу для начала игры
                </div>
              </div>
            </div>
          )}

          {/* Индикатор зума и переключатель следования */}
          {world && player && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-50 items-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResetZoom();
                }}
                className="bg-black/80 text-white px-3 py-1 rounded text-xs font-mono border border-neutral-600 hover:border-cyan-400 hover:text-cyan-200 transition-colors w-full"
              >
                Zoom: {(zoom * 100).toFixed(0)}%
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`px-3 py-1 rounded text-xs font-mono border transition-colors flex items-center justify-center gap-1.5 w-full ${
                  followedEntityId
                    ? "bg-cyan-600/80 text-white border-cyan-500"
                    : "bg-black/80 text-gray-400 border-neutral-600"
                }`}
              >
                {followedEntityId ? (
                  followedEntityId === player?.id ? (
                    <>
                      <Focus className="w-3 h-3" />
                      <span>Следовать</span>
                    </>
                  ) : (
                    <>
                      <Focus className="w-3 h-3" />
                      <span>
                        Слежение
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    <span>Свободно</span>
                  </>
                )}
              </button>

              <label className="flex items-center gap-2 bg-black/80 text-gray-400 px-3 py-1 rounded border border-neutral-600 text-xs font-mono cursor-pointer hover:text-cyan-200 transition-colors">
                <input
                  type="checkbox"
                  checked={autoSkipEnabled}
                  onChange={onToggleAutoSkip}
                  className="accent-cyan-500"
                />
                <span>Авто-скип</span>
              </label>
            </div>
          )}

          {world && player && (
            <>
              {graphicsRenderer === "three" ? (
                <div className="absolute inset-0">
                  <ThreeGameRenderer
                    world={world}
                    entities={[player, ...entities]}
                    zoom={zoom}
                    cameraOffset={cameraOffset}
                    mode={threeRenderMode}
                    movementSmoothing={movementSmoothing}
                    teleportSnapDistance={teleportSnapDistance}
                    selectedTargetEntityId={selectedTargetEntityId}
                    selectedTargetPosition={selectedTargetPosition}
                    className="w-full h-full"
                    onSelectPosition={onSelectPosition}
                    onSelectEntity={onSelectEntity}
                    onContextMenu={onContextMenu}
                  />
                </div>
              ) : (
                <div
                  className="absolute top-0 left-0"
                  style={{
                    transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
                    transition: followedEntityId
                      ? "transform 0.3s ease-out"
                      : "none",
                  }}
                >
                  <GameGrid
                    world={world}
                    entities={[player, ...entities]}
                    playerPos={player.pos}
                    fovRadius={8}
                    zoom={zoom}
                    disableAnimations={isZooming}
                    followedEntityId={followedEntityId}
                    movementSmoothing={movementSmoothing}
                    teleportSnapDistance={teleportSnapDistance}
                    speechBubbles={speechBubbles}
                    radialMenuOpen={radialMenuOpen}
                    onMovePlayer={onMovePlayer}
                    onSelectEntity={onSelectEntity}
                    onSelectPosition={onSelectPosition}
                    onFollowEntity={onFollowEntity}
                    onSendCommand={onSendCommand}
                    onGoToPathfinding={onGoToPathfinding}
                    onContextMenu={onContextMenu}
                    onRadialMenuChange={onRadialMenuChange}
                    onInspectEntity={onInspectEntity}
                    selectedTargetEntityId={selectedTargetEntityId}
                    selectedTargetPosition={selectedTargetPosition}
                    pathfindingTarget={pathfindingTarget}
                    currentPath={currentPath}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            data={contextMenu}
            onClose={onCloseContextMenu}
            onSelectEntity={onSelectEntity}
            onFollowEntity={onFollowEntity}
            onSendCommand={onSendCommand}
            onSelectPosition={onSelectPosition}
            onGoToPathfinding={onGoToPathfinding}
            onInspectEntity={onInspectEntity}
            onInspectTile={onInspectTile}
          />
        )}
      </>
    );
  },
);

GameView.displayName = "GameView";
