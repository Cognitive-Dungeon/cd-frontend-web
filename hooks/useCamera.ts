import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {calculateCameraOffset} from "@/utils";

import {MAX_ZOOM, MIN_ZOOM, ZOOM_STEP} from "../constants";
import {Entity, GameWorld, Position} from "../types";


interface UseCameraProps {
  world: GameWorld | null;
  player: Entity | null;
  entityRegistry: Map<string, Entity>;
  containerRef: React.RefObject<HTMLDivElement>;
  onPanningChange?: (isPanning: boolean) => void;
}

export const useCamera = ({
  world,
  player,
  entityRegistry,
  containerRef,
  onPanningChange,
}: UseCameraProps) => {
  // Camera state
  const [zoom, setZoom] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [followedEntityId, setFollowedEntityId] = useState<string | null>(null);

  // Refs for zoom handling
  const zoomTimeoutRef = useRef<number | null>(null);
  const zoomStartRef = useRef<{
    zoom: number;
    offset: { x: number; y: number };
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Refs for follow initialization
  const followInitializedRef = useRef(false);
  const containerReadyRef = useRef(false);
  const pendingFollowIdRef = useRef<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Handle mouse wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Save initial state on first zoom event
      if (!zoomStartRef.current) {
        let currentOffset = panOffset;
        if (followedEntityId && containerRef.current) {
          const followedEntity = entityRegistry.get(followedEntityId);
          if (followedEntity) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            currentOffset = calculateCameraOffset(
              followedEntity.pos.x,
              followedEntity.pos.y,
              containerWidth,
              containerHeight,
              zoom,
            );
          }
          setFollowedEntityId(null);
        }

        zoomStartRef.current = {
          zoom,
          offset: currentOffset,
          mouseX,
          mouseY,
        };
      }

      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current);
      }
      setIsZooming(true);

      setZoom((prevZoom) => {
        const delta = e.ctrlKey
          ? -e.deltaY / 100
          : e.deltaY > 0
            ? -ZOOM_STEP
            : ZOOM_STEP;
        const newZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, prevZoom + delta),
        );

        const startState = zoomStartRef.current!;
        const worldX =
          (startState.mouseX - startState.offset.x) / startState.zoom;
        const worldY =
          (startState.mouseY - startState.offset.y) / startState.zoom;

        const newOffsetX = startState.mouseX - worldX * newZoom;
        const newOffsetY = startState.mouseY - worldY * newZoom;

        setPanOffset({ x: newOffsetX, y: newOffsetY });

        return newZoom;
      });

      zoomTimeoutRef.current = window.setTimeout(() => {
        setIsZooming(false);
        zoomStartRef.current = null;
      }, 150);
    },
    [followedEntityId, panOffset, zoom, entityRegistry, containerRef],
  );

  // Prevent page zoom when scrolling over game area
  useEffect(() => {
    const preventPageZoom = (e: WheelEvent) => {
      if (!containerRef.current || !e.ctrlKey) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventPageZoom, {
      passive: false,
      capture: true,
    });
    return () =>
      window.removeEventListener("wheel", preventPageZoom, { capture: true });
  }, [containerRef]);

  // Cleanup zoom timeout
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  // Handle mouse panning
  useEffect(() => {
    let hasMoved = false;
    let animationFrameId: number | null = null;
    let pendingPanOffset: { x: number; y: number } | null = null;
    let totalMovement = 0;
    const MOVEMENT_THRESHOLD = 400;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && containerRef.current) {
        const target = e.target as HTMLElement;
        if (
          target.closest("[data-window]") ||
          target.closest("[data-window-header]")
        ) {
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }

          hasMoved = false;
          setIsPanning(true);
          onPanningChange?.(true);

          let currentOffset = panOffset;
          if (followedEntityId && world) {
            const followedEntity = entityRegistry.get(followedEntityId);
            if (followedEntity && containerRef.current) {
              const containerWidth = containerRef.current.clientWidth;
              const containerHeight = containerRef.current.clientHeight;
              currentOffset = calculateCameraOffset(
                followedEntity.pos.x,
                followedEntity.pos.y,
                containerWidth,
                containerHeight,
                zoom,
              );
            }
          }

          setPanStart({
            x: e.clientX - currentOffset.x,
            y: e.clientY - currentOffset.y,
          });
          e.preventDefault();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (!hasMoved && distance > 0) {
          totalMovement = distance;
        }

        hasMoved = true;

        if (followedEntityId && totalMovement > MOVEMENT_THRESHOLD) {
          setFollowedEntityId(null);
        }
        e.preventDefault();

        pendingPanOffset = {
          x: deltaX,
          y: deltaY,
        };

        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(() => {
            if (pendingPanOffset) {
              setPanOffset(pendingPanOffset);
              pendingPanOffset = null;
            }
            animationFrameId = null;
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      onPanningChange?.(false);
      hasMoved = false;
      totalMovement = 0;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      if (pendingPanOffset) {
        setPanOffset(pendingPanOffset);
        pendingPanOffset = null;
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    if (isPanning) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isPanning,
    panStart,
    panOffset,
    followedEntityId,
    entityRegistry,
    world,
    zoom,
    containerRef,
    onPanningChange,
  ]);

  // Calculate camera offset for following entity
  const cameraOffset = useMemo(() => {
    if (!followedEntityId || !world || !player || containerSize.width === 0) {
      return panOffset;
    }

    const followedEntity = entityRegistry.get(followedEntityId);
    if (!followedEntity) {
      return panOffset;
    }

    return calculateCameraOffset(
      followedEntity.pos.x,
      followedEntity.pos.y,
      containerSize.width,
      containerSize.height,
      zoom,
    );
  }, [
    followedEntityId,
    world,
    player,
    entityRegistry,
    panOffset,
    zoom,
    containerSize,
  ]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        setContainerSize({ width, height });

        if (!containerReadyRef.current) {
          if (width > 0 && height > 0) {
            containerReadyRef.current = true;
            if (pendingFollowIdRef.current) {
              setFollowedEntityId(pendingFollowIdRef.current);
              pendingFollowIdRef.current = null;
            }
          }
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    const container = containerRef.current;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Initialize follow on player entity
  useEffect(() => {
    if (player && !followInitializedRef.current) {
      pendingFollowIdRef.current = player.id;
      followInitializedRef.current = true;
    }
  }, [player]);

  // Methods for camera control
  const goToPosition = useCallback(
    (position: Position) => {
      setFollowedEntityId(null);

      if (containerRef.current && world) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const offset = calculateCameraOffset(
          position.x,
          position.y,
          containerWidth,
          containerHeight,
          zoom,
        );
        setPanOffset(offset);
      }
    },
    [world, zoom, containerRef],
  );

  const goToEntity = useCallback(
    (entityId: string) => {
      const entity = entityRegistry.get(entityId);
      if (!entity) {
        return;
      }

      setFollowedEntityId(null);

      if (world && containerRef.current) {
        const offset = calculateCameraOffset(
          entity.pos.x,
          entity.pos.y,
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
          zoom,
        );
        setPanOffset(offset);
      }
    },
    [entityRegistry, world, zoom, containerRef],
  );

  const followEntity = useCallback((entityId: string | null) => {
    setFollowedEntityId(entityId);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFollow = useCallback(() => {
    if (followedEntityId) {
      if (containerRef.current && world) {
        const followedEntity = entityRegistry.get(followedEntityId);
        if (followedEntity) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;
          const offset = calculateCameraOffset(
            followedEntity.pos.x,
            followedEntity.pos.y,
            containerWidth,
            containerHeight,
            zoom,
          );
          setPanOffset(offset);
        }
      }
      setFollowedEntityId(null);
    } else {
      setFollowedEntityId(player?.id || null);
    }
  }, [followedEntityId, player, world, zoom, entityRegistry, containerRef]);

  return {
    zoom,
    isZooming,
    isPanning,
    panOffset,
    followedEntityId,
    cameraOffset,
    handleWheel,
    goToPosition,
    goToEntity,
    followEntity,
    resetZoom,
    toggleFollow,
  };
};
