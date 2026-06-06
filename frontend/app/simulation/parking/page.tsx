"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLevelInfo } from "@/utils/level";

type Phase =
  | "intro"
  | "service"
  | "car-input"
  | "car-select"
  | "fee"
  | "payment"
  | "insert-card"
  | "processing"
  | "complete";

type CarInfo = { prefix: number; consonant: string; digits: string; full: string };

const CONSONANTS = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"];

function randomCarInfo(): CarInfo {
  const prefix = Math.floor(Math.random() * 600) + 100;
  const consonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
  const digits = String(Math.floor(Math.random() * 9000) + 1000);
  return { prefix, consonant, digits, full: `${prefix}${consonant} ${digits}` };
}

function randomOtherCar(myPrefix: number, myConsonant: string, digits: string): string {
  let prefix: number;
  let consonant: string;
  do {
    prefix = Math.floor(Math.random() * 600) + 100;
    consonant = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
  } while (prefix === myPrefix && consonant === myConsonant);
  return `${prefix}${consonant} ${digits}`;
}

const STEPS = [
  "서비스 선택",
  "번호 입력",
  "차 번호 찾기",
  "요금 확인",
  "결제 선택",
  "카드 넣기",
  "기다리기",
  "카드 챙기기",
];

const PHASE_STEP: Record<Phase, number> = {
  intro: -1,
  service: 0,
  "car-input": 1,
  "car-select": 2,
  fee: 3,
  payment: 4,
  "insert-card": 5,
  processing: 6,
  complete: 7,
};

const GUIDE: Record<Phase, string> = {
  intro:
    "주차장을 이용한 뒤에는 주차요금을 내야 해요. 이 기계로 요금을 미리 정산하면 빠르게 나갈 수 있어요.",
  service:
    "주차요금 정산을 눌러요. 일일 정기권은 정기권을 가진 사람만 사용해요.",
  "car-input":
    "오른쪽 차량번호 카드를 확인해요. 끝 4자리 숫자를 찾아서 차례대로 눌러요.",
  "car-select":
    "화면에 두 개의 차량번호가 있어요. 오른쪽 차량번호 카드와 같은 것을 골라요.",
  fee: "주차요금을 확인해요. 요금을 직접 계산하지 않아도 돼요. 확인하고 정산하기를 눌러요.",
  payment: "카드로 결제해요. 오늘은 신용카드를 눌러요.",
  "insert-card": "카드를 카드 넣는 곳에 넣어요. 카드를 끝까지 밀어 넣어요.",
  processing:
    "결제 중이에요. 화면이 바뀔 때까지 카드를 빼지 않아요. 잠깐만 기다려요.",
  complete:
    "결제가 끝났어요! 카드를 꼭 챙겨요. 30분 안에 나가면 돈을 더 내지 않아요.",
};

function useTypewriter(text: string, speed = 24) {
  const [displayed, setDisplayed] = useState(text);
  const [done, setDone] = useState(true);

  useEffect(() => {
    let index = 0;
    let timer: number | null = null;
    const starter = window.setTimeout(() => {
      setDisplayed("");
      setDone(false);
      timer = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length && timer) {
          setDone(true);
          window.clearInterval(timer);
        }
      }, speed);
    }, 0);
    return () => {
      window.clearTimeout(starter);
      if (timer) window.clearInterval(timer);
    };
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

