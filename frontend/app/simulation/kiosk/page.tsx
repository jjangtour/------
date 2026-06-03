"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type CharacterKey = "boy" | "girl";

type Choice = {
  label: string;
  icon: string;
  caption: string;
  correct: boolean;
  feedback: string;
  help: string;
};

type Step = {
  title: string;
  prompt: string;
  guide: string;
  choices: Choice[];
  staffHelp: string;
};

type ChoiceStatus = "idle" | "correct" | "wrong";
type GamePhase = "intro" | "playing" | "feedback" | "complete";
type CharAnim = "idle" | "bounce" | "shake";

const characters: Record<
  CharacterKey,
  { name: string; label: string; image: string; alt: string }
> = {
  boy: {
    name: "도윤",
    label: "남학생",
    image: "/assets/kiosk/kiosk-boy.png",
    alt: "키오스크 앞에서 메뉴 버튼을 누르는 남학생 SD 캐릭터",
  },
  girl: {
    name: "하늘",
    label: "여학생",
    image: "/assets/kiosk/kiosk-girl.png",
    alt: "키오스크 앞에서 메뉴 버튼을 누르는 여학생 SD 캐릭터",
  },
};

const steps: Step[] = [
  {
    title: "메뉴 고르기",
    prompt: "햄버거를 먹고 싶어요. 어떤 그림을 눌러요?",
    guide: "먹고 싶은 음식 그림을 찾아요.",
    staffHelp: "죄송해요. 🍔 햄버거를 주문하고 싶은데 어떻게 고르나요?",
    choices: [
      {
        label: "햄버거",
        icon: "🍔",
        caption: "먹을 음식",
        correct: true,
        feedback: "잘했어요! 햄버거 그림을 골랐어요.",
        help: "햄버거처럼 생긴 그림을 찾아보자.",
      },
      {
        label: "음료",
        icon: "🥤",
        caption: "마실 것",
        correct: false,
        feedback: "괜찮아. 음료는 마시는 그림이에요.",
        help: "먹고 싶은 것은 햄버거야. 둥근 빵 그림을 다시 찾아보자.",
      },
      {
        label: "아이스크림",
        icon: "🍦",
        caption: "후식",
        correct: false,
        feedback: "괜찮아. 아이스크림은 후식이에요.",
        help: "지금은 후식이 아니라 햄버거를 고르는 차례야.",
      },
    ],
  },
  {
    title: "결제하기",
    prompt: "메뉴를 골랐어요. 이제 무엇을 해요?",
    guide: "주문을 끝내려면 결제를 선택해요.",
    staffHelp: "죄송해요. 💳 카드로 계산하고 싶은데 어떻게 하나요?",
    choices: [
      {
        label: "카드 결제",
        icon: "💳",
        caption: "계산하기",
        correct: true,
        feedback: "잘했어요! 카드 결제를 선택했어요.",
        help: "계산하는 버튼을 누르면 주문을 끝낼 수 있어.",
      },
      {
        label: "처음으로",
        icon: "↩️",
        caption: "다시 시작",
        correct: false,
        feedback: "괜찮아. 처음으로 가면 주문을 다시 해야 해요.",
        help: "주문을 끝내려면 카드 그림이 있는 결제를 찾아보자.",
      },
      {
        label: "취소",
        icon: "✕",
        caption: "주문 멈춤",
        correct: false,
        feedback: "괜찮아. 취소하면 주문이 끝나지 않아요.",
        help: "멈추는 버튼 말고, 계산하는 버튼을 골라보자.",
      },
    ],
  },
  {
    title: "영수증 고르기",
    prompt: "결제가 끝났어요. 영수증은 어떻게 해요?",
    guide: "받아도 되고, 받지 않아도 괜찮아요.",
    staffHelp: "죄송해요. 🧾 영수증을 받고 싶은데 어떻게 하나요?",
    choices: [
      {
        label: "영수증 받기",
        icon: "🧾",
        caption: "종이 챙기기",
        correct: true,
        feedback: "좋아요! 영수증을 받고 주문을 마쳤어요.",
        help: "영수증을 챙기고 싶으면 받기를 누르면 돼.",
      },
      {
        label: "받지 않기",
        icon: "✅",
        caption: "바로 완료",
        correct: true,
        feedback: "좋아요! 영수증 없이 주문을 마쳤어요.",
        help: "영수증이 필요 없으면 받지 않아도 괜찮아.",
      },
    ],
  },
];

