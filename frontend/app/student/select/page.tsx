"use client";

import { useRouter } from "next/navigation";

type Student = {
  name: string;
  grade: string;
  note: string;
  icon: string;
  recommendedMission: string;
  support: string;
  color: string;
};

const students: Student[] = [
  {
    name: "김하늘",
    grade: "초등 5학년",
    note: "생활 절차를 천천히 따라가면 잘 해냅니다.",
    icon: "🍔",
    recommendedMission: "키오스크 주문",
    support: "큰 버튼과 짧은 문장 안내가 좋아요.",
    color: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    name: "이도윤",
    grade: "초등 6학년",
    note: "목적지와 순서를 먼저 확인하면 안정적으로 연습합니다.",
    icon: "🚌",
    recommendedMission: "버스 타기",
    support: "방향, 번호, 내릴 곳을 같이 확인해 주세요.",
    color: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    name: "박서아",
    grade: "중등 1학년",
    note: "대화 상황에서 선택지를 비교하는 연습이 필요합니다.",
    icon: "💬",
    recommendedMission: "학교생활 대화",
    support: "정답보다 왜 그렇게 말했는지 들어주세요.",
    color: "border-violet-200 bg-violet-50 text-violet-950",
  },
];

const guideCards = [
  {
    title: "학생을 먼저 고릅니다",
    text: "선택한 이름으로 홈, 미션, 기록 화면이 이어집니다.",
  },
  {
    title: "언제든 바꿀 수 있어요",
    text: "다른 학생으로 보려면 이 화면에서 다시 선택하면 됩니다.",
  },
  {
    title: "추천 미션부터 시작해요",
    text: "처음에는 학생 카드의 추천 활동을 먼저 해보면 좋습니다.",
  },
];

export default function StudentSelectPage() {
  const router = useRouter();

  const selectStudent = (student: Student) => {
    localStorage.setItem("haemileum_selected_student", student.name);
    localStorage.setItem(
      "haemileum_selected_mission",
      student.recommendedMission
    );
    router.push("/student/home");
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">학생 선택</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                오늘 학습할 학생을
                <br />
                선택해 주세요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                학생을 고르면 홈 화면으로 이동합니다. 각 학생에게 맞는
                추천 미션도 함께 준비됩니다.
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

        <div className="mb-5">
          <p className="text-sm font-bold text-emerald-700">학생 목록</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            이름 카드를 눌러 시작합니다
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {students.map((student) => (
            <button
              key={student.name}
              type="button"
              onClick={() => selectStudent(student)}
              className={`group rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 ${student.color}`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                  {student.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-black/5">
                      {student.grade}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black ring-1 ring-black/5">
                      추천 {student.recommendedMission}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-black leading-tight">
                    {student.name}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-6 opacity-80">
                    {student.note}
                  </p>
                  <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm font-bold leading-6 ring-1 ring-black/5">
                    {student.support}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-black ring-1 ring-black/5">
                      선택 가능
                    </span>
                    <span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white group-hover:bg-emerald-800">
                      시작하기
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="text-lg font-black text-amber-950">
            시연 전에는 학생을 한 명 선택해 주세요.
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
            선택한 학생 이름으로 미션 결과, 마음 기록, 루틴 기록이 저장됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
