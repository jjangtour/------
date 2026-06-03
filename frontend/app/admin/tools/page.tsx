"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";

type ResultRecord = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

type EmotionRecord = {
  studentName: string;
  emotion: string;
  reason: string;
  stamp: string;
  completedAt: string;
};

type RoutineRecord = ResultRecord & {
  routines?: string[];
};

const storageKeys = [
  "haemileum_results",
  "haemileum_emotions",
  "haemileum_routines",
  "haemileum_selected_student",
  "haemileum_selected_mission",
];

const quickLinks = [
  { href: "/", label: "처음 화면" },
  { href: "/student/select", label: "학생 선택" },
  { href: "/student/home", label: "학생 홈" },
  { href: "/mission/select", label: "미션 선택" },
  { href: "/emotion/check", label: "마음 고르기" },
  { href: "/routine/check", label: "루틴 체크" },
  { href: "/teacher/dashboard", label: "교사 대시보드" },
  { href: "/parent/dashboard", label: "학부모 대시보드" },
];

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getStorageSnapshot = () =>
  JSON.stringify({
    selectedStudent:
      localStorage.getItem("haemileum_selected_student") || "없음",
    results: localStorage.getItem("haemileum_results") || "[]",
    emotions: localStorage.getItem("haemileum_emotions") || "[]",
    routines: localStorage.getItem("haemileum_routines") || "[]",
  });

function readJsonArray<T>(value: string): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

function notifyStorageChanged() {
  window.dispatchEvent(new Event("storage"));
}

