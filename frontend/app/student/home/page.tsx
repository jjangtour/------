"use client";

import { useMemo, useSyncExternalStore, useState, useEffect } from "react";
import Link from "next/link";
import { getLevelInfo } from "@/utils/level";

type StudentResult = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

const quickActions = [
  {
    title: "집으로 가기",
    description: "안심 귀가 길 안내를 시작해요.",
    href: "/student/homecoming",
    icon: "🏠",
    color: "border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700",
    highlight: true,
  },
  {
    title: "다른 미션 보기",
    description: "연습할 활동을 직접 고릅니다.",
    href: "/mission/select",
    icon: "🎯",
    color: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
  },
  {
    title: "해밀 마을",
    description: "이웃과 대화하고 채집하며 힐링해요.",
    href: "/village",
    icon: "🏡",
    color: "border-lime-200 bg-lime-50 text-lime-900 hover:bg-lime-100",
  },
  {
    title: "우리집",
    description: "미션에 쓸 물건을 준비해요.",
    href: "/student/house",
    icon: "집",
    color: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  },
  {
    title: "마음 고르기",
    description: "오늘 기분을 짧게 남깁니다.",
    href: "/emotion/check",
    icon: "😊",
    color: "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
  },
  {
    title: "루틴 체크",
    description: "오늘 한 일을 확인합니다.",
    href: "/routine/check",
    icon: "✓",
    color: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
  {
    title: "학생 바꾸기",
    description: "다른 이름으로 시작합니다.",
    href: "/student/select",
    icon: "👤",
    color: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  },
];

const recommendedMissions = [
  {
    title: "패스트푸드 주문",
    description: "불고기 버거 세트를 가져가기로 주문하고, 카드 전용 기계에서 안전하게 계산합니다.",
    href: "/simulation/kiosk",
    tag: "[이] 일상",
    icon: "🍔",
    level: "쉬움",
    steps: ["가져가기 선택", "메뉴 고르기", "잠깐 확인!", "카드 결제"],
    accent: "bg-amber-100 text-amber-900",
  },
  {
    title: "ATM 사용하기",
    description: "용돈을 찾으면서 낯선 사람 요청을 거절하고 비밀번호를 안전하게 지킵니다.",
    href: "/simulation/atm",
    tag: "[이] 생활",
    icon: "🏧",
    level: "보통",
    steps: ["카드 넣기", "돈 찾기", "비밀번호 지키기", "카드 챙기기"],
    accent: "bg-blue-100 text-blue-900",
  },
  {
    title: "버스 타기",
    description: "목적지와 버스 번호를 보고 안전하게 이동합니다.",
    href: "/simulation/bus",
    tag: "[이] 이동",
    icon: "🚌",
    level: "보통",
    steps: ["목적지 확인", "버스 선택", "내릴 곳 찾기"],
    accent: "bg-sky-100 text-sky-900",
  },
  {
    title: "학교생활 대화",
    description: "친구에게 말하기, 거절하기, 도움 요청을 연습합니다.",
    href: "/simulation/school-talk",
    tag: "[밀] 대화",
    icon: "💬",
    level: "연습",
    steps: ["상황 보기", "말 고르기", "결과 확인"],
    accent: "bg-violet-100 text-violet-900",
  },
  {
    title: "사기 방어와 마음 관리",
    description: "스마트폰 스미싱 문자를 구별하고 불안한 마음을 진정시킵니다.",
    href: "/simulation/safety-sos",
    tag: "[음] 안전/마음",
    icon: "🛡️",
    level: "보통",
    steps: ["문자 분석", "감정 버리기", "안정 호흡"],
    accent: "bg-teal-100 text-teal-900",
  },
];

const cheerMessages = [
  "오늘은 하나만 끝까지 해도 충분합니다.",
  "모르면 다시 눌러도 괜찮습니다.",
  "천천히 읽고, 천천히 골라봅니다.",
];

const emptyResults = "[]";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || "이름 미선택";

const getSavedResults = () =>
  localStorage.getItem("haemileum_results") || emptyResults;

const getSelectedStudentXp = () => {
  if (typeof window === "undefined") return 0;
  const name = localStorage.getItem("haemileum_selected_student") || "이름 미선택";
  const xpStr = localStorage.getItem("haemileum_student_xp_" + name) || "0";
  return parseInt(xpStr, 10);
};

export default function StudentHomePage() {
  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "이름 미선택"
  );
  const savedResultsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedResults,
    () => emptyResults
  );
  const totalXp = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudentXp,
    () => 0
  );

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem("haemileum_privacy_agreed");
    if (agreed !== "true") {
      setShowPrivacyModal(true);
    }
  }, []);

  const handleAgreePrivacy = () => {
    if (agreeTerms && agreeLocation) {
      localStorage.setItem("haemileum_privacy_agreed", "true");
      setShowPrivacyModal(false);
      alert("보호자 동의가 완료되었습니다. 안전하게 해밀이음을 이용해보세요!");
    } else {
      alert("모든 필수 항목에 동의해야 서비스를 시작할 수 있습니다.");
    }
  };

  const levelInfo = useMemo(() => getLevelInfo(totalXp), [totalXp]);

  const recentResults = useMemo(() => {
    try {
      const savedResults = JSON.parse(savedResultsText) as StudentResult[];

      return savedResults
        .filter((result) => result.studentName === studentName)
        .slice(-3)
        .reverse();
    } catch {
      return [];
    }
  }, [savedResultsText, studentName]);

  const latestResult = recentResults[0];
  const heroMission = recommendedMissions[0];

  return (
    <>
      <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">학생 홈</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName} 학생,
                <br />
                오늘은 하나만 해봐요.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                틀려도 괜찮습니다. 다시 고르고, 다시 연습하면 됩니다.
              </p>

              {/* 레벨 및 경험치 게이지 카드 */}
              <div className="mt-6 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                      {levelInfo.badge}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-200">나의 레벨</p>
                      <h3 className="text-xl font-black text-white">
                        {levelInfo.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-200">총 경험치</p>
                    <p className="text-lg font-black text-white">{levelInfo.totalXp} XP</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-100 mb-1.5">
                    <span>레벨업 게이지</span>
                    <span>{levelInfo.currentXpInLevel} / {levelInfo.xpNeededForNext} XP</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{
                        width: `${(levelInfo.currentXpInLevel / levelInfo.xpNeededForNext) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-emerald-100/90">
                    {levelInfo.level >= 5
                      ? "최고 레벨 달성! 대단해요. 당신은 완벽한 안전 마스터입니다! 👑"
                      : `다음 레벨까지 ${levelInfo.xpNeededForNext - levelInfo.currentXpInLevel} XP가 남았습니다.`}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {cheerMessages.map((message) => (
                  <div
                    key={message}
                    className="rounded-lg bg-white/12 p-4 text-sm font-semibold leading-6 text-emerald-50 ring-1 ring-white/20"
                  >
                    {message}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold text-emerald-700">
                바로 시작하기
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {heroMission.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {heroMission.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                  {heroMission.tag}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                  {heroMission.level}
                </span>
              </div>

              <Link
                href={heroMission.href}
                className="mt-7 flex min-h-16 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 py-4 text-center text-xl font-black text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                미션 시작하기
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatusCard
            title="오늘 학생"
            value={studentName}
            description="선택된 이름"
          />
          <StatusCard
            title="최근 미션"
            value={latestResult?.mission || "아직 없음"}
            description="마지막 활동"
          />
          <StatusCard
            title="최근 점수"
            value={latestResult ? `${latestResult.score}점` : "0점"}
            description="다시 하면 올라갑니다"
          />
          <StatusCard
            title="오늘 마음"
            value={latestResult?.emotion || "기록 전"}
            description="마음을 남겨보세요"
          />
        </div>

        {/* 안심 귀가 동행 서비스 섹션 */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm border-2 border-emerald-100 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">🛡️</span>
            <div>
              <p className="text-sm font-bold text-emerald-700">안심 귀가 동행</p>
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">오늘도 안전하게 이동해요</h2>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/student/homecoming"
              className="group flex flex-col items-center justify-center rounded-xl border-4 border-emerald-500 bg-emerald-50 p-6 transition hover:bg-emerald-100 active:scale-95"
            >
              <span className="mb-3 text-5xl transition-transform group-hover:scale-110 sm:text-6xl">🏠</span>
              <span className="text-xl font-black text-emerald-900 sm:text-2xl">집으로 가기</span>
            </Link>
            <button
              onClick={() => {
                const saveLocation = (lat: number, lng: number, source: "gps" | "demo", note?: string) => {
                  const now = new Date().toLocaleTimeString("ko-KR");
                  const state = {
                    studentName,
                    status: "위치 공유 중",
                    updatedAt: now,
                    message: note || "보호자에게 현재 위치를 한 번 전송했습니다.",
                    isSos: false,
                    phase: "idle",
                    latitude: lat,
                    longitude: lng,
                    battery: 88,
                  };
                  const legacyData = {
                    studentName,
                    phase: "idle",
                    method: "walking",
                    updatedAt: now,
                    location: {
                      latitude: lat,
                      longitude: lng,
                      source,
                      capturedAt: new Date().toISOString(),
                      note: note || "학생 홈에서 수동 위치 전송",
                    },
                    mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                  };
                  localStorage.setItem("haemileum_homecoming_state", JSON.stringify(state));
                  localStorage.setItem("haemileum_return_active", "true");
                  localStorage.setItem("haemileum_return_data", JSON.stringify(legacyData));
                  window.dispatchEvent(new Event("storage"));
                  alert(`보호자에게 위치를 전송했습니다!\n(위도: ${lat.toFixed(5)}, 경도: ${lng.toFixed(5)})`);
                };

                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      saveLocation(pos.coords.latitude, pos.coords.longitude, "gps");
                    },
                    (err) => {
                      console.warn("High-accuracy GPS failed or timed out. Trying low-accuracy...", err);
                      navigator.geolocation.getCurrentPosition(
                        (pos2) => {
                          saveLocation(pos2.coords.latitude, pos2.coords.longitude, "gps");
                        },
                        (err2) => {
                          console.warn("Low-accuracy GPS also failed", err2);
                          saveLocation(
                            37.5665,
                            126.978,
                            "demo",
                            "위치 권한이 거부되었거나 센서 문제로 모의 연습 위치(서울시청)를 전송했습니다. 실제 위치를 전송하려면 주소창 설정에서 위치 접근을 허용해 주세요."
                          );
                        },
                        { enableHighAccuracy: false, timeout: 2000, maximumAge: 30000 }
                      );
                    },
                    { enableHighAccuracy: true, timeout: 2000, maximumAge: 10000 }
                  );
                } else {
                  saveLocation(
                    37.5665,
                    126.978,
                    "demo",
                    "기기가 위치 기능을 지원하지 않아 모의 연습 위치(서울시청)를 전송했습니다."
                  );
                }
              }}
              className="group flex flex-col items-center justify-center rounded-xl border-4 border-sky-300 bg-sky-50 p-6 transition hover:bg-sky-100 active:scale-95"
            >
              <span className="mb-3 text-5xl transition-transform group-hover:scale-110 sm:text-6xl">👨‍👩‍👦</span>
              <span className="text-xl font-black text-sky-900 sm:text-2xl">내 위치 보내기</span>
            </button>
            <Link
              href="/student/homecoming?sos=true"
              className="group flex flex-col items-center justify-center rounded-xl border-4 border-rose-500 bg-rose-50 p-6 transition hover:bg-rose-100 active:scale-95"
            >
              <span className="mb-3 text-5xl transition-transform group-hover:scale-110 sm:text-6xl">🆘</span>
              <span className="text-xl font-black text-rose-700 sm:text-2xl">도움이 필요해요</span>
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-lg border p-5 shadow-sm transition ${"highlight" in action && action.highlight ? "sm:col-span-2 lg:col-span-1" : ""} ${action.color}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black shadow-sm ${"highlight" in action && action.highlight ? "bg-white/20" : "bg-white"}`}>
                  {action.icon}
                </span>
                <div>
                  <h2 className="text-lg font-black">{action.title}</h2>
                  <p className={`mt-1 text-sm leading-5 ${"highlight" in action && action.highlight ? "text-emerald-50" : "opacity-80"}`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  추천 미션
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  고르고 연습하기
                </h2>
              </div>
              <Link
                href="/mission/select"
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                전체 보기
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {recommendedMissions.map((mission) => (
                <Link
                  key={mission.title}
                  href={mission.href}
                  className="block rounded-lg border border-slate-200 p-5 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${mission.accent}`}
                    >
                      {mission.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {mission.tag}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                          {mission.level}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {mission.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {mission.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mission.steps.map((step) => (
                          <span
                            key={step}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                          >
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-emerald-700">나의 기록</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              최근에 해본 활동
            </h2>

            {recentResults.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-base font-semibold leading-7 text-slate-600">
                아직 기록이 없습니다.
                <br />
                위의 미션 시작하기를 눌러 첫 기록을 만들어보세요.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {recentResults.map((result, index) => (
                  <div
                    key={`${result.mission}-${index}`}
                    className="rounded-lg border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-black text-slate-950">
                        {result.mission}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                        {result.score}점
                      </span>
                    </div>

                    <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(Math.max(result.score, 0), 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                      마음: {result.emotion || "기록 전"} ·{" "}
                      {result.completedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-lg font-black text-amber-950">
              도움이 필요하면 멈춰도 됩니다.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
              어려운 화면이 나오면 선생님이나 보호자에게 보여주세요.
            </p>
          </div>
          <Link
            href="/routine/check"
            className="flex min-h-12 items-center justify-center rounded-lg bg-amber-700 px-5 py-3 text-base font-black text-white hover:bg-amber-800"
          >
            쉬운 활동으로 가기
          </Link>
        </div>
      </section>
    </main>

    {/* 법정대리인 동의 온보딩 모달 */}
    {showPrivacyModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-md">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl mb-5">
            👨‍👩‍👧
          </div>
          <h2 className="text-center text-2xl font-black text-slate-900">법정대리인 확인</h2>
          <p className="mt-3 text-center text-sm font-semibold leading-relaxed text-slate-600">
            해밀이음은 '공교육 에듀테크 가이드라인'에 따라 <strong>만 14세 미만 아동</strong>의 위치 정보 및 민감 정보를 보호하기 위해 보호자(법정대리인)의 직접적인 동의를 받습니다.
          </p>

          <div className="mt-8 space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <div className="flex-1">
                <span className="block text-sm font-bold text-slate-900">(필수) 서비스 이용약관 및 개인정보 처리방침 동의</span>
                <Link href="/privacy" target="_blank" className="text-xs font-bold text-emerald-600 hover:underline mt-1 inline-block">처리방침 전문 보기 ↗</Link>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                checked={agreeLocation}
                onChange={(e) => setAgreeLocation(e.target.checked)}
              />
              <div className="flex-1">
                <span className="block text-sm font-bold text-slate-900">(필수) 실시간 위치 및 마음 상태 수집 동의</span>
                <span className="block text-xs font-semibold text-slate-500 mt-1">
                  안심 귀가 동행 시 아이의 위치를 보호자 대시보드로 실시간 전송합니다.
                </span>
              </div>
            </label>
          </div>

          <button
            onClick={handleAgreePrivacy}
            disabled={!agreeTerms || !agreeLocation}
            className={`mt-8 w-full rounded-xl py-4 text-lg font-black transition-all ${
              agreeTerms && agreeLocation
                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            모두 확인 후 동의하기
          </button>
        </div>
      </div>
    )}
  </>
  );
}

function StatusCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 min-h-9 break-words text-xl font-black text-emerald-700 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
