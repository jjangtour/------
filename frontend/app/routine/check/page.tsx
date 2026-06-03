"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RoutineItem = {
  id: string;
  title: string;
  description: string;
};

const routineItems: RoutineItem[] = [
  {
    id: "wake-up",
    title: "아침에 스스로 일어나기",
    description: "정해진 시간에 일어났는지 확인합니다.",
  },
  {
    id: "bag",
    title: "가방 챙기기",
    description: "책, 필통, 준비물을 스스로 챙겼는지 확인합니다.",
  },
  {
    id: "homework",
    title: "숙제 또는 알림장 확인하기",
    description: "오늘 해야 할 일을 확인했는지 점검합니다.",
  },
  {
    id: "emotion",
    title: "오늘 기분 말하기",
    description: "오늘의 기분을 한 단어로 표현합니다.",
  },
  {
    id: "tomorrow",
    title: "내일 할 일 하나 정하기",
    description: "내일 실천할 작은 목표를 정합니다.",
  },
];

export default function RoutineCheckPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("이름 미선택");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("haemileum_selected_student") || "이름 미선택";

    setStudentName(savedStudent);
  }, []);

  const toggleRoutine = (routineId: string) => {
    setCheckedItems((prev) =>
      prev.includes(routineId)
        ? prev.filter((id) => id !== routineId)
        : [...prev, routineId]
    );
  };

  const saveRoutine = () => {
    if (checkedItems.length === 0) {
      alert("완료한 루틴을 하나 이상 선택해 주세요.");
      return;
    }

    const completedTitles = routineItems
      .filter((item) => checkedItems.includes(item.id))
      .map((item) => item.title);

    const score = checkedItems.length * 10;

    const routineRecord = {
      studentName,
      mission: "마이 루틴 체크",
      score,
      status: "완료",
      emotion: checkedItems.length >= 4 ? "안정" : "보통",
      completedAt: new Date().toLocaleString("ko-KR"),
      routines: completedTitles,
    };

    const savedRoutines = JSON.parse(
      localStorage.getItem("haemileum_routines") || "[]"
    );

    savedRoutines.push(routineRecord);

    localStorage.setItem("haemileum_routines", JSON.stringify(savedRoutines));

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    savedResults.push({
      studentName,
      mission: "마이 루틴 체크",
      score,
      status: "완료",
      emotion: checkedItems.length >= 4 ? "안정" : "보통",
      completedAt: new Date().toLocaleString("ko-KR"),
    });

    localStorage.setItem("haemileum_results", JSON.stringify(savedResults));

    alert("루틴 체크 결과가 저장되었습니다.");
    router.push("/teacher/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">
            [음] 마이 루틴
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {studentName} 학생의 마이 루틴 체크
          </h1>
          <p className="mt-3 text-slate-600">
            오늘 실천한 작은 생활 과업을 체크하고 성취감을 기록합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {routineItems.map((item) => {
            const isChecked = checkedItems.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => toggleRoutine(item.id)}
                className={`rounded-2xl border p-6 text-left shadow-sm ${
                  isChecked
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-lg font-bold ${
                      isChecked
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">오늘의 결과</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryItem
              title="완료한 루틴"
              value={`${checkedItems.length}개`}
            />
            <SummaryItem
              title="예상 점수"
              value={`${checkedItems.length * 10}점`}
            />
            <SummaryItem title="학생명" value={studentName} />
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={saveRoutine}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              루틴 결과 저장하기
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
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}