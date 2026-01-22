import { useEffect, useMemo, useRef, useState } from "react";

import * as THREE from "three";
import { Text } from "troika-three-text";

import { EntityType } from "../types";
import type {
  ContextMenuData,
  Entity,
  GameWorld,
  Position,
  ThreeRenderMode,
} from "../types";
import { getCellSize } from "@/utils";

export interface ThreeGameRendererProps {
  world: GameWorld;
  entities: Entity[];
  zoom: number;
  cameraOffset: { x: number; y: number };

  movementSmoothing?: number;
  teleportSnapDistance?: number;

  selectedTargetEntityId?: string | null;
  selectedTargetPosition?: Position | null;

  mode?: ThreeRenderMode;
  className?: string;

  onSelectPosition?: (x: number, y: number) => void;
  onSelectEntity?: (entityId: string | null) => void;
  onContextMenu?: (data: ContextMenuData) => void;
}

// todo: use server-defined colors?
const ENTITY_COLOR: Record<EntityType, number> = {
  [EntityType.PLAYER]: 0x22d3ee,
  [EntityType.ENEMY_GOBLIN]: 0x22c55e,
  [EntityType.ENEMY_ORC]: 0xdc2626,
  [EntityType.CHEST]: 0xeab308,
  [EntityType.ITEM]: 0xa855f7,
  [EntityType.EXIT]: 0xffffff,
  [EntityType.NPC]: 0xfde047,
};

// World axes:
// - X: grid X (right)
// - Z: grid Y (down)
// - Y: elevation (up)
const FLOOR_HEIGHT = 1;
const WALL_HEIGHT = 1;
const ENTITY_Y_OFFSET = 1.5;
const ENTITY_LABEL_Y_OFFSET = 0.75;
const SELECTION_Y_OFFSET = 0;

// Fog-of-war overlay tuning
const FOG_Y_EPSILON = 0.05;
const FOG_ALPHA_UNEXPLORED = 1;
const FOG_ALPHA_EXPLORED = 0.75;
// Rounded cut on fog tiles that touch 2 adjacent visible neighbors.
const FOG_CORNER_ROUND_RADIUS = 1.2;

function getTileBaseY(tile: GameWorld["map"][number][number] | undefined): number {
  if (!tile) {
    return 0;
  }

  // Requested vertical rules:
  // - Blocking walls are rendered one level above the base plane.
  // - Tiles explicitly marked as env="wall" are rendered on the base plane.
  if (tile.isWall === true) {
    return 1;
  }
  if ((tile as any).env === "wall") {
    return 0;
  }

  return tile.elevation ?? 0;
}

function getTileHeight(tile: GameWorld["map"][number][number] | undefined): number {
  if (!tile) {
    return FLOOR_HEIGHT;
  }
  return tile.isWall ? WALL_HEIGHT : FLOOR_HEIGHT;
}

function getTileTopY(tile: GameWorld["map"][number][number] | undefined): number {
  return getTileBaseY(tile) + getTileHeight(tile);
}

function parseCssColorToHex(css: string): number | null {
  const s = css.trim();

  if (/^0x[0-9a-f]+$/i.test(s)) {
    const n = parseInt(s.slice(2), 16);
    return Number.isFinite(n) ? (n & 0xffffff) : null;
  }

  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (r << 16) | (g << 8) | b;
    }
    if (hex.length === 6) {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  // rgb(...) / rgba(...)
  const m = s.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/i,
  );
  if (m) {
    const r = Math.min(255, Math.max(0, Number(m[1])));
    const g = Math.min(255, Math.max(0, Number(m[2])));
    const b = Math.min(255, Math.max(0, Number(m[3])));
    return (r << 16) | (g << 8) | b;
  }

  return null;
}

function tileColorHex(
  tile: GameWorld["map"][number][number],
  resolveColor: (value: unknown) => number | null,
): number {
  const fromServer = resolveColor((tile as any).color);
  if (fromServer !== null) {
    // Match DOM-ish visibility rules:
    // - Unexplored: fully black
    // - Explored but not visible: dimmed/grayscale-like
    // - Visible: as-is
    const isVisible = (tile as any).isVisible === true;
    const isExplored = (tile as any).isExplored === true;

    if (!isVisible && !isExplored) {
      return 0x000000;
    }
    if (tile.env == "wall") {
      return 0xffffff;
    }
    if (!isVisible && isExplored) {
      const r = (fromServer >> 16) & 0xff;
      const g = (fromServer >> 8) & 0xff;
      const b = fromServer & 0xff;
      const dim = 0.35;
      return (
        (Math.round(r * dim) << 16) |
        (Math.round(g * dim) << 8) |
        Math.round(b * dim)
      );
    }

    return fromServer;
  }

  // Fallback palette (kept for safety)
  if (tile.isWall) {
    return 0xffffff; // slate-ish
  }
  switch (tile.env) {
    case "grass":
      return 0x052e16;
    case "water":
      return 0x1d4ed8;
    case "tree":
      return 0x166534;
    case "floor":
      return 0x0b0f19;
    case "stone":
    default:
      return 0x0f172a;
  }
}

