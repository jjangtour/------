import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
          경계선 지능 학생을 위한 AI 에듀테크 플랫폼
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900">
          경계를 허무는 교육 안전지대,
          <br />
          <span className="text-blue-700">해밀이음</span>
        </h1>

        <p className="mb-10 max-w-3xl text-lg leading-8 text-slate-600">
          해밀이음은 문해력, 사회성, 일상생활 적응, 정서 회복을 지원하는
          맞춤형 교육 플랫폼입니다. 학생은 안전한 환경에서 반복 연습하고,
          교사와 학부모는 학습 결과를 함께 확인할 수 있습니다.
        </p>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-xl font-bold text-blue-700">해</h2>
            <p className="text-sm leading-6 text-slate-600">
              텍스트 다이어트와 팩트체크를 통한 문해력 향상
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-xl font-bold text-blue-700">밀</h2>
            <p className="text-sm leading-6 text-slate-600">
              AI 챗봇과 웹툰형 상황훈련을 통한 사회성 강화
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-xl font-bold text-blue-700">이</h2>
            <p className="text-sm leading-6 text-slate-600">
              키오스크·교통·생활 절차 중심의 일상 시뮬레이션
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-xl font-bold text-blue-700">음</h2>
            <p className="text-sm leading-6 text-slate-600">
              루틴 관리, 감정 기록, 칭찬 스탬프 기반 정서 회복
            </p>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <Link
            href="/student/select"
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            학생으로 시작하기
          </Link>
          <Link
            href="/teacher/dashboard"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            교사용 대시보드
          </Link>
        </div>
      </section>
    </main>
  );
}