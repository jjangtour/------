"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLevelInfo } from "@/utils/level";

type Phase = "welcome" | "emotion" | "reason" | "stamp" | "complete";

type EmotionOption = {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: string;
  accent: string;
};

const emotionOptions: EmotionOption[] = [
  {
    id: "joy",
    label: "기뻐요",
    value: "기쁨",
    helper: "웃고 싶고 몸이 가벼워요.",
    icon: "😊",
    accent: "border-amber-300 bg-amber-500/20 text-amber-100",
  },
  {
    id: "calm",
    label: "괜찮아요",
    value: "안정",
    helper: "크게 힘들지 않고 차분해요.",
    icon: "🙂",
    accent: "border-emerald-300 bg-emerald-500/20 text-emerald-100",
  },
  {
    id: "worry",
    label: "걱정돼요",
    value: "걱정",
    helper: "마음이 불편하거나 생각이 많아요.",
    icon: "😟",
    accent: "border-sky-300 bg-sky-500/20 text-sky-100",
  },
  {
    id: "sad",
    label: "속상해요",
    value: "속상함",
    helper: "울고 싶거나 마음이 무거워요.",
    icon: "😢",
    accent: "border-rose-300 bg-rose-500/20 text-rose-100",
  },
];

const stamps = [
  "오늘도 나를 잘 살폈어요",
  "끝까지 해보려고 했어요",
  "차분하게 말해보았어요",
  "다시 도전할 수 있어요",
];

const phaseGuides: Record<Phase, string> = {
  welcome:
    "오늘 하루 어떠셨나요? 잠깐 멈추고 내 마음을 들여다볼게요. 정답은 없어요. 천천히 고르면 됩니다.",
  emotion:
    "지금 내 마음과 가장 가까운 감정을 하나 골라봐요. 천천히 읽고 고르면 됩니다.",
  reason:
    "왜 그런 마음이 들었나요? 쓰기 어려우면 비워도 괜찮아요. 한 단어만 써도 됩니다.",
  stamp:
    "오늘 나에게 칭찬 문장을 하나 선물해요. 어떤 말이 마음에 드나요?",
  complete:
    "잘 했어요! 오늘 마음을 살피고 기록했습니다. 마음쉼터에서 잘 쉬어가세요.",
};

const phaseLabels = ["감정 고르기", "이유 적기", "칭찬 선택"];

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

