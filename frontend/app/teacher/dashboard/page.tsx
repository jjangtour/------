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
    status: "완료",
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

  const totalRecords = results.length;

  const completedRecords = results.filter(
    (result) => result.status === "완료"
  ).length;

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.score, 0) /
            results.length
        )
      : 0;

  const warningRecords = results.filter(
    (result) => result.status === "주의" || result.emotion === "불안"
  ).length;

  const latestResult = results[results.length - 1];

  const studentStats = getStudentStats(results);
  const missionStats = getMissionStats(results);
  const emotionStats = getEmotionStats(results);

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
            학생의 시뮬레이션 수행 결과, 정서 상태, 반복 훈련 이력을 확인합니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="전체 수행 기록"
            value={`${totalRecords}건`}
            description="저장된 미션 수행 결과"
          />
          <DashboardCard
            title="미션 완료"
            value={`${completedRecords}건`}
            description="완료 처리된 미션"
          />
          <DashboardCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="전체 수행 평균"
          />
          <DashboardCard
            title="주의 필요"
            value={`${warningRecords}건`}
            description="불안 또는 주의 기록"
          />
        </div>

        {latestResult && (
          <div className="mb-8 rounded-2xl bg-blue-700 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-blue-100">
              최근 수행 기록
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {latestResult.studentName} · {latestResult.mission}
            </h2>
            <p className="mt-3 text-blue-100">
              점수 {latestResult.score}점 / 정서 상태 {latestResult.emotion} /{" "}
              {latestResult.completedAt}
            </p>
            <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm leading-6 text-blue-50">
              지도 코멘트: {getTeacherComment(latestResult)}
            </p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SummaryPanel title="학생별 평균 점수">
            {studentStats.map((student) => (
              <SummaryRow
                key={student.studentName}
                label={student.studentName}
                value={`${student.averageScore}점 / ${student.count}건`}
              />
            ))}
          </SummaryPanel>

          <SummaryPanel title="미션별 수행 횟수">
            {missionStats.map((mission) => (
              <SummaryRow
                key={mission.mission}
                label={mission.mission}
                value={`${mission.count}건`}
              />
            ))}
          </SummaryPanel>

          <SummaryPanel title="정서 상태 요약">
            {emotionStats.map((emotion) => (
              <SummaryRow
                key={emotion.emotion}
                label={emotion.emotion}
                value={`${emotion.count}건`}
              />
            ))}
          </SummaryPanel>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
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

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">학생명</th>
                  <th className="px-4 py-3 font-semibold">수행 미션</th>
                  <th className="px-4 py-3 font-semibold">점수</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">정서 상태</th>
                  <th className="px-4 py-3 font-semibold">완료 시간</th>
                  <th className="px-4 py-3 font-semibold">지도 코멘트</th>
                </tr>
              </thead>
              <tbody>
                {results.map((student, index) => (
                  <tr
                    key={`${student.studentName}-${student.mission}-${index}`}
                    className="border-t border-slate-200"
                  >
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
                    <td className="px-4 py-4 text-slate-600">
                      {getTeacherComment(student)}
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

function getStudentStats(results: StudentResult[]) {
  const map = new Map<string, { total: number; count: number }>();

  results.forEach((result) => {
    const current = map.get(result.studentName) || { total: 0, count: 0 };

    map.set(result.studentName, {
      total: current.total + result.score,
      count: current.count + 1,
    });
  });

  return Array.from(map.entries()).map(([studentName, stat]) => ({
    studentName,
    averageScore: Math.round(stat.total / stat.count),
    count: stat.count,
  }));
}

function getMissionStats(results: StudentResult[]) {
  const map = new Map<string, number>();

  results.forEach((result) => {
    map.set(result.mission, (map.get(result.mission) || 0) + 1);
  });

  return Array.from(map.entries()).map(([mission, count]) => ({
    mission,
    count,
  }));
}

function getEmotionStats(results: StudentResult[]) {
  const map = new Map<string, number>();

  results.forEach((result) => {
    map.set(result.emotion, (map.get(result.emotion) || 0) + 1);
  });

  return Array.from(map.entries()).map(([emotion, count]) => ({
    emotion,
    count,
  }));
}

function getTeacherComment(result: StudentResult) {
  if (result.emotion === "불안") {
    return "정서 상태 관찰이 필요합니다. 짧은 대화와 재도전 기회를 제공하세요.";
  }

  if (result.score >= 30) {
    return "수행 흐름이 안정적입니다. 다음 단계 미션으로 확장 가능합니다.";
  }

  if (result.score >= 20) {
    return "기본 절차는 이해했습니다. 오답 장면을 중심으로 반복 연습이 필요합니다.";
  }

  return "단계별 안내와 시각적 힌트를 제공하며 천천히 다시 연습하는 것이 좋습니다.";
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

function SummaryPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-sm font-bold text-blue-700">{value}</p>
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
