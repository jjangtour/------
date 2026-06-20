"use client";

import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { POCKET_ITEMS } from "@/utils/items";

// ─── Types ────────────────────────────────────────────────────────────────────

type CharacterKey  = "boy" | "girl";
type Direction8    = "down"|"down-right"|"right"|"up-right"|"up"|"up-left"|"left"|"down-left";
type TimeOfDay     = "dawn"|"morning"|"afternoon"|"evening"|"night";
type NpcPersonality= "cheerful"|"shy"|"grumpy"|"kind";
// 0=ocean 1=grass 2=forest 3=path 4=river 5=beach
// 6=buddy 7=lily 8=rocky 9=mochi 10=cliff 11=myhouse
// 12=busstop 13=kiosk 14=atm 15=parking 16=mind 17=school 18=safety 19=fishdock
type TileKind      = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19;
type NpcKey        = "buddy"|"lily"|"rocky"|"mochi";

interface Point      { x: number; y: number; }
interface TileCoord  { col: number; row: number; }

interface NpcConfig {
  id: NpcKey; name: string; emoji: string; personality: NpcPersonality;
  color: string; bgColor: string;
  tile: TileCoord;           // anchor tile (top-left of 2×2 home)
  dialogs: Record<TimeOfDay, string[]>;
  giftItems: string[];
}

interface CollectibleConfig {
  id: string; name: string; emoji: string;
  rarity: "common"|"rare"|"legendary";
  points: number; appearsAt: TimeOfDay[];
}
interface FloatingCollectible {
  id: string; config: CollectibleConfig; tile: TileCoord;
  collected: boolean; sparkle?: boolean;
}

interface VillageMission {
  id: string;
  title: string;
  desc: string;
  targetType: "talk_npc" | "collect_mushroom" | "collect_any" | "gift_npc" | "talk_all";
  targetValue: number;
  points: number;
}

type WeatherType = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "heavy_rain" | "snow" | "heavy_snow" | "thunderstorm";
interface WeatherInfo {
  type: WeatherType;
  emoji: string;
  label: string;
  temp: number;
}

interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  count: number;
  rarity: "common"|"rare"|"legendary";
}

// ─── Map Constants ────────────────────────────────────────────────────────────

const GRID_COLS = 24;
const GRID_ROWS = 16;
let   TILE_SIZE = 46;          // updated by ResizeObserver
const MOVE_SPEED      = 2.8;
const PLAYER_SIZE     = 62;

const TILE = {
  ocean:  0, grass:  1, forest: 2, path:   3,
  river:  4, beach:  5,
  buddy:  6, lily:   7, rocky:  8, mochi:  9, cliff: 10,
  myhouse: 11,
  busstop: 12, kiosk: 13, atm: 14,
  parking: 15, mind: 16, school: 17, safety: 18,
  fishdock: 19,
} as const;

// ── Animal Crossing-style island map (24 × 16) ────────────────────────────────
// 0=ocean  1=grass  2=forest  3=path  4=river  5=beach
// 6=buddy  7=lily   8=rocky   9=mochi 10=cliff 11=myhouse
// 12=busstop 13=kiosk 14=atm  15=parking 16=mind 17=school 18=safety 19=fishdock
const MAP_GRID: TileKind[][] = [
//  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0 ocean
  [ 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0], // r1 top beach
  [ 0, 5,10, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2, 2, 2,10, 1, 1, 1, 1, 1, 5, 0, 0], // r2 cliff+forest+river
  [ 0, 5, 2, 2, 2, 2, 7, 7, 4, 4, 4, 2, 2, 2, 2, 1, 1, 1, 3,17, 1, 5, 0, 0], // r3 forest+lily+river+school
  [ 0, 5, 2, 2, 2, 2, 7, 7, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 5, 0, 0], // r4 forest+lily+river
  [ 0, 5, 1, 3, 3, 3, 3, 3, 3, 4, 1,11,11, 3, 3, 3, 3,15, 3,12, 1, 5, 0, 0], // r5 path+river+parking+busstop
  [ 0, 5, 6, 6, 1, 1, 1, 1,19, 4, 1,11,11, 3, 1, 1, 1, 1, 3, 1, 1, 5, 0, 0], // r6 buddy+path+river+fishdock
  [ 0, 5, 6, 6, 1, 1, 1, 1, 3, 4, 4, 4, 3, 3, 1, 1, 1,16, 3,14, 1, 5, 0, 0], // r7 buddy+path+pond+mind+atm
  [ 0, 5, 1, 1, 1, 8, 8, 1, 3, 1, 1, 1, 3, 3, 9, 9, 1, 1, 3, 1, 1, 5, 0, 0], // r8 rocky+path+mochi
  [ 0, 5, 1, 1, 1, 8, 8, 1, 3, 3, 3, 3, 3, 3, 9, 9, 1, 1, 3,13, 1, 5, 0, 0], // r9 rocky+path+mochi+kiosk
  [ 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 5, 0, 0], // r10 grass
  [ 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3,18, 1, 5, 0, 0], // r11 grass+safety
  [ 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0], // r12 bottom beach
  [ 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0], // r13 beach narrows
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r14 ocean
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r15 ocean
];

// walkable: grass, forest, path, beach, NPC home tiles, my house tiles, mission tiles
const WALKABLE = new Set<TileKind>([
  TILE.grass, TILE.forest, TILE.path, TILE.beach,
  TILE.buddy, TILE.lily, TILE.rocky, TILE.mochi, TILE.myhouse,
  TILE.busstop, TILE.kiosk, TILE.atm,
  TILE.parking, TILE.mind, TILE.school, TILE.safety,
  TILE.fishdock,
]);

const TILE_TO_NPC: Partial<Record<TileKind, NpcKey>> = {
  [TILE.buddy]: "buddy",
  [TILE.lily]:  "lily",
  [TILE.rocky]: "rocky",
  [TILE.mochi]: "mochi",
};