export default function ParkingSimulationPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [myCarInfo, setMyCarInfo] = useState<CarInfo | null>(null);
  const [carOptions, setCarOptions] = useState<string[]>([]);
  const [wrongFeedback, setWrongFeedback] = useState("");
  const [inputDigits, setInputDigits] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [guideText, setGuideText] = useState(GUIDE.intro);
  const [isMuted, setIsMuted] = useState(false);
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [processingDone, setProcessingDone] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    oldLevel: number;
    newLevel: number;
    title: string;
    badge: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const hasSavedRef = useRef(false);
  const processingTimerRef = useRef<number | null>(null);

  const { displayed, done, skip } = useTypewriter(guideText);

  useEffect(() => {
    setMyCarInfo(randomCarInfo());
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    setIsMuted(savedMute);
    setIsBgmMuted(savedBgmMute);
    const bgm = new Audio("/assets/sound/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.15;
    bgmRef.current = bgm;
    if (!savedMute && !savedBgmMute) bgm.play().catch(() => undefined);
    return () => {
      audioRef.current?.pause();
      bgmRef.current?.pause();
      if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (localStorage.getItem("haemileum_sound_muted") === "true") return;
    audioRef.current?.pause();
    const gender = localStorage.getItem("haemileum_voice_gender") || "female";
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`);
    audioRef.current = audio;
    audio.play().catch(() => undefined);
  }, []);

  const playBgmIfAllowed = useCallback(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    if (bgmRef.current && !savedMute && !savedBgmMute && bgmRef.current.paused) {
      bgmRef.current.play().catch(() => undefined);
    }
  }, []);

  const updateGuide = useCallback(
    (text: string, shouldSpeak = true) => {
      setGuideText(text);
      if (shouldSpeak) speak(text);
    },
    [speak]
  );

  const goToPhase = useCallback(
    (next: Phase) => {
      setPhase(next);
      setWrongFeedback("");
      updateGuide(GUIDE[next]);
    },
    [updateGuide]
  );

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("haemileum_sound_muted", String(next));
    if (next) { audioRef.current?.pause(); bgmRef.current?.pause(); return; }
    if (!isBgmMuted) playBgmIfAllowed();
  };

  const toggleBgmMute = () => {
    const next = !isBgmMuted;
    setIsBgmMuted(next);
    localStorage.setItem("haemileum_bgm_muted", String(next));
    if (next || isMuted) { bgmRef.current?.pause(); return; }
    playBgmIfAllowed();
  };

  // ── Service selection ──
  const handleService = (choice: "parking" | "pass") => {
    playBgmIfAllowed();
    if (choice === "parking") {
      goToPhase("car-input");
    } else {
      setWrongAttempts((c) => c + 1);
      setWrongFeedback("이 버튼은 정기권을 쓰는 사람의 버튼이에요.\n오늘은 주차요금 정산을 눌러요.");
      updateGuide("이 버튼은 정기권을 쓰는 사람의 버튼이에요. 주차요금 정산을 눌러요.");
    }
  };

  // ── Keypad input ──
  const handleKeypad = (key: string) => {
    playBgmIfAllowed();
    if (key === "del") {
      setInputDigits((prev) => prev.slice(0, -1));
      setWrongFeedback("");
      return;
    }
    setInputDigits((prev) => {
      if (prev.length >= 4) return prev;
      return prev + key;
    });
    setWrongFeedback("");
  };

  const handleSearch = () => {
    if (!myCarInfo) return;
    playBgmIfAllowed();
    if (inputDigits.length < 4) {
      setWrongFeedback("숫자를 4자리 모두 입력한 뒤 조회를 눌러요.");
      updateGuide("숫자를 4자리 모두 입력해요.");
      return;
    }
    if (inputDigits === myCarInfo.digits) {
      const other = randomOtherCar(myCarInfo.prefix, myCarInfo.consonant, myCarInfo.digits);
      const opts =
        Math.random() > 0.5
          ? [myCarInfo.full, other]
          : [other, myCarInfo.full];
      setCarOptions(opts);
      setInputDigits("");
      goToPhase("car-select");
    } else {
      setWrongAttempts((c) => c + 1);
      setWrongFeedback("숫자가 달라요.\n오른쪽 차량번호 카드에서 끝 4자리를 다시 봐요.");
      updateGuide("숫자가 달라요. 오른쪽 차량번호 카드에서 끝 4자리를 다시 확인해요.");
      setInputDigits("");
    }
  };

  // ── Car number selection ──
  const handleCarSelect = (car: string) => {
    if (!myCarInfo) return;
    playBgmIfAllowed();
    if (car === myCarInfo.full) {
      goToPhase("fee");
    } else {
      setWrongAttempts((c) => c + 1);
      setWrongFeedback(`번호가 조금 달라요.\n앞 숫자와 글자를 다시 확인해요.`);
      updateGuide(`번호가 달라요. 우리 차 번호는 ${myCarInfo.full}예요.`);
    }
  };

  // ── Payment ──
  const PAYMENT_FEEDBACK: Record<string, string> = {
    cash: "오늘은 카드로 결제하는 연습이에요.\n신용카드를 눌러요.",
    network: "이 버튼은 다른 결제 방식이에요.\n오늘은 신용카드를 눌러요.",
    coupon: "쿠폰이 있을 때 쓰는 버튼이에요.\n오늘은 신용카드를 사용해요.",
  };

  const handlePayment = (type: string) => {
    playBgmIfAllowed();
    if (type === "card") {
      goToPhase("insert-card");
    } else {
      setWrongAttempts((c) => c + 1);
      const fb = PAYMENT_FEEDBACK[type] ?? "오늘은 신용카드를 눌러요.";
      setWrongFeedback(fb);
      updateGuide(fb.replace("\n", " "));
    }
  };

  // ── Processing ──
  const handleWaitCard = () => {
    if (isWaiting) return;
    setIsWaiting(true);
    playBgmIfAllowed();
    setWrongFeedback("");
    updateGuide("잘하고 있어요. 조금만 더 기다려요.");
    processingTimerRef.current = window.setTimeout(() => {
      setProcessingDone(true);
      processingTimerRef.current = null;
      updateGuide("잘 기다렸어요! 결제가 완료됐어요. 이제 카드를 챙겨요.");
    }, 2500);
  };

  const handleRemoveCard = () => {
    playBgmIfAllowed();
    setWrongAttempts((c) => c + 1);
    setWrongFeedback("아직 결제 중이에요.\n화면이 바뀔 때까지 카드를 빼지 않아요.");
    updateGuide("아직 결제 중이에요. 카드를 빼지 않아요.");
  };

  // ── Save & finish ──
  const saveResult = () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    const studentName = localStorage.getItem("haemileum_selected_student") || "학생";
    const previousXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
    );
    const nextXp = previousXp + 100;
    localStorage.setItem(`haemileum_student_xp_${studentName}`, String(nextXp));
    const prevLevel = getLevelInfo(previousXp);
    const nextLevel = getLevelInfo(nextXp);
    if (nextLevel.level > prevLevel.level) {
      setLevelUpInfo({
        oldLevel: prevLevel.level,
        newLevel: nextLevel.level,
        title: nextLevel.title,
        badge: nextLevel.badge,
      });
      speak(`축하합니다. ${nextLevel.level}레벨 ${nextLevel.title}이 되었어요.`);
    }
    const score = Math.max(70, 100 - wrongAttempts * 8 - hintCount * 4);
    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "주차요금 정산하기",
      score,
      status: "완료",
      emotion: "안정",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const handleFinish = () => {
    playBgmIfAllowed();
    saveResult();
    setShowComplete(true);
    updateGuide("주차요금을 잘 정산했어요. 카드와 영수증을 챙기고 30분 안에 나가면 돼요.");
  };

  const restart = () => {
    if (processingTimerRef.current) {
      window.clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    hasSavedRef.current = false;
    setMyCarInfo(randomCarInfo());
    setCarOptions([]);
    setPhase("intro");
    setWrongFeedback("");
    setInputDigits("");
    setWrongAttempts(0);
    setHintCount(0);
    setProcessingDone(false);
    setIsWaiting(false);
    setShowComplete(false);
    setLevelUpInfo(null);
    updateGuide(GUIDE.intro);
  };

  const showHint = () => {
    if (!myCarInfo) return;
    playBgmIfAllowed();
    setHintCount((c) => c + 1);
    const hints: Partial<Record<Phase, string>> = {
      "car-input": `힌트: 차 번호 끝 4자리는 ${myCarInfo.digits}예요. 숫자를 하나씩 눌러요.`,
      "car-select": `힌트: 우리 차 번호는 ${myCarInfo.full}예요. 같은 번호를 찾아요.`,
      payment: "힌트: 신용카드 버튼을 찾아요. 카드 그림이 있는 버튼이에요.",
    };
    const hint = hints[phase] ?? "한 가지씩 차근차근 해봐요.";
    updateGuide(hint);
    setWrongFeedback(hint.replace("힌트: ", ""));
  };

  const stepIndex = PHASE_STEP[phase];

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#0a0c0f] text-white"
      onClick={playBgmIfAllowed}
    >
      <style>{`
        @keyframes panel-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes choice-in { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes card-in { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes pulse-ring { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.08); } }
        .panel-in { animation: panel-in 0.25s ease-out both; }
        .choice-enter { animation: choice-in 0.28s ease-out both; }
        .card-in { animation: card-in 0.3s ease-out both; }
        .pulse-ring { animation: pulse-ring 1.5s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c0f] via-[#0f1218] to-[#080a0d]" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-300">이동·예매 거리</p>
            <h1 className="truncate text-lg font-black sm:text-xl">주차요금 정산하기</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {phase !== "intro" && (
              <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
                단계 {stepIndex + 1} / {STEPS.length}
              </span>
            )}
            <span className="rounded-md border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-amber-100">
              오답 {wrongAttempts}회
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleBgmMute(); }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {isBgmMuted ? "배경음 꺼짐" : "배경음 켜짐"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {isMuted ? "음성 꺼짐" : "음성 켜짐"}
            </button>
            <Link
              href="/mission/select"
              className="flex h-9 items-center rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              나가기
            </Link>
          </div>
        </header>

        {/* 3-panel layout */}
        <section className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[240px_1fr_300px]">

          {/* Left: Steps */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs font-black text-amber-300">주차요금 정산</p>
              <h2 className="mt-1 text-xl font-black leading-tight">주차정산기 사용하기</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                차를 타고 나가기 전에 주차요금을 먼저 내요.
              </p>
            </div>

            <div className="grid gap-1.5">
              {STEPS.map((label, idx) => {
                const isCurrent = stepIndex === idx;
                const isDone = stepIndex > idx;
                return (
                  <div
                    key={label}
                    className={`rounded-md border px-3 py-2 text-xs font-bold ${
                      isCurrent
                        ? "border-amber-300 bg-amber-400/15 text-white"
                        : isDone
                          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{idx + 1}. {label}</span>
                      <span>{isDone ? "✓" : isCurrent ? "진행" : "대기"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto rounded-lg border border-teal-300/30 bg-teal-400/10 p-3">
              <p className="text-xs font-black text-teal-200">안전 포인트</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-teal-50">
                차량번호와 카드를 남에게 함부로 맡기지 않아요.
              </p>
            </div>
          </aside>

          {/* Center: Simulation */}
          <div className="panel-in relative flex min-h-[300px] flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/60 backdrop-blur-md">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-900/8 via-transparent to-slate-900/8" />

            {/* Machine header */}
            <div className="relative z-10 flex-shrink-0 border-b border-white/10 px-6 pt-4 pb-3 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg ring-2 ring-blue-400/30">
                🅿️
              </div>
              <p className="text-sm font-black text-white">주차요금 사전무인 정산기</p>
              <p className="text-xs font-semibold text-slate-400">
                이 기계로 주차요금을 내면 빨리 나갈 수 있어요.
              </p>
            </div>

            {/* Phase content */}
            <div className="relative z-10 flex-1 overflow-y-auto p-5">

              {/* ── Intro ── */}
              {phase === "intro" && (
                <div className="card-in flex flex-col items-center gap-4 py-2">
                  <div className="w-full max-w-sm rounded-xl border border-amber-300/30 bg-amber-400/10 p-4">
                    <p className="mb-2 text-xs font-black text-amber-200">오늘의 상황</p>
                    <p className="text-sm font-semibold leading-6 text-slate-200">
                      차를 타고 집에 가기 전에<br />주차요금을 먼저 내야 해요.
                    </p>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    <p className="text-xs font-black text-amber-300">오늘 준비물</p>
                    {["차량번호 카드 — 내 차 번호 확인용", "신용카드 — 요금 결제용"].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-xs font-semibold text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playBgmIfAllowed(); goToPhase("service"); }}
                    className="w-full max-w-sm rounded-xl bg-amber-500 py-4 text-base font-black text-black transition hover:bg-amber-400 active:scale-95"
                  >
                    정산 시작하기 →
                  </button>
                </div>
              )}

              {/* ── Service selection ── */}
              {phase === "service" && (
                <div className="card-in flex flex-col items-center gap-4">
                  {wrongFeedback && (
                    <div className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 p-3">
                      <p className="whitespace-pre-line text-sm font-bold text-rose-200">{wrongFeedback}</p>
                    </div>
                  )}
                  <p className="text-sm font-black text-amber-300">주차요금 정산 버튼을 찾아요</p>
                  <div className="grid w-full max-w-sm grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleService("pass"); }}
                      className="choice-enter rounded-xl border-2 border-slate-600 bg-slate-700/50 p-5 text-left transition hover:border-slate-500 active:scale-95"
                      style={{ animationDelay: "0ms" }}
                    >
                      <span className="mb-2 block text-3xl">🎫</span>
                      <p className="text-sm font-black text-slate-200">일일 정기권</p>
                      <p className="mt-1 text-xs text-slate-400">정기권 소지자용</p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleService("parking"); }}
                      className="choice-enter rounded-xl border-2 border-amber-400 bg-amber-500/20 p-5 text-left transition hover:bg-amber-500/30 active:scale-95"
                      style={{ animationDelay: "80ms" }}
                    >
                      <span className="mb-2 block text-3xl">💳</span>
                      <p className="text-sm font-black text-amber-100">주차요금 정산</p>
                      <p className="mt-1 text-xs text-amber-300/70">일반 이용자용</p>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Car number input (FIRST — keypad) ── */}
              {phase === "car-input" && myCarInfo && (
                <div className="card-in flex flex-col items-center gap-3">
                  {wrongFeedback && (
                    <div className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 p-3">
                      <p className="whitespace-pre-line text-sm font-bold text-rose-200">{wrongFeedback}</p>
                    </div>
                  )}
                  <p className="text-sm font-black text-amber-300">
                    차 번호 끝 4자리를 눌러요
                  </p>

                  {/* Digit display */}
                  <div className="w-full max-w-xs rounded-xl border-2 border-amber-400/40 bg-slate-900 p-4">
                    <p className="mb-2 text-xs font-bold text-slate-400">입력 중인 번호</p>
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-black transition ${
                            i < inputDigits.length
                              ? "border-amber-400 bg-amber-400/20 text-amber-200"
                              : "border-slate-600 bg-slate-800 text-slate-600"
                          }`}
                        >
                          {inputDigits[i] ?? "—"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="grid w-full max-w-xs grid-cols-3 gap-2">
                    {["1","2","3","4","5","6","7","8","9"].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleKeypad(k); }}
                        className="rounded-xl border border-white/15 bg-slate-700 py-4 text-xl font-black text-white transition hover:bg-slate-600 active:scale-95"
                      >
                        {k}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleKeypad("0"); }}
                      className="rounded-xl border border-white/15 bg-slate-700 py-4 text-xl font-black text-white transition hover:bg-slate-600 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleKeypad("del"); }}
                      className="col-span-2 rounded-xl border border-rose-400/30 bg-rose-900/30 py-4 text-sm font-black text-rose-300 transition hover:bg-rose-900/50 active:scale-95"
                    >
                      ← 지우기
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                    className={`w-full max-w-xs rounded-xl py-4 text-base font-black transition ${
                      inputDigits.length === 4
                        ? "bg-amber-500 text-black hover:bg-amber-400 active:scale-95"
                        : "cursor-not-allowed bg-slate-700 text-slate-400"
                    }`}
                  >
                    조 회
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); showHint(); }}
                    className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-black hover:bg-white/20"
                  >
                    힌트 {hintCount > 0 ? `(${hintCount})` : ""}
                  </button>
                </div>
              )}

              {/* ── Car number selection (SECOND — pick from 2 options) ── */}
              {phase === "car-select" && myCarInfo && (
                <div className="card-in flex flex-col items-center gap-4">
                  {wrongFeedback && (
                    <div className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 p-3">
                      <p className="whitespace-pre-line text-sm font-bold text-rose-200">{wrongFeedback}</p>
                    </div>
                  )}
                  <p className="text-sm font-black text-amber-300">
                    우리 차 번호를 찾아요
                  </p>
                  <div className="grid w-full max-w-xs grid-cols-1 gap-3">
                    {carOptions.map((car, ci) => (
                      <button
                        key={car}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCarSelect(car); }}
                        style={{ animationDelay: `${ci * 80}ms` }}
                        className="choice-enter rounded-xl border-2 border-white/20 bg-slate-800/60 py-5 text-center text-2xl font-black tracking-widest text-white transition hover:border-amber-400 hover:bg-amber-400/15 active:scale-95"
                      >
                        {car}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); showHint(); }}
                    className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-black hover:bg-white/20"
                  >
                    힌트 {hintCount > 0 ? `(${hintCount})` : ""}
                  </button>
                </div>
              )}

              {/* ── Fee confirmation ── */}
              {phase === "fee" && (
                <div className="card-in flex flex-col items-center gap-4">
                  <p className="text-sm font-black text-amber-300">주차요금을 확인해요</p>
                  <div className="w-full max-w-sm overflow-hidden rounded-xl border border-amber-300/20 bg-slate-900/80">
                    <div className="border-b border-white/10 bg-slate-800/60 px-4 py-2">
                      <p className="text-xs font-black text-slate-400">
                        처음 30분은 무료예요. 시간이 더 지나면 돈을 내요.
                      </p>
                    </div>
                    {[
                      { label: "입차 시간", value: "20:12" },
                      { label: "출차 시간", value: "22:02" },
                      { label: "정산 시간", value: "1시간 50분" },
                      { label: "주차 요금", value: "4,000원", highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div
                        key={label}
                        className={`flex justify-between border-b border-white/5 px-4 py-3 ${highlight ? "bg-amber-500/10" : ""}`}
                      >
                        <span className="text-sm font-bold text-slate-300">{label}</span>
                        <span className={`font-black ${highlight ? "text-base text-amber-200" : "text-sm text-white"}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playBgmIfAllowed(); goToPhase("payment"); }}
                    className="w-full max-w-sm rounded-xl bg-amber-500 py-4 text-base font-black text-black transition hover:bg-amber-400 active:scale-95"
                  >
                    정산하기
                  </button>
                </div>
              )}

              {/* ── Payment method ── */}
              {phase === "payment" && (
                <div className="card-in flex flex-col items-center gap-4">
                  {wrongFeedback && (
                    <div className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 p-3">
                      <p className="whitespace-pre-line text-sm font-bold text-rose-200">{wrongFeedback}</p>
                    </div>
                  )}
                  <p className="text-sm font-black text-amber-300">어떻게 결제할까요?</p>
                  <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                    {[
                      { id: "cash",    label: "현 금",        icon: "💵", sub: "현금 지불" },
                      { id: "card",    label: "신용카드",     icon: "💳", sub: "삼성/LG 페이" },
                      { id: "network", label: "내트럭플러스", icon: "🔌", sub: "제휴 할인" },
                      { id: "coupon",  label: "모바일 쿠폰",  icon: "📱", sub: "쿠폰 사용" },
                    ].map(({ id, label, icon, sub }, ci) => (
                      <button
                        key={id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePayment(id); }}
                        style={{ animationDelay: `${ci * 60}ms` }}
                        className={`choice-enter rounded-xl border-2 p-4 text-left transition active:scale-95 ${
                          id === "card"
                            ? "border-amber-400 bg-amber-500/20 hover:bg-amber-500/30"
                            : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                        }`}
                      >
                        <span className="mb-1 block text-2xl">{icon}</span>
                        <p className="text-sm font-black text-white">{label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex w-full max-w-sm gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToPhase("fee"); }}
                      className="flex-1 rounded-lg border border-white/10 bg-white/10 py-2.5 text-xs font-black hover:bg-white/20"
                    >
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToPhase("service"); }}
                      className="flex-1 rounded-lg border border-rose-400/30 bg-rose-900/20 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-900/40"
                    >
                      취 소
                    </button>
                  </div>
                </div>
              )}

              {/* ── Insert card ── */}
              {phase === "insert-card" && (
                <div className="card-in flex flex-col items-center gap-4">
                  <p className="text-sm font-black text-amber-300">카드를 카드 넣는 곳에 넣어요</p>
                  <div className="w-full max-w-xs rounded-xl border-2 border-dashed border-amber-400/50 bg-slate-900/60 p-6 text-center">
                    <div className="text-5xl">💳</div>
                    <p className="mt-3 text-sm font-bold text-white">카드를 끝까지 밀어 넣어요</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      휴대폰 결제는 휴대폰을 가까이 대요
                    </p>
                    <div className="mt-4 flex justify-center gap-3 text-3xl">
                      <span>⬇️</span>
                      <span>🖥️</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); playBgmIfAllowed(); goToPhase("processing"); }}
                    className="w-full max-w-xs rounded-xl bg-amber-500 py-4 text-base font-black text-black transition hover:bg-amber-400 active:scale-95"
                  >
                    카드 넣기 ✓
                  </button>
                  <div className="flex w-full max-w-xs gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToPhase("payment"); }}
                      className="flex-1 rounded-lg border border-white/10 bg-white/10 py-2 text-xs font-black hover:bg-white/20"
                    >
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); goToPhase("service"); }}
                      className="flex-1 rounded-lg border border-rose-400/30 bg-rose-900/20 py-2 text-xs font-black text-rose-300 hover:bg-rose-900/40"
                    >
                      취 소
                    </button>
                  </div>
                </div>
              )}

              {/* ── Processing ── */}
              {phase === "processing" && (
                <div className="card-in flex flex-col items-center gap-4">
                  <p className="text-sm font-black text-amber-300">
                    {processingDone ? "결제가 완료됐어요!" : "결제 중이에요"}
                  </p>
                  {!processingDone ? (
                    <>
                      {wrongFeedback && (
                        <div className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 p-3">
                          <p className="whitespace-pre-line text-sm font-bold text-rose-200">{wrongFeedback}</p>
                        </div>
                      )}
                      <div className="relative flex items-center justify-center">
                        <div className="pulse-ring absolute h-28 w-28 rounded-full border-4 border-amber-400/30" />
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/20 text-4xl ring-2 ring-amber-400/30">
                          {isWaiting ? "⏳" : "💳"}
                        </div>
                      </div>
                      <div className="w-full max-w-xs rounded-xl border border-rose-400/30 bg-rose-900/20 p-4 text-center">
                        <p className="text-sm font-black text-rose-200">아직 카드를 빼지 않아요!</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">화면이 바뀔 때까지 기다려요</p>
                      </div>
                      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveCard(); }}
                          className="rounded-xl border border-rose-400/40 bg-rose-900/30 py-3.5 text-sm font-black text-rose-300 transition hover:bg-rose-900/50"
                        >
                          카드 빼기 ✗
                        </button>
                        <button
                          type="button"
                          disabled={isWaiting}
                          onClick={(e) => { e.stopPropagation(); handleWaitCard(); }}
                          className={`rounded-xl py-3.5 text-sm font-black transition ${
                            isWaiting
                              ? "cursor-not-allowed bg-slate-600 text-slate-400"
                              : "bg-amber-500 text-black hover:bg-amber-400 active:scale-95"
                          }`}
                        >
                          {isWaiting ? "기다리는 중..." : "기다리기 ✓"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-5xl ring-2 ring-emerald-400/40">
                        ✅
                      </div>
                      <div className="w-full max-w-xs rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-center">
                        <p className="text-sm font-black text-emerald-200">결제가 완료됐어요!</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">이제 카드를 챙겨요</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goToPhase("complete"); }}
                        className="w-full max-w-xs rounded-xl bg-emerald-500 py-4 text-base font-black text-white transition hover:bg-emerald-400 active:scale-95"
                      >
                        카드 챙기기 →
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Complete ── */}
              {phase === "complete" && (
                <div className="card-in flex flex-col items-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-5xl ring-2 ring-emerald-400/40">
                    🎉
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-300">정산 완료</p>
                    <p className="mt-1 text-xl font-black text-white">주차요금을 잘 정산했어요!</p>
                  </div>
                  <div className="w-full max-w-sm space-y-2 text-left">
                    {["차량번호를 확인했어요", "신용카드로 결제했어요", "카드를 잘 챙겼어요"].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-sm font-bold text-white">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full max-w-sm rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-left">
                    <p className="mb-1 text-xs font-black text-amber-200">생활 문장</p>
                    <p className="text-sm font-bold text-white">
                      주차정산 후에는 카드를 꼭 챙겨요. 30분 안에 나가면 돈을 더 내지 않아요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleFinish(); }}
                    className="w-full max-w-sm rounded-xl bg-amber-500 py-4 text-base font-black text-black transition hover:bg-amber-400 active:scale-95"
                  >
                    완료! 스탬프 받기 🏅
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: context guide */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <p className="text-xs font-black text-amber-300">주차정산 안내</p>

            {phase === "intro" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">오늘 배울 것</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    무인 주차정산기에서 차량번호를 확인하고 카드로 결제하는 과정을 연습해요.
                  </p>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">난이도 · 소요 시간</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">보통 · 약 8분</p>
                </div>
                <div className="rounded-lg border border-violet-300/20 bg-violet-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-violet-200">교사 관찰 포인트</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    차량번호 구별, 결제수단 선택, 카드 대기 행동을 확인합니다.
                  </p>
                </div>
              </div>
            )}

            {phase === "service" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">주차요금 정산</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    일반 주차를 한 뒤에 누르는 버튼이에요.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-400/20 bg-slate-700/30 p-3">
                  <p className="mb-1 text-xs font-black text-slate-300">일일 정기권</p>
                  <p className="text-xs font-semibold leading-5 text-slate-400">
                    정기권을 가진 사람만 사용해요. 오늘은 누르지 않아요.
                  </p>
                </div>
              </div>
            )}

            {/* car-input: prominently show the full car number */}
            {phase === "car-input" && myCarInfo && (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-amber-400/60 bg-amber-500/15 p-4">
                  <p className="mb-2 text-xs font-black text-amber-200">🚗 우리 차 번호</p>
                  <p className="text-3xl font-black tracking-wider text-white">{myCarInfo.full}</p>
                  <div className="mt-3 border-t border-amber-400/20 pt-3">
                    <p className="mb-1 text-xs font-black text-amber-200">끝 4자리</p>
                    <p className="text-2xl font-black tracking-[0.3em] text-amber-300">
                      {myCarInfo.digits}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">입력 방법</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    위 숫자를 하나씩 차례로 눌러요. 틀리면 지우기를 눌러요.
                  </p>
                </div>
              </div>
            )}

            {/* car-select: show car number for reference */}
            {phase === "car-select" && myCarInfo && (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-amber-400/60 bg-amber-500/15 p-4">
                  <p className="mb-2 text-xs font-black text-amber-200">🚗 우리 차 번호</p>
                  <p className="text-2xl font-black tracking-wider text-white">{myCarInfo.full}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-300">같은 번호를 찾아요</p>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">확인 방법</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    앞 숫자({myCarInfo.prefix})와 가운데 글자({myCarInfo.consonant})를 먼저 확인해요.
                  </p>
                </div>
              </div>
            )}

            {phase === "fee" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">요금 확인 포인트</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    요금을 직접 계산하지 않아도 돼요. 금액을 눈으로 확인하고 정산하기를 눌러요.
                  </p>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">무료 시간</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    처음 30분은 무료예요. 시간이 더 지나면 돈을 내요.
                  </p>
                </div>
              </div>
            )}

            {phase === "payment" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/15 p-4">
                  <p className="mb-1 text-xs font-black text-amber-200">오늘 결제 방법</p>
                  <p className="text-lg font-black text-white">💳 신용카드</p>
                  <p className="mt-1 text-xs font-semibold text-slate-300">신용카드 버튼을 눌러요</p>
                </div>
                <div className="rounded-lg border border-slate-400/20 bg-slate-700/30 p-3">
                  <p className="mb-1 text-xs font-black text-slate-300">다른 버튼들</p>
                  <p className="text-xs font-semibold leading-5 text-slate-400">
                    현금, 내트럭플러스, 모바일쿠폰은 오늘 사용하지 않아요.
                  </p>
                </div>
              </div>
            )}

            {phase === "insert-card" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">카드 넣기</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    카드를 기계의 카드 넣는 곳에 끝까지 밀어 넣어요.
                  </p>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">삼성/LG페이</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    휴대폰 뒷면을 카드 리더기에 가까이 대요.
                  </p>
                </div>
              </div>
            )}

            {phase === "processing" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 p-4">
                  <p className="mb-1 text-xs font-black text-rose-300">⚠️ 중요!</p>
                  <p className="text-sm font-black text-white">아직 카드를 빼지 않아요!</p>
                  <p className="mt-1 text-xs font-semibold text-slate-300">
                    화면이 바뀔 때까지 기다려요.
                  </p>
                </div>
                {processingDone && (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 p-4">
                    <p className="text-sm font-black text-emerald-200">결제 완료!</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">이제 카드를 챙겨요.</p>
                  </div>
                )}
              </div>
            )}

            {phase === "complete" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-emerald-200">출차 안내</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    30분 안에 나가면 돈을 더 내지 않아요.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">챙길 것</p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    카드, 영수증, 휴대폰을 챙겨요.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </section>

        {/* Footer: 이음이 guide */}
        <footer className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded-lg border border-amber-300/30 bg-slate-950/85 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-amber-200">해밀이 가이드</p>
                {!done && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); skip(); }}
                    className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold hover:bg-white/20"
                  >
                    바로 보기
                  </button>
                )}
              </div>
              <p className="min-h-10 text-sm font-bold leading-6 text-slate-100 sm:text-base">
                {displayed}
                {!done && <span className="ml-1 animate-pulse text-amber-300">|</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-black lg:w-48">
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">오답</p>
                <p className="mt-1 text-lg text-rose-200">{wrongAttempts}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">힌트</p>
                <p className="mt-1 text-lg text-amber-200">{hintCount}</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Complete overlay */}
      {showComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07040f]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-amber-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-5xl">🏅</p>
            <p className="mt-2 text-xs font-black text-amber-200">미션 완료</p>
            <h2 className="mt-2 text-2xl font-black">주차요금 정산 잘 해냈어요!</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              차량번호를 확인하고 카드로 정산하는 과정을 배웠어요.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {[
                { title: "차량번호 확인", desc: "차량번호를 확인하고 눌러요." },
                { title: "카드로 결제", desc: "결제 중에는 카드를 빼지 않아요." },
                { title: "카드 챙기기", desc: "주차정산 후에는 카드를 꼭 챙겨요." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <div>
                    <p className="text-sm font-black text-amber-100">{item.title}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={restart}
                className="flex-1 rounded-md border border-white/10 bg-white/10 py-3 text-sm font-black hover:bg-white/20"
              >
                다시 하기
              </button>
              <Link
                href="/mission/select"
                className="flex flex-1 items-center justify-center rounded-md bg-amber-500 py-3 text-sm font-black text-black hover:bg-amber-400"
              >
                마을로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Level up modal */}
      {levelUpInfo && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-lg border border-amber-300 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-sm font-black text-amber-200">레벨 업</p>
            <h2 className="mt-2 text-2xl font-black">{levelUpInfo.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              {levelUpInfo.oldLevel}레벨에서 {levelUpInfo.newLevel}레벨이 되었어요.
            </p>
            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-lg bg-amber-300 text-lg font-black text-slate-950">
              {levelUpInfo.badge}
            </div>
            <button
              type="button"
              onClick={() => setLevelUpInfo(null)}
              className="mt-5 w-full rounded-md bg-amber-300 py-3 text-sm font-black text-slate-950 hover:bg-amber-200"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
