"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

type StudentResult = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

const quickActions = [
  {
    title: "다른 미션 보기",
    description: "연습할 활동을 직접 고릅니다.",
    href: "/mission/select",
    icon: "🎯",
    color: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
  },
  {
    title: "마음 고르기",
    description: "오늘 기분을 짧게 남깁니다.",
    href: "/emotion/check",
    icon: "😊",
    color: "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
  },
  {
    title: "루틴 체크",
    description: "오늘 한 일을 확인합니다.",
    href: "/routine/check",
    icon: "✓",
    color: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
  {
    title: "학생 바꾸기",
    description: "다른 이름으로 시작합니다.",
    href: "/student/select",
    icon: "👤",
    color: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  },
];

const recommendedMissions = [
  {
    title: "키오스크 주문",
    description: "음식 고르기, 수량 확인, 결제를 천천히 연습합니다.",
    href: "/simulation/kiosk",
    tag: "[이] 일상",
    icon: "🍔",
    level: "쉬움",
    steps: ["메뉴 보기", "수량 고르기", "결제하기"],
    accent: "bg-amber-100 text-amber-900",
  },
  {
    title: "버스 타기",
    description: "목적지와 버스 번호를 보고 안전하게 이동합니다.",
    href: "/simulation/bus",
    tag: "[이] 이동",
    icon: "🚌",
    level: "보통",
    steps: ["목적지 확인", "버스 선택", "내릴 곳 찾기"],
    accent: "bg-sky-100 text-sky-900",
  },
  {
    title: "학교생활 대화",
    description: "친구에게 말하기, 거절하기, 도움 요청을 연습합니다.",
    href: "/simulation/school-talk",
    tag: "[밀] 대화",
    icon: "💬",
    level: "연습",
    steps: ["상황 보기", "말 고르기", "결과 확인"],
    accent: "bg-violet-100 text-violet-900",
  },
];

const cheerMessages = [
  "오늘은 하나만 끝까지 해도 충분합니다.",
  "모르면 다시 눌러도 괜찮습니다.",
  "천천히 읽고, 천천히 골라봅니다.",
];

const emptyResults = "[]";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || "이름 미선택";

const getSavedResults = () =>
  localStorage.getItem("haemileum_results") || emptyResults;

export default function StudentHomePage() {
  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );
  const savedResultsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedResults,
    () => emptyResults
  );

  const recentResults = useMemo(() => {
    try {
      const savedResults = JSON.parse(savedResultsText) as StudentResult[];

      return savedResults
        .filter((result) => result.studentName === studentName)
        .slice(-3)
        .reverse();
    } catch {
      return [];
    }
  }, [savedResultsText, studentName]);

  const latestResult = recentResults[0];
  const heroMission = recommendedMissions[0];

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">학생 홈</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName} 학생,
                <br />
                오늘은 하나만 해봐요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                틀려도 괜찮습니다. 다시 고르고, 다시 연습하면 됩니다.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {cheerMessages.map((message) => (
                  <div
                    key={message}
                    className="rounded-lg bg-white/12 p-4 text-sm font-semibold leading-6 text-emerald-50 ring-1 ring-white/20"
                  >
                    {message}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold text-emerald-700">
                바로 시작하기
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {heroMission.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {heroMission.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                  {heroMission.tag}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                  {heroMission.level}
                </span>
              </div>

              <Link
                href={heroMission.href}
                className="mt-7 flex min-h-16 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-center text-xl font-black text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                미션 시작하기
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatusCard
            title="오늘 학생"
            value={studentName}
            description="선택된 이름"
          />
          <StatusCard
            title="최근 미션"
            value={latestResult?.mission || "아직 없음"}
            description="마지막 활동"
          />
          <StatusCard
            title="최근 점수"
            value={latestResult ? `${latestResult.score}점` : "0점"}
            description="다시 하면 올라갑니다"
          />
          <StatusCard
            title="오늘 마음"
            value={latestResult?.emotion || "기록 전"}
            description="마음을 남겨보세요"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-lg border p-5 shadow-sm transition ${action.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black shadow-sm">
                  {action.icon}
                </span>
                <div>
                  <h2 className="text-lg font-black">{action.title}</h2>
                  <p className="mt-1 text-sm leading-5 opacity-80">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  추천 미션
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  고르고 연습하기
                </h2>
              </div>
              <Link
                href="/mission/select"
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                전체 보기
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {recommendedMissions.map((mission) => (
                <Link
                  key={mission.title}
                  href={mission.href}
                  className="block rounded-lg border border-slate-200 p-5 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${mission.accent}`}
                    >
                      {mission.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {mission.tag}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                          {mission.level}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {mission.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {mission.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mission.steps.map((step) => (
                          <span
                            key={step}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                          >
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-emerald-700">나의 기록</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              최근에 해본 활동
            </h2>

            {recentResults.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-base font-semibold leading-7 text-slate-600">
                아직 기록이 없습니다.
                <br />
                위의 미션 시작하기를 눌러 첫 기록을 만들어보세요.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {recentResults.map((result, index) => (
                  <div
                    key={`${result.mission}-${index}`}
                    className="rounded-lg border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-black text-slate-950">
                        {result.mission}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                        {result.score}점
                      </span>
                    </div>

                    <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(Math.max(result.score, 0), 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                      마음: {result.emotion || "기록 전"} ·{" "}
                      {result.completedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-lg font-black text-amber-950">
              도움이 필요하면 멈춰도 됩니다.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
              어려운 화면이 나오면 선생님이나 보호자에게 보여주세요.
            </p>
          </div>
          <Link
            href="/routine/check"
            className="flex min-h-12 items-center justify-center rounded-lg bg-amber-700 px-5 py-3 text-base font-black text-white hover:bg-amber-800"
          >
            쉬운 활동으로 가기
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 min-h-9 break-words text-xl font-black text-emerald-700 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
