import Link from "next/link";

const coreFeatures = [
  {
    title: "[해] 문해력 지원",
    description: "텍스트 다이어트, 팩트체크, 쉬운 문장 이해 훈련을 위한 영역입니다.",
    status: "기획 반영",
  },
  {
    title: "[밀] 사회성 훈련",
    description: "학교생활 대화, 갈등 상황 대응, 적절한 표현 선택을 연습합니다.",
    status: "MVP 구현",
  },
  {
    title: "[이] 일상 시뮬레이션",
    description: "키오스크 주문, 대중교통 이용 등 생활 장면을 반복 연습합니다.",
    status: "MVP 구현",
  },
  {
    title: "[음] 정서 회복",
    description: "감정 기록, 칭찬 스탬프, 마이 루틴 체크로 자기효능감을 높입니다.",
    status: "MVP 구현",
  },
];

const demoSteps = [
  {
    step: "1",
    title: "학생 선택",
    description: "김하늘, 이도윤, 박서아 중 한 명을 선택합니다.",
    href: "/student/select",
  },
  {
    step: "2",
    title: "학생 홈 확인",
    description: "학생별 추천 미션과 최근 기록을 확인합니다.",
    href: "/student/home",
  },
  {
    step: "3",
    title: "미션 수행",
    description: "키오스크, 대중교통, 학교생활 대화, 감정 기록, 루틴 체크를 수행합니다.",
    href: "/mission/select",
  },
  {
    step: "4",
    title: "교사·학부모 확인",
    description: "교사 대시보드와 학부모 화면에서 수행 결과를 확인합니다.",
    href: "/teacher/dashboard",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
          <div className="mb-6 inline-flex rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
            경계선 지능 학생을 위한 AI 에듀테크 플랫폼
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            경계를 허무는 교육 안전지대,
            <br />
            <span className="text-blue-700">해밀이음</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            해밀이음은 문해력, 사회성, 일상생활 적응, 정서 회복을 통합 지원하는
            PWA 기반 맞춤형 교육 플랫폼입니다. 학생은 안전한 환경에서 반복 연습하고,
            교사와 학부모는 학습 결과와 정서 상태를 함께 확인할 수 있습니다.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
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
            <Link
              href="/parent/dashboard"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              학부모 화면
            </Link>
            <Link
              href="/admin/tools"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              시연 데이터 관리
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {feature.status}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">추천 시연 순서</h2>
            <p className="mt-2 text-sm text-slate-500">
              발표 시 아래 순서대로 이동하면 전체 서비스 흐름을 자연스럽게 설명할 수 있습니다.
            </p>

            <div className="mt-5 space-y-4">
              {demoSteps.map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="block rounded-xl border border-slate-200 p-4 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
                >
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">현재 MVP 구현 범위</h2>
            <p className="mt-2 text-sm text-slate-500">
              개발 시연 기준으로 설명 가능한 기능입니다.
            </p>

            <div className="mt-5 space-y-3">
              <MvpItem title="학생 화면" description="학생 선택, 학생 홈, 미션 선택, 최근 기록 확인" />
              <MvpItem title="일상 시뮬레이션" description="키오스크 주문 연습, 대중교통 이용 연습" />
              <MvpItem title="사회성 훈련" description="학교생활 대화 선택형 시뮬레이션" />
              <MvpItem title="정서·루틴 지원" description="감정 기록, 칭찬 스탬프, 마이 루틴 체크" />
              <MvpItem title="관리 화면" description="교사 대시보드, 학부모 화면, 관리자 테스트 도구" />
              <MvpItem title="PWA 기반" description="manifest 설정 및 모바일 홈 화면 추가 구조" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MvpItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
