"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EmotionRecord = {
  studentName: string;
  emotion: string;
  reason: string;
  stamp: string;
  completedAt: string;
};

const emotions = [
  {
    label: "기뻐요",
    value: "기쁨",
    emoji: "😊",
  },
  {
    label: "괜찮아요",
    value: "안정",
    emoji: "🙂",
  },
  {
    label: "걱정돼요",
    value: "불안",
    emoji: "😟",
  },
  {
    label: "속상해요",
    value: "속상함",
    emoji: "😢",
  },
];

const stamps = [
  "오늘도 해냈어요",
  "끝까지 노력했어요",
  "차분하게 말했어요",
  "다시 도전했어요",
];

export default function EmotionCheckPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("이름 미선택");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [reason, setReason] = useState("");
  const [selectedStamp, setSelectedStamp] = useState("");

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("haemileum_selected_student") || "이름 미선택";

    setStudentName(savedStudent);
  }, []);

  const saveEmotion = () => {
    if (!selectedEmotion) {
      alert("오늘 기분을 선택해 주세요.");
      return;
    }

    if (!selectedStamp) {
      alert("칭찬 스탬프를 선택해 주세요.");
      return;
    }

    const emotionRecord: EmotionRecord = {
      studentName,
      emotion: selectedEmotion,
      reason: reason || "입력 없음",
      stamp: selectedStamp,
      completedAt: new Date().toLocaleString("ko-KR"),
    };

    const savedEmotionRecords = JSON.parse(
      localStorage.getItem("haemileum_emotions") || "[]"
    );

    savedEmotionRecords.push(emotionRecord);

    localStorage.setItem(
      "haemileum_emotions",
      JSON.stringify(savedEmotionRecords)
    );

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    savedResults.push({
      studentName,
      mission: "감정 기록 및 칭찬 스탬프",
      score: 10,
      status: "완료",
      emotion: selectedEmotion,
      completedAt: new Date().toLocaleString("ko-KR"),
    });

    localStorage.setItem("haemileum_results", JSON.stringify(savedResults));

    alert("감정 기록이 저장되었습니다.");
    router.push("/teacher/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">
            [음] 마음 이음
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {studentName} 학생의 감정 기록
          </h1>
          <p className="mt-3 text-slate-600">
            오늘의 기분을 고르고, 스스로 잘한 점을 칭찬 스탬프로 기록합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              오늘 기분 선택
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              지금 가장 가까운 기분을 하나 선택하세요.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {emotions.map((emotion) => (
                <button
                  key={emotion.value}
                  onClick={() => setSelectedEmotion(emotion.value)}
                  className={`rounded-2xl border p-5 text-center ${
                    selectedEmotion === emotion.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-4xl">{emotion.emoji}</p>
                  <p className="mt-3 font-bold text-slate-900">
                    {emotion.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {emotion.value}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              기분 이유 적기
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              짧게 적어도 됩니다. 말하기 어려우면 비워 두어도 됩니다.
            </p>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 친구와 이야기해서 기뻤어요."
              className="mt-6 h-40 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500"
            />

            <div className="mt-6">
              <h3 className="font-bold text-slate-900">칭찬 스탬프 선택</h3>
              <div className="mt-3 grid grid-cols-1 gap-3">
                {stamps.map((stamp) => (
                  <button
                    key={stamp}
                    onClick={() => setSelectedStamp(stamp)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                      selectedStamp === stamp
                        ? "border-blue-500 bg-blue-50 text-blue-700"
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

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">기록 확인</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryItem title="선택한 기분" value={selectedEmotion || "미선택"} />
            <SummaryItem title="칭찬 스탬프" value={selectedStamp || "미선택"} />
            <SummaryItem title="학생명" value={studentName} />
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={saveEmotion}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              감정 기록 저장하기
            </button>

            <button
              onClick={() => router.push("/mission/select")}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              미션 선택으로 돌아가기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 font-bold text-slate-900">{value}</p>
    </div>
  );
}