"use client";

import { useEffect, useState } from "react";

type StudentResult = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

const sampleResults: StudentResult[] = [
  {
    studentName: "김하늘",
    mission: "키오스크 주문 연습",
    score: 30,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
];

const homeRoutines = [
  {
    title: "가방 스스로 챙기기",
    status: "오늘 확인",
  },
  {
    title: "내일 준비물 말하기",
    status: "가정에서 지도",
  },
  {
    title: "오늘 기분 한마디로 표현하기",
    status: "저녁 루틴",
  },
];

export default function ParentDashboardPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("김하늘");

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("haemileum_selected_student") || "김하늘";

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    setSelectedStudent(savedStudent);

    const filteredResults = savedResults.filter(
      (result: StudentResult) => result.studentName === savedStudent
    );

    if (filteredResults.length > 0) {
      setResults(filteredResults);
    } else {
      setResults(sampleResults);
    }
  }, []);

  const latestResult = results[results.length - 1];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">학부모 화면</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {selectedStudent} 학생의 가정 연계 현황
          </h1>
          <p className="mt-3 text-slate-600">
            학교에서 수행한 시뮬레이션 결과와 가정에서 이어갈 생활 루틴을 확인합니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ParentCard
            title="최근 미션"
            value={latestResult?.mission || "기록 없음"}
            description="가장 최근 수행한 미션"
          />
          <ParentCard
            title="최근 점수"
            value={`${latestResult?.score || 0}점`}
            description="최근 미션 수행 점수"
          />
          <ParentCard
            title="정서 상태"
            value={latestResult?.emotion || "확인 필요"}
            description="최근 기록 기준"
          />
          <ParentCard
            title="완료 상태"
            value={latestResult?.status || "미완료"}
            description="미션 수행 여부"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              최근 수행 기록
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              자녀가 수행한 미션 기록을 확인합니다.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">미션</th>
                    <th className="px-4 py-3 font-semibold">점수</th>
                    <th className="px-4 py-3 font-semibold">정서</th>
                    <th className="px-4 py-3 font-semibold">완료 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={`${result.mission}-${index}`}
                      className="border-t border-slate-200"
                    >
                      <td className="px-4 py-4 text-slate-700">
                        {result.mission}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {result.score}점
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {result.emotion}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {result.completedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              가정 연계 루틴
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              학교 활동 후 가정에서 반복하면 좋은 생활 과업입니다.
            </p>

            <div className="mt-5 space-y-4">
              {homeRoutines.map((routine) => (
                <div
                  key={routine.title}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {routine.title}
                    </p>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {routine.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                학부모 안내
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-700">
                결과 점수보다 중요한 것은 반복 연습입니다. 오늘 수행한 미션과 연결되는 생활 상황을 짧게 다시 이야기해 주세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ParentCard({
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