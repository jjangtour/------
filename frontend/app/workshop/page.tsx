"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

// ─── TYPES & DATA ──────────────────────────────────────────────────────────

type ViewState = "map" | "request" | "pocket" | "decor" | "sim" | "success" | "report";

interface SpaceConfig {
  id: string;
  name: string;
  emoji: string;
  character: string;
  charName: string;
  charEmoji: string;
  requestText: string;
  difficulty: "쉬움" | "보통" | "도전";
  targetScore: number;
  requiredItems: string[]; // Pocket required items
  decorRequired: string[]; // Must place inside grid
}

interface DecorItem {
  id: string;
  name: string;
  emoji: string;
  category: "essential" | "safety" | "deco";
  desc: string;
}

interface GridCell {
  row: number;
  col: number;
  itemId: string | null;
}

interface ReportLog {
  spaceId: string;
  spaceName: string;
  completedAt: string;
  pocketFails: number;
  decorFails: number;
  simFails: number;
  mistakes: string[];
}

// Korean grammar helper for suffixes
const getCharText = (name: string, suffixType: "의" | "가" | "와" | "한마디") => {
  const isConsonant = name === "민준"; // Currently only "민준" ends with a consonant
  if (suffixType === "의") {
    return isConsonant ? `${name}이의` : `${name}의`;
  }
  if (suffixType === "가") {
    return isConsonant ? `${name}이가` : `${name}가`;
  }
  if (suffixType === "와") {
    return isConsonant ? `${name}이와` : `${name}와`;
  }
  if (suffixType === "한마디") {
    return isConsonant ? `${name}이의 한마디:` : `${name}의 한마디:`;
  }
  return name;
};

const SPACES: SpaceConfig[] = [
  {
    id: "bus",
    name: "이음이의 버스정류장",
    emoji: "🚌",
    character: "ieumi",
    charName: "이음이",
    charEmoji: "☁️",
    requestText: "혼자 버스를 타고 집에 가고 싶어. 그런데 버스 번호도 많고 타는 과정이 헷갈려. 내가 안전하게 버스를 탈 수 있게 버스정류장을 예쁘고 알기 쉽게 꾸며줄래?",
    difficulty: "쉬움",
    targetScore: 10,
    requiredItems: ["bus_card", "phone"],
    decorRequired: ["stop_sign", "bus_info", "route_map", "card_reader", "safety_line", "bench"],
  },
  {
    id: "kiosk",
    name: "이음이의 햄버거 가게",
    emoji: "🍔",
    character: "ieumi",
    charName: "이음이",
    charEmoji: "☁️",
    requestText: "햄버거 가게에서 키오스크로 직접 맛있는 메뉴를 주문해서 먹어보고 싶어. 하지만 메뉴가 너무 많고 결제 버튼이 복잡해. 내가 연습할 수 있는 키오스크 햄버거 매장을 만들어줘!",
    difficulty: "보통",
    targetScore: 20,
    requiredItems: ["payment_card", "phone"],
    decorRequired: ["kiosk_device", "menu_board", "card_slot", "pickup_counter", "order_screen", "trash_can"],
  },
  {
    id: "atm",
    name: "이음이의 안전 은행",
    emoji: "🏦",
    character: "ieumi",
    charName: "이음이",
    charEmoji: "☁️",
    requestText: "은행에서 혼자 ATM 기기를 사용해서 저금을 하거나 돈을 찾고 싶어. 그런데 비밀번호를 누를 때 뒤에 사람이 훔쳐볼까 봐 걱정돼. 안전한 ATM 코너를 설계해 줄 수 있어?",
    difficulty: "도전",
    targetScore: 30,
    requiredItems: ["bank_card", "phone"],
    decorRequired: ["atm_device", "wait_line", "privacy_shield", "staff_desk", "cctv_sign", "ticket_machine"],
  },
  {
    id: "mart",
    name: "소미의 편의점",
    emoji: "🏪",
    character: "girl",
    charName: "소미",
    charEmoji: "👧",
    requestText: "편의점에서 스스로 필요한 물건을 골라 계산하는 연습을 하고 싶어요! (미션 준비 중)",
    difficulty: "쉬움",
    targetScore: 15,
    requiredItems: [],
    decorRequired: [],
  },
  {
    id: "hospital",
    name: "민준의 병원 접수처",
    emoji: "🏥",
    character: "boy",
    charName: "민준",
    charEmoji: "👦",
    requestText: "병원에 가서 아픈 곳을 의사 선생님께 스스로 접수하고 진료받는 연습을 하고 싶어! (미션 준비 중)",
    difficulty: "보통",
    targetScore: 25,
    requiredItems: [],
    decorRequired: [],
  },
  {
    id: "library",
    name: "우주의 도서관",
    emoji: "📚",
    character: "boy",
    charName: "우주",
    charEmoji: "👦",
    requestText: "도서관에서 빌리고 싶은 책을 찾고, 대출 반납 기기를 이용해 조용히 책을 빌려볼래! (미션 준비 중)",
    difficulty: "쉬움",
    targetScore: 10,
    requiredItems: [],
    decorRequired: [],
  },
  {
    id: "classroom",
    name: "별이의 학교 교실",
    emoji: "🏫",
    character: "girl",
    charName: "별이",
    charEmoji: "👧",
    requestText: "새로운 학기 교실에서 친구들과 안전하게 준비물을 나누고 인사하는 법을 배울 거야! (미션 준비 중)",
    difficulty: "쉬움",
    targetScore: 10,
    requiredItems: [],
    decorRequired: [],
  },
  {
    id: "town_hall",
    name: "나만의 생활마을 광장",
    emoji: "⛲",
    character: "girl",
    charName: "모두",
    charEmoji: "🌟",
    requestText: "모든 미션을 완료하고, 내가 직접 설계한 자립마을 광장을 완성해 보자! (미션 준비 중)",
    difficulty: "도전",
    targetScore: 50,
    requiredItems: [],
    decorRequired: [],
  }
];

const POCKET_ITEM_POOL = [
  { id: "bus_card", name: "교통카드", emoji: "🚌", desc: "버스나 지하철을 탈 때 요금을 결제해요." },
  { id: "payment_card", name: "신용카드", emoji: "💳", desc: "물건을 사거나 음식을 결제할 때 사용해요." },
  { id: "bank_card", name: "은행 현금카드", emoji: "🏦", desc: "은행 ATM 기기에서 돈을 넣고 뺄 때 써요." },
  { id: "phone", name: "스마트폰", emoji: "📱", desc: "지도 찾기나 위급 상황 시 연락할 때 써요." },
  { id: "nintendo", name: "미니 게임기", emoji: "🎮", desc: "놀고 싶을 때 사용하지만, 자립 활동 시 주의를 분산해요." },
  { id: "student_id", name: "학생증", emoji: "🪪", desc: "내가 이 학교의 학생임을 증명해 주는 카드예요." },
  { id: "cash", name: "종이돈 (현금)", emoji: "💵", desc: "가게에서 물건을 살 때 직접 내는 돈이에요." },
  { id: "fishing_rod", name: "낚싯대", emoji: "🎣", desc: "강이나 바다에서 물고기를 잡을 때 필요한 도구예요." },
];

