"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getSkillStatistics, getLearningLogs } from "@/utils/mission/storage";
import { SKILL_METAS, MissionSkill } from "@/types/learningMission";

type StudentResult = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
  skill?: string;
  difficulty?: number;
  hintsUsed?: number;
  wrongAttempts?: number;
  firstTryCorrect?: boolean;
};

type StudentStat = {
  studentName: string;
  count: number;
  averageScore: number;
  latest?: StudentResult;
  warningCount: number;
};

const sampleResults: StudentResult[] = [
  {
    studentName: "김하늘",
    mission: "키오스크 주문",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
  {
    studentName: "이도윤",
    mission: "버스 타기",
    score: 60,
    status: "완료",
    emotion: "보통",
    completedAt: "샘플 데이터",
  },
  {
    studentName: "박서아",
    mission: "학교생활 대화",
    score: 40,
    status: "주의",
    emotion: "걱정",
    completedAt: "샘플 데이터",
  },
];

const emptyResults = "[]";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSavedResults = () =>
  localStorage.getItem("haemileum_results") || emptyResults;

function readResults(resultsText: string) {
  try {
    const parsed = JSON.parse(resultsText) as StudentResult[];
    return parsed.length > 0 ? parsed : sampleResults;
  } catch {
    return sampleResults;
  }
}

export default function TeacherDashboardPage() {
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("전체");

  const savedResultsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedResults,
    () => emptyResults
  );

  const results = useMemo(() => readResults(savedResultsText), [savedResultsText]);
  const latestResult = results[results.length - 1];
  const totalRecords = results.length;
  const completedRecords = results.filter(
    (result) => result.status === "완료"
  ).length;
  const averageScore =
    totalRecords > 0
      ? Math.round(
          results.reduce((sum, result) => sum + normalizeScore(result.score), 0) /
            totalRecords
        )
      : 0;
  const warningRecords = results.filter(isWarningResult);
  const studentStats = getStudentStats(results);
  const missionStats = getMissionStats(results);
  const emotionStats = getEmotionStats(results);

  // 6대 핵심 역량 분석 데이터
  const skillStats = useMemo(() => {
    return getSkillStatistics(
      selectedStudentFilter === "전체" ? undefined : selectedStudentFilter
    );
  }, [savedResultsText, selectedStudentFilter]);

  const skillList: MissionSkill[] = [
    "key_info",
    "fact_opinion",
    "cause_effect",
    "social_context",
    "information_judgment",
    "claim_reason",
  ];

  // 취약 역량 탐색 (정답률 70% 미만 또는 가장 낮은 역량)
  const weakSkill = useMemo(() => {
    const validStats = Object.values(skillStats).filter((s) => s.completedCount > 0);
    if (validStats.length === 0) return null;
    return [...validStats].sort((a, b) => a.accuracyRate - b.accuracyRate)[0];
  }, [skillStats]);

  const clearResults = () => {
    localStorage.removeItem("haemileum_results");
    localStorage.removeItem("haemileum_learning_logs");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
            <div className="bg-sky-800 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-sky-100">교사 대시보드</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                학생 활동을 한눈에 확인합니다.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-sky-50">
                미션 수행, 정서 상태, 반복 기록을 모아 보고 오늘 필요한
                지도 포인트를 빠르게 정리합니다.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              <GuideCard
                title="먼저 주의 필요 기록을 봅니다"
                text="걱정, 불안, 낮은 점수 기록은 짧은 확인 대화로 연결합니다."
              />
              <GuideCard
                title="점수보다 반복 흐름을 봅니다"
                text="한 학생이 같은 활동을 다시 시도했는지 확인합니다."
              />
              <GuideCard
                title="가정 연계 문장을 남깁니다"
                text="학생이 해낸 일을 보호자에게 짧게 공유합니다."
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardCard
            title="전체 기록"
            value={`${totalRecords}건`}
            description="저장된 활동 기록"
          />
          <DashboardCard
            title="완료 기록"
            value={`${completedRecords}건`}
            description="완료 처리된 활동"
          />
          <DashboardCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="전체 활동 평균"
          />
          <DashboardCard
            title="주의 필요"
            value={`${warningRecords.length}건`}
            description="정서/점수 확인 필요"
            tone="warning"
          />
        </div>

        {latestResult && (
          <div className="mb-6 rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold text-sky-700">최근 활동</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {latestResult.studentName} · {latestResult.mission}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {latestResult.score}점 · {latestResult.status} · 정서{" "}
                  {latestResult.emotion} · {latestResult.completedAt}
                </p>
                <p className="mt-4 rounded-lg bg-sky-50 p-4 text-sm font-bold leading-6 text-sky-950 ring-1 ring-sky-100">
                  지도 포인트: {getTeacherComment(latestResult)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:flex-col">
                <Link
                  href="/mission/select"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-sky-800 px-5 py-3 text-sm font-black text-white hover:bg-sky-900"
                >
                  미션 배정 화면
                </Link>
                <Link
                  href="/student/select"
                  className="flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  학생 선택
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 6대 핵심 역량 성취도 및 취약 영역 분석 섹션 */}
        <section className="mb-6 rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800">
                  MVP 핵심 지표
                </span>
                <span className="text-xs font-bold text-slate-400">
                  초등 3~6학년 국어 연계
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                생활 국어 6대 핵심 역량 분석
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                각 핵심 영역별 정답률, 첫 시도 성공률, 힌트 의존도를 분석하여 맞춤 지도를 돕습니다.
              </p>
            </div>

            {/* 학생 필터 탭 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">학생 선택:</span>
              {["전체", "김하늘", "이도윤", "박서아"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStudentFilter(st)}
                  className={`rounded-full px-3 py-1 text-xs font-black transition-all ${
                    selectedStudentFilter === st
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 취약 역량 알림 배너 */}
          {weakSkill && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-xs font-black text-amber-900">
                    집중 지원 추천 영역: [{weakSkill.name}] (정답률 {weakSkill.accuracyRate}%)
                  </p>
                  <p className="text-xs font-semibold text-amber-800">
                    상황 제시 후 힌트 카드를 먼저 활용하도록 유도하고, 정답보다 까닭을 차분히 묻는 대화 지도가 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6개 스킬 분석 그리드 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skillList.map((skillKey) => {
              const meta = SKILL_METAS[skillKey];
              const stat = skillStats[skillKey];
              const rate = stat.accuracyRate;

              return (
                <div
                  key={skillKey}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-emerald-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.icon}</span>
                      <h3 className="text-sm font-black text-slate-900">
                        {meta.name}
                      </h3>
                    </div>
                    <span
                      className={`text-sm font-black ${
                        rate >= 80
                          ? "text-emerald-700"
                          : rate >= 60
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {rate}%
                    </span>
                  </div>

                  {/* 게이지 바 */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 80
                          ? "bg-emerald-500"
                          : rate >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.max(rate, 6)}%` }}
                    />
                  </div>

                  {/* 세부 통계 지표 */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>수행 {stat.completedCount}회</span>
                    <span>첫 시도 {stat.firstTryRate}%</span>
                    <span>힌트 {stat.totalHints}회</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/mission"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 transition"
            >
              교육콘텐츠 전체 목록 보기 ➔
            </Link>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-sky-700">우선 확인</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  주의 필요 기록
                </h2>
              </div>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">
                {warningRecords.length}건
              </span>
            </div>

            {warningRecords.length === 0 ? (
              <EmptyBox text="현재 주의가 필요한 기록은 없습니다." />
            ) : (
              <div className="grid gap-3">
                {warningRecords.slice(-4).reverse().map((result, index) => (
                  <AttentionItem
                    key={`${result.studentName}-${result.mission}-${index}`}
                    result={result}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-sky-700">학생별 요약</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              최근 흐름
            </h2>
            <div className="mt-5 grid gap-3">
              {studentStats.map((student) => (
                <StudentSummary key={student.studentName} student={student} />
              ))}
            </div>
          </section>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-sky-700">전체 기록</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                학생별 수행 결과
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                미션, 점수, 정서 상태, 완료 시간을 확인합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={clearResults}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
            >
              기록 초기화
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-black">학생명</th>
                  <th className="px-4 py-3 font-black">수행 미션</th>
                  <th className="px-4 py-3 font-black">점수</th>
                  <th className="px-4 py-3 font-black">상태</th>
                  <th className="px-4 py-3 font-black">정서</th>
                  <th className="px-4 py-3 font-black">완료 시간</th>
                  <th className="px-4 py-3 font-black">지도 포인트</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .slice()
                  .reverse()
                  .map((result, index) => (
                    <tr
                      key={`${result.studentName}-${result.mission}-${index}`}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-4 py-4 font-black text-slate-950">
                        {result.studentName}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {result.mission}
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {normalizeScore(result.score)}점
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={result.status} />
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {result.emotion || "기록 없음"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-500">
                        {result.completedAt}
                      </td>
                      <td className="px-4 py-4 font-semibold leading-6 text-slate-600">
                        {getTeacherComment(result)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function normalizeScore(score: number) {
  return Number.isFinite(score) ? score : 0;
}

function isWarningResult(result: StudentResult) {
  const emotion = result.emotion || "";
  return (
    result.status === "주의" ||
    ["불안", "걱정", "속상함"].includes(emotion) ||
    normalizeScore(result.score) < 50
  );
}

function getStudentStats(results: StudentResult[]): StudentStat[] {
  const map = new Map<
    string,
    { total: number; count: number; latest?: StudentResult; warningCount: number }
  >();

  results.forEach((result) => {
    const current = map.get(result.studentName) || {
      total: 0,
      count: 0,
      latest: undefined,
      warningCount: 0,
    };

    map.set(result.studentName, {
      total: current.total + normalizeScore(result.score),
      count: current.count + 1,
      latest: result,
      warningCount: current.warningCount + (isWarningResult(result) ? 1 : 0),
    });
  });

  return Array.from(map.entries()).map(([studentName, stat]) => ({
    studentName,
    averageScore: Math.round(stat.total / stat.count),
    count: stat.count,
    latest: stat.latest,
    warningCount: stat.warningCount,
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
    const emotion = result.emotion || "기록 없음";
    map.set(emotion, (map.get(emotion) || 0) + 1);
  });

  return Array.from(map.entries()).map(([emotion, count]) => ({
    emotion,
    count,
  }));
}

function getTeacherComment(result: StudentResult) {
  const emotion = result.emotion || "";

  if (["불안", "걱정", "속상함"].includes(emotion)) {
    return "짧은 확인 대화가 필요합니다. 감정을 먼저 인정하고 다음 활동을 천천히 안내하세요.";
  }

  if (normalizeScore(result.score) >= 80) {
    return "수행 흐름이 안정적입니다. 같은 주제의 조금 어려운 미션으로 확장할 수 있습니다.";
  }

  if (normalizeScore(result.score) >= 50) {
    return "기본 절차는 이해했습니다. 어려워한 단계만 짧게 다시 연습하면 좋습니다.";
  }

  return "단계별 안내와 시각적 힌트를 제공하며 같은 미션을 다시 시도하는 것이 좋습니다.";
}

function DashboardCard({
  title,
  value,
  description,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "warning";
}) {
  const valueClass =
    tone === "warning" ? "text-amber-700" : "text-sky-800";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-black sm:text-3xl ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
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

function AttentionItem({ result }: { result: StudentResult }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-black text-amber-950">
          {result.studentName}
        </p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-900 ring-1 ring-amber-200">
          {result.score}점 · {result.emotion || "기록 없음"}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold text-amber-900">{result.mission}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-amber-900">
        {getTeacherComment(result)}
      </p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-500 ring-1 ring-slate-200">
      {text}
    </div>
  );
}

function StudentSummary({ student }: { student: StudentStat }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-black text-slate-950">
          {student.studentName}
        </p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
          평균 {student.averageScore}점
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {student.count}건 수행 · 주의 {student.warningCount}건
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-sky-800">
        최근: {student.latest?.mission || "기록 없음"}
      </p>
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <p className="shrink-0 text-sm font-black text-sky-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "완료"
      ? "bg-emerald-100 text-emerald-800"
      : status === "주의"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status || "확인"}
    </span>
  );
}
