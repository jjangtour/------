"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getLevelInfo } from "@/utils/level";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ───────────────────────────── Types ───────────────────────────── */

type Phase =
  | "topic"       // 주제 선택
  | "step1"       // 1단계: 말로 한입 베어물기
  | "step2"       // 2단계: 한 문장 완성하기
  | "step3"       // 3단계: 오감 자극 살 붙이기
  | "complete";   // 완료

type Topic = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bgColor: string;
  accentColor: string;
  suggestedWords: string[];
  template: string;        // 빈칸 문장 템플릿 ("나는 오늘 __을(를) 먹었다.")
  templatePrefix: string;  // 빈칸 앞 텍스트
  templateSuffix: string;  // 빈칸 뒤 텍스트
  sensoryWords: string[];  // 감각 꾸밈말
  sensoryLabel: string;    // 감각 라벨
};

/* ───────────────────────────── Data ───────────────────────────── */

const topics: Topic[] = [
  {
    id: "strawberry",
    emoji: "🍓",
    title: "딸기",
    subtitle: "새콤달콤 빨간 딸기",
    color: "text-rose-700",
    borderColor: "border-rose-300",
    bgColor: "bg-rose-50",
    accentColor: "bg-rose-500",
    suggestedWords: ["빨갛다", "달다", "새콤하다", "맛있다", "기쁘다", "좋아해"],
    template: "나는 오늘 __을(를) 먹었다.",
    templatePrefix: "나는 오늘 ",
    templateSuffix: "을(를) 먹었다.",
    sensoryWords: ["달콤한", "새콤한", "빨간", "물렁물렁한", "작은", "향긋한"],
    sensoryLabel: "맛·느낌",
  },
  {
    id: "icecream",
    emoji: "🍦",
    title: "아이스크림",
    subtitle: "시원하고 달콤한 아이스크림",
    color: "text-sky-700",
    borderColor: "border-sky-300",
    bgColor: "bg-sky-50",
    accentColor: "bg-sky-500",
    suggestedWords: ["차갑다", "달다", "시원하다", "녹다", "행복하다", "맛있다"],
    template: "나는 오늘 __을(를) 먹었다.",
    templatePrefix: "나는 오늘 ",
    templateSuffix: "을(를) 먹었다.",
    sensoryWords: ["시원한", "달콤한", "차가운", "부드러운", "크림같은", "하얀"],
    sensoryLabel: "맛·느낌",
  },
  {
    id: "puppy",
    emoji: "🐶",
    title: "강아지",
    subtitle: "귀여운 강아지 친구",
    color: "text-amber-700",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50",
    accentColor: "bg-amber-500",
    suggestedWords: ["귀엽다", "따뜻하다", "폭신하다", "좋아해", "사랑해", "멍멍"],
    template: "나는 오늘 __을(를) 만났다.",
    templatePrefix: "나는 오늘 ",
    templateSuffix: "을(를) 만났다.",
    sensoryWords: ["귀여운", "포근한", "따뜻한", "작은", "보들보들한", "하얀"],
    sensoryLabel: "모양·느낌",
  },
];

const cheerMessages = [
  "잘하고 있어요! 👏",
  "아주 좋아요! ⭐",
  "대단해요! 🌟",
  "멋져요! 🎉",
  "훌륭해요! 💪",
  "최고예요! 🏆",
];

/* ───────────────────────────── Page ───────────────────────────── */

