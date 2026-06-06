"use client";

import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Direction = "up" | "down" | "left" | "right";
type Terrain = "grass" | "road" | "plaza" | "parking" | "water";
type PoiStatus = "ready" | "planned";

type Point = {
  x: number;
  y: number;
};

type Poi = {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  status: PoiStatus;
  href?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  entry: Point;
  color: string;
};

const TILE_SIZE = 44;
const MAP_COLS = 26;
const MAP_ROWS = 18;

const readyPois: Poi[] = [
  {
    id: "fastfood",
    title: "패스트푸드",
    subtitle: "키오스크 주문 미션",
    label: "FAST",
    status: "ready",
    href: "/simulation/kiosk",
    x: 2,
    y: 2,
    w: 3,
    h: 2,
    entry: { x: 3, y: 4 },
    color: "#f59e0b",
  },
  {
    id: "bus",
    title: "버스정류장",
    subtitle: "버스 타기 미션",
    label: "BUS",
    status: "ready",
    href: "/simulation/bus",
    x: 8,
    y: 1,
    w: 3,
    h: 2,
    entry: { x: 9, y: 3 },
    color: "#38bdf8",
  },
  {
    id: "parking",
    title: "주차정산",
    subtitle: "주차장 정산 미션",
    label: "PARK",
    status: "ready",
    href: "/simulation/parking",
    x: 14,
    y: 1,
    w: 5,
    h: 4,
    entry: { x: 16, y: 6 },
    color: "#94a3b8",
  },
  {
    id: "atm",
    title: "은행 ATM",
    subtitle: "ATM 사용 미션",
    label: "ATM",
    status: "ready",
    href: "/simulation/atm",
    x: 21,
    y: 2,
    w: 3,
    h: 2,
    entry: { x: 22, y: 4 },
    color: "#60a5fa",
  },
  {
    id: "safety",
    title: "안전훈련장",
    subtitle: "사기 방어와 마음 관리",
    label: "SAFE",
    status: "ready",
    href: "/simulation/safety-sos",
    x: 2,
    y: 8,
    w: 3,
    h: 2,
    entry: { x: 3, y: 10 },
    color: "#2dd4bf",
  },
  {
    id: "school",
    title: "학교",
    subtitle: "학교생활 대화 미션",
    label: "SCH",
    status: "ready",
    href: "/simulation/school-talk",
    x: 8,
    y: 8,
    w: 4,
    h: 3,
    entry: { x: 10, y: 11 },
    color: "#a78bfa",
  },
  {
    id: "rest",
    title: "마음쉼터",
    subtitle: "마음 기록",
    label: "REST",
    status: "ready",
    href: "/emotion/check",
    x: 21,
    y: 8,
    w: 3,
    h: 2,
    entry: { x: 22, y: 10 },
    color: "#fb7185",
  },
];

