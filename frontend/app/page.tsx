import Image from 'next/image';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import WorldMapSection from '@/components/landing/WorldMapSection';
import ItemPocketSection from '@/components/landing/ItemPocketSection';
import DemoSection from '@/components/landing/DemoSection';
import FaqSection from '@/components/landing/FaqSection';
import VillageStatus from '@/components/landing/VillageStatus';

// ─── Static data ────────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: '😟',
    title: '실제 적용의 어려움',
    desc: '책이나 설명으로 배운 내용을 실제 버스정류장, 키오스크, ATM 앞에서 바로 적용하기 어려워요.',
  },
  {
    icon: '😰',
    title: '실패에 대한 두려움',
    desc: '실수했을 때 주변 시선, 당황함, 위축감을 경험하면 다음에 더 어렵게 느껴져요.',
  },
  {
    icon: '🤯',
    title: '복잡한 정보 환경',
    desc: '키오스크, 교통 안내판, 은행 기기 등은 정보가 많아 인지 부담이 크게 느껴져요.',
  },
  {
    icon: '🔄',
    title: '반복 훈련의 부족',
    desc: '교실에서는 배웠지만 실제 상황을 충분히 반복 연습하기 어려운 환경이에요.',
  },
  {
    icon: '🔍',
    title: '교사 관찰의 한계',
    desc: '학생이 어느 단계에서 막히는지 구체적으로 파악하기 어렵습니다.',
  },
];

const solutions = [
  { icon: '🏘️', title: '2D 가상 마을', desc: '실제 생활 장소를 단순하고 친근한 마을로 구현해요.' },
  { icon: '🎯', title: '미션형 학습', desc: '버스 타기, 키오스크 주문, ATM 사용 등을 단계별 미션으로 구성해요.' },
  { icon: '🤖', title: 'AI 이음이', desc: '막혔을 때 쉬운 말로 안내하고 정서적으로 격려해줘요.' },
  { icon: '🎒', title: '아이템 주머니', desc: '상황에 맞는 카드, 교통카드, 도움 카드 등을 직접 선택해요.' },
  { icon: '✅', title: '반복 학습', desc: '실패해도 다시 시도하며 성공 경험을 하나씩 쌓아가요.' },
  { icon: '📊', title: '교사용 리포트', desc: '학생별 성공률, 오답 패턴, 힌트 사용 기록을 제공해요.' },
  { icon: '🏠', title: '가정 연계', desc: '오늘 배운 생활 문장을 가정에서도 반복 연습할 수 있어요.' },
];

const features = [
  {
    target: '학생',
    icon: '🎮',
    title: '가상 마을 생활 미션',
    desc: '키오스크 주문, 대중교통 이용, ATM 사용 등 실생활 미션을 게임처럼 수행해요.',
    color: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    href: '/student/select',
  },
  {
    target: 'AI 이음이',
    icon: '💬',
    title: '따뜻한 실시간 코파일럿',
    desc: '학생이 막히면 쉬운 문장으로 안내하고 틀려도 격려하며 다시 시도할 수 있게 도와줘요.',
    color: 'bg-pink-50 border-pink-200',
    iconBg: 'bg-pink-100 text-pink-700',
    href: '/student/home',
  },
  {
    target: '교사',
    icon: '📈',
    title: '성장 트래킹 대시보드',
    desc: '학생별 성공률, 오답 패턴, 힌트 사용 횟수, 관찰 항목 분석을 한눈에 확인해요.',
    color: 'bg-sky-50 border-sky-200',
    iconBg: 'bg-sky-100 text-sky-700',
    href: '/teacher/dashboard',
  },
  {
    target: '학부모',
    icon: '📱',
    title: '가정 연계 일상 루틴',
    desc: '가정에서 도울 수 있는 생활 문장과 반복 활동을 안내해 드려요.',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    href: '/parent/dashboard',
  },
];

const trustPrinciples = [
  { icon: '🧠', title: '인지 부하 최소화', desc: '한 화면에 하나의 목표만 제시하고, 쉬운 단어와 큰 버튼을 사용해요.' },
  { icon: '💚', title: '정서적 안전감', desc: '오답 시 처벌보다 다시 시도와 격려 중심 피드백을 제공해요.' },
  { icon: '🔁', title: '반복 학습', desc: '생활 행동을 여러 번 연습하며 성공 경험을 차곡차곡 쌓아가요.' },
  { icon: '🌉', title: '일반화 훈련', desc: '가상 미션 후 실제 생활 문장과 행동 카드로 연결해요.' },
  { icon: '👤', title: '개별화 지원', desc: '학생별 어려운 단계와 반복 오류를 교사가 직접 확인할 수 있어요.' },
  { icon: '♿', title: '접근성 고려', desc: '색상 대비, 가독성, 단순한 조작 방식을 적용해 누구나 쉽게 사용해요.' },
];

