"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type EmotionRecord = {
  studentName: string;
  emotion: string;
  reason: string;
  stamp: string;
  completedAt: string;
};

type EmotionOption = {
  label: string;
  value: string;
  helper: string;
  icon: string;
  color: string;
};

const emotions: EmotionOption[] = [
  {
    label: "기뻐요",
    value: "기쁨",
    helper: "웃고 싶고 몸이 가벼워요.",
    icon: "😊",
    color: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    label: "괜찮아요",
    value: "안정",
    helper: "크게 힘들지 않고 차분해요.",
    icon: "🙂",
    color: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  {
    label: "걱정돼요",
    value: "걱정",
    helper: "마음이 불편하거나 생각이 많아요.",
    icon: "😟",
    color: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    label: "속상해요",
    value: "속상함",
    helper: "울고 싶거나 마음이 무거워요.",
    icon: "😢",
    color: "border-rose-200 bg-rose-50 text-rose-950",
  },
];

const stamps = [
  "오늘도 나를 잘 살폈어요",
  "끝까지 해보려고 했어요",
  "차분하게 말해보았어요",
  "다시 도전할 수 있어요",
];

const guideCards = [
  {
    title: "정답은 없어요",
    text: "지금 마음과 가장 가까운 것을 고르면 됩니다.",
  },
  {
    title: "쓰기 싫으면 비워도 돼요",
    text: "짧게 써도 되고, 이유를 쓰지 않아도 됩니다.",
  },
  {
    title: "도움이 필요하면 말해요",
    text: "걱정되거나 속상하면 선생님이나 보호자에게 알려주세요.",
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

export default function EmotionCheckPage() {
  const router = useRouter();
  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );

  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [reason, setReason] = useState("");
  const [selectedStamp, setSelectedStamp] = useState("");
  const [message, setMessage] = useState("");
  const selectedEmotionInfo = emotions.find(
    (emotion) => emotion.value === selectedEmotion
  );

  const saveEmotion = () => {
    if (!selectedEmotion) {
      setMessage("먼저 오늘 마음을 하나 골라주세요.");
      return;
    }

    if (!selectedStamp) {
      setMessage("나에게 줄 칭찬 문장을 하나 골라주세요.");
      return;
    }

    const completedAt = new Date().toLocaleString("ko-KR");
    const emotionRecord: EmotionRecord = {
      studentName,
      emotion: selectedEmotion,
      reason: reason.trim() || "입력 없음",
      stamp: selectedStamp,
      completedAt,
    };

    const savedEmotionRecords =
      readJsonArray<EmotionRecord>("haemileum_emotions");
    savedEmotionRecords.push(emotionRecord);
    localStorage.setItem(
      "haemileum_emotions",
      JSON.stringify(savedEmotionRecords)
    );

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
      mission: "마음 고르기",
      score: 100,
      status: "완료",
      emotion: selectedEmotion,
      completedAt,
    });

    localStorage.setItem("haemileum_results", JSON.stringify(savedResults));
    setMessage("저장됐어요. 오늘 마음을 잘 살펴봤습니다.");
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-rose-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-rose-600 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-rose-100">마음 이음</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName} 학생,
                <br />
                오늘 마음을 골라요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-rose-50">
                마음은 매일 달라질 수 있습니다. 지금과 가장 가까운 것을
                천천히 골라보세요.
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-rose-700">1단계</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              지금 마음과 가까운 것을 골라요
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {emotions.map((emotion) => {
                const isSelected = selectedEmotion === emotion.value;

                return (
                  <button
                    key={emotion.value}
                    type="button"
                    onClick={() => {
                      setSelectedEmotion(emotion.value);
                      setMessage("");
                    }}
                    className={`rounded-lg border p-5 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-rose-200 ${emotion.color} ${
                      isSelected
                        ? "ring-4 ring-rose-200"
                        : "hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                        {emotion.icon}
                      </span>
                      <div>
                        <p className="text-xl font-black">{emotion.label}</p>
                        <p className="mt-1 text-sm font-black opacity-70">
                          {emotion.value}
                        </p>
                        <p className="mt-3 text-sm font-semibold leading-6 opacity-80">
                          {emotion.helper}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-rose-700">2단계</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              이유를 적거나 바로 넘어가요
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              쓰기 어려우면 비워도 됩니다. 한 단어만 써도 괜찮습니다.
            </p>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 친구와 이야기해서 기뻤어요."
              className="mt-5 h-36 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 text-base font-semibold leading-7 outline-none focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />

            <div className="mt-6">
              <p className="text-sm font-bold text-rose-700">3단계</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                나에게 줄 칭찬을 골라요
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {stamps.map((stamp) => (
                  <button
                    key={stamp}
                    type="button"
                    onClick={() => {
                      setSelectedStamp(stamp);
                      setMessage("");
                    }}
                    className={`rounded-lg border px-4 py-3 text-left text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-rose-200 ${
                      selectedStamp === stamp
                        ? "border-rose-300 bg-rose-50 text-rose-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {stamp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryItem
              title="고른 마음"
              value={selectedEmotionInfo?.label || "아직 고르지 않음"}
              helper={selectedEmotionInfo?.value || "위에서 하나를 골라요"}
            />
            <SummaryItem
              title="칭찬 문장"
              value={selectedStamp || "아직 고르지 않음"}
              helper="나에게 해주는 말"
            />
            <SummaryItem
              title="학생 이름"
              value={studentName}
              helper="기록될 이름"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-950">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveEmotion}
              className="min-h-12 rounded-lg bg-rose-600 px-6 py-3 text-base font-black text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
            >
              마음 기록 저장하기
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
      <p className="mt-2 break-words text-lg font-black text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {helper}
      </p>
    </div>
  );
}