export default function AdminToolsPage() {
  const [message, setMessage] = useState("");
  const storageSnapshot = useSyncExternalStore(
    subscribeToStorage,
    getStorageSnapshot,
    () =>
      JSON.stringify({
        selectedStudent: "없음",
        results: "[]",
        emotions: "[]",
        routines: "[]",
      })
  );

  const data = useMemo(() => {
    const parsed = JSON.parse(storageSnapshot) as {
      selectedStudent: string;
      results: string;
      emotions: string;
      routines: string;
    };
    const results = readJsonArray<ResultRecord>(parsed.results);
    const emotions = readJsonArray<EmotionRecord>(parsed.emotions);
    const routines = readJsonArray<RoutineRecord>(parsed.routines);

    return {
      selectedStudent: parsed.selectedStudent,
      results,
      emotions,
      routines,
      recentResults: results.slice(-5).reverse(),
    };
  }, [storageSnapshot]);

  const createSampleData = () => {
    const now = new Date().toLocaleString("ko-KR");
    const sampleResults: ResultRecord[] = [
      {
        studentName: "김하늘",
        mission: "키오스크 주문",
        score: 80,
        status: "완료",
        emotion: "안정",
        completedAt: now,
      },
      {
        studentName: "이도윤",
        mission: "버스 타기",
        score: 60,
        status: "완료",
        emotion: "보통",
        completedAt: now,
      },
      {
        studentName: "박서아",
        mission: "학교생활 대화",
        score: 40,
        status: "주의",
        emotion: "걱정",
        completedAt: now,
      },
      {
        studentName: "김하늘",
        mission: "마음 고르기",
        score: 100,
        status: "완료",
        emotion: "기쁨",
        completedAt: now,
      },
      {
        studentName: "김하늘",
        mission: "루틴 체크",
        score: 80,
        status: "완료",
        emotion: "안정",
        completedAt: now,
      },
    ];
    const sampleEmotions: EmotionRecord[] = [
      {
        studentName: "김하늘",
        emotion: "기쁨",
        reason: "오늘 미션을 끝까지 해냈어요.",
        stamp: "오늘도 나를 잘 살폈어요",
        completedAt: now,
      },
    ];
    const sampleRoutines: RoutineRecord[] = [
      {
        studentName: "김하늘",
        mission: "루틴 체크",
        score: 80,
        status: "완료",
        emotion: "안정",
        completedAt: now,
        routines: [
          "정해진 시간에 일어나기",
          "가방 챙기기",
          "숙제 또는 알림 확인하기",
          "오늘 기분 말하기",
        ],
      },
    ];

    localStorage.setItem("haemileum_results", JSON.stringify(sampleResults));
    localStorage.setItem("haemileum_emotions", JSON.stringify(sampleEmotions));
    localStorage.setItem("haemileum_routines", JSON.stringify(sampleRoutines));
    localStorage.setItem("haemileum_selected_student", "김하늘");
    setMessage("시연용 샘플 데이터가 생성됐습니다.");
    notifyStorageChanged();
  };

  const clearAllData = () => {
    const isConfirmed = window.confirm(
      "해밀이음 브라우저 저장 데이터를 모두 초기화할까요?"
    );

    if (!isConfirmed) return;

    storageKeys.forEach((key) => localStorage.removeItem(key));
    setMessage("전체 브라우저 저장 데이터가 초기화됐습니다.");
    notifyStorageChanged();
  };

  const refreshData = () => {
    setMessage("현재 브라우저 저장 상태를 다시 확인했습니다.");
    notifyStorageChanged();
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.86fr]">
            <div className="bg-slate-900 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-slate-300">관리자 도구</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                시연 데이터와 화면 이동을 관리합니다.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200">
                로컬 브라우저 저장소에 있는 학생 활동, 마음 기록, 루틴
                기록을 확인하고 시연용 데이터를 빠르게 준비합니다.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              <GuideCard
                title="샘플 데이터 생성"
                text="교사/학부모 대시보드 확인용 기록을 한 번에 만듭니다."
              />
              <GuideCard
                title="초기화 전 확인"
                text="초기화는 현재 브라우저의 해밀이음 테스트 데이터만 지웁니다."
              />
              <GuideCard
                title="시연 화면 이동"
                text="주요 화면으로 빠르게 이동해 전체 흐름을 점검합니다."
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminCard
            title="선택 학생"
            value={data.selectedStudent}
            description="현재 localStorage 기준"
          />
          <AdminCard
            title="수행 기록"
            value={`${data.results.length}건`}
            description="미션 결과 데이터"
          />
          <AdminCard
            title="마음 기록"
            value={`${data.emotions.length}건`}
            description="감정 체크 데이터"
          />
          <AdminCard
            title="루틴 기록"
            value={`${data.routines.length}건`}
            description="루틴 체크 데이터"
          />
        </div>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-slate-600">데이터 작업</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            시연 준비와 초기화
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            샘플 데이터는 현재 브라우저에만 저장됩니다. 실제 서버 데이터는
            변경하지 않습니다.
          </p>

          {message && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black leading-6 text-emerald-950">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={createSampleData}
              className="min-h-12 rounded-lg bg-slate-900 px-6 py-3 text-base font-black text-white hover:bg-slate-800"
            >
              샘플 데이터 생성
            </button>

            <button
              type="button"
              onClick={refreshData}
              className="min-h-12 rounded-lg bg-white px-6 py-3 text-base font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              데이터 새로고침
            </button>

            <button
              type="button"
              onClick={clearAllData}
              className="min-h-12 rounded-lg bg-rose-600 px-6 py-3 text-base font-black text-white hover:bg-rose-700"
            >
              전체 기록 초기화
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.86fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-slate-600">최근 기록</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              최근 수행 기록 5건
            </h2>

            {data.recentResults.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-500 ring-1 ring-slate-200">
                저장된 수행 기록이 없습니다.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-black">학생명</th>
                      <th className="px-4 py-3 font-black">미션</th>
                      <th className="px-4 py-3 font-black">점수</th>
                      <th className="px-4 py-3 font-black">정서</th>
                      <th className="px-4 py-3 font-black">완료 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentResults.map((result, index) => (
                      <tr
                        key={`${result.studentName}-${result.mission}-${index}`}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-4 font-black text-slate-950">
                          {result.studentName}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {result.mission}
                        </td>
                        <td className="px-4 py-4 font-black text-slate-950">
                          {result.score}점
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {result.emotion}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-500">
                          {result.completedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-slate-600">바로가기</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              주요 화면 이동
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <QuickLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-base font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function AdminCard({
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
      <p className="mt-2 min-h-9 break-words text-xl font-black text-slate-900 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-center rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-200"
    >
      {label}
    </Link>
  );
}
