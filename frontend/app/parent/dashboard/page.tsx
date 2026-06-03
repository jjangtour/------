"use client";

import { useEffect, useState } from "react";
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
    studentName: "김하늘",
    mission: "마이 루틴 체크",
    score: 40,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
];

const sampleRoutines: RoutineRecord[] = [
  {
    studentName: "김하늘",
    mission: "마이 루틴 체크",
    score: 40,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
    routines: [
      "아침에 스스로 일어나기",
      "가방 챙기기",
      "숙제 또는 알림장 확인하기",
      "오늘 기분 말하기",
    ],
  },
];

const homeGuideItems = [
  {
    title: "결과보다 반복을 칭찬하기",
    description: "점수보다 오늘 끝까지 해본 과정을 짧게 칭찬해 주세요.",
  },
  {
    title: "실제 생활에서 한 번 더 연습하기",
    description: "키오스크, 버스, 준비물 챙기기 등 비슷한 상황을 가정에서 다시 이야기해 주세요.",
  },
  {
    title: "감정 표현을 기다려주기",
    description: "바로 답하지 못해도 괜찮습니다. 한 단어로 말해도 충분합니다.",
  },
];

export default function ParentDashboardPage() {
  const [selectedStudent, setSelectedStudent] = useState("김하늘");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);

  useEffect(() => {
    const savedStudent =
      localStorage.getItem("haemileum_selected_student") || "김하늘";

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    const savedRoutines = JSON.parse(
      localStorage.getItem("haemileum_routines") || "[]"
    );

    const filteredResults = savedResults.filter(
      (result: StudentResult) => result.studentName === savedStudent
    );

    const filteredRoutines = savedRoutines.filter(
      (routine: RoutineRecord) => routine.studentName === savedStudent
    );

    setSelectedStudent(savedStudent);
    setResults(filteredResults.length > 0 ? filteredResults : sampleResults);
    setRoutines(filteredRoutines.length > 0 ? filteredRoutines : sampleRoutines);
  }, []);

  const latestResult = results[results.length - 1];
  const latestRoutine = routines[routines.length - 1];

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.score, 0) /
            results.length
        )
      : 0;

  const completedCount = results.filter(
    (result) => result.status === "완료"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">학부모 화면</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {selectedStudent} 학생의 가정 연계 현황
          </h1>
          <p className="mt-3 text-slate-600">
            학교에서 수행한 미션 결과와 정서 상태를 가정에서 쉽게 확인하고,
            생활 속 반복 연습으로 연결합니다.
          </p>
        </div>

        {latestResult && (
          <div className="mb-8 rounded-3xl bg-blue-700 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold text-blue-100">
              최근 자녀 활동
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              {latestResult.mission}
            </h2>
            <p className="mt-4 text-blue-100">
              {latestResult.score}점 · 정서 상태 {latestResult.emotion} ·{" "}
              {latestResult.completedAt}
            </p>
            <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-blue-50">
              가정 지도 포인트: {getParentGuide(latestResult)}
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ParentCard
            title="최근 미션"
            value={latestResult?.mission || "기록 없음"}
            description="가장 최근 수행한 미션"
          />
          <ParentCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="자녀 수행 기록 평균"
          />
          <ParentCard
            title="완료 기록"
            value={`${completedCount}건`}
            description="완료 처리된 활동"
          />
          <ParentCard
            title="정서 상태"
            value={latestResult?.emotion || "확인 필요"}
            description="최근 기록 기준"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              최근 수행 기록
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              자녀가 수행한 미션과 점수, 정서 상태를 확인합니다.
            </p>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
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
              루틴 수행 요약
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              오늘 가정에서도 이어갈 수 있는 생활 루틴입니다.
            </p>

            <div className="mt-5 space-y-3">
              {(latestRoutine?.routines || [
                "가방 챙기기",
                "오늘 기분 말하기",
                "내일 할 일 하나 정하기",
              ]).map((routine) => (
                <div
                  key={routine}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">{routine}</p>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    가정 연계
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                선생님 안내 메시지
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-700">
                오늘 수행한 미션을 가정에서 1분 정도 다시 이야기해 주세요.
                정답을 맞혔는지보다 스스로 선택해 본 경험을 칭찬하는 것이 중요합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            가정 연계 실천 카드
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            학부모가 오늘 바로 실천할 수 있는 짧은 지도 방법입니다.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {homeGuideItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-slate-50 p-5"
              >
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/student/home"
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              학생 홈 보기
            </Link>
            <Link
              href="/teacher/dashboard"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              교사 대시보드 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function getParentGuide(result: StudentResult) {
  if (result.emotion === "불안") {
    return "오늘은 결과보다 마음을 먼저 확인해 주세요. '어떤 부분이 어려웠어?'라고 짧게 물어보면 좋습니다.";
  }

  if (result.mission.includes("키오스크")) {
    return "다음 외출 시 실제 키오스크 화면을 함께 보며 메뉴 선택부터 다시 연습해 보세요.";
  }

  if (result.mission.includes("대중교통")) {
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
