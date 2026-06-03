"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type Mission = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "바로 시작" | "연습 가능";
  path: string;
  icon: string;
  level: string;
  time: string;
  steps: string[];
  color: string;
};

const missions: Mission[] = [
  {
    id: "kiosk",
    title: "키오스크 주문",
    category: "[이] 일상 시뮬레이션",
    description: "음식 메뉴를 고르고, 수량을 확인하고, 결제까지 연습합니다.",
    status: "바로 시작",
    path: "/simulation/kiosk",
    icon: "🍔",
    level: "쉬움",
    time: "약 5분",
    steps: ["메뉴 보기", "수량 고르기", "결제하기"],
    color: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    id: "bus",
    title: "버스 타기",
    category: "[이] 이동과 일상",
    description: "목적지, 버스 번호, 내릴 곳을 천천히 확인합니다.",
    status: "연습 가능",
    path: "/simulation/bus",
    icon: "🚌",
    level: "보통",
    time: "약 7분",
    steps: ["목적지 확인", "버스 선택", "내릴 곳 찾기"],
    color: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    id: "school-talk",
    title: "학교생활 대화",
    category: "[밀] 소통 연습",
    description: "친구와의 상황에서 말 고르기, 거절하기, 도움 요청을 연습합니다.",
    status: "연습 가능",
    path: "/simulation/school-talk",
    icon: "💬",
    level: "연습",
    time: "약 6분",
    steps: ["상황 보기", "말 고르기", "결과 확인"],
    color: "border-violet-200 bg-violet-50 text-violet-950",
  },
  {
    id: "emotion-check",
    title: "마음 고르기",
    category: "[음] 마음 이음",
    description: "오늘의 기분을 고르고, 나에게 해주고 싶은 말을 남깁니다.",
    status: "연습 가능",
    path: "/emotion/check",
    icon: "😊",
    level: "쉬움",
    time: "약 3분",
    steps: ["기분 고르기", "짧게 쓰기", "칭찬 받기"],
    color: "border-rose-200 bg-rose-50 text-rose-950",
  },
  {
    id: "routine-check",
    title: "루틴 체크",
    category: "[음] 마이 루틴",
    description: "오늘 한 일을 하나씩 체크하고 작은 성공을 기록합니다.",
    status: "연습 가능",
    path: "/routine/check",
    icon: "✓",
    level: "쉬움",
    time: "약 4분",
    steps: ["할 일 보기", "체크하기", "완료 확인"],
    color: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
];

const guideCards = [
  {
    title: "하나만 골라도 괜찮아요",
    text: "오늘은 끝까지 해보는 것이 목표입니다.",
  },
  {
    title: "틀려도 다시 할 수 있어요",
    text: "미션은 연습하는 곳입니다.",
  },
  {
    title: "어려우면 도움을 요청해요",
    text: "선생님이나 보호자에게 화면을 보여주세요.",
  },
];

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || "이름 미선택";

export default function MissionSelectPage() {
  const router = useRouter();
  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );

  const startMission = (mission: Mission) => {
    localStorage.setItem("haemileum_selected_mission", mission.title);
    router.push(mission.path);
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">미션 선택</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName} 학생,
                <br />
                오늘 할 미션을 골라요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                쉬운 것부터 시작해도 좋습니다. 큰 카드를 누르면 바로
                연습을 시작합니다.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              {guideCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <p className="text-base font-black text-slate-950">
                    {card.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-700">오늘의 미션</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              원하는 활동을 하나 골라요
            </h2>
          </div>
          <button
            type="button"
            onClick={() => router.push("/student/home")}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            학생 홈으로
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              onClick={() => startMission(mission)}
              className={`group rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 ${mission.color}`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl font-black shadow-sm">
                  {mission.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-black/5">
                      {mission.category}
                    </span>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-black/5">
                      {mission.level}
                    </span>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-black/5">
                      {mission.time}
                    </span>
                  </div>

                  <h3 className="mt-3 text-2xl font-black leading-tight">
                    {mission.title}
                  </h3>
                  <p className="mt-3 text-base font-semibold leading-7 opacity-80">
                    {mission.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {mission.steps.map((step) => (
                      <span
                        key={step}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black opacity-90 ring-1 ring-black/5"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-black ring-1 ring-black/5">
                      {mission.status}
                    </span>
                    <span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white group-hover:bg-emerald-800">
                      시작하기
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="text-lg font-black text-amber-950">
            처음이라면 키오스크 주문부터 추천합니다.
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
            화면을 보고 고르는 연습이라 시작하기 쉽고, 실생활에서 바로
            도움이 됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
