import Link from "next/link";

const roleLinks = [
  {
    title: "학생",
    subtitle: "오늘 연습을 시작해요",
    description: "학생을 고르고 추천 미션, 마음 기록, 루틴 체크를 이어갑니다.",
    href: "/student/select",
    action: "학생으로 시작하기",
    color: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  {
    title: "교사",
    subtitle: "학급 상황을 확인해요",
    description: "학생별 수행 결과, 정서 기록, 주의 필요 항목을 한눈에 봅니다.",
    href: "/teacher/dashboard",
    action: "교사 대시보드",
    color: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    title: "학부모",
    subtitle: "가정 연계를 살펴봐요",
    description: "우리 아이의 최근 활동과 집에서 도울 수 있는 안내를 확인합니다.",
    href: "/parent/dashboard",
    action: "학부모 화면",
    color: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    title: "관리자",
    subtitle: "시연 데이터를 준비해요",
    description: "샘플 데이터 생성, 초기화, 화면별 이동을 빠르게 실행합니다.",
    href: "/admin/tools",
    action: "관리 도구",
    color: "border-rose-200 bg-rose-50 text-rose-950",
  },
];

const supportAreas = [
  {
    label: "문해력",
    title: "쉬운 문장으로 이해",
    text: "텍스트 다이어트와 핵심 확인으로 읽기 부담을 낮춥니다.",
  },
  {
    label: "사회성",
    title: "상황별 대화 연습",
    text: "학교생활 대화와 갈등 상황에서 선택지를 비교합니다.",
  },
  {
    label: "일상",
    title: "생활 장면 반복 훈련",
    text: "키오스크 주문, 버스 타기처럼 실제 장면을 안전하게 연습합니다.",
  },
  {
    label: "정서",
    title: "마음과 루틴 기록",
    text: "감정 체크와 칭찬, 루틴 기록으로 작은 성공을 남깁니다.",
  },
];

const demoFlow = [
  { step: "1", title: "학생 선택", href: "/student/select" },
  { step: "2", title: "추천 미션 확인", href: "/student/home" },
  { step: "3", title: "미션 수행", href: "/mission/select" },
  { step: "4", title: "기록 확인", href: "/teacher/dashboard" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-slate-900">
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black text-emerald-700">
              경계선 지능 학생을 위한 AI 에듀테크 플랫폼
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              해밀이음
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              학생은 안전하게 연습하고, 교사와 학부모는 같은 기록을 바탕으로
              생활 적응과 정서 회복을 함께 지원합니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/student/select"
                className="rounded-lg bg-emerald-700 px-5 py-3 text-base font-black text-white shadow-sm hover:bg-emerald-800"
              >
                학생으로 시작하기
              </Link>
              <Link
                href="/mission/select"
                className="rounded-lg bg-slate-950 px-5 py-3 text-base font-black text-white shadow-sm hover:bg-slate-800"
              >
                미션 바로 보기
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-500">오늘의 시연 흐름</p>
            <div className="mt-4 space-y-3">
              {demoFlow.map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-200"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                    {item.step}
                  </span>
                  <span className="text-base font-black text-slate-950">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">역할별 입장</p>
            <h2 className="text-2xl font-black text-slate-950">
              필요한 화면으로 바로 이동합니다
            </h2>
          </div>
          <p className="text-sm font-bold text-slate-500">
            발표와 실제 체험 모두 이 화면에서 시작할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {roleLinks.map((role) => (
            <Link
              key={role.title}
              href={role.href}
              className={`rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${role.color}`}
            >
              <p className="text-sm font-black opacity-70">{role.subtitle}</p>
              <h3 className="mt-2 text-2xl font-black">{role.title}</h3>
              <p className="mt-3 min-h-24 text-sm font-semibold leading-6 opacity-80">
                {role.description}
              </p>
              <span className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-black ring-1 ring-black/5">
                {role.action}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="mb-4">
            <p className="text-sm font-black text-emerald-700">지원 영역</p>
            <h2 className="text-2xl font-black text-slate-950">
              네 가지 축으로 생활 적응을 돕습니다
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {supportAreas.map((area) => (
              <div
                key={area.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  {area.label}
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950">
                  {area.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {area.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-lg font-black text-emerald-950">
              학생 체험을 먼저 진행하는 것이 좋습니다.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
              학생 선택 후 미션을 수행하면 교사 대시보드와 학부모 화면에서
              기록이 이어져 보입니다.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-lg font-black text-slate-950">시연 준비</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              데이터가 비어 있다면 관리자 도구에서 샘플 기록을 만든 뒤
              교사와 학부모 화면을 확인하세요.
            </p>
            <Link
              href="/admin/tools"
              className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
            >
              시연 데이터 관리
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
