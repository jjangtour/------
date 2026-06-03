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
  {
    studentName: "이도윤",
    mission: "대중교통 이용 연습",
    score: 20,
    status: "진행중",
    emotion: "보통",
    completedAt: "샘플 데이터",
  },
  {
    studentName: "박서아",
    mission: "학교생활 대화 연습",
    score: 10,
    status: "주의",
    emotion: "불안",
    completedAt: "샘플 데이터",
  },
];

export default function TeacherDashboardPage() {
  const [results, setResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    if (savedResults.length > 0) {
      setResults(savedResults);
    } else {
      setResults(sampleResults);
    }
  }, []);

  const totalStudents = results.length;
  const completedStudents = results.filter(
    (student) => student.status === "완료"
  ).length;

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, student) => sum + student.score, 0) /
            results.length
        )
      : 0;

  const warningStudents = results.filter(
    (student) => student.status === "주의"
  ).length;

  const clearResults = () => {
    localStorage.removeItem("haemileum_results");
    setResults(sampleResults);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">교사용 관리 화면</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            해밀이음 교사 대시보드
          </h1>
          <p className="mt-3 text-slate-600">
            학생의 일상 시뮬레이션 수행 결과와 정서 상태를 한눈에 확인하는 화면입니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <DashboardCard
            title="전체 수행 기록"
            value={`${totalStudents}건`}
            description="저장된 미션 수행 결과"
          />
          <DashboardCard
            title="미션 완료"
            value={`${completedStudents}건`}
            description="완료 처리된 미션"
          />
          <DashboardCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="시뮬레이션 평균 점수"
          />
          <DashboardCard
            title="주의 필요"
            value={`${warningStudents}건`}
            description="추가 관찰 필요 기록"
          />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                학생별 수행 결과
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                미션 수행 결과, 점수, 정서 상태, 완료 시간을 확인합니다.
              </p>
            </div>

            <button
              onClick={clearResults}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              기록 초기화
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">학생명</th>
                  <th className="px-4 py-3 font-semibold">수행 미션</th>
                  <th className="px-4 py-3 font-semibold">점수</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">정서 상태</th>
                  <th className="px-4 py-3 font-semibold">완료 시간</th>
                </tr>
              </thead>
              <tbody>
                {results.map((student, index) => (
                  <tr key={`${student.studentName}-${index}`} className="border-t border-slate-200">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {student.mission}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {student.score}점
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {student.emotion}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {student.completedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
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
      <p className="mt-3 text-3xl font-bold text-blue-700">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "완료"
      ? "bg-green-100 text-green-700"
      : status === "주의"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}