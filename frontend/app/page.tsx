import Image from "next/image";
import Link from "next/link";

const roleLinks = [
  {
    title: "학생",
    subtitle: "이음이와 연습해요",
    description: "그림을 보고 미션을 고르고, 어려우면 이음이가 짧게 도와줘요.",
    href: "/student/select",
    action: "학생으로 시작하기",
    color: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  {
    title: "교사",
    subtitle: "기록을 확인해요",
    description: "학생별 수행 결과, 정서 기록, 주의가 필요한 항목을 확인합니다.",
    href: "/teacher/dashboard",
    action: "교사 대시보드",
    color: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    title: "학부모",
    subtitle: "가정에서 이어가요",
    description: "우리 아이의 최근 활동과 집에서 도울 수 있는 안내를 봅니다.",
    href: "/parent/dashboard",
    action: "학부모 화면",
    color: "border-amber-200 bg-amber-50 text-amber-950",
  },
  {
    title: "관리",
    subtitle: "시연을 준비해요",
    description: "샘플 기록을 만들고, 화면별 이동을 빠르게 실행합니다.",
    href: "/admin/tools",
    action: "관리 도구",
    color: "border-rose-200 bg-rose-50 text-rose-950",
  },
];

const missionFlow = [
  { step: "1", title: "그림을 봐요", text: "먼저 상황 그림을 살펴봐요." },
  { step: "2", title: "큰 버튼을 눌러요", text: "정답을 몰라도 괜찮아요." },
  { step: "3", title: "이음이가 도와줘요", text: "틀리면 짧게 다시 알려줘요." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-slate-900">
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_430px] lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black text-emerald-700">
              경계선 지능 학생을 위한 그림 중심 AI 에듀테크
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              해밀이음
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              학생은 그림을 보며 생활 미션을 연습하고, 어려운 순간에는 도우미
              캐릭터 이음이가 짧고 쉬운 말로 다시 안내합니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/student/select"
                className="rounded-lg bg-emerald-700 px-5 py-3 text-base font-black text-white shadow-sm hover:bg-emerald-800"
              >
                학생으로 시작하기
              </Link>
              <Link
                href="/simulation/kiosk"
                className="rounded-lg bg-slate-950 px-5 py-3 text-base font-black text-white shadow-sm hover:bg-slate-800"
              >
                키오스크 미션 보기
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-white">
              <Image
                src="/assets/helper/ieumi.png"
                alt="해밀이음 도우미 캐릭터 이음이"
                fill
                priority
                sizes="360px"
                className="object-cover"
              />
            </div>
            <div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-emerald-100">
              <p className="text-sm font-black text-emerald-700">
                도우미 캐릭터
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">이음이</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                “괜찮아. 그림을 다시 보고 하나씩 골라보자.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-4">
          <p className="text-sm font-black text-emerald-700">역할별 입장</p>
          <h2 className="text-2xl font-black text-slate-950">
            필요한 화면으로 바로 이동합니다
          </h2>
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
            <p className="text-sm font-black text-emerald-700">
              그림 미션 흐름
            </p>
            <h2 className="text-2xl font-black text-slate-950">
              틀려도 이음이가 다시 도와줍니다
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {missionFlow.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