// ─── Cozy Indoor Map Grid ────────────────────────────────────────────────────
// 0=Wall, 1=Wood Floor, 2=Prep Shelf (door), 3=Desk, 4=Safety Board, 5=Exit Rug
const INDOOR_GRID: number[][] = [
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0 wall
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r1 wall
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r2 wall
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r3 wall
  [ 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0], // r4 interactive furniture
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r5 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r6 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r7 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r8 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r9 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r10 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r11 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r12 floor
  [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r13 floor
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r14 exit mat
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r15 wall
];

const isWalkableIndoor = (t: TileCoord): boolean => {
  if (t.row<0||t.row>=GRID_ROWS||t.col<0||t.col>=GRID_COLS) return false;
  const k = INDOOR_GRID[t.row][t.col];
  return k === 1 || k === 5;
};

// ─── NPC Data ─────────────────────────────────────────────────────────────────

const NPCS: Record<NpcKey, NpcConfig> = {
  buddy: {
    id:"buddy", name:"버디", emoji:"🐻", personality:"cheerful",
    color:"#92400e", bgColor:"#fef3c7",
    tile:{ col:2, row:6 },          // top-left of 2×2 home
    dialogs:{
      dawn:      ["새벽 산책이야? 나랑 같이 해!","공기가 제일 맑은 시간이야~"],
      morning:   ["굿모닝! 오늘도 파이팅!","아침 이슬이 예쁘다~","낚시 같이 갈래?"],
      afternoon: ["점심은 먹었어?","오늘 날씨 완전 최고다!","같이 놀자!"],
      evening:   ["오늘 하루 어땠어?","저녁노을 예쁘다~","피곤하면 쉬어가도 돼."],
      night:     ["별이 진짜 많다!","오늘도 수고했어. 잘 자~","꿈에서 만나자!"],
    },
    giftItems:["🍎","🍪","⭐"],
  },
  lily: {
    id:"lily", name:"릴리", emoji:"🐱", personality:"shy",
    color:"#be185d", bgColor:"#fce7f3",
    tile:{ col:6, row:3 },
    dialogs:{
      dawn:      ["...아직 졸려...","같이 있어도 돼...?"],
      morning:   ["안... 안녕~","오늘도 사이좋게 지내자!"],
      afternoon: ["꽃이 예쁘게 폈어...","같이 꽃 구경 할래?","선물 줄게... 받아줄래?"],
      evening:   ["오늘 재밌었어!","또 만나자... 응?"],
      night:     ["밤이 됐네... 무섭진 않아?","잘 자, 좋은 꿈 꿔~"],
    },
    giftItems:["🌸","🎀","💜"],
  },
  rocky: {
    id:"rocky", name:"로키", emoji:"🦊", personality:"grumpy",
    color:"#c2410c", bgColor:"#fff7ed",
    tile:{ col:5, row:8 },
    dialogs:{
      dawn:      ["...일찍 일어났네. 부지런하잖아.","딱히 반갑진 않지만."],
      morning:   ["흥, 왔어?","뭐 필요한 거 없으면 저리 가."],
      afternoon: ["...오늘 날씨 나쁘진 않군.","배 안 고파? 뭐라도 먹어."],
      evening:   ["...수고했어. 별로 안 힘들어 보이지만."],
      night:     ["자러 가. 내일 또 봐... 뭐, 보고 싶으면."],
    },
    giftItems:["🌰","🦴","🔴"],
  },
  mochi: {
    id:"mochi", name:"모찌", emoji:"🐰", personality:"kind",
    color:"#7c3aed", bgColor:"#f5f3ff",
    tile:{ col:14, row:8 },
    dialogs:{
      dawn:      ["일찍 일어났구나! 건강에 좋아~","아침 이슬이 예쁘지 않아?"],
      morning:   ["좋은 아침이야! 오늘도 힘내자~","뭐가 필요하면 언제든 말해줘!"],
      afternoon: ["점심은 맛있게 먹었어?","오늘도 열심히 했구나! 대단해~"],
      evening:   ["오늘 정말 고생 많았어!","저녁 바람이 선선하다~"],
      night:     ["오늘 하루도 수고했어. 꼭 푹 쉬어야 해!","내일도 파이팅! 잘 자~"],
    },
    giftItems:["🌟","🍡","💙"],
  },
};
const NPC_ORDER: NpcKey[] = ["buddy","lily","rocky","mochi"];

// ─── Collectibles ─────────────────────────────────────────────────────────────

const COLLECTIBLES: CollectibleConfig[] = [
  { id:"catfish",   name:"메기",    emoji:"🐟", rarity:"common",    points:10, appearsAt:["morning","afternoon"] },
  { id:"goldfish",  name:"금붕어",  emoji:"🐠", rarity:"rare",      points:30, appearsAt:["morning","evening"] },
  { id:"butterfly", name:"나비",    emoji:"🦋", rarity:"common",    points:10, appearsAt:["morning","afternoon"] },
  { id:"ladybug",   name:"무당벌레",emoji:"🐞", rarity:"rare",      points:30, appearsAt:["morning"] },
  { id:"rose",      name:"장미",    emoji:"🌹", rarity:"rare",      points:25, appearsAt:["morning","afternoon"] },
  { id:"apple",     name:"사과",    emoji:"🍎", rarity:"common",    points:10, appearsAt:["morning","afternoon","evening"] },
  { id:"cherry",    name:"체리",    emoji:"🍒", rarity:"rare",      points:30, appearsAt:["afternoon"] },
  { id:"mushroom",  name:"버섯",    emoji:"🍄", rarity:"legendary", points:60, appearsAt:["dawn","morning","afternoon","evening","night"] },
];

// ─── Daily/Village Missions ──────────────────────────────────────────────────

const VILLAGE_MISSIONS: VillageMission[] = [
  { id: "m1", title: "이웃에게 인사하기", desc: "이웃 주민에게 직접 다가가 대화해보세요.", targetType: "talk_npc", targetValue: 1, points: 100 },
  { id: "m2", title: "자연산 버섯 채집", desc: "마을에 피어난 버섯(🍄)을 1개 채집해보세요.", targetType: "collect_mushroom", targetValue: 1, points: 200 },
  { id: "m3", title: "아날로그 채집 생활", desc: "마을에서 아무 아이템이나 3개 채집해보세요.", targetType: "collect_any", targetValue: 3, points: 150 },
  { id: "m4", title: "마을 주민에게 선물", desc: "주민 상세 정보에서 선물을 1번 전달해보세요.", targetType: "gift_npc", targetValue: 1, points: 200 },
  { id: "m5", title: "마을 이웃 모두 만나기", desc: "주민 4명(버디, 릴리, 로키, 모찌) 모두와 이야기해보세요.", targetType: "talk_all", targetValue: 4, points: 300 },
];

// ─── Time Config ──────────────────────────────────────────────────────────────

const TIME_CFG = {
  dawn:      { label:"새벽", emoji:"🌅", ocean:"#2a4a7f", beach:"#c8a050", grassA:"#6ab060", grassB:"#5a9850", forest:"#1e5028", path:"#b0904a", river:"#3a6aa0", cliff:"#5a5060", overlay:"#3a1050", alpha:0.30, stars:true  },
  morning:   { label:"아침", emoji:"☀️", ocean:"#5ac8e0", beach:"#f0d878", grassA:"#a7e7a1", grassB:"#90d888", forest:"#2a7a30", path:"#f0d888", river:"#6ab8f0", cliff:"#808878", overlay:"#000000", alpha:0,    stars:false },
  afternoon: { label:"낮",   emoji:"🌤️", ocean:"#4ab0d0", beach:"#f8e888", grassA:"#a0e098", grassB:"#88d080", forest:"#286830", path:"#e8d070", river:"#58a8e8", cliff:"#787870", overlay:"#000000", alpha:0,    stars:false },
  evening:   { label:"저녁", emoji:"🌇", ocean:"#3050a0", beach:"#e0a050", grassA:"#88b060", grassB:"#78a050", forest:"#1e4820", path:"#c89040", river:"#405898", cliff:"#504040", overlay:"#802010", alpha:0.20, stars:false },
  night:     { label:"밤",   emoji:"🌙", ocean:"#080d28", beach:"#605020", grassA:"#2e5030", grassB:"#264028", forest:"#101e14", path:"#504028", river:"#101840", cliff:"#282030", overlay:"#000818", alpha:0.48, stars:true  },
} as const;
type TC = typeof TIME_CFG[keyof typeof TIME_CFG];

// ─── Sprite & Movement ────────────────────────────────────────────────────────

const CHARACTER_CFG: Record<CharacterKey, { sprite: string; fallback: string }> = {
  boy:  { sprite:"/assets/helper/boy_8way.normalized.png",  fallback:"#3b82f6" },
  girl: { sprite:"/assets/helper/girl_8way.normalized.png", fallback:"#ec4899" },
};
const DIR_IDX: Record<Direction8, number> = {
  "down":0,"down-right":1,"right":2,"up-right":3,"up":4,"up-left":5,"left":6,"down-left":7,
};
const GIRL_DIR_IDX: Record<Direction8, number> = {
  "down":0,"down-left":1,"left":2,"up-left":3,"up":4,"up-right":5,"right":6,"down-right":7,
};
const MOVE_KEYS = new Set([
  "arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","keyw","keya","keys","keyd",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTimeOfDay = (h: number): TimeOfDay => {
  if (h>=4 && h<7)  return "dawn";
  if (h>=7 && h<13) return "morning";
  if (h>=13&& h<18) return "afternoon";
  if (h>=18&& h<21) return "evening";
  return "night";
};
const getFriendshipLevel = (xp: number) => {
  if (xp<30)  return { level:1, name:"낯선 사이",     emoji:"🌱", next:30  };
  if (xp<80)  return { level:2, name:"아는 사이",     emoji:"🌿", next:80  };
  if (xp<150) return { level:3, name:"친한 친구",     emoji:"🌳", next:150 };
  if (xp<250) return { level:4, name:"베스트 프렌드", emoji:"⭐", next:250 };
  return               { level:5, name:"영원한 친구", emoji:"💖", next:999 };
};

const tileCenter = (t: TileCoord): Point => ({
  x: t.col * TILE_SIZE + TILE_SIZE/2, y: t.row * TILE_SIZE + TILE_SIZE/2,
});
const tileKey      = (t: TileCoord) => `${t.col}:${t.row}`;
const getTileKind  = (col: number, row: number): TileKind|null => {
  if (Number.isNaN(col) || Number.isNaN(row) || !Number.isFinite(col) || !Number.isFinite(row)) return null;
  if (row<0||row>=GRID_ROWS||col<0||col>=GRID_COLS) return null;
  return MAP_GRID[row][col];
};
const getTileFromPos = (p: Point): TileCoord => {
  const size = TILE_SIZE || 46;
  return {
    col: Math.floor(p.x / size),
    row: Math.floor(p.y / size),
  };
};
const isWalkable = (t: TileCoord) => {
  const k = getTileKind(t.col, t.row);
  return k!==null && WALKABLE.has(k);
};
const getNpcFromTile = (t: TileCoord): NpcKey|null => {
  const k = getTileKind(t.col, t.row);
  return k===null ? null : TILE_TO_NPC[k] ?? null;
};

const bfs = (
  start: TileCoord, goal: TileCoord,
  extraWalkable?: Set<TileKind>,
): TileCoord[]|null => {
  const canWalk = (t: TileCoord) => {
    const k = getTileKind(t.col, t.row);
    return k!==null && (WALKABLE.has(k) || (extraWalkable?.has(k) ?? false));
  };
  if (!canWalk(start) || !canWalk(goal)) return null;
  const sk=tileKey(start), gk=tileKey(goal);
  const queue=[start], visited=new Set([sk]);
  const cameFrom=new Map<string,string|null>([[sk,null]]);
  const coords  =new Map<string,TileCoord>([[sk,start]]);
  while (queue.length) {
    const cur=queue.shift()!;
    if (tileKey(cur)===gk) {
      const path:TileCoord[]=[];
      let ck:string|null=gk;
      while (ck && ck!==sk) {
        const co=coords.get(ck); if(!co) return null;
        path.unshift(co); ck=cameFrom.get(ck)??null;
      }
      return path;
    }
    for (const nb of [
      {col:cur.col+1,row:cur.row},{col:cur.col-1,row:cur.row},
      {col:cur.col,row:cur.row+1},{col:cur.col,row:cur.row-1},
    ]) {
      const nk=tileKey(nb);
      if (visited.has(nk)||!canWalk(nb)) continue;
      visited.add(nk); cameFrom.set(nk,tileKey(cur));
      coords.set(nk,nb); queue.push(nb);
    }
  }
  return null;
};

// bfs for indoor mapping
const bfsIndoor = (
  start: TileCoord, goal: TileCoord
): TileCoord[]|null => {
  if (!isWalkableIndoor(start) || !isWalkableIndoor(goal)) return null;
  const sk=tileKey(start), gk=tileKey(goal);
  const queue=[start], visited=new Set([sk]);
  const cameFrom=new Map<string,string|null>([[sk,null]]);
  const coords  =new Map<string,TileCoord>([[sk,start]]);
  while (queue.length) {
    const cur=queue.shift()!;
    if (tileKey(cur)===gk) {
      const path:TileCoord[]=[];
      let ck:string|null=gk;
      while (ck && ck!==sk) {
        const co=coords.get(ck); if(!co) return null;
        path.unshift(co); ck=cameFrom.get(ck)??null;
      }
      return path;
    }
    for (const nb of [
      {col:cur.col+1,row:cur.row},{col:cur.col-1,row:cur.row},
      {col:cur.col,row:cur.row+1},{col:cur.col,row:cur.row-1},
    ]) {
      const nk=tileKey(nb);
      if (visited.has(nk)||!isWalkableIndoor(nb)) continue;
      visited.add(nk); cameFrom.set(nk,tileKey(cur));
      coords.set(nk,nb); queue.push(nb);
    }
  }
  return null;
};

const findNearestWalkable = (col: number, row: number): TileCoord|null => {
  const s={col,row}; if (isWalkable(s)) return s;
  for (let r=1; r<=Math.max(GRID_COLS,GRID_ROWS); r++) {
    let best:TileCoord|null=null, bestD=Infinity;
    for (let rr=row-r; rr<=row+r; rr++) {
      for (let cc=col-r; cc<=col+r; cc++) {
        if (Math.abs(cc-col)!==r && Math.abs(rr-row)!==r) continue;
        const c={col:cc,row:rr};
        if (!isWalkable(c)) continue;
        const d=Math.abs(cc-col)+Math.abs(rr-row);
        if (d<bestD) { best=c; bestD=d; }
      }
    }
    if (best) return best;
  }
  return null;
};

const get8Dir = (dx: number, dy: number): Direction8 => {
  const angle=Math.atan2(dy,dx);
  const a=((angle<0?angle+2*Math.PI:angle)+Math.PI/8)%(2*Math.PI);
  const dirs:Direction8[]=["right","down-right","down","down-left","left","up-left","up","up-right"];
  return dirs[Math.floor(a/(Math.PI/4))];
};

const drawRect = (ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) => {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
};

const getRarityStyle = (r:"common"|"rare"|"legendary") =>
  r==="legendary" ? "text-amber-800 bg-amber-50 border-amber-300"
  : r==="rare"    ? "text-purple-800 bg-purple-50 border-purple-300"
  :                 "text-slate-800 bg-slate-50 border-slate-200";

// ─── Drawing Helpers ──────────────────────────────────────────────────────────

function drawOceanTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC,t:number) {
  ctx.fillStyle=tc.ocean; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
  // gentle wave shimmer
  ctx.strokeStyle="rgba(255,255,255,0.12)";
  ctx.lineWidth=1;
  const phase=(t/1200+x*0.01)%(Math.PI*2);
  ctx.beginPath();
  ctx.moveTo(x+4, y+TILE_SIZE*0.5+Math.sin(phase)*2);
  ctx.quadraticCurveTo(x+TILE_SIZE*0.35, y+TILE_SIZE*0.4+Math.sin(phase+1)*2, x+TILE_SIZE*0.65, y+TILE_SIZE*0.5+Math.sin(phase+0.5)*2);
  ctx.quadraticCurveTo(x+TILE_SIZE*0.82, y+TILE_SIZE*0.6, x+TILE_SIZE-4, y+TILE_SIZE*0.5);
  ctx.stroke();
}

function drawGrassTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC, col:number,row:number) {
  // 1. Solid base background of grassA
  ctx.fillStyle = tc.grassA;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // 2. Deterministic pseudo-random seed based on col and row
  const seed = (col * 37 + row * 91) % 1000;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // Determine number of grass tufts per tile (0, 1, or 2)
  const rVal = rand();
  const numTufts = rVal < 0.15 ? 0 : rVal < 0.75 ? 1 : 2;

  ctx.strokeStyle = tc.forest;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < numTufts; i++) {
    // Generate positions within the tile (avoiding edges)
    const bx = x + 6 + rand() * (TILE_SIZE - 12);
    const by = y + 8 + rand() * (TILE_SIZE - 14);

    // Height and width scale (0.7 to 1.1)
    const scale = 0.75 + rand() * 0.35;
    const h = 8 * scale;
    const w = 5 * scale;

    // Type of tuft:
    // < 0.5: 3 blades
    // < 0.85: 2 blades
    // >= 0.85: 1 blade
    const typeVal = rand();

    ctx.lineWidth = 1.8 * scale;
    ctx.globalAlpha = 0.32; // Blends nicely and matches the style of the scene

    ctx.beginPath();
    if (typeVal < 0.5) {
      // 3 blades (left, center, right)
      // Center blade
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by - h);

      // Left blade
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - w * 0.4, by - h * 0.2, bx - w, by - h * 0.6);

      // Right blade
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + w * 0.4, by - h * 0.2, bx + w, by - h * 0.6);
    } else if (typeVal < 0.85) {
      // 2 blades (left, right)
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - w * 0.5, by - h * 0.2, bx - w, by - h * 0.7);

      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + w * 0.5, by - h * 0.2, bx + w, by - h * 0.7);
    } else {
      // 1 blade (center-right curved)
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + w * 0.3, by - h * 0.3, bx + w * 0.5, by - h * 0.8);
    }
    ctx.stroke();
  }

  // 3. Draw tiny dots/particles for detail texture (like flowers or lighter/darker specks)
  const numDots = Math.floor(rand() * 3) + 1; // 1 to 3 dots per tile
  for (let i = 0; i < numDots; i++) {
    const dx = x + 4 + rand() * (TILE_SIZE - 8);
    const dy = y + 4 + rand() * (TILE_SIZE - 8);
    const radius = 1 + rand() * 1.2;

    const dotType = rand();
    if (dotType < 0.45) {
      // Light yellowish/white dots
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (dotType < 0.75) {
      // Lighter grass dots (using tc.grassB for variety)
      ctx.fillStyle = tc.grassB;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Darker grass/forest dots
      ctx.fillStyle = tc.forest;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Occasionally draw a tiny stone/rock (5% chance)
  if (rand() < 0.05) {
    const rx = x + 8 + rand() * (TILE_SIZE - 16);
    const ry = y + 8 + rand() * (TILE_SIZE - 16);
    drawStylizedRock(ctx, rx, ry, 2.0 + rand() * 1.0, seed);
  }

  ctx.globalAlpha = 1.0;
}

function drawForestTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC, col:number,row:number) {
  // First draw the grass background so there is grass under the trees
  ctx.fillStyle = tc.grassA;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // Deterministic seed
  const seed = (col * 29 + row * 53) % 1000;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const isDeciduous = (col * 3 + row * 7) % 2 === 0;
  const scale = 0.85 + rand() * 0.3; // scale from 0.85 to 1.15
  
  // Slight offset within the tile to break the grid look
  const offsetX = (rand() * 6 - 3); // -3px to +3px
  const offsetY = (rand() * 4 - 2); // -2px to +2px
  
  const cx = x + TILE_SIZE / 2 + offsetX;
  const cy = y + TILE_SIZE * 0.85 + offsetY; // base of tree trunk

  // 1. Draw base shadow under the tree
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, TILE_SIZE * 0.25 * scale, TILE_SIZE * 0.08 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Draw trunk
  ctx.save();
  ctx.fillStyle = "#8b5a2b"; // Brown wood
  ctx.strokeStyle = "#5c3a1a";
  ctx.lineWidth = 1.2;
  const trunkW = 5 * scale;
  const trunkH = 12 * scale;
  ctx.beginPath();
  ctx.roundRect(cx - trunkW / 2, cy - trunkH, trunkW, trunkH, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3. Draw foliage
  ctx.save();
  const baseFoliageY = cy - trunkH * 0.8;
  
  if (isDeciduous) {
    // Deciduous Tree: Fluffy round foliage layers (like Row 1)
    const r = TILE_SIZE * 0.28 * scale;
    const shadowColor = tc.forest;
    const midColor = tc.grassB;
    const highlightColor = tc.grassA;

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.2;

    // Bottom-left circle
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, baseFoliageY - r * 0.3, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bottom-right circle
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.arc(cx + r * 0.35, baseFoliageY - r * 0.3, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center/top circle
    ctx.fillStyle = midColor;
    ctx.beginPath();
    ctx.arc(cx, baseFoliageY - r * 0.7, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Highlight bubble on top-left
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, baseFoliageY - r * 0.85, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Coniferous Pine Tree: Layered triangles (like Row 2)
    const baseW = TILE_SIZE * 0.65 * scale;
    const layerH = 9 * scale;
    
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 3; i++) {
      const w = baseW * (1 - i * 0.22);
      const ly = baseFoliageY - i * (layerH * 0.75);
      ctx.fillStyle = i === 0 ? tc.forest : tc.grassB;
      
      ctx.beginPath();
      ctx.moveTo(cx, ly - layerH * 1.5); // Peak
      ctx.lineTo(cx - w / 2, ly); // Bottom left
      ctx.quadraticCurveTo(cx, ly + layerH * 0.1, cx + w / 2, ly); // Curved bottom
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Soft highlight on the left side of the triangle
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(cx, ly - layerH * 1.5);
      ctx.lineTo(cx - w / 2, ly);
      ctx.lineTo(cx, ly);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPathTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC, col:number,row:number) {
  // 1. Draw the base dirt/sand path color
  ctx.fillStyle = tc.path;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // 2. Seed a deterministic randomizer based on col and row
  const seed = (col * 17 + row * 79) % 1000;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // Define 5 stone shapes in normalized coordinates within the tile
  const stones = [
    { cx: 0.25, cy: 0.25, rx: 8, ry: 7, r: 4 },
    { cx: 0.75, cy: 0.22, rx: 7, ry: 6, r: 3 },
    { cx: 0.45, cy: 0.52, rx: 9, ry: 7, r: 4 },
    { cx: 0.22, cy: 0.78, rx: 6, ry: 6, r: 3 },
    { cx: 0.78, cy: 0.76, rx: 8, ry: 8, r: 5 }
  ];

  // Draw each stone
  stones.forEach((stone) => {
    const offsetX = (rand() * 4 - 2); // -2px to +2px
    const offsetY = (rand() * 4 - 2); // -2px to +2px
    
    const scx = x + stone.cx * TILE_SIZE + offsetX;
    const scy = y + stone.cy * TILE_SIZE + offsetY;
    
    const srx = stone.rx * (TILE_SIZE / 46) * (0.9 + rand() * 0.2);
    const sry = stone.ry * (TILE_SIZE / 46) * (0.9 + rand() * 0.2);

    ctx.save();
    ctx.fillStyle = "rgba(180, 180, 180, 0.75)";
    
    // Add subtle shadow under each stone
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 1;
    ctx.shadowOffsetY = 1.2;

    ctx.beginPath();
    ctx.roundRect(scx - srx, scy - sry, srx * 2, sry * 2, stone.r);
    ctx.fill();
    
    // Highlight on the stone
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dark contour outline
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  });
  
  // Draw tiny pebbles in the gaps
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < 3; i++) {
    const px = x + 4 + rand() * (TILE_SIZE - 8);
    const py = y + 4 + rand() * (TILE_SIZE - 8);
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRiverTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC,t:number) {
  ctx.fillStyle=tc.river; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
  ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.lineWidth=1.5;
  const wave=(t/900+x*0.018)%(Math.PI*2);
  ctx.beginPath();
  ctx.moveTo(x+2,y+TILE_SIZE*0.35+Math.sin(wave)*3);
  ctx.quadraticCurveTo(x+TILE_SIZE*0.4,y+TILE_SIZE*0.25+Math.sin(wave+1)*3,
    x+TILE_SIZE*0.7,y+TILE_SIZE*0.35+Math.sin(wave+0.6)*3);
  ctx.quadraticCurveTo(x+TILE_SIZE*0.85,y+TILE_SIZE*0.45,x+TILE_SIZE-2,y+TILE_SIZE*0.35);
  ctx.stroke();
  // second ripple
  ctx.strokeStyle="rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(x+2,y+TILE_SIZE*0.65+Math.sin(wave+2)*3);
  ctx.quadraticCurveTo(x+TILE_SIZE*0.3,y+TILE_SIZE*0.55+Math.sin(wave+3)*3,
    x+TILE_SIZE*0.65,y+TILE_SIZE*0.65+Math.sin(wave+1.5)*3);
  ctx.stroke();

  // Occasional swimming fish in water
  const fishSeed = (x * 7 + y * 13) % 97;
  const fishCycle = (t / 3000 + fishSeed) % 6; // 6-second cycle
  if (fishCycle < 1.2) { // fish visible ~20% of the time
    const swimX = x + (fishCycle / 1.2) * TILE_SIZE;
    const swimY = y + TILE_SIZE * 0.5 + Math.sin(t / 400 + fishSeed) * 4;
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t / 300 + fishSeed) * 0.15;
    ctx.font = `${TILE_SIZE * 0.28}px serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(fishSeed % 3 === 0 ? "🐠" : "🐟", swimX, swimY);
    ctx.restore();
  }
}

function drawStylizedRock(ctx: CanvasRenderingContext2D, rx: number, ry: number, size: number, seed: number) {
  ctx.save();
  
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 1. Base shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(rx, ry + size * 0.3, size * 1.1, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rock body (irregular polygon with rounded corners)
  ctx.fillStyle = "rgba(150, 153, 156, 0.85)"; // nice stone grey
  ctx.beginPath();
  const numPoints = 6;
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const offset = 0.85 + rand() * 0.3; // ±15% size variation
    const px = rx + Math.cos(angle) * size * offset;
    const py = ry + Math.sin(angle) * size * offset * 0.8;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // 3. Highlight facet (light reflection on top-left)
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.moveTo(rx - size * 0.8, ry - size * 0.2);
  ctx.lineTo(rx + size * 0.1, ry - size * 0.7);
  ctx.lineTo(rx, ry);
  ctx.closePath();
  ctx.fill();

  // 4. Draw outline
  ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const offset = 0.85 + rand() * 0.3;
    const px = rx + Math.cos(angle) * size * offset;
    const py = ry + Math.sin(angle) * size * offset * 0.8;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 5. Inner crease/crack lines to give rock texture
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(rx - size * 0.4, ry - size * 0.1);
  ctx.lineTo(rx + size * 0.2, ry + size * 0.3);
  ctx.stroke();

  ctx.restore();
}

function drawBeachTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC,col:number,row:number) {
  // Draw sand base
  ctx.fillStyle=tc.beach; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
  
  // sand dots
  ctx.fillStyle="rgba(255,255,255,0.2)";
  for (let i=0;i<3;i++) {
    const sx=x+8+(col*17+i*13)%32, sy=y+8+(row*11+i*7)%32;
    ctx.beginPath(); ctx.arc(sx,sy,1,0,Math.PI*2); ctx.fill();
  }

  // Deterministic seed for beach elements
  const seed = (col * 41 + row * 83) % 1000;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const choice = rand();
  if (choice < 0.10) {
    // 10% chance: Medium boulder
    const rx = x + TILE_SIZE / 2 + (rand() * 8 - 4);
    const ry = y + TILE_SIZE / 2 + (rand() * 8 - 4);
    const size = 6 + rand() * 3;
    drawStylizedRock(ctx, rx, ry, size, seed);
  } else if (choice < 0.22) {
    // 12% chance: Cluster of two small rocks
    const rx1 = x + TILE_SIZE * 0.35 + (rand() * 4 - 2);
    const ry1 = y + TILE_SIZE * 0.45 + (rand() * 4 - 2);
    const rx2 = rx1 + 8 + rand() * 4;
    const ry2 = ry1 + 2 + rand() * 4;
    
    drawStylizedRock(ctx, rx1, ry1, 3.5 + rand() * 1.5, seed);
    drawStylizedRock(ctx, rx2, ry2, 2.5 + rand() * 1.0, seed + 1);
  } else if (choice < 0.35) {
    // 13% chance: Tiny pebbles
    ctx.fillStyle = "rgba(120, 122, 125, 0.4)";
    for (let i = 0; i < 2; i++) {
      const px = x + 6 + rand() * (TILE_SIZE - 12);
      const py = y + 6 + rand() * (TILE_SIZE - 12);
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + rand() * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCliffTile(ctx: CanvasRenderingContext2D, x:number,y:number,tc:TC,col:number,row:number) {
  ctx.fillStyle=tc.cliff; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
  
  // Deterministic seed
  const seed = (col * 19 + row * 97) % 1000;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // Cliff ledges and crack shading
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 1.2;
  
  // 1. Draw top border shadow to give 3D depth
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(x, y, TILE_SIZE, 4);

  // 2. Draw rocky creases/cracks
  ctx.beginPath();
  const numCracks = 1 + Math.floor(rand() * 2); // 1 or 2 cracks
  for (let i = 0; i < numCracks; i++) {
    const startY = y + 8 + rand() * (TILE_SIZE - 20);
    const endY = startY + (rand() * 8 - 4);
    ctx.moveTo(x + 4, startY);
    ctx.lineTo(x + TILE_SIZE * 0.4, startY + (rand() * 4 - 2));
    ctx.lineTo(x + TILE_SIZE - 4, endY);
  }
  ctx.stroke();

  // 3. Draw horizontal ledge highlights
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.moveTo(x + 4, y + TILE_SIZE * 0.4);
  ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE * 0.4);
  ctx.moveTo(x + 6, y + TILE_SIZE * 0.7);
  ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE * 0.7);
  ctx.stroke();

  // 4. Draw a small rocky outcropping on the cliff (20% chance)
  if (rand() < 0.20) {
    const rx = x + TILE_SIZE / 2 + (rand() * 10 - 5);
    const ry = y + TILE_SIZE / 2 + (rand() * 10 - 5);
    drawStylizedRock(ctx, rx, ry, 4.5 + rand() * 2.5, seed);
  }
}

function drawNpcHome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  npc: NpcConfig,
  isNearby: boolean,
  tc: TC,
  img: HTMLCanvasElement | null
) {
  // Only draw on the top-left tile of the 2x2 grid;
  // non-top-left tiles do nothing (avoids covering the image)
  if (col !== npc.tile.col || row !== npc.tile.row) return;

  // home background for the full 2x2 area
  ctx.fillStyle=npc.bgColor;
  ctx.fillRect(x,y,TILE_SIZE*2,TILE_SIZE*2);

  if (img) {
    ctx.drawImage(img, x, y, TILE_SIZE * 2, TILE_SIZE * 2);
  } else {
    // fallback to vector house if image isn't loaded yet
    ctx.fillStyle=npc.color; ctx.globalAlpha=0.25;
    ctx.fillRect(x+TILE_SIZE*0.25,y+TILE_SIZE*0.5,TILE_SIZE*0.5,TILE_SIZE*0.4);
    ctx.globalAlpha=0.4;
    ctx.beginPath();
    ctx.moveTo(x+TILE_SIZE*0.18,y+TILE_SIZE*0.52);
    ctx.lineTo(x+TILE_SIZE*0.5,y+TILE_SIZE*0.28);
    ctx.lineTo(x+TILE_SIZE*0.82,y+TILE_SIZE*0.52);
    ctx.fill();
    ctx.globalAlpha=1;
  }

  // pulsing border around the entire 2x2 building area
  ctx.strokeStyle=npc.color;
  ctx.lineWidth=isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle="#fbbf24";
    ctx.setLineDash([4,3]);
  }
  ctx.strokeRect(x+1,y+1,TILE_SIZE*2-2,TILE_SIZE*2-2);
  ctx.setLineDash([]);
  void tc;
}

function drawMyHouseHome(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: number,
  row: number,
  isNearby: boolean,
  tc: TC,
  studentName: string,
  img: HTMLCanvasElement | null
) {
  // Only draw on the top-left tile (Col 11, Row 5);
  // non-top-left tiles do nothing (avoids covering the image)
  if (col !== 11 || row !== 5) return;

  // home background for the full 2x2 area
  ctx.fillStyle="#e8f5e9";
  ctx.fillRect(x,y,TILE_SIZE*2,TILE_SIZE*2);

  if (img) {
    ctx.drawImage(img, x, y, TILE_SIZE * 2, TILE_SIZE * 2);
  } else {
    // fallback vector house
    ctx.fillStyle="#1b5e20"; ctx.globalAlpha=0.25;
    ctx.fillRect(x+TILE_SIZE*0.25,y+TILE_SIZE*0.5,TILE_SIZE*0.5,TILE_SIZE*0.4);
    ctx.globalAlpha=0.4;
    ctx.beginPath();
    ctx.moveTo(x+TILE_SIZE*0.18,y+TILE_SIZE*0.52);
    ctx.lineTo(x+TILE_SIZE*0.5,y+TILE_SIZE*0.28);
    ctx.lineTo(x+TILE_SIZE*0.82,y+TILE_SIZE*0.52);
    ctx.fill();
    ctx.globalAlpha=1;
  }

  // pulsing border around the entire 2x2 my house area
  ctx.strokeStyle="#2e7d32";
  ctx.lineWidth=isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle="#fbbf24";
    ctx.setLineDash([4,3]);
  }
  ctx.strokeRect(x+1,y+1,TILE_SIZE*2-2,TILE_SIZE*2-2);
  ctx.setLineDash([]);
  void studentName;
  void tc;
}

function drawBusStopHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  // background
  ctx.fillStyle = "#eff6ff"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // border (pulses when nearby)
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  // icon
  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🚏", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#1e3a8a"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("버스 정류장", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawKioskHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  // background
  ctx.fillStyle = "#fffbeb"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // border (pulses when nearby)
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  // icon
  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🍔", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#78350f"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("패스트푸드", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawAtmHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  // background
  ctx.fillStyle = "#f0fdf4"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // border (pulses when nearby)
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  // icon
  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🏧", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#14532d"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("은행 ATM", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawParkingHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  ctx.fillStyle = "#f8fafc"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🅿️", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#1e293b"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("주차정산", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawMindHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  ctx.fillStyle = "#fdf2f8"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#db2777";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("💚", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#831843"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("마음쉼터", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawSchoolHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  ctx.fillStyle = "#fff7ed"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#ea580c";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🏫", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#7c2d12"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("학교", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawSafetyHome(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  ctx.fillStyle = "#fef2f2"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🚨", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#7f1d1d"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("안전훈련장", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

function drawFishDock(
  ctx: CanvasRenderingContext2D, x: number, y: number, isNearby: boolean, tc: TC
) {
  // Light wood plank background
  ctx.fillStyle = "#ebdcb9"; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#8c6239";
  ctx.lineWidth = isNearby ? 3 : 1.5;
  if (isNearby) {
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([4, 3]);
  }
  ctx.strokeRect(x+1, y+1, TILE_SIZE-2, TILE_SIZE-2);
  ctx.setLineDash([]);

  // Plank divider lines
  ctx.strokeStyle = "rgba(140, 98, 57, 0.25)";
  ctx.lineWidth = 1;
  for (let offset = 8; offset < TILE_SIZE; offset += 8) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y);
    ctx.lineTo(x + offset, y + TILE_SIZE);
    ctx.stroke();
  }

  ctx.font = `${TILE_SIZE * 0.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🎣", x + TILE_SIZE/2, y + TILE_SIZE/2);
  ctx.fillStyle = "#5d4037"; ctx.font = `bold ${TILE_SIZE * 0.16}px sans-serif`;
  ctx.fillText("낚시터", x + TILE_SIZE/2, y + TILE_SIZE * 0.88);
  void tc;
}

// Flood-fill based chroma keying to remove gray/white checkerboard background from houses
function makeBackgroundTransparent(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0);
  
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;
    
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];
    
    const isBgColor = (r: number, g: number, b: number) => {
      // White squares
      if (r > 240 && g > 240 && b > 240) return true;
      // Gray squares: R, G, B are similar (within 8) and in range [175, 215]
      if (r >= 175 && r <= 215 && Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8 && Math.abs(b - r) <= 8) return true;
      return false;
    };
    
    const addPixel = (x: number, y: number) => {
      const idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      const offset = idx * 4;
      if (isBgColor(data[offset], data[offset + 1], data[offset + 2])) {
        queue.push(idx);
      }
    };
    
    // Add corners and edges to queue
    addPixel(0, 0);
    addPixel(w - 1, 0);
    addPixel(0, h - 1);
    addPixel(w - 1, h - 1);
    
    for (let x = 0; x < w; x += 10) {
      addPixel(x, 0);
      addPixel(x, h - 1);
    }
    for (let y = 0; y < h; y += 10) {
      addPixel(0, y);
      addPixel(w - 1, y);
    }
    
    let qIdx = 0;
    while (qIdx < queue.length) {
      const curr = queue[qIdx++];
      const cx = curr % w;
      const cy = Math.floor(curr / w);
      
      const offset = curr * 4;
      data[offset + 3] = 0; // set alpha to 0
      
      const neighbors = [
        { x: cx - 1, y: cy },
        { x: cx + 1, y: cy },
        { x: cx, y: cy - 1 },
        { x: cx, y: cy + 1 }
      ];
      
      for (const n of neighbors) {
        if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
          const nIdx = n.y * w + n.x;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const nOffset = nIdx * 4;
            if (isBgColor(data[nOffset], data[nOffset + 1], data[nOffset + 2])) {
              queue.push(nIdx);
            }
          }
        }
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.error("Failed to make background transparent:", err);
  }
  
  // Downscale to target size for crisp rendering at small tile sizes
  const TARGET = 256;
  const aspect = canvas.width / canvas.height;
  const tw = aspect >= 1 ? TARGET : Math.round(TARGET * aspect);
  const th = aspect >= 1 ? Math.round(TARGET / aspect) : TARGET;
  const scaled = document.createElement("canvas");
  scaled.width = tw;
  scaled.height = th;
  const sctx = scaled.getContext("2d");
  if (sctx) {
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(canvas, 0, 0, tw, th);
  }
  return scaled;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VillagePage() {
  // ── Time ──
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay(new Date().getHours()));
  const [clockText, setClockText] = useState(() => {
    const n=new Date(); return `${n.getHours()}:${String(n.getMinutes()).padStart(2,"0")}`;
  });
  const [dateText, setDateText] = useState(() => {
    const n=new Date();
    const days=["일","월","화","수","목","금","토"];
    return `${n.getMonth()+1}월 ${n.getDate()}일 (${days[n.getDay()]})`;
  });
  useEffect(() => {
    const tick=()=>{
      const n=new Date();
      setTimeOfDay(getTimeOfDay(n.getHours()));
      setClockText(`${n.getHours()}:${String(n.getMinutes()).padStart(2,"0")}`);
      const days=["일","월","화","수","목","금","토"];
      setDateText(`${n.getMonth()+1}월 ${n.getDate()}일 (${days[n.getDay()]})`);
    };
    tick(); const iv=setInterval(tick,30_000); return ()=>clearInterval(iv);
  }, []);

  // ── Student ──
  const [studentName] = useState(() => {
    if (typeof window==="undefined") return "학생";
    return localStorage.getItem("haemileum_selected_student") || "학생";
  });
  const [{ character }] = useState<{ character:CharacterKey }>(() => {
    if (typeof window==="undefined") return { character:"boy" };
    const s=localStorage.getItem("haemileum_selected_student")||"";
    return { character: (s==="김하늘"||s==="하늘") ? "girl" : "boy" };
  });

  // ── Friendship ──
  const [friendshipXp, setFriendshipXp] = useState<Record<NpcKey,number>>(() => {
    if (typeof window==="undefined") return { buddy:0,lily:0,rocky:0,mochi:0 };
    try { const s=localStorage.getItem("haemileum_village_npcs");
      if (s) return { buddy:0,lily:0,rocky:0,mochi:0,...JSON.parse(s) };
    } catch { /**/ }
    return { buddy:0,lily:0,rocky:0,mochi:0 };
  });
  const addXp = useCallback((npc:NpcKey,amt:number) => {
    setFriendshipXp(prev=>{
      const next={...prev,[npc]:prev[npc]+amt};
      localStorage.setItem("haemileum_village_npcs",JSON.stringify(next)); return next;
    });
  }, []);

  // ── Collectibles ──
  const [caughtCount, setCaughtCount] = useState<Partial<Record<string,number>>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [floatingItems, setFloatingItems] = useState<FloatingCollectible[]>([]);
  const spawnTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Load persisted data after mount (avoids SSR/CSR hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("haemileum_village_items");
      if (saved) setCaughtCount(JSON.parse(saved));
    } catch { /**/ }
    setTotalPoints(parseInt(localStorage.getItem("haemileum_village_points")||"0",10));
  }, []);

  // ── UI / Nook Phone State ──
  const [selectedNpc, setSelectedNpc] = useState<NpcKey|null>(null);
  const [dialogText, setDialogText]   = useState("");
  const [giftEffect, setGiftEffect]   = useState<string|null>(null);
  const [collectNotif, setCollectNotif] = useState<{emoji:string;name:string;points:number}|null>(null);
  const [nearbyNpc, setNearbyNpc]     = useState<NpcKey|null>(null); // player is adjacent to this NPC
  const [isNookPhoneOpen, setIsNookPhoneOpen] = useState(false);
  const [activePhoneApp, setActivePhoneApp]   = useState<string|null>(null);
  const [isBgmOn, setIsBgmOn]                 = useState(true);
  const [weather, setWeather]                   = useState<WeatherInfo | null>(null);
  const weatherParticles = useRef<{x:number;y:number;speed:number;size:number;opacity:number;drift:number}[]>([]);

  // ── Fetch Real-time Weather ──
  useEffect(() => {
    const wmoToWeather = (code: number, temp: number): WeatherInfo => {
      if (code <= 1) return { type: "clear", emoji: "☀️", label: "맑음", temp };
      if (code <= 3) return { type: "cloudy", emoji: "⛅", label: "흐림", temp };
      if (code <= 48) return { type: "fog", emoji: "🌫️", label: "안개", temp };
      if (code <= 57) return { type: "drizzle", emoji: "🌦️", label: "이슬비", temp };
      if (code <= 65) return { type: code <= 61 ? "rain" : "heavy_rain", emoji: "🌧️", label: code <= 61 ? "비" : "폭우", temp };
      if (code <= 67) return { type: "rain", emoji: "🌧️", label: "비", temp };
      if (code <= 77) return { type: code <= 71 ? "snow" : "heavy_snow", emoji: "🌨️", label: code <= 71 ? "눈" : "폭설", temp };
      if (code <= 82) return { type: "heavy_rain", emoji: "🌧️", label: "소나기", temp };
      if (code <= 86) return { type: "heavy_snow", emoji: "🌨️", label: "눈보라", temp };
      return { type: "thunderstorm", emoji: "⛈️", label: "천둥번개", temp };
    };

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FSeoul`
        );
        const data = await res.json();
        if (data.current_weather) {
          const w = wmoToWeather(
            data.current_weather.weathercode,
            Math.round(data.current_weather.temperature)
          );
          setWeather(w);
          // Reset particles when weather changes
          weatherParticles.current = [];
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
        // fallback: clear weather
        setWeather({ type: "clear", emoji: "☀️", label: "맑음", temp: 25 });
      }
    };

    // Try geolocation, fallback to Seoul
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(37.5665, 126.978), // Seoul fallback
        { timeout: 5000 }
      );
    } else {
      fetchWeather(37.5665, 126.978);
    }

    // Refresh every 10 minutes
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(37.5665, 126.978),
          { timeout: 5000 }
        );
      } else {
        fetchWeather(37.5665, 126.978);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ── NPC Delivery Quest State ──
  const [activeQuest, setActiveQuest] = useState<{
    id: string;
    npcId: string;
    title: string;
    itemNeeded: string;
    itemEmoji: string;
    rewardPoints: number;
    status: "idle" | "active" | "ready_to_deliver" | "completed";
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("haemileum_active_quest");
      if (saved) {
        setActiveQuest(JSON.parse(saved));
      } else {
        setActiveQuest({
          id: "lily-burger",
          npcId: "lily",
          title: "릴리의 햄버거 부탁",
          itemNeeded: "burger",
          itemEmoji: "🍔",
          rewardPoints: 500,
          status: "idle",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveQuestState = (quest: typeof activeQuest) => {
    setActiveQuest(quest);
    if (typeof window !== "undefined") {
      localStorage.setItem("haemileum_active_quest", JSON.stringify(quest));
    }
  };

  // ── Mission State ──
  const [missionProgress, setMissionProgress] = useState<Record<string, number>>({});
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});
  const [celebratingMission, setCelebratingMission] = useState<VillageMission | null>(null);

  // ── House Indoor Exploration State ──
  const [indoorArea, setIndoorArea] = useState<"village" | "myhouse">("village");
  const [isNearMyHouse, setIsNearMyHouse] = useState(false);
  const [nearbyFurniture, setNearbyFurniture] = useState<"door" | "desk" | "safety" | null>(null);
  const [activeFurnitureModal, setActiveFurnitureModal] = useState<"door" | "desk" | "safety" | null>(null);

  const indoorAreaRef = useRef(indoorArea);
  useEffect(() => {
    indoorAreaRef.current = indoorArea;
  }, [indoorArea]);

  const nearbyFurnitureRef = useRef(nearbyFurniture);
  useEffect(() => {
    nearbyFurnitureRef.current = nearbyFurniture;
  }, [nearbyFurniture]);

  const activeFurnitureModalRef = useRef(activeFurnitureModal);
  useEffect(() => {
    activeFurnitureModalRef.current = activeFurnitureModal;
  }, [activeFurnitureModal]);

  const [isNearBusStop, setIsNearBusStop] = useState(false);
  const [isNearKiosk, setIsNearKiosk] = useState(false);
  const [isNearAtm, setIsNearAtm] = useState(false);
  const [isNearParking, setIsNearParking] = useState(false);
  const [isNearMind, setIsNearMind] = useState(false);
  const [isNearSchool, setIsNearSchool] = useState(false);
  const [isNearSafety, setIsNearSafety] = useState(false);
  const [isNearFishDock, setIsNearFishDock] = useState(false);
  const [activeMissionModal, setActiveMissionModal] = useState<"bus" | "kiosk" | "atm" | "parking" | "mind" | "school" | "safety" | "fishing" | null>(null);
  const [fishingState, setFishingState] = useState<"idle" | "waiting" | "nibble" | "caught" | "missed">("idle");
  const [caughtFish, setCaughtFish] = useState<{ id: string; name: string; emoji: string; rarity: "common" | "rare" | "legendary"; points: number } | null>(null);
  const [packedItemIds, setPackedItemIds] = useState<string[]>([]);
  const [houseStorage, setHouseStorage] = useState<InventoryItem[]>([]);
  const [houseActiveTab, setHouseActiveTab] = useState<"cards" | "storage">("cards");

  // ── Pocket Inventory State ──
  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(() => Array(20).fill(null));
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [activeSlotAction, setActiveSlotAction] = useState<number | null>(null);

  // ── Main Guide Message Text ──
  const messageText = useMemo(() => {
    if (collectNotif) {
      return `${collectNotif.emoji} ${collectNotif.name} ${collectNotif.points > 0 ? `(+${collectNotif.points}pt)` : ""}`;
    }
    
    // Check Lily Burger quest
    if (activeQuest && activeQuest.id === "lily-burger") {
      const hasBurger = inventory.some(item => item && item.id === "burger");
      if (activeQuest.status === "active") {
        if (hasBurger) {
          return "🍔 햄버거를 얻었습니다! 마을 북서쪽(위)에 있는 고양이 주민 '릴리'에게 배달해 주세요! 🐱";
        } else {
          return "릴리🐱의 부탁: 마을 남동쪽(아래) 패스트푸드점(Kiosk)에서 카드로 🍔 햄버거를 주문해 주세요!";
        }
      } else if (activeQuest.status === "ready_to_deliver") {
        return "🍔 햄버거를 릴리에게 전달할 준비가 되었습니다. 릴리 옆으로 가서 말을 걸어 전달해 주세요! 🐱";
      } else if (activeQuest.status === "completed") {
        return "🎉 릴리의 햄버거 배달 미션을 멋지게 성공했습니다! 주민들과 다른 미션도 자유롭게 연습해 보세요!";
      } else if (activeQuest.status === "idle") {
        return "고양이 주민 릴리🐱가 하늘이에게 부탁할 심부름이 있는 것 같아요. 릴리에게 다가가 말을 걸어보세요!";
      }
    }
    
    // Default message
    return "길을 따라 걸으며 버디🐻, 릴리🐱, 로키🦊, 모찌🐰를 만나 인사하고, 다양한 일상 생활 자립 미션(Kiosk, ATM 등)을 연습해 보세요! 🐾";
  }, [collectNotif, activeQuest, inventory]);

  // ── Wandering NPC Positions State ──
  const [npcPositions, setNpcPositions] = useState<Record<NpcKey, TileCoord>>(() => ({
    buddy: { col: 2, row: 7 }, // in front of buddy's house (col 2, row 6)
    lily: { col: 6, row: 4 },  // in front of lily's house
    rocky: { col: 5, row: 9 }, // in front of rocky's house
    mochi: { col: 14, row: 9 } // in front of mochi's house
  }));

  const npcPositionsRef = useRef<Record<NpcKey, TileCoord>>({
    buddy: { col: 2, row: 7 },
    lily: { col: 6, row: 4 },
    rocky: { col: 5, row: 9 },
    mochi: { col: 14, row: 9 }
  });

  useEffect(() => {
    npcPositionsRef.current = npcPositions;
  }, [npcPositions]);

  // Wandering NPC movement effect timer
  useEffect(() => {
    if (indoorArea !== "village") return;

    const timer = setInterval(() => {
      setNpcPositions(prev => {
        const next = { ...prev };
        const randomNpc = NPC_ORDER[Math.floor(Math.random() * NPC_ORDER.length)];
        const currentPos = prev[randomNpc];

        const moves = [
          { col: currentPos.col, row: currentPos.row - 1 },
          { col: currentPos.col, row: currentPos.row + 1 },
          { col: currentPos.col - 1, row: currentPos.row },
          { col: currentPos.col + 1, row: currentPos.row }
        ];

        const home = NPCS[randomNpc].tile;
        const validMoves = moves.filter(m => {
          if (!isWalkable(m)) return false;
          const playerTile = getTileFromPos(playerPos.current);
          if (m.col === playerTile.col && m.row === playerTile.row) return false;
          const npcCollision = Object.values(next).some(pos => pos.col === m.col && pos.row === m.row);
          if (npcCollision) return false;
          const dist = Math.abs(m.col - home.col) + Math.abs(m.row - home.row);
          return dist <= 4; // Keep within 4 steps of home
        });

        if (validMoves.length > 0 && Math.random() < 0.35) { // 35% chance to wander
          next[randomNpc] = validMoves[Math.floor(Math.random() * validMoves.length)];
        }

        return next;
      });
    }, 4000); // Check every 4 seconds

    return () => clearInterval(timer);
  }, [indoorArea]);

  // ── Pocket Pockets/Cards Combined Display Slots ──
  const packedItemIdsRef = useRef<string[]>([]);
  useEffect(() => {
    packedItemIdsRef.current = packedItemIds;
  }, [packedItemIds]);

  const displaySlots = useMemo(() => {
    const slots = Array(20).fill(null);
    let fillIdx = 0;

    // 1. Fill with packed card items first (with customized card/device emojis & badges)
    packedItemIds.forEach(itemId => {
      const card = POCKET_ITEMS.find(x => x.id === itemId);
      if (card && fillIdx < 20) {
        let emoji = "💳";
        if (itemId === "bus_card") emoji = "🚌";
        else if (itemId === "payment_card") emoji = "💳";
        else if (itemId === "bank_card") emoji = "🏦";
        else if (itemId === "student_id") emoji = "🪪";
        else if (itemId === "phone") emoji = "📱";
        else if (itemId === "emergency_card") emoji = "🚨";
        else if (itemId === "cash") emoji = "💵";
        else if (itemId === "fishing_rod") emoji = "🎣";

        slots[fillIdx] = {
          id: itemId,
          name: card.name,
          emoji: emoji,
          count: 1,
          rarity: "common",
          isCard: true,
          iconText: card.icon,
          origIdx: -1
        };
        fillIdx++;
      }
    });

    // 2. Fill with collected materials from inventory
    inventory.forEach((item, idx) => {
      if (item && fillIdx < 20) {
        slots[fillIdx] = {
          ...item,
          isCard: false,
          origIdx: idx
        };
        fillIdx++;
      }
    });

    return slots;
  }, [packedItemIds, inventory]);

  // Load packed items from student house pocket config
  useEffect(() => {
    try {
      const saved = localStorage.getItem("haemileum_packed_items");
      if (saved) setPackedItemIds(JSON.parse(saved));
    } catch { /**/ }
  }, []);

  // Load pocket inventory & storage cabinet items
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem("haemileum_village_inventory");
      if (savedInv) {
        const parsed = JSON.parse(savedInv);
        const filled = [...parsed, ...Array(20).fill(null)].slice(0, 20);
        setInventory(filled);
      } else {
        setInventory(Array(20).fill(null));
      }
    } catch {
      setInventory(Array(20).fill(null));
    }

    try {
      const savedStore = localStorage.getItem("haemileum_house_storage");
      if (savedStore) setHouseStorage(JSON.parse(savedStore));
    } catch { /**/ }
  }, []);

  const packHouseItem = (itemId: string) => {
    // Check if pocket has room (cards + materials <= 20)
    const totalOccupied = packedItemIds.length + inventory.filter(x => x !== null).length;
    if (totalOccupied >= 20) {
      setCollectNotif({ emoji: "🎒", name: "주머니가 가득 차서 더 챙길 수 없습니다!", points: 0 });
      playSound("click");
      setTimeout(() => setCollectNotif(null), 1500);
      return;
    }

    // 1. Add to packed items
    setPackedItemIds(prev => {
      const next = Array.from(new Set([...prev, itemId]));
      localStorage.setItem("haemileum_packed_items", JSON.stringify(next));
      return next;
    });

    // 2. Automatically unlock ownership of this item (add to haemileum_owned_items)
    try {
      const rawOwned = localStorage.getItem("haemileum_owned_items");
      const owned = rawOwned ? JSON.parse(rawOwned) : [];
      if (Array.isArray(owned)) {
        if (!owned.includes(itemId)) {
          const nextOwned = [...owned, itemId];
          localStorage.setItem("haemileum_owned_items", JSON.stringify(nextOwned));
        }
      }
    } catch {
      localStorage.setItem("haemileum_owned_items", JSON.stringify([itemId]));
    }

    // 3. Automatically build/unlock the room (add to haemileum_home_rooms)
    let roomId = "";
    if (["bus_card", "payment_card"].includes(itemId)) roomId = "door";
    else if (["bank_card", "student_id"].includes(itemId)) roomId = "desk";
    else if (["phone", "emergency_card", "cash"].includes(itemId)) roomId = "safety";

    if (roomId) {
      try {
        const rawRooms = localStorage.getItem("haemileum_home_rooms");
        const rooms = rawRooms ? JSON.parse(rawRooms) : [];
        if (Array.isArray(rooms)) {
          if (!rooms.includes(roomId)) {
            const nextRooms = [...rooms, roomId];
            localStorage.setItem("haemileum_home_rooms", JSON.stringify(nextRooms));
          }
        }
      } catch {
        localStorage.setItem("haemileum_home_rooms", JSON.stringify([roomId]));
      }
    }

    window.dispatchEvent(new Event("storage"));
    playSound("pickup");
  };

  const unpackHouseItem = (itemId: string) => {
    setPackedItemIds(prev => {
      const next = prev.filter(id => id !== itemId);
      localStorage.setItem("haemileum_packed_items", JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
    playSound("click");
  };

  // ── Canvas / Player Refs ──
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteRef    = useRef<HTMLImageElement|null>(null);
  const spriteReady  = useRef(false);
  const dprRef       = useRef(1);
  const houseImagesRef = useRef<{
    buddy: HTMLCanvasElement | null;
    lily: HTMLCanvasElement | null;
    rocky: HTMLCanvasElement | null;
    mochi: HTMLCanvasElement | null;
    myhouse: HTMLCanvasElement | null;
  }>({
    buddy: null,
    lily: null,
    rocky: null,
    mochi: null,
    myhouse: null,
  });

  const npcImagesRef = useRef<Record<NpcKey, HTMLImageElement | null>>({
    buddy: null,
    lily: null,
    rocky: null,
    mochi: null,
  });

  const playerPos  = useRef<Point>({ x:8*46+23, y:5*46+23 }); // updated after resize
  const playerDir  = useRef<Direction8>("down");
  const activeKeys = useRef<Record<string,boolean>>({});
  const pathQueue  = useRef<Point[]>([]);
  const walkingRef = useRef(false);
  const wobbleRef  = useRef(0);
  const targetNpc  = useRef<NpcKey|null>(null);
  const targetItem = useRef<string|null>(null);
  const targetMission = useRef<"bus" | "kiosk" | "atm" | "parking" | "mind" | "school" | "safety" | "fishing" | null>(null);
  const targetFurniture = useRef<"door" | "desk" | "safety" | null>(null);
  const animFrame  = useRef(0);
  const nibbleTimer = useRef<any>(null);
  const catchTimer  = useRef<any>(null);

  const [renderTick, setRenderTick] = useState(0);
  const [isWalking,  setIsWalking]  = useState(false);

  // Synchronous references for loop access without recreates
  const floatingItemsRef = useRef<FloatingCollectible[]>([]);
  useEffect(() => {
    floatingItemsRef.current = floatingItems;
  }, [floatingItems]);

  const inventoryRef = useRef<(InventoryItem | null)[]>([]);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  const talkedNpcsRef = useRef<string[]>([]);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // ── Audio Synthesis for Retro AC Feedback ──
  const playSound = useCallback((type: "pickup" | "click" | "mission" | "npc" | "phone_open" | "phone_close" | "eat") => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "pickup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "npc") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "mission") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "phone_open") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "phone_close") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "eat") {
        osc.type = "triangle";
        // cute crunching click chew
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // ── Load & sync mission states ──
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("haemileum_village_mission_progress");
      if (savedProgress) setMissionProgress(JSON.parse(savedProgress));
      
      const savedCompleted = localStorage.getItem("haemileum_village_mission_completed");
      if (savedCompleted) setCompletedMissions(JSON.parse(savedCompleted));

      const savedTalked = localStorage.getItem("haemileum_village_mission_talked");
      if (savedTalked) talkedNpcsRef.current = JSON.parse(savedTalked);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const triggerMissionComplete = useCallback((m: VillageMission) => {
    setCompletedMissions(prev => {
      const next = { ...prev, [m.id]: true };
      localStorage.setItem("haemileum_village_mission_completed", JSON.stringify(next));
      return next;
    });
    setTotalPoints(p => {
      const nextPts = p + m.points;
      localStorage.setItem("haemileum_village_points", String(nextPts));
      return nextPts;
    });
    playSound("mission");
    setCelebratingMission(m);
  }, [playSound]);

  const updateMissionProgress = useCallback((type: VillageMission["targetType"], val: number, extraId?: string) => {
    setMissionProgress(prev => {
      let updated = false;
      const next = { ...prev };
      
      const savedCompletedStr = localStorage.getItem("haemileum_village_mission_completed") || "{}";
      let localCompleted: Record<string, boolean> = {};
      try {
        localCompleted = JSON.parse(savedCompletedStr);
      } catch { /**/ }

      VILLAGE_MISSIONS.forEach(m => {
        if (m.targetType === type && !localCompleted[m.id]) {
          if (type === "talk_all" && extraId) {
            const currentTalked = talkedNpcsRef.current;
            if (!currentTalked.includes(extraId)) {
              const nextTalked = [...currentTalked, extraId];
              talkedNpcsRef.current = nextTalked;
              localStorage.setItem("haemileum_village_mission_talked", JSON.stringify(nextTalked));
              next[m.id] = nextTalked.length;
              updated = true;

              if (nextTalked.length >= m.targetValue) {
                triggerMissionComplete(m);
              }
            }
          } else {
            const currentVal = next[m.id] || 0;
            const nextVal = currentVal + val;
            next[m.id] = nextVal;
            updated = true;

            if (nextVal >= m.targetValue) {
              triggerMissionComplete(m);
            }
          }
        }
      });

      if (updated) {
        localStorage.setItem("haemileum_village_mission_progress", JSON.stringify(next));
      }
      return next;
    });
  }, [triggerMissionComplete]);

  // ── Inventory management helpers ──

  const addToInventory = useCallback((config: CollectibleConfig) => {
    setInventory(prev => {
      const next = [...prev];
      let success = false;
      // Stacking logic: stack identical item up to 10
      const existingIdx = next.findIndex(item => item !== null && item.id === config.id && item.count < 10);
      if (existingIdx !== -1 && next[existingIdx] !== null) {
        next[existingIdx] = {
          ...next[existingIdx]!,
          count: next[existingIdx]!.count + 1
        };
        success = true;
      } else {
        const emptyIdx = next.findIndex(item => item === null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = {
            id: config.id,
            name: config.name,
            emoji: config.emoji,
            count: 1,
            rarity: config.rarity
          };
          success = true;
        }
      }
      if (success) {
        localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const startFishing = () => {
    playSound("click");
    setFishingState("waiting");
    setCaughtFish(null);

    const waitTime = 1500 + Math.random() * 2000;
    
    if (nibbleTimer.current) clearTimeout(nibbleTimer.current);
    if (catchTimer.current) clearTimeout(catchTimer.current);

    nibbleTimer.current = setTimeout(() => {
      setFishingState("nibble");
      playSound("npc");

      catchTimer.current = setTimeout(() => {
        setFishingState("missed");
        playSound("click");
      }, 1200);
    }, waitTime);
  };

  const pullFishingRod = () => {
    if (fishingState !== "nibble") return;
    
    if (catchTimer.current) clearTimeout(catchTimer.current);
    playSound("pickup");

    const isGoldfish = Math.random() < 0.3;
    const fishConfig = isGoldfish
      ? { id: "goldfish", name: "금붕어", emoji: "🐠", rarity: "rare" as const, points: 30 }
      : { id: "catfish", name: "메기", emoji: "🐟", rarity: "common" as const, points: 10 };

    addToInventory({
      id: fishConfig.id,
      name: fishConfig.name,
      emoji: fishConfig.emoji,
      rarity: fishConfig.rarity,
      points: fishConfig.points,
      appearsAt: ["morning", "afternoon", "evening", "night", "dawn"]
    });

    setCaughtFish(fishConfig);
    setFishingState("caught");

    setTotalPoints(p => {
      const next = p + fishConfig.points;
      localStorage.setItem("haemileum_village_points", String(next));
      return next;
    });

    setCaughtCount(c => {
      const next = { ...c, [fishConfig.id]: (c[fishConfig.id] || 0) + 1 };
      localStorage.setItem("haemileum_village_items", JSON.stringify(next));
      return next;
    });

    updateMissionProgress("collect_any", 1);
  };

  const cancelFishing = () => {
    if (nibbleTimer.current) clearTimeout(nibbleTimer.current);
    if (catchTimer.current) clearTimeout(catchTimer.current);
    setFishingState("idle");
    setCaughtFish(null);
    setActiveMissionModal(null);
    playSound("phone_close");
  };

  const eatItem = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (!item) return;

    playSound("eat");
    setInventory(prev => {
      const next = [...prev];
      if (next[slotIdx]!.count > 1) {
        next[slotIdx] = { ...next[slotIdx]!, count: next[slotIdx]!.count - 1 };
      } else {
        next[slotIdx] = null;
      }
      localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
      return next;
    });

    setCollectNotif({ emoji: "😋", name: `우물우물... ${item.name}을(를) 맛있게 먹었습니다!`, points: 0 });
    setTimeout(() => setCollectNotif(null), 1800);
    setActiveSlotAction(null);
  };

  const dropItem = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (!item) return;

    const currentTile = getTileFromPos(playerPos.current);
    const collectibleCfg = COLLECTIBLES.find(c => c.id === item.id);
    if (collectibleCfg) {
      // Spawn back on ground in village map
      setInventory(prev => {
        const next = [...prev];
        if (next[slotIdx]!.count > 1) {
          next[slotIdx] = { ...next[slotIdx]!, count: next[slotIdx]!.count - 1 };
        } else {
          next[slotIdx] = null;
        }
        localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
        return next;
      });

      setFloatingItems(prev => [
        ...prev,
        {
          id: `fi-dropped-${Date.now()}-${Math.random()}`,
          config: collectibleCfg,
          tile: currentTile,
          collected: false
        }
      ]);

      playSound("click");
      setCollectNotif({ emoji: "🍂", name: `${item.name}을(를) 바닥에 버렸습니다.`, points: 0 });
      setTimeout(() => setCollectNotif(null), 1500);
      setActiveSlotAction(null);
    }
  };

  const storeItem = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (!item) return;

    // Remove from pocket
    setInventory(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
      return next;
    });

    // Add to house cabinet storage
    setHouseStorage(prev => {
      const next = [...prev];
      const existingIdx = next.findIndex(x => x.id === item.id);
      if (existingIdx !== -1) {
        next[existingIdx].count += item.count;
      } else {
        next.push({ ...item });
      }
      localStorage.setItem("haemileum_house_storage", JSON.stringify(next));
      return next;
    });

    playSound("click");
    setCollectNotif({ emoji: "🏡", name: `${item.name}을(를) 보관창고에 넣었습니다.`, points: 0 });
    setTimeout(() => setCollectNotif(null), 1500);
    setActiveSlotAction(null);
  };

  const withdrawItem = (storageIdx: number) => {
    const item = houseStorage[storageIdx];
    if (!item) return;

    // Check if pocket is full (cards + items)
    const totalOccupied = packedItemIds.length + inventory.filter(x => x !== null).length;
    const hasRoom = totalOccupied < 20 || inventory.some(x => x !== null && x.id === item.id && x.count < 10);
    if (!hasRoom) {
      setCollectNotif({ emoji: "🎒", name: "주머니가 가득 차서 꺼낼 수 없습니다!", points: 0 });
      playSound("click");
      setTimeout(() => setCollectNotif(null), 1500);
      return;
    }

    // Decrement from storage
    setHouseStorage(prev => {
      const next = [...prev];
      if (next[storageIdx].count > 1) {
        next[storageIdx] = { ...next[storageIdx], count: next[storageIdx].count - 1 };
      } else {
        next.splice(storageIdx, 1);
      }
      localStorage.setItem("haemileum_house_storage", JSON.stringify(next));
      return next;
    });

    // Add 1 to inventory pockets
    setInventory(prev => {
      const next = [...prev];
      const existingIdx = next.findIndex(x => x !== null && x.id === item.id && x.count < 10);
      if (existingIdx !== -1 && next[existingIdx] !== null) {
        next[existingIdx] = { ...next[existingIdx]!, count: next[existingIdx]!.count + 1 };
      } else {
        const emptyIdx = next.findIndex(x => x === null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = {
            id: item.id,
            name: item.name,
            emoji: item.emoji,
            count: 1,
            rarity: item.rarity
          };
        }
      }
      localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
      return next;
    });

    playSound("pickup");
  };

  // ── HiDPI Resize ──
  useEffect(() => {
    const container=containerRef.current, canvas=canvasRef.current;
    if (!container||!canvas) return;
    const resize=()=>{
      const dpr=window.devicePixelRatio||1; dprRef.current=dpr;
      const cssW=container.clientWidth;
      const cssH=Math.round(cssW*(GRID_ROWS/GRID_COLS));
      TILE_SIZE=Math.floor(cssW/GRID_COLS);
      canvas.width=cssW*dpr; canvas.height=cssH*dpr;
      canvas.style.width=`${cssW}px`; canvas.style.height=`${cssH}px`;
      // reset player pos to center of start tile
      playerPos.current={ x:8*TILE_SIZE+TILE_SIZE/2, y:5*TILE_SIZE+TILE_SIZE/2 };
      const ctx=canvas.getContext("2d"); if(ctx) ctx.scale(dpr,dpr);
    };
    resize();
    const ro=new ResizeObserver(resize); ro.observe(container);
    return ()=>ro.disconnect();
  }, []);

  // ── Sprite ──
  useEffect(() => {
    const img=new window.Image(); spriteRef.current=img;
    img.src=CHARACTER_CFG[character].sprite;
    img.onload=()=>{ spriteReady.current=true; };
    return ()=>{ img.onload=null; };
  }, [character]);

  // ── Preload House Images ──
  useEffect(() => {
    const images = {
      buddy: "/assets/images/houses/media__1781401939719.jpg",
      lily: "/assets/images/houses/lily_house.jpg",
      rocky: "/assets/images/houses/media__1781401939703.jpg",
      mochi: "/assets/images/houses/media__1781401939701.jpg",
      myhouse: "/assets/images/houses/myhouse.jpg",
    };

    Object.entries(images).forEach(([key, src]) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        const processedCanvas = makeBackgroundTransparent(img);
        (houseImagesRef.current as any)[key] = processedCanvas;
      };
    });
  }, []);

  // ── Preload NPC Images ──
  useEffect(() => {
    const npcImages: Record<NpcKey, string> = {
      buddy: "/assets/npcs/buddy.png",
      lily: "/assets/npcs/lily.png",
      rocky: "/assets/npcs/rocky.png",
      mochi: "/assets/npcs/mochi.png",
    };

    Object.entries(npcImages).forEach(([key, src]) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        npcImagesRef.current[key as NpcKey] = img;
      };
    });
  }, []);

  // ── BGM ──
  useEffect(() => {
    const audio=new Audio("/assets/sound/town.mp3");
    audio.loop=true;
    audio.volume=0.22;
    bgmRef.current = audio;
    const play=()=>{
      if (isBgmOn) audio.play().catch(()=>{});
    };
    play();
    window.addEventListener("pointerdown",play,{once:true});
    window.addEventListener("keydown",play,{once:true});
    return ()=>{ audio.pause(); audio.src=""; };
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      if (isBgmOn) {
        bgmRef.current.play().catch(() => {});
      } else {
        bgmRef.current.pause();
      }
    }
  }, [isBgmOn]);

  // ── Keyboard ──
  useEffect(() => {
    const down=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(),c=e.code.toLowerCase();
      if (e.key === " " || e.code === "Space") {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        if (indoorAreaRef.current === "myhouse" && nearbyFurnitureRef.current && !activeFurnitureModalRef.current) {
          playSound("click");
          setActiveFurnitureModal(nearbyFurnitureRef.current);
          setHouseActiveTab("cards");
        }
        return;
      }
      if (!MOVE_KEYS.has(k)&&!MOVE_KEYS.has(c)) return;
      e.preventDefault();
      activeKeys.current[k]=true; activeKeys.current[c]=true;
      pathQueue.current=[]; targetNpc.current=null; targetItem.current=null; targetMission.current=null; targetFurniture.current=null;
      walkingRef.current=true; setIsWalking(true);
    };
    const up=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(),c=e.code.toLowerCase();
      if (!MOVE_KEYS.has(k)&&!MOVE_KEYS.has(c)) return;
      e.preventDefault();
      activeKeys.current[k]=false; activeKeys.current[c]=false;
    };
    window.addEventListener("keydown",down);
    window.addEventListener("keyup",up);
    return ()=>{ window.removeEventListener("keydown",down); window.removeEventListener("keyup",up); };
  }, []);

  // ── Collect item (called when player overlaps/arrives at item) ──
  const collectItem = useCallback((id:string) => {
    const itemToCollect = floatingItemsRef.current.find(f => f.id === id);
    if (!itemToCollect || itemToCollect.collected) return;
    
    const config = itemToCollect.config;
    const inv = inventoryRef.current;
    
    const totalOccupied = packedItemIdsRef.current.length + inv.filter(x => x !== null).length;
    const hasRoom = totalOccupied < 20 || inv.some(x => x !== null && x.id === config.id && x.count < 10);
    
    if (!hasRoom) {
      setCollectNotif({ emoji: "🎒", name: "주머니가 가득 찼습니다!", points: 0 });
      playSound("click");
      setTimeout(() => setCollectNotif(null), 1500);
      return;
    }

    addToInventory(config);

    setFloatingItems(prev=>{
      const fi=prev.find(f=>f.id===id); if(!fi||fi.collected) return prev;
      setCaughtCount(c=>{ const n={...c,[fi.config.id]:(c[fi.config.id]||0)+1}; localStorage.setItem("haemileum_village_items",JSON.stringify(n)); return n; });
      setTotalPoints(p=>{ const n=p+fi.config.points; localStorage.setItem("haemileum_village_points",String(n)); return n; });
      
      playSound("pickup");

      if (fi.config.id === "mushroom") {
        updateMissionProgress("collect_mushroom", 1);
      }
      updateMissionProgress("collect_any", 1);

      setCollectNotif({emoji:fi.config.emoji,name:fi.config.name,points:fi.config.points});
      setTimeout(()=>{ setFloatingItems(p=>p.filter(f=>f.id!==id)); setCollectNotif(null); },1200);
      return prev.map(f=>f.id===id?{...f,collected:true,sparkle:true}:f);
    });
    targetItem.current=null;
  }, [playSound, updateMissionProgress, addToInventory]);

  const removeBurgerFromInventory = useCallback(() => {
    setInventory(prev => {
      const next = [...prev];
      const idx = next.findIndex(item => item !== null && item.id === "burger");
      if (idx !== -1 && next[idx] !== null) {
        if (next[idx]!.count > 1) {
          next[idx] = { ...next[idx]!, count: next[idx]!.count - 1 };
        } else {
          next[idx] = null;
        }
        localStorage.setItem("haemileum_village_inventory", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // ── NPC Dialog — only called when player physically arrives ──
  const triggerNpcDialog = useCallback((npcKey:NpcKey) => {
    const npc=NPCS[npcKey];
    
    // Check Lily Quest
    let isQuestTalk = false;
    let localQuest: any = null;
    try {
      const saved = localStorage.getItem("haemileum_active_quest");
      if (saved) localQuest = JSON.parse(saved);
    } catch { /**/ }

    if (npcKey === "lily" && localQuest && localQuest.status !== "completed") {
      isQuestTalk = true;
      // Fetch latest inventory from localStorage to be 100% accurate
      let currentInv: any[] = [];
      try {
        const savedInv = localStorage.getItem("haemileum_village_inventory");
        if (savedInv) currentInv = JSON.parse(savedInv);
      } catch { /**/ }
      
      const hasBurger = currentInv.some(item => item && item.id === "burger");

      if (hasBurger) {
        setDialogText("하늘아! 🍔 햄버거를 정말 사다 줬구나! 게다가 안전하게 키오스크 결제하는 훈련도 멋지게 마쳤대서 릴리는 정말 기뻐. 정말 예의 바르고 씩씩한 네가 도와줘서 고마워! 이건 내 작은 선물이야...!");
        const updated = { ...localQuest, status: "ready_to_deliver" };
        setActiveQuest(updated);
        localStorage.setItem("haemileum_active_quest", JSON.stringify(updated));
      } else if (localQuest.status === "active") {
        setDialogText("패스트푸드 가게(Kiosk)의 무인 단말기에서 카드로 주문하면 🍔 햄버거를 얻을 수 있을 거야... 조심히 잘 다녀와, 하늘아! 기다릴게...");
      } else {
        setDialogText("저기... 하늘아...🐱 혹시 나 대신 패스트푸드점에 가서 🍔 햄버거를 사다 줄 수 있니? 내가 직접 키오스크로 주문해보고 싶은데, 기계가 너무 복잡하고 아직 혼자 가기가 조금 무섭고 긴장돼서... 하늘이가 대신 안전하게 카드로 키오스크 주문하는 연습을 하고 햄버거를 전해주면 안 될까...? 부탁할게!");
      }
    }

    if (!isQuestTalk) {
      const lines=npc.dialogs[timeOfDay];
      setDialogText(lines[Math.floor(Math.random()*lines.length)]);
    }

    setSelectedNpc(npcKey);
    addXp(npcKey,5);

    // Synthesis cute double pop
    playSound("npc");

    // Progress talk missions
    updateMissionProgress("talk_npc", 1);
    updateMissionProgress("talk_all", 1, npcKey);

    pathQueue.current=[]; targetNpc.current=null; targetItem.current=null; targetMission.current=null; targetFurniture.current=null;
    walkingRef.current=false; setIsWalking(false);
  }, [timeOfDay, addXp, playSound, updateMissionProgress, activeQuest]);

  // ── Item-reach event listener ──
  useEffect(() => {
    const h=(e:Event)=>{ const {id}=(e as CustomEvent<{id:string}>).detail; collectItem(id); };
    window.addEventListener("village-item-reach",h);
    return ()=>window.removeEventListener("village-item-reach",h);
  }, [collectItem]);

  // ── Game Loop ──
  useEffect(() => {
    const getKeyVec=()=>{
      const k=activeKeys.current; let dx=0,dy=0;
      if (k.arrowup||k.w||k.keyw)   dy-=1;
      if (k.arrowdown||k.s||k.keys)  dy+=1;
      if (k.arrowleft||k.a||k.keya)  dx-=1;
      if (k.arrowright||k.d||k.keyd) dx+=1;
      return (dx===0&&dy===0) ? null : {x:dx,y:dy};
    };
    const checkItemPickup=()=>{
      const tid=targetItem.current; if(!tid) return;
      window.dispatchEvent(new CustomEvent("village-item-reach",{detail:{id:tid}}));
    };
    const checkMissionTrigger=()=>{
      const tm = targetMission.current; if(!tm) return;
      setActiveMissionModal(tm);
      targetMission.current = null;
    };
    const checkFurnitureTrigger=()=>{
      const tf = targetFurniture.current; if(!tf) return;
      setActiveFurnitureModal(tf);
      setHouseActiveTab("cards");
      targetFurniture.current = null;
    };

    const tick=()=>{
      const kv=getKeyVec();
      if (kv) {
        pathQueue.current=[]; targetItem.current=null; targetNpc.current=null; targetMission.current=null; targetFurniture.current=null;
        const len=Math.hypot(kv.x,kv.y)||1;
        const dx=(kv.x/len)*MOVE_SPEED, dy=(kv.y/len)*MOVE_SPEED;
        playerDir.current=get8Dir(dx,dy);
        const next:Point={x:playerPos.current.x+dx, y:playerPos.current.y+dy};
        const nextTile=getTileFromPos(next);
        
        if (indoorArea === "myhouse") {
          if (isWalkableIndoor(nextTile)) {
            playerPos.current=next;
          }
        } else {
          if (isWalkable(nextTile)) {
            let npcAtTile: NpcKey | null = null;
            for (const key of NPC_ORDER) {
              const pos = npcPositionsRef.current[key];
              if (nextTile.col === pos.col && nextTile.row === pos.row) {
                npcAtTile = key;
                break;
              }
            }
            if (npcAtTile) { triggerNpcDialog(npcAtTile); }
            else { playerPos.current=next; }
          }
        }
        wobbleRef.current=(wobbleRef.current+0.15)%(Math.PI*2);
        walkingRef.current=true;
      } else if (pathQueue.current.length>0) {
        const wp=pathQueue.current[0];
        const {x:cx,y:cy}=playerPos.current;
        const dx=wp.x-cx, dy=wp.y-cy, dist=Math.hypot(dx,dy);
        if (dist>0) playerDir.current=get8Dir(dx,dy);
        if (dist<=MOVE_SPEED) {
          const wpTile=getTileFromPos(wp);
          if (indoorArea === "myhouse") {
            pathQueue.current.shift();
            playerPos.current=wp;
            if (pathQueue.current.length===0) {
              checkFurnitureTrigger();
            }
          } else {
            let npcAtTile: NpcKey | null = null;
            for (const key of NPC_ORDER) {
              const pos = npcPositionsRef.current[key];
              if (wpTile.col === pos.col && wpTile.row === pos.row) {
                npcAtTile = key;
                break;
              }
            }
            if (npcAtTile) { triggerNpcDialog(npcAtTile); }
            else {
              pathQueue.current.shift();
              playerPos.current=wp;
              if (pathQueue.current.length===0) {
                checkItemPickup();
                checkMissionTrigger();
              }
            }
          }
        } else {
          const step:Point={x:cx+(dx/dist)*MOVE_SPEED, y:cy+(dy/dist)*MOVE_SPEED};
          const stepTile=getTileFromPos(step);
          if (indoorArea === "myhouse") {
            if (isWalkableIndoor(stepTile)) {
              playerPos.current=step;
            } else {
              pathQueue.current=[];
            }
          } else {
            if (isWalkable(stepTile)) {
              let npcAtTile: NpcKey | null = null;
              for (const key of NPC_ORDER) {
                const pos = npcPositionsRef.current[key];
                if (stepTile.col === pos.col && stepTile.row === pos.row) {
                  npcAtTile = key;
                  break;
                }
              }
              if (npcAtTile) { triggerNpcDialog(npcAtTile); }
              else { playerPos.current=step; }
            } else {
              pathQueue.current=[]; targetItem.current=null;
            }
          }
        }
        wobbleRef.current=(wobbleRef.current+0.15)%(Math.PI*2);
        walkingRef.current=true;
      } else {
        walkingRef.current=false; wobbleRef.current=0;
      }

      // Check adjacent / current coordinates
      const pTile=getTileFromPos(playerPos.current);

      if (indoorArea === "myhouse") {
        // Transition Back to Village on Exit Mat (5)
        if (INDOOR_GRID[pTile.row]?.[pTile.col] === 5) {
          setIndoorArea("village");
          playerPos.current = { x: 12 * TILE_SIZE + TILE_SIZE/2, y: 7 * TILE_SIZE + TILE_SIZE/2 };
          pathQueue.current = [];
          playSound("phone_close");
        }

        // Check proximity to indoor furniture pieces
        let nearFurniture: "door" | "desk" | "safety" | null = null;
        for (const nb of [
          {col:pTile.col,row:pTile.row-1},{col:pTile.col,row:pTile.row+1},
          {col:pTile.col-1,row:pTile.row},{col:pTile.col+1,row:pTile.row},
          {col:pTile.col,row:pTile.row},
        ]) {
          if (nb.row >= 0 && nb.row < GRID_ROWS && nb.col >= 0 && nb.col < GRID_COLS) {
            const val = INDOOR_GRID[nb.row][nb.col];
            if (val === 2) nearFurniture = "door";
            else if (val === 3) nearFurniture = "desk";
            else if (val === 4) nearFurniture = "safety";
          }
        }
        setNearbyFurniture(nearFurniture);
        setIsNearMyHouse(false);
        setNearbyNpc(null);
        setIsNearBusStop(false);
        setIsNearKiosk(false);
        setIsNearAtm(false);
        setIsNearParking(false);
        setIsNearMind(false);
        setIsNearSchool(false);
        setIsNearSafety(false);
        setIsNearFishDock(false);
      } else {
        // Transition Indoor when entering My House (11)
        if (getTileKind(pTile.col, pTile.row) === TILE.myhouse) {
          setIndoorArea("myhouse");
          playerPos.current = { x: 12 * TILE_SIZE + TILE_SIZE/2, y: 13 * TILE_SIZE + TILE_SIZE/2 };
          pathQueue.current = [];
          playSound("phone_open");
        }

        // Check proximity to wandering NPCs
        let foundNearby: NpcKey | null = null;
        for (const key of NPC_ORDER) {
          const pos = npcPositionsRef.current[key];
          if (Math.abs(pTile.col - pos.col) <= 1 && Math.abs(pTile.row - pos.row) <= 1) {
            foundNearby = key;
            break;
          }
        }
        setNearbyNpc(foundNearby);

        // Check proximity to My House building
        let nearHouse = false;
        for (const nb of [
          {col:pTile.col,row:pTile.row},{col:pTile.col+1,row:pTile.row},
          {col:pTile.col-1,row:pTile.row},{col:pTile.col,row:pTile.row+1},
          {col:pTile.col,row:pTile.row-1},
        ]) {
          if (getTileKind(nb.col, nb.row) === TILE.myhouse) {
            nearHouse = true; break;
          }
        }
        setIsNearMyHouse(nearHouse);
        setNearbyFurniture(null);

        // Check proximity to mission spots
        let nearBusStop = false;
        let nearKiosk = false;
        let nearAtm = false;
        let nearParking = false;
        let nearMind = false;
        let nearSchool = false;
        let nearSafety = false;
        let nearFishDock = false;
        for (const nb of [
          {col:pTile.col,row:pTile.row},{col:pTile.col+1,row:pTile.row},
          {col:pTile.col-1,row:pTile.row},{col:pTile.col,row:pTile.row+1},
          {col:pTile.col,row:pTile.row-1},
        ]) {
          const kind = getTileKind(nb.col, nb.row);
          if (kind === TILE.busstop) nearBusStop = true;
          else if (kind === TILE.kiosk) nearKiosk = true;
          else if (kind === TILE.atm) nearAtm = true;
          else if (kind === TILE.parking) nearParking = true;
          else if (kind === TILE.mind) nearMind = true;
          else if (kind === TILE.school) nearSchool = true;
          else if (kind === TILE.safety) nearSafety = true;
          else if (kind === TILE.fishdock) nearFishDock = true;
        }
        setIsNearBusStop(nearBusStop);
        setIsNearKiosk(nearKiosk);
        setIsNearAtm(nearAtm);
        setIsNearParking(nearParking);
        setIsNearMind(nearMind);
        setIsNearSchool(nearSchool);
        setIsNearSafety(nearSafety);
        setIsNearFishDock(nearFishDock);

        // Proximity overlap item collection (walk-into item pickup)
        const activeItems = floatingItemsRef.current;
        const overlappingItem = activeItems.find(
          (fi) => !fi.collected && !fi.sparkle && fi.tile.col === pTile.col && fi.tile.row === pTile.row
        );
        if (overlappingItem) {
          window.dispatchEvent(new CustomEvent("village-item-reach", { detail: { id: overlappingItem.id } }));
        }
      }

      setIsWalking(walkingRef.current);
      setRenderTick(t=>t+1);
      animFrame.current=requestAnimationFrame(tick);
    };
    animFrame.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(animFrame.current);
  }, [triggerNpcDialog, indoorArea, playSound]);

  // ── Canvas Draw ──
  useEffect(() => {
    const canvas=canvasRef.current, ctx=canvas?.getContext("2d");
    if (!canvas||!ctx) return;
    ctx.setTransform(dprRef.current,0,0,dprRef.current,0,0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const tc=TIME_CFG[timeOfDay];
    const now=Date.now();
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (indoorArea === "myhouse") {
      // ── Draw Cozy Indoor Room ──
      for (let row=0;row<GRID_ROWS;row++) {
        for (let col=0;col<GRID_COLS;col++) {
          const kind=INDOOR_GRID[row][col];
          const x=col*TILE_SIZE, y=row*TILE_SIZE;
          if (kind === 1) {
            // Wood floor boards grid
            ctx.fillStyle="#fbf7f0"; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
            ctx.strokeStyle="rgba(140,98,57,0.06)"; ctx.lineWidth=1;
            ctx.strokeRect(x,y,TILE_SIZE,TILE_SIZE);
          } else if (kind === 5) {
            // Exit mat Welcome Rug
            ctx.fillStyle="#b08050"; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
            ctx.fillStyle="#ffffff"; ctx.font=`bold ${TILE_SIZE*0.25}px sans-serif`;
            ctx.textAlign="center"; ctx.textBaseline="middle";
            ctx.fillText("EXIT", x+TILE_SIZE/2, y+TILE_SIZE/2);
          } else {
            // Cozy indoor brick/striped wallpaper
            ctx.fillStyle="#e2e8f0"; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
            if (row < 5) {
              ctx.fillStyle=col%2===0 ? "#cbd5e1" : "#e2e8f0";
              ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
            }
          }
        }
      }

      // Draw furniture on Row 4 (since row index 4 in 0-indexed matches row 4)
      // col 5-6: Prep Shelf (door)
      const px = 5.5 * TILE_SIZE, py = 4 * TILE_SIZE;
      ctx.fillStyle="#fffbeb"; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle="#d97706"; ctx.lineWidth=2; ctx.strokeRect(px+1, py+1, TILE_SIZE-2, TILE_SIZE-2);
      ctx.font=`${TILE_SIZE*0.7}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("🚪", px+TILE_SIZE/2, py+TILE_SIZE/2);
      ctx.fillStyle="#92400e"; ctx.font=`bold ${TILE_SIZE*0.18}px sans-serif`;
      ctx.fillText("현관 선반", px+TILE_SIZE/2, py+TILE_SIZE*0.9);

      // col 11-12: Desk (desk)
      const dx = 11.5 * TILE_SIZE, dy = 4 * TILE_SIZE;
      ctx.fillStyle="#eff6ff"; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle="#2563eb"; ctx.lineWidth=2; ctx.strokeRect(dx+1, dy+1, TILE_SIZE-2, TILE_SIZE-2);
      ctx.font=`${TILE_SIZE*0.7}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("📝", dx+TILE_SIZE/2, dy+TILE_SIZE/2);
      ctx.fillStyle="#1e3a8a"; ctx.font=`bold ${TILE_SIZE*0.18}px sans-serif`;
      ctx.fillText("책상 서랍", dx+TILE_SIZE/2, dy+TILE_SIZE*0.9);

      // col 17-18: Safety Board (safety)
      const sx = 17.5 * TILE_SIZE, sy = 4 * TILE_SIZE;
      ctx.fillStyle="#ecfdf5"; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle="#059669"; ctx.lineWidth=2; ctx.strokeRect(sx+1, sy+1, TILE_SIZE-2, TILE_SIZE-2);
      ctx.font=`${TILE_SIZE*0.7}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("🛡️", sx+TILE_SIZE/2, sy+TILE_SIZE/2);
      ctx.fillStyle="#064e3b"; ctx.font=`bold ${TILE_SIZE*0.18}px sans-serif`;
      ctx.fillText("안전 연락판", sx+TILE_SIZE/2, sy+TILE_SIZE*0.9);

      // ── Draw Purchased Furniture from houseStorage ──
      houseStorage.forEach(item => {
        if (item.count <= 0) return;
        let fx = -1, fy = -1, label = "";
        if (item.id === "flower_vase") {
          fx = 4 * TILE_SIZE; fy = 5 * TILE_SIZE; label = "꽃병";
        } else if (item.id === "massage_chair") {
          fx = 13.5 * TILE_SIZE; fy = 7 * TILE_SIZE; label = "안마의자";
        } else if (item.id === "lamp") {
          fx = 20 * TILE_SIZE; fy = 5 * TILE_SIZE; label = "가로등";
        } else if (item.id === "cafe_table") {
          fx = 11.5 * TILE_SIZE; fy = 9 * TILE_SIZE; label = "카페테이블";
        } else if (item.id === "safety_board") {
          fx = 19.5 * TILE_SIZE; fy = 5 * TILE_SIZE; label = "미니안전판";
        } else if (item.id === "luxury_sofa") {
          fx = 8 * TILE_SIZE; fy = 11 * TILE_SIZE; label = "가죽소파";
        }

        if (fx !== -1 && fy !== -1) {
          ctx.fillStyle="#f8fafc"; ctx.fillRect(fx, fy, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle="#94a3b8"; ctx.lineWidth=1.5; ctx.strokeRect(fx+1, fy+1, TILE_SIZE-2, TILE_SIZE-2);
          ctx.font=`${TILE_SIZE*0.65}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(item.emoji, fx+TILE_SIZE/2, fy+TILE_SIZE/2);
          ctx.fillStyle="#475569"; ctx.font=`bold ${TILE_SIZE*0.16}px sans-serif`;
          ctx.fillText(label, fx+TILE_SIZE/2, fy+TILE_SIZE*0.9);
        }
      });

    } else {
      // ── Draw Outdoor Village Map ──
      for (let row=0;row<GRID_ROWS;row++) {
        for (let col=0;col<GRID_COLS;col++) {
          const kind=MAP_GRID[row][col];
          const x=col*TILE_SIZE, y=row*TILE_SIZE;
          switch(kind) {
            case TILE.ocean:  drawOceanTile(ctx,x,y,tc,now);          break;
            case TILE.grass:  drawGrassTile(ctx,x,y,tc,col,row);      break;
            case TILE.forest: drawForestTile(ctx,x,y,tc,col,row);     break;
            case TILE.path:   drawPathTile(ctx,x,y,tc,col,row);       break;
            case TILE.river:  drawRiverTile(ctx,x,y,tc,now);          break;
            case TILE.beach:  drawBeachTile(ctx,x,y,tc,col,row);      break;
            case TILE.cliff:  drawCliffTile(ctx,x,y,tc,col,row);      break;
            case TILE.myhouse: {
              const isNear=isNearMyHouse;
              drawMyHouseHome(ctx,x,y,col,row,isNear,tc,studentName,houseImagesRef.current.myhouse);
              break;
            }
            case TILE.busstop: {
              drawBusStopHome(ctx,x,y,isNearBusStop,tc);
              break;
            }
            case TILE.kiosk: {
              drawKioskHome(ctx,x,y,isNearKiosk,tc);
              break;
            }
            case TILE.atm: {
              drawAtmHome(ctx,x,y,isNearAtm,tc);
              break;
            }
            case TILE.parking: {
              drawParkingHome(ctx,x,y,isNearParking,tc);
              break;
            }
            case TILE.mind: {
              drawMindHome(ctx,x,y,isNearMind,tc);
              break;
            }
            case TILE.school: {
              drawSchoolHome(ctx,x,y,isNearSchool,tc);
              break;
            }
            case TILE.safety: {
              drawSafetyHome(ctx,x,y,isNearSafety,tc);
              break;
            }
            case TILE.fishdock: {
              drawFishDock(ctx,x,y,isNearFishDock,tc);
              break;
            }
            default: { // NPC tiles
              const npcKey=TILE_TO_NPC[kind as TileKind];
              if (npcKey) {
                const isNear=nearbyNpc===npcKey;
                drawNpcHome(ctx,x,y,col,row,NPCS[npcKey],isNear,tc,houseImagesRef.current[npcKey]);
              }
            }
          }
        }
      }

      // Draw decorative trees at forest edges
      const treeTiles=[{c:7,r:0},{c:13,r:0},{c:0,r:7},{c:23,r:7}];
      treeTiles.forEach(({c,r})=>{
        const tx=c*TILE_SIZE, ty=r*TILE_SIZE;
        if (MAP_GRID[r]?.[c]===TILE.ocean) return;
        ctx.font=`${TILE_SIZE*0.65}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("🌲",tx+TILE_SIZE/2,ty+TILE_SIZE/2);
      });

      // Draw NPC characters at their current wandering positions
      const pPlayerTile=getTileFromPos(playerPos.current);
      for (const npcKey of NPC_ORDER) {
        const npc=NPCS[npcKey];
        const pos=npcPositions[npcKey];
        const cx=(pos.col+0.5)*TILE_SIZE;
        const cy=(pos.row+0.5)*TILE_SIZE;
        const isNear=nearbyNpc===npcKey;
        const bob=Math.sin(now/600+pos.col)*4;

        // nearby glow ring
        if (isNear) {
          ctx.save();
          ctx.globalAlpha=0.3+Math.sin(now/300)*0.2;
          ctx.fillStyle="#fbbf24";
          ctx.beginPath(); ctx.arc(cx, cy+bob, TILE_SIZE*0.55, 0, Math.PI*2);
          ctx.fill(); ctx.restore();
        }

        // NPC 2SD 이미지 그리기
        const npcImg = npcImagesRef.current[npcKey];
        if (npcImg && npcImg.complete) {
          const renderSize = TILE_SIZE * 1.15; // 2등신 비율감을 주기 위해 타일보다 약간 크게
          ctx.save();
          // 미세한 그림자 효과를 주어 스티커 질감 및 입체감 표현
          ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 3;
          
          ctx.drawImage(
            npcImg,
            cx - renderSize / 2,
            cy - renderSize / 2 + bob,
            renderSize,
            renderSize
          );
          ctx.restore();
        } else {
          // 폴백: 기존 이모지 렌더링
          ctx.font=`${TILE_SIZE*0.72}px serif`;
          ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(npc.emoji, cx, cy+bob);
        }

        // name + friendship badge
        const fl=getFriendshipLevel(friendshipXp[npcKey] || 0);
        ctx.font=`bold ${TILE_SIZE*0.21}px sans-serif`;
        ctx.fillStyle="#ffffff";
        ctx.strokeStyle=npc.color; ctx.lineWidth=3;
        ctx.strokeText(npc.name, cx, cy+TILE_SIZE*0.82+bob);
        ctx.fillText(npc.name, cx, cy+TILE_SIZE*0.82+bob);

        // "talk!" bubble when nearby
        if (isNear) {
          const bText="💬 인사하기";
          const bW=TILE_SIZE*1.9, bH=TILE_SIZE*0.46;
          const bX=cx-bW/2, bY=cy-TILE_SIZE*0.25+bob;
          ctx.fillStyle="rgba(255,251,230,0.96)";
          ctx.beginPath(); ctx.roundRect(bX,bY,bW,bH,8); ctx.fill();
          ctx.strokeStyle="#d97706"; ctx.lineWidth=2;
          ctx.stroke();
          ctx.fillStyle="#92400e";
          ctx.font=`bold ${TILE_SIZE*0.19}px sans-serif`;
          ctx.fillText(bText, cx, bY+bH/2);
        }

        // friendship level star
        ctx.font=`${TILE_SIZE*0.18}px serif`;
        ctx.fillText(fl.emoji, cx+TILE_SIZE*0.6, cy+TILE_SIZE*0.35+bob);

        void pPlayerTile;
      }

      // Draw floating collectibles
      for (const fi of floatingItems) {
        const fx=fi.tile.col*TILE_SIZE+TILE_SIZE/2;
        const fy=fi.tile.row*TILE_SIZE+TILE_SIZE/2;
        if (fi.sparkle) {
          for (let s=0;s<8;s++) {
            const ang=(s/8)*Math.PI*2, rad=12+Math.sin(now/80)*5;
            ctx.save(); ctx.globalAlpha=0.85;
            ctx.fillStyle=fi.config.rarity==="legendary"?"#fbbf24":fi.config.rarity==="rare"?"#a78bfa":"#4ade80";
            ctx.beginPath(); ctx.arc(fx+Math.cos(ang)*rad,fy+Math.sin(ang)*rad,3,0,Math.PI*2); ctx.fill();
            ctx.restore();
          }
          ctx.globalAlpha=0.5+Math.sin(now/60)*0.3;
          ctx.font=`${TILE_SIZE*0.5}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(fi.config.emoji,fx,fy); ctx.globalAlpha=1; continue;
        }
        if (fi.collected) continue;
        const bob=Math.sin(now/500+fi.tile.col*0.7)*4;
        const isTarget=targetItem.current===fi.id;

        if (isTarget) {
          ctx.save(); ctx.globalAlpha=0.9; ctx.fillStyle="#fbbf24";
          ctx.font=`bold ${TILE_SIZE*0.3}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText("▼",fx,fy-TILE_SIZE*0.6+Math.sin(now/250)*3+bob);
          ctx.restore();
        }
        if (fi.config.rarity!=="common") {
          ctx.save(); ctx.globalAlpha=0.3+Math.sin(now/300)*0.2;
          ctx.fillStyle=fi.config.rarity==="legendary"?"#fbbf24":"#a78bfa";
          ctx.beginPath(); ctx.arc(fx,fy+bob,TILE_SIZE*0.42,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
        // shadow
        ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle="#000";
        ctx.beginPath(); ctx.ellipse(fx,fy+TILE_SIZE*0.3+bob,TILE_SIZE*0.22,TILE_SIZE*0.08,0,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.font=`${TILE_SIZE*0.5}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(fi.config.emoji,fx,fy+bob);
      }
    }

    // Night/Dawn overlay
    if (tc.alpha.valueOf() > 0 && indoorArea === "village") {
      ctx.fillStyle=tc.overlay; ctx.globalAlpha=tc.alpha.valueOf();
      ctx.fillRect(0,0,GRID_COLS*TILE_SIZE,GRID_ROWS*TILE_SIZE); ctx.globalAlpha=1;
    }
    // Stars
    if (tc.stars && indoorArea === "village") {
      for (let i=0;i<45;i++) {
        const sx=((i*137.5)%100)/100*(GRID_COLS*TILE_SIZE);
        const sy=((i*97.3)%55)/100*(GRID_ROWS*TILE_SIZE);
        const sr=((i%3)+1)*0.7;
        ctx.globalAlpha=0.5+Math.sin(now/800+i)*0.4;
        ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    // ── Real-time Weather Effects ──
    if (weather && indoorArea === "village") {
      const cw = GRID_COLS * TILE_SIZE;
      const ch = GRID_ROWS * TILE_SIZE;
      const wt = weather.type;
      const particles = weatherParticles.current;

      // Initialize particles if empty
      const targetCount = wt === "heavy_rain" ? 200 : wt === "rain" ? 120 : wt === "drizzle" ? 60 :
        wt === "heavy_snow" ? 100 : wt === "snow" ? 60 : wt === "thunderstorm" ? 180 : 0;
      while (particles.length < targetCount) {
        particles.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          speed: (wt.includes("snow")) ? 0.5 + Math.random() * 1.5 : 4 + Math.random() * 8,
          size: (wt.includes("snow")) ? 2 + Math.random() * 4 : 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.5,
          drift: (wt.includes("snow")) ? Math.random() * 2 - 1 : Math.random() * 1.5 - 0.3,
        });
      }
      // Trim excess particles
      if (particles.length > targetCount) particles.length = targetCount;

      // Rain effects
      if (wt === "drizzle" || wt === "rain" || wt === "heavy_rain" || wt === "thunderstorm") {
        // Darken sky slightly
        ctx.save();
        ctx.fillStyle = "rgba(30,40,70," + (wt === "heavy_rain" || wt === "thunderstorm" ? "0.25" : wt === "rain" ? "0.15" : "0.08") + ")";
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();

        // Draw rain drops
        for (const p of particles) {
          p.y += p.speed;
          p.x += p.drift;
          if (p.y > ch) { p.y = -10; p.x = Math.random() * cw; }
          if (p.x > cw) p.x = 0;
          if (p.x < 0) p.x = cw;

          ctx.save();
          ctx.strokeStyle = `rgba(180,210,255,${p.opacity})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 2, p.y + p.speed * 2.5);
          ctx.stroke();
          ctx.restore();
        }

        // Splash effects on ground (for rain/heavy_rain)
        if (wt !== "drizzle") {
          for (let i = 0; i < (wt === "heavy_rain" || wt === "thunderstorm" ? 15 : 8); i++) {
            const sx = ((now / 100 + i * 173) % cw);
            const sy = ((i * 97 + 50) % (ch * 0.7)) + ch * 0.3;
            const sr = 1.5 + Math.sin(now / 200 + i) * 1;
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(now / 150 + i * 2) * 0.1;
            ctx.strokeStyle = "rgba(180,210,255,0.5)";
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.arc(sx, sy, sr * 2, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          }
        }

        // Thunderstorm lightning flash
        if (wt === "thunderstorm" && Math.sin(now / 3000) > 0.97) {
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();
        }
      }

      // Snow effects
      if (wt === "snow" || wt === "heavy_snow") {
        // Slight blue tint
        ctx.save();
        ctx.fillStyle = "rgba(200,220,255," + (wt === "heavy_snow" ? "0.12" : "0.06") + ")";
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();

        for (const p of particles) {
          p.y += p.speed;
          p.x += Math.sin(now / 1000 + p.drift * 10) * 0.5 + p.drift * 0.3;
          if (p.y > ch) { p.y = -10; p.x = Math.random() * cw; }
          if (p.x > cw) p.x = 0;
          if (p.x < 0) p.x = cw;

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          // Small sparkle
          if (p.size > 3) {
            ctx.globalAlpha = p.opacity * 0.4;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }

      // Fog effect
      if (wt === "fog") {
        for (let i = 0; i < 5; i++) {
          const fy = ch * 0.3 + i * ch * 0.14;
          const fx = Math.sin(now / 5000 + i * 1.5) * cw * 0.1;
          ctx.save();
          ctx.globalAlpha = 0.12 + Math.sin(now / 3000 + i) * 0.04;
          ctx.fillStyle = "#c8d8e8";
          ctx.beginPath();
          ctx.ellipse(cw / 2 + fx, fy, cw * 0.7, ch * 0.08, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Cloudy overlay
      if (wt === "cloudy") {
        ctx.save();
        ctx.fillStyle = "rgba(140,150,170,0.06)";
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
    }

    // Player shadow
    const ppos=playerPos.current, walking=walkingRef.current, wobble=wobbleRef.current;
    const bounceY=walking?Math.abs(Math.sin(wobble*2))*5:0;
    ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle="#000";
    const ss=walking?1-Math.abs(Math.sin(wobble*2))*0.15:1;
    ctx.beginPath(); ctx.ellipse(ppos.x,ppos.y+12,15*ss,5*ss,0,0,Math.PI*2); ctx.fill(); ctx.restore();

    // Player sprite
    const pW=PLAYER_SIZE, pH=PLAYER_SIZE;
    const pX=ppos.x-pW/2, pY=ppos.y-pH+12;
    ctx.save();
    ctx.translate(pX+pW/2,pY+pH/2-bounceY);
    if (walking) ctx.rotate(Math.sin(wobble)*0.08);
    const sprite=spriteRef.current;
    if (spriteReady.current&&sprite) {
      const fw=sprite.width/8, fh=sprite.height;
      const dm=character==="girl"?GIRL_DIR_IDX:DIR_IDX;
      ctx.drawImage(sprite,dm[playerDir.current]*fw,0,fw,fh,-pW/2,-pH/2,pW,pH);
    } else {
      ctx.fillStyle=CHARACTER_CFG[character].fallback;
      drawRect(ctx,-pW/2,-pH/2,pW,pH,8);
    }
    ctx.restore();

    // Speech bubble
    let bubbleText = isWalking ? "이동 중..." : "마을을 걸어보세요";
    if (indoorArea === "myhouse") {
      bubbleText = isWalking ? "이동 중..." : "우리집 안을 둘러봐요";
    } else {
      if (nearbyNpc) bubbleText = `${NPCS[nearbyNpc].name}에게 인사하기!`;
      else if (isNearMyHouse) bubbleText = "내 집으로 들어가기";
      else if (isNearBusStop) bubbleText = "버스 정류장 이용하기";
      else if (isNearKiosk) bubbleText = "패스트푸드 주문하기";
      else if (isNearAtm) bubbleText = "은행 ATM 이용하기";
      else if (isNearParking) bubbleText = "주차정산기 이용하기";
      else if (isNearMind) bubbleText = "마음쉼터 이용하기";
      else if (isNearSchool) bubbleText = "학교 이용하기";
      else if (isNearSafety) bubbleText = "안전훈련장 이용하기";
      else if (isNearFishDock) bubbleText = "낚시하기";
    }
    const bW=Math.max(120,bubbleText.length*10), bH=22;
    const bX=ppos.x-bW/2, bY=pY-bounceY-28;
    ctx.fillStyle="rgba(255,255,255,0.92)"; drawRect(ctx,bX,bY,bW,bH,8);
    const hasPrompt = indoorArea === "myhouse" ? false : !!(nearbyNpc||isNearMyHouse||isNearBusStop||isNearKiosk||isNearAtm||isNearParking||isNearMind||isNearSchool||isNearSafety||isNearFishDock);
    ctx.strokeStyle=hasPrompt ? "#fbbf24" : "#5cb85c"; ctx.lineWidth=1.5;
    ctx.strokeRect(bX+1,bY+1,bW-2,bH-2);
    ctx.fillStyle=hasPrompt ? "#b58100" : "#385e26";
    ctx.font=`bold ${TILE_SIZE*0.20}px sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(bubbleText,ppos.x,bY+bH/2);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, timeOfDay, floatingItems, character, friendshipXp, nearbyNpc, indoorArea, isNearMyHouse, nearbyFurniture, isNearBusStop, isNearKiosk, isNearAtm, isNearParking, isNearMind, isNearSchool, isNearSafety, isNearFishDock, weather]);

  // ── Spawn collectibles ──
  const spawnItem = useCallback(() => {
    if (indoorArea === "myhouse") return; // no item spawns inside house
    const avail=COLLECTIBLES.filter(c=>c.appearsAt.includes(timeOfDay));
    if (!avail.length) return;

    // Fish items spawn only on river tiles, non-fish on grass
    const fishIds = new Set(["catfish", "goldfish"]);
    const nonFishAvail = avail.filter(c => !fishIds.has(c.id));

    // Spawn non-fish items on grass
    if (nonFishAvail.length) {
      const grassTiles:TileCoord[]=[];
      for (let r=3;r<GRID_ROWS-3;r++) for (let c=2;c<GRID_COLS-2;c++)
        if (MAP_GRID[r][c]===TILE.grass) grassTiles.push({col:c,row:r});
      if (grassTiles.length) {
        const tile=grassTiles[Math.floor(Math.random()*grassTiles.length)];
        const cfg=nonFishAvail[Math.floor(Math.random()*nonFishAvail.length)];
        setFloatingItems(prev=>[...prev.slice(-7),{id:`fi-${Date.now()}-${Math.random()}`,config:cfg,tile,collected:false}]);
      }
    }
  }, [timeOfDay, indoorArea]);

  useEffect(() => {
    const sched=()=>{ spawnTimer.current=setTimeout(()=>{ spawnItem(); sched(); },5000+Math.random()*7000); };
    spawnItem(); sched();
    return ()=>{ if(spawnTimer.current) clearTimeout(spawnTimer.current); };
  }, [spawnItem]);

  // ── Canvas Click / Touch ──
  const handleClick = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    playSound("click");

    const canvas=e.currentTarget, rect=canvas.getBoundingClientRect();
    const x=(e.clientX-rect.left), y=(e.clientY-rect.top);
    const clickedTile:TileCoord={col:Math.floor(x/TILE_SIZE),row:Math.floor(y/TILE_SIZE)};

    if (indoorArea === "village") {
      const kind = getTileKind(clickedTile.col, clickedTile.row);
      let missionTarget: "bus" | "kiosk" | "atm" | "parking" | "mind" | "school" | "safety" | "fishing" | null = null;
      let standTile: TileCoord | null = null;

      if (kind === TILE.busstop) {
        missionTarget = "bus";
        standTile = { col: 18, row: 5 };
      } else if (kind === TILE.kiosk) {
        missionTarget = "kiosk";
        standTile = { col: 18, row: 9 };
      } else if (kind === TILE.atm) {
        missionTarget = "atm";
        standTile = { col: 18, row: 7 };
      } else if (kind === TILE.parking) {
        missionTarget = "parking";
        standTile = { col: 18, row: 5 };
      } else if (kind === TILE.mind) {
        missionTarget = "mind";
        standTile = { col: 18, row: 7 };
      } else if (kind === TILE.school) {
        missionTarget = "school";
        standTile = { col: 18, row: 3 };
      } else if (kind === TILE.safety) {
        missionTarget = "safety";
        standTile = { col: 18, row: 11 };
      } else if (kind === TILE.fishdock) {
        missionTarget = "fishing";
        standTile = { col: 8, row: 6 };
      }

      if (missionTarget && standTile) {
        const playerTile = getTileFromPos(playerPos.current);
        if (playerTile.col === standTile.col && playerTile.row === standTile.row) {
          setActiveMissionModal(missionTarget);
        } else {
          const path = bfs(playerTile, standTile)?.map(tileCenter) ?? null;
          if (path && path.length > 0) {
            pathQueue.current = path;
            targetMission.current = missionTarget;
            targetNpc.current = null;
            targetItem.current = null;
            walkingRef.current = true;
            setIsWalking(true);
          }
        }
        return;
      }
    }

    if (indoorArea === "myhouse") {
      const col = clickedTile.col;
      const row = clickedTile.row;
      let clickedFurniture: "door" | "desk" | "safety" | null = null;

      if ((row === 4 || row === 5) && (col === 5 || col === 6)) {
        clickedFurniture = "door";
      } else if ((row === 4 || row === 5) && (col === 11 || col === 12)) {
        clickedFurniture = "desk";
      } else if ((row === 4 || row === 5) && (col === 17 || col === 18)) {
        clickedFurniture = "safety";
      }

      if (clickedFurniture) {
        setActiveFurnitureModal(clickedFurniture);
        setHouseActiveTab("cards");
        return;
      }

      // Click walking indoor mapping
      if (isWalkableIndoor(clickedTile)) {
        const path = bfsIndoor(getTileFromPos(playerPos.current), clickedTile)?.map(tileCenter) ?? null;
        if (path) {
          pathQueue.current = path; targetItem.current = null;
          targetNpc.current = null; targetFurniture.current = null; walkingRef.current = true; setIsWalking(true);
        }
      }
      return;
    }

    // 1. Check floating collectible → walk to it
    for (const fi of floatingItems) {
      if (fi.collected||fi.sparkle) continue;
      const fx=fi.tile.col*TILE_SIZE+TILE_SIZE/2, fy=fi.tile.row*TILE_SIZE+TILE_SIZE/2;
      if (Math.abs(x-fx)<TILE_SIZE&&Math.abs(y-fy)<TILE_SIZE) {
        const walkableForItem=new Set<TileKind>([...WALKABLE, TILE.grass]);
        const adjs:TileCoord[]=[
          {col:fi.tile.col,row:fi.tile.row-1},{col:fi.tile.col,row:fi.tile.row+1},
          {col:fi.tile.col-1,row:fi.tile.row},{col:fi.tile.col+1,row:fi.tile.row},
          fi.tile,
        ];
        let best:Point[]|null=null;
        for (const adj of adjs) {
          const path=bfs(getTileFromPos(playerPos.current),adj,walkableForItem)?.map(tileCenter)??null;
          if (path&&(!best||path.length<best.length)) best=path;
        }
        if (best&&best.length>0) {
          pathQueue.current=best; targetItem.current=fi.id;
          targetNpc.current=null; targetMission.current=null; walkingRef.current=true; setIsWalking(true);
        } else { collectItem(fi.id); }
        return;
      }
    }

    // 2. NPC character click → walk to NPC
    let clickedNpc: NpcKey | null = null;
    for (const key of NPC_ORDER) {
      const pos = npcPositions[key];
      if (clickedTile.col === pos.col && clickedTile.row === pos.row) {
        clickedNpc = key;
        break;
      }
    }

    if (clickedNpc) {
      const path=bfs(getTileFromPos(playerPos.current), npcPositions[clickedNpc])?.map(tileCenter)??null;
      if (path&&path.length>0) {
        pathQueue.current=path; targetNpc.current=clickedNpc;
        targetItem.current=null; targetMission.current=null; walkingRef.current=true; setIsWalking(true);
      } else { triggerNpcDialog(clickedNpc); }
      return;
    }

    // 3. Walk to clicked tile
    const target=findNearestWalkable(clickedTile.col,clickedTile.row);
    if (!target) return;
    const path=bfs(getTileFromPos(playerPos.current),target)?.map(tileCenter)??null;
    if (path) { pathQueue.current=path; targetNpc.current=null; targetItem.current=null; targetMission.current=null; walkingRef.current=true; setIsWalking(true); }
  }, [floatingItems, triggerNpcDialog, collectItem, playSound, indoorArea, setActiveFurnitureModal, setHouseActiveTab, npcPositions, setActiveMissionModal, nearbyFurniture]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t=e.touches[0]; if(!t) return;
    handleClick({ clientX:t.clientX,clientY:t.clientY,currentTarget:e.currentTarget } as unknown as MouseEvent<HTMLCanvasElement>);
  }, [handleClick]);

  const tc=TIME_CFG[timeOfDay];

  // ── Walk-to-NPC helper ──
  const walkToNpc = useCallback((npcKey:NpcKey) => {
    const path=bfs(getTileFromPos(playerPos.current),npcPositions[npcKey])?.map(tileCenter)??null;
    if (path&&path.length>0) {
      pathQueue.current=path; targetNpc.current=npcKey;
      targetItem.current=null; walkingRef.current=true; setIsWalking(true);
    }
  }, [npcPositions]);

  const activeMission = VILLAGE_MISSIONS.find(m => !completedMissions[m.id]);

  // ── Render Nook Phone Apps ──

  const renderPocketApp = () => (
    <div className="space-y-3">
      <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
        <p className="font-bold text-slate-500">지참중인 미션 물품</p>
        <p className="text-xl font-black text-[#566c3e]">{packedItemIds.length} 개</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {POCKET_ITEMS.map(item => {
          const isPacked = packedItemIds.includes(item.id);
          return (
            <div key={item.id} className={`rounded-xl border p-1.5 text-center text-[10px] ${isPacked ? "bg-amber-50 border-amber-300 text-amber-950 font-bold" : "bg-slate-100 border-slate-200 opacity-40"}`}>
              <div className="text-xl">{item.icon}</div>
              <p className="font-black truncate text-slate-700">{item.name}</p>
              <p className="text-[8px] mt-0.5 text-slate-400">{isPacked ? "주머니" : "우리집"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderVillagerApp = () => (
    <div className="space-y-2">
      {NPC_ORDER.map(npcKey => {
        const npc = NPCS[npcKey];
        const xp = friendshipXp[npcKey] || 0;
        const fl = getFriendshipLevel(xp);
        const lvlXps = [0, 0, 30, 80, 150, 250];
        const fromXp = lvlXps[fl.level] ?? 0;
        const progress = fl.level >= 5 ? 100 : Math.round(((xp - fromXp) / (fl.next - fromXp)) * 100);
        const pLabel = { cheerful: "활발함", shy: "수줍음", grumpy: "무뚝뚝함", kind: "친절함" }[npc.personality];

        return (
          <div key={npcKey} className="bg-white/95 rounded-2xl p-2.5 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{npc.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-xs truncate" style={{ color: npc.color }}>{npc.name}</h4>
                  <span className="text-[8px] font-bold text-slate-400 border border-slate-200 rounded px-1 bg-slate-50">{pLabel}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500">{fl.emoji} {fl.name} (Lv.{fl.level})</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: npc.color }} />
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                <span>{xp} XP</span>
                <span>Lv.{fl.level + 1}까지 {fl.next} XP</span>
              </div>
            </div>
            {/* Shortcuts */}
            <div className="mt-2 flex gap-1">
              <button onClick={() => { playSound("click"); walkToNpc(npcKey); setIsNookPhoneOpen(false); }} className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[9px] font-black text-slate-700 transition" disabled={indoorArea === "myhouse"}>
                🏃 달려가기
              </button>
              {fl.level >= 2 ? (
                <button
                  onClick={() => {
                    playSound("pickup");
                    const gift = npc.giftItems[Math.floor(Math.random() * npc.giftItems.length)];
                    setGiftEffect(gift);
                    addXp(npcKey, 20);
                    updateMissionProgress("gift_npc", 1);
                    setTimeout(() => setGiftEffect(null), 1800);
                  }}
                  className="flex-1 py-1 rounded text-[9px] font-black text-white transition active:scale-95 shadow"
                  style={{ background: npc.color }}
                >
                  🎁 선물하기
                </button>
              ) : (
                <div className="flex-1 text-center py-1 bg-slate-50 border border-slate-200 text-slate-300 text-[8px] font-bold rounded">
                  🎁 Lv.2 해금
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMapApp = () => {
    const pPlayerTile = getTileFromPos(playerPos.current);
    return (
      <div className="flex flex-col items-center">
        <p className="text-[10px] text-slate-500 font-bold mb-2">👤 실시간 캐릭터 위치</p>
        <div className="flex flex-col gap-px bg-[#ced9b9] p-0.5 rounded-lg shadow-inner max-w-full overflow-x-auto">
          {MAP_GRID.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-px">
              {row.map((tile, cIdx) => {
                const isPlayer = pPlayerTile.col === cIdx && pPlayerTile.row === rIdx && indoorArea === "village";
                let bg = "bg-[#a3e635]"; // grass
                if (tile === TILE.ocean) bg = "bg-[#2563eb]";
                else if (tile === TILE.river) bg = "bg-[#60a5fa]";
                else if (tile === TILE.path) bg = "bg-[#fef08a]";
                else if (tile === TILE.beach) bg = "bg-[#fef9c3]";
                else if (tile === TILE.cliff) bg = "bg-[#78716c]";
                else if (tile === TILE.forest) bg = "bg-[#15803d]";
                else if (tile === TILE.myhouse) bg = "bg-[#a7f3d0] border border-[#059669]"; // player home
                else if (tile === TILE.busstop) bg = "bg-[#93c5fd] border border-[#2563eb]"; // busstop
                else if (tile === TILE.kiosk) bg = "bg-[#fde047] border border-[#d97706]"; // kiosk (패스트푸드)
                else if (tile === TILE.atm) bg = "bg-[#6ee7b7] border border-[#059669]"; // atm
                else if (tile === TILE.parking) bg = "bg-[#cbd5e1] border border-[#475569]"; // parking
                else if (tile === TILE.mind) bg = "bg-[#fbcfe8] border border-[#db2777]"; // mind
                else if (tile === TILE.school) bg = "bg-[#ffedd5] border border-[#ea580c]"; // school
                else if (tile === TILE.safety) bg = "bg-[#fca5a5] border border-[#dc2626]"; // safety
                else if (tile === TILE.fishdock) bg = "bg-[#ebdcb9] border border-[#8c6239]"; // fishdock
                else if (tile >= 6 && tile <= 9) bg = "bg-[#ffedd5] border border-[#ea580c]"; // NPC houses
                
                return (
                  <div
                    key={cIdx}
                    className={`w-2.5 h-2.5 flex items-center justify-center text-[7px] font-bold ${bg} ${
                      isPlayer ? "relative" : ""
                    }`}
                  >
                    {isPlayer && (
                      <span className="absolute inset-0 flex items-center justify-center bg-red-500 rounded-full animate-ping text-[6px] text-white">
                        ●
                      </span>
                    )}
                    {isPlayer && (
                      <span className="absolute inset-0 flex items-center justify-center text-red-600 text-[6px] font-black">
                        👤
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3 w-full text-[8px] font-bold text-slate-500 px-1">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#a3e635] block rounded"></span> 잔디밭</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#2563eb] block rounded"></span> 바다/강</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ffedd5] block rounded"></span> 주민 집</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#a7f3d0] block rounded"></span> 우리집</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#93c5fd] block rounded"></span> 🚏 버스정류장</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#fde047] block rounded"></span> 🍔 패스트푸드</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#6ee7b7] block rounded"></span> 🏧 은행 ATM</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#cbd5e1] block rounded"></span> 🅿️ 주차정산</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#fbcfe8] block rounded"></span> 💚 마음쉼터</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ffedd5] block rounded"></span> 🏫 학교</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#fca5a5] block rounded"></span> 🚨 안전훈련장</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ebdcb9] block rounded"></span> 🎣 낚시터</div>
        </div>
      </div>
    );
  };

  const renderMilesApp = () => (
    <div className="space-y-2.5">
      <div className="bg-white/90 p-2 rounded-xl border border-slate-200 text-center text-xs">
        <span className="text-slate-400 font-bold">누크 마일 잔액</span>
        <p className="text-lg font-black text-amber-600">🌟 {totalPoints} Miles</p>
      </div>
      <div className="space-y-2">
        {VILLAGE_MISSIONS.map(m => {
          const progress = missionProgress[m.id] || 0;
          const isCompleted = completedMissions[m.id];
          const progressPct = Math.min(100, Math.round((progress / m.targetValue) * 100));
          const canClaim = progress >= m.targetValue && !isCompleted;

          return (
            <div key={m.id} className={`rounded-xl border p-2.5 relative overflow-hidden transition ${isCompleted ? "bg-[#d7ecd9]/70 border-[#b2d8b7] opacity-80" : "bg-white border-slate-200 shadow-sm"}`}>
              {/* Completed Stamp Overlay */}
              {isCompleted && (
                <div className="absolute right-2 top-1.5 w-12 h-12 rounded-full border-4 border-dashed border-[#ff4e4e]/20 flex items-center justify-center rotate-12 text-[10px] font-black text-[#ff4e4e]/30 select-none">
                  STAMPED
                </div>
              )}
              
              <div className="flex items-start gap-1">
                <span className="text-sm mt-0.5">🌟</span>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-xs text-slate-800 truncate">{m.title}</h5>
                  <p className="text-[9px] font-medium text-slate-500 leading-tight mt-0.5">{m.desc}</p>
                </div>
              </div>

              {/* Progress bar and reward */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[7px] text-slate-400 mt-0.5">
                    <span>진행도: {progress} / {m.targetValue}</span>
                    <span>보상: +{m.points}pt</span>
                  </div>
                </div>
                
                {canClaim && (
                  <button
                    onClick={() => triggerMissionComplete(m)}
                    className="px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded text-[9px] font-black shadow animate-pulse shrink-0 transition"
                  >
                    마일 받기!
                  </button>
                )}
                {isCompleted && (
                  <span className="text-[9px] font-black text-[#566c3e] bg-[#d7ecd9] px-1.5 py-0.5 rounded shadow-sm">
                    지급 완료
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAudioApp = () => (
    <div className="space-y-3">
      <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 flex flex-col items-center shadow-inner">
        <span className="text-3xl mb-1">{isBgmOn ? "📻" : "🔇"}</span>
        <span className="text-xs font-black text-slate-700">라디오 BGM</span>
        <p className="text-[9px] text-slate-400 text-center mt-1">마을의 평화로운 동물의 숲 BGM을 조절할 수 있습니다.</p>
      </div>
      <button
        onClick={() => {
          playSound("click");
          setIsBgmOn(!isBgmOn);
        }}
        className={`w-full py-2 rounded-xl text-xs font-black text-white shadow transition active:scale-95 flex justify-center items-center gap-1 ${
          isBgmOn ? "bg-red-400 hover:bg-red-500" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {isBgmOn ? "🔇 라디오 끄기" : "🎵 라디오 켜기"}
      </button>
      
      <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200">
        <span className="text-[9px] text-slate-400 font-bold block mb-1">효과음 미리듣기</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => playSound("pickup")} className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 transition">
            🍄 버섯/과일
          </button>
          <button onClick={() => playSound("npc")} className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 transition">
            🐻 이웃 대면
          </button>
          <button onClick={() => playSound("mission")} className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 transition">
            🎉 미션 완료
          </button>
          <button onClick={() => playSound("phone_open")} className="py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 transition">
            📱 누크폰 열기
          </button>
        </div>
      </div>
    </div>
  );

  const SHOP_FURNITURE = [
    { id: "flower_vase", name: "현관 꽃병", emoji: "🪴", price: 300, description: "집안을 싱그럽고 화사하게 장식해 주는 아기자기한 꽃병이에요." },
    { id: "massage_chair", name: "아늑한 안마의자", emoji: "🪑", price: 500, description: "미션을 마치고 돌아온 이음이가 편히 쉴 수 있는 마사지 의자예요." },
    { id: "lamp", name: "반짝 가로등", emoji: "💡", price: 400, description: "밤에도 방안을 은은하고 안전하게 비춰주는 무드등입니다." },
    { id: "cafe_table", name: "아기자기 카페 테이블", emoji: "☕", price: 600, description: "친구들과 오붓하게 맛있는 간식을 나누어 먹는 카페풍 탁자예요." },
    { id: "safety_board", name: "안전 표지판 가구", emoji: "🎴", price: 200, description: "'집에서도 안전을 잊지 말자!' 경각심을 주는 미니어처 간판이에요." },
    { id: "luxury_sofa", name: "럭셔리 가죽 소파", emoji: "🛋️", price: 800, description: "방의 고급스러움을 한층 더해주는 푹신하고 포근한 가죽 쇼파예요." },
  ];

  const renderMilesShop = () => {
    return (
      <div className="flex flex-col gap-2 p-1">
        <div className="bg-[#76a048]/20 border border-[#76a048]/40 p-2 rounded-xl mb-2 flex items-center justify-between text-xs font-black text-[#566c3e]">
          <span>🛍️ 이음 마일 가구점</span>
          <span>🌟 {totalPoints} Miles</span>
        </div>
        
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {SHOP_FURNITURE.map((item) => {
            const canAfford = totalPoints >= item.price;
            return (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-white border border-[#8da86f]/20 rounded-2xl shadow-sm gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl shrink-0">{item.emoji}</span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-slate-800 leading-tight truncate">{item.name}</p>
                    <p className="text-[7.5px] text-slate-400 font-bold leading-normal mt-0.5">{item.description}</p>
                    <p className="text-[9px] text-[#7e6022] font-black mt-1">🏷️ {item.price} Miles</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (!canAfford) {
                      playSound("click");
                      alert("마일(Miles)이 부족합니다! 마을 활동이나 릴리의 부탁을 들어 마일을 모아보세요.");
                      return;
                    }
                    playSound("mission");
                    
                    // Deduct Miles
                    setTotalPoints(p => {
                      const n = p - item.price;
                      localStorage.setItem("haemileum_village_points", String(n));
                      return n;
                    });
                    
                    // Add item to houseStorage
                    setHouseStorage(prev => {
                      const next = [...prev];
                      const existingIdx = next.findIndex(x => x.id === item.id);
                      if (existingIdx !== -1) {
                        next[existingIdx] = {
                          ...next[existingIdx],
                          count: next[existingIdx].count + 1
                        };
                      } else {
                        next.push({
                          id: item.id,
                          name: item.name,
                          emoji: item.emoji,
                          count: 1,
                          rarity: "common"
                        });
                      }
                      localStorage.setItem("haemileum_house_storage", JSON.stringify(next));
                      return next;
                    });
                    
                    alert(`🎉 '${item.name}' 구매 완료! 주인공 집의 보관창고로 전송되었습니다. 집 내부에서 꺼내어 방을 꾸며보세요!`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black shrink-0 transition active:scale-95 shadow-sm ${
                    canAfford
                      ? "bg-[#76a048] hover:bg-[#5f823a] text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  구매
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#a5f3fc] relative flex flex-col items-center justify-center p-3 sm:p-6 select-none overflow-hidden" style={{fontFamily:"'Nunito','Nanum Gothic',sans-serif"}}>
      {/* Dynamic Background Clouds */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-20 z-0">
        <span className="absolute top-10 left-[10%] text-6xl animate-pulse" style={{ animationDuration: '6s' }}>☁️</span>
        <span className="absolute top-32 right-[15%] text-8xl animate-pulse" style={{ animationDuration: '8s' }}>☁️</span>
        <span className="absolute bottom-20 left-[20%] text-7xl animate-pulse" style={{ animationDuration: '10s' }}>☁️</span>
        <span className="absolute bottom-40 right-[8%] text-5xl animate-pulse" style={{ animationDuration: '7s' }}>☁️</span>
      </div>

      {/* Gift pop effect overlay */}
      {giftEffect && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-8xl" style={{animation:"giftPop 1.8s ease-out forwards"}}>{giftEffect}</div>
        </div>
      )}


      {/* Celebration Miles Stamp Overlay */}
      {celebratingMission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCelebratingMission(null)}>
          <div className="bg-[#fffdf9] border-4 border-amber-400 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative" style={{ animation: "bounceIn 0.5s ease-out" }} onClick={(e)=>e.stopPropagation()}>
            <span className="text-5xl block mb-2">🎖️</span>
            <h3 className="font-black text-lg text-slate-800">누크 마일 미션 달성!</h3>
            <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="font-black text-sm text-slate-700">{celebratingMission.title}</p>
              <p className="text-xs text-slate-400 font-bold mt-1">{celebratingMission.desc}</p>
            </div>
            <div className="text-center mb-4 text-[#76a048] font-black text-sm">
              🌟 +{celebratingMission.points} Miles 획득!
            </div>
            <button
              onClick={() => { playSound("click"); setCelebratingMission(null); }}
              className="w-full py-2.5 bg-[#76a048] hover:bg-[#5f823a] text-white rounded-xl font-black text-sm shadow transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Switch-like Bezel Frame */}
      <div className="relative w-full max-w-5xl bg-[#8c6239] rounded-[36px] p-4 shadow-2xl border-b-[10px] border-[#5d4037] z-10 flex flex-col items-center">
        {/* Screen inside Bezel */}
        <div className="relative w-full bg-[#111827] rounded-[24px] overflow-hidden border-[6px] border-[#374151] flex flex-col">
          {/* Game Canvas Box */}
          <div ref={containerRef} className="relative w-full overflow-hidden">
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              onTouchStart={handleTouch}
              className="block w-full cursor-pointer select-none"
              style={{touchAction:"none"}}
            />

            {/* Overlaid HUD: Clock & Time (Top-Left) */}
            <div className="absolute top-3 left-3 bg-[#fffaf0] border-[3px] border-[#8c6239] rounded-2xl px-3 py-1.5 shadow-md flex flex-col items-center select-none pointer-events-auto">
              <span className="text-[10px] font-black text-[#8c6239]">{dateText}</span>
              <span className="text-xs sm:text-base font-black text-[#5d4037] flex items-center gap-1.5 mt-0.5">
                {tc.emoji} {clockText}
              </span>
              {weather && (
                <span className="text-[9px] font-bold text-[#8c6239] mt-0.5 flex items-center gap-0.5">
                  {weather.emoji} {weather.label} {weather.temp}°C
                </span>
              )}
            </div>

            {/* Top HUD Row: Flex container to align everything next to each other */}
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5 sm:gap-2 pointer-events-none z-20">
              {/* Flight dock button */}
              <Link
                href="/student/home"
                className="bg-[#e2f0d9] hover:bg-[#cbe3bb] border-2 border-[#60993e] rounded-full px-2 py-1 shadow-md flex items-center justify-center transition pointer-events-auto h-7 sm:h-9 hover:scale-105 active:scale-95"
                title="비행장"
              >
                <span className="text-[10px] sm:text-xs font-black text-[#385e26] px-1 flex items-center gap-0.5">
                  <span>🏡</span>
                  <span className="hidden sm:inline">비행장</span>
                </span>
              </Link>
              
              {/* Pocket Button */}
              <button
                onClick={() => {
                  playSound("phone_open");
                  setIsInventoryOpen(true);
                }}
                className="w-7 h-7 sm:w-9 sm:h-9 bg-[#a78bfa] hover:bg-[#8b5cf6] border-2 border-white rounded-full flex items-center justify-center shadow-md transform hover:scale-105 active:scale-95 transition pointer-events-auto"
                title="주머니"
              >
                <span className="text-xs sm:text-sm">👜</span>
              </button>

              {/* Phone Button */}
              <button
                onClick={() => {
                  playSound("phone_open");
                  setIsNookPhoneOpen(true);
                }}
                className="w-7 h-7 sm:w-9 sm:h-9 bg-[#76c7c0] hover:bg-[#5bb2ab] border-2 border-white rounded-full flex items-center justify-center shadow-md transform hover:scale-105 active:scale-95 transition pointer-events-auto animate-bounce animate-pulse"
                style={{ animationDuration: '3.5s' }}
                title="누크앱 핸드폰"
              >
                <span className="text-xs sm:text-sm">📱</span>
              </button>

              {/* Miles Info Bubble */}
              <div className="bg-[#ffd54f] border-2 border-[#c69500] rounded-full px-2.5 py-1 shadow-md flex items-center justify-center pointer-events-auto h-7 sm:h-9">
                <span className="text-[10px] sm:text-xs font-black text-[#5d4037] flex items-center gap-0.5 whitespace-nowrap">
                  🌟 {totalPoints}
                  <span className="hidden sm:inline"> Mile</span>
                </span>
              </div>
            </div>

            {/* Overlaid HUD: Active Nook Mile Mission Card (Bottom-Left) */}
            {activeMission && (
              <div className="absolute bottom-3 left-3 bg-[#fffaf0]/95 border-2 border-[#8c6239] rounded-2xl p-2.5 shadow-md max-w-[170px] sm:max-w-xs select-none pointer-events-auto flex flex-col">
                <span className="text-[8px] sm:text-[10px] font-black text-amber-600 flex items-center gap-1">⭐ 누크 마일 미션</span>
                <span className="text-[10px] sm:text-xs font-black text-slate-800 mt-0.5 truncate">{activeMission.title}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-0.5">
                  진행도: {missionProgress[activeMission.id] || 0} / {activeMission.targetValue}
                </span>
              </div>
            )}

            {/* Nearby NPC alert indicator */}
            {nearbyNpc && !selectedNpc && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <div className="rounded-2xl px-4 py-2 shadow-lg font-black text-xs flex items-center gap-2"
                  style={{background:NPCS[nearbyNpc].bgColor, border:`2px solid ${NPCS[nearbyNpc].color}`, color:NPCS[nearbyNpc].color}}>
                  {NPCS[nearbyNpc].emoji} {NPCS[nearbyNpc].name}에게 더 다가가서 인사해요!
                </div>
              </div>
            )}

            {/* Nearby Furniture check (inspect prompt) */}
            {nearbyFurniture && !activeFurnitureModal && (
              <div className="absolute z-20 pointer-events-auto"
                style={{
                  left: `${(nearbyFurniture === "door" ? 6 : nearbyFurniture === "desk" ? 12 : 18) * TILE_SIZE}px`,
                  top: `${4 * TILE_SIZE - 18}px`,
                  transform: "translate(-50%, -100%)",
                  animation: "bounceIn 0.4s ease-out"
                }}>
                <button
                  onClick={() => { playSound("click"); setActiveFurnitureModal(nearbyFurniture); setHouseActiveTab("cards"); }}
                  className="relative rounded-2xl px-4 py-2 shadow-xl font-black text-xs sm:text-sm flex items-center gap-1.5 bg-[#ffd54f] border-2 border-[#b58100] text-[#5d4037] hover:scale-105 active:scale-95 transition select-none"
                >
                  💬 정리하기
                  <span className="absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#b58100]"></span>
                  <span className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#ffd54f]"></span>
                </button>
              </div>
            )}

            {/* Enter My House prompt */}
            {isNearMyHouse && indoorArea === "village" && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => {
                    playSound("phone_open");
                    setIndoorArea("myhouse");
                    playerPos.current = { x: 12 * TILE_SIZE + TILE_SIZE/2, y: 13 * TILE_SIZE + TILE_SIZE/2 };
                    pathQueue.current = [];
                  }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#78c896] border-2 border-[#2e7d32] text-white hover:scale-105 active:scale-95 transition"
                >
                  🏡 집으로 들어가기
                </button>
              </div>
            )}

            {/* Bus Stop Prompt */}
            {isNearBusStop && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("bus"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#60a5fa] border-2 border-[#1e3a8a] text-white hover:scale-105 active:scale-95 transition"
                >
                  🚏 버스 정류장 이용하기
                </button>
              </div>
            )}

            {/* Kiosk Prompt */}
            {isNearKiosk && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("kiosk"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#fbbf24] border-2 border-[#78350f] text-[#78350f] hover:scale-105 active:scale-95 transition"
                >
                  🍔 패스트푸드 주문하기
                </button>
              </div>
            )}

            {/* ATM Prompt */}
            {isNearAtm && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("atm"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#34d399] border-2 border-[#064e3b] text-white hover:scale-105 active:scale-95 transition"
                >
                  🏧 은행 ATM 이용하기
                </button>
              </div>
            )}

            {/* Parking Prompt */}
            {isNearParking && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("parking"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#64748b] border-2 border-[#1e293b] text-white hover:scale-105 active:scale-95 transition"
                >
                  🅿️ 주차정산기 이용하기
                </button>
              </div>
            )}

            {/* Mind Prompt */}
            {isNearMind && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("mind"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#ec4899] border-2 border-[#831843] text-white hover:scale-105 active:scale-95 transition"
                >
                  💚 마음쉼터 이용하기
                </button>
              </div>
            )}

            {/* School Prompt */}
            {isNearSchool && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("school"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#f97316] border-2 border-[#7c2d12] text-white hover:scale-105 active:scale-95 transition"
                >
                  🏫 학교 이용하기
                </button>
              </div>
            )}

            {/* Safety Prompt */}
            {isNearSafety && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("safety"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#ef4444] border-2 border-[#7f1d1d] text-white hover:scale-105 active:scale-95 transition"
                >
                  🚨 안전훈련장 이용하기
                </button>
              </div>
            )}

            {/* Fishing Spot Prompt */}
            {isNearFishDock && indoorArea === "village" && !activeMissionModal && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
                style={{animation:"bounceIn 0.4s ease-out"}}>
                <button
                  onClick={() => { playSound("click"); setActiveMissionModal("fishing"); }}
                  className="rounded-2xl px-5 py-2.5 shadow-xl font-black text-sm flex items-center gap-2 bg-[#8c6239] border-2 border-[#5d4037] text-white hover:scale-105 active:scale-95 transition"
                >
                  🎣 낚시터 이용하기
                </button>
              </div>
            )}

            {/* Slide-in Interactive Nook Phone Overlay inside screen */}
            <div className={`absolute top-0 right-0 h-full w-72 sm:w-80 bg-[#1e293b] border-l-4 border-slate-700 shadow-2xl z-30 flex flex-col transition-transform duration-300 pointer-events-auto ${isNookPhoneOpen ? "translate-x-0" : "translate-x-full"}`}>
              {/* Phone Status Bar */}
              <div className="h-6 bg-[#0f172a] px-3 flex justify-between items-center text-[9px] text-slate-300 select-none">
                <span className="font-bold flex items-center gap-0.5">📶 NookMobile</span>
                <span className="font-black tracking-wider text-slate-400">NookPhone</span>
                <span className="font-bold flex items-center gap-1">{clockText} 🔋 94%</span>
              </div>

              {/* Phone Content Screen */}
              <div className="flex-1 bg-[#e4edd5] p-3 flex flex-col overflow-y-auto">
                {!activePhoneApp ? (
                  // App grid screen
                  <div className="flex-1 flex flex-col">
                    <div className="text-center py-2 bg-[#76a048] rounded-xl text-white font-black text-xs mb-4 shadow-sm">
                      누크 앱 실행기
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Pocket Inventory App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("pocket"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">🎒</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">도감</span>
                      </button>
                      
                      {/* Neighbors App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("villager"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">🐾</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">주민</span>
                      </button>

                      {/* Map App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("map"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">🗺️</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">지도</span>
                      </button>

                      {/* Nook Miles App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("miles"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">⭐</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">마일 미션</span>
                      </button>

                      {/* Audio Control App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("audio"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">🎵</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">라디오</span>
                      </button>

                      {/* Miles Shop App */}
                      <button onClick={() => { playSound("click"); setActivePhoneApp("shop"); }} className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95">
                        <span className="text-3xl">🛍️</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">이음 숍</span>
                      </button>

                      {/* Self-Reliance Workshop App */}
                      <Link href="/workshop" className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95 justify-center">
                        <span className="text-3xl">🛠️</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">자립공방</span>
                      </Link>

                      {/* Return back home App */}
                      <Link href="/student/home" className="flex flex-col items-center p-2 bg-white rounded-2xl border-2 border-[#8da86f]/40 shadow-sm hover:scale-105 transition active:scale-95 justify-center">
                        <span className="text-3xl">✈️</span>
                        <span className="text-[10px] font-black text-[#566c3e] mt-1">돌아가기</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Deep app view Screen
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3 border-b-2 border-[#8da86f]/20 pb-2">
                      <button onClick={() => { playSound("click"); setActivePhoneApp(null); }} className="px-2 py-1 bg-white hover:bg-slate-100 rounded-lg text-[10px] font-black text-[#566c3e] border border-slate-300 transition">
                        ← 뒤로
                      </button>
                      <span className="text-[10px] font-black text-[#566c3e] bg-white/50 px-2 py-0.5 rounded-full">
                       {activePhoneApp === "pocket" && "🎒 주머니 도감"}
                        {activePhoneApp === "villager" && "🐾 주민 목록"}
                        {activePhoneApp === "map" && "🗺️ 마을 실시간 지도"}
                        {activePhoneApp === "miles" && "⭐ 누크 마일 미션"}
                        {activePhoneApp === "audio" && "🎵 라디오 음악 설정"}
                        {activePhoneApp === "shop" && "🛍️ 이음 마일 숍"}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {activePhoneApp === "pocket" && renderPocketApp()}
                      {activePhoneApp === "villager" && renderVillagerApp()}
                      {activePhoneApp === "map" && renderMapApp()}
                      {activePhoneApp === "miles" && renderMilesApp()}
                      {activePhoneApp === "audio" && renderAudioApp()}
                      {activePhoneApp === "shop" && renderMilesShop()}
                    </div>
                  </div>
                )}
              </div>

              {/* Physical Home Button of Smartphone */}
              <div onClick={() => { playSound("phone_close"); setIsNookPhoneOpen(false); setActivePhoneApp(null); }} className="h-10 bg-[#0f172a] border-t border-slate-800 flex justify-center items-center cursor-pointer hover:bg-slate-900 active:bg-slate-950 transition">
                <div className="w-6 h-6 rounded-full border-2 border-slate-600 bg-slate-800 shadow-inner flex items-center justify-center">
                  <span className="block w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Message Window below the Map */}
          <div className="bg-[#85e3b2] border-t-[4px] border-[#52b788] px-2 py-2 sm:px-3 sm:py-2.5 flex items-center justify-center select-none">
            <div className="w-full bg-white rounded-2xl border-[3px] border-[#52b788] px-3 py-2 sm:px-5 sm:py-2.5 shadow-inner flex items-center justify-center min-h-[48px] sm:min-h-[56px]">
              <p className="font-black text-emerald-800 text-[11px] sm:text-sm md:text-base text-center leading-snug w-full flex items-center justify-center gap-1.5">
                <span>💬</span> {messageText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dialog Modal */}
      {selectedNpc && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={()=>setSelectedNpc(null)}>
          <div className="w-full max-w-md rounded-[28px] p-5 shadow-2xl mb-4"
            style={{background:NPCS[selectedNpc].bgColor, border:`4px solid ${NPCS[selectedNpc].color}`}}
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">{NPCS[selectedNpc].emoji}</div>
              <div>
                <p className="font-black text-base" style={{color:NPCS[selectedNpc].color}}>{NPCS[selectedNpc].name}</p>
                <p className="text-[10px] font-bold text-slate-500">{tc.emoji} {tc.label} · 대화 친밀도 +5 XP</p>
              </div>
            </div>
            <div className="bg-white/75 rounded-2xl p-4 mb-4 border border-slate-200">
              <p className="font-bold text-base text-slate-800 leading-relaxed">&ldquo;{dialogText}&rdquo;</p>
            </div>
            {/* Quest or Standard Interaction Buttons */}
            {selectedNpc === "lily" && activeQuest && activeQuest.id === "lily-burger" && activeQuest.status !== "completed" ? (
              <div className="flex flex-col gap-2 w-full">
                {activeQuest.status === "idle" && (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        playSound("mission");
                        const updated = { ...activeQuest, status: "active" as const };
                        saveQuestState(updated);
                        setDialogText("우와! 정말로 고마워, 하늘아! 패스트푸드점에 있는 키오스크에서 안전하게 🍔 햄버거를 카드로 주문해다 주면 돼. 조심히 잘 다녀와!");
                      }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black text-white shadow transition hover:opacity-90 active:scale-95 bg-emerald-500"
                    >
                      응, 내가 사다 줄게! 👍
                    </button>
                    <button
                      onClick={() => {
                        playSound("click");
                        setSelectedNpc(null);
                      }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black border-2 bg-white/50 transition hover:bg-white text-rose-500 border-rose-300"
                    >
                      미안해, 지금은 바빠 😢
                    </button>
                  </div>
                )}
                
                {activeQuest.status === "active" && (
                  <button
                    onClick={() => {
                      playSound("click");
                      setSelectedNpc(null);
                    }}
                    className="w-full rounded-xl py-2.5 text-xs font-black text-white shadow transition hover:opacity-90 active:scale-95 bg-sky-500"
                  >
                    알겠어, 금방 다녀올게! 👋
                  </button>
                )}

                {activeQuest.status === "ready_to_deliver" && (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        playSound("mission");
                        removeBurgerFromInventory();
                        const updated = { ...activeQuest, status: "completed" as const };
                        saveQuestState(updated);
                        
                        // Reward 500 Miles
                        setTotalPoints(p => {
                          const n = p + 500;
                          localStorage.setItem("haemileum_village_points", String(n));
                          return n;
                        });

                        // Set stamp animation trigger
                        setCelebratingMission({
                          id: "lily-quest",
                          title: "릴리의 맛있는 햄버거",
                          desc: "릴리에게 안전하게 키오스크로 구매한 햄버거 배달 성공!",
                          targetType: "gift_npc",
                          targetValue: 1,
                          points: 500
                        });

                        setDialogText("우와아...! 🍔 햄버거가 진짜 따끈따끈해! 안전하게 기계로 계산해서 가져와 줬구나. 하늘이는 정말 씩씩하고 예의가 발라! 너무 고마워, 이건 내 보답이야! (500 Miles 획득!)");
                      }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black text-white shadow transition hover:opacity-90 active:scale-95 bg-amber-500 animate-bounce"
                    >
                      여기 있어, 릴리야! 🍔🎁
                    </button>
                    <button
                      onClick={() => {
                        playSound("click");
                        setSelectedNpc(null);
                      }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-black border-2 bg-white/50 transition hover:bg-white text-slate-500 border-slate-300"
                    >
                      인사하고 가기 👋
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Standard dialog buttons
              <div className="flex gap-2 w-full">
                <button
                  onClick={()=>{
                    const lines=NPCS[selectedNpc].dialogs[timeOfDay];
                    setDialogText(lines[Math.floor(Math.random()*lines.length)]);
                    addXp(selectedNpc,5);
                    playSound("npc");
                    updateMissionProgress("talk_npc", 1);
                  }}
                  className="flex-1 rounded-xl py-2.5 text-xs font-black text-white shadow transition hover:opacity-90 active:scale-95"
                  style={{background:NPCS[selectedNpc].color}}>
                  인사 나누기 (+5 XP)
                </button>
                <button onClick={() => { playSound("click"); setSelectedNpc(null); }}
                  className="flex-1 rounded-xl py-2.5 text-xs font-black border-2 bg-white/50 transition hover:bg-white animate-pulse"
                  style={{borderColor:NPCS[selectedNpc].color,color:NPCS[selectedNpc].color}}>
                  인사하고 가기 👋
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* House Indoor Furniture Item Modal */}
      {activeFurnitureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={() => setActiveFurnitureModal(null)}>
          <div className="bg-[#fffdf9] border-4 border-[#8c6239] rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative flex flex-col max-h-[90vh]"
            style={{ animation: "bounceIn 0.4s ease-out" }}
            onClick={e=>e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <span className="text-4xl">
                {activeFurnitureModal === "door" && "🚪"}
                {activeFurnitureModal === "desk" && "📝"}
                {activeFurnitureModal === "safety" && "🛡️"}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm sm:text-base text-slate-800">
                  {activeFurnitureModal === "door" && "현관 준비 선반"}
                  {activeFurnitureModal === "desk" && "책상 카드 서랍"}
                  {activeFurnitureModal === "safety" && "안전 연락판"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                  {activeFurnitureModal === "door" && "밖에 나가기 전에 버스카드와 결제 카드를 챙겨요."}
                  {activeFurnitureModal === "desk" && "은행 카드, 학생증, 낚시대를 넣어 둬요."}
                  {activeFurnitureModal === "safety" && "비상용 휴대폰과 연락 카드, 현금을 챙겨요."}
                </p>
              </div>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-2 border-b-2 border-[#8c6239]/10 pb-2 mb-3 shrink-0">
              <button
                onClick={() => { playSound("click"); setHouseActiveTab("cards"); }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                  houseActiveTab === "cards" ? "bg-[#8c6239] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                👜 집 가구 정리
              </button>
              <button
                onClick={() => { playSound("click"); setHouseActiveTab("storage"); }}
                className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                  houseActiveTab === "storage" ? "bg-[#8c6239] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                🏡 집 보관창고 ({houseStorage.reduce((a, b) => a + b.count, 0)}개)
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto py-1 space-y-2.5 min-h-[150px]">
              {houseActiveTab === "cards" ? (
                // Tab 1: Manage mission cards
                POCKET_ITEMS.filter(item => {
                  if (activeFurnitureModal === "door") return item.id === "bus_card" || item.id === "payment_card";
                  if (activeFurnitureModal === "desk") return item.id === "bank_card" || item.id === "student_id" || item.id === "fishing_rod";
                  return item.id === "phone" || item.id === "emergency_card" || item.id === "cash";
                }).map(item => {
                  const isPacked = packedItemIds.includes(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-800">{item.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">{item.action}</p>
                        </div>
                      </div>

                      {isPacked ? (
                        <button
                          onClick={() => unpackHouseItem(item.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black shadow-sm transition"
                        >
                          내려놓기 🏡
                        </button>
                      ) : (
                        <button
                          onClick={() => packHouseItem(item.id)}
                          className="px-3 py-1 bg-[#76a048] hover:bg-[#5f823a] text-white rounded-lg text-[10px] font-black shadow transition active:scale-95"
                        >
                          챙기기 🎒
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                // Tab 2: Manage house cabinet storage
                houseStorage.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">
                    창고가 비어 있습니다.<br />수집품 주머니를 열어 여기에 보관하세요!
                  </div>
                ) : (
                  houseStorage.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <p className="text-xs font-black text-slate-800">{item.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">보관 수량: {item.count}개</p>
                        </div>
                      </div>

                      <button
                        onClick={() => withdrawItem(idx)}
                        className="px-3 py-1 bg-[#a78bfa] hover:bg-[#8b5cf6] text-white rounded-lg text-[10px] font-black shadow transition active:scale-95"
                      >
                        꺼내기 🎒
                      </button>
                    </div>
                  ))
                )
              )}
            </div>

            <button
              onClick={() => { playSound("click"); setActiveFurnitureModal(null); }}
              className="w-full py-2.5 bg-[#8c6239] hover:bg-[#5d4037] text-white rounded-xl font-black text-xs sm:text-sm shadow transition shrink-0 mt-3"
            >
              정리 완료
            </button>
          </div>
        </div>
      )}

      {/* ── Animal Crossing pockets Inventory UI overlay ── */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6"
          onClick={() => { playSound("phone_close"); setIsInventoryOpen(false); setActiveSlotAction(null); }}>
          <div className="bg-[#f8f5e6] border-[6px] border-[#d8cdb2] rounded-[42px] sm:rounded-[48px] p-5 sm:p-6 max-w-2xl w-full shadow-2xl relative flex flex-col"
            style={{ animation: "bounceIn 0.4s ease-out" }}
            onClick={e=>e.stopPropagation()}>
            
            {/* Inventory Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-5 shrink-0 border-b-2 border-[#d8cdb2]/20 pb-2">
              <span className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                👜 {studentName}의 주머니
              </span>
              <button
                onClick={() => { playSound("phone_close"); setIsInventoryOpen(false); setActiveSlotAction(null); }}
                className="w-8 h-8 rounded-full border-2 border-slate-400 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 font-bold transition flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* 20 slots Grid (2 rows of 10 slots) */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 py-4 justify-items-center">
              {displaySlots.map((slot, idx) => {
                if (slot === null) {
                  return (
                    <div key={idx} className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#ebdcb9] flex items-center justify-center border-2 border-transparent select-none opacity-60">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d0c090]" />
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    onClick={() => { playSound("click"); setActiveSlotAction(idx); }}
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white flex items-center justify-center border-2 border-[#d0c090] relative shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition ${
                      activeSlotAction === idx ? "ring-4 ring-amber-400 border-amber-500" : ""
                    }`}
                  >
                    {slot.isCard ? (
                      // Custom Card Icon rendering to make cards highly recognizable
                      <div className="flex flex-col items-center justify-center w-full h-full p-1 relative select-none">
                        <span className="text-xl sm:text-2xl">{slot.emoji}</span>
                        <span className="absolute bottom-[2px] bg-[#8c6239] text-[#fffdf9] font-black text-[6px] px-1 rounded scale-90 leading-normal select-none">
                          {slot.iconText}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl sm:text-2xl">{slot.emoji}</span>
                    )}
                    {!slot.isCard && slot.count > 1 && (
                      <span className="absolute bottom-0 right-0 bg-slate-800/80 text-white font-black text-[8px] sm:text-[9px] px-1 rounded-full leading-tight select-none">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom info panel (Points, Clothing button decorator) */}
            <div className="flex justify-between items-center mt-5 pt-3 border-t-2 border-[#d8cdb2]/20 shrink-0">
              {/* Money Bag Pouch display */}
              <div className="flex items-center gap-2 bg-[#f0e6c5] border border-[#d2c295] rounded-full px-4 py-1.5 shadow-inner">
                <span className="text-lg">💰</span>
                <span className="font-black text-xs sm:text-sm text-[#7e6022]">{totalPoints.toLocaleString()} Miles</span>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-[#acd5be] border border-white flex items-center justify-center text-lg shadow-sm">
                  👕
                </div>
              </div>
            </div>

            {/* Floating Action Menu dropdown when slot selected */}
            {activeSlotAction !== null && displaySlots[activeSlotAction] !== null && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fffdf5] border-4 border-[#d8cdb2] rounded-3xl p-4 w-52 shadow-2xl z-50 flex flex-col gap-2"
                style={{ animation: "bounceIn 0.2s ease-out" }}>
                <p className="text-center font-black text-xs text-slate-800 border-b pb-1">
                  {displaySlots[activeSlotAction]!.emoji} {displaySlots[activeSlotAction]!.name}
                  {!displaySlots[activeSlotAction]!.isCard && ` (${displaySlots[activeSlotAction]!.count}개)`}
                </p>
                
                {/* Eat action for edible items */}
                {!displaySlots[activeSlotAction]!.isCard && ["mushroom", "apple", "cherry"].includes(displaySlots[activeSlotAction]!.id) && (
                  <button
                    onClick={() => eatItem(displaySlots[activeSlotAction]!.origIdx)}
                    className="w-full py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black rounded-xl transition"
                  >
                    😋 먹기
                  </button>
                )}

                {/* Store action if inside house */}
                {displaySlots[activeSlotAction]!.isCard ? (
                  // For cards: allow unpacking/putting back if inside My House
                  indoorArea === "myhouse" && (
                    <button
                      onClick={() => {
                        unpackHouseItem(displaySlots[activeSlotAction]!.id);
                        setActiveSlotAction(null);
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition"
                    >
                      🏡 제자리에 놓기
                    </button>
                  )
                ) : (
                  indoorArea === "myhouse" ? (
                    <button
                      onClick={() => storeItem(displaySlots[activeSlotAction]!.origIdx)}
                      className="w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-black rounded-xl transition"
                    >
                      🏡 창고에 보관
                    </button>
                  ) : (
                    // Drop action if in village map
                    <button
                      onClick={() => dropItem(displaySlots[activeSlotAction]!.origIdx)}
                      className="w-full py-1.5 bg-red-100 hover:bg-red-200 text-red-950 text-xs font-black rounded-xl transition"
                    >
                      🍂 바닥에 버리기
                    </button>
                  )
                )}

                <button
                  onClick={() => setActiveSlotAction(null)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mission Selector Details Modal */}
      {activeMissionModal && activeMissionModal !== "fishing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[3px] p-4"
          onClick={() => setActiveMissionModal(null)}>
          <div className="bg-[#fffdf9] border-4 border-[#8c6239] rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative flex flex-col animate-[bounceIn_0.4s_ease-out]"
            onClick={e=>e.stopPropagation()}>
            
            {/* Modal Close Button */}
            <button
              onClick={() => { playSound("phone_close"); setActiveMissionModal(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-slate-400 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 font-bold transition flex items-center justify-center text-xs"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">
                {activeMissionModal === "bus" && "🚏"}
                {activeMissionModal === "kiosk" && "🍔"}
                {activeMissionModal === "atm" && "🏧"}
                {activeMissionModal === "parking" && "🅿️"}
                {activeMissionModal === "mind" && "💚"}
                {activeMissionModal === "school" && "🏫"}
                {activeMissionModal === "safety" && "🚨"}
              </span>
              <div>
                <h3 className="font-black text-lg text-slate-800">
                  {activeMissionModal === "bus" && "버스 타기 연습"}
                  {activeMissionModal === "kiosk" && "패스트푸드 주문"}
                  {activeMissionModal === "atm" && "은행 ATM 사용하기"}
                  {activeMissionModal === "parking" && "무인 주차 정산기 사용"}
                  {activeMissionModal === "mind" && "마음쉼터 감정 진단"}
                  {activeMissionModal === "school" && "학교생활 소통 훈련"}
                  {activeMissionModal === "safety" && "안전훈련 SOS 대처"}
                </h3>
                <p className="text-xs text-amber-600 font-bold">
                  {activeMissionModal === "bus" && "이동·예매 트레이닝"}
                  {activeMissionModal === "kiosk" && "주문·결제 트레이닝"}
                  {activeMissionModal === "atm" && "공공·생활 금융 트레이닝"}
                  {activeMissionModal === "parking" && "공공·생활 결제 트레이닝"}
                  {activeMissionModal === "mind" && "심리·감정 치유 케어"}
                  {activeMissionModal === "school" && "교실·학교 생활 트레이닝"}
                  {activeMissionModal === "safety" && "재난·위기 대응 트레이닝"}
                </p>
              </div>
            </div>

            {/* Info details */}
            <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">설명</span>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  {activeMissionModal === "bus" && "주변 버스 정류장의 정보를 찾아보고 알맞은 타이밍에 카드를 태그하여 버스에 승차하는 미션입니다."}
                  {activeMissionModal === "kiosk" && "패스트푸드 매장의 무인 결제 키오스크 기기를 다루고 메뉴를 선택하여 주문 및 결제해보는 미션입니다."}
                  {activeMissionModal === "atm" && "은행 현금 자동 입출금기(ATM)를 이용해 안전하게 현금을 출금하고 비밀번호를 지키는 미션입니다."}
                  {activeMissionModal === "parking" && "차량을 출차하기 전 무인 주차 정산기를 통해 차량 번호를 입력하고 주차 요금을 결제하는 미션입니다."}
                  {activeMissionModal === "mind" && "마음쉼터에서 나의 감정 상태를 돌아보고 간단한 체크리스트를 통해 마음의 안정을 얻는 미션입니다."}
                  {activeMissionModal === "school" && "학교 교실과 활동 공간에서 선생님, 친구들과의 바른 대화법을 익히고 상황별 의사소통을 해보는 미션입니다."}
                  {activeMissionModal === "safety" && "재난 상황이나 긴급 위기 발생 시 안전하게 대처하고 SOS 구조 신호를 보내는 가상 안전 훈련 미션입니다."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block">난이도</span>
                  <span className="font-black text-[#76a048]">
                    {activeMissionModal === "kiosk" || activeMissionModal === "mind" ? "쉬움"
                     : activeMissionModal === "safety" ? "어려움"
                     : "보통"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block">소요 시간</span>
                  <span className="font-black text-amber-600">
                    {activeMissionModal === "bus" ? "약 7분"
                     : activeMissionModal === "kiosk" || activeMissionModal === "mind" ? "약 5분"
                     : activeMissionModal === "atm" || activeMissionModal === "school" ? "약 8분"
                     : activeMissionModal === "parking" ? "약 6분"
                     : "약 10분"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">핵심 활동 단계</span>
                <div className="flex flex-wrap gap-1">
                  {activeMissionModal === "bus" && ["노선 확인", "요금 확인", "카드 태그", "안전 하차"].map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-blue-100">{s}</span>
                  ))}
                  {activeMissionModal === "kiosk" && ["매장 식사/포장", "메뉴 담기", "수량 확인", "카드 결제"].map(s => (
                    <span key={s} className="bg-amber-50 text-amber-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-amber-100">{s}</span>
                  ))}
                  {activeMissionModal === "atm" && ["카드/통장 투입", "예금 출금", "비밀번호 입력", "카드/현금 수령"].map(s => (
                    <span key={s} className="bg-emerald-50 text-emerald-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-emerald-100">{s}</span>
                  ))}
                  {activeMissionModal === "parking" && ["차량번호 입력", "요금 확인", "할인권 적용", "카드 결제"].map(s => (
                    <span key={s} className="bg-slate-50 text-slate-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-slate-100">{s}</span>
                  ))}
                  {activeMissionModal === "mind" && ["마음 환기", "감정 진단", "마인드 맵", "쉼터 휴식"].map(s => (
                    <span key={s} className="bg-pink-50 text-pink-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-pink-100">{s}</span>
                  ))}
                  {activeMissionModal === "school" && ["등교 인사", "질문하기", "발표 요령", "친구 대화"].map(s => (
                    <span key={s} className="bg-orange-50 text-orange-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-orange-100">{s}</span>
                  ))}
                  {activeMissionModal === "safety" && ["상황 인지", "대피로 파악", "신고 요령", "SOS 신호"].map(s => (
                    <span key={s} className="bg-rose-50 text-rose-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-rose-100">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex gap-2">
              <Link
                href={
                  activeMissionModal === "bus" ? "/simulation/bus"
                  : activeMissionModal === "kiosk" ? "/simulation/kiosk"
                  : activeMissionModal === "atm" ? "/simulation/atm"
                  : activeMissionModal === "parking" ? "/simulation/parking"
                  : activeMissionModal === "mind" ? "/emotion/check"
                  : activeMissionModal === "school" ? "/simulation/school-talk"
                  : "/simulation/safety-sos"
                }
                className="flex-1 py-3 bg-[#76a048] hover:bg-[#5f823a] text-white rounded-2xl font-black text-center text-sm shadow transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
              >
                🚀 미션 시작하기 ➔
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeMissionModal === "fishing" && (() => {
        const hasRod = packedItemIds.includes("fishing_rod");
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[3px] p-4"
            onClick={cancelFishing}>
            <div className="bg-gradient-to-b from-[#e0f2fe] to-[#fffdf9] border-4 border-[#4a90c4] rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl relative flex flex-col animate-[bounceIn_0.4s_ease-out]"
              onClick={e=>e.stopPropagation()}>
              
              {/* Close button */}
              <button
                onClick={cancelFishing}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-slate-400 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 font-bold transition flex items-center justify-center text-xs"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">🎣</span>
                <div>
                  <h3 className="font-black text-lg text-slate-800">해밀 강가 낚시터</h3>
                  <p className="text-xs text-blue-600 font-bold">물 속의 물고기를 낚아보세요!</p>
                </div>
              </div>

              {!hasRod ? (
                // Case: No Fishing Rod
                <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 mb-4 text-center space-y-4">
                  <span className="text-5xl block">⚠️</span>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-700">앗! 낚시를 시작할 수 없습니다.</p>
                    <p className="text-xs text-slate-500 font-bold">
                      낚시를 하려면 <span className="text-emerald-600 font-black">낚시대</span> 아이템이 필요합니다.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-bold text-slate-500 text-left">
                    💡 <span className="text-slate-800">어떻게 얻나요?</span>
                    <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                      <li>마을의 우리집(🏡)으로 들어갑니다.</li>
                      <li>방 안에 있는 <span className="text-[#8c6239] font-black">책상 카드 서랍(📝)</span>을 클릭합니다.</li>
                      <li>서랍에서 <b>낚시대</b>를 주머니(👜)로 챙겨서 나옵니다.</li>
                    </ol>
                  </div>
                  <button
                    onClick={cancelFishing}
                    className="w-full py-2.5 bg-[#4a90c4] hover:bg-[#3a7ab0] text-white rounded-2xl font-black text-xs sm:text-sm shadow transition"
                  >
                    확인
                  </button>
                </div>
              ) : (
                // Case: Fishing Rod in Pockets - Interactive Fishing Game
                <div className="bg-white/80 border border-blue-200 rounded-2xl p-4 mb-4 space-y-3 text-center overflow-hidden">
                  
                  {/* Water scene with bobber animation */}
                  <div className="relative w-full h-36 bg-gradient-to-b from-[#5aafe0] to-[#2a6090] rounded-xl overflow-hidden">
                    {/* Waves */}
                    <div className="absolute inset-0">
                      <div className="absolute w-full h-1 bg-white/20 top-[30%] animate-[pulse_3s_infinite]" style={{borderRadius:'50%'}} />
                      <div className="absolute w-full h-1 bg-white/15 top-[55%] animate-[pulse_4s_infinite_0.5s]" style={{borderRadius:'50%'}} />
                      <div className="absolute w-full h-1 bg-white/10 top-[75%] animate-[pulse_3.5s_infinite_1s]" style={{borderRadius:'50%'}} />
                    </div>

                    {fishingState === "idle" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl animate-bounce">🎣</span>
                        <p className="text-white text-xs font-black mt-1 drop-shadow">찌를 던져볼까요?</p>
                      </div>
                    )}

                    {fishingState === "waiting" && (
                      <>
                        {/* Bobber */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-[25%] animate-[bounce_2s_infinite]">
                          <div className="w-3 h-8 bg-white rounded-full relative">
                            <div className="absolute bottom-0 w-3 h-4 bg-red-500 rounded-b-full" />
                          </div>
                        </div>
                        {/* Fish swimming */}
                        <div className="absolute text-2xl animate-[fishSwim_4s_linear_infinite]" style={{top:'60%'}}>
                          🐟
                        </div>
                        <div className="absolute text-xl animate-[fishSwim_5s_linear_infinite_1.5s]" style={{top:'75%'}}>
                          🐠
                        </div>
                        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-[11px] font-black drop-shadow animate-pulse">
                          물고기를 기다리는 중... 🌊
                        </p>
                      </>
                    )}

                    {fishingState === "nibble" && (
                      <>
                        {/* Bobber sinking */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-[40%] animate-[shake_0.15s_infinite]">
                          <div className="w-3 h-8 bg-white rounded-full relative">
                            <div className="absolute bottom-0 w-3 h-4 bg-red-500 rounded-b-full" />
                          </div>
                        </div>
                        {/* Fish biting */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-[52%] text-3xl animate-[shake_0.2s_infinite]">
                          🐟
                        </div>
                        {/* Alert */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 animate-[pulse_0.4s_infinite]">
                          <span className="text-3xl">❗</span>
                        </div>
                        {/* Ripples */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-[45%] w-16 h-6 border-2 border-white/40 rounded-full animate-ping" />
                      </>
                    )}

                    {fishingState === "caught" && caughtFish && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-400/30">
                        <span className="text-6xl animate-[bounce_0.6s_2]">{caughtFish.emoji}</span>
                        <p className="text-white text-sm font-black drop-shadow mt-1">🎉 잡았다!</p>
                      </div>
                    )}

                    {fishingState === "missed" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/30">
                        <span className="text-5xl">💨</span>
                        <p className="text-white text-xs font-black drop-shadow mt-1">물고기가 도망쳤습니다!</p>
                      </div>
                    )}
                  </div>

                  {/* Status & Action area */}
                  {fishingState === "idle" && (
                    <button
                      onClick={startFishing}
                      className="w-full py-3 bg-gradient-to-r from-[#4a90c4] to-[#76a048] hover:from-[#3a7ab0] hover:to-[#5f823a] text-white rounded-2xl font-black text-sm shadow-lg transition hover:scale-[1.02] active:scale-95"
                    >
                      낚싯대 던지기 🎣
                    </button>
                  )}

                  {fishingState === "waiting" && (
                    <p className="text-xs font-black text-blue-600 py-2 animate-pulse">
                      ⏳ 물고기가 오고 있어요... 화면을 주시하세요!
                    </p>
                  )}

                  {fishingState === "nibble" && (
                    <button
                      onClick={pullFishingRod}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-2xl font-black text-base shadow-lg transition hover:scale-[1.04] active:scale-95 animate-pulse"
                    >
                      🖱️ 지금 클릭! 낚싯대 당기기!
                    </button>
                  )}

                  {fishingState === "caught" && caughtFish && (
                    <div className="space-y-2">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-xs font-black text-emerald-700">
                          {caughtFish.rarity === "rare" ? "✨ 희귀! " : ""}
                          <span className="text-sm">{caughtFish.emoji} [{caughtFish.name}]</span> 획득!
                          <span className="text-[10px] text-slate-400 ml-1">+{caughtFish.points}점</span>
                        </p>
                      </div>
                      <button
                        onClick={startFishing}
                        className="w-full py-2.5 bg-[#4a90c4] hover:bg-[#3a7ab0] text-white rounded-2xl font-black text-xs shadow transition"
                      >
                        한 번 더 하기 🎣
                      </button>
                    </div>
                  )}

                  {fishingState === "missed" && (
                    <div className="flex gap-2">
                      <button
                        onClick={startFishing}
                        className="flex-1 py-2.5 bg-[#4a90c4] hover:bg-[#3a7ab0] text-white rounded-2xl font-black text-xs shadow transition"
                      >
                        다시 시도 🎣
                      </button>
                      <button
                        onClick={cancelFishing}
                        className="flex-1 py-2.5 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-2xl font-black text-xs shadow transition"
                      >
                        그만하기
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}