export default function OneBiteWritingPage() {
  // ── Core state ──
  const [phase, setPhase] = useState<Phase>("topic");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [score, setScore] = useState(100);
  const [stars, setStars] = useState(0);

  // ── Step 1: word bubbles ──
  const [wordBubbles, setWordBubbles] = useState<string[]>([]);

  // ── Step 2: sentence fill ──
  const [filledWord, setFilledWord] = useState("");

  // ── Step 3: sensory modifier ──
  const [selectedSensory, setSelectedSensory] = useState("");
  const [finalSentence, setFinalSentence] = useState("");

  // ── Speech recognition ──
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // ── TTS ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // ── Typing animation ──
  const [displayedText, setDisplayedText] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  // ── Level up ──
  const [levelUpInfo, setLevelUpInfo] = useState<{
    oldLevel: number;
    newLevel: number;
    title: string;
    badge: string;
  } | null>(null);

  // ── Keyboard fallback ──
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState("");

  // ── Cheer animation ──
  const [cheerMsg, setCheerMsg] = useState("");

  // ── Student name ──
  const [studentName, setStudentName] = useState("이름 미선택");

  useEffect(() => {
    const name = localStorage.getItem("haemileum_selected_student") || "이름 미선택";
    setStudentName(name);
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    setIsMuted(savedMute);
  }, []);

  // ── Check Speech Recognition support ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ||
               (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
    }
  }, []);

  // ── TTS speak function (reusing existing API) ──
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("haemileum_sound_muted") === "true") return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const gender = localStorage.getItem("haemileum_voice_gender") || "female";
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch((err) => {
      console.warn("TTS play failed:", err);
    });
  }, []);

  // ── Typing animation ──
  const startTyping = useCallback((text: string) => {
    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
    setDisplayedText("");
    setIsTypingDone(false);
    let idx = 0;
    typingTimerRef.current = window.setInterval(() => {
      idx++;
      setDisplayedText(text.slice(0, idx));
      if (idx >= text.length) {
        setIsTypingDone(true);
        if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
      }
    }, 50);
  }, []);

  const showGuide = useCallback((text: string) => {
    setCurrentText(text);
    startTyping(text);
    speak(text);
  }, [startTyping, speak]);

  // ── Speech Recognition ──
  const startListening = useCallback(() => {
    if (!isSupported) {
      setShowKeyboard(true);
      return;
    }

    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ||
               (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) {
      setShowKeyboard(true);
      return;
    }

    const recognition = new (SR as any)();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setShowKeyboard(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ── Toggle mute ──
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("haemileum_sound_muted", String(next));
    if (next && audioRef.current) audioRef.current.pause();
  };

  // ── Show a random cheer ──
  const showCheer = useCallback(() => {
    const msg = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];
    setCheerMsg(msg);
    setTimeout(() => setCheerMsg(""), 2000);
  }, []);

  /* ─────────────────── Phase Handlers ─────────────────── */

  const selectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setPhase("step1");
    setWordBubbles([]);
    setFilledWord("");
    setSelectedSensory("");
    setFinalSentence("");
    setStars(0);
    setScore(100);
    setTimeout(() => {
      showGuide(`좋아요! ${topic.title}에 대해 이야기해 볼까요? 마이크 버튼을 누르고 떠오르는 단어를 말해 보세요.`);
    }, 400);
  };

  // Step 1: Add word bubble
  const addWordBubble = useCallback((word: string) => {
    if (!word.trim()) return;
    const cleaned = word.trim().replace(/[.。,，!！?？]/g, "");
    if (!cleaned) return;
    setWordBubbles((prev) => {
      if (prev.includes(cleaned)) return prev;
      if (prev.length >= 8) return prev;
      return [...prev, cleaned];
    });
    showCheer();
    speak(cleaned);
  }, [showCheer, speak]);

  // Step 1 → Step 2
  const goToStep2 = () => {
    setStars(1);
    setPhase("step2");
    setTranscript("");
    setKeyboardInput("");
    setShowKeyboard(false);
    setTimeout(() => {
      showGuide("대단해요! 이번에는 한 문장을 완성해 봐요. 빈칸에 들어갈 말을 해 보세요.");
    }, 300);
  };

  // Step 2 → Step 3
  const goToStep3 = () => {
    setStars(2);
    setPhase("step3");
    setTranscript("");
    setKeyboardInput("");
    setShowKeyboard(false);
    setTimeout(() => {
      showGuide("훌륭해요! 마지막으로 느낌이나 맛을 하나 골라서 문장을 더 예쁘게 만들어 봐요.");
    }, 300);
  };

  // Complete
  const handleComplete = useCallback(() => {
    if (!selectedTopic) return;

    setStars(3);
    setPhase("complete");

    // Build final sentence
    const sensory = selectedSensory || "";
    const word = filledWord || selectedTopic.title;
    const sentence = sensory
      ? `${selectedTopic.templatePrefix}${sensory} ${word}${selectedTopic.templateSuffix}`
      : `${selectedTopic.templatePrefix}${word}${selectedTopic.templateSuffix}`;
    setFinalSentence(sentence);

    // Save results to localStorage
    const xpReward = 100;
    const previousXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
    );
    const nextXp = previousXp + xpReward;
    localStorage.setItem(`haemileum_student_xp_${studentName}`, String(nextXp));

    const previousLevel = getLevelInfo(previousXp);
    const nextLevel = getLevelInfo(nextXp);
    if (nextLevel.level > previousLevel.level) {
      setLevelUpInfo({
        oldLevel: previousLevel.level,
        newLevel: nextLevel.level,
        title: nextLevel.title,
        badge: nextLevel.badge,
      });
    }

    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "한입글쓰기",
      score,
      status: "완료",
      emotion: "뿌듯",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));

    setTimeout(() => {
      showGuide(`정말 잘했어요! "${sentence}" 멋진 문장을 완성했어요!`);
    }, 400);
  }, [selectedTopic, selectedSensory, filledWord, studentName, score, showGuide]);

  // ── Apply transcript to current step ──
  const applyTranscript = useCallback((text: string) => {
    if (!text.trim()) return;
    const cleaned = text.trim();

    if (phase === "step1") {
      addWordBubble(cleaned);
    } else if (phase === "step2") {
      setFilledWord(cleaned);
    } else if (phase === "step3") {
      setSelectedSensory(cleaned);
    }
  }, [phase, addWordBubble]);

  // When transcript updates and listening ends
  useEffect(() => {
    if (!isListening && transcript) {
      applyTranscript(transcript);
      setTranscript("");
    }
  }, [isListening, transcript, applyTranscript]);

  // Submit keyboard input
  const submitKeyboard = () => {
    if (keyboardInput.trim()) {
      applyTranscript(keyboardInput.trim());
      setKeyboardInput("");
    }
  };

  /* ─────────────────── Computed ─────────────────── */

  const progressPercent = useMemo(() => {
    switch (phase) {
      case "topic": return 0;
      case "step1": return 25;
      case "step2": return 50;
      case "step3": return 75;
      case "complete": return 100;
    }
  }, [phase]);

  const stepLabel = useMemo(() => {
    switch (phase) {
      case "topic": return "주제 선택";
      case "step1": return "1단계: 말로 한입 베어물기";
      case "step2": return "2단계: 한 문장 완성하기";
      case "step3": return "3단계: 감각 살 붙이기";
      case "complete": return "완성! 🎉";
    }
  }, [phase]);

  /* ─────────────────── Render ─────────────────── */

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-4xl">
        {/* ── Header ── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-7 py-6 text-white sm:px-9 sm:py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                  <span>✍️</span> 한입글쓰기
                </p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  말하면 글이 되는
                  <br />
                  마법의 글쓰기
                </h1>
                <p className="mt-3 text-base font-semibold text-emerald-100">
                  음성으로 말하면 화면에 글씨가 나타나요
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg transition hover:bg-white/30"
                  title={isMuted ? "소리 켜기" : "소리 끄기"}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-200 mb-1">
                <span>{stepLabel}</span>
                <span>⭐ {stars} / 3</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Guide text area */}
          {currentText && (
            <div className="border-t border-emerald-100 bg-emerald-50 px-7 py-4 sm:px-9">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl">
                  🤖
                </span>
                <div className="flex-1">
                  <p className="text-xs font-black text-emerald-600">AI 이음이</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-emerald-900">
                    {displayedText}
                    {!isTypingDone && <span className="animate-pulse">|</span>}
                  </p>
                </div>
                <button
                  onClick={() => speak(currentText)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm hover:bg-emerald-300 transition"
                  title="다시 듣기"
                >
                  🔁
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cheer toast */}
        {cheerMsg && (
          <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-2xl bg-yellow-400 px-6 py-3 text-lg font-black text-yellow-900 shadow-lg">
            {cheerMsg}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TOPIC SELECT */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === "topic" && (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-black text-slate-900">
                무엇에 대해 이야기할까요?
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                마음에 드는 그림을 골라보세요
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => selectTopic(topic)}
                  className={`group rounded-2xl border-2 ${topic.borderColor} ${topic.bgColor} p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200`}
                >
                  <span className="block text-6xl transition-transform group-hover:scale-110 sm:text-7xl">
                    {topic.emoji}
                  </span>
                  <h3 className={`mt-4 text-2xl font-black ${topic.color}`}>
                    {topic.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {topic.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 1: 말로 한입 베어물기 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === "step1" && selectedTopic && (
          <div>
            <div className="mb-5 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedTopic.accentColor} text-xl text-white font-black`}>1</span>
                <div>
                  <h2 className="text-xl font-black text-slate-900">말로 한입 베어물기</h2>
                  <p className="text-sm font-semibold text-slate-500">
                    {selectedTopic.emoji} {selectedTopic.title}에 대해 떠오르는 단어를 말해 보세요
                  </p>
                </div>
              </div>

              {/* Topic image area */}
              <div className={`rounded-2xl ${selectedTopic.bgColor} p-8 mb-5 text-center`}>
                <span className="text-8xl block">{selectedTopic.emoji}</span>
                <p className={`mt-3 text-lg font-black ${selectedTopic.color}`}>
                  {selectedTopic.subtitle}
                </p>
              </div>

              {/* Suggested word chips */}
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 mb-2">💡 이런 단어는 어때요?</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTopic.suggestedWords.map((w) => (
                    <button
                      key={w}
                      onClick={() => addWordBubble(w)}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-100 hover:text-emerald-800 active:scale-95"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word bubbles visualization */}
              <div className="min-h-[120px] rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 p-5 border border-slate-200">
                <p className="text-xs font-bold text-slate-400 mb-3">내가 말한 단어들 💬</p>
                {wordBubbles.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-slate-400 py-6">
                    마이크 버튼을 누르고 말해 보세요!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wordBubbles.map((word, i) => (
                      <span
                        key={`${word}-${i}`}
                        className={`inline-flex items-center rounded-full px-4 py-2 text-base font-black text-white shadow-sm ${
                          selectedTopic.accentColor
                        }`}
                        style={{
                          animation: `bounceIn 0.4s ease-out ${i * 0.08}s both`,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mic / keyboard input area */}
            <MicInputArea
              isListening={isListening}
              isSupported={isSupported}
              transcript={transcript}
              showKeyboard={showKeyboard}
              keyboardInput={keyboardInput}
              onStartListening={startListening}
              onStopListening={stopListening}
              onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
              onKeyboardInputChange={setKeyboardInput}
              onSubmitKeyboard={submitKeyboard}
              accentColor={selectedTopic.accentColor}
              placeholder="떠오르는 단어를 적어보세요"
            />

            {/* Next step button */}
            {wordBubbles.length >= 2 && (
              <button
                onClick={goToStep2}
                className="mt-5 flex w-full min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 py-4 text-xl font-black text-white shadow-lg hover:bg-emerald-800 active:scale-95 transition-all"
              >
                다음 단계로 →
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 2: 한 문장 완성하기 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === "step2" && selectedTopic && (
          <div>
            <div className="mb-5 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedTopic.accentColor} text-xl text-white font-black`}>2</span>
                <div>
                  <h2 className="text-xl font-black text-slate-900">한 문장 완성하기</h2>
                  <p className="text-sm font-semibold text-slate-500">
                    빈칸에 들어갈 말을 해 보세요
                  </p>
                </div>
              </div>

              {/* Sentence template */}
              <div className={`rounded-2xl ${selectedTopic.bgColor} p-6 sm:p-8 text-center`}>
                <p className="text-xl sm:text-2xl font-black text-slate-800 leading-relaxed">
                  {selectedTopic.templatePrefix}
                  <span className={`inline-block min-w-[100px] mx-1 border-b-4 ${selectedTopic.borderColor} px-3 py-1 rounded-lg ${
                    filledWord
                      ? `${selectedTopic.bgColor} ${selectedTopic.color}`
                      : "bg-white text-slate-400"
                  } text-2xl sm:text-3xl font-black transition-all`}>
                    {filledWord || "______"}
                  </span>
                  {selectedTopic.templateSuffix}
                </p>
              </div>

              {/* word chip shortcuts from step 1 */}
              {wordBubbles.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-slate-500 mb-2">💬 아까 말한 단어를 눌러도 돼요</p>
                  <div className="flex flex-wrap gap-2">
                    {wordBubbles.map((w) => (
                      <button
                        key={w}
                        onClick={() => setFilledWord(w)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                          filledWord === w
                            ? `${selectedTopic.accentColor} text-white`
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-100"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mic / keyboard */}
            <MicInputArea
              isListening={isListening}
              isSupported={isSupported}
              transcript={transcript}
              showKeyboard={showKeyboard}
              keyboardInput={keyboardInput}
              onStartListening={startListening}
              onStopListening={stopListening}
              onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
              onKeyboardInputChange={setKeyboardInput}
              onSubmitKeyboard={submitKeyboard}
              accentColor={selectedTopic.accentColor}
              placeholder="빈칸에 넣을 단어를 말해보세요"
            />

            {/* Next */}
            {filledWord && (
              <button
                onClick={goToStep3}
                className="mt-5 flex w-full min-h-16 items-center justify-center rounded-2xl bg-emerald-700 px-6 py-4 text-xl font-black text-white shadow-lg hover:bg-emerald-800 active:scale-95 transition-all"
              >
                다음 단계로 →
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STEP 3: 오감 자극 살 붙이기 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === "step3" && selectedTopic && (
          <div>
            <div className="mb-5 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedTopic.accentColor} text-xl text-white font-black`}>3</span>
                <div>
                  <h2 className="text-xl font-black text-slate-900">감각 살 붙이기</h2>
                  <p className="text-sm font-semibold text-slate-500">
                    {selectedTopic.sensoryLabel}을 골라 문장을 더 예쁘게 만들어요
                  </p>
                </div>
              </div>

              {/* Before → After preview */}
              <div className={`rounded-2xl ${selectedTopic.bgColor} p-6 sm:p-8`}>
                <div className="mb-3">
                  <p className="text-xs font-bold text-slate-500 mb-1">전 (Before)</p>
                  <p className="text-lg font-bold text-slate-500 line-through">
                    {selectedTopic.templatePrefix}{filledWord}{selectedTopic.templateSuffix}
                  </p>
                </div>
                <div className="text-center text-2xl my-2">⬇️</div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 mb-1">후 (After) ✨</p>
                  <p className={`text-xl sm:text-2xl font-black ${selectedTopic.color} leading-relaxed`}>
                    {selectedTopic.templatePrefix}
                    {selectedSensory && (
                      <span className="underline decoration-4 decoration-yellow-400 underline-offset-4">
                        {selectedSensory}{" "}
                      </span>
                    )}
                    {filledWord}
                    {selectedTopic.templateSuffix}
                  </p>
                </div>
              </div>

              {/* Sensory word chips */}
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-500 mb-2">
                  🎨 {selectedTopic.sensoryLabel} 꾸밈말을 골라보세요
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedTopic.sensoryWords.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setSelectedSensory(w);
                        showCheer();
                        speak(w);
                      }}
                      className={`rounded-xl border-2 px-4 py-3 text-base font-black transition active:scale-95 ${
                        selectedSensory === w
                          ? `${selectedTopic.accentColor} text-white border-transparent shadow-md`
                          : `bg-white ${selectedTopic.borderColor} ${selectedTopic.color} hover:shadow-sm`
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mic / keyboard */}
            <MicInputArea
              isListening={isListening}
              isSupported={isSupported}
              transcript={transcript}
              showKeyboard={showKeyboard}
              keyboardInput={keyboardInput}
              onStartListening={startListening}
              onStopListening={stopListening}
              onToggleKeyboard={() => setShowKeyboard(!showKeyboard)}
              onKeyboardInputChange={setKeyboardInput}
              onSubmitKeyboard={submitKeyboard}
              accentColor={selectedTopic.accentColor}
              placeholder="느낌이나 맛을 말해보세요"
            />

            {/* Complete */}
            {selectedSensory && (
              <button
                onClick={handleComplete}
                className="mt-5 flex w-full min-h-16 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 text-xl font-black text-white shadow-lg hover:from-emerald-700 hover:to-teal-600 active:scale-95 transition-all"
              >
                🎉 문장 완성하기!
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* COMPLETE */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === "complete" && selectedTopic && (
          <div>
            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-6 sm:p-8 shadow-lg text-center">
              {/* Celebration */}
              <div className="mb-6">
                <span className="block text-6xl sm:text-7xl" style={{ animation: "bounceIn 0.6s ease-out" }}>
                  🎉
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl font-black text-emerald-700">
                  멋진 문장을 완성했어요!
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {studentName} 학생, 정말 잘했어요!
                </p>
              </div>

              {/* Final sentence card */}
              <div className={`rounded-2xl ${selectedTopic.bgColor} p-6 sm:p-8 mb-6`}>
                <p className="text-xs font-bold text-slate-500 mb-3">내가 완성한 문장</p>
                <p className={`text-2xl sm:text-3xl font-black ${selectedTopic.color} leading-relaxed`}>
                  &ldquo;{finalSentence}&rdquo;
                </p>
                <button
                  onClick={() => speak(finalSentence)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full ${selectedTopic.accentColor} px-5 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-90 transition active:scale-95`}
                >
                  🔊 소리 내어 읽기
                </button>
              </div>

              {/* Word bubbles recap */}
              {wordBubbles.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 mb-2">내가 떠올린 단어들</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {wordBubbles.map((w, i) => (
                      <span
                        key={`${w}-${i}`}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reward */}
              <div className="rounded-2xl bg-yellow-50 border-2 border-yellow-200 p-5 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <p className="text-lg font-black text-yellow-800">+100 XP 획득!</p>
                    <p className="text-sm font-semibold text-yellow-700">한입글쓰기 미션 완료</p>
                  </div>
                  <span className="text-3xl">⭐</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setPhase("topic");
                    setSelectedTopic(null);
                    setWordBubbles([]);
                    setFilledWord("");
                    setSelectedSensory("");
                    setFinalSentence("");
                    setStars(0);
                    setCurrentText("");
                    setDisplayedText("");
                    setLevelUpInfo(null);
                  }}
                  className="flex min-h-14 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-base font-black text-white hover:bg-emerald-800 transition active:scale-95"
                >
                  🔄 다른 주제로 다시 하기
                </button>
                <Link
                  href="/student/home"
                  className="flex min-h-14 items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-base font-black text-slate-700 hover:bg-slate-200 transition"
                >
                  🏠 학생 홈으로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Hint footer ── */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-base font-black text-amber-950">
            천천히 해도 괜찮아요 😊
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-900">
            마이크가 안 되면 아래 키보드 버튼을 눌러 직접 적을 수도 있어요.
            어려우면 선생님이나 보호자에게 보여주세요.
          </p>
        </div>
      </section>

      {/* ── Level Up Modal ── */}
      {levelUpInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setLevelUpInfo(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "bounceIn 0.5s ease-out" }}
          >
            <span className="block text-6xl mb-4">🏆</span>
            <h2 className="text-2xl font-black text-emerald-700">레벨 UP!</h2>
            <p className="mt-2 text-lg font-black text-slate-900">
              {levelUpInfo.badge} {levelUpInfo.title}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              레벨 {levelUpInfo.oldLevel} → {levelUpInfo.newLevel}
            </p>
            <button
              onClick={() => setLevelUpInfo(null)}
              className="mt-6 w-full rounded-xl bg-emerald-700 py-3 text-base font-black text-white hover:bg-emerald-800 transition"
            >
              좋아요!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* MicInputArea component                                         */
/* ─────────────────────────────────────────────────────────────── */

function MicInputArea({
  isListening,
  isSupported,
  transcript,
  showKeyboard,
  keyboardInput,
  onStartListening,
  onStopListening,
  onToggleKeyboard,
  onKeyboardInputChange,
  onSubmitKeyboard,
  accentColor,
  placeholder,
}: {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  showKeyboard: boolean;
  keyboardInput: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleKeyboard: () => void;
  onKeyboardInputChange: (val: string) => void;
  onSubmitKeyboard: () => void;
  accentColor: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-center gap-4">
        {/* Mic button */}
        <button
          onClick={isListening ? onStopListening : onStartListening}
          className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-lg transition-all active:scale-90 ${
            isListening
              ? "bg-rose-500 text-white animate-pulse ring-4 ring-rose-200"
              : `${accentColor} text-white hover:opacity-90`
          }`}
          title={isListening ? "듣고 있어요... 다시 누르면 멈춤" : "마이크를 눌러 말해보세요"}
        >
          {isListening ? "⏹️" : "🎤"}
        </button>

        {/* Keyboard toggle */}
        <button
          onClick={onToggleKeyboard}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl hover:bg-slate-200 transition"
          title="키보드로 적기"
        >
          ⌨️
        </button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-rose-400 animate-audio-wave"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  height: "16px",
                }}
              />
            ))}
          </div>
          <p className="text-sm font-bold text-rose-600">듣고 있어요... 말해 보세요!</p>
          {transcript && (
            <p className="mt-2 rounded-xl bg-rose-50 px-4 py-2 text-base font-black text-rose-800">
              &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Not supported banner */}
      {!isSupported && !showKeyboard && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-sm font-bold text-amber-800">
            이 브라우저는 음성 인식을 지원하지 않아요.
          </p>
          <p className="text-xs font-semibold text-amber-700 mt-1">
            아래 키보드 버튼을 눌러 직접 적어보세요!
          </p>
        </div>
      )}

      {/* Keyboard input */}
      {showKeyboard && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyboardInput}
              onChange={(e) => onKeyboardInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitKeyboard();
              }}
              placeholder={placeholder}
              className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              autoFocus
            />
            <button
              onClick={onSubmitKeyboard}
              disabled={!keyboardInput.trim()}
              className={`rounded-xl px-5 py-3 text-base font-black text-white transition active:scale-95 ${
                keyboardInput.trim()
                  ? `${accentColor} hover:opacity-90`
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
