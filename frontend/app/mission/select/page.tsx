"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getLevelInfo } from "@/utils/level";

type MissionDef = {
  id: string;
  title: string;
  description: string;
  level: "쉬움" | "보통" | "어려움" | "연습";
  time: string;
  steps: string[];
  path: string;
  status: "바로 시작" | "연습 가능";
};

type Place = {
  id: string;
  name: string;
  icon: string;
  missions: MissionDef[];
  locked?: boolean;
  lockLabel?: string;
};

type Zone = {
  id: string;
  name: string;
  icon: string;
  bg: string;
  border: string;
  text: string;
  placeBg: string;
  places: Place[];
};

const zones: Zone[] = [
  {
    id: "order",
    name: "주문·결제 거리",
    icon: "🍽️",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-950",
    placeBg: "bg-amber-100",
    places: [
      {
        id: "fastfood",
        name: "패스트푸드",
        icon: "🍔",
        missions: [
          {
            id: "kiosk-order",
            title: "패스트푸드 주문",
            description:
              "불고기 버거 세트를 가져가기로 주문하고, 카드 전용 기계에서 안전하게 계산합니다.",
            level: "쉬움",
            time: "5분",
            steps: ["가져가기 선택", "메뉴 고르기", "잠깐 확인!", "카드 결제"],
            path: "/simulation/kiosk",
            status: "바로 시작",
          },
        ],
      },
      {
        id: "cafe",
        name: "카페",
        icon: "☕",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "foodcourt",
        name: "푸드코트",
        icon: "🍱",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "table-order",
        name: "테이블오더",
        icon: "📱",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "catch-table",
        name: "캐치테이블",
        icon: "🍽️",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "cinema",
        name: "영화관",
        icon: "🎬",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
    ],
  },
  {
    id: "transport",
    name: "이동·예매 거리",
    icon: "🚌",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-950",
    placeBg: "bg-sky-100",
    places: [
      {
        id: "bus",
        name: "버스정류장",
        icon: "🚏",
        missions: [
          {
            id: "bus-ride",
            title: "버스 타기 연습",
            description:
              "주변을 잘 살펴보고, 맞는 방법을 차근차근 고르는 버스 타기 3부작입니다.",
            level: "보통",
            time: "7분",
            steps: ["살펴볼 것 찾기", "잠깐 확인", "성공! 잘 했어요"],
            path: "/simulation/bus",
            status: "바로 시작",
          },
        ],
      },
      {
        id: "express-bus",
        name: "고속버스",
        icon: "🚍",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "ktx",
        name: "KTX역",
        icon: "🚄",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "airport",
        name: "공항",
        icon: "✈️",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "parking",
        name: "주차정산",
        icon: "🅿️",
        missions: [
          {
            id: "parking-payment",
            title: "주차요금 정산하기",
            description:
              "차를 타고 나가기 전에 무인 주차정산기에서 차량번호를 확인하고 카드로 결제합니다.",
            level: "보통",
            time: "8분",
            steps: ["차 번호 찾기", "요금 확인", "카드 결제", "카드 챙기기"],
            path: "/simulation/parking",
            status: "바로 시작",
          },
        ],
      },
    ],
  },
  {
    id: "public",
    name: "공공·생활 업무 거리",
    icon: "🏦",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-950",
    placeBg: "bg-blue-100",
    places: [
      {
        id: "atm",
        name: "은행 ATM",
        icon: "🏧",
        missions: [
          {
            id: "atm-use",
            title: "ATM 사용하기",
            description:
              "용돈을 찾으면서 비밀번호를 안전하게 지키는 방법을 연습합니다.",
            level: "보통",
            time: "8분",
            steps: ["카드 넣기", "돈 찾기", "비밀번호 지키기", "카드 챙기기"],
            path: "/simulation/atm",
            status: "바로 시작",
          },
        ],
      },
      {
        id: "safety",
        name: "안전 훈련장",
        icon: "🛡️",
        missions: [
          {
            id: "safety-sos",
            title: "사기 방어와 마음 관리",
            description:
              "수상한 문자를 구별하고 불안한 마음을 안정시키는 방법을 연습합니다.",
            level: "보통",
            time: "5분",
            steps: ["문자 분석", "감정 분리", "안정 호흡"],
            path: "/simulation/safety-sos",
            status: "연습 가능",
          },
        ],
      },
      {
        id: "hospital",
        name: "병원진료발급기",
        icon: "🏥",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "kiosk-gov",
        name: "무인발급기",
        icon: "🖨️",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "parcel",
        name: "편의점 택배",
        icon: "📦",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "gas-station",
        name: "셀프주유소",
        icon: "⛽",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
    ],
  },
  {
    id: "mind",
    name: "마음·안전 거리",
    icon: "💚",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-950",
    placeBg: "bg-violet-100",
    places: [
      {
        id: "school-talk",
        name: "학교생활",
        icon: "💬",
        missions: [
          {
            id: "school-talk-1",
            title: "학교생활 대화",
            description:
              "친구와의 오해 상황에서 차분히 묻고 표현하는 말을 고릅니다.",
            level: "연습",
            time: "6분",
            steps: ["상황 보기", "말 고르기", "결과 확인"],
            path: "/simulation/school-talk",
            status: "연습 가능",
          },
        ],
      },
      {
        id: "bathhouse",
        name: "목욕탕",
        icon: "♨️",
        locked: true,
        lockLabel: "곧 열려요",
        missions: [],
      },
      {
        id: "emotion",
        name: "마음쉼터",
        icon: "🌿",
        missions: [
          {
            id: "emotion-check",
            title: "마음 고르기",
            description:
              "오늘의 감정을 고르고 나에게 해주고 싶은 말을 기록합니다.",
            level: "쉬움",
            time: "3분",
            steps: ["기분 고르기", "짧게 적기", "칭찬 받기"],
            path: "/emotion/check",
            status: "연습 가능",
          },
        ],
      },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  쉬움: "bg-emerald-100 text-emerald-800",
  보통: "bg-amber-100 text-amber-800",
  어려움: "bg-red-100 text-red-800",
  연습: "bg-violet-100 text-violet-800",
};

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || "이름 미선택";

const getSelectedStudentXp = () => {
  if (typeof window === "undefined") return 0;
  const name = localStorage.getItem("haemileum_selected_student") || "이름 미선택";
  return parseInt(localStorage.getItem(`haemileum_student_xp_${name}`) || "0", 10);
};

export default function MissionSelectPage() {
  const router = useRouter();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );
  const totalXp = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudentXp,
    () => 0
  );
  const levelInfo = useMemo(() => getLevelInfo(totalXp), [totalXp]);

  const selectedEntry = useMemo(() => {
    for (const zone of zones) {
      const place = zone.places.find((p) => p.id === selectedPlaceId);
      if (place) return { zone, place };
    }
    return null;
  }, [selectedPlaceId]);

  const handlePlaceClick = (placeId: string) => {
    setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
  };

  const startMission = (mission: MissionDef) => {
    localStorage.setItem("haemileum_selected_mission", mission.title);
    router.push(mission.path);
  };

  return (
    <main className="min-h-screen bg-[#eef6f0] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">

        {/* Map header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-emerald-700 px-7 py-6 sm:px-9 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-200">
                  <span>🗺️</span> 해밀 생활마을
                </p>
                <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                  {studentName} 학생,
                  <br />
                  어디로 갈까요?
                </h1>
                <p className="mt-3 text-base font-semibold text-emerald-100">
                  장소를 골라 미션을 시작하세요
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 px-6 py-4 text-center ring-1 ring-white/25">
                <p className="text-xs font-bold text-emerald-200">나의 레벨</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {levelInfo.badge} {levelInfo.title}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-100">
                  {levelInfo.totalXp} XP
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-7 py-4 sm:px-9">
            <p className="text-sm font-semibold text-slate-500">
              장소 아이콘을 누르면 미션 목록이 나타납니다
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/student/house")}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                우리집
              </button>
              <button
                type="button"
                onClick={() => router.push("/student/home")}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                학생 홈
              </button>
            </div>
          </div>
        </div>

        {/* Zone grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {zones.map((zone) => {
            const availableCount = zone.places.filter((p) => !p.locked).length;
            return (
              <div
                key={zone.id}
                className={`rounded-2xl border p-5 shadow-sm ${zone.bg} ${zone.border}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                    {zone.icon}
                  </span>
                  <div>
                    <h2 className={`text-lg font-black ${zone.text}`}>
                      {zone.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      {availableCount}개 장소 이용 가능
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {zone.places.map((place) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        disabled={place.locked}
                        onClick={() =>
                          !place.locked && handlePlaceClick(place.id)
                        }
                        className={[
                          "relative rounded-xl border-2 p-3 text-left transition",
                          place.locked
                            ? "cursor-not-allowed border-slate-100 bg-white/40 opacity-50"
                            : isSelected
                              ? "border-emerald-400 bg-white shadow-md"
                              : "border-transparent bg-white shadow-sm hover:border-emerald-300 hover:shadow-md active:scale-95",
                        ].join(" ")}
                      >
                        <span className="block text-2xl">{place.icon}</span>
                        <span
                          className={`mt-1.5 block text-xs font-black leading-tight ${
                            place.locked ? "text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {place.name}
                        </span>
                        {place.locked && (
                          <span className="mt-1 block text-[10px] font-bold text-slate-400">
                            {place.lockLabel}
                          </span>
                        )}
                        {!place.locked && (
                          <span className="mt-1 block text-[10px] font-bold text-slate-500">
                            미션 {place.missions.length}개
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission panel */}
        {selectedEntry ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-md">
            <div className="flex items-center gap-4 border-b border-emerald-100 bg-emerald-50 px-6 py-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-3xl shadow-sm">
                {selectedEntry.place.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  {selectedEntry.zone.name}
                </p>
                <h3 className="text-2xl font-black text-slate-900">
                  {selectedEntry.place.name}
                </h3>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {selectedEntry.place.missions.map((mission) => (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => startMission(mission)}
                  className="group rounded-xl border border-slate-200 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${LEVEL_COLORS[mission.level]}`}
                    >
                      {mission.level}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {mission.time}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      {mission.status}
                    </span>
                  </div>

                  <h4 className="mt-3 text-xl font-black text-slate-900">
                    {mission.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {mission.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {mission.steps.map((step) => (
                      <span
                        key={step}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex justify-end">
                    <span className="rounded-lg bg-emerald-700 px-5 py-2.5 text-base font-black text-white group-hover:bg-emerald-800">
                      미션 시작하기
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white py-10 text-center shadow-sm">
            <p className="text-4xl">👆</p>
            <p className="mt-3 text-xl font-black text-slate-700">
              위에서 장소를 골라보세요
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              장소를 누르면 미션 카드가 나타납니다
            </p>
          </div>
        )}

        {/* Hint footer */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-base font-black text-amber-950">
            도움이 필요하면 멈춰도 됩니다
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-900">
            어려운 화면이 나오면 선생님이나 보호자에게 보여주세요.
          </p>
        </div>

      </section>
    </main>
  );
}
