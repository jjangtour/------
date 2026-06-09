"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef, useSyncExternalStore, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type HomecomingPhase =
  | "confirm"
  | "locating"
  | "mode-select"
  | "bus-nav"
  | "walk-nav"
  | "completed";

type NavDirection = "forward" | "right" | "left" | "arrive" | "bus" | "bell" | "walk";

type NavStep = {
  text: string;
  subtext: string;
  voice: string;
  ieumiMsg: string;
  action: string;
  next: number;
  icon?: string;
  direction: NavDirection;
};

type HomecomingState = {
  studentName: string;
  status: string;
  updatedAt: string;
  message: string;
  isSos: boolean;
  phase: string;
  battery: number;
};

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getSelectedStudent = () =>
  (typeof window !== "undefined"
    ? localStorage.getItem("haemileum_selected_student")
    : "") || "학생";

// ─── AR Direction Arrow ───────────────────────────────────────────────────────

function ArDirectionArrow({ direction }: { direction: NavDirection }) {
  const cfg: Record<NavDirection, { symbol: string; color: string }> = {
    forward: { symbol: "↑",  color: "#34d399" },
    right:   { symbol: "↗",  color: "#34d399" },
    left:    { symbol: "↖",  color: "#34d399" },
    arrive:  { symbol: "🏠", color: "#fcd34d" },
    bus:     { symbol: "🚌", color: "#7dd3fc" },
    bell:    { symbol: "🔔", color: "#fb923c" },
    walk:    { symbol: "🚶", color: "#34d399" },
  };
  const { symbol, color } = cfg[direction];

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Main arrow */}
      <div
        className="text-[96px] leading-none font-black drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
        style={{ color, animation: "arPulse 1.8s ease-in-out infinite" }}
      >
        {symbol}
      </div>

      {/* Ripple rings */}
      <div className="relative flex items-center justify-center w-20 h-16 -mt-2">
        <div
          className="absolute w-14 h-14 rounded-full border-4 border-emerald-400/70"
          style={{ animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }}
        />
        <div
          className="absolute w-20 h-20 rounded-full border-2 border-emerald-400/40"
          style={{ animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite", animationDelay: "0.35s" }}
        />
        <div className="w-3 h-3 rounded-full shadow-[0_0_16px_rgba(52,211,153,0.9)]" style={{ background: color }} />
      </div>
    </div>
  );
}

// ─── 이음이 Mascot Row ─────────────────────────────────────────────────────────