const teacherItems = [
  { label: '버스 번호 확인', status: '성공', badge: 'success' as const },
  { label: '교통카드 선택', status: '2회 힌트 후 성공', badge: 'hint' as const },
  { label: '하차벨 누르기', status: '반복 연습 필요', badge: 'retry' as const },
  { label: '추천 활동', status: '버스정류장 사진 보며 연습', badge: 'suggest' as const },
];

const badgeStyle: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  hint: 'bg-amber-100 text-amber-700',
  retry: 'bg-rose-100 text-rose-700',
  suggest: 'bg-sky-100 text-sky-700',
};

const parentTips = [
  '"버스는 색깔보다 번호를 먼저 봐요."',
  '"카드를 찍고 천천히 안으로 들어가요."',
  '"모르면 기사님이나 가까운 어른께 물어봐요."',
  '"비밀번호는 손으로 가리고 눌러요."',
  '"주문 전에는 메뉴와 가격을 다시 확인해요."',
];

const useCases = [
  { target: '특수학급', usage: '생활 자립 수업, 사회성 훈련, 안전교육', color: 'bg-emerald-50 text-emerald-800' },
  { target: '통합학급', usage: '느린학습자 맞춤형 보충 학습', color: 'bg-sky-50 text-sky-800' },
  { target: '일반학급', usage: '생활문해력, 금융교육, 디지털 시민교육', color: 'bg-purple-50 text-purple-800' },
  { target: '교육청', usage: '느린학습자 지원사업, AI 에듀테크 실증사업', color: 'bg-amber-50 text-amber-800' },
  { target: '복지관·센터', usage: '방과후 생활 적응 프로그램', color: 'bg-rose-50 text-rose-800' },
  { target: '가정', usage: '보호자와 함께하는 일상 루틴 연습', color: 'bg-orange-50 text-orange-800' },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <LandingNav />

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 pt-20"
      >
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_400px]">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/50 px-4 py-2 ring-1 ring-emerald-500/30">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-emerald-400" />
                <span className="text-sm font-bold text-emerald-200">
                  AI 기반 생활 자립 시뮬레이션 플랫폼
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                느린 학습자 아이들이
                <br />
                <span className="text-emerald-300">혼자서도 세상을</span>
                <br />
                자신 있게 걸어갈 수 있도록
              </h1>

              <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-emerald-100">
                경계선 지능 및 느린학습자 학생을 위한
                AI 기반 일상생활 적응 시뮬레이터,{' '}
                <strong className="text-white">해밀이음</strong>
                <br />
                버스 타기, 키오스크 주문, ATM 이용, 도움 요청을
                <br />
                안전한 2D 마을에서 반복 연습합니다.
              </p>

              <VillageStatus />

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/student/select"
                  className="rounded-full bg-white px-6 py-3.5 text-base font-black text-emerald-900 shadow-lg transition hover:bg-emerald-50 active:scale-95"
                >
                  학생용 체험하기 →
                </Link>
                <Link
                  href="/teacher/dashboard"
                  className="rounded-full border-2 border-emerald-400 px-6 py-3.5 text-base font-black text-white transition hover:bg-emerald-800/60"
                >
                  교사용 관리 도구 보기
                </Link>
                <a
                  href="#contact"
                  className="rounded-full border-2 border-white/30 px-6 py-3.5 text-base font-black text-white/80 transition hover:bg-white/10"
                >
                  실증학교 문의하기
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['교사', '학부', '학생'].map((label, i) => (
                    <div
                      key={label}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ring-2 ring-emerald-900 ${
                        ['bg-emerald-400 text-emerald-900', 'bg-sky-400 text-sky-900', 'bg-amber-400 text-amber-900'][i]
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-emerald-200">
                  학교·가정·기관 모두를 위한 플랫폼
                </p>
              </div>
            </div>

            {/* Right: character card */}
            <div className="relative">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-sm">
                <div className="relative mx-auto aspect-square max-w-xs overflow-hidden rounded-2xl bg-white/10">
                  <Image
                    src="/assets/helper/ieumi.png"
                    alt="AI 도우미 이음이"
                    fill
                    priority
                    sizes="320px"
                    className="object-contain p-4"
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <p className="text-xs font-black text-emerald-300">AI 도우미 이음이</p>
                      <p className="mt-1 text-sm font-bold text-white">
                        &ldquo;괜찮아. 그림을 다시 보고 하나씩 골라보자.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -left-6 top-8 animate-float rounded-xl bg-white px-3 py-2 shadow-lg">
                <p className="text-xs font-black text-emerald-700">✓ 버스 미션 완료</p>
              </div>
              <div
                className="absolute -right-6 bottom-12 animate-float rounded-xl bg-white px-3 py-2 shadow-lg"
                style={{ animationDelay: '1.5s' }}
              >
                <p className="text-xs font-black text-amber-600">🏆 레벨 UP!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute inset-x-0 bottom-0">
          <svg
            viewBox="0 0 1440 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full text-stone-50"
          >
            <path
              d="M0 70L1440 70L1440 35C1200 0 960 0 720 35C480 70 240 70 0 35L0 70Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ── 2. Pain Points ────────────────────────────────────────────────── */}
      <section id="problem" className="bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-rose-600">문제 제기</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              아이들은 알고 있어도,
              <br />
              실제 상황에서는 어려워합니다
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-slate-500">
              교사와 학부모가 가장 많이 겪는 현실적인 어려움입니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-4xl">{p.icon}</span>
                <h3 className="mt-4 text-base font-black text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Solution ───────────────────────────────────────────────────── */}
      <section id="solution" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
                해밀이음의 해결책
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                해밀이음은 생활 상황을
                <br />
                안전하게 연습하게 합니다
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
                실패해도 다시 도전하며 성공 경험을 쌓는 안전한 가상 환경.
                학교와 가정이 함께 아이의 자립을 지원합니다.
              </p>
              <div className="mt-8 space-y-4">
                {solutions.map((s) => (
                  <div key={s.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                      {s.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{s.title}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-2xl bg-white shadow-md">
                  <Image
                    src="/assets/helper/chibi_characters.png"
                    alt="해밀이음 캐릭터들"
                    fill
                    sizes="320px"
                    className="object-contain p-4"
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-center text-sm font-black text-slate-900">
                    아이들이 세상으로 나가기 전,
                  </p>
                  <p className="mt-1 text-center text-base font-black text-emerald-700">
                    안전하게 연습하는 작은 마을
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Mission World Map (client component) ───────────────────────── */}
      <WorldMapSection />

      {/* ── 5. Core Features ──────────────────────────────────────────────── */}
      <section id="features" className="bg-stone-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">핵심 기능</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              학생·AI·교사·학부모를 위한
              <br />
              4가지 핵심 기능
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Link
                key={f.target}
                href={f.href}
                className={`group rounded-2xl border-2 p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${f.color}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${f.iconBg}`}
                >
                  {f.icon}
                </span>
                <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">
                  {f.target}
                </p>
                <h3 className="mt-1 text-base font-black text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{f.desc}</p>
                <span className="mt-4 inline-flex text-xs font-black text-emerald-700 group-hover:underline">
                  바로가기 →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Item Pocket (client component) ────────────────────────────── */}
      <ItemPocketSection />

      {/* ── 7. Interactive Demo (client component) ───────────────────────── */}
      <DemoSection />

      {/* ── 7.5 E-Book & Audiobook Section ────────────────────────────────── */}
      <section id="audiobook-feature" className="bg-gradient-to-br from-stone-50 to-emerald-50/50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Overlapping Book Covers */}
            <div className="relative flex justify-center lg:justify-start">
              <div className="relative h-[340px] w-[340px] sm:h-[400px] sm:w-[400px]">
                {/* Background glow */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl" />
                
                {/* Cloud cover (left) */}
                <div className="absolute left-4 top-12 h-64 w-44 -rotate-12 overflow-hidden rounded-xl bg-slate-100 shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:rotate-0 hover:scale-105 hover:z-20 sm:h-72 sm:w-48">
                  <Image
                    src="/assets/audiobook/cover_cloud.png"
                    alt="구름 위의 꿈"
                    fill
                    sizes="(max-width: 640px) 176px, 192px"
                    className="object-cover"
                  />
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-r from-black/20 to-transparent" />
                </div>

                {/* Alphabet cover (right) */}
                <div className="absolute right-4 top-16 h-64 w-44 rotate-12 overflow-hidden rounded-xl bg-slate-100 shadow-lg ring-1 ring-slate-200 transition-all duration-300 hover:rotate-0 hover:scale-105 hover:z-20 sm:h-72 sm:w-48">
                  <Image
                    src="/assets/audiobook/cover_alphabet.png"
                    alt="한글 기차 여행"
                    fill
                    sizes="(max-width: 640px) 176px, 192px"
                    className="object-cover"
                  />
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-r from-black/20 to-transparent" />
                </div>

                {/* Emotion cover (center front) */}
                <div className="absolute left-1/2 top-4 h-72 w-48 -translate-x-1/2 overflow-hidden rounded-xl bg-slate-100 shadow-xl ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:z-20 sm:h-80 sm:w-52">
                  <Image
                    src="/assets/audiobook/cover_emotion.png"
                    alt="감정 친구들"
                    fill
                    sizes="(max-width: 640px) 192px, 208px"
                    className="object-cover"
                  />
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-r from-black/20 to-transparent" />
                  <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow">
                    🎧 오디오
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Copy & Features */}
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
                신규 콘텐츠 출시
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                읽고 들으며 자라는 생각,
                <br />
                <span className="text-emerald-700">이북 & 오디오북</span> 오픈!
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
                느린 학습자(경계선 지능) 아동의 눈높이에 맞춘 다채로운 그림책과 따뜻한 성우의 목소리로 낭독해주는 오디오북 콘텐츠가 추가되었습니다.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: '🎙️',
                    title: '성우의 다정하고 따뜻한 낭독',
                    desc: '정형화된 기계음 대신 다정하고 풍부한 감정을 담은 목소리로 이야기를 들려주어 아동의 몰입과 공감을 돕습니다.',
                  },
                  {
                    icon: '⏱️',
                    title: '속도 조절 및 시각적 파형 연동',
                    desc: '학생의 인지 속도에 맞춰 0.75배속 등 재생 속도를 간편하게 조절할 수 있고, 시각적으로 움직이는 파형과 함께 즐길 수 있습니다.',
                  },
                  {
                    icon: '📋',
                    title: '구체적인 챕터 이동과 편안한 UI',
                    desc: '인지 부담을 낮추기 위해 챕터를 명확히 구분하고, 큼직한 제어 버튼과 프로그레스바로 누구나 쉽게 조작합니다.',
                  },
                  {
                    icon: '💚',
                    title: '성장 큐레이션 및 전용 도서 3종',
                    desc: '감성 성장, 사회성 향상, 학습 동기 등 주제별 맞춤 큐레이션과 오디오 전용 도서(감정 친구들 등)를 제공합니다.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/audiobook"
                  className="inline-flex rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-800 active:scale-95"
                >
                  🎧 오디오북 도서관 바로가기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Educational Trust ─────────────────────────────────────────── */}
      <section id="trust" className="bg-amber-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-amber-700">교육적 신뢰성</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              재미만이 아니라,
              <br />
              교육적으로 설계되었습니다
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-slate-600">
              해밀이음은 아이가 틀리지 않게 만드는 서비스가 아니라,
              <br />
              <strong>틀려도 다시 시도하며 스스로 해낼 수 있게 돕는 서비스</strong>입니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustPrinciples.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm"
              >
                <span className="text-3xl">{p.icon}</span>
                <h3 className="mt-4 text-base font-black text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Teacher Dashboard ─────────────────────────────────────────── */}
      <section id="teacher" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-sky-600">교사용 성장 트래킹</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                선생님은 아이의 성장을
                <br />
                한눈에 확인합니다
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
                학생이 어느 단계에서 막히는지, 어떤 도움이 필요한지
                데이터로 파악하고 맞춤형 지도를 제공할 수 있어요.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { label: '미션 성공률', desc: '학생이 독립적으로 수행한 비율' },
                  { label: '오답 유형', desc: '어떤 선택에서 반복적으로 어려움을 보이는지 확인' },
                  { label: '힌트 사용 횟수', desc: '도움 없이 수행 가능한지 판단' },
                  { label: '재시도 횟수', desc: '반복 학습이 필요한 단계 파악' },
                  { label: '추천 활동', desc: '다음 수업 또는 가정 연계 활동 제안' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700">
                      ✓
                    </span>
                    <div>
                      <span className="text-sm font-black text-slate-900">{item.label}</span>
                      <span className="ml-2 text-sm font-semibold text-slate-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/teacher/dashboard"
                className="mt-8 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-black text-white transition hover:bg-sky-800"
              >
                교사 대시보드 보기 →
              </Link>
            </div>

            {/* Dashboard mockup */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="rounded-xl bg-white p-5 ring-1 ring-slate-100">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">도윤이의 이번 주 성장 기록</p>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700">
                    Week 3
                  </span>
                </div>
                <div className="space-y-2">
                  {teacherItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
                    >
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${badgeStyle[item.badge]}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="mt-4 rounded-xl bg-sky-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-sky-700">이번 주 미션 성공률</p>
                    <p className="text-xs font-black text-sky-700">75%</p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-100">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: '75%' }} />
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-sky-600">지난주 대비 +12% 향상</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Parent Connection ─────────────────────────────────────────── */}
      <section id="parent" className="bg-emerald-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Parent notification card */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📱</span>
                  <p className="text-sm font-black text-emerald-800">오늘의 연습 알림</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-slate-400">해밀이음 알림</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    도윤이는 오늘 버스 번호 확인 미션을 성공했어요. 🎉
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    집에서는 산책 중 버스 번호를 함께 찾아보며 연습해보세요.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-black text-slate-500 mb-2">가정 연계 문장 예시</p>
                <div className="space-y-2">
                  {parentTips.map((tip) => (
                    <div key={tip} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-emerald-500 shrink-0 font-black text-sm">✓</span>
                      <p className="text-sm font-semibold text-slate-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/parent/dashboard"
                className="mt-4 block w-full rounded-xl bg-emerald-700 py-3 text-center text-sm font-black text-white hover:bg-emerald-800 transition-colors"
              >
                학부모 화면 보기 →
              </Link>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
                학부모 가정 연계
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                가정에서도 이어지는
                <br />
                생활 연습
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                오늘 아이가 어떤 미션을 연습했는지,
                어떤 부분에서 도움이 필요했는지,
                집에서는 어떤 말로 도와주면 좋은지 알려드립니다.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: '📬', text: '오늘의 미션 결과를 보호자에게 알림으로 전달' },
                  { icon: '💬', text: '집에서 사용할 수 있는 쉬운 생활 문장 제공' },
                  { icon: '🔁', text: '학교에서 배운 내용을 가정에서도 반복 연습' },
                  { icon: '📊', text: '주간 성장 기록을 보호자와 공유' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-sm font-bold text-slate-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. Use Cases ─────────────────────────────────────────────────── */}
      <section id="usecases" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">활용 대상</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              학교와 가정, 지역사회에서
              <br />
              함께 사용할 수 있습니다
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <div
                key={uc.target}
                className={`rounded-2xl border border-slate-200 p-6 ${uc.color}`}
              >
                <h3 className="text-lg font-black">{uc.target}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{uc.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. FAQ (client component) ───────────────────────────────────── */}
      <FaqSection />

      {/* ── 13. Bottom CTA ────────────────────────────────────────────────── */}
      <section
        id="contact"
        className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-700 py-24"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/30 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-300">시작하기</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            오늘의 연습이,
            <br />
            아이들의 내일을 바꿉니다
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-semibold leading-8 text-emerald-100">
            해밀이음은 아이들이 실패를 두려워하지 않고
            생활 속 선택을 반복 연습하며
            조금씩 자립으로 나아가도록 돕습니다.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/student/select"
              className="rounded-full bg-white px-8 py-4 text-base font-black text-emerald-900 shadow-lg transition hover:bg-emerald-50 active:scale-95"
            >
              무료 체험 신청하기
            </Link>
            <Link
              href="/teacher/dashboard"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-black text-white transition hover:bg-white/10"
            >
              교사용 관리 도구 보기
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contact@haemileum.kr"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10"
            >
              실증학교 문의하기
            </a>
            <a
              href="#"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10"
            >
              소개자료 다운로드
            </a>
            <a
              href="#"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10"
            >
              제휴 상담하기
            </a>
          </div>

          {/* Footer info */}
          <div className="mt-16 border-t border-white/10 pt-8">
            <p className="text-sm font-bold text-emerald-300">해밀이음</p>
            <p className="mt-1 text-xs font-semibold text-emerald-400/70">
              경계선 지능 및 느린학습자 학생을 위한 AI 기반 생활 자립 시뮬레이션 플랫폼
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-bold text-emerald-400/50">
              <Link href="/" className="hover:text-emerald-300">홈</Link>
              <Link href="/village" className="hover:text-emerald-300">2D 마을</Link>
              <Link href="/teacher/dashboard" className="hover:text-emerald-300">교사 대시보드</Link>
              <Link href="/parent/dashboard" className="hover:text-emerald-300">학부모</Link>
              <Link href="/admin/tools" className="hover:text-emerald-300">관리</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
