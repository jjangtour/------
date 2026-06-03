"use client";

import { useEffect, useState } from "react";
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
    title: "미션 고르기",
    description: "오늘 연습할 활동을 골라요.",
    href: "/mission/select",
    emoji: "🎯",
    color: "bg-blue-700 text-white hover:bg-blue-800",
  },
  {
    title: "기분 기록하기",
    description: "오늘 내 마음을 골라요.",
    href: "/emotion/check",
    emoji: "😊",
    color: "bg-white text-slate-800 hover:bg-blue-50",
  },
  {
    title: "루틴 체크하기",
    description: "오늘 한 일을 체크해요.",
    href: "/routine/check",
    emoji: "✅",
    color: "bg-white text-slate-800 hover:bg-blue-50",
  },
  {
    title: "학생 바꾸기",
    description: "다른 학생으로 시작해요.",
    href: "/student/select",
    emoji: "👤",
    color: "bg-white text-slate-800 hover:bg-blue-50",
  },
];

const recommendedMissions = [
  {
    title: "키오스크 주문 연습",
    description: "음식을 고르고 결제해요.",
    href: "/simulation/kiosk",
    tag: "[이] 일상",
    emoji: "🍔",
  },
  {
    title: "대중교통 이용 연습",
    description: "버스를 타고 내려요.",
    href: "/simulation/bus",
    tag: "[이] 이동",
    emoji: "🚌",
  },
  {
    title: "학교생활 대화 연습",
    description: "친구에게 차분히 말해요.",
    href: "/simulation/school-talk",
    tag: "[밀] 대화",
    emoji: "💬",
  },
];

export default function StudentHomePage() {
  const [studentName, setStudentName] = useState("이름 미선택");
  const [recentResults, setRecentResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("haemileum_selected_student") || "이름 미선택";

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    const filteredResults = savedResults
      .filter((result: StudentResult) => result.studentName === savedStudent)
      .slice(-3)
      .reverse();

    setStudentName(savedStudent);
    setRecentResults(filteredResults);
  }, []);

  const latestResult = recentResults[0];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-blue-700 p-8 text-white shadow-sm md:p-10">
          <p className="text-sm font-semibold text-blue-100">학생 홈</p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            {studentName} 학생, 오늘도 천천히 해봐요.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100">
            틀려도 괜찮아요. 다시 연습하면 됩니다.  
            오늘은 하나만 골라서 끝까지 해보는 것이 목표입니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="오늘 학생"
            value={studentName}
            description="선택된 학생"
          />
          <StatusCard
            title="최근 미션"
            value={latestResult?.mission || "아직 없음"}
            description="마지막 수행 활동"
          />
          <StatusCard
            title="최근 점수"
            value={latestResult ? `${latestResult.score}점` : "0점"}
            description="가장 최근 기록"
          />
          <StatusCard
            title="오늘 마음"
            value={latestResult?.emotion || "기록 전"}
            description="정서 상태"
          />
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              지금 할 수 있는 것
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              큰 버튼을 눌러서 원하는 활동으로 이동합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 ${action.color}`}
              >
                <p className="text-4xl">{action.emoji}</p>
                <h3 className="mt-4 text-xl font-bold">{action.title}</h3>
                <p className="mt-3 text-sm leading-6 opacity-80">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              오늘의 추천 미션
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              처음에는 쉬운 생활 미션부터 시작하면 좋습니다.
            </p>

            <div className="mt-5 space-y-4">
              {recommendedMissions.map((mission) => (
                <Link
                  key={mission.title}
                  href={mission.href}
                  className="block rounded-2xl border border-slate-200 p-5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                      {mission.emoji}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {mission.tag}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        {mission.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {mission.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              최근 나의 기록
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              내가 최근에 해본 활동입니다.
            </p>

            {recentResults.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                아직 기록이 없습니다.  
                먼저 미션을 하나 해보세요.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {recentResults.map((result, index) => (
                  <div
                    key={`${result.mission}-${index}`}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold text-slate-900">
                        {result.mission}
                      </p>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {result.score}점
                      </span>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{
                          width: `${Math.min(result.score * 3, 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      마음: {result.emotion} · {result.completedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-blue-50 p-6 ring-1 ring-blue-100">
          <p className="text-lg font-bold text-blue-900">
            오늘의 한마디
          </p>
          <p className="mt-3 text-sm leading-7 text-blue-800">
            한 번에 다 잘하지 않아도 됩니다.  
            오늘은 하나를 끝까지 해본 것만으로도 충분히 잘한 것입니다.
          </p>
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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 min-h-10 text-2xl font-bold text-blue-700">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