const DECOR_ITEMS: Record<string, DecorItem[]> = {
  bus: [
    { id: "stop_sign", name: "정류장 표지판", emoji: "🎴", category: "essential", desc: "현재 이곳이 어떤 버스정류장인지 알려줍니다." },
    { id: "bus_info", name: "버스 번호 안내판", emoji: "📟", category: "essential", desc: "도착 예정인 버스 번호와 시간을 실시간으로 띄워요." },
    { id: "route_map", name: "노선도", emoji: "🗺️", category: "essential", desc: "버스가 어떤 길로 가는지 멈추는 정류장을 보여줍니다." },
    { id: "card_reader", name: "교통카드 단말기", emoji: "🎯", category: "essential", desc: "버스를 탈 때 카드를 찍는 곳입니다." },
    { id: "safety_line", name: "안전 대기선", emoji: "🟡", category: "safety", desc: "버스가 올 때까지 노란색 선 뒤에서 안전하게 기다려요." },
    { id: "bench", name: "의자 (벤치)", emoji: "🪑", category: "deco", desc: "버스가 올 때까지 앉아서 편히 기다려요." },
    { id: "street_lamp", name: "가로등", emoji: "💡", category: "deco", desc: "밤에도 정류장을 환하게 비추어 안전하게 만들어줍니다." },
    { id: "flower_pot", name: "꽃화분", emoji: "🪴", category: "deco", desc: "정류장 주변을 아기자기하고 화사하게 장식합니다." },
    { id: "safety_poster", name: "안전 포스터", emoji: "🖼️", category: "safety", desc: "'차도에 가까이 가지 않기' 안내 수칙 포스터입니다." },
    { id: "trash_can", name: "쓰레기통", emoji: "🗑️", category: "deco", desc: "사용하고 남은 휴지나 쓰레기를 버립니다." },
  ],
  kiosk: [
    { id: "kiosk_device", name: "키오스크 기기", emoji: "🖥️", category: "essential", desc: "화면을 터치해서 메뉴를 직접 주문하는 무인 단말기예요." },
    { id: "menu_board", name: "메뉴판", emoji: "📋", category: "essential", desc: "가게에서 파는 햄버거와 음료 사진들이 걸려있어요." },
    { id: "card_slot", name: "카드 결제기", emoji: "💳", category: "essential", desc: "키오스크 주문 후 신용카드를 넣어 결제하는 부분이에요." },
    { id: "pickup_counter", name: "음식 픽업대", emoji: "🛎️", category: "essential", desc: "주문한 햄버거 세트가 완료되면 음식을 받는 곳이에요." },
    { id: "order_screen", name: "주문 번호 화면", emoji: "📺", category: "essential", desc: "내 번호(예: 105번)가 나오면 음식을 찾으러 가도록 번호를 띄워줘요." },
    { id: "trash_can", name: "분리 쓰레기통", emoji: "🗑️", category: "essential", desc: "다 먹고 남은 쟁반의 컵과 종이를 분리수거해요." },
    { id: "table_chair", name: "테이블과 의자", emoji: "🪑", category: "deco", desc: "햄버거를 편안하게 앉아서 먹을 수 있는 좌석이에요." },
    { id: "hand_sanitizer", name: "손소독제", emoji: "🧼", category: "safety", desc: "밥 먹기 전에 손을 깨끗하게 소독해요." },
    { id: "shop_banner", name: "가게 깃발", emoji: "🚩", category: "deco", desc: "맛있는 햄버거집을 홍보하는 알록달록한 배너입니다." },
  ],
  atm: [
    { id: "atm_device", name: "ATM 기기", emoji: "🏧", category: "essential", desc: "은행 카드를 넣고 스스로 현금을 찾거나 입금하는 기계예요." },
    { id: "wait_line", name: "안전 대기선", emoji: "🟡", category: "essential", desc: "앞 사람이 거래하는 동안 개인정보를 위해 노란 선 뒤에서 기다려요." },
    { id: "privacy_shield", name: "비밀번호 가림막", emoji: "🛡️", category: "essential", desc: "ATM 기기 옆에 설치해 비밀번호 누르는 것이 안 보이게 지켜줘요." },
    { id: "staff_desk", name: "안내 직원", emoji: "🧑‍💼", category: "deco", desc: "ATM 사용법을 모르거나 곤란할 때 친절하게 안내를 도와줘요." },
    { id: "cctv_sign", name: "CCTV 안전안내판", emoji: "📹", category: "safety", desc: "이곳은 카메라가 지키고 있는 안전지대임을 알려줘요." },
    { id: "ticket_machine", name: "번호표 기계", emoji: "🎟️", category: "essential", desc: "은행에 들어왔을 때 나의 순서 번호표를 뽑는 기기예요." },
    { id: "atm_poster", name: "금융 안전 포스터", emoji: "🖼️", category: "safety", desc: "'비밀번호를 남에게 알려주지 마세요' 경고 문구가 있어요." },
    { id: "water_dispenser", name: "은행 정수기", emoji: "🚰", category: "deco", desc: "목이 마를 때 시원한 물을 마실 수 있는 정수기예요." },
  ]
};

// ─── HELPER AUDIO ────────────────────────────────────────────────────────────

function playAudioTone(type: "click" | "success" | "fail" | "pop" | "sparkle") {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "pop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "sparkle") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "fail") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "success") {
      // Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        g.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + idx * 0.12);
        o.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    }
  } catch (e) {
    console.error("Audio Web API not supported or blocked", e);
  }
}

// ─── FIREWORKS EFFECT COMPONENT ──────────────────────────────────────────────────

function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      color: string;
      size: number;
      history: { x: number; y: number }[];

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.012 + 0.012;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.history = [];
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 5) {
          this.history.shift();
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.07; // gravity
        this.alpha -= this.decay;
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        // Draw trailing dots
        for (let i = 0; i < this.history.length; i++) {
          const pt = this.history[i];
          const ratio = (i + 1) / this.history.length;
          c.globalAlpha = this.alpha * ratio * 0.45;
          c.beginPath();
          c.arc(pt.x, pt.y, this.size * ratio, 0, Math.PI * 2);
          c.fillStyle = this.color;
          c.fill();
        }
        c.restore();

        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 8;
        c.shadowColor = this.color;
        c.fill();
        c.restore();
      }
    }

    class Firework {
      x: number;
      targetY: number;
      y: number;
      vy: number;
      color: string;
      particles: Particle[];
      exploded: boolean;

      constructor() {
        this.x = Math.random() * (width - 200) + 100;
        this.y = height;
        this.targetY = Math.random() * (height / 2.2) + 80;
        this.vy = - (Math.random() * 4 + 8);
        const hue = Math.floor(Math.random() * 360);
        this.color = `hsl(${hue}, 100%, 65%)`;
        this.particles = [];
        this.exploded = false;
      }

      update() {
        if (!this.exploded) {
          this.y += this.vy;
          this.vy += 0.05; // decelerate upward
          if (this.y <= this.targetY || this.vy >= 0) {
            this.explode();
          }
        } else {
          this.particles.forEach((p) => p.update());
          this.particles = this.particles.filter((p) => p.alpha > 0);
        }
      }

      explode() {
        this.exploded = true;
        playAudioTone("sparkle");
        for (let i = 0; i < 40; i++) {
          this.particles.push(new Particle(this.x, this.y, this.color));
        }
      }

      draw(c: CanvasRenderingContext2D) {
        if (!this.exploded) {
          c.beginPath();
          c.arc(this.x, this.y, 4, 0, Math.PI * 2);
          c.fillStyle = "#fff";
          c.shadowBlur = 10;
          c.shadowColor = this.color;
          c.fill();
        } else {
          this.particles.forEach((p) => p.draw(c));
        }
      }
    }

    let fireworks: Firework[] = [];

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < 0.06 && fireworks.length < 6) {
        fireworks.push(new Firework());
      }

      fireworks.forEach((fw) => {
        fw.update();
        fw.draw(ctx);
      });

      fireworks = fireworks.filter((fw) => !fw.exploded || fw.particles.length > 0);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[99] w-full h-full" />;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────

