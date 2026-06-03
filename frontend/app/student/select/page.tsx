"use client";

import { useRouter } from "next/navigation";

const students = [
  {
    name: "김하늘",
    grade: "초등 5학년",
    note: "키오스크 주문 연습 권장",
  },
  {
    name: "이도윤",
    grade: "초등 6학년",
    note: "대중교통 이용 연습 권장",
  },
  {
    name: "박서아",
    grade: "중등 1학년",
    note: "학교생활 대화 연습 권장",
  },
];

export default function StudentSelectPage() {
  const router = useRouter();

  const selectStudent = (studentName: string) => {
    localStorage.setItem("haemileum_selected_student", studentName);
    router.push("/student/home");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">학생 선택</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            오늘 학습할 학생을 선택하세요
          </h1>
          <p className="mt-3 text-slate-600">
            선택한 학생의 이름으로 시뮬레이션 수행 결과가 저장됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {students.map((student) => (
            <button
              key={student.name}
              onClick={() => selectStudent(student.name)}
              className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 hover:bg-blue-50 hover:ring-blue-300"
            >
              <p className="text-xl font-bold text-slate-900">
                {student.name}
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-700">
                {student.grade}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {student.note}
              </p>
              <p className="mt-6 text-sm font-semibold text-slate-500">
                선택 후 키오스크 연습 시작 →
              </p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}