export default function EmotionCheckPage() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption | null>(null);
  const [reason, setReason] = useState("");
  const [selectedStamp, setSelectedStamp] = useState("");
  const [guideText, setGuideText] = useState(phaseGuides.welcome);
  const [isMuted, setIsMuted] = useState(false);
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    oldLevel: number;
    newLevel: number;
    title: string;
    badge: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const hasSavedRef = useRef(false);

  const { displayed, done, skip } = useTypewriter(guideText);

  useEffect(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    setIsMuted(savedMute);
    setIsBgmMuted(savedBgmMute);
    const bgm = new Audio("/assets/sound/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.12;
    bgmRef.current = bgm;
    if (!savedMute && !savedBgmMute) bgm.play().catch(() => undefined);
    return () => {
      audioRef.current?.pause();
      bgmRef.current?.pause();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (localStorage.getItem("haemileum_sound_muted") === "true") return;
    audioRef.current?.pause();
    const gender = localStorage.getItem("haemileum_voice_gender") || "female";
    const audio = new Audio(
      `/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`
    );
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

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("haemileum_sound_muted", String(next));
    if (next) {
      audioRef.current?.pause();
      bgmRef.current?.pause();
      return;
    }
    if (!isBgmMuted) playBgmIfAllowed();
  };

  const toggleBgmMute = () => {
    const next = !isBgmMuted;
    setIsBgmMuted(next);
    localStorage.setItem("haemileum_bgm_muted", String(next));
    if (next || isMuted) {
      bgmRef.current?.pause();
      return;
    }
    playBgmIfAllowed();
  };

  const goToEmotion = () => {
    playBgmIfAllowed();
    setPhase("emotion");
    updateGuide(phaseGuides.emotion);
  };

  const selectEmotion = (emotion: EmotionOption) => {
    playBgmIfAllowed();
    setSelectedEmotion(emotion);
    setPhase("reason");
    updateGuide(phaseGuides.reason);
  };

  const goToStamp = () => {
    playBgmIfAllowed();
    setPhase("stamp");
    updateGuide(phaseGuides.stamp);
  };

  const saveAndComplete = () => {
    if (!selectedEmotion || !selectedStamp) return;
    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      const studentName =
        localStorage.getItem("haemileum_selected_student") || "학생";
      const completedAt = new Date().toLocaleString("ko-KR");

      const savedEmotions = JSON.parse(
        localStorage.getItem("haemileum_emotions") || "[]"
      );
      savedEmotions.push({
        studentName,
        emotion: selectedEmotion.value,
        reason: reason.trim() || "입력 없음",
        stamp: selectedStamp,
        completedAt,
      });
      localStorage.setItem("haemileum_emotions", JSON.stringify(savedEmotions));

      const previousXp = parseInt(
        localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
        10
      );
      const nextXp = previousXp + 50;
      localStorage.setItem(
        `haemileum_student_xp_${studentName}`,
        String(nextXp)
      );
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

      const savedResults = JSON.parse(
        localStorage.getItem("haemileum_results") || "[]"
      );
      savedResults.push({
        studentName,
        mission: "마음 고르기",
        score: 100,
        status: "완료",
        emotion: selectedEmotion.value,
        completedAt,
      });
      localStorage.setItem("haemileum_results", JSON.stringify(savedResults));
      window.dispatchEvent(new Event("storage"));
    }

    setPhase("complete");
    updateGuide(phaseGuides.complete);
  };

  const restart = () => {
    hasSavedRef.current = false;
    setPhase("welcome");
    setSelectedEmotion(null);
    setReason("");
    setSelectedStamp("");
    updateGuide(phaseGuides.welcome);
  };

  const phaseIndex =
    phase === "emotion" ? 0 : phase === "reason" ? 1 : phase === "stamp" ? 2 : -1;

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#0c0d1a] text-white"
      onClick={playBgmIfAllowed}
    >
      <style>{`
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes choice-in {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes card-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .panel-in { animation: panel-in 0.25s ease-out both; }
        .choice-enter { animation: choice-in 0.28s ease-out both; }
        .card-in { animation: card-in 0.3s ease-out both; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0d1a] via-[#12102a] to-[#0a0c18]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #6d28d918 0%, transparent 55%), radial-gradient(circle at 80% 70%, #be185d12 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-violet-300">마음·안전 거리</p>
            <h1 className="text-lg font-black sm:text-xl">마음쉼터</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {phaseIndex >= 0 && (
              <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
                단계 {phaseIndex + 1} / {phaseLabels.length}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBgmMute();
              }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {isBgmMuted ? "배경음 꺼짐" : "배경음 켜짐"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
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

          {/* Left: steps & context */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs font-black text-violet-300">마음쉼터</p>
              <h2 className="mt-1 text-xl font-black leading-tight">
                오늘 마음 살피기
              </h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                정답은 없어요. 지금과 가장 가까운 마음을 천천히 고르면 됩니다.
              </p>
            </div>

            <div className="grid gap-2">
              {phaseLabels.map((label, idx) => {
                const isCurrent = phaseIndex === idx;
                const isDone = phaseIndex > idx || phase === "complete";
                return (
                  <div
                    key={label}
                    className={`rounded-md border px-3 py-2 text-xs font-bold ${
                      isCurrent
                        ? "border-violet-300 bg-violet-400/15 text-white"
                        : isDone
                          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {idx + 1}단계: {label}
                      </span>
                      <span>
                        {isDone ? "✓" : isCurrent ? "진행" : "대기"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedEmotion && (
              <div className="rounded-lg border border-violet-300/30 bg-violet-400/10 p-3">
                <p className="mb-1 text-xs font-black text-violet-200">
                  선택한 마음
                </p>
                <p className="text-lg font-black text-white">
                  {selectedEmotion.icon} {selectedEmotion.label}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-300">
                  {selectedEmotion.helper}
                </p>
              </div>
            )}

            <div className="mt-auto rounded-lg border border-teal-300/30 bg-teal-400/10 p-3">
              <p className="text-xs font-black text-teal-200">마음 돌봄 안내</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-teal-50">
                걱정되거나 속상하면 선생님이나 보호자에게 알려주세요.
              </p>
            </div>
          </aside>

          {/* Center: main content per phase */}
          <div className="panel-in relative min-h-[300px] overflow-hidden rounded-lg border border-white/10 bg-slate-950/60 backdrop-blur-md">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-indigo-900/10" />

            {/* Welcome */}
            {phase === "welcome" && (
              <div className="card-in absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-500/20 text-5xl ring-1 ring-violet-400/30">
                    🌿
                  </div>
                  <h2 className="mt-5 text-3xl font-black">마음쉼터</h2>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-300">
                    잠깐 멈추고, 오늘 내 마음을 들여다볼게요.
                    <br />
                    천천히, 차분하게, 지금 이 순간에 집중해요.
                  </p>
                  <div className="mt-6 grid gap-3 text-left">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-black text-violet-300">
                        정답은 없어요
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        지금 마음과 가장 가까운 것을 고르면 됩니다.
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-black text-emerald-300">
                        쓰기 싫으면 비워도 돼요
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        짧게 써도 되고, 이유를 쓰지 않아도 됩니다.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToEmotion();
                    }}
                    className="mt-8 w-full rounded-xl bg-violet-500 py-4 text-base font-black text-white transition hover:bg-violet-400 active:scale-95"
                  >
                    마음 살피기 시작하기 →
                  </button>
                </div>
              </div>
            )}

            {/* Emotion selection */}
            {phase === "emotion" && (
              <div className="card-in absolute inset-0 flex flex-col justify-center p-6">
                <p className="mb-2 text-center text-xs font-black text-violet-300">
                  1단계 · 감정 고르기
                </p>
                <h2 className="mb-6 text-center text-xl font-black">
                  지금 마음과 가장 가까운 것을 골라요
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {emotionOptions.map((emotion, ci) => (
                    <button
                      key={emotion.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectEmotion(emotion);
                      }}
                      style={{ animationDelay: `${ci * 80}ms` }}
                      className="choice-enter rounded-xl border border-white/15 bg-white/8 p-5 text-left transition hover:border-violet-300 hover:bg-violet-400/15 active:scale-95"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{emotion.icon}</span>
                        <div>
                          <p className="text-lg font-black text-white">
                            {emotion.label}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {emotion.helper}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason input */}
            {phase === "reason" && selectedEmotion && (
              <div className="card-in absolute inset-0 flex flex-col justify-center p-6">
                <p className="mb-1 text-xs font-black text-violet-300">
                  2단계 · 이유 적기
                </p>
                <h2 className="mb-2 text-xl font-black">
                  {selectedEmotion.icon} {selectedEmotion.label}를 느끼는 이유는요?
                </h2>
                <p className="mb-5 text-sm font-semibold text-slate-400">
                  쓰기 어려우면 비워도 괜찮아요. 한 단어만 써도 됩니다.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="예: 친구와 이야기해서 기뻤어요."
                  className="h-40 w-full resize-none rounded-xl border border-white/15 bg-white/8 p-4 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:bg-violet-400/10 focus:ring-2 focus:ring-violet-400/30"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToStamp();
                  }}
                  className="mt-5 w-full rounded-xl bg-violet-500 py-3.5 text-sm font-black text-white transition hover:bg-violet-400"
                >
                  {reason.trim() ? "다음 단계로 →" : "건너뛰고 다음으로 →"}
                </button>
              </div>
            )}

            {/* Stamp selection */}
            {phase === "stamp" && (
              <div className="card-in absolute inset-0 flex flex-col justify-center p-6">
                <p className="mb-1 text-xs font-black text-violet-300">
                  3단계 · 칭찬 선택
                </p>
                <h2 className="mb-2 text-xl font-black">
                  나에게 줄 칭찬을 골라요
                </h2>
                <p className="mb-5 text-sm font-semibold text-slate-400">
                  오늘 나에게 어떤 말을 해주고 싶나요?
                </p>
                <div className="grid gap-3">
                  {stamps.map((stamp, ci) => (
                    <button
                      key={stamp}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStamp(stamp);
                      }}
                      style={{ animationDelay: `${ci * 60}ms` }}
                      className={[
                        "choice-enter rounded-xl border p-4 text-left text-sm font-black transition",
                        selectedStamp === stamp
                          ? "border-violet-400 bg-violet-500/25 text-white"
                          : "border-white/15 bg-white/8 text-slate-200 hover:border-violet-300 hover:bg-violet-400/15",
                      ].join(" ")}
                    >
                      <span className="mr-2">
                        {selectedStamp === stamp ? "✓" : "○"}
                      </span>
                      {stamp}
                    </button>
                  ))}
                </div>
                {selectedStamp && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveAndComplete();
                    }}
                    className="mt-5 w-full rounded-xl bg-violet-500 py-3.5 text-base font-black text-white transition hover:bg-violet-400"
                  >
                    마음 기록 저장하기 →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: context guide per phase */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <p className="text-xs font-black text-violet-300">마음쉼터 안내</p>

            {phase === "welcome" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-violet-300/20 bg-violet-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-violet-200">
                    오늘의 목표
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    내 감정에 이름을 붙이고, 나에게 칭찬 한 마디를 선물해요.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">
                    소요 시간
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    약 3분. 언제든 멈춰도 괜찮아요.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-emerald-200">
                    기록은 저장돼요
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    선생님과 보호자가 오늘 마음을 함께 확인할 수 있어요.
                  </p>
                </div>
              </div>
            )}

            {phase === "emotion" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-violet-300/20 bg-violet-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-violet-200">
                    감정이란?
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    기쁨, 안정, 걱정, 속상함... 모두 자연스러운 감정이에요.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-amber-200">
                    고르기 어려우면
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    지금 몸이 가볍나요, 무겁나요? 몸의 느낌으로 골라봐도 좋아요.
                  </p>
                </div>
              </div>
            )}

            {phase === "reason" && selectedEmotion && (
              <div className="space-y-3">
                <div
                  className={`rounded-xl border p-4 ${selectedEmotion.accent} border-white/20`}
                >
                  <p className="mb-1 text-xs font-black">선택한 감정</p>
                  <p className="text-2xl font-black">
                    {selectedEmotion.icon} {selectedEmotion.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold opacity-80">
                    {selectedEmotion.helper}
                  </p>
                </div>
                <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                  <p className="mb-1 text-xs font-black text-sky-200">
                    쓰기 예시
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-300">
                    "친구가 도와줘서", "숙제가 많아서", "잘 모르겠어"
                  </p>
                </div>
              </div>
            )}

            {phase === "stamp" && (
              <div className="space-y-3">
                {selectedStamp ? (
                  <div className="rounded-xl border border-violet-400/40 bg-violet-500/15 p-4">
                    <p className="mb-2 text-xs font-black text-violet-200">
                      내가 고른 칭찬
                    </p>
                    <p className="text-base font-black text-white">
                      "{selectedStamp}"
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-violet-300/20 bg-violet-400/8 p-3">
                    <p className="mb-1 text-xs font-black text-violet-200">
                      칭찬 고르기
                    </p>
                    <p className="text-xs font-semibold leading-5 text-slate-300">
                      오늘 나에게 진심으로 해주고 싶은 말을 골라요.
                    </p>
                  </div>
                )}
                {selectedEmotion && (
                  <div
                    className={`rounded-xl border p-3 ${selectedEmotion.accent} border-white/20`}
                  >
                    <p className="mb-1 text-xs font-black">선택한 감정</p>
                    <p className="text-sm font-black">
                      {selectedEmotion.icon} {selectedEmotion.label}
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </section>

        {/* Footer: 해밀이 guide */}
        <footer className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-lg border border-violet-300/30 bg-slate-950/85 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-violet-200">
                  해밀이 가이드
                </p>
                {!done && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      skip();
                    }}
                    className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold hover:bg-white/20"
                  >
                    바로 보기
                  </button>
                )}
              </div>
              <p className="min-h-6 text-sm font-bold leading-6 text-slate-100 sm:text-base">
                {displayed}
                {!done && (
                  <span className="ml-1 animate-pulse text-violet-300">|</span>
                )}
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Complete overlay */}
      {phase === "complete" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07040f]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-violet-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-5xl">🌿</p>
            <p className="mt-2 text-xs font-black text-violet-200">
              마음 기록 완료
            </p>
            <h2 className="mt-2 text-2xl font-black">
              오늘 마음을 잘 살폈어요!
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              {selectedEmotion?.icon} {selectedEmotion?.label}의 마음을 기록했습니다.
            </p>
            <div className="mt-5 grid gap-3 text-left">
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <div>
                  <p className="text-sm font-black text-violet-100">
                    감정: {selectedEmotion?.icon} {selectedEmotion?.label}
                  </p>
                  {reason.trim() && (
                    <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
                      이유: {reason.trim()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <div>
                  <p className="text-sm font-black text-violet-100">
                    오늘의 칭찬
                  </p>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
                    "{selectedStamp}"
                  </p>
                </div>
              </div>
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
                className="flex flex-1 items-center justify-center rounded-md bg-violet-500 py-3 text-sm font-black text-white hover:bg-violet-400"
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