const plannedPois: Poi[] = [
  {
    id: "cafe",
    title: "카페",
    subtitle: "준비 중",
    label: "CAFE",
    status: "planned",
    x: 2,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 3, y: 12 },
    color: "#b45309",
  },
  {
    id: "foodcourt",
    title: "푸드코트",
    subtitle: "준비 중",
    label: "FOOD",
    status: "planned",
    x: 6,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 7, y: 12 },
    color: "#f97316",
  },
  {
    id: "table-order",
    title: "테이블 오더 식당",
    subtitle: "준비 중",
    label: "ORDER",
    status: "planned",
    x: 10,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 11, y: 12 },
    color: "#ef4444",
  },
  {
    id: "catchtable",
    title: "캐치테이블 식당",
    subtitle: "준비 중",
    label: "CATCH",
    status: "planned",
    x: 14,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 15, y: 12 },
    color: "#dc2626",
  },
  {
    id: "expressbus",
    title: "고속버스 터미널",
    subtitle: "준비 중",
    label: "EXP",
    status: "planned",
    x: 18,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 19, y: 12 },
    color: "#0284c7",
  },
  {
    id: "ktx",
    title: "KTX역",
    subtitle: "준비 중",
    label: "KTX",
    status: "planned",
    x: 22,
    y: 13,
    w: 3,
    h: 2,
    entry: { x: 23, y: 12 },
    color: "#2563eb",
  },
  {
    id: "airport",
    title: "공항",
    subtitle: "준비 중",
    label: "AIR",
    status: "planned",
    x: 2,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 3, y: 15 },
    color: "#0ea5e9",
  },
  {
    id: "hospital",
    title: "병원",
    subtitle: "준비 중",
    label: "HOSP",
    status: "planned",
    x: 6,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 7, y: 15 },
    color: "#16a34a",
  },
  {
    id: "admin",
    title: "행정복지센터",
    subtitle: "준비 중",
    label: "ADMIN",
    status: "planned",
    x: 10,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 11, y: 15 },
    color: "#64748b",
  },
  {
    id: "convenience",
    title: "편의점(택배)",
    subtitle: "준비 중",
    label: "CVS",
    status: "planned",
    x: 14,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 15, y: 15 },
    color: "#22c55e",
  },
  {
    id: "gas",
    title: "셀프주유소",
    subtitle: "준비 중",
    label: "GAS",
    status: "planned",
    x: 18,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 19, y: 15 },
    color: "#eab308",
  },
  {
    id: "bath",
    title: "목욕탕",
    subtitle: "준비 중",
    label: "BATH",
    status: "planned",
    x: 22,
    y: 16,
    w: 3,
    h: 1,
    entry: { x: 23, y: 15 },
    color: "#06b6d4",
  },
];

const pois = [...readyPois, ...plannedPois];
const poiByEntry = new Map(pois.map((poi) => [`${poi.entry.x},${poi.entry.y}`, poi]));
const buildingCells = new Set<string>();
const accessPocketCells = new Set([
  "3,4",
  "9,3",
  "9,4",
  "16,6",
  "22,4",
  "3,10",
  "10,11",
  "21,10",
  "22,10",
]);
pois.forEach((poi) => {
  for (let y = poi.y; y < poi.y + poi.h; y += 1) {
    for (let x = poi.x; x < poi.x + poi.w; x += 1) {
      buildingCells.add(`${x},${y}`);
    }
  }
});

const readSelectedStudent = () => {
  if (typeof window === "undefined") return "도윤";
  return localStorage.getItem("haemileum_selected_student") || "도윤";
};

const getCharacterImage = (studentName: string) =>
  studentName.includes("하늘") || studentName.toLowerCase().includes("girl")
    ? "/assets/helper/girl_full.png"
    : "/assets/helper/boy_full.png";

const getTerrain = (x: number, y: number): Terrain => {
  if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return "grass";
  if (accessPocketCells.has(`${x},${y}`)) return "plaza";
  if (y === 5 || y === 12 || y === 15 || x === 5 || x === 13 || x === 20) return "road";
  if ((x >= 14 && x <= 18 && y >= 1 && y <= 5) || (x >= 15 && x <= 18 && y === 6)) {
    return "parking";
  }
  if ((x >= 11 && x <= 15 && y >= 7 && y <= 10) || (x >= 1 && x <= 4 && y >= 10 && y <= 11)) {
    return "plaza";
  }
  if (x >= 23 && y >= 5 && y <= 10) return "water";
  return "grass";
};

const getTerrainColor = (terrain: Terrain) => {
  switch (terrain) {
    case "road":
      return "#d9ad74";
    case "plaza":
      return "#d6d3d1";
    case "parking":
      return "#cbd5e1";
    case "water":
      return "#93c5fd";
    default:
      return "#79b96a";
  }
};

const isWalkable = (point: Point) => {
  const key = `${point.x},${point.y}`;
  const terrain = getTerrain(point.x, point.y);
  return (
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < MAP_COLS &&
    point.y < MAP_ROWS &&
    !buildingCells.has(key) &&
    terrain !== "grass" &&
    terrain !== "water"
  );
};

