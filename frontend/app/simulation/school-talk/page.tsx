"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLevelInfo } from "@/utils/level";

type Phase = "case" | "quiz" | "result" | "complete";

type Choice = {
  id: string;
  label: string;
  detail: string;
  correct: boolean;
  friendReaction: string;
  feedback: string;
};

type Episode = {
  id: string;
  title: string;
  subtitle: string;
  context: string;
  objective: string;
  teacherNote: string;
  friendSpeaker: string;
  friendStatement: string;
  questionPrompt: string;
  safetySentence: string;
  choices: Choice[];
};

const episodes: Episode[] = [
  {
    id: "pencil",
    title: "이야기 1. 연필을 빌려간 친구",
    subtitle: "차분하게 물어보기",
    context:
      "수업 중에 하늘이가 말없이 내 연필을 가져갔어요. 기분이 나빠지려 해요. 어떻게 말하면 좋을까요?",
    objective: "화내거나 참지 않아요. 차분하게 물어보는 말을 골라봐요.",
    teacherNote:
      "학생이 화내거나 참지 않고 차분하게 물어보는 표현을 선택하는지 관찰합니다.",
    friendSpeaker: "하늘",
    friendStatement: "음~ 연필 필기감 좋은걸? (말없이 내 연필을 쓰고 있어요.)",
    questionPrompt: "하늘이에게 어떻게 말할까요?",
    safetySentence: "먼저 물어봐요. 차분하게 확인하면 오해가 쉽게 풀려요.",
    choices: [
      {
        id: "ask",
        label: "혹시 내 연필 빌려간 거야?",
        detail: "차분하고 부드럽게 상황을 확인해요.",
        correct: true,
        friendReaction:
          "아! 맞아, 내 연필심이 부러져서 잠깐 쓰려고 했어. 미리 말했어야 했는데 미안해!",
        feedback: "잘 했어요! 차분하게 물어보니 친구도 미안함을 느끼고 오해가 바로 풀렸어요.",
      },
      {
        id: "shout",
        label: "야! 왜 가져가! (화를 내요)",
        detail: "큰소리로 화를 내요.",
        correct: false,
        friendReaction:
          "앗, 깜짝이야! 미안해... 그냥 좀 쓰려고 했는데 그렇게까지 소리 질러야 해?",
        feedback: "화난 마음은 이해해요. 하지만 큰소리는 친구를 놀라게 하고 오해를 더 키울 수 있어요.",
      },
      {
        id: "stare",
        label: "아무 말 없이 째려본다",
        detail: "참으면서 시선으로만 표현해요.",
        correct: false,
        friendReaction: "(눈치를 보며) ...왜 나를 기분 나쁘게 쳐다보지?",
        feedback: "참기만 하면 상대방은 잘못을 모르고 내 마음만 더 불편해져요.",
      },
    ],
  },
  {
    id: "group-work",
    title: "이야기 2. 모둠 발표 주제",
    subtitle: "부탁하는 말로 의견 전하기",
    context:
      "모둠 활동 시간이에요. 조장인 하늘이가 내 의견은 묻지도 않고 발표 주제를 혼자 결정하려 해요.",
    objective: "남 탓하거나 포기하지 않아요. 부탁하는 말로 내 의견을 전해봐요.",
    teacherNote:
      "학생이 상대를 비난하거나 포기하지 않고 부탁하는 말을 선택하는지 관찰합니다.",
    friendSpeaker: "하늘 (조장)",
    friendStatement: "자, 그럼 발표 주제는 내가 정한 걸로 바로 확정해서 작성할게!",
    questionPrompt: "하늘이에게 어떻게 말할까요?",
    safetySentence: "비난보다 부탁하는 말이 대화를 이어가게 해요.",
    choices: [
      {
        id: "request",
        label: "내 생각도 한번 들어줄래?",
        detail: "부드럽게 내 의견을 들어달라고 부탁해요.",
        correct: true,
        friendReaction: "아! 미안해, 너무 서둘렀지? 네 생각은 어때? 같이 조율해보자!",
        feedback: "잘 했어요! 부탁하는 말에 하늘이가 기꺼이 귀를 기울였어요.",
      },
      {
        id: "blame",
        label: "너는 내 말을 맨날 무시하더라?",
        detail: "상대방을 탓하며 말해요.",
        correct: false,
        friendReaction: "내가 언제 맨날 무시했다고 그래? 다들 의견이 없으니까 내가 먼저 낸 거잖아!",
        feedback: "상대를 단정 지어 비난하면 서로 방어적으로 변해 말다툼이 생겨요.",
      },
      {
        id: "quit",
        label: "그냥 너 마음대로 해라 (포기해요)",
        detail: "대화를 포기하고 물러서요.",
        correct: false,
        friendReaction: "(눈치를 보며) ...갑자기 왜 그래? 모둠 분위기가 싸해지네...",
        feedback: "대화를 포기하면 오해가 더 깊어지고 모둠 활동도 힘들어져요.",
      },
    ],
  },
  {
    id: "nickname",
    title: "이야기 3. 기분 나쁜 별명",
    subtitle: "단호하게 내 기분 표현하기",
    context:
      "쉬는 시간, 하늘이가 기분 나쁜 별명을 부르며 장난을 쳐요. 주변 친구들도 낄낄거리며 웃어요.",
    objective: "몸으로 밀거나 되받아치지 않아요. 내 기분을 말로 단호하게 표현해봐요.",
    teacherNote:
      "학생이 되받아치거나 몸으로 반응하지 않고 단호하게 말로 표현하는지 관찰합니다.",
    friendSpeaker: "하늘",
    friendStatement: "야~ 뚱뚱이! 너 오늘 점심 두 그릇 먹을 거지? 크크크!",
    questionPrompt: "하늘이에게 어떻게 말할까요?",
    safetySentence: "몸으로 밀지 않아요. 내 기분과 부탁을 말로 단호하게 표현해요.",
    choices: [
      {
        id: "firm",
        label: "그 별명은 기분이 안 좋아. 그만해 줘.",
        detail: "단호하지만 차분하게 내 감정을 말해요.",
        correct: true,
        friendReaction: "어... 미안해. 장난으로 한 소리인데 기분 나빴을 줄 몰랐어. 앞으론 안 부를게.",
        feedback: "완벽해요! 감정적으로 흔들리지 않고 내 불편함과 부탁을 분명히 말했어요.",
      },
      {
        id: "counter",
        label: "너는 얼굴이 더 웃기거든? 메롱이다!",
        detail: "똑같이 놀려줘요.",
        correct: false,
        friendReaction: "뭐라고? 크하하! 야, 쟤가 나한테 메롱 했대! 더 놀리자!",
        feedback: "똑같이 놀려주면 갈등이 더 커지고 서로 상처만 주게 돼요.",
      },
      {
        id: "push",
        label: "(비켜! 하고 밀친다)",
        detail: "몸으로 반응해요.",
        correct: false,
        friendReaction: "악! 갑자기 왜 밀치고 그래? 너 폭력 쓴 거지? 선생님한테 다 말할 거야!",
        feedback: "몸으로 대응하면 학교폭력 문제로 번질 수 있어요. 말로 표현해요.",
      },
    ],
  },
];

