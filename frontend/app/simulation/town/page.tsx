"use client";

import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CharacterKey = "boy" | "girl";
type Direction = "up" | "down" | "left" | "right";
type PlaceKey = "kiosk" | "bus" | "parking" | "atm" | "safety" | "school" | "rest";
type TileKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type Point = {
  x: number;
  y: number;
};

type TileCoord = {
  col: number;
  row: number;
};

type PlaceConfig = {
  name: string;
  icon: string;
  href: string;
  color: string;
  accent: string;
  labelLines: string[];
  tiles: TileCoord[];
};

const characterConfig: Record<CharacterKey, { name: string; image: string; sprite8way: string; alt: string }> = {
  boy: {
    name: "도윤",
    image: "/assets/helper/boy_full.png",
    sprite8way: "/assets/helper/boy_8way.normalized.png",
    alt: "도윤 캐릭터",
  },
  girl: {
    name: "하늘",
    image: "/assets/helper/girl_full.png",
    sprite8way: "/assets/helper/girl_8way.normalized.png",
    alt: "하늘 캐릭터",
  },
};

type Direction8 = "down" | "down-right" | "right" | "up-right" | "up" | "up-left" | "left" | "down-left";

// Boy sprite columns (row-by-row from original 4×2 grid): clockwise from front
// down, down-right, right, up-right, up, up-left, left, down-left
const DIRECTION_TO_INDEX: Record<Direction8, number> = {
  "down": 0,
  "down-right": 1,
  "right": 2,
  "up-right": 3,
  "up": 4,
  "up-left": 5,
  "left": 6,
  "down-left": 7,
};

// Girl sprite columns (row-by-row from original 4×2 grid): counter-clockwise from front
// down, down-left, left, up-left, up, up-right, right, down-right
const GIRL_DIRECTION_TO_INDEX: Record<Direction8, number> = {
  "down": 0,
  "down-left": 1,
  "left": 2,
  "up-left": 3,
  "up": 4,
  "up-right": 5,
  "right": 6,
  "down-right": 7,
};

const get8Direction = (dx: number, dy: number): Direction8 => {
  const angle = Math.atan2(dy, dx);
  let normalizedAngle = angle;
  if (normalizedAngle < 0) {
    normalizedAngle += 2 * Math.PI;
  }
  const sector = Math.floor(((normalizedAngle + Math.PI / 8) % (2 * Math.PI)) / (Math.PI / 4));
  const directions: Direction8[] = [
    "right",
    "down-right",
    "down",
    "down-left",
    "left",
    "up-left",
    "up",
    "up-right",
  ];
  return directions[sector];
};


const GRID_COLS = 18;
const GRID_ROWS = 13;
const TILE_SIZE = 48;
const MOVE_SPEED = 2.9;
const PLAYER_SPRITE_SIZE = 66;

const TILE = {
  grass: 0,
  path: 1,
  bus: 2,
  kiosk: 3,
  school: 4,
  atm: 5,
  water: 6,
  parking: 7,
  safety: 8,
  rest: 9,
} as const;

const tileBlock = (cols: number[], rows: number[]) =>
  rows.flatMap((row) => cols.map((col) => ({ col, row })));

const PLACES: Record<PlaceKey, PlaceConfig> = {
  kiosk: {
    name: "패스트푸드",
    icon: "🍔",
    href: "/simulation/kiosk",
    color: "#ef5a3c",
    accent: "#fff0db",
    labelLines: ["패스트", "푸드"],
    tiles: tileBlock([14, 15], [1, 2]),
  },
  bus: {
    name: "버스정류장",
    icon: "🚌",
    href: "/simulation/bus",
    color: "#0f87a8",
    accent: "#d9f6ff",
    labelLines: ["버스", "정류장"],
    tiles: tileBlock([1, 2], [1, 2]),
  },
  parking: {
    name: "주차정산",
    icon: "🅿️",
    href: "/simulation/parking",
    color: "#5b6f85",
    accent: "#eef4fb",
    labelLines: ["주차", "정산"],
    tiles: tileBlock([7, 8], [1, 2]),
  },
  atm: {
    name: "은행 ATM",
    icon: "🏧",
    href: "/simulation/atm",
    color: "#2563eb",
    accent: "#dceafe",
    labelLines: ["은행", "ATM"],
    tiles: tileBlock([4, 5], [9, 10]),
  },
  safety: {
    name: "안전훈련장",
    icon: "🚨",
    href: "/simulation/safety-sos",
    color: "#dc2626",
    accent: "#ffe2df",
    labelLines: ["안전", "훈련장"],
    tiles: tileBlock([1, 2], [4, 5]),
  },
  school: {
    name: "학교",
    icon: "🏫",
    href: "/simulation/school-talk",
    color: "#7c3aed",
    accent: "#efe7ff",
    labelLines: ["학교"],
    tiles: tileBlock([10, 11], [9, 10]),
  },
  rest: {
    name: "마음쉼터",
    icon: "💚",
    href: "/emotion/check",
    color: "#16a34a",
    accent: "#ddfbe6",
    labelLines: ["마음", "쉼터"],
    tiles: tileBlock([15, 16], [9, 10]),
  },
};

