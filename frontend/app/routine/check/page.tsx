"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type RoutineItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  time: string;
};

type RoutineRecord = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
  routines: string[];
};

const routineItems: RoutineItem[] = [
  {
    id: "wake-up",
    title: "정해진 시간에 일어나기",
    description: "아침에 스스로 일어났거나, 일어나려고 노력했나요?",
    icon: "☀️",
    time: "아침",
  },
  {
    id: "bag",
    title: "가방 챙기기",
    description: "책, 필통, 준비물을 확인했나요?",
    icon: "🎒",
    time: "등교 전",
  },
  {
    id: "homework",
    title: "숙제 또는 알림 확인하기",
    description: "오늘 해야 할 일을 한 번 살펴봤나요?",
    icon: "📘",
    time: "오후",
  },
  {
    id: "emotion",
    title: "오늘 기분 말하기",
    description: "내 마음을 말이나 표정으로 표현해봤나요?",
    icon: "💬",
    time: "언제든",
  },
  {
    id: "tomorrow",
    title: "내일 할 일 하나 정하기",
    description: "내일 해볼 작은 목표를 하나 골랐나요?",
    icon: "⭐",
    time: "저녁",
  },
];

const guideCards = [
  {
    title: "전부 하지 않아도 괜찮아요",
    text: "오늘 한 것만 체크하면 됩니다.",
  },
  {
    title: "작은 성공도 기록해요",
    text: "하나를 해낸 것도 좋은 연습입니다.",
  },
  {
    title: "도움받은 것도 성공이에요",
    text: "혼자 못 해도 함께 해봤다면 체크해도 됩니다.",
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

function readJsonArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

export default function RoutineCheckPage() {
  const router = useRouter();
  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );

  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const completedCount = checkedItems.length;
  const totalCount = routineItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const score = completedCount * 20;

  const toggleRoutine = (routineId: string) => {
    setMessage("");
    setCheckedItems((prev) =>
      prev.includes(routineId)
        ? prev.filter((id) => id !== routineId)
        : [...prev, routineId]
    );
  };

  const saveRoutine = () => {
    if (checkedItems.length === 0) {
      setMessage("오늘 해본 일을 하나 이상 체크해주세요.");
      return;
    }

    const completedTitles = routineItems
      .filter((item) => checkedItems.includes(item.id))
      .map((item) => item.title);
    const completedAt = new Date().toLocaleString("ko-KR");
    const routineRecord: RoutineRecord = {
      studentName,
      mission: "루틴 체크",
      score,
      status: "완료",
      emotion: checkedItems.length >= 4 ? "안정" : "보통",
      completedAt,
      routines: completedTitles,
    };

    const savedRoutines = readJsonArray<RoutineRecord>("haemileum_routines");
    savedRoutines.push(routineRecord);
    localStorage.setItem("haemileum_routines", JSON.stringify(savedRoutines));

    const savedResults = readJsonArray<{
      studentName: string;
      mission: string;
      score: number;
      status: string;
      emotion: string;
      completedAt: string;
    }>("haemileum_results");

    savedResults.push({
      studentName,
      mission: "루틴 체크",
      score,
      status: "완료",
      emotion: checkedItems.length >= 4 ? "안정" : "보통",
      completedAt,
    });

    localStorage.setItem("haemileum_results", JSON.stringify(savedResults));
    setMessage("저장됐어요. 오늘 해낸 일을 잘 기록했습니다.");
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">마이 루틴</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName} 학생,
                <br />
                오늘 해낸 일을 체크해요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                다 하지 않아도 괜찮습니다. 오늘 해본 일을 하나씩 눌러
                기록해보세요.
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

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-700">오늘의 진행</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {completedCount}개를 체크했어요
              </h2>
            </div>
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
              {progress}%
            </div>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {routineItems.map((item) => {
            const isChecked = checkedItems.includes(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleRoutine(item.id)}
                className={`rounded-lg border p-5 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-200 ${
                  isChecked
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-black/5">
                    {item.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-black/5">
                        {item.time}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ring-black/5 ${
                          isChecked
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isChecked ? "완료" : "체크 전"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black leading-tight sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 opacity-80 sm:text-base">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-xl font-black ${
                      isChecked
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-300 bg-white text-slate-300"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryItem
              title="완료한 루틴"
              value={`${completedCount}개`}
              helper={`전체 ${totalCount}개 중`}
            />
            <SummaryItem title="오늘 점수" value={`${score}점`} helper="체크한 만큼 올라가요" />
            <SummaryItem title="학생 이름" value={studentName} helper="기록될 이름" />
          </div>

          {message && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-950">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveRoutine}
              className="min-h-12 rounded-lg bg-emerald-700 px-6 py-3 text-base font-black text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              루틴 결과 저장하기
            </button>

            <button
              type="button"
              onClick={() => router.push("/student/home")}
              className="min-h-12 rounded-lg bg-white px-6 py-3 text-base font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              학생 홈으로 가기
            </button>

            <button
              type="button"
              onClick={() => router.push("/mission/select")}
              className="min-h-12 rounded-lg bg-white px-6 py-3 text-base font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              다른 미션 고르기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 break-words text-xl font-black text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}