const readStoredBoolean = (key: string) => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
};

const readStoredVoiceGender = () => {
  if (typeof window === "undefined") return "female";
  return localStorage.getItem("haemileum_voice_gender") || "female";
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

export default function SchoolTalkSimulationPage() {
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("case");
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [stars, setStars] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [guideText, setGuideText] = useState(episodes[0].context);
  const [isMuted, setIsMuted] = useState(() => readStoredBoolean("haemileum_sound_muted"));
  const [isBgmMuted, setIsBgmMuted] = useState(() => readStoredBoolean("haemileum_bgm_muted"));
  const [voiceGender, setVoiceGender] = useState(readStoredVoiceGender);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    oldLevel: number;
    newLevel: number;
    title: string;
    badge: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const hasSavedRef = useRef(false);

  const episode = episodes[episodeIndex];
  const { displayed, done, skip } = useTypewriter(guideText);

  useEffect(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    const bgm = new Audio("/assets/sound/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.16;
    bgmRef.current = bgm;
    if (!savedMute && !savedBgmMute) bgm.play().catch(() => undefined);
    return () => {
      audioRef.current?.pause();
      bgmRef.current?.pause();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("haemileum_sound_muted") === "true") return;
    audioRef.current?.pause();
    audioRef.current = null;
    const gender = localStorage.getItem("haemileum_voice_gender") || "female";
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&gender=${gender}`);
    audioRef.current = audio;
    audio.play().catch(() => undefined);
  }, []);

  const updateGuide = useCallback(
    (text: string, shouldSpeak = true) => {
      setGuideText(text);
      if (shouldSpeak) speak(text);
    },
    [speak]
  );

  const playBgmIfAllowed = useCallback(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    if (bgmRef.current && !savedMute && !savedBgmMute && bgmRef.current.paused) {
      bgmRef.current.play().catch(() => undefined);
    }
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("haemileum_sound_muted", String(nextMuted));
    if (nextMuted) { audioRef.current?.pause(); bgmRef.current?.pause(); return; }
    if (!isBgmMuted) playBgmIfAllowed();
  };

  const toggleBgmMute = () => {
    const nextMuted = !isBgmMuted;
    setIsBgmMuted(nextMuted);
    localStorage.setItem("haemileum_bgm_muted", String(nextMuted));
    if (nextMuted || isMuted) { bgmRef.current?.pause(); return; }
    playBgmIfAllowed();
  };

  const toggleVoiceGender = () => {
    const nextGender = voiceGender === "female" ? "male" : "female";
    setVoiceGender(nextGender);
    localStorage.setItem("haemileum_voice_gender", nextGender);
    window.setTimeout(() => speak(guideText), 50);
  };

  const startQuiz = () => {
    playBgmIfAllowed();
    setPhase("quiz");
    updateGuide(episode.questionPrompt);
  };

  const handleChoice = (choice: Choice) => {
    playBgmIfAllowed();
    setSelectedChoice(choice);
    setPhase("result");
    if (!choice.correct) {
      setWrongAttempts((c) => c + 1);
      updateGuide(choice.feedback);
    } else {
      updateGuide(episode.safetySentence);
    }
  };

  const showHint = () => {
    playBgmIfAllowed();
    setHintCount((c) => c + 1);
    const correct = episode.choices.find((c) => c.correct);
    updateGuide(`힌트: '${correct?.label}'처럼 차분하고 분명한 표현이 좋아요.`);
  };

  const retry = () => {
    playBgmIfAllowed();
    setSelectedChoice(null);
    setPhase("quiz");
    updateGuide(episode.questionPrompt);
  };

  const saveResult = (finalIds: string[]) => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    const studentName = localStorage.getItem("haemileum_selected_student") || "학생";
    const previousXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0", 10
    );
    const nextXp = previousXp + 100;
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
      speak(`축하합니다. ${nextLevel.level}레벨 ${nextLevel.title}이 되었어요.`);
    }
    const score = Math.max(70, 100 - wrongAttempts * 8 - hintCount * 4);
    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "학교생활 대화",
      score,
      status: "완료",
      emotion: finalIds.length >= 2 ? "안정" : "보통",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const moveNext = () => {
    playBgmIfAllowed();
    const nextCompleted = completedIds.includes(episode.id)
      ? completedIds
      : [...completedIds, episode.id];
    setCompletedIds(nextCompleted);
    setStars(nextCompleted.length);

    if (episodeIndex >= episodes.length - 1) {
      setPhase("complete");
      setSelectedChoice(null);
      updateGuide("학교생활 대화 3가지를 모두 마쳤어요. 차분하게 물어보고, 부탁하는 말로 표현하고, 단호하게 내 기분을 말할 수 있어요.");
      saveResult(nextCompleted);
      return;
    }
    const nextIndex = episodeIndex + 1;
    setEpisodeIndex(nextIndex);
    setPhase("case");
    setSelectedChoice(null);
    updateGuide(episodes[nextIndex].context);
  };

  const restart = () => {
    hasSavedRef.current = false;
    setEpisodeIndex(0);
    setPhase("case");
    setSelectedChoice(null);
    setCompletedIds([]);
    setStars(0);
    setWrongAttempts(0);
    setHintCount(0);
    setLevelUpInfo(null);
    updateGuide(episodes[0].context);
  };

  const progressLabel = `${episodeIndex + 1}/${episodes.length}`;

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#0f0a1e] text-white"
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
        @keyframes bubble-in {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .panel-in { animation: panel-in 0.25s ease-out both; }
        .choice-enter { animation: choice-in 0.28s ease-out both; }
        .bubble-in { animation: bubble-in 0.3s ease-out both; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a1e] via-[#180f2e] to-[#0a0818]" />

      <div className="relative z-10 flex h-full flex-col">
        {/* ── 헤더 ── */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-violet-300">해밀 소통 연습</p>
            <h1 className="truncate text-lg font-black sm:text-xl">학교생활 대화</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
              이야기 {progressLabel}
            </span>
            <span className="rounded-md border border-violet-300/30 bg-violet-300/15 px-3 py-2 text-violet-100">
              소통 도장 {stars}/{episodes.length}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleVoiceGender(); }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {voiceGender === "female" ? "여성 음성" : "남성 음성"}
            </button>
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
              href="/student/home"
              className="flex h-9 items-center rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              나가기
            </Link>
          </div>
        </header>

        {/* ── 3단 본문 ── */}
        <section className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[260px_1fr_320px]">

          {/* 왼쪽: 상황 정보 */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs font-black text-violet-300">{episode.subtitle}</p>
              <h2 className="mt-1 text-xl font-black leading-tight">{episode.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                {episode.objective}
              </p>
            </div>

            <div className="grid gap-2">
              {episodes.map((item, index) => {
                const isCurrent = index === episodeIndex;
                const isComplete = completedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-md border px-3 py-2 text-xs font-bold ${
                      isCurrent
                        ? "border-violet-300 bg-violet-400/15 text-white"
                        : isComplete
                        ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.title.replace("이야기 ", "")}</span>
                      <span className="shrink-0">{isComplete ? "✓" : isCurrent ? "진행" : "대기"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto rounded-lg border border-teal-300/30 bg-teal-400/10 p-3">
              <p className="text-xs font-black text-teal-200">교사용 관찰 포인트</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-teal-50">
                {episode.teacherNote}
              </p>
            </div>
          </aside>

          {/* 가운데: 씬 */}
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 shadow-2xl">
            {/* 도서관 배경 */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/assets/school-talk/library-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e]/80 via-[#0f0a1e]/25 to-[#0f0a1e]/50" />

            {/* 캐릭터 스프라이트 */}
            <div className="pointer-events-none absolute bottom-0 left-6 h-[68%] w-[24%]">
              <Image
                src="/assets/school-talk/student-girl.png"
                alt="하늘 캐릭터"
                fill
                sizes="25vw"
                className="object-contain object-bottom"
              />
            </div>

            {/* ── case: 상황 소개 카드 ── */}
            {phase === "case" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                <div className="bubble-in w-full max-w-lg rounded-xl border border-white/15 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-md">
                  <p className="text-xs font-black text-violet-300">오늘의 상황</p>
                  <h2 className="mt-2 text-2xl font-black">{episode.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-200">
                    {episode.context}
                  </p>
                  {/* 친구 발언 미리보기 */}
                  <div className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-4">
                    <p className="mb-2 text-xs font-black text-rose-300">
                      {episode.friendSpeaker}이(가) 말해요
                    </p>
                    <p className="text-sm font-bold leading-6 text-white">
                      "{episode.friendStatement}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startQuiz(); }}
                    className="mt-6 w-full rounded-md bg-violet-500 py-3 text-sm font-black text-white hover:bg-violet-400 active:scale-95 transition"
                  >
                    어떻게 말할지 선택하기 →
                  </button>
                </div>
              </div>
            )}

            {/* ── quiz / result: 친구 말풍선 ── */}
            {(phase === "quiz" || phase === "result") && (
              <div className="bubble-in absolute right-5 top-14 z-20 max-w-[55%]">
                <div className="relative rounded-2xl rounded-tr-sm border border-rose-400/40 bg-slate-900/92 p-4 shadow-xl backdrop-blur-sm">
                  <p className="mb-1.5 text-xs font-black text-rose-300">{episode.friendSpeaker}</p>
                  <p className="text-sm font-bold leading-6 text-white">
                    "{episode.friendStatement}"
                  </p>
                  {/* 말풍선 꼬리 */}
                  <div className="absolute -top-2 right-4 h-3 w-3 rotate-45 border-r border-t border-rose-400/40 bg-slate-900/92" />
                </div>
              </div>
            )}

            {/* ── result: 선택한 말풍선 ── */}
            {phase === "result" && selectedChoice && (
              <div className="bubble-in absolute bottom-20 left-[28%] z-20 max-w-[45%]">
                <div
                  className={`relative rounded-2xl rounded-tl-sm border p-4 shadow-xl backdrop-blur-sm ${
                    selectedChoice.correct
                      ? "border-emerald-400/40 bg-emerald-900/80"
                      : "border-rose-400/40 bg-rose-900/80"
                  }`}
                >
                  <p className={`mb-1.5 text-xs font-black ${selectedChoice.correct ? "text-emerald-300" : "text-rose-300"}`}>
                    내 말
                  </p>
                  <p className="text-sm font-bold leading-6 text-white">
                    "{selectedChoice.label}"
                  </p>
                  {/* 말풍선 꼬리 */}
                  <div className={`absolute -top-2 left-4 h-3 w-3 rotate-45 border-l border-t ${selectedChoice.correct ? "border-emerald-400/40 bg-emerald-900/80" : "border-rose-400/40 bg-rose-900/80"}`} />
                </div>
              </div>
            )}

            {/* ── result: 친구 반응 ── */}
            {phase === "result" && selectedChoice && (
              <div className="bubble-in absolute right-5 top-[52%] z-20 max-w-[50%]" style={{ animationDelay: "0.2s" }}>
                <div
                  className={`relative rounded-2xl rounded-tr-sm border p-4 shadow-xl backdrop-blur-sm ${
                    selectedChoice.correct
                      ? "border-emerald-400/30 bg-slate-900/90"
                      : "border-slate-400/30 bg-slate-900/90"
                  }`}
                >
                  <p className={`mb-1.5 text-xs font-black ${selectedChoice.correct ? "text-emerald-300" : "text-slate-400"}`}>
                    {episode.friendSpeaker} 반응
                  </p>
                  <p className="text-sm font-bold leading-6 text-white">
                    "{selectedChoice.friendReaction}"
                  </p>
                  <div className="absolute -top-2 right-4 h-3 w-3 rotate-45 border-r border-t border-slate-400/30 bg-slate-900/90" />
                </div>
              </div>
            )}

            {/* 퀴즈 하단 질문 레이블 */}
            {phase === "quiz" && (
              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center">
                <div className="rounded-full border border-violet-400/30 bg-[#0f0a1e]/80 px-5 py-2 text-xs font-black text-violet-200 backdrop-blur-sm">
                  💬 {episode.questionPrompt}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 퀴즈 / 피드백 패널 */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">

            {/* ── case: 상황 힌트 카드 ── */}
            {phase === "case" && (
              <>
                <p className="text-xs font-black text-violet-300">소통 포인트</p>
                <div className="space-y-3">
                  <div className="rounded-lg border border-violet-300/20 bg-violet-400/8 p-3">
                    <p className="text-xs font-black text-violet-200 mb-1">오늘 배울 것</p>
                    <p className="text-xs font-semibold leading-5 text-slate-300">{episode.objective}</p>
                  </div>
                  <div className="rounded-lg border border-amber-300/20 bg-amber-400/8 p-3">
                    <p className="text-xs font-black text-amber-200 mb-1">핵심 원칙</p>
                    <p className="text-xs font-semibold leading-5 text-slate-300">
                      화내거나 참기만 하지 않아요. 내 마음을 말로 표현해요.
                    </p>
                  </div>
                  <div className="rounded-lg border border-sky-300/20 bg-sky-400/8 p-3">
                    <p className="text-xs font-black text-sky-200 mb-1">힌트</p>
                    <p className="text-xs font-semibold leading-5 text-slate-300">
                      선택지를 잘 읽어봐요. 차분하고 부드러운 말이 가장 잘 통해요.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── quiz: 선택지 ── */}
            {phase === "quiz" && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-violet-300">말하기 선택</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); showHint(); }}
                    className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-black hover:bg-white/20"
                  >
                    힌트 {hintCount > 0 ? `(${hintCount})` : ""}
                  </button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {episode.choices.map((choice, ci) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleChoice(choice); }}
                      style={{ animationDelay: `${ci * 80}ms` }}
                      className="choice-enter w-full rounded-xl border border-white/15 bg-white/8 p-4 text-left transition hover:border-violet-300 hover:bg-violet-400/15 active:scale-98"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/30 text-xs font-black text-violet-200">
                          {ci + 1}
                        </span>
                        <div>
                          <p className="text-sm font-black text-white leading-snug">{choice.label}</p>
                          <p className="mt-1 text-xs text-slate-400 font-semibold">{choice.detail}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── result: 피드백 ── */}
            {phase === "result" && selectedChoice && (
              <>
                <p className="text-xs font-black text-violet-300">결과 확인</p>

                {/* 정답/오답 판정 */}
                <div
                  className={`rounded-xl border p-4 ${
                    selectedChoice.correct
                      ? "border-emerald-400/40 bg-emerald-500/12"
                      : "border-rose-400/40 bg-rose-500/12"
                  }`}
                >
                  <p className={`text-sm font-black mb-2 ${selectedChoice.correct ? "text-emerald-300" : "text-rose-300"}`}>
                    {selectedChoice.correct ? "✅ 잘 했어요!" : "❌ 다시 생각해봐요"}
                  </p>
                  <p className="text-xs font-semibold leading-5 text-slate-200">
                    {selectedChoice.feedback}
                  </p>
                </div>

                {/* 생활 문장 (정답일 때만) */}
                {selectedChoice.correct && (
                  <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4">
                    <p className="text-xs font-black text-amber-200 mb-2">생활 문장</p>
                    <p className="text-sm font-bold leading-6 text-white">
                      {episode.safetySentence}
                    </p>
                  </div>
                )}

                <div className="mt-auto grid gap-2">
                  {!selectedChoice.correct && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); retry(); }}
                      className="w-full rounded-md border border-violet-400/40 bg-violet-500/20 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/30 transition"
                    >
                      다시 도전!
                    </button>
                  )}
                  {selectedChoice.correct && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveNext(); }}
                      className="w-full rounded-md bg-violet-500 py-3 text-sm font-black text-white hover:bg-violet-400 transition"
                    >
                      {episodeIndex >= episodes.length - 1 ? "결과 보기" : "다음 이야기 →"}
                    </button>
                  )}
                </div>
              </>
            )}
          </aside>
        </section>

        {/* ── 푸터: 이음이 가이드 ── */}
        <footer className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded-lg border border-violet-300/30 bg-slate-950/85 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-violet-200">해밀이 가이드</p>
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
                {!done && <span className="ml-1 animate-pulse text-violet-300">|</span>}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black lg:w-72">
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">힌트</p>
                <p className="mt-1 text-lg text-amber-200">{hintCount}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">재도전</p>
                <p className="mt-1 text-lg text-rose-200">{wrongAttempts}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">완료</p>
                <p className="mt-1 text-lg text-violet-200">{completedIds.length}/{episodes.length}</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── 완료 오버레이 ── */}
      {phase === "complete" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07040f]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-violet-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-5xl">🎉</p>
            <p className="mt-2 text-xs font-black text-violet-200">오늘의 연습 완료</p>
            <h2 className="mt-2 text-2xl font-black">학교생활 대화 잘 해냈어요!</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              차분하게 물어보고, 부탁하는 말로 표현하고, 단호하게 내 기분을 말할 수 있어요.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {episodes.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <div>
                    <p className="text-sm font-black text-violet-100">{item.subtitle}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
                      {item.safetySentence}
                    </p>
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
                href="/student/home"
                className="flex flex-1 items-center justify-center rounded-md bg-violet-500 py-3 text-sm font-black text-white hover:bg-violet-400"
              >
                학생 홈
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 레벨업 모달 ── */}
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