const PLACE_ORDER: PlaceKey[] = ["kiosk", "bus", "parking", "atm", "safety", "school", "rest"];

const MAP_GRID: TileKind[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 2, 1, 0, 0, 0, 7, 7, 1, 0, 0, 0, 1, 3, 3, 0, 0],
  [0, 2, 2, 1, 0, 0, 0, 7, 7, 1, 0, 0, 0, 1, 3, 3, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 8, 8, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 8, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
  [6, 6, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
  [6, 6, 0, 1, 5, 5, 0, 0, 0, 1, 4, 4, 0, 0, 0, 9, 9, 0],
  [0, 0, 0, 1, 5, 5, 0, 0, 0, 1, 4, 4, 0, 0, 0, 9, 9, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const WALKABLE_TILES = new Set<TileKind>([
  TILE.path,
  TILE.bus,
  TILE.kiosk,
  TILE.school,
  TILE.atm,
  TILE.parking,
  TILE.safety,
  TILE.rest,
]);

const TILE_TO_PLACE: Partial<Record<TileKind, PlaceKey>> = {
  [TILE.bus]: "bus",
  [TILE.kiosk]: "kiosk",
  [TILE.school]: "school",
  [TILE.atm]: "atm",
  [TILE.parking]: "parking",
  [TILE.safety]: "safety",
  [TILE.rest]: "rest",
};

const DIRECTION_VECTOR: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const MOVE_KEY_IDS = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
  "keyw",
  "keya",
  "keys",
  "keyd",
  "8",
  "2",
  "4",
  "6",
  "numpad8",
  "numpad2",
  "numpad4",
  "numpad6",
]);

const INITIAL_POSITION = {
  x: 8 * TILE_SIZE + TILE_SIZE / 2,
  y: 6 * TILE_SIZE + TILE_SIZE / 2,
};

const getInitialStudentProfile = () => {
  if (typeof window === "undefined") {
    return { character: "boy" as CharacterKey, studentName: "도윤" };
  }

  const savedStudent = localStorage.getItem("haemileum_selected_student");
  if (savedStudent === "김하늘" || savedStudent === "하늘") {
    return { character: "girl" as CharacterKey, studentName: "김하늘" };
  }

  if (savedStudent === "이도윤" || savedStudent === "도윤") {
    return { character: "boy" as CharacterKey, studentName: "이도윤" };
  }

  return { character: "boy" as CharacterKey, studentName: "도윤" };
};

const tileCenter = (tile: TileCoord): Point => ({
  x: tile.col * TILE_SIZE + TILE_SIZE / 2,
  y: tile.row * TILE_SIZE + TILE_SIZE / 2,
});

const tileKey = (tile: TileCoord) => `${tile.col}:${tile.row}`;

const getTileKind = (col: number, row: number): TileKind | null => {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
  return MAP_GRID[row][col];
};

const getTileFromPosition = (position: Point): TileCoord => ({
  col: Math.floor(position.x / TILE_SIZE),
  row: Math.floor(position.y / TILE_SIZE),
});

const isWalkableTile = (tile: TileCoord) => {
  const tileKind = getTileKind(tile.col, tile.row);
  return tileKind !== null && WALKABLE_TILES.has(tileKind);
};

const getPlaceFromTile = (tile: TileCoord): PlaceKey | null => {
  const tileKind = getTileKind(tile.col, tile.row);
  return tileKind === null ? null : TILE_TO_PLACE[tileKind] ?? null;
};

const findNearestWalkableTile = (startCol: number, startRow: number): TileCoord | null => {
  const start = { col: startCol, row: startRow };
  if (isWalkableTile(start)) return start;

  for (let radius = 1; radius <= Math.max(GRID_COLS, GRID_ROWS); radius++) {
    let nearest: TileCoord | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let row = startRow - radius; row <= startRow + radius; row++) {
      for (let col = startCol - radius; col <= startCol + radius; col++) {
        if (Math.abs(col - startCol) !== radius && Math.abs(row - startRow) !== radius) {
          continue;
        }

        const candidate = { col, row };
        if (!isWalkableTile(candidate)) continue;

        const distance = Math.abs(col - startCol) + Math.abs(row - startRow);
        if (distance < nearestDistance) {
          nearest = candidate;
          nearestDistance = distance;
        }
      }
    }

    if (nearest) return nearest;
  }

  return null;
};

