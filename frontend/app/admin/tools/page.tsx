"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResultRecord = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

export default function AdminToolsPage() {
  const [selectedStudent, setSelectedStudent] = useState("없음");
  const [resultCount, setResultCount] = useState(0);
  const [emotionCount, setEmotionCount] = useState(0);
  const [routineCount, setRoutineCount] = useState(0);
  const [results, setResults] = useState<ResultRecord[]>([]);

  const loadData = () => {
    const student =
      localStorage.getItem("haemileum_selected_student") || "없음";

    const savedResults = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );

    const savedEmotions = JSON.parse(
      localStorage.getItem("haemileum_emotions") || "[]"
    );

    const savedRoutines = JSON.parse(
      localStorage.getItem("haemileum_routines") || "[]"
    );

    setSelectedStudent(student);
    setResultCount(savedResults.length);
    setEmotionCount(savedEmotions.length);
    setRoutineCount(savedRoutines.length);
    setResults(savedResults.slice(-5).reverse());
  };

  useEffect(() => {
    loadData();
  }, []);

  const createSampleData = () => {
    const now = new Date().toLocaleString("ko-KR");

    const sampleResults: ResultRecord[] = [
      {
        studentName: "김하늘",
        mission: "키오스크 주문 연습",
        score: 30,
        status: "완료",
        emotion: "안정",
        completedAt: now,
      },
      {
        studentName: "이도윤",
        mission: "대중교통 이용 연습",
        score: 20,
        status: "완료",
        emotion: "보통",
        completedAt: now,
      },
      {
        studentName: "박서아",
        mission: "학교생활 대화 연습",
        score: 30,
        status: "완료",
        emotion: "안정",
        completedAt: now,
      },
      {
        studentName: "김하늘",
        mission: "감정 기록 및 칭찬 스탬프",
        score: 10,
        status: "완료",
        emotion: "기쁨",
        completedAt: now,
      },
      {
        studentName: "김하늘",
        mission: "마이 루틴 체크",
        score: 40,
        status: "완료",
        emotion: "안정",
        completedAt: now,
      },
    ];

    localStorage.setItem("haemileum_results", JSON.stringify(sampleResults));
    localStorage.setItem("haemileum_selected_student", "김하늘");

    localStorage.setItem(
      "haemileum_emotions",
      JSON.stringify([
        {
          studentName: "김하늘",
          emotion: "기쁨",
          reason: "오늘 미션을 잘 끝냈어요.",
          stamp: "오늘도 해냈어요",
          completedAt: now,
        },
      ])
    );

    localStorage.setItem(
      "haemileum_routines",
      JSON.stringify([
        {
          studentName: "김하늘",
          mission: "마이 루틴 체크",
          score: 40,
          status: "완료",
          emotion: "안정",
          completedAt: now,
          routines: [
            "아침에 스스로 일어나기",
            "가방 챙기기",
            "숙제 또는 알림장 확인하기",
            "오늘 기분 말하기",
          ],
        },
      ])
    );

    alert("시연용 샘플 데이터가 생성되었습니다.");
    loadData();
  };

  const clearAllData = () => {
    const isConfirmed = confirm(
      "해밀이음 테스트 데이터를 모두 삭제하시겠습니까?"
    );

    if (!isConfirmed) return;

    localStorage.removeItem("haemileum_results");
    localStorage.removeItem("haemileum_emotions");
    localStorage.removeItem("haemileum_routines");
    localStorage.removeItem("haemileum_selected_student");
    localStorage.removeItem("haemileum_selected_mission");

    alert("전체 테스트 데이터가 초기화되었습니다.");
    loadData();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">
            관리자 테스트 도구
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            해밀이음 시연 데이터 관리
          </h1>
          <p className="mt-3 text-slate-600">
            개발 및 시연 중 저장된 브라우저 데이터를 확인하고 초기화합니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <AdminCard
            title="현재 선택 학생"
            value={selectedStudent}
            description="localStorage 기준"
          />
          <AdminCard
            title="수행 기록"
            value={`${resultCount}건`}
            description="미션 결과 데이터"
          />
          <AdminCard
            title="감정 기록"
            value={`${emotionCount}건`}
            description="감정 체크 데이터"
          />
          <AdminCard
            title="루틴 기록"
            value={`${routineCount}건`}
            description="루틴 체크 데이터"
          />
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">데이터 작업</h2>
          <p className="mt-2 text-sm text-slate-500">
            시연 전에는 샘플 데이터를 생성하거나 기존 데이터를 초기화할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={createSampleData}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              샘플 데이터 생성
            </button>

            <button
              onClick={clearAllData}
              className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
            >
              전체 기록 초기화
            </button>

            <button
              onClick={loadData}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              데이터 새로고침
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">최근 수행 기록</h2>
          <p className="mt-2 text-sm text-slate-500">
            최근 저장된 미션 결과 5건을 확인합니다.
          </p>

          {results.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              저장된 수행 기록이 없습니다.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">학생명</th>
                    <th className="px-4 py-3 font-semibold">미션</th>
                    <th className="px-4 py-3 font-semibold">점수</th>
                    <th className="px-4 py-3 font-semibold">정서</th>
                    <th className="px-4 py-3 font-semibold">완료 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={`${result.studentName}-${result.mission}-${index}`}
                      className="border-t border-slate-200"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {result.studentName}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {result.mission}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {result.score}점
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {result.emotion}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {result.completedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">주요 화면 바로가기</h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <QuickLink href="/" label="홈" />
            <QuickLink href="/student/select" label="학생 선택" />
            <QuickLink href="/student/home" label="학생 홈" />
            <QuickLink href="/mission/select" label="미션 선택" />
            <QuickLink href="/teacher/dashboard" label="교사 대시보드" />
            <QuickLink href="/parent/dashboard" label="학부모 화면" />
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminCard({
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

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100 hover:text-blue-700"
    >
      {label}
    </Link>
  );
}