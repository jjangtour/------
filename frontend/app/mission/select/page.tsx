"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const missions = [
  {
    id: "kiosk",
    title: "키오스크 주문 연습",
    category: "[이] 일상 시뮬레이션",
    description: "음식점 키오스크에서 메뉴 선택, 결제, 영수증 선택 절차를 연습합니다.",
    status: "실행 가능",
    path: "/simulation/kiosk",
  },
  {
    id: "bus",
    title: "대중교통 이용 연습",
    category: "[이] 일상 시뮬레이션",
    description: "목적지 확인, 버스 번호 선택, 하차 정류장 선택을 연습합니다.",
    status: "실행 가능",
    path: "/simulation/bus",
  },
 {
  id: "school-talk",
  title: "학교생활 대화 연습",
  category: "[밀] 사회성 훈련",
  description: "친구와의 갈등 상황에서 적절한 말과 행동을 선택하는 연습입니다.",
  status: "실행 가능",
  path: "/simulation/school-talk",
},
];

export default function MissionSelectPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("이름 미선택");

  useEffect(() => {
    const selectedStudent =
      localStorage.getItem("haemileum_selected_student") || "이름 미선택";

    setStudentName(selectedStudent);
  }, []);

  const startMission = (mission: (typeof missions)[0]) => {
    if (!mission.path) {
      alert("이 미션은 다음 단계에서 개발할 예정입니다.");
      return;
    }

    localStorage.setItem("haemileum_selected_mission", mission.title);
    router.push(mission.path);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">미션 선택</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {studentName} 학생의 오늘 미션을 선택하세요
          </h1>
          <p className="mt-3 text-slate-600">
            학생의 수준과 상황에 맞는 생활 시뮬레이션 또는 사회성 훈련 미션을 선택합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-sm font-semibold text-blue-700">
                {mission.category}
              </p>

              <h2 className="mt-3 text-xl font-bold text-slate-900">
                {mission.title}
              </h2>

              <p className="mt-4 min-h-24 text-sm leading-6 text-slate-600">
                {mission.description}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    mission.status === "실행 가능"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {mission.status}
                </span>

                <button
                  onClick={() => startMission(mission)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    mission.status === "실행 가능"
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  미션 시작
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
          <p className="text-sm font-semibold text-blue-800">개발 메모</p>
          <p className="mt-2 text-sm leading-6 text-blue-700">
            현재는 키오스크 주문 연습만 실행 가능하며, 대중교통 이용 연습과 학교생활 대화 연습은 다음 단계에서 추가합니다.
          </p>
        </div>
      </section>
    </main>
  );
}