function speak(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
}

function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) { setDone(true); return; }

    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        window.clearInterval(id);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

export default function KioskSimulationPage() {
  const [character, setCharacter] = useState<CharacterKey>("boy");
  const [stepIndex, setStepIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [message, setMessage] = useState(
    "안녕! 키오스크로 음식을 주문하는 연습을 해봐요! 화면을 눌러 시작해요 🎮"
  );
  const [showChoices, setShowChoices] = useState(false);
  const [charAnim, setCharAnim] = useState<CharAnim>("idle");
  const [wrongCount, setWrongCount] = useState(0);
  const [choiceStatus, setChoiceStatus] = useState<Record<string, ChoiceStatus>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [showHelpCard, setShowHelpCard] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { displayed, done, skip } = useTypewriter(message, 38);
  const currentCharacter = characters[character];
  const currentStep = steps[stepIndex];

  // 타이핑 완료 후 선택지 표시
  useEffect(() => {
    if (!done || phase !== "playing") return;
    const t = window.setTimeout(() => setShowChoices(true), 250);
    return () => window.clearTimeout(t);
  }, [done, phase]);

  const advanceDialogue = () => {
    if (!done) { skip(); return; }
    if (phase === "intro") {
      setMessage(currentStep.prompt);
      setPhase("playing");
    }
  };

  const triggerCharAnim = (anim: CharAnim) => {
    setCharAnim(anim);
    window.setTimeout(() => setCharAnim("idle"), 800);
  };

  const saveResult = (finalStars: number) => {
    const studentName =
      localStorage.getItem("haemileum_selected_student") || currentCharacter.name;
    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "키오스크 주문",
      score: finalStars * 10,
      status: "완료",
      emotion: finalStars >= 3 ? "안정" : "보통",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const handleChoice = (choice: Choice) => {
    if (!showChoices || isLocked) return;
    setIsLocked(true);
    setShowChoices(false);
    setChoiceStatus((prev) => ({
      ...prev,
      [choice.label]: choice.correct ? "correct" : "wrong",
    }));

    if (!choice.correct) {
      triggerCharAnim("shake");
      setWrongCount((c) => c + 1);
      setMessage(choice.feedback);
      setPhase("feedback");
      window.setTimeout(() => {
        setChoiceStatus((prev) => ({ ...prev, [choice.label]: "idle" }));
        setMessage(choice.help);
        setPhase("playing");
        setIsLocked(false);
      }, 2200);
      return;
    }

    triggerCharAnim("bounce");
    const nextStars = stars + 1;
    setStars(nextStars);
    setMessage(choice.feedback);
    setPhase("feedback");

    if (stepIndex >= steps.length - 1) {
      window.setTimeout(() => {
        setIsComplete(true);
        setPhase("complete");
        setMessage("완전 잘했어요! 키오스크 주문을 해냈어요! 🎉🎉🎉");
        setIsLocked(false);
        saveResult(nextStars);
      }, 1500);
      return;
    }

    window.setTimeout(() => {
      const next = stepIndex + 1;
      setStepIndex(next);
      setWrongCount(0);
      setChoiceStatus({});
      setShowHelpCard(false);
      setMessage(steps[next].prompt);
      setPhase("playing");
      setIsLocked(false);
    }, 1800);
  };

  const restart = () => {
    setStepIndex(0);
    setStars(0);
    setPhase("intro");
    setMessage("다시 해봐요! 이번에는 더 잘 할 수 있어요! 화면을 눌러 시작해요 🎮");
    setShowChoices(false);
    setCharAnim("idle");
    setWrongCount(0);
    setChoiceStatus({});
    setIsLocked(false);
    setShowHelpCard(false);
    setIsComplete(false);
  };

  const charTransform =
    charAnim === "bounce"
      ? "scale-[1.06] -translate-y-5"
      : charAnim === "shake"
      ? "translate-x-3"
      : "scale-100 translate-y-0";

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white select-none">
      <style>{`
        @keyframes vn-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-14px); }
          40% { transform: translateX(14px); }
          60% { transform: translateX(-9px); }
          80% { transform: translateX(9px); }
        }
        .char-shake { animation: vn-shake 0.55s ease-in-out; }

        @keyframes choice-in {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .choice-enter { animation: choice-in 0.3s ease-out both; }

        @keyframes dialogue-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dialogue-in { animation: dialogue-in 0.4s ease-out both; }

        @keyframes hud-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hud-in { animation: hud-in 0.5s ease-out both; }
      `}</style>

      {/* ── 도움 요청 카드 모달 ── */}
      {showHelpCard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
          <div className="dialogue-in w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">🙋</span>
              <div>
                <p className="text-xs font-black text-blue-600">직원에게 보여주세요</p>
                <p className="text-xl font-black">도움 요청 카드</p>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 text-center">
              <p className="text-xl font-black leading-snug">{currentStep.staffHelp}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => speak(currentStep.staffHelp)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                🔊 소리로 듣기
              </button>
              <button
                type="button"
                onClick={() => setShowHelpCard(false)}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              실제 상황에서도 이 카드를 직원에게 보여줄 수 있어요.
            </p>
          </div>
        </div>
      )}

      {/* ── 배경 캐릭터 씬 ── */}
      <div className={`absolute inset-0 transition-transform duration-300 ${charTransform} ${charAnim === "shake" ? "char-shake" : ""}`}>
        <Image
          src={currentCharacter.image}
          alt={currentCharacter.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* 그라디언트 오버레이 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/50" />

      {/* ── 상단 HUD ── */}
      <div className="hud-in absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        {/* 별 */}
        <div className="flex items-center gap-0.5">
          <span className="text-2xl text-amber-400">{"★".repeat(stars)}</span>
          <span className="text-2xl text-white/25">{"★".repeat(3 - stars)}</span>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i < stepIndex
                  ? "w-7 bg-emerald-400"
                  : i === stepIndex && !isComplete
                  ? "w-7 bg-white"
                  : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* 나가기 */}
        <Link
          href="/student/home"
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black backdrop-blur hover:bg-white/20 transition"
        >
          나가기
        </Link>
      </div>

      {/* 캐릭터 선택 (좌상단 작게) */}
      <div className="absolute left-3 top-14 flex gap-2">
        {(Object.keys(characters) as CharacterKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCharacter(k)}
            className={`rounded-xl px-3 py-1.5 text-xs font-black backdrop-blur transition ${
              character === k
                ? "bg-emerald-500/80 text-white"
                : "bg-black/50 text-white/60 hover:bg-black/70"
            }`}
          >
            {characters[k].name}
          </button>
        ))}
      </div>

      {/* ── 선택지 버튼 (대화창 위) ── */}
      {showChoices && phase === "playing" && !isComplete && (
        <div
          className={`absolute inset-x-4 bottom-44 grid gap-3 ${
            currentStep.choices.length === 2 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {currentStep.choices.map((choice, ci) => {
            const status = choiceStatus[choice.label] ?? "idle";
            const showHint = wrongCount >= 2 && choice.correct && status === "idle";

            return (
              <button
                key={choice.label}
                type="button"
                onClick={() => handleChoice(choice)}
                style={{ animationDelay: `${ci * 70}ms` }}
                className={[
                  "choice-enter relative flex flex-col items-center rounded-2xl border-2 p-4 text-center backdrop-blur-sm transition-all",
                  status === "correct" &&
                    "border-emerald-400 bg-emerald-900/70",
                  status === "wrong" &&
                    "border-red-400 bg-red-900/70 char-shake",
                  status === "idle" &&
                    !showHint &&
                    "cursor-pointer border-white/30 bg-black/65 hover:border-white/80 hover:bg-black/80 hover:-translate-y-1 active:scale-95",
                  showHint &&
                    "animate-pulse border-emerald-400 bg-emerald-900/60 ring-2 ring-emerald-300",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {showHint && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-black text-black shadow">
                    이걸 눌러봐요!
                  </span>
                )}
                {status === "correct" && (
                  <span className="absolute right-2 top-2 text-xl">✅</span>
                )}
                {status === "wrong" && (
                  <span className="absolute right-2 top-2 text-xl">❌</span>
                )}
                <span className="mb-2 text-5xl">{choice.icon}</span>
                <span className="text-base font-black text-white">
                  {choice.label}
                </span>
                <span className="mt-0.5 text-xs text-white/50">
                  {choice.caption}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 도움 요청 버튼 (3회 이상 오답) */}
      {wrongCount >= 3 && showChoices && phase === "playing" && (
        <button
          type="button"
          onClick={() => {
            setShowHelpCard(true);
            speak(currentStep.staffHelp);
          }}
          className="absolute inset-x-4 bottom-[11.5rem] rounded-xl bg-blue-600/85 py-3 text-center text-sm font-black backdrop-blur hover:bg-blue-600 active:scale-95 transition"
        >
          🙋 직원에게 도움 요청하기
        </button>
      )}

      {/* ── 대화창 ── */}
      <div
        className="dialogue-in absolute inset-x-0 bottom-0 cursor-pointer bg-black/88 px-5 py-5 backdrop-blur-sm"
        onClick={advanceDialogue}
      >
        {/* 화자 정보 */}
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-emerald-400">
            <Image
              src="/assets/helper/ieumi.png"
              alt="이음이"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <span className="text-sm font-black text-emerald-400">이음이</span>
          {!done && (
            <span className="animate-pulse text-xs text-white/40">
              말하는 중...
            </span>
          )}
          {done && phase === "intro" && (
            <span className="ml-auto animate-bounce text-xs text-white/50">
              화면을 눌러 시작 ▼
            </span>
          )}
        </div>

        {/* 타이핑 텍스트 */}
        <p className="min-h-[3rem] text-lg font-bold leading-relaxed text-white">
          {displayed}
          {!done && (
            <span className="ml-0.5 animate-pulse text-emerald-400">│</span>
          )}
        </p>

        {/* 하단: 듣기 버튼 + 완료 힌트 */}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speak(displayed);
            }}
            className="text-xs text-white/30 hover:text-white/70 transition"
          >
            🔊 다시 듣기
          </button>
          {done && (phase === "feedback" || phase === "complete") && !isComplete && (
            <span className="text-xs text-white/40">잠깐 기다려요...</span>
          )}
        </div>
      </div>

      {/* ── 완료 오버레이 ── */}
      {isComplete && done && (
        <div className="dialogue-in absolute inset-x-4 bottom-40 rounded-3xl bg-black/92 p-6 text-center backdrop-blur">
          <p className="text-6xl">🎉</p>
          <p className="mt-3 text-2xl font-black text-emerald-400">
            키오스크 완료!
          </p>
          <div className="my-3 text-4xl">
            <span className="text-amber-400">{"★".repeat(stars)}</span>
            <span className="text-white/20">{"★".repeat(3 - stars)}</span>
          </div>
          <p className="text-sm text-white/60">
            메뉴를 고르고, 결제하고, 영수증까지 선택했어요.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={restart}
              className="flex-1 rounded-xl bg-white/15 py-3 text-sm font-black hover:bg-white/25 transition"
            >
              다시 하기
            </button>
            <Link
              href="/teacher/dashboard"
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-center text-sm font-black hover:bg-emerald-500 transition"
            >
              교사 화면
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
