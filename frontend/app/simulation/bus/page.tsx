"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type CharacterKey = "boy" | "girl";

type Choice = {
  label: string;
  icon: string;
  correct: boolean;
  feedback: string;
  help: string;
};

type Step = {
  title: string;
  sceneGradient: string;
  sceneEmoji: string;
  sceneLabel: string;
  introLine: string;
  prompt: string;
  choices: Choice[];
  adultHelp: string;
};

type ChoiceStatus = "idle" | "correct" | "wrong";
type GamePhase = "intro" | "playing" | "feedback" | "complete";
type CharAnim = "idle" | "bounce" | "shake";

const characters: Record<
  CharacterKey,
  { name: string; image: string; alt: string }
> = {
  boy: {
    name: "도윤",
    image: "/assets/kiosk/kiosk-boy.png",
    alt: "남학생 캐릭터",
  },
  girl: {
    name: "하늘",
    image: "/assets/kiosk/kiosk-girl.png",
    alt: "여학생 캐릭터",
  },
};

const steps: Step[] = [
  {
    title: "정류장에서 기다리기",
    sceneGradient:
      "linear-gradient(to bottom, #7dd3fc 0%, #bae6fd 45%, #fef3c7 100%)",
    sceneEmoji: "🚏",
    sceneLabel: "버스 정류장",
    introLine:
      "드디어 버스 정류장에 도착했어요! 버스를 기다리는 동안 어떻게 하면 좋을까요?",
    prompt: "버스가 오기를 기다려요. 어떻게 기다릴까요?",
    adultHelp:
      "저 처음 버스 타요. 12번 버스를 기다리고 있는데 맞나요? 도와주세요!",
    choices: [
      {
        label: "줄 서서 기다려요",
        icon: "🧍",
        correct: true,
        feedback: "잘했어요! 줄을 서서 차례를 지키는 것이 중요해요.",
        help: "차도 쪽은 위험해요. 정류장 안쪽에서 줄을 서서 기다려요.",
      },
      {
        label: "차도 쪽으로 나가요",
        icon: "🚗",
        correct: false,
        feedback: "위험해요! 차도 쪽은 차가 다니는 곳이에요.",
        help: "차도는 차가 다니는 위험한 곳이에요. 인도에서 기다려요.",
      },
      {
        label: "다른 사람을 밀어요",
        icon: "😤",
        correct: false,
        feedback: "괜찮아. 다른 사람을 배려해야 해요.",
        help: "버스를 기다릴 때는 다른 사람을 밀지 않고 차례를 지켜요.",
      },
    ],
  },
  {
    title: "버스 타기",
    sceneGradient:
      "linear-gradient(to bottom, #6ee7b7 0%, #059669 50%, #065f46 100%)",
    sceneEmoji: "🚌",
    sceneLabel: "버스 도착",
    introLine:
      "12번 버스가 왔어요! 버스 문이 열렸어요. 어떻게 타야 할까요?",
    prompt: "버스 문이 열렸어요. 어떻게 타요?",
    adultHelp:
      "이 버스 12번이 맞나요? 제가 타도 될까요? 도서관에 가고 싶어요.",
    choices: [
      {
        label: "차례를 지켜 타요",
        icon: "🚶",
        correct: true,
        feedback: "잘했어요! 차례를 지켜 타는 것이 맞아요.",
        help: "앞에 있는 사람이 먼저 타고, 그 다음에 타야 해요.",
      },
      {
        label: "뛰어가서 먼저 타요",
        icon: "🏃",
        correct: false,
        feedback: "괜찮아. 뛰면 다칠 수 있고, 다른 사람에게 불편할 수 있어요.",
        help: "버스 타기 전에 먼저 내리는 사람이 다 내릴 때까지 기다려요.",
      },
      {
        label: "문 앞에 서 있어요",
        icon: "🚪",
        correct: false,
        feedback: "괜찮아. 문 앞에 서 있으면 내리는 사람이 불편해요.",
        help: "내리는 사람이 먼저 내릴 수 있도록 옆에서 기다려요.",
      },
    ],
  },
  {
    title: "버스 안에서 이동하기",
    sceneGradient:
      "linear-gradient(to bottom, #1e3a5f 0%, #1e40af 55%, #1d4ed8 100%)",
    sceneEmoji: "💺",
    sceneLabel: "버스 안",
    introLine:
      "버스에 탔어요! 이제 도서관까지 가야 해요. 버스 안에서 어떻게 이동하면 좋을까요?",
    prompt: "버스에 탔어요. 어떻게 이동해요?",
    adultHelp:
      "앉을 자리를 찾고 있어요. 어디에 앉으면 좋을까요? 도와주세요.",
    choices: [
      {
        label: "빈 자리에 앉아요",
        icon: "🪑",
        correct: true,
        feedback: "잘했어요! 자리에 앉아서 안전하게 이동해요.",
        help: "자리가 있으면 앉는 것이 가장 안전해요. 빈 자리를 찾아봐요.",
      },
      {
        label: "통로에서 뛰어다녀요",
        icon: "🏃",
        correct: false,
        feedback: "위험해요! 버스가 흔들리면 넘어질 수 있어요.",
        help: "버스 안에서 뛰면 다칠 수 있어요. 자리에 앉거나 손잡이를 잡아요.",
      },
      {
        label: "큰 소리로 떠들어요",
        icon: "📢",
        correct: false,
        feedback: "괜찮아. 버스 안에서는 조용히 해야 다른 사람이 편해요.",
        help: "버스 안에서는 작은 목소리로 이야기해요. 다른 사람을 배려해요.",
      },
    ],
  },
  {
    title: "하차 버튼 누르기",
    sceneGradient:
      "linear-gradient(to bottom, #1c1917 0%, #451a03 50%, #78350f 100%)",
    sceneEmoji: "🔔",
    sceneLabel: "내릴 준비",
    introLine:
      "방송이 나와요! '다음은 도서관 앞입니다.' 내릴 준비를 해야 해요. 어떻게 할까요?",
    prompt: "'다음은 도서관 앞입니다.' 방송이 나왔어요. 어떻게 해요?",
    adultHelp:
      "도서관 앞에서 내리고 싶어요. 지금 버튼을 눌러야 하나요? 도와주세요.",
    choices: [
      {
        label: "하차 버튼을 눌러요",
        icon: "🔴",
        correct: true,
        feedback: "잘했어요! 내릴 정류장이 가까워지면 버튼을 눌러요.",
        help: "버스 안 기둥이나 벽에 있는 빨간 버튼을 찾아서 눌러요.",
      },
      {
        label: "그냥 앉아 있어요",
        icon: "😶",
        correct: false,
        feedback: "괜찮아. 버튼을 안 누르면 기사님이 모르고 지나칠 수 있어요.",
        help: "내리고 싶은 정류장이 가까우면 빨간 버튼을 미리 눌러야 해요.",
      },
      {
        label: "갑자기 일어나 달려요",
        icon: "💨",
        correct: false,
        feedback: "위험해요! 버스가 달리는 중에 일어나면 넘어질 수 있어요.",
        help: "버스가 완전히 멈춘 다음에 천천히 일어나요. 먼저 버튼을 눌러요.",
      },
    ],
  },
  {
    title: "내리고 인사하기",
    sceneGradient:
      "linear-gradient(to bottom, #a7f3d0 0%, #6ee7b7 45%, #10b981 100%)",
    sceneEmoji: "🎉",
    sceneLabel: "도서관 앞 도착",
    introLine:
      "버스가 멈췄어요! 드디어 도서관 앞이에요. 이제 내릴 차례예요. 어떻게 내려요?",
    prompt: "버스가 멈췄어요. 도서관 앞에 도착했어요. 어떻게 내려요?",
    adultHelp:
      "여기서 내려도 되나요? 도서관 앞이 맞나요? 도와주세요.",
    choices: [
      {
        label: "차례 지키고 인사해요",
        icon: "🙏",
        correct: true,
        feedback: "완벽해요! 차례를 지키고 기사님께 인사까지 했어요.",
        help: "먼저 내리는 사람이 다 내린 다음에, 기사님께 인사하고 내려요.",
      },
      {
        label: "뛰어서 내려요",
        icon: "🏃",
        correct: false,
        feedback: "괜찮아. 뛰면 다칠 수 있어요. 천천히 내려요.",
        help: "계단에서 뛰면 넘어질 수 있어요. 천천히 조심해서 내려요.",
      },
      {
        label: "인사 안 하고 내려요",
        icon: "🚶",
        correct: false,
        feedback: "괜찮아. 기사님께 인사하면 더 좋아요.",
        help: "버스에서 내릴 때 기사님께 '감사합니다!' 하고 인사해봐요.",
      },
    ],
  },
];