const findPath = (start: TileCoord, goal: TileCoord): TileCoord[] | null => {
  if (!isWalkableTile(start) || !isWalkableTile(goal)) return null;

  const startKey = tileKey(start);
  const goalKey = tileKey(goal);
  const queue: TileCoord[] = [start];
  const visited = new Set([startKey]);
  const cameFrom = new Map<string, string | null>([[startKey, null]]);
  const coords = new Map<string, TileCoord>([[startKey, start]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (tileKey(current) === goalKey) {
      const path: TileCoord[] = [];
      let currentKey: string | null = goalKey;

      while (currentKey && currentKey !== startKey) {
        const coord = coords.get(currentKey);
        if (!coord) return null;
        path.unshift(coord);
        currentKey = cameFrom.get(currentKey) ?? null;
      }

      return path;
    }

    const neighbors = [
      { col: current.col + 1, row: current.row },
      { col: current.col - 1, row: current.row },
      { col: current.col, row: current.row + 1 },
      { col: current.col, row: current.row - 1 },
    ];

    for (const neighbor of neighbors) {
      const neighborKey = tileKey(neighbor);
      if (visited.has(neighborKey) || !isWalkableTile(neighbor)) continue;

      visited.add(neighborKey);
      cameFrom.set(neighborKey, tileKey(current));
      coords.set(neighborKey, neighbor);
      queue.push(neighbor);
    }
  }

  return null;
};

const findBestPathToPlace = (start: TileCoord, placeKey: PlaceKey): Point[] | null => {
  let bestPath: TileCoord[] | null = null;

  for (const tile of PLACES[placeKey].tiles) {
    const path = findPath(start, tile);
    if (!path) continue;

    if (!bestPath || path.length < bestPath.length) {
      bestPath = path;
    }
  }

  return bestPath?.map(tileCenter) ?? null;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
};

const getPlaceBounds = (tiles: TileCoord[]) => {
  const cols = tiles.map((tile) => tile.col);
  const rows = tiles.map((tile) => tile.row);

  return {
    minCol: Math.min(...cols),
    maxCol: Math.max(...cols),
    minRow: Math.min(...rows),
    maxRow: Math.max(...rows),
  };
};

const getMoveResult = (position: Point, dx: number, dy: number) => {
  const nextPosition = { x: position.x + dx, y: position.y + dy };
  const nextTile = getTileFromPosition(nextPosition);

  if (!isWalkableTile(nextTile)) {
    return { blocked: true, position };
  }

  const placeKey = getPlaceFromTile(nextTile);
  if (placeKey) {
    return { blocked: false, position, placeKey };
  }

  return { blocked: false, position: nextPosition };
};

export default function TownSimulationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const playerPositionRef = useRef<Point>(INITIAL_POSITION);
  const playerDirectionRef = useRef<Direction8>("down");
  const activeKeys = useRef<Record<string, boolean>>({});
  const heldDirection = useRef<Direction | null>(null);
  const pathQueue = useRef<Point[]>([]);
  const transitionRef = useRef<PlaceKey | null>(null);
  const walkingRef = useRef(false);
  const activePlaceTargetRef = useRef<PlaceKey | null>(null);

  const [{ character, studentName }] = useState(getInitialStudentProfile);
  const [playerPosition, setPlayerPosition] = useState<Point>(INITIAL_POSITION);
  const [playerDirection, setPlayerDirection] = useState<Direction8>("down");
  const [transitioning, setTransitioning] = useState<PlaceKey | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<PlaceKey | null>(null);
  const [activePlaceTarget, setActivePlaceTarget] = useState<PlaceKey | null>(null);
  const [wobble, setWobble] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [spriteImageReady, setSpriteImageReady] = useState(false);

  const setActivePlace = useCallback((placeKey: PlaceKey | null) => {
    if (activePlaceTargetRef.current === placeKey) return;

    activePlaceTargetRef.current = placeKey;
    setActivePlaceTarget(placeKey);
  }, []);

  const setWalkingState = useCallback((walking: boolean) => {
    if (walkingRef.current === walking) return;

    walkingRef.current = walking;
    setIsWalking(walking);
    if (!walking) setWobble(0);
  }, []);

  const commitPlayerPosition = useCallback((position: Point) => {
    playerPositionRef.current = position;
    setPlayerPosition(position);
  }, []);

  const commitPlayerDirection = useCallback((dir: Direction8) => {
    playerDirectionRef.current = dir;
    setPlayerDirection(dir);
  }, []);

  const handleTriggerEnter = useCallback(
    (placeKey: PlaceKey) => {
      if (transitionRef.current) return;

      transitionRef.current = placeKey;
      activeKeys.current = {};
      heldDirection.current = null;
      pathQueue.current = [];

      setTransitioning(placeKey);
      setActivePlace(null);
      setWalkingState(false);

      window.setTimeout(() => {
        router.push(PLACES[placeKey].href);
      }, 700);
    },
    [router, setActivePlace, setWalkingState]
  );

  const startPath = useCallback(
    (path: Point[] | null, placeKey: PlaceKey | null = null) => {
      if (!path || path.length === 0 || transitionRef.current) return;

      pathQueue.current = path;
      heldDirection.current = null;
      setActivePlace(placeKey);
      setWalkingState(true);
    },
    [setActivePlace, setWalkingState]
  );

  const walkToPlace = useCallback(
    (placeKey: PlaceKey) => {
      const startTile = getTileFromPosition(playerPositionRef.current);
      const path = findBestPathToPlace(startTile, placeKey);

      if (!path) {
        handleTriggerEnter(placeKey);
        return;
      }

      startPath(path, placeKey);
    },
    [handleTriggerEnter, startPath]
  );

  useEffect(() => {
    const audio = new Audio("/assets/sound/town.mp3");
    audio.loop = true;
    audio.volume = 0.4;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    // 브라우저 자동재생 정책 우회: 첫 사용자 상호작용 시 재생
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, []);

  useEffect(() => {
    const spriteImg = new window.Image();
    spriteImageRef.current = spriteImg;
    spriteImg.src = characterConfig[character].sprite8way;
    spriteImg.onload = () => setSpriteImageReady(true);

    return () => {
      spriteImg.onload = null;
    };
  }, [character]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const code = event.code.toLowerCase();
      if (!MOVE_KEY_IDS.has(key) && !MOVE_KEY_IDS.has(code)) return;

      event.preventDefault();
      activeKeys.current[key] = true;
      activeKeys.current[code] = true;
      pathQueue.current = [];
      setActivePlace(null);
      setWalkingState(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const code = event.code.toLowerCase();
      if (!MOVE_KEY_IDS.has(key) && !MOVE_KEY_IDS.has(code)) return;

      event.preventDefault();
      activeKeys.current[key] = false;
      activeKeys.current[code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setActivePlace, setWalkingState]);

  useEffect(() => {
    let animationId = 0;

    const getKeyboardVector = () => {
      const keys = activeKeys.current;
      let dx = 0;
      let dy = 0;

      if (keys.arrowup || keys.w || keys.keyw || keys["8"] || keys.numpad8) dy -= 1;
      if (keys.arrowdown || keys.s || keys.keys || keys["2"] || keys.numpad2) dy += 1;
      if (keys.arrowleft || keys.a || keys.keya || keys["4"] || keys.numpad4) dx -= 1;
      if (keys.arrowright || keys.d || keys.keyd || keys["6"] || keys.numpad6) dx += 1;

      if (dx === 0 && dy === 0) return null;
      return { x: dx, y: dy };
    };

    const tick = () => {
      if (!transitionRef.current) {
        const keyVector = getKeyboardVector();
        const padVector = heldDirection.current ? DIRECTION_VECTOR[heldDirection.current] : null;
        const manualVector = keyVector ?? padVector;

        if (manualVector) {
          pathQueue.current = [];
          const length = Math.hypot(manualVector.x, manualVector.y) || 1;
          const dx = (manualVector.x / length) * MOVE_SPEED;
          const dy = (manualVector.y / length) * MOVE_SPEED;

          const newDir = get8Direction(dx, dy);
          commitPlayerDirection(newDir);

          const result = getMoveResult(
            playerPositionRef.current,
            dx,
            dy
          );

          setWalkingState(true);
          setWobble((current) => (current + 0.15) % (Math.PI * 2));

          if (result.placeKey) {
            handleTriggerEnter(result.placeKey);
          } else if (!result.blocked) {
            commitPlayerPosition(result.position);
          }
        } else if (pathQueue.current.length > 0) {
          const nextWaypoint = pathQueue.current[0];
          const currentPosition = playerPositionRef.current;
          const dx = nextWaypoint.x - currentPosition.x;
          const dy = nextWaypoint.y - currentPosition.y;
          const distance = Math.hypot(dx, dy);

          setWalkingState(true);
          setWobble((current) => (current + 0.15) % (Math.PI * 2));

          if (distance > 0) {
            const newDir = get8Direction(dx, dy);
            commitPlayerDirection(newDir);
          }

          if (distance <= MOVE_SPEED) {
            const waypointPlace = getPlaceFromTile(getTileFromPosition(nextWaypoint));
            if (waypointPlace) {
              handleTriggerEnter(waypointPlace);
            } else {
              pathQueue.current.shift();
              commitPlayerPosition(nextWaypoint);
            }
          } else {
            const result = getMoveResult(
              currentPosition,
              (dx / distance) * MOVE_SPEED,
              (dy / distance) * MOVE_SPEED
            );

            if (result.placeKey) {
              handleTriggerEnter(result.placeKey);
            } else if (result.blocked) {
              pathQueue.current = [];
              setActivePlace(null);
            } else {
              commitPlayerPosition(result.position);
            }
          }
        } else {
          setWalkingState(false);
          setActivePlace(null);
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [commitPlayerPosition, commitPlayerDirection, handleTriggerEnter, setActivePlace, setWalkingState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tileKind = MAP_GRID[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tileKind === TILE.grass) {
          ctx.fillStyle = (row + col) % 2 === 0 ? "#a7e7a1" : "#96dc92";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = "#57b66a";
          ctx.fillRect(x + 10, y + 12, 3, 8);
          ctx.fillRect(x + 28, y + 28, 3, 7);
        } else if (tileKind === TILE.path) {
          ctx.fillStyle = "#f4df9c";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = "#e4c875";
          ctx.fillRect(x + 4, y + 21, TILE_SIZE - 8, 2);
        } else if (tileKind === TILE.water) {
          ctx.fillStyle = "#7ec8f5";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#dff7ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 18);
          ctx.quadraticCurveTo(x + 16, y + 10, x + 24, y + 18);
          ctx.quadraticCurveTo(x + 32, y + 26, x + 40, y + 18);
          ctx.stroke();
        } else {
          const placeKey = TILE_TO_PLACE[tileKind];
          ctx.fillStyle = placeKey ? PLACES[placeKey].accent : "#e7ecf2";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    for (const placeKey of PLACE_ORDER) {
      const place = PLACES[placeKey];
      const bounds = getPlaceBounds(place.tiles);
      const x = bounds.minCol * TILE_SIZE + 6;
      const y = bounds.minRow * TILE_SIZE + 6;
      const width = (bounds.maxCol - bounds.minCol + 1) * TILE_SIZE - 12;
      const height = (bounds.maxRow - bounds.minRow + 1) * TILE_SIZE - 12;
      const centerX = x + width / 2;
      const isActive = hoveredPlace === placeKey || activePlaceTarget === placeKey;

      ctx.fillStyle = place.color;
      drawRoundedRect(ctx, x, y, width, height, 8);

      ctx.lineWidth = isActive ? 5 : 2;
      ctx.strokeStyle = isActive ? "#111827" : "rgba(255,255,255,0.8)";
      ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "26px sans-serif";
      ctx.fillText(place.icon, centerX, y + 26);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      place.labelLines.forEach((line, index) => {
        const offset = place.labelLines.length === 1 ? 58 : 52 + index * 15;
        ctx.fillText(line, centerX, y + offset);
      });
    }

    const spriteImage = spriteImageRef.current;
    const playerWidth = PLAYER_SPRITE_SIZE;
    const playerHeight = PLAYER_SPRITE_SIZE;
    const playerX = playerPosition.x - playerWidth / 2;
    const playerY = playerPosition.y - playerHeight + 11;

    // Draw shadow under feet (drawn before character so character overlays it)
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.beginPath();
    const shadowScale = isWalking ? 1 - Math.abs(Math.sin(wobble * 2)) * 0.15 : 1;
    ctx.ellipse(
      playerPosition.x,
      playerPosition.y + 11,
      16 * shadowScale,
      6 * shadowScale,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();

    // Draw character with walking bounce and wobble
    const bounceY = isWalking ? Math.abs(Math.sin(wobble * 2)) * 4 : 0;

    ctx.save();
    ctx.translate(playerX + playerWidth / 2, playerY + playerHeight / 2 - bounceY);
    if (isWalking) {
      ctx.rotate(Math.sin(wobble) * 0.08);
    }

    if (spriteImageReady && spriteImage) {
      const frameWidth = spriteImage.width / 8;
      const frameHeight = spriteImage.height;
      const directionMap = character === "girl" ? GIRL_DIRECTION_TO_INDEX : DIRECTION_TO_INDEX;
      const colIndex = directionMap[playerDirection];
      const sx = colIndex * frameWidth;
      const sy = 0;

      ctx.drawImage(
        spriteImage,
        sx,
        sy,
        frameWidth,
        frameHeight,
        -playerWidth / 2,
        -playerHeight / 2,
        playerWidth,
        playerHeight
      );
    } else {
      ctx.fillStyle = character === "boy" ? "#3b82f6" : "#ec4899";
      drawRoundedRect(ctx, -playerWidth / 2, -playerHeight / 2, playerWidth, playerHeight, 8);
    }
    ctx.restore();

    const bubbleText = hoveredPlace ? PLACES[hoveredPlace].name : "어디로 갈까요?";
    const bubbleWidth = Math.max(112, bubbleText.length * 15);
    const bubbleHeight = 28;
    const bubbleX = playerPosition.x - bubbleWidth / 2;
    const bubbleY = playerY - 34;

    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 9);
    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 2;
    ctx.strokeRect(bubbleX + 1, bubbleY + 1, bubbleWidth - 2, bubbleHeight - 2);

    ctx.fillStyle = "#065f46";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bubbleText, playerPosition.x, bubbleY + bubbleHeight / 2);
  }, [
    activePlaceTarget,
    character,
    hoveredPlace,
    isWalking,
    spriteImageReady,
    playerPosition,
    playerDirection,
    wobble,
  ]);

  const getCanvasTile = (event: MouseEvent<HTMLCanvasElement>): TileCoord => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return {
      col: Math.floor(x / TILE_SIZE),
      row: Math.floor(y / TILE_SIZE),
    };
  };

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (transitionRef.current) return;

    const clickedTile = getCanvasTile(event);
    const clickedPlace = getPlaceFromTile(clickedTile);

    if (clickedPlace) {
      walkToPlace(clickedPlace);
      return;
    }

    const targetTile = findNearestWalkableTile(clickedTile.col, clickedTile.row);
    if (!targetTile) return;

    const startTile = getTileFromPosition(playerPositionRef.current);
    const path = findPath(startTile, targetTile)?.map(tileCenter) ?? null;
    startPath(path);
  };

  const handleCanvasMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const tile = getCanvasTile(event);
    const place = getPlaceFromTile(tile);
    setHoveredPlace((current) => (current === place ? current : place));
  };

  const handlePadDown = (direction: Direction, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (transitionRef.current) return;

    heldDirection.current = direction;
    pathQueue.current = [];
    setActivePlace(null);
    setWalkingState(true);
  };

  const handlePadUp = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    heldDirection.current = null;
  };

  const transitionPlace = transitioning ? PLACES[transitioning] : null;
  const currentPlaceName = activePlaceTarget
    ? PLACES[activePlaceTarget].name
    : hoveredPlace
      ? PLACES[hoveredPlace].name
      : "해밀 생활마을";

  return (
    <main className="min-h-screen bg-[#eef7f1] px-4 py-5 text-slate-900">
      {transitionPlace && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
          <span className="mb-4 inline-block text-6xl">{transitionPlace.icon}</span>
          <p className="text-2xl font-black tracking-wide">{transitionPlace.name}으로 이동 중...</p>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-emerald-700">해밀 생활마을</p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              {studentName} 학생, 오늘 갈 장소를 골라요
            </h1>
          </div>
          <Link
            href="/student/home"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            돌아가기
          </Link>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative overflow-hidden rounded-lg border-4 border-emerald-700 bg-white shadow-xl">
            <canvas
              ref={canvasRef}
              width={GRID_COLS * TILE_SIZE}
              height={GRID_ROWS * TILE_SIZE}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHoveredPlace(null)}
              className="block h-auto w-full cursor-pointer select-none touch-manipulation"
            />
            <div className="absolute left-3 top-3 rounded-lg bg-white/92 px-3 py-2 text-sm font-black text-emerald-900 shadow-sm backdrop-blur">
              {currentPlaceName}
            </div>
          </div>

          <aside className="grid content-start gap-2">
            {PLACE_ORDER.map((placeKey) => {
              const place = PLACES[placeKey];
              const isActive = activePlaceTarget === placeKey || hoveredPlace === placeKey;

              return (
                <button
                  key={placeKey}
                  type="button"
                  onClick={() => walkToPlace(placeKey)}
                  className={`flex h-12 items-center gap-3 rounded-lg border px-3 text-left text-sm font-black shadow-sm transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50"
                  }`}
                >
                  <span
                    className="grid size-8 place-items-center rounded-lg text-lg"
                    style={{ backgroundColor: isActive ? "rgba(255,255,255,0.18)" : place.accent }}
                  >
                    {place.icon}
                  </span>
                  <span>{place.name}</span>
                </button>
              );
            })}
          </aside>
        </section>

        <section className="mx-auto grid w-48 grid-cols-3 gap-2">
          <div />
          <button
            type="button"
            aria-label="위로 이동"
            onPointerDown={(event) => handlePadDown("up", event)}
            onPointerUp={handlePadUp}
            onPointerLeave={handlePadUp}
            onPointerCancel={handlePadUp}
            className="grid h-12 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-95"
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            aria-label="왼쪽으로 이동"
            onPointerDown={(event) => handlePadDown("left", event)}
            onPointerUp={handlePadUp}
            onPointerLeave={handlePadUp}
            onPointerCancel={handlePadUp}
            className="grid h-12 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-95"
          >
            ◀
          </button>
          <div className="grid h-12 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
            ●
          </div>
          <button
            type="button"
            aria-label="오른쪽으로 이동"
            onPointerDown={(event) => handlePadDown("right", event)}
            onPointerUp={handlePadUp}
            onPointerLeave={handlePadUp}
            onPointerCancel={handlePadUp}
            className="grid h-12 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-95"
          >
            ▶
          </button>

          <div />
          <button
            type="button"
            aria-label="아래로 이동"
            onPointerDown={(event) => handlePadDown("down", event)}
            onPointerUp={handlePadUp}
            onPointerLeave={handlePadUp}
            onPointerCancel={handlePadUp}
            className="grid h-12 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-95"
          >
            ▼
          </button>
          <div />
        </section>
      </div>
    </main>
  );
}