export function ThreeGameRenderer({
  world,
  entities,
  zoom,
  cameraOffset,
  movementSmoothing = 14,
  teleportSnapDistance = 4,
  selectedTargetEntityId = null,
  selectedTargetPosition = null,
  mode = "ortho2d",
  className,
  onSelectPosition,
  onSelectEntity,
  onContextMenu,
}: ThreeGameRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const colorCacheRef = useRef<Map<string, number>>(new Map());
  const colorProbeElRef = useRef<HTMLSpanElement | null>(null);

  const resolveColor = useMemo(() => {
    return (value: unknown): number | null => {
      if (value === null || value === undefined) {
        return null;
      }

      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          return null;
        }
        return (Math.floor(value) & 0xffffff) >>> 0;
      }

      if (typeof value !== "string") {
        return null;
      }

      if (!value) {
        return null;
      }

      const cached = colorCacheRef.current.get(value);
      if (cached !== undefined) {
        return cached;
      }

      // Direct parse for hex/rgb/0x...
      const parsed = parseCssColorToHex(value);
      if (parsed !== null) {
        colorCacheRef.current.set(value, parsed);
        return parsed;
      }

      // Treat as a CSS class (e.g. Tailwind text-*) and resolve via computed style.
      const container = containerRef.current;
      if (!container) {
        return null;
      }

      let probe = colorProbeElRef.current;
      if (!probe) {
        probe = document.createElement("span");
        probe.style.position = "absolute";
        probe.style.left = "-99999px";
        probe.style.top = "-99999px";
        probe.style.pointerEvents = "none";
        probe.textContent = "■";
        container.appendChild(probe);
        colorProbeElRef.current = probe;
      }

      probe.className = value;
      const computed = window.getComputedStyle(probe).color;
      const computedHex = parseCssColorToHex(computed);
      if (computedHex !== null) {
        colorCacheRef.current.set(value, computedHex);
        return computedHex;
      }

      return null;
    };
  }, []);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const worldGroupRef = useRef<THREE.Group | null>(null);
  const entitiesGroupRef = useRef<THREE.Group | null>(null);

  const entityMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const entityNameTextRef = useRef<Map<string, Text>>(new Map());
  const entityRenderPosRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const previousTilePosRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const entityGeometryRef = useRef<THREE.CircleGeometry | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  const selectionCellOutlineRef = useRef<THREE.LineSegments | null>(null);
  const selectionCellMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const selectionCellGeometryRef = useRef<THREE.EdgesGeometry | null>(null);
  const selectionEntityRingRef = useRef<THREE.Mesh | null>(null);
  const selectionEntityMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const selectionEntityGeometryRef = useRef<THREE.RingGeometry | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [sceneEpoch, setSceneEpoch] = useState(0);

  const latestParamsRef = useRef({
    zoom,
    cameraOffset,
    mode,
    movementSmoothing,
    teleportSnapDistance,
  });
  useEffect(() => {
    latestParamsRef.current = {
      zoom,
      cameraOffset,
      mode,
      movementSmoothing,
      teleportSnapDistance,
    };
  }, [zoom, cameraOffset, mode, movementSmoothing, teleportSnapDistance]);

  const latestCallbacksRef = useRef({
    onSelectPosition,
    onSelectEntity,
    onContextMenu,
  });
  useEffect(() => {
    latestCallbacksRef.current = { onSelectPosition, onSelectEntity, onContextMenu };
  }, [onSelectPosition, onSelectEntity, onContextMenu]);

  const latestDataRef = useRef({ world, entities });
  useEffect(() => {
    latestDataRef.current = { world, entities };
  }, [world, entities]);

  const latestSelectionRef = useRef({
    selectedTargetEntityId,
    selectedTargetPosition,
  });
  useEffect(() => {
    latestSelectionRef.current = {
      selectedTargetEntityId,
      selectedTargetPosition,
    };
  }, [selectedTargetEntityId, selectedTargetPosition]);

  const raycasterRef = useRef(new THREE.Raycaster());
  // Grid plane is XZ (y=0)
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const getEntitiesAt = useMemo(() => {
    const order: Record<string, number> = {
      [EntityType.EXIT]: 1,
      [EntityType.ITEM]: 2,
      [EntityType.NPC]: 3,
      [EntityType.ENEMY_GOBLIN]: 4,
      [EntityType.ENEMY_ORC]: 4,
      [EntityType.CHEST]: 4,
      [EntityType.PLAYER]: 10,
    };

    return (x: number, y: number) => {
      return latestDataRef.current.entities
        .filter((e) => e.pos.x === x && e.pos.y === y && !e.isDead)
        .sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0));
    };
  }, []);

  const pointerToGrid = useMemo(() => {
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    return (clientX: number, clientY: number): Position | null => {
      const renderer = rendererRef.current;
      const ortho = orthoCameraRef.current;
      const perspective = perspectiveCameraRef.current;
      const container = containerRef.current;
      const { world: w } = latestDataRef.current;
      const { mode: m } = latestParamsRef.current;

      if (!renderer || !ortho || !perspective || !container) {
        return null;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        return null;
      }

      ndc.set(x * 2 - 1, -(y * 2 - 1));

      const camera = m === "ortho2d" ? ortho : perspective;
      raycasterRef.current.setFromCamera(ndc, camera);

      const ok = raycasterRef.current.ray.intersectPlane(planeRef.current, hit);
      if (!ok) {
        return null;
      }

      const gridX = Math.floor(hit.x);
      const gridY = Math.floor(hit.z);

      if (gridX < 0 || gridX >= w.width || gridY < 0 || gridY >= w.height) {
        return null;
      }

      return { x: gridX, y: gridY };
    };
  }, []);

  // Init Three.js renderer + scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Scene-owned caches should not survive a renderer/scene reset (HMR can preserve refs).
    entityMeshesRef.current.clear();
    entityNameTextRef.current.clear();
    entityRenderPosRef.current.clear();
    previousTilePosRef.current.clear();
    lastFrameTimeRef.current = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    // Prevent default touch gestures (esp. trackpads / mobile)
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000);
    // Top-down: camera above +Y, looking down.
    // Use up=(0,0,-1) so +Z goes down on screen (DOM-like).
    orthoCamera.up.set(0, 0, -1);
    orthoCamera.position.set(0, 10, 0);
    orthoCamera.lookAt(0, 0, 0);

    const perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.01, 2000);
    perspectiveCamera.up.set(0, 1, 0);
    perspectiveCamera.position.set(10, -10, 10);
    perspectiveCamera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(-10, 10, 20);
    scene.add(sun);

    const worldGroup = new THREE.Group();
    const entitiesGroup = new THREE.Group();
    scene.add(worldGroup);
    scene.add(entitiesGroup);

    // Shared geometry for entity billboards is owned by the scene lifecycle.
    // Important for Vite/React Fast Refresh: avoid reusing a disposed geometry.
    entityGeometryRef.current?.dispose();
    entityGeometryRef.current = new THREE.CircleGeometry(0.35, 18);

    // Selection overlays (cell outline + entity ring)
    const cellGeom = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
    const cellMat = new THREE.LineBasicMaterial({
      color: 0xf97316, // orange by default
      transparent: true,
      opacity: 1,
    });
    cellMat.depthTest = false;
    const cellOutline = new THREE.LineSegments(cellGeom, cellMat);
    cellOutline.visible = false;
    cellOutline.rotation.x = -Math.PI / 2;
    cellOutline.position.set(0, SELECTION_Y_OFFSET, 0);
    cellOutline.renderOrder = 1000;
    cellOutline.frustumCulled = false;
    scene.add(cellOutline);

    const ringGeom = new THREE.RingGeometry(0.42, 0.58, 40);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, // cyan
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    ringMat.depthTest = false;
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.visible = false;
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, ENTITY_Y_OFFSET-1, 0);
    ring.renderOrder = 1001;
    ring.frustumCulled = false;
    scene.add(ring);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    orthoCameraRef.current = orthoCamera;
    perspectiveCameraRef.current = perspectiveCamera;
    worldGroupRef.current = worldGroup;
    entitiesGroupRef.current = entitiesGroup;

    selectionCellOutlineRef.current = cellOutline;
    selectionCellMaterialRef.current = cellMat;
    selectionCellGeometryRef.current = cellGeom;
    selectionEntityRingRef.current = ring;
    selectionEntityMaterialRef.current = ringMat;
    selectionEntityGeometryRef.current = ringGeom;

    container.appendChild(renderer.domElement);

    // Bump epoch so other effects re-bind to the new renderer/scene (HMR-safe).
    setSceneEpoch((e) => e + 1);

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const next = {
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      };
      setSize(next);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      container.removeChild(renderer.domElement);
      renderer.dispose();

      if (colorProbeElRef.current) {
        try {
          colorProbeElRef.current.remove();
        } catch {
          // ignore
        }
        colorProbeElRef.current = null;
      }

      selectionCellOutlineRef.current = null;
      selectionCellMaterialRef.current = null;
      selectionCellGeometryRef.current = null;
      selectionEntityRingRef.current = null;
      selectionEntityMaterialRef.current = null;
      selectionEntityGeometryRef.current = null;

      // Dispose scene resources best-effort (dedupe to avoid double-dispose)
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();

      scene.traverse((obj) => {
        const anyObj = obj as any;
        const geometry = anyObj.geometry as THREE.BufferGeometry | undefined;
        if (geometry && !disposedGeometries.has(geometry)) {
          geometry.dispose?.();
          disposedGeometries.add(geometry);
        }

        const material = anyObj.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          for (const m of material) {
            if (m && !disposedMaterials.has(m)) {
              m.dispose?.();
              disposedMaterials.add(m);
            }
          }
        } else if (material && !disposedMaterials.has(material)) {
          material.dispose?.();
          disposedMaterials.add(material);
        }
      });

      entityGeometryRef.current = null;

      // Clear scene-owned caches (important for HMR preserving refs)
      entityMeshesRef.current.clear();
      entityNameTextRef.current.clear();
      entityRenderPosRef.current.clear();
      previousTilePosRef.current.clear();
      lastFrameTimeRef.current = null;

      rendererRef.current = null;
      sceneRef.current = null;
      orthoCameraRef.current = null;
      perspectiveCameraRef.current = null;
      worldGroupRef.current = null;
      entitiesGroupRef.current = null;
    };
  }, []);

  // Build / rebuild tile mesh when world changes
  useEffect(() => {
    const worldGroup = worldGroupRef.current;
    if (!worldGroup) {
      return;
    }

    // Clear previous
    while (worldGroup.children.length > 0) {
      const child = worldGroup.children.pop();
      if (!child) {
        break;
      }
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose?.();
        }
        const material = (mesh as any).material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose?.());
        } else {
          material?.dispose?.();
        }
      });
    }

    const tileCount = world.width * world.height;

    const tileGeometry = new THREE.BoxGeometry(1, 1, 1);
    const tileMaterial = new THREE.MeshStandardMaterial({
      // color: new THREE.Color().setRGB(1, 1, 1),
      // vertexColors: true,
      roughness: 0.95,
      metalness: 0,
    });


    let tiles = new THREE.InstancedMesh(tileGeometry, tileMaterial, tileCount);

    // Important: ensure instanceColor exists before first render so Three compiles
    // the shader with instancing color support (otherwise colors can appear black).
    tiles.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(tileCount * 3),
      3,
    );

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    let i = 0;
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.map[y]?.[x];
        const isUnseen =
          !tile ||
          (tile.isVisible !== true && tile.isExplored !== true);


        if (isUnseen) {
          // Don't render completely unseen tiles (matches DOM's black void feel).
          // InstancedMesh can't skip instances, so we collapse them.
          pos.set(0, -1000, 0);
          scale.set(0, 0, 0);
          matrix.compose(pos, quat, scale);
          tiles.setMatrixAt(i, matrix);
          color.setHex(0x000000);
          tiles.setColorAt(i, color);
        } else {
          const tileBaseY = getTileBaseY(tile);
          const tileHeight = getTileHeight(tile);
          pos.set(x + 0.5, tileBaseY + tileHeight / 2, y + 0.5);
          scale.set(1, tileHeight, 1);
          matrix.compose(pos, quat, scale);
          tiles.setMatrixAt(i, matrix);

          const hex = tileColorHex(tile, resolveColor);
          color.setHex(hex);
          tiles.setColorAt(i, color);
          // console.log("Rendering tile at", x, y, "color=", color);
        }

        i++;
      }
    }

    tiles.instanceMatrix.needsUpdate = true;
    if (tiles.instanceColor)
    tiles.instanceColor.needsUpdate = true;

    // Thin grid lines (rectangular, unlike GridHelper)
    // Put grid slightly BELOW the base plane so tiles/entities at y>=0 occlude it.
    const linePositions: number[] = [];
    const gridLineY = -0.001;

    // Vertical lines
    for (let x = 0; x <= world.width; x++) {
      linePositions.push(x, gridLineY, 0, x, gridLineY, world.height);
    }
    // Horizontal lines
    for (let z = 0; z <= world.height; z++) {
      linePositions.push(0, gridLineY, z, world.width, gridLineY, z);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3),
    );
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.9,
    });
    lineMaterial.depthTest = true;
    lineMaterial.depthWrite = false;
    const gridLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    gridLines.renderOrder = 50;
    gridLines.frustumCulled = false;

    // Fog-of-war overlay (variant B + C)
    // Uses server-provided flags per tile:
    // - isVisible: true  => no fog
    // - isVisible: false & isExplored: true  => semi-transparent fog
    // - isExplored: false => opaque black
    const fogGeometry = new THREE.PlaneGeometry(1, 1);
    fogGeometry.rotateX(-Math.PI / 2);

    const fogMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uCornerRadius: { value: FOG_CORNER_ROUND_RADIUS },
      },
      vertexShader: `
        // attribute vec3 instanceColor;
        attribute float instanceAlpha;
        attribute float instanceEdgeMask;
        attribute float instanceMode;

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vEdgeMask;
        varying float vMode;

        void main() {
          vUv = uv;
          vColor = instanceColor;
          vAlpha = instanceAlpha;
          vEdgeMask = instanceEdgeMask;
          vMode = instanceMode;

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uCornerRadius;

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vEdgeMask;
        varying float vMode;

        float cornerBlob(float cornerBit, float d) {
          // Corner patch: opaque at corner, fades to 0 outside radius.
          float f = 1.0 - smoothstep(0.0, uCornerRadius, d);
          return cornerBit * f;
        }

        void main() {
          if (vAlpha <= 0.0001) {
            discard;
          }

          float mask = floor(vEdgeMask + 0.5);
          float west = mod(mask, 2.0);
          mask = floor(mask / 2.0);
          float east = mod(mask, 2.0);
          mask = floor(mask / 2.0);
          float north = mod(mask, 2.0);
          mask = floor(mask / 2.0);
          float south = mod(mask, 2.0);

          // Corner bits (interpretation depends on mode):
          // - mode 0: full fog tile, ignore
          // - mode 1: visible tile corner-patch, bits mean adjacent neighbors are fog
          float nw = step(0.5, west) * step(0.5, north);
          float ne = step(0.5, east) * step(0.5, north);
          float sw = step(0.5, west) * step(0.5, south);
          float se = step(0.5, east) * step(0.5, south);

          float dNW = length(vec2(vUv.x, 1.0 - vUv.y));
          float dNE = length(vec2(1.0 - vUv.x, 1.0 - vUv.y));
          float dSW = length(vec2(vUv.x, vUv.y));
          float dSE = length(vec2(1.0 - vUv.x, vUv.y));

          // Full fog tile: hard edges.
          if (vMode < 0.5) {
            gl_FragColor = vec4(vColor, vAlpha);
            return;
          }

          // Corner-only patch on visible tiles (internal corner rounding of visible area)
          float aNW = cornerBlob(nw, dNW);
          float aNE = cornerBlob(ne, dNE);
          float aSW = cornerBlob(sw, dSW);
          float aSE = cornerBlob(se, dSE);
          float a = max(max(aNW, aNE), max(aSW, aSE));

          if (a <= 0.0001) {
            discard;
          }

          gl_FragColor = vec4(vColor, vAlpha * a);
          // gl_FragColor = vec4(vColor, vAlpha * f);
        }
      `,
    });

    const fog = new THREE.InstancedMesh(fogGeometry, fogMaterial, tileCount);
    fog.renderOrder = 10000;
    fog.frustumCulled = false;
    fog.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(tileCount * 3),
      3,
    );
    (fog.geometry as THREE.BufferGeometry).setAttribute(
      "instanceAlpha",
      new THREE.InstancedBufferAttribute(new Float32Array(tileCount), 1),
    );
    (fog.geometry as THREE.BufferGeometry).setAttribute(
      "instanceEdgeMask",
      new THREE.InstancedBufferAttribute(new Float32Array(tileCount), 1),
    );
    (fog.geometry as THREE.BufferGeometry).setAttribute(
      "instanceMode",
      new THREE.InstancedBufferAttribute(new Float32Array(tileCount), 1),
    );

    const fogAlphaAttr = (fog.geometry as THREE.BufferGeometry).getAttribute(
      "instanceAlpha",
    ) as THREE.InstancedBufferAttribute;
    const fogMaskAttr = (fog.geometry as THREE.BufferGeometry).getAttribute(
      "instanceEdgeMask",
    ) as THREE.InstancedBufferAttribute;
    const fogModeAttr = (fog.geometry as THREE.BufferGeometry).getAttribute(
      "instanceMode",
    ) as THREE.InstancedBufferAttribute;

    const fogColor = new THREE.Color();
    const fogMatrix = new THREE.Matrix4();
    const fogQuat = new THREE.Quaternion();
    const fogPos = new THREE.Vector3();
    const fogScale = new THREE.Vector3(1, 1, 1);

    let fi = 0;
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.map[y]?.[x];
        const isVisible = tile?.isVisible === true;
        const isExplored = tile?.isExplored === true;

        // Two render modes:
        // - mode=0: full fog tile (for !isVisible)
        // - mode=1: corner patch (for isVisible tiles that have 2 adjacent fog neighbors)
        let mode = 0;
        let edgeMask = 0;
        let alpha = 0;

        if (!isVisible) {
          // Full fog tile
          mode = 0;
          alpha = isExplored ? FOG_ALPHA_EXPLORED : FOG_ALPHA_UNEXPLORED;
          edgeMask = 0;
        } else {
          // Corner patch on visible tile if it forms an "internal" corner
          // (two adjacent neighbors are fog).
          const westT = world.map[y]?.[x - 1];
          const eastT = world.map[y]?.[x + 1];
          const northT = world.map[y - 1]?.[x];
          const southT = world.map[y + 1]?.[x];

          const westFog = westT?.isVisible !== true;
          const eastFog = eastT?.isVisible !== true;
          const northFog = northT?.isVisible !== true;
          const southFog = southT?.isVisible !== true;

          const hasCorner =
            (westFog && northFog) ||
            (eastFog && northFog) ||
            (westFog && southFog) ||
            (eastFog && southFog);

          if (hasCorner) {
            mode = 1;
            if (westFog) edgeMask |= 1;
            if (eastFog) edgeMask |= 2;
            if (northFog) edgeMask |= 4;
            if (southFog) edgeMask |= 8;

            const unexploredNeighbor =
              (westFog && westT?.isExplored !== true) ||
              (eastFog && eastT?.isExplored !== true) ||
              (northFog && northT?.isExplored !== true) ||
              (southFog && southT?.isExplored !== true);

            alpha = unexploredNeighbor ? FOG_ALPHA_UNEXPLORED : FOG_ALPHA_EXPLORED;
          } else {
            mode = 0;
            alpha = 0;
            edgeMask = 0;
          }
        }

        const tileTopY = getTileTopY(tile);
        fogPos.set(x+0.5, tileTopY + FOG_Y_EPSILON, y+0.5);
        fogMatrix.compose(fogPos, fogQuat, fogScale);
        fog.setMatrixAt(fi, fogMatrix);

        // Color: unexplored is black; explored fog is slightly lifted for readability.
        // For corner patches we infer explored/unexplored via alpha choice above.
        fogColor.setHex(alpha >= 0.99 ? 0x000000 : 0x020617);
        fog.setColorAt(fi, fogColor);
        fogAlphaAttr.setX(fi, alpha);
        fogMaskAttr.setX(fi, edgeMask);
        fogModeAttr.setX(fi, mode);
        fi++;
      }
    }

    fog.instanceMatrix.needsUpdate = true;
    if (fog.instanceColor) fog.instanceColor.needsUpdate = true;
    fogAlphaAttr.needsUpdate = true;
    fogMaskAttr.needsUpdate = true;
    fogModeAttr.needsUpdate = true;

    worldGroup.add(tiles);
    worldGroup.add(gridLines);
    worldGroup.add(fog);

    return () => {
      // Will be disposed by the clear loop next time or unmount.
    };
  }, [world, resolveColor, sceneEpoch]);

  // Build / rebuild entity meshes
  useEffect(() => {
    const entitiesGroup = entitiesGroupRef.current;
    if (!entitiesGroup) {
      return;
    }

    const geom = entityGeometryRef.current;
    if (!geom) {
      return;
    }

    const meshes = entityMeshesRef.current;
    const nameText = entityNameTextRef.current;
    const renderPos = entityRenderPosRef.current;
    const prevTilePos = previousTilePosRef.current;

    const aliveIds = new Set<string>();

    for (const entity of entities) {
      if (entity.isDead) {
        continue;
      }

      aliveIds.add(entity.id);

      const targetX = entity.pos.x + 0.5;
      const targetZ = entity.pos.y + 0.5;

      const tileAt = world.map[entity.pos.y]?.[entity.pos.x];
      const entityY = ENTITY_Y_OFFSET;

      const prev = prevTilePos.get(entity.id);
      const movedTiles = prev
        ? Math.hypot(entity.pos.x - prev.x, entity.pos.y - prev.y)
        : 0;

      const shouldSnap =
        typeof teleportSnapDistance === "number" &&
        teleportSnapDistance > 0 &&
        prev !== undefined &&
        movedTiles >= teleportSnapDistance;

      let mesh = meshes.get(entity.id);
      if (!mesh) {
        const desired =
          resolveColor(entity.color) ??
          ENTITY_COLOR[entity.type] ??
          0xffffff;
        const mat = new THREE.MeshBasicMaterial({
          color: desired,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.userData = { entityId: entity.id };
        entitiesGroup.add(mesh);
        meshes.set(entity.id, mesh);
      } else {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const desired =
          resolveColor(entity.color) ??
          ENTITY_COLOR[entity.type] ??
          0xffffff;
        if ((mat.color?.getHex?.() ?? desired) !== desired) {
          mat.color.setHex(desired);
        }
      }

      const trimmedName = typeof entity.name === "string" ? entity.name.trim() : "";
      const shouldShowName = trimmedName.length > 0;

      if (shouldShowName) {
        let text = nameText.get(entity.id);
        const existingName = (text?.userData as any)?.labelName as string | undefined;

        if (!text || existingName !== trimmedName) {
          if (text) {
            entitiesGroup.remove(text);
            text.dispose();
            nameText.delete(entity.id);
          }


          const desired =
            resolveColor(entity.color) ??
            ENTITY_COLOR[entity.type] ??
            0xffffff;

          text = new Text();
          text.text = trimmedName;
          text.fontSize = 0.28;
          text.color = 0xffffff;
          (text as any).outlineWidth = 0.02;
          (text as any).outlineColor = 0x000000;
          (text as any).outlineOpacity = 0.9;
          (text as any).strokeWidth = 0;
          (text as any).strokeColor = desired;
          (text as any).strokeOpacity = 0;
          (text as any).anchorX = "center";
          (text as any).anchorY = "bottom";
          text.renderOrder = 1002;
          text.frustumCulled = false;

          // Ensure it draws on top like UI.
          const mat = text.material as THREE.Material | undefined;
          if (mat) {
            (mat as any).transparent = true;
            (mat as any).depthTest = false;
            (mat as any).depthWrite = false;
          }

          text.userData = { ...(text.userData as any), entityId: entity.id, labelName: trimmedName };
          entitiesGroup.add(text);
          nameText.set(entity.id, text);
          text.sync();
        }
      } else {
        const text = nameText.get(entity.id);
        if (text) {
          entitiesGroup.remove(text);
          text.dispose();
          nameText.delete(entity.id);
        }
      }

      const rp = renderPos.get(entity.id);
      if (!rp || shouldSnap) {
        renderPos.set(entity.id, { x: targetX, y: targetZ });
        mesh.position.set(targetX, entityY, targetZ);

        const text = nameText.get(entity.id);
        if (text) {
          text.position.set(targetX, entityY + ENTITY_LABEL_Y_OFFSET, targetZ);
          text.visible = tileAt?.isVisible === true;
        }
      }

      prevTilePos.set(entity.id, { x: entity.pos.x, y: entity.pos.y });
    }

    // Remove meshes for entities that no longer exist / died
    for (const [id, mesh] of meshes.entries()) {
      if (aliveIds.has(id)) {
        continue;
      }
      entitiesGroup.remove(mesh);
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
      meshes.delete(id);
      renderPos.delete(id);
      prevTilePos.delete(id);
    }

    // Remove labels for entities that no longer exist / died
    for (const [id, text] of nameText.entries()) {
      if (aliveIds.has(id)) {
        continue;
      }
      entitiesGroup.remove(text);
      text.dispose();
      nameText.delete(id);
    }
  }, [entities, world, teleportSnapDistance, resolveColor, sceneEpoch]);

  const activeCamera = useMemo(() => {
    return mode === "ortho2d" ? "ortho" : "perspective";
  }, [mode]);

  // Render loop
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const ortho = orthoCameraRef.current;
    const perspective = perspectiveCameraRef.current;

    if (!renderer || !scene || !ortho || !perspective) {
      return;
    }

    const renderFrame = () => {
      const now = performance.now();
      const last = lastFrameTimeRef.current ?? now;
      lastFrameTimeRef.current = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));

      const { width, height } = size;
      if (width > 0 && height > 0) {
        // Keep the drawing buffer in sync with the CSS size (CSS is 100% of container)
        renderer.setSize(width, height, false);

        const { zoom: z, cameraOffset: offset, mode: m } =
          latestParamsRef.current;

        // Selection highlight (DOM parity)
        const { world: w, entities: ents } = latestDataRef.current;
        const { selectedTargetEntityId: selId, selectedTargetPosition: selPos } =
          latestSelectionRef.current;

        const tileAt = (x: number, y: number) => w.map[y]?.[x];

        const cellOutline = selectionCellOutlineRef.current;
        const cellMat = selectionCellMaterialRef.current;
        if (cellOutline && cellMat && selPos) {
          const tile = w.map[selPos.y]?.[selPos.x];
          const isVisible = tile?.isVisible === true;
          if (isVisible) {
            const cellEntities = ents.filter(
              (e) => !e.isDead && e.pos.x === selPos.x && e.pos.y === selPos.y,
            );
            const hasSelectedEntity =
              !!selId && cellEntities.some((e) => e.id === selId);

            cellMat.color.setHex(hasSelectedEntity ? 0x22d3ee : 0xf97316);
            cellOutline.visible = true;
            cellOutline.position.set(
              selPos.x + 0.5,
              getTileTopY(tileAt(selPos.x, selPos.y)) + SELECTION_Y_OFFSET,
              selPos.y + 0.5,
            );
            cellOutline.scale.set(1.06, 1.06, 1);
          } else {
            cellOutline.visible = false;
          }
        } else if (cellOutline) {
          cellOutline.visible = false;
        }

        const ring = selectionEntityRingRef.current;
        if (ring && selId) {
          const ent = ents.find((e) => e.id === selId && !e.isDead);
          if (ent) {
            const tile = w.map[ent.pos.y]?.[ent.pos.x];
            const isVisible = tile?.isVisible === true;
            if (isVisible) {
              const entTile = tileAt(ent.pos.x, ent.pos.y);
              ring.visible = true;
              ring.position.set(ent.pos.x + 0.5, ENTITY_Y_OFFSET, ent.pos.y + 0.5);
            } else {
              ring.visible = false;
            }
          } else {
            ring.visible = false;
          }
        } else if (ring) {
          ring.visible = false;
        }

        // Smooth entity positions (in world tile units)
        const smoothing = latestParamsRef.current.movementSmoothing;
        const alpha =
          typeof smoothing === "number" && smoothing > 0
            ? 1 - Math.exp(-smoothing * dt)
            : 1;

        const meshes = entityMeshesRef.current;
        const renderPos = entityRenderPosRef.current;
        const nameText = entityNameTextRef.current;

        for (const entity of ents) {
          // if (entity.isDead) {
          //   continue;
          // }

          const mesh = meshes.get(entity.id);
          if (!mesh) {
            continue;
          }

          const targetX = entity.pos.x + 0.5;
          const targetZ = entity.pos.y + 0.5;

          const tileAtEntity = w.map[entity.pos.y]?.[entity.pos.x];
          const entityY = ENTITY_Y_OFFSET;

          const rp = renderPos.get(entity.id);
          if (!rp) {
            renderPos.set(entity.id, { x: targetX, y: targetZ });
            mesh.position.set(targetX, entityY, targetZ);
            continue;
          }

          rp.x += (targetX - rp.x) * alpha;
          rp.y += (targetZ - rp.y) * alpha;
          mesh.position.set(rp.x, entityY, rp.y);

          const text = nameText.get(entity.id);
          if (text) {
            text.position.set(rp.x, entityY + ENTITY_LABEL_Y_OFFSET, rp.y);
            text.visible = tileAtEntity?.isVisible === true;
          }
        }

        const cellSizePx = getCellSize(z);
        const visibleWidthTiles = width / cellSizePx;
        const visibleHeightTiles = height / cellSizePx;

        const centerX = (width / 2 - offset.x) / cellSizePx;
        const centerZ = (height / 2 - offset.y) / cellSizePx;

        const applyBillboards = (cam: THREE.Camera) => {
          const entityMeshes = entityMeshesRef.current;
          for (const mesh of entityMeshes.values()) {
            mesh.quaternion.copy(cam.quaternion);
          }

          const nameText = entityNameTextRef.current;
          for (const t of nameText.values()) {
            t.quaternion.copy(cam.quaternion);
          }
        };

        if (m === "ortho2d") {
          ortho.left = -visibleWidthTiles / 2;
          ortho.right = visibleWidthTiles / 2;
          ortho.top = visibleHeightTiles / 2;
          ortho.bottom = -visibleHeightTiles / 2;
          ortho.near = 0.01;
          ortho.far = 1000;
          ortho.position.set(centerX, 10, centerZ);
          ortho.lookAt(centerX, 0, centerZ);
          ortho.updateProjectionMatrix();

          applyBillboards(ortho);

          renderer.render(scene, ortho);
        } else {
          perspective.aspect = width / height;

          // Iso-like view: yaw ~45deg, pitch down.
          const dist = Math.max(visibleWidthTiles, visibleHeightTiles) * 1.2;
          perspective.position.set(centerX + dist, dist, centerZ + dist);
          perspective.lookAt(centerX, 0, centerZ);
          perspective.updateProjectionMatrix();

          applyBillboards(perspective);

          renderer.render(scene, perspective);
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [size, activeCamera, sceneEpoch]);

  // Pointer interactions (click + context menu)
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      // Only react to primary button clicks
      if (e.button !== 0) {
        return;
      }

      const pos = pointerToGrid(e.clientX, e.clientY);
      if (!pos) {
        return;
      }

      const { onSelectPosition: selPos, onSelectEntity: selEnt } =
        latestCallbacksRef.current;

      selPos?.(pos.x, pos.y);

      const cellEntities = getEntitiesAt(pos.x, pos.y);
      if (cellEntities.length > 0) {
        const top = cellEntities[cellEntities.length - 1];
        selEnt?.(top.id);
      } else {
        selEnt?.(null);
      }
    };

    const handleContext = (e: MouseEvent) => {
      e.preventDefault();

      const pos = pointerToGrid(e.clientX, e.clientY);
      if (!pos) {
        return;
      }

      const { onContextMenu: ctx } = latestCallbacksRef.current;
      if (!ctx) {
        return;
      }

      const cellEntities = getEntitiesAt(pos.x, pos.y);
      const data: ContextMenuData = {
        x: e.clientX,
        y: e.clientY,
        cellX: pos.x,
        cellY: pos.y,
        entities: cellEntities,
      };
      ctx(data);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", handleContext);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("contextmenu", handleContext);
    };
  }, [getEntitiesAt, pointerToGrid, sceneEpoch]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