function IeumiMascot({ text, speaking }: { text: string; speaking: boolean }) {
  return (
    <div className="flex items-end gap-3 px-2 select-none pointer-events-none">
      {/* Character */}
      <div
        className="shrink-0 transition-transform duration-200"
        style={speaking ? { transform: "scale(1.12)", animation: "ieumiTalk 0.3s ease-in-out infinite alternate" } : {}}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/helper/ieumi.png"
          alt="이음이"
          className="w-16 h-16 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* Speech bubble */}
      <div
        className={`relative bg-white/90 backdrop-blur-md rounded-2xl rounded-bl-none px-4 py-3 shadow-xl border border-white/50 transition-all duration-300 max-w-[220px] ${speaking ? "scale-105" : "scale-100"}`}
      >
        <p className="text-sm font-black text-slate-900 leading-snug">{text}</p>
        {/* Tail */}
        <div className="absolute -bottom-[9px] left-3 w-4 h-4 bg-white/90 rotate-45 border-b border-r border-white/50" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function HomecomingPageContent() {
  const searchParams = useSearchParams();
  const initSos = searchParams.get("sos") === "true";

  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "학생"
  );

  const [phase, setPhase] = useState<HomecomingPhase>("confirm");
  const [isSos, setIsSos] = useState(initSos);
  const [navStep, setNavStep] = useState(0);
  const [arEnabled, setArEnabled] = useState(false);
  const [ieumiSpeaking, setIeumiSpeaking] = useState(false);
  const [ieumiText, setIeumiText] = useState("안녕! 이음이가 함께 갈게요 🏠");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToParent = useCallback(
    (
      status: string,
      message: string,
      sosStatus = false,
      currentPhase: string = phase
    ) => {
      if (typeof window === "undefined") return;
      const state: HomecomingState = {
        studentName,
        status,
        updatedAt: new Date().toLocaleString("ko-KR"),
        message,
        isSos: sosStatus,
        phase: currentPhase,
        battery: 84,
      };
      localStorage.setItem("haemileum_homecoming_state", JSON.stringify(state));
      window.dispatchEvent(new Event("storage"));
    },
    [studentName, phase]
  );

  const speak = useCallback(
    (text: string, ieumiMsg?: string) => {
      if (typeof window === "undefined") return;
      if (localStorage.getItem("haemileum_sound_muted") === "true") return;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (ieumiMsg) setIeumiText(ieumiMsg);
      setIeumiSpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = setTimeout(() => setIeumiSpeaking(false), 3000);

      const gender =
        localStorage.getItem("haemileum_voice_gender") || "female";
      const audio = new Audio(
        `/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`
      );
      audioRef.current = audio;
      audio.play().catch((e) => console.warn("TTS Play Failed", e));
    },
    []
  );

  const triggerSos = useCallback(() => {
    setIsSos(true);
    speak(
      "괜찮아요. 멈춰서 천천히 숨 쉬어요. 보호자에게 알렸어요.",
      "걱정 마요! 꼭 도와드릴게요 💙"
    );
    syncToParent("위험 상황", "아이가 SOS 버튼을 눌렀습니다!", true);
  }, [speak, syncToParent]);

  const cancelSos = () => {
    setIsSos(false);
    speak("다시 안내를 시작할게요.", "다시 같이 가요! 🏠");
    syncToParent(
      phase === "completed" ? "귀가 완료" : "귀가 중",
      "아이가 안정을 되찾았습니다.",
      false
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setArEnabled(true);
      speak("AR 모드로 길을 안내할게요!", "AR 모드 켰어요! 같이 가요 🗺️");
      syncToParent("AR 모드 실행 중", "아이가 AR 카메라를 켜고 길을 찾고 있습니다.");
    } catch {
      alert("카메라를 켤 수 없습니다. (권한 거부 또는 기기 미지원)");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setArEnabled(false);
  };

  useEffect(() => {
    if (initSos) {
      triggerSos();
    } else {
      speak(
        "집으로 갈까요? 맞으면 네, 아니면 아니요를 눌러주세요.",
        "집에 갈까요? 🏠"
      );
    }
    return () => {
      stopCamera();
      if (audioRef.current) audioRef.current.pause();
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    setPhase("locating");
    speak(
      "지금 있는 곳을 찾고 있어요. 잠시만 기다려요.",
      "위치 찾는 중... 조금만요! 📍"
    );
    syncToParent("위치 확인 중", "아이가 귀가를 위해 위치를 확인하고 있습니다.", false, "locating");

    setTimeout(() => {
      setPhase("mode-select");
      speak(
        "현재 위치를 찾았어요. 가장 쉬운 길을 추천해 줄게요.",
        "길을 찾았어요! 어떻게 갈까요? 🗺️"
      );
      syncToParent("경로 선택 대기", "아이가 귀가 방법을 선택하고 있습니다.", false, "mode-select");
    }, 2500);
  };

  const handleSelectBus = () => {
    setPhase("bus-nav");
    setNavStep(0);
    speak("정류장으로 가요. 걸어서 3분이에요.", "정류장까지 같이 가요! 🚏");
    syncToParent("정류장 이동 중", "아이가 버스 정류장으로 이동 중입니다.", false, "bus-nav");
  };

  const handleSelectWalk = () => {
    setPhase("walk-nav");
    setNavStep(0);
    speak(
      "앞으로 조금 걸어요. 편의점 앞에서 오른쪽으로 가요.",
      "걸어서 갈게요! 이음이도 함께예요 🚶"
    );
    syncToParent("도보 귀가 시작", "아이가 걸어서 집으로 이동하고 있습니다.", false, "walk-nav");
  };

  const handleComplete = () => {
    setPhase("completed");
    speak(
      "잘했어요! 집에 도착했습니다. 오늘도 멋지게 해냈어요!",
      "집이다! 정말 잘했어요! 🎉"
    );
    syncToParent("귀가 완료", "아이가 안전하게 집에 도착했습니다.", false, "completed");

    const prevXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
    );
    localStorage.setItem(
      `haemileum_student_xp_${studentName}`,
      String(prevXp + 100)
    );

    const saved: object[] = JSON.parse(
      localStorage.getItem("haemileum_results") || "[]"
    );
    saved.push({
      studentName,
      mission: "안심 귀가 동행",
      score: 100,
      status: "완료",
      emotion: "안정",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
  };

  const busSteps: NavStep[] = [
    {
      text: "정류장으로 가요",
      subtext: "걸어서 3분이에요",
      voice: "정류장으로 가요. 걸어서 3분이에요.",
      ieumiMsg: "정류장 보여요? 같이 가요! 🚏",
      action: "정류장 도착했어요",
      next: 1,
      direction: "forward",
    },
    {
      text: "23번 버스를 타요",
      subtext: "버스 번호를 꼭 확인해요",
      voice: "23번 버스를 타요. 버스 번호를 꼭 확인해요.",
      ieumiMsg: "23번 버스예요! 확인해요 🚌",
      action: "버스를 탔어요",
      next: 2,
      icon: "🚌",
      direction: "bus",
    },
    {
      text: "3정류장 뒤에 내려요",
      subtext: "○○시장 → ○○초등학교 → 우리집앞",
      voice: "3정류장 뒤에 내려요. 다음 정류장에서 내릴 준비를 해요.",
      ieumiMsg: "조금만 더! 내릴 준비해요 🔔",
      action: "하차벨 눌렀어요",
      next: 3,
      icon: "🔔",
      direction: "bell",
    },
    {
      text: "잘 내렸어요. 이제 집까지 걸어가요",
      subtext: "거의 다 왔어요",
      voice: "잘 내렸어요. 이제 집까지 천천히 걸어가요.",
      ieumiMsg: "거의 다 왔어요! 조금만요 🏠",
      action: "집 도착!",
      next: 4,
      icon: "🏠",
      direction: "walk",
    },
  ];

  const walkSteps: NavStep[] = [
    {
      text: "앞으로 조금 걸어요",
      subtext: "편의점 앞에서 오른쪽으로 가요",
      voice: "앞으로 조금 걸어요. 편의점 앞에서 오른쪽으로 가요.",
      ieumiMsg: "편의점 보이면 오른쪽이에요! ➡️",
      action: "다음",
      next: 1,
      direction: "forward",
    },
    {
      text: "횡단보도 앞에서 멈춰요",
      subtext: "파란불이 켜지면 건너요",
      voice: "횡단보도 앞에서 멈춰요. 파란불이 켜지면 건너요.",
      ieumiMsg: "파란불 꼭 확인해요! 🚦",
      action: "건넜어요",
      next: 2,
      direction: "forward",
    },
    {
      text: "우리 아파트가 보여요",
      subtext: "거의 다 왔어요",
      voice: "우리 아파트가 보여요. 천천히 걸어가요.",
      ieumiMsg: "아파트다! 거의 다 왔어요! 🏠",
      action: "집 도착!",
      next: 3,
      icon: "🏠",
      direction: "arrive",
    },
  ];

  const stepsArr = phase === "bus-nav" ? busSteps : walkSteps;
  const currentNav = stepsArr[navStep] as NavStep | undefined;

  const advanceNav = () => {
    if (!currentNav) return;
    if (navStep < stepsArr.length - 1) {
      const next = stepsArr[navStep + 1];
      setNavStep(next.next);
      speak(next.voice, next.ieumiMsg);

      let parentStatus = "이동 중";
      let parentMsg = `아이가 다음 단계로 이동했습니다: ${next.text}`;

      if (next.action === "버스를 탔어요") {
        parentStatus = "정류장 대기";
        parentMsg = "아이가 23번 버스를 기다리고 있습니다.";
      } else if (next.action === "하차벨 눌렀어요") {
        parentStatus = "버스 탑승 중";
        parentMsg = "아이가 23번 버스에 탑승했다고 표시했습니다.";
      }

      syncToParent(parentStatus, parentMsg, false, phase);
    } else {
      handleComplete();
    }
  };

  const isNavPhase = phase === "bus-nav" || phase === "walk-nav";

  return (
    <>
      {/* CSS keyframes injected inline for animation */}
      <style>{`
        @keyframes arPulse {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.75; transform: translateY(-8px); }
        }
        @keyframes ieumiTalk {
          from { transform: rotate(-3deg) scale(1.1); }
          to   { transform: rotate(3deg)  scale(1.15); }
        }
      `}</style>

      <main className="relative min-h-dvh bg-[#f4f7f5] text-slate-900 font-sans overflow-x-hidden overflow-y-auto">
        {/* ── AR camera background ── */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            arEnabled ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        {arEnabled && (
          <div className="fixed inset-0 bg-black/25 pointer-events-none" />
        )}

        {/* ── Main content ── */}
        <div
          className={`relative z-10 w-full min-h-dvh flex flex-col p-5 sm:p-8 max-w-lg mx-auto ${
            arEnabled ? "text-white" : ""
          }`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 shrink-0">
            <Link
              href="/student/home"
              className={`text-sm font-bold px-4 py-2 rounded-full backdrop-blur-md border ${
                arEnabled
                  ? "bg-black/30 border-white/20 text-white"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              ← 뒤로 가기
            </Link>
            <div
              className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md ${
                arEnabled
                  ? "bg-emerald-500/80 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              <span className="animate-pulse">🟢</span> 위치 공유 중
            </div>
          </div>

          {/* Phase content */}
          <div className="flex-1 flex flex-col justify-center gap-5">

            {/* ── CONFIRM ── */}
            {phase === "confirm" && (
              <div
                className={`text-center p-8 rounded-3xl ${
                  arEnabled
                    ? "bg-black/50 backdrop-blur-md"
                    : "bg-white shadow-xl border-2 border-emerald-100"
                }`}
              >
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/helper/ieumi.png"
                      alt="이음이"
                      className="w-20 h-20 object-contain animate-bounce"
                    />
                    <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
                      안녕!
                    </span>
                  </div>
                </div>
                <h1 className="text-4xl font-black mb-2">집으로 갈까요?</h1>
                <p
                  className={`text-base font-bold mb-8 ${
                    arEnabled ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  이음이가 함께 안내해 줄게요
                </p>
                <div className="grid gap-4">
                  <button
                    onClick={handleConfirm}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-2xl font-black py-6 rounded-2xl transition active:scale-95 shadow-lg"
                  >
                    네, 집으로 갈래요
                  </button>
                  <Link
                    href="/student/home"
                    className="block bg-slate-200 hover:bg-slate-300 text-slate-800 text-xl font-bold py-5 rounded-2xl transition active:scale-95 text-center"
                  >
                    아니요 (종료)
                  </Link>
                </div>
              </div>
            )}

            {/* ── LOCATING ── */}
            {phase === "locating" && (
              <div
                className={`text-center p-8 rounded-3xl ${
                  arEnabled
                    ? "bg-black/50 backdrop-blur-md"
                    : "bg-white shadow-xl border-2 border-emerald-100"
                }`}
              >
                <div className="text-6xl animate-bounce mb-6">📍</div>
                <h1 className="text-2xl font-black mb-4">
                  지금 있는 곳을 찾고 있어요
                </h1>
                <p
                  className={`font-bold ${
                    arEnabled ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  잠시만 기다려요...
                </p>
                <div className="flex justify-center gap-2 mt-5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── MODE SELECT ── */}
            {phase === "mode-select" && (
              <div
                className={`p-8 rounded-3xl ${
                  arEnabled
                    ? "bg-black/50 backdrop-blur-md"
                    : "bg-white shadow-xl border-2 border-emerald-100"
                }`}
              >
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/helper/ieumi.png"
                    alt="이음이"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-black mb-1 text-center">
                  가장 쉬운 길을 찾았어요
                </h1>
                <p
                  className={`text-sm font-bold mb-6 text-center ${
                    arEnabled ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  이음이와 함께 어떻게 갈까요?
                </p>

                <div className="grid gap-4">
                  <button
                    onClick={handleSelectBus}
                    className="relative bg-sky-50 hover:bg-sky-100 border-4 border-sky-400 text-sky-900 py-6 px-4 rounded-2xl transition active:scale-95 text-left flex items-center gap-4"
                  >
                    <span className="text-5xl">🚌</span>
                    <div>
                      <span className="block text-xs font-black text-sky-600 mb-1">
                        👍 추천 경로
                      </span>
                      <span className="block text-2xl font-black">
                        버스 타고 가기
                      </span>
                      <span className="block text-sm font-bold mt-1">
                        23번 버스를 타면 쉽게 가요.
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleSelectWalk}
                    className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-800 py-5 px-4 rounded-2xl transition active:scale-95 text-left flex items-center gap-4"
                  >
                    <span className="text-4xl">🚶</span>
                    <div>
                      <span className="block text-xl font-black">
                        걸어서 가기
                      </span>
                      <span className="block text-sm font-bold mt-1">
                        도보로 약 20분 걸려요.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── NAVIGATION ── */}
            {isNavPhase && currentNav && (
              <div className="flex flex-col gap-4">
                {/* AR direction arrow */}
                {arEnabled && (
                  <div className="flex justify-center py-4">
                    <ArDirectionArrow direction={currentNav.direction} />
                  </div>
                )}

                {/* 이음이 mascot – shown in AR mode */}
                {arEnabled && (
                  <IeumiMascot text={ieumiText} speaking={ieumiSpeaking} />
                )}

                {/* Nav card */}
                <div
                  className={`p-6 sm:p-8 rounded-3xl ${
                    arEnabled
                      ? "bg-black/60 backdrop-blur-xl border border-white/20"
                      : "bg-white shadow-xl border-2 border-emerald-500"
                  }`}
                >
                  {/* Header row: step progress */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1.5">
                      {stepsArr.map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i < navStep
                              ? "w-5 bg-emerald-400"
                              : i === navStep
                              ? "w-8 bg-emerald-500"
                              : "w-2 bg-slate-400/40"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        arEnabled ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {navStep + 1} / {stepsArr.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    {currentNav.icon && (
                      <span className="text-5xl">{currentNav.icon}</span>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                      {currentNav.text}
                    </h1>
                  </div>

                  {currentNav.subtext && (
                    <p
                      className={`text-base font-bold mb-5 ${
                        arEnabled ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {currentNav.subtext}
                    </p>
                  )}

                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <button
                      onClick={advanceNav}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black py-5 rounded-2xl transition active:scale-95 shadow-md"
                    >
                      {currentNav.action}
                    </button>
                    <button
                      onClick={() => speak(currentNav.voice, currentNav.ieumiMsg)}
                      className={`w-16 flex items-center justify-center rounded-2xl text-2xl transition ${
                        arEnabled
                          ? "bg-white/20 hover:bg-white/30"
                          : "bg-slate-100 hover:bg-slate-200"
                      }`}
                      aria-label="다시 듣기"
                    >
                      🔊
                    </button>
                  </div>
                </div>

                {/* 이음이 mascot in non-AR mode – shown at bottom */}
                {!arEnabled && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 ${
                      ieumiSpeaking ? "scale-[1.02]" : ""
                    } transition-transform`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/helper/ieumi.png"
                      alt="이음이"
                      className={`w-14 h-14 object-contain shrink-0 ${
                        ieumiSpeaking ? "animate-bounce" : ""
                      }`}
                    />
                    <div>
                      <p className="text-xs font-black text-emerald-600 mb-1">
                        이음이의 안내
                      </p>
                      <p className="text-base font-black text-slate-900">
                        {ieumiText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COMPLETED ── */}
            {phase === "completed" && (
              <div
                className={`text-center p-8 rounded-3xl ${
                  arEnabled
                    ? "bg-black/50 backdrop-blur-md"
                    : "bg-white shadow-xl border-2 border-emerald-100"
                }`}
              >
                <div className="flex justify-center mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/helper/ieumi.png"
                    alt="이음이"
                    className="w-20 h-20 object-contain animate-bounce"
                  />
                </div>
                <div className="text-5xl mb-4">🎉</div>
                <h1 className="text-3xl font-black mb-3">
                  안전하게 도착했어요!
                </h1>
                <p
                  className={`font-bold mb-1 ${
                    arEnabled ? "text-emerald-300" : "text-emerald-600"
                  }`}
                >
                  이음이가 정말 자랑스러워요!
                </p>
                <p
                  className={`font-bold mb-8 ${
                    arEnabled ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  오늘도 스스로 집까지 온 것을 칭찬해요.
                </p>
                <Link
                  href="/student/home"
                  className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black py-5 rounded-2xl transition active:scale-95 shadow-lg text-center"
                >
                  홈으로 돌아가기 (+100 XP)
                </Link>
              </div>
            )}
          </div>

          {/* ── Bottom tools ── */}
          {!["confirm", "locating", "completed"].includes(phase) && !isSos && (
            <div className="mt-6 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={arEnabled ? stopCamera : startCamera}
                className={`py-4 rounded-2xl font-black text-sm flex flex-col items-center gap-1.5 transition active:scale-95 border-2 ${
                  arEnabled
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <span className="text-2xl">{arEnabled ? "📷" : "👀"}</span>
                {arEnabled ? "AR 카메라 끄기" : "AR 카메라 켜기"}
              </button>
              <button
                onClick={triggerSos}
                className="bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black text-sm flex flex-col items-center gap-1.5 transition active:scale-95 shadow-md"
              >
                <span className="text-2xl">🚨</span>
                도움 요청 (SOS)
              </button>
            </div>
          )}
        </div>

        {/* ── SOS overlay ── */}
        {isSos && (
          <div className="absolute inset-0 bg-rose-950/95 flex flex-col p-6 z-50">
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
              <div className="w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center text-5xl animate-pulse shadow-[0_0_50px_rgba(225,29,72,0.8)] mb-8">
                🆘
              </div>

              {/* 이음이 comforting */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/helper/ieumi.png"
                  alt="이음이"
                  className="w-14 h-14 object-contain animate-bounce"
                />
                <div className="bg-white/10 rounded-2xl px-4 py-2 text-left">
                  <p className="text-sm font-black text-white">
                    이음이가 여기 있어요
                  </p>
                  <p className="text-xs font-bold text-rose-200">
                    천천히 숨 쉬어요 💙
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-4">
                도움이 필요해요
              </h2>
              <p className="text-lg font-bold text-rose-200 mb-8 leading-relaxed">
                괜찮아요.
                <br />
                멈춰서 천천히 숨을 쉬어요.
                <br />
                보호자에게 알렸어요.
              </p>

              <div className="w-full grid gap-4">
                <a
                  href="tel:01000000000"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black text-xl shadow-lg transition flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📞</span> 엄마/아빠에게 전화
                </a>
                <button
                  onClick={() => alert("주변 어른용 화면을 띄웁니다.")}
                  className="bg-white text-rose-900 py-5 rounded-2xl font-black text-xl shadow-lg transition flex flex-col items-center justify-center gap-1"
                >
                  주변 어른에게 보여주기
                  <span className="text-sm font-bold text-slate-500">
                    길을 잃었다는 문구를 화면에 크게 띄웁니다
                  </span>
                </button>
              </div>

              <button
                onClick={cancelSos}
                className="mt-8 px-6 py-3 rounded-full border-2 border-rose-400 text-rose-300 font-bold hover:bg-rose-900 transition"
              >
                마음이 괜찮아졌어요 (돌아가기)
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function HomecomingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center">
        <div className="text-emerald-600 font-bold animate-pulse text-lg">로딩 중...</div>
      </div>
    }>
      <HomecomingPageContent />
    </Suspense>
  );
}
