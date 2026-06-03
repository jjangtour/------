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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-blue-700 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold text-blue-100">학생 홈</p>
          <h1 className="mt-3 text-4xl font-bold">
            {studentName} 학생, 오늘도 하나씩 연습해 봐요.
          </h1>
          <p className="mt-4 max-w-3xl text-blue-100">
            해밀이음은 생활 속 상황을 안전하게 반복 연습할 수 있도록 돕습니다.
            어려워도 괜찮습니다. 천천히 선택하고 다시 연습하면 됩니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StudentActionCard
            title="미션 선택"
            description="키오스크, 버스, 학교생활 대화 미션을 선택합니다."
            href="/mission/select"
            buttonText="미션 고르기"
          />
          <StudentActionCard
            title="감정 기록"
            description="오늘 기분을 고르고 칭찬 스탬프를 기록합니다."
            href="/emotion/check"
            buttonText="기분 기록하기"
          />
          <StudentActionCard
            title="루틴 체크"
            description="가방 챙기기, 준비물 확인 등 오늘 루틴을 체크합니다."
            href="/routine/check"
            buttonText="루틴 체크하기"
          />
          <StudentActionCard
            title="학생 다시 선택"
            description="다른 학생으로 바꾸어 학습을 시작합니다."
            href="/student/select"
            buttonText="학생 바꾸기"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">오늘의 추천 미션</h2>
            <p className="mt-2 text-sm text-slate-500">
              처음 시연할 때는 아래 순서로 진행하면 좋습니다.
            </p>

            <div className="mt-5 space-y-4">
              <RecommendedMission
                step="1"
                title="키오스크 주문 연습"
                description="메뉴 선택, 결제, 영수증 선택 절차를 연습합니다."
                href="/simulation/kiosk"
              />
              <RecommendedMission
                step="2"
                title="대중교통 이용 연습"
                description="목적지 확인, 버스 번호 선택, 하차 정류장을 연습합니다."
                href="/simulation/bus"
              />
              <RecommendedMission
                step="3"
                title="학교생활 대화 연습"
                description="친구와의 갈등 상황에서 적절한 표현을 연습합니다."
                href="/simulation/school-talk"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">최근 나의 기록</h2>
            <p className="mt-2 text-sm text-slate-500">
              최근 수행한 미션 결과를 확인합니다.
            </p>

            {recentResults.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                아직 수행 기록이 없습니다. 먼저 미션을 하나 진행해 주세요.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {recentResults.map((result, index) => (
                  <div
                    key={`${result.mission}-${index}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{result.mission}</p>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {result.score}점
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      정서 상태: {result.emotion} · {result.completedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StudentActionCard({
  title,
  description,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        {buttonText}
      </Link>
    </div>
  );
}

function RecommendedMission({
  step,
  title,
  description,
  href,
}: {
  step: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 p-4 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
    >
      <div className="flex gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
          {step}
        </div>
        <div>
          <p className="font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