export default function TownSimulationPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const routingRef = useRef(false);
  const [studentName] = useState(() => readSelectedStudent());
  const [player, setPlayer] = useState<Point>({ x: 12, y: 10 });
  const [message, setMessage] = useState("어디로 갈까요? 개발된 미션 입구나 준비 중인 장소를 찾아요.");
  const [nearPoi, setNearPoi] = useState<Poi | null>(null);

  const characterImage = useMemo(() => getCharacterImage(studentName), [studentName]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLS; x += 1) {
        const terrain = getTerrain(x, y);
        const left = x * TILE_SIZE;
        const top = y * TILE_SIZE;

        ctx.fillStyle = getTerrainColor(terrain);
        ctx.fillRect(left, top, TILE_SIZE, TILE_SIZE);

        if (terrain === "road") {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fillRect(left + 8, top + TILE_SIZE / 2 - 2, TILE_SIZE - 16, 4);
        }

        if (terrain === "parking") {
          ctx.strokeStyle = "rgba(51,65,85,0.35)";
          ctx.strokeRect(left + 6, top + 8, TILE_SIZE - 12, TILE_SIZE - 16);
        }

        if (terrain === "grass") {
          ctx.fillStyle = "rgba(21,128,61,0.18)";
          ctx.beginPath();
          ctx.arc(left + 12, top + 12, 5, 0, Math.PI * 2);
          ctx.arc(left + 31, top + 29, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = "rgba(255,255,255,0.13)";
        ctx.strokeRect(left, top, TILE_SIZE, TILE_SIZE);
      }
    }

    pois.forEach((poi) => {
      const left = poi.x * TILE_SIZE;
      const top = poi.y * TILE_SIZE;
      const width = poi.w * TILE_SIZE;
      const height = poi.h * TILE_SIZE;
      const isReady = poi.status === "ready";
      const isNear = nearPoi?.id === poi.id;

      ctx.fillStyle = poi.color;
      ctx.fillRect(left + 3, top + 3, width - 6, height - 6);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(left + 8, top + 8, width - 16, 12);

      ctx.strokeStyle = isNear ? "#fef3c7" : isReady ? "#0f172a" : "#64748b";
      ctx.lineWidth = isNear ? 4 : 2;
      ctx.strokeRect(left + 3, top + 3, width - 6, height - 6);
      ctx.lineWidth = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(poi.label, left + width / 2, top + height / 2 + 4);

      const entryLeft = poi.entry.x * TILE_SIZE;
      const entryTop = poi.entry.y * TILE_SIZE;
      ctx.fillStyle = isReady ? "#22c55e" : "#facc15";
      ctx.fillRect(entryLeft + 13, entryTop + 13, TILE_SIZE - 26, TILE_SIZE - 26);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(entryLeft + 13, entryTop + 13, TILE_SIZE - 26, TILE_SIZE - 26);
    });

    const image = playerImageRef.current;
    const playerLeft = player.x * TILE_SIZE + 6;
    const playerTop = player.y * TILE_SIZE + 2;

    ctx.fillStyle = "rgba(15,23,42,0.24)";
    ctx.beginPath();
    ctx.ellipse(
      player.x * TILE_SIZE + TILE_SIZE / 2,
      player.y * TILE_SIZE + 38,
      16,
      6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (image?.complete) {
      ctx.drawImage(image, playerLeft, playerTop, 34, 40);
    } else {
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(player.x * TILE_SIZE + TILE_SIZE / 2, player.y * TILE_SIZE + 22, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "900 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(studentName, player.x * TILE_SIZE + TILE_SIZE / 2, player.y * TILE_SIZE - 4);
  }, [nearPoi, player, studentName]);

  useEffect(() => {
    const image = new window.Image();
    image.src = characterImage;
    image.onload = drawMap;
    playerImageRef.current = image;
  }, [characterImage, drawMap]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  const updateLocationMessage = useCallback(
    (next: Point) => {
      const entryPoi = poiByEntry.get(`${next.x},${next.y}`);
      if (entryPoi) {
        setNearPoi(entryPoi);
        const href = entryPoi.href;
        if (entryPoi.status === "ready" && href) {
          setMessage(`${entryPoi.title}에 도착했어요. ${entryPoi.subtitle}으로 이동합니다.`);
          routingRef.current = true;
          window.setTimeout(() => router.push(href), 520);
          return;
        }

        setMessage(`${entryPoi.title}은 아직 미션을 개발 중이에요. 지도에는 위치만 표시했어요.`);
        return;
      }

      const nearby = pois.find(
        (poi) =>
          Math.abs(poi.entry.x - next.x) + Math.abs(poi.entry.y - next.y) === 1
      );

      setNearPoi(nearby ?? null);
      setMessage(
        nearby
          ? `${nearby.title} 입구가 가까워요. 한 칸 더 이동해요.`
          : "어디로 갈까요? 초록 입구는 개발 완료, 노란 입구는 준비 중이에요."
      );
    },
    [router]
  );

  const movePlayer = useCallback(
    (direction: Direction) => {
      if (routingRef.current) return;

      const deltas: Record<Direction, Point> = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      };

      const delta = deltas[direction];
      const next = { x: player.x + delta.x, y: player.y + delta.y };

      if (!isWalkable(next)) {
        setMessage("그쪽은 지나갈 수 없어요. 길, 광장, 주차장 통로를 따라 움직여요.");
        return;
      }

      setPlayer(next);
      updateLocationMessage(next);
    },
    [player, updateLocationMessage]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
      };

      const direction = keyMap[event.key];
      if (!direction) return;
      event.preventDefault();
      movePlayer(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  const handleCanvasPointer = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      const playerCenterX = player.x * TILE_SIZE + TILE_SIZE / 2;
      const playerCenterY = player.y * TILE_SIZE + TILE_SIZE / 2;
      const dx = clickX - playerCenterX;
      const dy = clickY - playerCenterY;

      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        setMessage("가고 싶은 방향의 길을 눌러주세요.");
        return;
      }

      const direction: Direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";

      movePlayer(direction);
    },
    [movePlayer, player]
  );

  return (
    <main className="min-h-screen bg-[#e8f5e5] px-4 py-5 text-slate-900 sm:px-6 lg:py-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-emerald-700">2D 마을 탐색</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">
              마을에서 생활 미션 장소를 찾아가요
            </h1>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm">
            방향키/WASD 또는 맵 클릭으로 이동
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white p-3 shadow-sm">
            <div className="relative mx-auto w-full max-w-[1144px]">
              <canvas
                ref={canvasRef}
                width={MAP_COLS * TILE_SIZE}
                height={MAP_ROWS * TILE_SIZE}
                onPointerDown={handleCanvasPointer}
                className="block aspect-[26/18] w-full touch-none cursor-pointer rounded-lg bg-emerald-100"
              />

              <div className="absolute left-3 top-3 max-w-[78%] rounded-lg border border-white/70 bg-white/92 px-4 py-3 text-sm font-black text-slate-900 shadow-lg backdrop-blur-sm">
                {message}
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-emerald-700">선택 캐릭터</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
                  <Image
                    src={characterImage}
                    alt={`${studentName} 캐릭터`}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-950">{studentName}</h2>
                  <p className="mt-1 text-sm font-bold leading-5 text-slate-600">
                    초록 입구는 바로 미션으로 이동해요.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-emerald-700">미션 가능 장소</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {readyPois.map((poi) => (
                  <div
                    key={poi.id}
                    className={`rounded-lg border p-3 ${
                      nearPoi?.id === poi.id
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{poi.title}</p>
                      {poi.href && (
                        <Link
                          href={poi.href}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                        >
                          이동 가능
                        </Link>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                      {poi.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-black text-amber-950">준비 중 장소</p>
              <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
                카페, 푸드코트, 테이블 오더 식당, 캐치테이블, 고속버스, KTX역,
                공항, 병원, 행정복지센터, 편의점 택배, 셀프주유소, 목욕탕은
                지도에 표시되어 있고 미션은 준비 중입니다.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