export default function WorkshopPage() {
  const [studentName, setStudentName] = useState("학생");
  const [view, setView] = useState<ViewState>("map");
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});
  
  // Active Mission State
  const [activeSpace, setActiveSpace] = useState<SpaceConfig | null>(null);
  
  // Pocket Selection State
  const [selectedPocketIds, setSelectedPocketIds] = useState<string[]>([]);
  
  // Decorator grid state (6 rows x 6 cols)
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [selectedDecorItem, setSelectedDecorItem] = useState<DecorItem | null>(null);
  const [decorActiveTab, setDecorActiveTab] = useState<"essential" | "safety" | "deco">("essential");
  const [advisorFeedback, setAdvisorFeedback] = useState<string | null>(null);

  // ── Required Decor Checklist ──
  const requiredChecklist = useMemo(() => {
    if (!activeSpace) return [];
    const placedItemIds = grid.map(c => c.itemId).filter(Boolean) as string[];
    
    return activeSpace.decorRequired.map(id => {
      const item = DECOR_ITEMS[activeSpace.id]?.find(x => x.id === id);
      const isPlaced = placedItemIds.includes(id);
      return {
        id,
        name: item?.name || id,
        emoji: item?.emoji || "📦",
        isPlaced
      };
    });
  }, [activeSpace, grid]);

  // Simulation State
  const [simStep, setSimStep] = useState(0);
  const [selectedSimOption, setSelectedSimOption] = useState<number | null>(null);
  const [simExplanation, setSimExplanation] = useState<string | null>(null);
  const [simCompleted, setSimCompleted] = useState(false);
  const [simActiveItem, setSimActiveItem] = useState<string | null>(null); // Pocket item being dragged/clicked in sim

  // Reporting & Scoring metrics (saved to report log)
  const [pocketFails, setPocketFails] = useState(0);
  const [decorFails, setDecorFails] = useState(0);
  const [simFails, setSimFails] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<ReportLog[]>([]);

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("haemileum_selected_student") || "해밀";
      setStudentName(name);
      
      const savedCompleted = localStorage.getItem("haemileum_workshop_completed");
      if (savedCompleted) {
        setCompletedMissions(JSON.parse(savedCompleted));
      }
      
      const reports = localStorage.getItem("haemileum_workshop_reports");
      if (reports) {
        setSavedReports(JSON.parse(reports));
      }
    }
    resetGrid();
  }, []);

  const resetGrid = () => {
    const initialGrid: GridCell[] = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        initialGrid.push({ row: r, col: c, itemId: null });
      }
    }
    setGrid(initialGrid);
  };

  // Sound triggers wrapped around clicks
  const triggerClickSound = () => playAudioTone("click");
  const triggerPopSound = () => playAudioTone("pop");

  // Lock status calculation
  // 0 completed -> only bus open
  // 1 completed (bus) -> kiosk opens
  // 2 completed (bus, kiosk) -> atm opens
  // 3 completed -> all 3 done
  const completedCount = [
    completedMissions.bus,
    completedMissions.kiosk,
    completedMissions.atm
  ].filter(Boolean).length;

  const isSpaceLocked = (spaceId: string) => {
    if (spaceId === "bus") return false;
    if (spaceId === "kiosk") return !completedMissions.bus;
    if (spaceId === "atm") return !completedMissions.kiosk;
    return true; // Mart, Hospital etc. are always locked (coming soon)
  };

  const handleSelectSpace = (space: SpaceConfig) => {
    triggerPopSound();
    if (isSpaceLocked(space.id)) return;
    setActiveSpace(space);
    setView("request");
    
    // Reset metrics
    setSelectedPocketIds([]);
    setPocketFails(0);
    setDecorFails(0);
    setSimFails(0);
    setMistakes([]);
    setAdvisorFeedback(null);
    setSelectedDecorItem(null);
    resetGrid();
    setSimStep(0);
    setSelectedSimOption(null);
    setSimExplanation(null);
    setSimCompleted(false);
    setSimActiveItem(null);
  };

  // ── POCKET SELECTION ─────────────────────────────────────────────────────────

  const handleTogglePocketItem = (itemId: string) => {
    triggerClickSound();
    if (selectedPocketIds.includes(itemId)) {
      setSelectedPocketIds(prev => prev.filter(id => id !== itemId));
    } else {
      if (selectedPocketIds.length >= 4) {
        setAdvisorFeedback("주머니에는 물건을 최대 4개까지만 담을 수 있어요!");
        playAudioTone("fail");
        setTimeout(() => setAdvisorFeedback(null), 2000);
        return;
      }
      setSelectedPocketIds(prev => [...prev, itemId]);
    }
  };

  const handleVerifyPocket = () => {
    if (!activeSpace) return;
    
    const required = activeSpace.requiredItems;
    const hasAll = required.every(id => selectedPocketIds.includes(id));
    
    // Check if player packed junk (like a video game)
    const hasJunk = selectedPocketIds.includes("nintendo");
    
    // For bus, using credit card instead of bus card is bad
    const hasWrongCard = activeSpace.id === "bus" && selectedPocketIds.includes("payment_card") && !selectedPocketIds.includes("bus_card");
    const hasWrongAtmCard = activeSpace.id === "atm" && selectedPocketIds.includes("payment_card") && !selectedPocketIds.includes("bank_card");

    if (hasAll && !hasJunk && !hasWrongCard && !hasWrongAtmCard) {
      playAudioTone("success");
      setAdvisorFeedback(null);
      setView("decor");
    } else {
      playAudioTone("fail");
      setPocketFails(prev => prev + 1);
      
      let msg = "";
      if (hasJunk) {
        msg = "주머니에 게임기가 들어있어 자립 활동에 방해가 될 수 있어요. 게임기는 빼고 출발할까요?";
        setMistakes(prev => [...prev, "가방에 자립에 불필요한 물품(게임기)을 챙김"]);
      } else if (hasWrongCard) {
        msg = "이 카드는 가게에서 물건을 살 때 쓰는 신용카드예요! 버스를 탈 때는 교통카드를 골라보세요.";
        setMistakes(prev => [...prev, "버스 미션 출발에 신용카드를 선택함"]);
      } else if (hasWrongAtmCard) {
        msg = "이 카드는 신용카드예요. 은행 ATM 기기에서는 통장과 연계된 현금카드가 필요해요.";
        setMistakes(prev => [...prev, "은행 ATM 미션에 신용카드를 선택함"]);
      } else {
        msg = `${getCharText(activeSpace.charName, "가")} 요청한 자립 행동에 꼭 필요한 핵심 물건들이 빠져 있는 것 같아요. 힌트를 생각해보며 다시 챙겨볼까요?`;
        setMistakes(prev => [...prev, "미션 수행에 필요한 필수 단서 물품을 챙기지 못함"]);
      }
      setAdvisorFeedback(msg);
    }
  };

  // ── DECORATOR GRID ──────────────────────────────────────────────────────────

  const handleGridCellClick = (row: number, col: number) => {
    if (!selectedDecorItem) {
      // If cell has item, remove it
      setGrid(prev => prev.map(cell => {
        if (cell.row === row && cell.col === col && cell.itemId !== null) {
          triggerClickSound();
          return { ...cell, itemId: null };
        }
        return cell;
      }));
      return;
    }
    
    // Place item
    triggerPopSound();
    setGrid(prev => prev.map(cell => {
      if (cell.row === row && cell.col === col) {
        return { ...cell, itemId: selectedDecorItem.id };
      }
      return cell;
    }));
  };

  const handleVerifyDecor = () => {
    if (!activeSpace) return;
    
    const placedItemIds = grid.map(c => c.itemId).filter(Boolean) as string[];
    const required = activeSpace.decorRequired;
    const missing = required.filter(id => !placedItemIds.includes(id));
    
    if (missing.length > 0) {
      playAudioTone("fail");
      setDecorFails(prev => prev + 1);
      
      const missingNames = missing.map(id => {
        const item = DECOR_ITEMS[activeSpace.id].find(x => x.id === id);
        return item ? item.name : id;
      });
      
      setAdvisorFeedback(`공간에 꼭 있어야 할 물건이 빠져 있어요: [${missingNames.join(", ")}]. 필수 아이템 탭에서 찾아서 배치해 보세요.`);
      setMistakes(prev => [...prev, `공간 필수 배치 요소 누락: ${missingNames.join(", ")}`]);
      return;
    }

    // Safety and Placement rules checks
    if (activeSpace.id === "bus") {
      // Find coordinates of route_map, bus_info, safety_line
      const safetyLineCells = grid.filter(c => c.itemId === "safety_line");
      const infoCells = grid.filter(c => c.itemId === "bus_info" || c.itemId === "route_map");
      
      // Check if info/map are too far from safety line (e.g. distance > 2 cells)
      let tooFar = false;
      if (safetyLineCells.length > 0 && infoCells.length > 0) {
        infoCells.forEach(ic => {
          const distances = safetyLineCells.map(sc => Math.abs(sc.row - ic.row) + Math.abs(sc.col - ic.col));
          const minDist = Math.min(...distances);
          if (minDist > 2) tooFar = true;
        });
      }
      
      if (tooFar) {
        playAudioTone("fail");
        setDecorFails(prev => prev + 1);
        setAdvisorFeedback("버스도착 안내판이나 노선도가 대기선이나 정류장 중심부에서 너무 먼 곳에 설치되었어요. 버스를 기다리는 이음이가 보기 쉬운 위치로 옮겨볼까요?");
        setMistakes(prev => [...prev, "안내판을 너무 멀리 배치하여 정보 접근성 떨어짐"]);
        return;
      }
    }

    if (activeSpace.id === "atm") {
      // privacy_shield must be adjacent to atm_device
      const atmCell = grid.find(c => c.itemId === "atm_device");
      const shieldCell = grid.find(c => c.itemId === "privacy_shield");
      
      if (atmCell && shieldCell) {
        const dist = Math.abs(atmCell.row - shieldCell.row) + Math.abs(atmCell.col - shieldCell.col);
        if (dist > 1) {
          playAudioTone("fail");
          setDecorFails(prev => prev + 1);
          setAdvisorFeedback("비밀번호 가림막이 ATM 기기에서 멀리 떨어져 있으면 뒤에 서 있는 다른 사람이 비밀번호를 보기 쉬워져요! ATM 기기 바로 옆 칸에 바짝 붙여주세요.");
          setMistakes(prev => [...prev, "비밀번호 가림막을 ATM 기기와 이격 배치하여 보안 취약"]);
          return;
        }
      }
    }

    // Pass
    playAudioTone("success");
    setAdvisorFeedback(null);
    setView("sim");
  };

  // ── SIMULATION ──────────────────────────────────────────────────────────────

  const getSimStepData = () => {
    if (!activeSpace) return null;
    
    if (activeSpace.id === "bus") {
      return [
        {
          question: "이음이가 버스를 탈 때 가장 먼저 봐야 하는 중요한 정보는 무엇일까요?",
          options: [
            { text: "버스의 겉면 색깔", correct: false, feedback: "아니에요. 버스 색깔은 다른 노선과 비슷할 수 있어 헷갈릴 수 있어요. 가장 정확한 걸 고르세요." },
            { text: "버스 앞부분의 노선 번호와 목적지 안내문", correct: true, feedback: "정답이에요! 버스를 타기 전에는 노선 번호(45번)와 전광판의 최종 목적지 방향을 꼭 눈으로 짚어가며 확인해야 해요." },
            { text: "버스 안에 타고 있는 손님의 수", correct: false, feedback: "아니에요. 버스 안에 사람이 많고 적음은 내가 가야 할 방향과는 전혀 무관해요. 다시 번호를 살펴보세요." }
          ]
        },
        {
          question: "기다리던 45번 버스가 내 앞에 도착해 문이 열렸어요. 이제 가방에서 카드를 꺼내 찍고 탑승해야 해요. 어떻게 할까요?",
          options: [
            { text: "카드는 자리에 앉아서 나중에 찍기로 하고, 빈자리로 먼저 달려간다.", correct: false, feedback: "아니에요. 버스에서는 타자마자 교통카드를 단말기에 찍는 것이 올바른 매너이며, 급하게 자리에 뛰어가면 넘어질 수 있어요." },
            { text: "가방에서 교통카드를 미리 꺼내 들고 탑승하여 요금 단말기에 '삐' 소리가 나도록 찍는다.", correct: true, feedback: "정답이에요! 버스에 오르기 전 교통카드를 손에 쥐어두고, 승차 단말기에 카드를 정확히 대는 습관이 필요합니다." }
          ]
        },
        {
          question: "버스가 출발해서 움직이기 시작했어요. 자리는 모두 꽉 차서 빈 곳이 없네요. 이음이는 어떻게 행동해야 안전할까요?",
          options: [
            { text: "버스 안 통로에 그냥 서서 스마트폰 게임을 열중해서 한다.", correct: false, feedback: "매우 위험해요! 버스가 급정거하면 손잡이를 잡지 않았을 때 앞으로 튕겨 크게 다칠 수 있어요." },
            { text: "안전 기둥을 꽉 잡거나 좌석에 매달린 손잡이를 양손으로 꼭 움켜잡는다.", correct: true, feedback: "정답이에요! 자리가 없을 때는 차가 멈출 때까지 기둥이나 손잡이를 든든히 잡고 버텨야 안전합니다." },
            { text: "흔들리는 버스가 재미있어서 버스 안을 이리저리 걸어 다니며 장난친다.", correct: false, feedback: "절대로 안 돼요! 급제동 시 차량 내부 충돌 사고가 날 수 있습니다. 안전한 자리를 잡고 서세요." }
          ]
        },
        {
          question: "이제 내가 내릴 '시청 앞' 정류장의 안내 방송이 스피커로 나오고 있어요. 이음이는 내릴 준비를 어떻게 시작해야 할까요?",
          options: [
            { text: "안내 방송이 나오자마자 버스가 달리는 도중에 문 앞으로 뛰어가서 기다린다.", correct: false, feedback: "위험해요! 버스가 완전히 멈추기 전에 일어서서 걷는 행동은 크게 흔들려 다칠 수 있습니다." },
            { text: "내린다는 신호로 근처에 있는 '하차벨'을 누르고, 버스가 완전히 정류장에 멈춘 다음 차례대로 내린다.", correct: true, feedback: "정답입니다! 미리 벨을 눌러 운전기사님께 알리고, 차가 멈추어 문이 열렸을 때 안전하게 하차합니다." }
          ]
        }
      ][simStep];
    }

    if (activeSpace.id === "kiosk") {
      return [
        {
          question: "햄버거 주문을 위해 키오스크 기기 앞에 섰어요. 주문을 시작하려면 화면의 어느 곳을 터치해야 할까요?",
          options: [
            { text: "화면 아래의 빈 공간 테두리 플라스틱을 두드린다.", correct: false, feedback: "기기 테두리는 터치가 안 돼요. 화면 중앙의 밝은 주문 시작 버튼을 확인해보세요." },
            { text: "화면 중앙의 '주문하기' 또는 햄버거 세트 그림을 손가락으로 가볍게 터치한다.", correct: true, feedback: "정답이에요! 키오스크의 첫 화면에서는 '화면을 터치해 주세요' 또는 큰 그림을 눌러 주문 프로세스를 시작합니다." }
          ]
        },
        {
          question: "더블 치즈버거 단품이 아니라 🍟감자튀김과 🥤음료가 포함된 '더블 치즈버거 세트'를 먹고 싶어요. 어떻게 골라야 할까요?",
          options: [
            { text: "치즈버거 단품을 고르고 주문을 끝낸 뒤, 나중에 다시 감자튀김을 따로 하나 더 산다.", correct: false, feedback: "그렇게 하면 돈이 더 많이 들거나 두 번 계산해야 해요. 한 번에 세트로 묶여 있는 옵션을 선택해봐요." },
            { text: "햄버거 이미지를 클릭한 후 나오는 추가 선택 옵션 창에서 '세트 메뉴 추가하기'를 누르고 원하는 음료를 선택한다.", correct: true, feedback: "정답이에요! 세트를 선택하면 음료와 사이드 메뉴를 골라 담을 수 있는 맞춤형 팝업이 뜹니다. 차분히 읽어보세요." }
          ]
        },
        {
          question: "메뉴를 모두 담았더니 8,500원 결제 화면이 나왔어요. 가방(주머니)에서 어떤 지불 수단을 꺼내서 결제기(슬롯)에 꽂아야 할까요?",
          options: [
            { text: "교통카드를 꺼내서 카드 결제기 투입구에 힘껏 밀어 넣는다.", correct: false, feedback: "아니에요. 일반 가게의 키오스크 결제는 교통카드가 아닌 '신용카드(체크카드)'나 모바일 페이가 쓰입니다." },
            { text: "신용카드(체크카드)를 꺼내서 IC칩이 있는 앞면이 기기 안쪽을 향하도록 투입구에 부드럽게 꽂는다.", correct: true, feedback: "정답입니다! 카드의 금색 IC칩 부위가 단말기 삽입 방향을 향하도록 하여 끝까지 넣어줘야 결제가 인식됩니다." }
          ]
        },
        {
          question: "결제가 끝나고 영수증과 함께 대기 번호표가 나왔어요. 이제 음식을 어디서 어떻게 기다려야 하나요?",
          options: [
            { text: "픽업대 바로 앞에 서서 내 버거가 나오는지 주방 안을 바짝 쳐다보며 소리친다.", correct: false, feedback: "그것은 매장 직원분들과 다른 대기 손님들에게 폐를 끼쳐요. 조금 떨어져서 모니터를 지켜보세요." },
            { text: "안내 번호 화면에 내 번호(예: 105번)가 나오는지 보거나, 호출 소리를 들으며 대기석 부근에서 차분히 기다린 뒤 받으러 간다.", correct: true, feedback: "정답입니다! 매장 내 번호 스크린에 내 영수증 속 번호가 활성화되면 픽업대로 이동하여 정중하게 음식을 받아옵니다." }
          ]
        },
        {
          question: "맛있게 햄버거를 다 먹었어요. 식사한 쟁반 위에는 종이 상자, 빨대, 얼음물이 조금 남은 플라스틱 컵이 있네요. 정리는 어떻게 해야 할까요?",
          options: [
            { text: "쟁반을 그대로 테이블 위에 놔두고 가게 밖으로 걸어 나간다.", correct: false, feedback: "셀프 매장에서는 식사한 자리를 깨끗이 정리하고 쓰레기를 직접 버리는 것이 올바른 예절이에요." },
            { text: "남은 얼음물은 퇴수구에 버리고, 빨대와 종이는 각각 일반쓰레기 및 종이 분리함에 맞추어 깔끔하게 나누어 버린다.", correct: true, feedback: "정답입니다! 컵 속 내용물을 분리수거대에 따로 비우고 플라스틱과 일반쓰레기를 분리하여 깨끗하게 자리를 비워줍니다." }
          ]
        }
      ][simStep];
    }

    if (activeSpace.id === "atm") {
      return [
        {
          question: "은행 안에 도착했어요. ATM 기기 앞에 여러 사람이 줄을 서 있네요. 가장 먼저 어떤 순서 행동을 해야 할까요?",
          options: [
            { text: "줄이 너무 지루하므로 맨 앞으로 끼어들어 기계를 만져본다.", correct: false, feedback: "다른 고객의 금융 거래를 방해하고 새치기하는 것은 예의에 어긋나요. 내 순서 번호를 뽑아야 해요." },
            { text: "은행 입구에 있는 번호표 발행기에서 순서표를 터치해 뽑고, 의자나 안전 대기선 근처에서 조용히 내 번호를 기다린다.", correct: true, feedback: "정답입니다! 번호표를 수령해 내 대기 순서를 확보하고 편히 기다립니다." }
          ]
        },
        {
          question: "내 차례가 되어 ATM 화면 앞에 섰어요. 현금을 5만 원 출금하고 싶습니다. 어떤 흐름으로 카드를 삽입해야 할까요?",
          options: [
            { text: "기계 출금 투입구에 손을 넣고 흔든다.", correct: false, feedback: "위험하고 올바르지 않은 행동입니다. 우선 카드를 기계 카드 입구에 방향을 확인하고 꽂아 넣으세요." },
            { text: "가방 속 은행 현금카드를 꺼내어 화면 지시에 따라 카드 입구에 꽂은 뒤, 화면의 '예금 출금' 메뉴를 터치한다.", correct: true, feedback: "정답입니다! 카드를 먼저 투입구에 넣으면 기계가 읽은 뒤 원하는 은행 거래를 선택할 수 있게 화면을 전환합니다." }
          ]
        },
        {
          question: "화면에 비밀번호 4자리를 누르라는 키패드 안내가 떴어요. 이때 뒤에 모르는 사람이 서성이고 있습니다. 어떻게 눌러야 내 비밀번호를 안전하게 지킬 수 있을까요?",
          options: [
            { text: "비밀번호 숫자 네 자리를 다른 사람도 알 수 있게 손가락을 넓게 벌려 빠르게 누른다.", correct: false, feedback: "개인 정보가 타인에게 노출되면 계좌의 돈이 도난당할 위험이 큽니다. 가리는 행동을 선택해 보세요." },
            { text: "한 손으로는 키패드 윗부분을 둥글게 지붕처럼 가려 보이지 않게 하고, 설치된 비밀번호 가림막 안쪽에서 안전하게 비밀번호를 입력한다.", correct: true, feedback: "정답입니다! 모르는 사람이 내 카드의 비밀번호를 보지 못하도록 키패드를 몸이나 다른 손으로 은근히 가리고 누르는 것이 최고의 예방입니다." }
          ]
        },
        {
          question: "돈과 거래 명세표가 기계 투입구에서 나왔습니다. 거래를 마친 뒤 마무리는 어떻게 해야 할까요?",
          options: [
            { text: "기분 좋게 현금 지폐만 집어 들고, 카드는 꽂아둔 채로 자리를 떠난다.", correct: false, feedback: "큰일 나요! 카드를 그냥 꽂아두면 다음 사람이 카드를 가져가거나 범죄에 악용될 수 있어요." },
            { text: "기계 화면에서 '카드와 현금을 잊지 마세요' 안내음이 나오는 동안, 내 현금과 통장/카드를 반드시 전부 회수하여 지갑에 깊숙이 넣고 확인한다.", correct: true, feedback: "정답입니다! 돈뿐만 아니라 내 현금카드까지 완전히 손으로 뽑아 회수한 뒤에야 자리를 옮기는 것이 자립의 마지막 단계입니다." }
          ]
        }
      ][simStep];
    }

    return null;
  };

  const handleSimOptionClick = (idx: number) => {
    triggerClickSound();
    setSelectedSimOption(idx);
    const stepData = getSimStepData();
    if (!stepData || !activeSpace) return;
    
    const option = stepData.options[idx];
    setSimExplanation(option.feedback);
    
    if (option.correct) {
      playAudioTone("success");
    } else {
      playAudioTone("fail");
      setSimFails(prev => prev + 1);
      setMistakes(prev => [...prev, `${activeSpace.name} 시뮬레이션 중 오류 선택: ${option.text}`]);
    }
  };

  const handleNextSimStep = () => {
    triggerPopSound();
    if (!activeSpace) return;
    
    const stepsCount = activeSpace.id === "bus" ? 4 : activeSpace.id === "kiosk" ? 5 : 4;
    
    if (simStep < stepsCount - 1) {
      setSimStep(prev => prev + 1);
      setSelectedSimOption(null);
      setSimExplanation(null);
    } else {
      // Completed the entire simulation
      handleCompleteMission();
    }
  };

  const handleCompleteMission = () => {
    if (!activeSpace) return;
    playAudioTone("success");
    
    // Save completion to LocalStorage
    const updatedCompleted = { ...completedMissions, [activeSpace.id]: true };
    setCompletedMissions(updatedCompleted);
    if (typeof window !== "undefined") {
      localStorage.setItem("haemileum_workshop_completed", JSON.stringify(updatedCompleted));
      
      // Save Report Log
      const newReport: ReportLog = {
        spaceId: activeSpace.id,
        spaceName: activeSpace.name,
        completedAt: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        pocketFails,
        decorFails,
        simFails,
        mistakes: mistakes.filter((v, i, a) => a.indexOf(v) === i), // deduplicate
      };
      
      const newReports = [newReport, ...savedReports];
      setSavedReports(newReports);
      localStorage.setItem("haemileum_workshop_reports", JSON.stringify(newReports));
    }
    
    setView("success");
  };

  const handleReturnToMap = () => {
    triggerPopSound();
    setView("map");
    setActiveSpace(null);
  };

  // Report clearing (for debugging)
  const handleClearReports = () => {
    triggerClickSound();
    if (confirm("모든 자립공방 미션과 리포트 데이터를 초기화하시겠습니까?")) {
      setCompletedMissions({});
      setSavedReports([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("haemileum_workshop_completed");
        localStorage.removeItem("haemileum_workshop_reports");
      }
      playAudioTone("success");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/60 to-emerald-50/60 py-8 px-4 font-sans select-none relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-44 h-44 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="mx-auto max-w-5xl bg-white/85 backdrop-blur-md border border-white/50 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 transition-all duration-300">
        
        {/* Header Header Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-emerald-100 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🛠️</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                {studentName}이의 자립공방
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">
                공간을 직접 예쁘게 꾸미고 안전한 생활을 연습하는 자립 놀이터
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { triggerPopSound(); setView("report"); }}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-md transition flex items-center gap-1.5"
            >
              📊 교사/보호자 리포트
            </button>
            <Link
              href="/village"
              onClick={triggerClickSound}
              className="bg-slate-500 hover:bg-slate-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-md transition flex items-center gap-1"
            >
              🐾 해밀마을 가기
            </Link>
          </div>
        </div>

        {/* ── VIEW 1. MAP VIEW (마을 지도) ─────────────────────────────────── */}
        {view === "map" && (
          <div>
            {/* Completion Banner */}
            <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">🌟 해밀 자립마을 확장 상태 ({completedCount} / 3)</h2>
                <p className="text-xs text-emerald-55 opacity-90 font-bold mt-1">
                  생활 자립 미션을 통과할수록 더 많고 신나는 공간들이 확장됩니다!
                </p>
              </div>
              <div className="text-2xl font-black bg-white/20 px-3 py-1.5 rounded-xl">
                Lv. {completedCount + 1}
              </div>
            </div>

            <div className="bg-[#e2f0d9] border-4 border-[#89ab74] rounded-3xl p-4 sm:p-6 shadow-inner relative min-h-[460px] overflow-hidden flex flex-col justify-between">
              {/* Grid Decorative Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#89ab7420_1px,transparent_1px),linear-gradient(to_bottom,#89ab7420_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

              {/* Map Title */}
              <div className="relative z-10 bg-[#7ba85a] border-2 border-[#fff] text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-md w-max mx-auto mb-6 flex items-center gap-1">
                <span>🗺️</span> 해밀 자립마을 생활 지도 (터치하여 진입)
              </div>

              {/* Grid Buildings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 flex-1 content-center">
                {SPACES.map((space) => {
                  const locked = isSpaceLocked(space.id);
                  const done = completedMissions[space.id];
                  
                  return (
                    <button
                      key={space.id}
                      onClick={() => handleSelectSpace(space)}
                      disabled={locked}
                      className={`relative overflow-hidden group flex flex-col items-center justify-between p-4 bg-white/95 rounded-2xl border-4 shadow-md transition-all duration-300 ${
                        locked
                          ? "border-slate-300 opacity-60 cursor-not-allowed bg-slate-100"
                          : done
                          ? "border-amber-400 hover:-translate-y-1 hover:shadow-lg hover:border-amber-500"
                          : "border-emerald-500 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-600 animate-pulse-soft"
                      }`}
                    >
                      {/* Ribbon / Status Badge */}
                      {done && (
                        <div className="absolute top-1 right-1 bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          ⭐ 완료
                        </div>
                      )}
                      {locked && (
                        <div className="absolute top-1 right-1 bg-slate-400 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          🔒 잠김
                        </div>
                      )}

                      <span className="text-5xl my-3 transform group-hover:scale-110 transition duration-300">
                        {space.emoji}
                      </span>
                      
                      <div className="w-full text-center mt-2">
                        <span className="block text-xs font-black text-slate-800 group-hover:text-emerald-800 transition">
                          {space.name}
                        </span>
                        
                        {/* Difficulty Indicator */}
                        {!locked ? (
                          <div className="mt-2 flex items-center justify-center gap-1">
                            <span className="text-[9px] font-black text-slate-400">난이도:</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              space.difficulty === "쉬움" ? "bg-emerald-100 text-emerald-700" :
                              space.difficulty === "보통" ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>
                              {space.difficulty}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 block mt-1.5">
                            {space.id === "mart" && "버스 미션 완료 후"}
                            {space.id === "hospital" && "햄버거 미션 완료 후"}
                            {space.id === "library" && "은행 미션 완료 후"}
                            {["mart", "hospital", "library", "classroom", "town_hall"].includes(space.id) === false && "잠겨있음"}
                            {["mart", "hospital", "library", "classroom", "town_hall"].includes(space.id) && "업데이트 대기중"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Map Footer Tip */}
              <div className="relative z-10 text-center text-[10px] sm:text-xs text-[#597843] font-bold mt-6">
                💡 반짝이는 공간을 눌러 주민들의 생활 고민을 듣고, 안전한 공간을 직접 꾸며주세요!
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 2. CHARACTER REQUEST VIEW (캐릭터 의뢰 카드) ───────────────── */}
        {view === "request" && activeSpace && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            {/* NPC Mascot Illustration Area */}
            <div className="w-40 h-40 bg-white border-4 border-emerald-400 rounded-full flex items-center justify-center shadow-lg relative shrink-0">
              <img src="/assets/helper/ieumi.png" alt="이음이" className="w-28 h-28 object-contain" />
              <div className="absolute -bottom-2 bg-emerald-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                {activeSpace.charName}
              </div>
            </div>

            {/* Request Details */}
            <div className="flex-1 flex flex-col justify-between h-full text-center md:text-left">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-1 rounded-full">
                    의뢰 도착 💌
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    난이도: {activeSpace.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-emerald-800 mb-4">
                  “{activeSpace.name} 꾸미기 의뢰”
                </h2>
                
                {/* Speech Bubble */}
                <div className="relative bg-white border-2 border-emerald-300 p-5 rounded-2xl shadow-sm text-slate-700 text-sm sm:text-base leading-relaxed font-bold">
                  <div className="absolute top-4 -left-2.5 w-4 h-4 bg-white border-l-2 border-b-2 border-emerald-300 transform rotate-45 hidden md:block" />
                  {activeSpace.requestText}
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-3 mt-6">
                <button
                  onClick={handleReturnToMap}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-6 py-3 rounded-full text-sm sm:text-base shadow active:scale-95 transition"
                >
                  지도로 돌아가기
                </button>
                <button
                  onClick={() => { triggerPopSound(); setView("pocket"); }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3 rounded-full text-sm sm:text-base shadow-lg active:scale-95 hover:scale-103 transition flex items-center gap-1.5"
                >
                  도와줄래! 🎒
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 3. POCKET SELECTION VIEW (가방 챙기기) ────────────────────── */}
        {view === "pocket" && activeSpace && (
          <div className="bg-amber-50/50 border-2 border-amber-200 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black text-amber-800 mb-2 flex items-center gap-2">
              <span>🎒</span> 미션 출발 준비: 이음이의 주머니 챙기기
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold mb-6">
              {getCharText(activeSpace.charName, "의")} 고민 상황을 겪을 때 꼭 필요한 **핵심 준비물**을 주머니(최대 4개)에 골라 담아보세요.
            </p>

            {/* Hint Box */}
            <div className="mb-6 bg-white border-2 border-amber-300/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-900">해밀이의 주머니 힌트:</h4>
                <p className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
                  {activeSpace.id === "bus" && "버스를 타고 요금을 계산하며, 비상시 연락을 취할 수 있는 물품들을 골라보세요!"}
                  {activeSpace.id === "kiosk" && "햄버거 가게 등 상점에서 키오스크의 음식 가격을 결제할 수 있는 수단이 있어야 해요."}
                  {activeSpace.id === "atm" && "은행 ATM기에서 돈을 거래하려면 계좌 정보가 든 매체가 필수적으로 필요합니다."}
                </p>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {POCKET_ITEM_POOL.map((item) => {
                const isSelected = selectedPocketIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTogglePocketItem(item.id)}
                    className={`group relative flex flex-col items-center justify-between p-4 rounded-2xl border-4 transition shadow-sm ${
                      isSelected
                        ? "bg-amber-100/90 border-amber-500 scale-103 shadow-md"
                        : "bg-white border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {/* Selected Check icon */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shadow-sm">
                        ✓
                      </div>
                    )}
                    <span className="text-4xl my-2 group-hover:animate-bounce">{item.emoji}</span>
                    <div className="text-center w-full mt-2">
                      <span className="block text-xs font-black text-slate-800">{item.name}</span>
                      <span className="block text-[9px] text-slate-400 font-bold mt-1 leading-tight">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bag status HUD */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700">👜 내 주머니 상태:</span>
                <span className="text-xs text-slate-500 font-bold">({selectedPocketIds.length} / 4 개 선택됨)</span>
              </div>
              <div className="flex gap-2">
                {selectedPocketIds.length === 0 ? (
                  <span className="text-xs font-bold text-slate-400 italic">주머니가 비어 있습니다. 아이템을 터치해 넣으세요.</span>
                ) : (
                  selectedPocketIds.map(id => {
                    const item = POCKET_ITEM_POOL.find(x => x.id === id);
                    return item ? (
                      <div key={id} className="bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                        <span>{item.emoji}</span> {item.name}
                      </div>
                    ) : null;
                  })
                )}
              </div>
            </div>

            {/* Feedback Message */}
            {advisorFeedback && (
              <div className="mb-6 bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold p-3.5 rounded-xl flex items-center gap-2 animate-bounce">
                <span>⚠️</span> {advisorFeedback}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-3">
              <button
                onClick={() => { triggerPopSound(); setView("request"); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-6 py-2.5 rounded-full text-sm shadow active:scale-95 transition"
              >
                뒤로 가기
              </button>
              <button
                onClick={handleVerifyPocket}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-3 rounded-full text-sm sm:text-base shadow-lg active:scale-95 transition"
              >
                주머니 싸고 출발하기 🚀
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 4. DECORATOR VIEW (공간 꾸미기) ───────────────────────────── */}
        {view === "decor" && activeSpace && (
          <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-3xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-black text-emerald-800 mb-1 flex items-center gap-2">
              <span>🏡</span> {activeSpace.name} 꾸미기
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-4">
              오른쪽 아래 아이템 리스트에서 물건을 선택하고, 왼쪽 모눈종이 판의 칸을 터치해 배치하세요. 필수 품목은 꼭 배치해야 해요!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Left Side: 6x6 placement grid */}
              <div className="md:col-span-7 flex flex-col justify-center items-center bg-[#b8d4b3]/60 border-4 border-[#769b70] rounded-2xl p-4 relative shadow-inner">
                {/* Visual Label */}
                <div className="absolute top-2 left-2 bg-[#769b70] text-white px-2 py-0.5 rounded-lg text-[9px] font-black z-10 shadow-sm">
                  배치용 모눈격자
                </div>

                {/* Step-by-step UI/UX Guide Banner */}
                <div className={`w-full max-w-[340px] px-3 py-2.5 rounded-2xl border text-center text-xs font-black mb-3.5 transition shadow-sm select-none ${
                  selectedDecorItem
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 animate-pulse"
                    : "bg-orange-50 border-orange-200 text-orange-800 animate-pulse"
                }`} style={{ animationDuration: selectedDecorItem ? '2s' : '3.5s' }}>
                  {selectedDecorItem ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="animate-bounce text-sm">👇</span>
                      <span><b>2단계:</b> 격자에서 원하는 칸을 눌러 <b>[{selectedDecorItem.emoji} {selectedDecorItem.name}]</b>를 배치하세요!</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="text-sm">👉</span>
                      <span><b>1단계:</b> 오른쪽에 있는 가구 리스트에서 배치할 물건을 먼저 선택하세요!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-1.5 w-full aspect-square max-w-[340px] bg-emerald-50 border border-emerald-200/50 p-2 rounded-xl">
                  {grid.map((cell, idx) => {
                    const item = cell.itemId ? DECOR_ITEMS[activeSpace.id].find(x => x.id === cell.itemId) : null;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleGridCellClick(cell.row, cell.col)}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition relative ${
                          item
                            ? "bg-white border-emerald-400 shadow-sm hover:bg-slate-50"
                            : selectedDecorItem
                            ? "bg-amber-50/50 border-dashed border-amber-300 hover:bg-amber-100/60 ring-2 ring-amber-300/30"
                            : "bg-emerald-100/30 border-dashed border-emerald-300/60 hover:bg-emerald-100/60"
                        }`}
                      >
                        {item ? (
                          <>
                            <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                            <span className="text-[7px] font-black text-[#566c3e] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                              {item.name}
                            </span>
                          </>
                        ) : selectedDecorItem ? (
                          <div className="flex flex-col items-center justify-center opacity-40 animate-pulse">
                            <span className="text-xl sm:text-2xl">{selectedDecorItem.emoji}</span>
                            <span className="text-[6px] font-black text-amber-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                              여기에 배치
                            </span>
                          </div>
                        ) : (
                          <span className="text-[14px] text-emerald-300 font-bold opacity-30">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Grid utility tips */}
                <div className="mt-3 flex gap-2 justify-center text-[9px] text-[#597843] font-bold">
                  <span>✓ 배치된 아이템을 터치하면 제거됩니다.</span>
                  <span>✓ 격자가 차면 다음 단계로 이동 가능합니다.</span>
                </div>
              </div>

              {/* Right Side: Tabbed item lists */}
              <div className="md:col-span-5 flex flex-col justify-between bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-sm min-h-[360px]">
                <div>
                  {/* Required Goal checklist bar */}
                  <div className="mb-3.5 bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                    <h4 className="text-[10px] sm:text-xs font-black text-amber-900 mb-1.5 flex items-center gap-1">
                      🎯 꼭 배치해야 할 가구 ({requiredChecklist.filter(x => x.isPlaced).length} / {requiredChecklist.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {requiredChecklist.map(req => (
                        <div
                          key={req.id}
                          className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 transition ${
                            req.isPlaced
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : "bg-slate-100 border-slate-200 text-slate-400"
                          }`}
                        >
                          <span>{req.isPlaced ? "✅" : req.emoji}</span>
                          <span>{req.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex gap-1.5 border-b border-slate-100 pb-2 mb-3">
                    {(["essential", "safety", "deco"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { triggerClickSound(); setDecorActiveTab(tab); }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition ${
                          decorActiveTab === tab
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {tab === "essential" && "⭐ 필수 가구"}
                        {tab === "safety" && "🟡 안전 장치"}
                        {tab === "deco" && "🪴 예쁜 꾸미기"}
                      </button>
                    ))}
                  </div>

                  {/* Items catalog */}
                  <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                    {DECOR_ITEMS[activeSpace.id]
                      .filter(item => item.category === decorActiveTab)
                      .map((item) => {
                        const isSelected = selectedDecorItem?.id === item.id;
                        const isPlaced = grid.some(c => c.itemId === item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => { triggerClickSound(); setSelectedDecorItem(item); }}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition relative ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                                : "bg-white border-slate-100 hover:border-emerald-300"
                            }`}
                          >
                            {isPlaced && (
                              <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[7px] font-black px-1 rounded-full shadow-sm">
                                ✓ 설치됨
                              </span>
                            )}
                            <span className="text-2xl shrink-0">{item.emoji}</span>
                            <div className="overflow-hidden">
                              <span className="block text-[10px] font-black text-slate-800 leading-tight">
                                {item.name}
                              </span>
                              <span className="block text-[7px] text-slate-400 font-bold mt-0.5 leading-none">
                                {decorActiveTab === "essential" && "필수 배치!"}
                                {decorActiveTab === "safety" && "안전 필수!"}
                                {decorActiveTab === "deco" && "데코 아이템"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Selected Item Description Card */}
                  {selectedDecorItem && (
                    <div className="mt-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{selectedDecorItem.emoji}</span>
                        <h4 className="text-xs font-black text-emerald-900">{selectedDecorItem.name}</h4>
                      </div>
                      <p className="text-[9px] text-emerald-800 font-bold mt-1 leading-relaxed">
                        {selectedDecorItem.desc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cancel selection button */}
                {selectedDecorItem && (
                  <button
                    onClick={() => { triggerClickSound(); setSelectedDecorItem(null); }}
                    className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] py-1.5 rounded-lg transition"
                  >
                    선택 취소 (배치된 가구 지우기 모드)
                  </button>
                )}
              </div>
            </div>

            {/* Error Advisor Box */}
            {advisorFeedback && (
              <div className="mt-6 bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold p-3.5 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {advisorFeedback}
              </div>
            )}

            {/* Bottom Panel Actions */}
            <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
              <button
                onClick={() => { triggerPopSound(); setView("pocket"); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-6 py-2.5 rounded-full text-xs shadow active:scale-95 transition"
              >
                이전 (주머니 챙기기)
              </button>

              <div className="flex items-center gap-2.5">
                {/* Placed status tracker */}
                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  필수 아이템 설치 상태:{" "}
                  <span className="font-black text-emerald-700">
                    {grid.map(c => c.itemId).filter(id => activeSpace.decorRequired.includes(id || "")).filter((v, i, a) => a.indexOf(v) === i).length}
                  </span>{" "}
                  / {activeSpace.decorRequired.length}
                </div>
                
                <button
                  onClick={handleVerifyDecor}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3 rounded-full text-sm shadow-lg active:scale-95 transition"
                >
                  꾸미기 완성! 미션하기 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 5. 생활 미션 실행 (Interactive Simulation) ────────────────── */}
        {view === "sim" && activeSpace && (
          <div className="bg-sky-50/50 border-2 border-sky-200 rounded-3xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black text-sky-900 mb-1 flex items-center gap-2">
              <span>🚀</span> 자립 행동 연습하기 ({getCharText(activeSpace.charName, "와")} 함께)
            </h2>
            <p className="text-xs text-sky-800/80 font-bold mb-6">
              꾸민 공간 안에서 {getCharText(activeSpace.charName, "가")} 안전하게 생활 행동을 해결할 수 있도록 올바른 단계와 답변을 골라주세요.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left visual representation (Simulation Board) */}
              <div className="lg:col-span-5 bg-gradient-to-b from-sky-400 to-indigo-500 rounded-2xl p-4 flex flex-col justify-between items-center text-white relative shadow-lg overflow-hidden min-h-[300px]">
                {/* Ambient glow */}
                <div className="absolute top-10 left-10 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />

                {/* Visual HUD */}
                <div className="w-full flex justify-between items-center z-10 text-[10px] font-black bg-black/20 px-3 py-1.5 rounded-lg">
                  <span>훈련 장소: {activeSpace.name}</span>
                  <span>진행: {simStep + 1} 단계</span>
                </div>

                {/* Big character center illustration */}
                <div className="my-8 flex flex-col items-center gap-2 z-10 animate-float">
                  <img src="/assets/helper/ieumi.png" alt="이음이" className="w-24 h-24 object-contain" />
                  <div className="bg-white/95 text-slate-800 text-[11px] font-black px-4 py-1.5 rounded-full shadow-sm">
                    {activeSpace.charName}
                  </div>
                </div>

                {/* Visual items packed indicators */}
                <div className="w-full z-10">
                  <h5 className="text-[9px] font-black text-sky-100 mb-1.5">👜 소지한 내 가방:</h5>
                  <div className="flex gap-1">
                    {selectedPocketIds.map(id => {
                      const item = POCKET_ITEM_POOL.find(x => x.id === id);
                      return item ? (
                        <div key={id} className="bg-white/25 border border-white/20 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-0.5">
                          <span>{item.emoji}</span>
                          <span>{item.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Right interaction interface */}
              <div className="lg:col-span-7 flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 mb-4 bg-white border-l-4 border-sky-500 pl-3 py-1 shadow-sm">
                    {getSimStepData()?.question}
                  </h3>

                  {/* Options layout */}
                  <div className="flex flex-col gap-3">
                    {getSimStepData()?.options.map((option, idx) => {
                      const isSelected = selectedSimOption === idx;
                      const correct = option.correct;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSimOptionClick(idx)}
                          disabled={selectedSimOption !== null}
                          className={`w-full text-left p-4 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all duration-200 ${
                            selectedSimOption === null
                              ? "bg-white border-slate-200 text-slate-800 hover:border-sky-300 hover:bg-sky-50/30"
                              : isSelected
                              ? correct
                                ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                                : "bg-rose-50 border-rose-500 text-rose-900"
                              : correct
                              ? "bg-emerald-50/40 border-emerald-300 text-emerald-800 opacity-60"
                              : "bg-white border-slate-100 text-slate-400 opacity-40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              selectedSimOption === null
                                ? "bg-slate-100 text-slate-500"
                                : correct
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}>
                              {selectedSimOption !== null ? (correct ? "✓" : "✗") : idx + 1}
                            </span>
                            <span className="leading-relaxed">{option.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation / Progression Box */}
                {selectedSimOption !== null && (
                  <div className="mt-6">
                    <div className={`p-4 rounded-xl text-xs sm:text-sm font-bold border ${
                      getSimStepData()?.options[selectedSimOption].correct
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      <h4 className="font-black text-sm mb-1">
                        {getSimStepData()?.options[selectedSimOption].correct ? "🎉 정답입니다!" : "💡 오답 피드백"}
                      </h4>
                      <p>{simExplanation}</p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleNextSimStep}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-1"
                      >
                        {simStep < (activeSpace.id === "bus" ? 3 : activeSpace.id === "kiosk" ? 4 : 3) ? "다음 단계로 →" : "성공 완료! 🏆"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 6. SUCCESS VIEW (성공 카드 발급) ─────────────────────────── */}
        {view === "success" && activeSpace && (() => {
          const baseScore = activeSpace.targetScore;
          const totalFails = pocketFails + decorFails + simFails;
          const finalScore = Math.max(5, baseScore - totalFails * 2);
          
          let ratingText = "";
          let ratingSubText = "";
          let starCount = 3;
          if (totalFails === 0) {
            ratingText = "⭐⭐⭐ 최고예요! 완벽해요!";
            ratingSubText = "실수 없이 모든 과정을 정말 완벽하게 해결했어요! 대단한 집중력이에요!";
            starCount = 3;
          } else if (totalFails <= 2) {
            ratingText = "⭐⭐ 잘했어요! 훌륭해요!";
            ratingSubText = "조금 실수했지만 포기하지 않고 훌륭히 마쳤어요! 다음엔 더 잘할 수 있어요!";
            starCount = 2;
          } else {
            ratingText = "⭐ 힘내세요! 끝까지 해냈어요!";
            ratingSubText = "자립을 위해 끝까지 노력한 모습이 너무 멋져요! 한 번 더 도전해 볼까요?";
            starCount = 1;
          }
          
          return (
            <div className="relative text-center py-6 px-2 min-h-[500px] flex items-center justify-center">
              {/* Run Fireworks particle effect */}
              <Fireworks />

              <div className="relative z-40 w-full max-w-lg bg-white border-[8px] border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden bg-[radial-gradient(#fff_65%,#fffbeb_100%)] transform transition-all">
                {/* Ribbon top banner */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                
                <div className="bg-amber-400 text-amber-950 font-black text-xs sm:text-sm px-5 py-2 rounded-full w-max mx-auto shadow-md tracking-wider flex items-center gap-1 mb-4 mt-2">
                  <span>🏆</span> 생활 자립 인증 카드 <span>🏆</span>
                </div>

                {/* Decorative floaters */}
                <div className="absolute top-12 left-4 text-3xl animate-float opacity-80">✨</div>
                <div className="absolute top-20 right-4 text-3xl animate-float opacity-80" style={{ animationDelay: "1s" }}>🌟</div>
                <div className="absolute bottom-24 left-8 text-2xl animate-float opacity-50" style={{ animationDelay: "1.8s" }}>🎈</div>

                {/* Congratulatory Text Area */}
                <div className="my-5">
                  <div className="relative inline-block">
                    <span className="text-8xl block animate-bounce my-2">{activeSpace.emoji}</span>
                    <span className="absolute -bottom-1 -right-1 text-3xl">🎉</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-3">{activeSpace.name} 완료</h3>
                  
                  {/* Warm friendly congratulatory text */}
                  <div className="mt-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm">
                    <h4 className="text-base sm:text-lg font-black text-emerald-800">
                      🎉 {studentName}님, 수고하셨습니다! 🎉
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-emerald-700/90 mt-1.5 leading-relaxed">
                      주어진 일상 자립 미션을 끝까지 멋지게 해결했어요! 스스로 척척 알아서 하는 {studentName}님이 무척 자랑스러워요!
                    </p>
                  </div>
                </div>

                {/* Score & Stars Display Dashboard */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center mb-6 shadow-sm">
                  <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest flex items-center justify-center gap-1">
                    <span>📊</span> 최종 자립 평가 결과
                  </h5>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-3 pb-3 border-b border-amber-200/50">
                    <div className="bg-white px-5 py-2.5 rounded-2xl border border-amber-200 shadow-inner">
                      <span className="block text-[10px] text-slate-400 font-bold">내 점수</span>
                      <span className="text-3xl font-black text-amber-600">{finalScore}</span>
                      <span className="text-sm font-bold text-slate-400"> / {baseScore} 점</span>
                    </div>

                    <div className="text-center sm:text-left">
                      <p className="text-base font-black text-amber-900 bg-amber-200/50 px-3 py-1 rounded-full inline-block">
                        {ratingText}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mt-1 leading-normal max-w-[240px]">
                        {ratingSubText}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 mt-2.5 flex items-center justify-center gap-1">
                    <span>💡</span> 실수 횟수: <span className="font-extrabold text-orange-600">{totalFails}회</span> (실수가 적을수록 보너스 점수가 높아요!)
                  </p>
                </div>

                {/* Mistake Review Box (Educationally helpful) */}
                {totalFails > 0 ? (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-left mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rose-200/60">
                      <span className="text-base">💡</span>
                      <span className="text-xs font-black text-rose-800">복습 힌트: 다음 미션 땐 요걸 기억해요!</span>
                    </div>
                    <ul className="list-disc pl-5 text-[11px] text-rose-700 font-bold space-y-1">
                      {pocketFails > 0 && <li>주머니에 자립 필수 물품만 알맞게 챙겨 넣기</li>}
                      {decorFails > 0 && <li>가구와 안내판을 알맞고 안전한 위치에 배치하기</li>}
                      {simFails > 0 && <li>상황 시뮬레이션 질문에서 침착하게 안전한 행동 고르기</li>}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 text-center mb-6 shadow-sm">
                    <p className="text-xs font-black text-sky-800 flex items-center justify-center gap-1">
                      <span>✨</span> 실수가 한 번도 없는 자립 완벽 마스터! <span>✨</span>
                    </p>
                  </div>
                )}

                {/* Character Comment box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left shadow-inner mb-6">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/60">
                    <img src="/assets/helper/ieumi.png" alt="이음이" className="w-8 h-8 object-contain" />
                    <span className="text-xs font-black text-slate-700">{getCharText(activeSpace.charName, "한마디")}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">
                    {activeSpace.id === "bus" && "“와! 버스 노선도와 정류장이 잘 보이니까 집으로 가는 버스도 안 헷갈리고 단말기에 교통카드 태그하는 법도 쉬워졌어! 수고해 줘서 정말 고마워!”"}
                    {activeSpace.id === "kiosk" && "“키오스크 세트 고르기부터 결제 칩 꽂기까지, 이제 혼자 햄버거집에 가도 하나도 안 무섭고 주문할 수 있을 것 같아! 최고야!”"}
                    {activeSpace.id === "atm" && "“대기선에 맞춰 서고 비밀번호를 손으로 잘 가려서 하니까 은행 ATM 사용도 안심이 돼! 고마워 두 번 세 번 계속 연습할래!”"}
                  </p>
                </div>

                {/* Success badge text statement */}
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-center mb-6">
                  <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">오늘의 성공 자립 약속</h5>
                  <p className="text-xs font-black text-amber-950 mt-1 leading-normal">
                    {activeSpace.id === "bus" && "“버스를 탈 때는 번호와 목적지를 먼저 확인하고 차례로 타요.”"}
                    {activeSpace.id === "kiosk" && "“키오스크에서는 메뉴를 하나씩 확인하고 카드를 꽂아 직접 주문해요.”"}
                    {activeSpace.id === "atm" && "“ATM을 쓸 때는 대기선을 지키고 비밀번호를 손으로 가려 안전하게 지켜요.”"}
                  </p>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Retry / Do it once more button */}
                  <button
                    onClick={() => handleSelectSpace(activeSpace)}
                    className="bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-600 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🔄</span> 다시 한번 더 하기 (복습)
                  </button>
                  
                  {/* Next space or report button */}
                  {activeSpace.id === "bus" && (
                    <button
                      onClick={() => {
                        const next = SPACES.find(s => s.id === "kiosk");
                        if (next) handleSelectSpace(next);
                      }}
                      className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-600 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>➡️</span> 다음 미션 하기 (햄버거 가게)
                    </button>
                  )}
                  {activeSpace.id === "kiosk" && (
                    <button
                      onClick={() => {
                        const next = SPACES.find(s => s.id === "atm");
                        if (next) handleSelectSpace(next);
                      }}
                      className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-600 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>➡️</span> 다음 미션 하기 (안전 은행)
                    </button>
                  )}
                  {activeSpace.id === "atm" && (
                    <button
                      onClick={() => {
                        triggerPopSound();
                        setView("report");
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 border-2 border-indigo-600 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>📊</span> 전체 분석 리포트 보기
                    </button>
                  )}
                </div>

                {/* Return to Map button (Save card) */}
                <button
                  onClick={handleReturnToMap}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black py-3.5 px-6 rounded-xl shadow-lg transform active:scale-95 transition text-xs sm:text-sm border-b-4 border-amber-600 flex items-center justify-center gap-1.5"
                >
                  <span>📁</span> 성공 카드 저장하고 지도로 돌아가기
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── VIEW 7. TEACHER / PARENT REPORT VIEW (분석 리포트) ─────────────── */}
        {view === "report" && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>📊</span> {studentName}이의 자립 행동 훈련 분석 리포트
              </h2>
              <button
                onClick={handleClearReports}
                className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] sm:text-xs px-3 py-1.5 rounded-lg transition"
              >
                데이터 전체 초기화
              </button>
            </div>

            {savedReports.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-inner">
                <span className="text-5xl block mb-3">📭</span>
                아직 완료된 미션 훈련 기록이 없습니다.
                <p className="text-xs text-slate-400 font-bold mt-1">자립마을 미션을 하나 이상 성공하면 리포트가 생성됩니다.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {savedReports.map((report, idx) => {
                  const totalErrors = report.pocketFails + report.decorFails + report.simFails;
                  return (
                    <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {report.spaceId === "bus" && "🚌"}
                            {report.spaceId === "kiosk" && "🍔"}
                            {report.spaceId === "atm" && "🏦"}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-slate-800">
                            {report.spaceName}
                          </h3>
                        </div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
                          훈련 일시: {report.completedAt}
                        </span>
                      </div>

                      {/* Error stats chart grid */}
                      <div className="grid grid-cols-3 gap-2.5 text-center mb-6">
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="block text-[10px] text-slate-500 font-black">가방 챙기기 오답</span>
                          <span className={`text-base sm:text-lg font-black block mt-1 ${
                            report.pocketFails > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {report.pocketFails} 회
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="block text-[10px] text-slate-500 font-black">공간 꾸미기 오답</span>
                          <span className={`text-base sm:text-lg font-black block mt-1 ${
                            report.decorFails > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {report.decorFails} 회
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="block text-[10px] text-slate-500 font-black">시뮬레이션 퀴즈 오답</span>
                          <span className={`text-base sm:text-lg font-black block mt-1 ${
                            report.simFails > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {report.simFails} 회
                          </span>
                        </div>
                      </div>

                      {/* Mistakes Log */}
                      {report.mistakes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-black text-slate-700 mb-2">🚨 오답 선택지 및 주요 취약 행동</h4>
                          <ul className="flex flex-col gap-1.5">
                            {report.mistakes.map((log, lIdx) => (
                              <li key={lIdx} className="bg-rose-50/70 border border-rose-100 rounded-lg px-3 py-2 text-[10px] sm:text-xs text-rose-800 font-bold flex items-start gap-2">
                                <span className="shrink-0">•</span>
                                <span>{log}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Educational Guide Section */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <h4 className="text-xs font-black text-emerald-950 mb-1 flex items-center gap-1">
                          <span>💡</span> 교사 및 보호자용 지도 조언 (Haemil Guide)
                        </h4>
                        <p className="text-[10px] sm:text-xs text-emerald-900/90 font-bold leading-relaxed">
                          {report.spaceId === "bus" && "학생이 버스의 노선 정보 판별을 한두 번 헷갈린 경향이 있습니다. 실생활 교육 시 차량의 색깔보다는 앞유리 전광판의 번호와 지명을 가리키며 짚어 말하도록 지도하고, 승차 시 지체없이 교통카드를 미리 준비하는 대기 훈련을 실물 카드로 병행해 주세요."}
                          {report.spaceId === "kiosk" && "키오스크 세트 구성 옵션과 IC칩 삽입 등 하드웨어 접촉 부위에서 오류를 기록했습니다. 매장 주문 시 무인 단말기가 낯설 수 있으니, 그림 메뉴판을 통해 단품과 세트 차이를 상기시켜주시고 카드를 직접 끝까지 꽂아 넣는 감각을 여러 번 피드백해 주시는 것이 유효합니다."}
                          {report.spaceId === "atm" && "은행 이용 단계에서 번호표 뽑기 및 대기선 유지 매너와 보안 가림막 중요성을 안내했습니다. 개인 보안의 중요성을 상기시키며 ATM 비밀번호 키패드를 누를 때 손으로 우산 모양을 만들어 누르는 모션을 실물 금전 거래 시 반복 연습할 수 있도록 독려해주세요."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back action */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { triggerPopSound(); setView("map"); }}
                className="bg-slate-600 hover:bg-slate-700 text-white font-black px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95"
              >
                지도로 돌아가기
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
