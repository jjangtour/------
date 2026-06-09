"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";

type ReturnData = {
  studentName: string;
  phase: string;
  method: string;
  updatedAt: string;
  busNumber?: string;
  stopsLeft?: number;
  step?: string;
  location?: LocationSnapshot;
  mapUrl?: string;
};

type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "gps" | "demo";
  capturedAt: string;
  note?: string;
  issue?: "insecure" | "denied" | "unavailable" | "timeout" | "unsupported";
};

type RoutePlan = {
  homeAddress: string;
  destinationAddress: string;
  waypoints: string[];
  travelMode: "walking" | "transit" | "driving";
  note: string;
  updatedAt: string;
};

const PHASE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  "finding": { label: "현재 위치 확인 중", color: "text-emerald-800 bg-emerald-100", icon: "📍" },
  "method": { label: "귀가 방법 선택 중", color: "text-emerald-800 bg-emerald-100", icon: "🧭" },
  "walking": { label: "걸어서 이동 중", color: "text-emerald-800 bg-emerald-100", icon: "🚶" },
  "bus-to-stop": { label: "정류장으로 이동 중", color: "text-sky-800 bg-sky-100", icon: "🚏" },
  "bus-waiting": { label: "버스 기다리는 중", color: "text-sky-800 bg-sky-100", icon: "⏳" },
  "bus-arrived": { label: "버스 탑승 준비", color: "text-orange-800 bg-orange-100", icon: "🚌" },
  "bus-riding": { label: "버스 탑승 중", color: "text-sky-800 bg-sky-100", icon: "🚌" },
  "bus-alighting": { label: "버스에서 내리는 중", color: "text-indigo-800 bg-indigo-100", icon: "🔔" },
  "bus-walk-home": { label: "집까지 걸어가는 중", color: "text-emerald-800 bg-emerald-100", icon: "🚶" },
  "bus-walking-home": { label: "집까지 걸어가는 중", color: "text-emerald-800 bg-emerald-100", icon: "🚶" },
  "sos": { label: "도움 요청 중", color: "text-red-800 bg-red-100", icon: "🆘" },
};


type StudentResult = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
};

type RoutineRecord = {
  studentName: string;
  mission: string;
  score: number;
  status: string;
  emotion: string;
  completedAt: string;
  routines?: string[];
};

type EmotionRecord = {
  studentName: string;
  emotion: string;
  reason: string;
  stamp: string;
  completedAt: string;
};

type HomecomingState = {
  studentName: string;
  status: string;
  updatedAt: string;
  message: string;
  isSos: boolean;
  phase: string;
  battery: number;
  latitude?: number;
  longitude?: number;
  currentStepIndex?: number;
  waypoints?: string[];
  destination?: string;
  travelMode?: string;
  isSimulating?: boolean;
};

