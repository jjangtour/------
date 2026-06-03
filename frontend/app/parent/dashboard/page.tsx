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

type RoutineRecord = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
  routines?: string[];
};

type EmotionRecord = {
  studentName: string;
  emotion: string;
  reason: string;
  stamp: string;
  completedAt: string;
};

const sampleStudent = "김하늘";

const sampleResults: StudentResult[] = [
  {
    studentName: sampleStudent,
    mission: "키오스크 주문",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
  {
    studentName: sampleStudent,
    mission: "루틴 체크",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
];

const sampleRoutines: RoutineRecord[] = [
  {
    studentName: sampleStudent,
    mission: "루틴 체크",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
    routines: [
      "정해진 시간에 일어나기",
      "가방 챙기기",
      "숙제 또는 알림 확인하기",
      "오늘 기분 말하기",
    ],
  },
];

const sampleEmotions: EmotionRecord[] = [
  {
    studentName: sampleStudent,
    emotion: "안정",
    reason: "친구와 이야기해서 좋았어요.",
    stamp: "오늘도 나를 잘 살폈어요",
    completedAt: "샘플 데이터",
  },
];

const homeGuideItems = [
  {
    title: "결과보다 과정을 칭찬하기",
    description: "점수보다 오늘 끝까지 해본 과정을 짧게 칭찬해 주세요.",
  },
  {
    title: "실제 생활에서 한 번 더 연습하기",
    description: "키오스크, 버스, 준비물 챙기기처럼 비슷한 상황을 가정에서 다시 이야기해 주세요.",
  },
  {
    title: "감정 표현을 기다려주기",
    description: "바로 답하지 못해도 괜찮습니다. 한 단어로 말해도 충분합니다.",
  },
];

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || sampleStudent;

const getSavedResults = () =>
  localStorage.getItem("haemileum_results") || "[]";

const getSavedRoutines = () =>
  localStorage.getItem("haemileum_routines") || "[]";

const getSavedEmotions = () =>
  localStorage.getItem("haemileum_emotions") || "[]";

function readJsonArray<T>(value: string): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export default function ParentDashboardPage() {
  const selectedStudent = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => sampleStudent
  );
  const resultsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedResults,
    () => "[]"
  );
  const routinesText = useSyncExternalStore(
    subscribeToStorage,
    getSavedRoutines,
    () => "[]"
  );
  const emotionsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedEmotions,
    () => "[]"
  );

  const results = useMemo(() => {
    const saved = readJsonArray<StudentResult>(resultsText).filter(
      (result) => result.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleResults;
  }, [resultsText, selectedStudent]);

  const routines = useMemo(() => {
    const saved = readJsonArray<RoutineRecord>(routinesText).filter(
      (routine) => routine.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleRoutines;
  }, [routinesText, selectedStudent]);

  const emotions = useMemo(() => {
    const saved = readJsonArray<EmotionRecord>(emotionsText).filter(
      (emotion) => emotion.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleEmotions;
  }, [emotionsText, selectedStudent]);

  const latestResult = results[results.length - 1];
  const latestRoutine = routines[routines.length - 1];
  const latestEmotion = emotions[emotions.length - 1];
  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, result) => sum + normalizeScore(result.score), 0) /
            results.length
        )
      : 0;
  const completedCount = results.filter(
    (result) => result.status === "완료"
  ).length;
  const homeMessage = latestResult
    ? getParentGuide(latestResult, latestEmotion)
    : "오늘 활동 기록을 확인하고, 아이가 해낸 작은 시도를 먼저 칭찬해 주세요.";

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-indigo-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.86fr]">
            <div className="bg-indigo-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-indigo-100">학부모 대시보드</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {selectedStudent} 학생의 오늘을
                <br />
                가정에서 이어갑니다.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-indigo-50">
                학교와 앱에서 해본 활동을 확인하고, 집에서 바로 해볼 수
                있는 짧은 대화와 반복 연습으로 연결합니다.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              <GuideCard
                title="먼저 해낸 일을 칭찬합니다"
                text="점수보다 시도한 행동과 끝까지 해본 시간을 말해 주세요."
              />
              <GuideCard
                title="어려웠던 장면은 짧게 묻습니다"
                text="왜 못 했어보다 어느 부분이 헷갈렸어가 좋습니다."
              />
              <GuideCard
                title="내일 하나만 다시 해봅니다"
                text="같은 활동을 작게 반복하면 생활 속 일반화에 도움이 됩니다."
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ParentCard
            title="최근 활동"
            value={latestResult?.mission || "기록 없음"}
            description="가장 최근 수행한 활동"
          />
          <ParentCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="활동 기록 평균"
          />
          <ParentCard
            title="완료 기록"
            value={`${completedCount}건`}
            description="완료 처리된 활동"
          />
          <ParentCard
            title="최근 마음"
            value={latestEmotion?.emotion || latestResult?.emotion || "확인 필요"}
            description="마음 기록 기준"
            tone="warm"
          />
        </div>

        <div className="mb-6 rounded-lg border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-indigo-700">오늘 가정 연계</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                오늘은 이렇게 이야기해 보세요
              </h2>
              <p className="mt-4 rounded-lg bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-950 ring-1 ring-indigo-100">
                {homeMessage}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:flex-col">
              <Link
                href="/student/home"
                className="flex min-h-11 items-center justify-center rounded-lg bg-indigo-700 px-5 py-3 text-sm font-black text-white hover:bg-indigo-800"
              >
                학생 홈 보기
              </Link>
              <Link
                href="/mission/select"
                className="flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                미션 같이 보기
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-indigo-700">최근 활동 기록</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              무엇을 연습했나요?
            </h2>

            <div className="mt-5 grid gap-3">
              {results
                .slice()
                .reverse()
                .slice(0, 5)
                .map((result, index) => (
                  <ActivityItem
                    key={`${result.mission}-${index}`}
                    result={result}
                  />
                ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-indigo-700">마음과 루틴</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              집에서 이어볼 내용
            </h2>

            <div className="mt-5 rounded-lg bg-rose-50 p-4 ring-1 ring-rose-100">
              <p className="text-sm font-bold text-rose-700">최근 마음 기록</p>
              <p className="mt-2 text-xl font-black text-rose-950">
                {latestEmotion?.emotion || latestResult?.emotion || "기록 없음"}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-rose-900">
                {latestEmotion?.reason && latestEmotion.reason !== "입력 없음"
                  ? latestEmotion.reason
                  : "오늘 마음을 묻고, 한 단어로 표현해도 기다려 주세요."}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {(latestRoutine?.routines || [
                "가방 챙기기",
                "오늘 기분 말하기",
                "내일 할 일 하나 정하기",
              ]).map((routine) => (
                <div
                  key={routine}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <p className="font-bold leading-6 text-slate-800">
                    {routine}
                  </p>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800">
                    가정 연계
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-indigo-700">실천 카드</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            오늘 바로 해볼 수 있는 말
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {homeGuideItems.map((item) => (
              <div key={item.title} className="rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
                <h3 className="text-lg font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/teacher/dashboard"
              className="rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              교사 대시보드 보기
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function normalizeScore(score: number) {
  return Number.isFinite(score) ? score : 0;
}

function getParentGuide(result: StudentResult, emotion?: EmotionRecord) {
  const feeling = emotion?.emotion || result.emotion || "";

  if (["불안", "걱정", "속상함"].includes(feeling)) {
    return "오늘은 결과보다 마음을 먼저 확인해 주세요. '어떤 부분이 어려웠어?'라고 짧게 물어보면 좋습니다.";
  }

  if (result.mission.includes("키오스크")) {
    return "다음 외출 때 실제 키오스크 화면을 함께 보며 메뉴 선택부터 천천히 다시 연습해 보세요.";
  }

  if (result.mission.includes("버스") || result.mission.includes("대중교통")) {
    return "집 근처 정류장 이름과 내려야 할 장소를 함께 확인해 주세요.";
  }

  if (result.mission.includes("대화")) {
    return "오늘 배운 표현을 가정 대화에서 한 문장으로 다시 말해보게 해 주세요.";
  }

  if (result.mission.includes("루틴")) {
    return "체크한 루틴 중 하나를 내일도 반복할 수 있도록 눈에 보이는 곳에 적어 주세요.";
  }

  return "오늘 한 활동을 짧게 회상하고, 스스로 선택한 점을 칭찬해 주세요.";
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

function ParentCard({
  title,
  value,
  description,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "warm";
}) {
  const valueClass = tone === "warm" ? "text-rose-700" : "text-indigo-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className={`mt-2 min-h-9 break-words text-xl font-black sm:text-2xl ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ActivityItem({ result }: { result: StudentResult }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-black text-slate-950">{result.mission}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-800 ring-1 ring-indigo-100">
          {normalizeScore(result.score)}점
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {result.status} · 정서 {result.emotion || "기록 없음"} ·{" "}
        {result.completedAt}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-indigo-800">
        {getParentGuide(result)}
      </p>
    </div>
  );
}