const PROMISES = ["차례를 지켜요", "안전하게 이동해요", "다른 사람을 배려해요"];

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

export default function BusSimulationPage() {
  const [character, setCharacter] = useState<CharacterKey>("boy");
  const [stepIndex, setStepIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [message, setMessage] = useState(
    "안녕! 오늘은 버스 타는 연습을 해봐요! 도서관에 가는 길이에요. 화면을 눌러 시작해요 🚌"
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

  useEffect(() => {
    if (!done || phase !== "playing") return;
    const t = window.setTimeout(() => setShowChoices(true), 250);
    return () => window.clearTimeout(t);
  }, [done, phase]);

  const advanceDialogue = () => {
    if (!done) { skip(); return; }
    if (phase === "intro") {
      setMessage(currentStep.introLine);
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
      mission: "버스 타기",
      score: Math.round((finalStars / steps.length) * 100),
      status: "완료",
      emotion: finalStars >= 4 ? "안정" : "보통",
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
        setMessage("대단해요! 혼자서 버스를 타고 도서관에 도착했어요! 정말 잘했어요! 🎉");
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
      setMessage(steps[next].introLine);
      setPhase("playing");
      setIsLocked(false);
    }, 1800);
  };

  const restart = () => {
    setStepIndex(0);
    setStars(0);
    setPhase("intro");
    setMessage("다시 해봐요! 이번에는 더 잘 할 수 있어요! 화면을 눌러 시작해요 🚌");
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
      ? "scale-[1.04] -translate-y-4"
      : "scale-100 translate-y-0";

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white select-none">
      <style>{`
        @keyframes bus-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-14px); }
          40% { transform: translateX(14px); }
          60% { transform: translateX(-9px); }
          80% { transform: translateX(9px); }
        }
        .char-shake { animation: bus-shake 0.55s ease-in-out; }

        @keyframes choice-in {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .choice-enter { animation: choice-in 0.3s ease-out both; }

        @keyframes scene-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .scene-fade { animation: scene-fade 0.7s ease-out both; }

        @keyframes dialogue-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dialogue-in { animation: dialogue-in 0.4s ease-out both; }
      `}</style>

      {/* ── 도움 요청 카드 모달 ── */}
      {showHelpCard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
          <div className="dialogue-in w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">🙋</span>
              <div>
                <p className="text-xs font-black text-blue-600">어른에게 보여주세요</p>
                <p className="text-xl font-black">도움 요청 카드</p>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 text-center">
              <p className="text-xl font-black leading-snug">{currentStep.adultHelp}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => speak(currentStep.adultHelp)}
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
              버스 안에서 모르는 것이 있으면 어른에게 보여줄 수 있어요.
            </p>
          </div>
        </div>
      )}

      {/* ── 씬 배경 (단계별 CSS 그라디언트) ── */}
      <div
        key={stepIndex}
        className={`scene-fade absolute inset-0 transition-all duration-700 ${charAnim === "shake" ? "char-shake" : ""}`}
        style={{ background: isComplete ? "linear-gradient(to bottom, #a7f3d0 0%, #6ee7b7 45%, #10b981 100%)" : currentStep.sceneGradient }}
      />

      {/* 씬 이모지 (배경 장식) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          className={`select-none text-[18rem] opacity-[0.12] transition-all duration-700 ${charTransform}`}
        >
          {isComplete ? "🎉" : currentStep.sceneEmoji}
        </span>
      </div>

      {/* 그라디언트 오버레이 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/50" />

      {/* ── 상단 HUD ── */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        {/* 별 */}
        <div className="flex items-center gap-0.5">
          <span className="text-2xl text-amber-400">{"★".repeat(stars)}</span>
          <span className="text-2xl text-white/25">{"★".repeat(steps.length - stars)}</span>
        </div>

        {/* 단계 표시 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-white/60">
            {isComplete ? "완료! 🎉" : currentStep.sceneLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i < stepIndex || isComplete
                    ? "w-6 bg-emerald-400"
                    : i === stepIndex
                    ? "w-6 bg-white"
                    : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 나가기 */}
        <Link
          href="/student/home"
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black backdrop-blur hover:bg-white/20 transition"
        >
          나가기
        </Link>
      </div>

      {/* 캐릭터 선택 */}
      <div className="absolute left-3 top-16 flex gap-2">
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

      {/* ── 선택지 버튼 ── */}
      {showChoices && phase === "playing" && !isComplete && (
        <div className="absolute inset-x-4 bottom-44 grid grid-cols-3 gap-3">
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
                  status === "correct" && "border-emerald-400 bg-emerald-900/70",
                  status === "wrong" && "border-red-400 bg-red-900/70 char-shake",
                  status === "idle" && !showHint &&
                    "cursor-pointer border-white/30 bg-black/65 hover:border-white/80 hover:bg-black/80 hover:-translate-y-1 active:scale-95",
                  showHint && "animate-pulse border-emerald-400 bg-emerald-900/60 ring-2 ring-emerald-300",
                ].filter(Boolean).join(" ")}
              >
                {showHint && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-black text-black shadow">
                    이걸 눌러봐요!
                  </span>
                )}
                {status === "correct" && (
                  <span className="absolute right-2 top-2 text-lg">✅</span>
                )}
                {status === "wrong" && (
                  <span className="absolute right-2 top-2 text-lg">❌</span>
                )}
                <span className="mb-2 text-4xl">{choice.icon}</span>
                <span className="text-sm font-black leading-snug text-white">
                  {choice.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 어른에게 도움 요청 버튼 (3회 이상 오답) */}
      {wrongCount >= 3 && showChoices && phase === "playing" && (
        <button
          type="button"
          onClick={() => {
            setShowHelpCard(true);
            speak(currentStep.adultHelp);
          }}
          className="absolute inset-x-4 bottom-[11.5rem] rounded-xl bg-blue-600/85 py-3 text-center text-sm font-black backdrop-blur hover:bg-blue-600 active:scale-95 transition"
        >
          🙋 어른에게 도움 요청하기
        </button>
      )}

      {/* ── 대화창 ── */}
      <div
        className="dialogue-in absolute inset-x-0 bottom-0 cursor-pointer bg-black/88 px-5 py-5 backdrop-blur-sm"
        onClick={advanceDialogue}
      >
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
            <span className="animate-pulse text-xs text-white/40">말하는 중...</span>
          )}
          {done && phase === "intro" && (
            <span className="ml-auto animate-bounce text-xs text-white/50">
              화면을 눌러 시작 ▼
            </span>
          )}
        </div>

        <p className="min-h-[3rem] text-lg font-bold leading-relaxed text-white">
          {displayed}
          {!done && (
            <span className="ml-0.5 animate-pulse text-emerald-400">│</span>
          )}
        </p>

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
        </div>
      </div>

      {/* ── 완료 오버레이 (약속해요! 포함) ── */}
      {isComplete && done && (
        <div className="dialogue-in absolute inset-x-4 bottom-36 rounded-3xl bg-black/92 p-6 backdrop-blur">
          <div className="text-center">
            <p className="text-5xl">🎉</p>
            <p className="mt-3 text-2xl font-black text-emerald-400">
              도서관 도착!
            </p>
            <div className="my-2 text-3xl">
              <span className="text-amber-400">{"★".repeat(stars)}</span>
              <span className="text-white/20">{"★".repeat(steps.length - stars)}</span>
            </div>
          </div>

          {/* 약속해요! */}
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-black text-amber-400">
              <span>⭐</span> 약속해요!
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMISES.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-black text-amber-200"
                >
                  • {p}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
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