const sampleStudent = "김하늘";
const ROUTE_PLAN_KEY = "haemileum_return_route_plan";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const sampleResults: StudentResult[] = [
  {
    studentName: sampleStudent,
    mission: "키오스크 주문",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
  {
    studentName: sampleStudent,
    mission: "루틴 체크",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
  },
];

const sampleRoutines: RoutineRecord[] = [
  {
    studentName: sampleStudent,
    mission: "루틴 체크",
    score: 80,
    status: "완료",
    emotion: "안정",
    completedAt: "샘플 데이터",
    routines: [
      "정해진 시간에 일어나기",
      "가방 챙기기",
      "숙제 또는 알림 확인하기",
      "오늘 기분 말하기",
    ],
  },
];

const sampleEmotions: EmotionRecord[] = [
  {
    studentName: sampleStudent,
    emotion: "안정",
    reason: "친구와 이야기해서 좋았어요.",
    stamp: "오늘도 나를 잘 살폈어요",
    completedAt: "샘플 데이터",
  },
];

const homeGuideItems = [
  {
    title: "결과보다 과정을 칭찬하기",
    description: "점수보다 오늘 끝까지 해본 과정을 짧게 칭찬해 주세요.",
  },
  {
    title: "실제 생활에서 한 번 더 연습하기",
    description: "키오스크, 버스, 준비물 챙기기처럼 비슷한 상황을 가정에서 다시 이야기해 주세요.",
  },
  {
    title: "감정 표현을 기다려주기",
    description: "바로 답하지 못해도 괜찮습니다. 한 단어로 말해도 충분합니다.",
  },
];

function getMapEmbedUrl(location: LocationSnapshot) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    q: `${location.latitude},${location.longitude}`,
    zoom: "17",
    language: "ko",
    region: "KR",
  });

  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function getMapUrl(location: LocationSnapshot) {
  const params = new URLSearchParams({
    api: "1",
    query: `${location.latitude},${location.longitude}`,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function getMethodLabel(method: string) {
  if (method === "bus") return "버스";
  if (method === "walking") return "도보";
  return method;
}

function parseRoutePlan(value: string): RoutePlan | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as RoutePlan;
  } catch {
    return null;
  }
}

function getRoutePlanStr() {
  return typeof window !== "undefined"
    ? localStorage.getItem(ROUTE_PLAN_KEY) ?? ""
    : "";
}

function getInitialRoutePlan() {
  return parseRoutePlan(getRoutePlanStr());
}

function parseWaypoints(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRouteDestination(plan: RoutePlan) {
  return plan.destinationAddress || plan.homeAddress;
}

function getGoogleDirectionsUrl(plan: RoutePlan, origin?: LocationSnapshot | null) {
  const params = new URLSearchParams({
    api: "1",
    destination: getRouteDestination(plan),
    travelmode: plan.travelMode,
  });

  if (origin) {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  if (plan.waypoints.length > 0) {
    params.set("waypoints", plan.waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getGoogleDirectionsEmbedUrl(plan: RoutePlan, origin?: LocationSnapshot | null) {
  if (!GOOGLE_MAPS_API_KEY || !origin) return null;

  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    origin: `${origin.latitude},${origin.longitude}`,
    destination: getRouteDestination(plan),
    mode: plan.travelMode,
    language: "ko",
    region: "KR",
  });

  if (plan.waypoints.length > 0) {
    params.set("waypoints", plan.waypoints.join("|"));
  }

  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getReturnActiveStr = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("haemileum_return_active") ?? "false"
    : "false";

const getReturnDataStr = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("haemileum_return_data") ?? ""
    : "";

const getSelectedStudent = () =>
  localStorage.getItem("haemileum_selected_student") || sampleStudent;

const getSavedResults = () =>
  localStorage.getItem("haemileum_results") || "[]";

const getSavedRoutines = () =>
  localStorage.getItem("haemileum_routines") || "[]";

const getSavedEmotions = () =>
  localStorage.getItem("haemileum_emotions") || "[]";

const getHomecomingState = () =>
  localStorage.getItem("haemileum_homecoming_state") || null;

const getPrivacyAgreed = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("haemileum_privacy_agreed") || "false"
    : "false";

function readJsonArray<T>(value: string): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export default function ParentDashboardPage() {
  const selectedStudent = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => sampleStudent
  );
  const resultsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedResults,
    () => "[]"
  );
  const routinesText = useSyncExternalStore(
    subscribeToStorage,
    getSavedRoutines,
    () => "[]"
  );
  const emotionsText = useSyncExternalStore(
    subscribeToStorage,
    getSavedEmotions,
    () => "[]"
  );
  const homecomingText = useSyncExternalStore(
    subscribeToStorage,
    getHomecomingState,
    () => null
  );
  const privacyAgreedText = useSyncExternalStore(
    subscribeToStorage,
    getPrivacyAgreed,
    () => "false"
  );
  const isPrivacyAgreed = privacyAgreedText === "true";

  const returnActiveStr = useSyncExternalStore(
    subscribeToStorage,
    getReturnActiveStr,
    () => "false"
  );
  const returnDataStr = useSyncExternalStore(
    subscribeToStorage,
    getReturnDataStr,
    () => ""
  );

  const isReturnActive = returnActiveStr === "true";
  const returnData = useMemo<ReturnData | null>(() => {
    if (!returnDataStr) return null;
    try { return JSON.parse(returnDataStr) as ReturnData; } catch { return null; }
  }, [returnDataStr]);

  const results = useMemo(() => {
    const saved = readJsonArray<StudentResult>(resultsText).filter(
      (result) => result.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleResults;
  }, [resultsText, selectedStudent]);

  const routines = useMemo(() => {
    const saved = readJsonArray<RoutineRecord>(routinesText).filter(
      (routine) => routine.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleRoutines;
  }, [routinesText, selectedStudent]);

  const emotions = useMemo(() => {
    const saved = readJsonArray<EmotionRecord>(emotionsText).filter(
      (emotion) => emotion.studentName === selectedStudent
    );
    return saved.length > 0 ? saved : sampleEmotions;
  }, [emotionsText, selectedStudent]);

  const homecomingState = useMemo(() => {
    try {
      if (!homecomingText) return null;
      const state = JSON.parse(homecomingText) as HomecomingState;
      if (state.studentName !== selectedStudent) return null;
      return state;
    } catch {
      return null;
    }
  }, [homecomingText, selectedStudent]);

  // 주기적으로 storage 이벤트를 수동으로 트리거하여 백그라운드 탭 비활성화 등으로 인한 상태 동기화 지연을 완전히 방지합니다.
  useEffect(() => {
    const interval = setInterval(() => {
      window.dispatchEvent(new Event("storage"));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const latestResult = results[results.length - 1];
  const latestRoutine = routines[routines.length - 1];
  const latestEmotion = emotions[emotions.length - 1];
  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, result) => sum + normalizeScore(result.score), 0) /
            results.length
        )
      : 0;
  const completedCount = results.filter(
    (result) => result.status === "완료"
  ).length;
  const homeMessage = latestResult
    ? getParentGuide(latestResult, latestEmotion)
    : "오늘 활동 기록을 확인하고, 아이가 해낸 작은 시도를 먼저 칭찬해 주세요.";

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-indigo-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.86fr]">
            <div className="bg-indigo-700 p-7 text-white sm:p-9 relative">
              <div className="absolute top-6 right-6">
                {isPrivacyAgreed ? (
                  <span className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-100 ring-1 ring-emerald-400/50 backdrop-blur-sm shadow-sm">
                    ✅ 아동 개인정보보호 동의 완료
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 ring-1 ring-rose-400/50 backdrop-blur-sm shadow-sm">
                    ⚠️ 학생 앱에서 보호자 동의 필요
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-indigo-100 mt-4 sm:mt-0">학부모 대시보드</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {selectedStudent} 학생의 오늘을
                <br />
                가정에서 이어갑니다.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-indigo-50">
                학교와 앱에서 해본 활동을 확인하고, 집에서 바로 해볼 수
                있는 짧은 대화와 반복 연습으로 연결합니다.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              <GuideCard
                title="먼저 해낸 일을 칭찬합니다"
                text="점수보다 시도한 행동과 끝까지 해본 시간을 말해 주세요."
              />
              <GuideCard
                title="어려웠던 장면은 짧게 묻습니다"
                text="왜 못 했어보다 어느 부분이 헷갈렸어가 좋습니다."
              />
              <GuideCard
                title="내일 하나만 다시 해봅니다"
                text="같은 활동을 작게 반복하면 생활 속 일반화에 도움이 됩니다."
              />
            </div>
          </div>
        </div>

        <RoutePlannerPanel activeLocation={returnData?.location ?? null} />

        {/* 안심귀가 현황 */}
        <div className={`mb-6 overflow-hidden rounded-lg border shadow-sm ${isReturnActive && returnData?.phase === "sos" ? "border-red-300 bg-red-50" : isReturnActive ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${isReturnActive && returnData?.phase === "sos" ? "bg-red-200" : isReturnActive ? "bg-emerald-200" : "bg-slate-100"}`}>
                {isReturnActive && returnData ? (PHASE_LABELS[returnData.phase]?.icon ?? "📍") : "🏠"}
              </span>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${isReturnActive && returnData?.phase === "sos" ? "text-red-600" : isReturnActive ? "text-emerald-700" : "text-slate-500"}`}>
                  안심귀가 현황
                </p>
                <p className="text-xl font-black text-slate-900">
                  {isReturnActive && returnData
                    ? `${returnData.studentName} · ${PHASE_LABELS[returnData.phase]?.label ?? "이동 중"}`
                    : "귀가 기능이 꺼져 있어요"}
                </p>
                {isReturnActive && returnData && (
                  <p className="mt-0.5 text-sm font-semibold text-slate-600">
                    마지막 업데이트: {returnData.updatedAt}
                    {returnData.busNumber && ` · ${returnData.busNumber}번 버스`}
                    {returnData.stopsLeft !== undefined && ` · ${returnData.stopsLeft}정류장 남음`}
                    {returnData.step && ` · ${returnData.step}`}
                  </p>
                )}
              </div>
            </div>
            {isReturnActive && returnData && (
              <span className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black ${returnData.phase === "sos" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                {returnData.phase === "sos" ? "긴급 도움 요청" : "실시간 공유 중"}
              </span>
            )}
          </div>
          {isReturnActive && returnData && returnData.phase === "sos" && (
            <div className="border-t border-red-200 bg-red-100 px-5 py-4">
              <p className="text-base font-black text-red-900">
                아이가 도움을 요청했어요. 지금 바로 전화해 주세요.
              </p>
            </div>
          )}
          {isReturnActive && returnData && (
            <ReturnLocationPanel data={returnData} />
          )}
          {!isReturnActive && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-500">
                아이가 학생 앱에서 &quot;집으로 가기&quot;를 누르면 여기에 실시간 상태가 표시돼요.
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ParentCard
            title="최근 활동"
            value={latestResult?.mission || "기록 없음"}
            description="가장 최근 수행한 활동"
          />
          <ParentCard
            title="평균 점수"
            value={`${averageScore}점`}
            description="활동 기록 평균"
          />
          <ParentCard
            title="완료 기록"
            value={`${completedCount}건`}
            description="완료 처리된 활동"
          />
          <ParentCard
            title="최근 마음"
            value={latestEmotion?.emotion || latestResult?.emotion || "확인 필요"}
            description="마음 기록 기준"
            tone="warm"
          />
        </div>

        {/* 실시간 안심귀가 모니터링 섹션 */}
        {homecomingState && (
          <div className={`mb-6 rounded-xl border p-5 sm:p-7 shadow-sm transition-colors duration-500 ${homecomingState.isSos ? "bg-rose-50 border-rose-300" : "bg-white border-emerald-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-sm ${homecomingState.isSos ? "bg-rose-200 animate-pulse" : "bg-emerald-100"}`}>
                  {homecomingState.isSos ? "🚨" : "🛡️"}
                </span>
                <div>
                  <p className={`text-sm font-bold ${homecomingState.isSos ? "text-rose-700" : "text-emerald-700"}`}>
                    실시간 안심귀가 모니터링
                  </p>
                  <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                    현재 상태: {homecomingState.status}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">마지막 업데이트: {homecomingState.updatedAt}</p>
                <div className="mt-1 flex items-center justify-end gap-2 text-sm font-bold text-slate-700">
                  <span>🔋 배터리 {homecomingState.battery}%</span>
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${homecomingState.isSos ? "bg-rose-400" : "bg-emerald-400"}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${homecomingState.isSos ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-700 mb-4">현재 알림 및 진행 상황</p>
                <div className={`rounded-xl p-4 text-base font-bold leading-7 border-l-4 ${homecomingState.isSos ? "bg-rose-100 border-rose-500 text-rose-900" : "bg-emerald-50 border-emerald-500 text-emerald-900"}`}>
                  {homecomingState.message}
                </div>
                
                {/* 간소화된 진행 상태 바 */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>귀가 시작</span>
                    <span>이동 중</span>
                    <span>도착</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${homecomingState.isSos ? "bg-rose-500" : "bg-emerald-500"}`} 
                      style={{ width: homecomingState.phase === 'completed' ? '100%' : homecomingState.phase === 'bus-nav' || homecomingState.phase === 'walk-nav' ? '60%' : homecomingState.phase === 'locating' || homecomingState.phase === 'mode-select' ? '20%' : '5%' }} 
                    />
                  </div>
                </div>
              </div>

              {/* 실시간 위치 및 웨이포인트 진행 SVG 맵 */}
              <InteractiveProgressMap state={homecomingState} />
            </div>
            
            {homecomingState.isSos && (
              <div className="mt-5 flex gap-3">
                <a href="tel:01000000000" className="flex-1 rounded-lg bg-rose-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-rose-700 transition">
                  아이에게 즉시 전화걸기
                </a>
                <button 
                  onClick={() => {
                    alert("가장 가까운 관할 경찰서/센터에 위치가 전송되었습니다.");
                  }}
                  className="rounded-lg bg-white border-2 border-rose-300 px-4 py-3 text-center text-sm font-black text-rose-800 hover:bg-rose-50 transition"
                >
                  관계 기관 협조 요청
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-indigo-700">오늘 가정 연계</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                오늘은 이렇게 이야기해 보세요
              </h2>
              <p className="mt-4 rounded-lg bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-950 ring-1 ring-indigo-100">
                {homeMessage}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:flex-col">
              <Link
                href="/student/home"
                className="flex min-h-11 items-center justify-center rounded-lg bg-indigo-700 px-5 py-3 text-sm font-black text-white hover:bg-indigo-800"
              >
                학생 홈 보기
              </Link>
              <Link
                href="/mission/select"
                className="flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                미션 같이 보기
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-indigo-700">최근 활동 기록</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              무엇을 연습했나요?
            </h2>

            <div className="mt-5 grid gap-3">
              {results
                .slice()
                .reverse()
                .slice(0, 5)
                .map((result, index) => (
                  <ActivityItem
                    key={`${result.mission}-${index}`}
                    result={result}
                  />
                ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-bold text-indigo-700">마음과 루틴</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              집에서 이어볼 내용
            </h2>

            <div className="mt-5 rounded-lg bg-rose-50 p-4 ring-1 ring-rose-100">
              <p className="text-sm font-bold text-rose-700">최근 마음 기록</p>
              <p className="mt-2 text-xl font-black text-rose-950">
                {latestEmotion?.emotion || latestResult?.emotion || "기록 없음"}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-rose-900">
                {latestEmotion?.reason && latestEmotion.reason !== "입력 없음"
                  ? latestEmotion.reason
                  : "오늘 마음을 묻고, 한 단어로 표현해도 기다려 주세요."}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {(latestRoutine?.routines || [
                "가방 챙기기",
                "오늘 기분 말하기",
                "내일 할 일 하나 정하기",
              ]).map((routine) => (
                <div
                  key={routine}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"
                >
                  <p className="font-bold leading-6 text-slate-800">
                    {routine}
                  </p>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800">
                    가정 연계
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-bold text-indigo-700">실천 카드</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            오늘 바로 해볼 수 있는 말
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {homeGuideItems.map((item) => (
              <div key={item.title} className="rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
                <h3 className="text-lg font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/teacher/dashboard"
              className="rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              교사 대시보드 보기
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function normalizeScore(score: number) {
  return Number.isFinite(score) ? score : 0;
}

function getParentGuide(result: StudentResult, emotion?: EmotionRecord) {
  const feeling = emotion?.emotion || result.emotion || "";

  if (["불안", "걱정", "속상함"].includes(feeling)) {
    return "오늘은 결과보다 마음을 먼저 확인해 주세요. '어떤 부분이 어려웠어?'라고 짧게 물어보면 좋습니다.";
  }

  if (result.mission.includes("키오스크")) {
    return "다음 외출 때 실제 키오스크 화면을 함께 보며 메뉴 선택부터 천천히 다시 연습해 보세요.";
  }

  if (result.mission.includes("버스") || result.mission.includes("대중교통")) {
    return "집 근처 정류장 이름과 내려야 할 장소를 함께 확인해 주세요.";
  }

  if (result.mission.includes("대화")) {
    return "오늘 배운 표현을 가정 대화에서 한 문장으로 다시 말해보게 해 주세요.";
  }

  if (result.mission.includes("루틴")) {
    return "체크한 루틴 중 하나를 내일도 반복할 수 있도록 눈에 보이는 곳에 적어 주세요.";
  }

  return "오늘 한 활동을 짧게 회상하고, 스스로 선택한 점을 칭찬해 주세요.";
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-base font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function InteractiveProgressMap({ state }: { state: HomecomingState }) {
  const [mapMode, setMapMode] = useState<"progress" | "google">("progress");

  const waypoints = state.waypoints || [];
  const destination = state.destination || "집";
  const stepIdx = state.currentStepIndex ?? 0;
  const isSos = state.isSos ?? false;

  const allNodes = ["출발지", ...waypoints, destination];
  const totalNodes = allNodes.length;

  const showGoogleMap = mapMode === "google" && GOOGLE_MAPS_API_KEY && state.latitude && state.longitude;

  return (
    <div className="relative w-full h-full min-h-[260px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col p-4 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-700 tracking-wider">이동 경로 맵</span>
        </div>
        
        <div className="flex items-center gap-2">
          {GOOGLE_MAPS_API_KEY && state.latitude && state.longitude && (
            <button
              onClick={() => setMapMode(mapMode === "progress" ? "google" : "progress")}
              className="text-[10px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-md hover:bg-indigo-100 transition active:scale-95"
            >
              {mapMode === "progress" ? "🗺️ 실시간 구글맵" : "📊 노드 진행맵"}
            </button>
          )}
          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">
            {state.isSimulating ? "🧪 시뮬레이션" : "🛰️ GPS 수신"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
        {showGoogleMap ? (
          <iframe
            title="학생 실시간 위치 Google 지도"
            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${state.latitude},${state.longitude}&zoom=17&language=ko`}
            className="absolute inset-0 w-full h-full border-0 rounded-lg"
            loading="lazy"
          />
        ) : (
          <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet">
            {/* Background path line (dashed gray) */}
            <path
              d="M 30 60 Q 110 20, 150 60 T 270 60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4"
              strokeDasharray="6,6"
            />

            {/* Completed path segment (solid emerald) */}
            {stepIdx > 0 && (
              <path
                d="M 30 60 Q 110 20, 150 60 T 270 60"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={`${Math.min(260, (stepIdx / (totalNodes - 1)) * 260)}, 300`}
                className="transition-all duration-1000"
              />
            )}

            {/* Nodes */}
            {allNodes.map((node, i) => {
              const ratio = i / (totalNodes - 1);
              const x = 30 + ratio * 240;
              const y = 60 - 25 * Math.sin(ratio * Math.PI * 2);

              const isCompleted = i < stepIdx;
              const isActive = i === stepIdx;

              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? "9" : "5"}
                    fill={isCompleted ? "#10b981" : isActive ? "#3b82f6" : "#cbd5e1"}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      className="animate-ping"
                      strokeOpacity="0.4"
                    />
                  )}

                  <text
                    x={x}
                    y={y - 14}
                    textAnchor="middle"
                    className={`text-[8px] font-black tracking-tight ${
                      isActive ? "fill-blue-700 font-extrabold" : isCompleted ? "fill-emerald-700" : "fill-slate-400"
                    }`}
                  >
                    {node.length > 6 ? node.slice(0, 5) + ".." : node}
                  </text>
                </g>
              );
            })}

            {/* Child Avatar Icon along the path */}
            {(() => {
              const ratio = Math.min(1, Math.max(0, stepIdx / (totalNodes - 1)));
              const x = 30 + ratio * 240;
              const y = 60 - 25 * Math.sin(ratio * Math.PI * 2);

              return (
                <g transform={`translate(${x}, ${y})`} className="transition-all duration-500">
                  <circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill={isSos ? "#ffe4e6" : "#ecfdf5"}
                    stroke={isSos ? "#ef4444" : "#10b981"}
                    strokeWidth="2.5"
                    className="shadow-sm"
                  />
                  <text x="0" y="4" textAnchor="middle" className="text-[11px] select-none font-bold">
                    {isSos ? "🆘" : "👧"}
                  </text>
                </g>
              );
            })()}
          </svg>
        )}
      </div>

      <div className="border-t border-slate-200/60 pt-2 mt-2 flex justify-between text-[9px] font-bold text-slate-500 shrink-0 select-none">
        <span>🚩 출발: 학교</span>
        <span>🏠 도착: {destination}</span>
      </div>
    </div>
  );
}

function RoutePlannerPanel({ activeLocation }: { activeLocation: LocationSnapshot | null }) {
  const initialPlan = getInitialRoutePlan();
  const [homeAddress, setHomeAddress] = useState(initialPlan?.homeAddress ?? "");
  const [destinationAddress, setDestinationAddress] = useState(
    initialPlan?.destinationAddress ?? initialPlan?.homeAddress ?? ""
  );
  const [waypointsText, setWaypointsText] = useState(
    initialPlan?.waypoints.join("\n") ?? ""
  );
  const [travelMode, setTravelMode] = useState<RoutePlan["travelMode"]>(
    initialPlan?.travelMode ?? "walking"
  );
  const [note, setNote] = useState(initialPlan?.note ?? "");
  const routePlanText = useSyncExternalStore(
    subscribeToStorage,
    getRoutePlanStr,
    () => ""
  );
  const activePlan = useMemo(() => parseRoutePlan(routePlanText), [routePlanText]);

  const handleSave = () => {
    const trimmedHome = homeAddress.trim();
    const trimmedDestination = destinationAddress.trim() || trimmedHome;

    if (!trimmedHome || !trimmedDestination) return;

    const plan: RoutePlan = {
      homeAddress: trimmedHome,
      destinationAddress: trimmedDestination,
      waypoints: parseWaypoints(waypointsText),
      travelMode,
      note: note.trim(),
      updatedAt: new Date().toLocaleString("ko-KR"),
    };

    localStorage.setItem(ROUTE_PLAN_KEY, JSON.stringify(plan));
    window.dispatchEvent(new Event("storage"));
  };

  const handleClear = () => {
    localStorage.removeItem(ROUTE_PLAN_KEY);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
      <div className="grid gap-0 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="p-5 sm:p-6">
          <p className="text-sm font-bold text-emerald-700">귀가 경로 설정</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            집 주소와 경유지를 저장해요
          </h2>

          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-700">학생 집 주소</span>
              <input
                value={homeAddress}
                onChange={(event) => setHomeAddress(event.target.value)}
                placeholder="예: 서울시 ○○구 ○○로 12"
                className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-700">도착지</span>
              <input
                value={destinationAddress}
                onChange={(event) => setDestinationAddress(event.target.value)}
                placeholder="집 주소와 같으면 비워도 돼요"
                className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-700">웨이포인트</span>
              <textarea
                value={waypointsText}
                onChange={(event) => setWaypointsText(event.target.value)}
                placeholder={"학교 정문\n파란 편의점\n큰 횡단보도"}
                rows={4}
                className="resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold leading-6 text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>

            <div>
              <p className="text-sm font-black text-slate-700">이동 방법</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: "walking", label: "도보" },
                  { id: "transit", label: "대중교통" },
                  { id: "driving", label: "차량" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTravelMode(mode.id as RoutePlan["travelMode"])}
                    className={`min-h-11 rounded-lg px-3 text-sm font-black ${
                      travelMode === mode.id
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-slate-700">안내 메모</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="예: 횡단보도에서는 초록불을 기다려요"
                className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                type="submit"
                className="min-h-12 rounded-lg bg-emerald-600 px-5 py-3 text-base font-black text-white hover:bg-emerald-700"
              >
                학생 화면에 공유
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="min-h-12 rounded-lg bg-white px-5 py-3 text-base font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                공유 끄기
              </button>
            </div>
          </form>
        </div>

        <RoutePlanPreview plan={activePlan} activeLocation={activeLocation} />
      </div>
    </section>
  );
}

function RoutePlanPreview({
  plan,
  activeLocation,
}: {
  plan: RoutePlan | null;
  activeLocation: LocationSnapshot | null;
}) {
  if (!plan) {
    return (
      <div className="border-t border-emerald-100 bg-emerald-50 p-5 sm:p-6 xl:border-l xl:border-t-0">
        <p className="text-sm font-bold text-emerald-700">공유 경로</p>
        <h3 className="mt-1 text-2xl font-black text-slate-950">
          아직 저장된 경로가 없어요
        </h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          주소와 경유지를 저장하면 학생 안심귀가 화면에서 같은 경로를 볼 수 있어요.
        </p>
      </div>
    );
  }

  const embedUrl = getGoogleDirectionsEmbedUrl(plan, activeLocation);
  const directionsUrl = getGoogleDirectionsUrl(plan, activeLocation);
  const routeItems = ["현재 위치", ...plan.waypoints, getRouteDestination(plan)];

  return (
    <div className="border-t border-emerald-100 bg-emerald-50 p-5 sm:p-6 xl:border-l xl:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-700">공유 경로</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">
            학생 화면에 공유 중
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            마지막 저장: {plan.updatedAt}
          </p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
        >
          Google 지도 열기
        </a>
      </div>

      <div className="mt-4 grid gap-2">
        {routeItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-emerald-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
              {index + 1}
            </span>
            <p className="min-w-0 break-words text-sm font-black text-slate-800">
              {item}
            </p>
          </div>
        ))}
      </div>

      {plan.note && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-100">
          {plan.note}
        </p>
      )}

      {embedUrl && (
        <div className="mt-4 h-64 overflow-hidden rounded-lg border border-emerald-200 bg-white">
          <iframe
            title="보호자 설정 Google 길찾기"
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}

function ReturnLocationPanel({ data }: { data: ReturnData }) {
  const location = data.location;

  if (!location) {
    return (
      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <p className="text-sm font-black text-slate-700">지도 위치를 기다리는 중이에요.</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          아이 화면에서 위치 권한이 허용되면 Google 지도가 여기에 표시돼요.
        </p>
      </div>
    );
  }

  const mapUrl = data.mapUrl || getMapUrl(location);
  const mapEmbedUrl = getMapEmbedUrl(location);
  const isActualGps = location.source === "gps";
  const issueTitle =
    location.issue === "insecure"
      ? "HTTPS 접속이 아니라 실제 위치 미수신"
      : location.issue === "denied"
      ? "학생 기기에서 위치 권한 거부됨"
      : location.issue === "unsupported"
      ? "학생 브라우저 위치 기능 미지원"
      : location.issue
      ? "학생 위치 신호 대기 중"
      : "연습 위치 표시 중";

  return (
    <div className="border-t border-emerald-100 bg-white px-5 py-5">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {mapEmbedUrl ? (
          <div className="h-56 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <iframe
              title={`${data.studentName} 현재 위치 Google 지도`}
              src={mapEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-5 text-center text-sm font-bold leading-6 text-slate-500">
            Google Maps API 키가 설정되면 지도가 표시돼요.
          </div>
        )}

        <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
            Google Maps 위치 공유
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {isActualGps ? "실제 위치 수신 중" : issueTitle}
          </h3>
          <div className="mt-4 grid gap-2 text-sm font-bold leading-6 text-slate-700">
            <p>이동 방법: {getMethodLabel(data.method)}</p>
            <p>좌표: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
            {location.accuracy && <p>정확도: 약 {location.accuracy}m</p>}
            <p>수신 시간: {data.updatedAt}</p>
            {location.note && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">{location.note}</p>}
            {location.issue === "insecure" && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700 ring-1 ring-slate-200">
                학생 화면이 HTTP IP 주소로 열려 있어 브라우저가 GPS를 차단했습니다. HTTPS 주소로 접속해야 실제 위치가 부모 화면에 올라옵니다.
              </p>
            )}
          </div>
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
          >
            Google 지도에서 보기
          </a>
        </div>
      </div>
    </div>
  );
}

function ParentCard({
  title,
  value,
  description,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "warm";
}) {
  const valueClass = tone === "warm" ? "text-rose-700" : "text-indigo-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className={`mt-2 min-h-9 break-words text-xl font-black sm:text-2xl ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ActivityItem({ result }: { result: StudentResult }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-black text-slate-950">{result.mission}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-800 ring-1 ring-indigo-100">
          {normalizeScore(result.score)}점
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {result.status} · 정서 {result.emotion || "기록 없음"} ·{" "}
        {result.completedAt}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-indigo-800">
        {getParentGuide(result)}
      </p>
    </div>
  );
}
