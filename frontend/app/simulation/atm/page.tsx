"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ItemPocket from "@/components/ItemPocket";
import { getLevelInfo } from "@/utils/level";
import { returnItemIdsToHome } from "@/utils/items";

type Phase =
  | "case"
  | "investigate"
  | "statement"
  | "present"
  | "action"
  | "judgement"
  | "complete";

type EvidenceClue = {
  id: string;
  title: string;
  short: string;
  detail: string;
  position: { left: string; top: string };
  required?: boolean;
};

type EvidenceOption = {
  id: string;
  title: string;
  detail: string;
  correct: boolean;
  feedback: string;
};

type ActionChoice = {
  id: string;
  label: string;
  detail: string;
  correct: boolean;
  feedback: string;
};

type Episode = {
  id: string;
  title: string;
  subtitle: string;
  caseBrief: string;
  objective: string;
  investigationGuide: string;
  statementSpeaker: string;
  statement: string;
  presentPrompt: string;
  actionPrompt: string;
  safetySentence: string;
  teacherNote: string;
  requiredEvidenceIds: string[];
  clues: EvidenceClue[];
  evidenceOptions: EvidenceOption[];
  actionChoices: ActionChoice[];
};

type Feedback = {
  tone: "safe" | "careful" | "success";
  title: string;
  body: string;
};

const episodes: Episode[] = [
  {
    id: "atm-card",
    title: "이야기 1. ATM에서 돈 찾기",
    subtitle: "카드 넣기와 돈 찾기 버튼",
    caseBrief:
      "은행 ATM 앞에 왔어요. 용돈 1만 원을 찾으려고 해요. 낯선 어른이 옆에서 '내가 대신 해줄게'라고 말해요.",
    objective:
      "ATM은 내가 직접 사용해요. 카드 투입구와 돈 찾기 버튼을 먼저 찾아요.",
    investigationGuide:
      "ATM 화면과 기계를 천천히 살펴보세요. 카드 투입구, 돈 찾기 버튼을 해밀 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "낯선 어른",
    statement: "어려워 보이네. 내가 대신 해줄게. 카드 이쪽으로 줘봐.",
    presentPrompt: "ATM 사용 방법을 알려주는 것을 골라요.",
    actionPrompt: "안전한 행동을 선택해요.",
    safetySentence:
      "ATM은 내가 직접 사용해요. 카드와 비밀번호는 어떤 사람에게도 주지 않아요.",
    teacherNote:
      "학생이 낯선 사람의 제안을 거절하고 ATM을 직접 사용하는지 관찰합니다.",
    requiredEvidenceIds: ["card-slot", "withdraw-btn"],
    clues: [
      {
        id: "atm-screen",
        title: "ATM 안내 화면",
        short: "사용 방법 안내",
        detail:
          "화면에 '카드를 넣어주세요'라고 나와 있어요. 차근차근 따라가면 돼요.",
        position: { left: "50%", top: "37%" },
      },
      {
        id: "card-slot",
        title: "카드 투입구 (CARD)",
        short: "카드 넣는 곳",
        detail:
          "카드 CARD 표시가 있는 투입구예요. 여기에 내 카드를 넣어요.",
        position: { left: "50%", top: "72%" },
        required: true,
      },
      {
        id: "withdraw-btn",
        title: "출금 버튼",
        short: "돈 찾기 — 왼쪽 첫 번째 버튼",
        detail:
          "왼쪽 첫 번째 '출금' 버튼을 눌러야 용돈을 찾을 수 있어요. '입금'과 헷갈리지 않아요.",
        position: { left: "20%", top: "27%" },
        required: true,
      },
      {
        id: "balance-btn",
        title: "조회 버튼",
        short: "잔액 확인 — 왼쪽 두 번째 버튼",
        detail:
          "잔액 확인은 돈을 주지 않아요. 용돈을 찾으려면 '출금' 버튼을 눌러야 해요.",
        position: { left: "10%", top: "41%" },
      },
    ],
    evidenceOptions: [
      {
        id: "card-and-btn",
        title: "카드 투입구와 돈 찾기 버튼",
        detail: "카드를 넣고 돈 찾기 버튼을 눌러야 해요.",
        correct: true,
        feedback:
          "맞아요. 카드 투입구와 돈 찾기 버튼을 알면 직접 할 수 있어요.",
      },
      {
        id: "stranger-help",
        title: "낯선 어른의 도움 제안",
        detail: "어른이 대신 해준다고 해요.",
        correct: false,
        feedback:
          "괜찮아요. 낯선 사람의 도움은 증거가 아니에요. 기계의 버튼과 투입구를 찾아봐요.",
      },
      {
        id: "atm-surroundings",
        title: "은행 표지판",
        detail: "은행 이름이 적혀 있어요.",
        correct: false,
        feedback:
          "은행 표지판은 사용 방법을 알려주지 않아요. 카드 투입구와 버튼을 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "use-myself",
        label: "직접 카드를 넣고 돈 찾기 버튼을 누른다",
        detail: "내가 직접 카드를 투입구에 넣고 조작해요.",
        correct: true,
        feedback: "성공! 잘 했어요. ATM은 항상 내가 직접 사용해요.",
      },
      {
        id: "give-card",
        label: "낯선 어른에게 카드를 건넨다",
        detail: "카드를 어른에게 줍니다.",
        correct: false,
        feedback:
          "다시 확인해요. 카드를 다른 사람에게 주면 안 돼요. ATM은 항상 내가 직접 사용해요.",
      },
      {
        id: "give-up",
        label: "너무 어려워서 그냥 간다",
        detail: "ATM 사용을 포기합니다.",
        correct: false,
        feedback:
          "괜찮아요. 어려우면 은행 직원에게 도움을 요청할 수 있어요. 낯선 사람은 아니에요.",
      },
    ],
  },
  {
    id: "atm-password",
    title: "이야기 2. 비밀번호는 비밀이에요",
    subtitle: "비밀번호 보호와 손으로 가리기",
    caseBrief:
      "카드를 넣었어요. 이제 비밀번호를 눌러야 해요. 낯선 어른이 계속 옆에 서서 '비밀번호를 말해봐'라고 해요.",
    objective:
      "비밀번호는 나만 아는 비밀이에요. 손으로 가리고 내가 직접 눌러요.",
    investigationGuide:
      "비밀번호 입력 화면을 살펴보세요. 손으로 가리는 방법과 키패드를 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "낯선 어른",
    statement: "비밀번호를 말해봐. 내가 눌러줄게. 빨리 하면 되잖아.",
    presentPrompt: "비밀번호를 안전하게 보호하는 증거를 골라요.",
    actionPrompt: "비밀번호를 입력할 때 안전한 행동을 선택해요.",
    safetySentence:
      "비밀번호는 말하지 않아요. 손으로 가리고 내가 직접 눌러요.",
    teacherNote:
      "학생이 비밀번호 요청을 거절하고, 손으로 가리며 입력하는지 관찰합니다.",
    requiredEvidenceIds: ["shield-hand", "keypad"],
    clues: [
      {
        id: "keypad",
        title: "비밀번호 키패드",
        short: "번호를 누르는 곳",
        detail:
          "비밀번호를 직접 눌러야 하는 키패드예요. 다른 사람이 보지 못하게 가려요.",
        position: { left: "48%", top: "83%" },
        required: true,
      },
      {
        id: "shield-hand",
        title: "손으로 가리기",
        short: "손으로 키패드를 가려요",
        detail:
          "손이나 지갑으로 키패드를 가리고 번호를 눌러요. 다른 사람이 볼 수 없어요.",
        position: { left: "50%", top: "76%" },
        required: true,
      },
      {
        id: "card-out",
        title: "카드 출구 (CARD)",
        short: "나중에 카드 챙기는 곳",
        detail:
          "비밀번호를 다 누른 뒤에는 카드가 이 CARD 출구로 나와요. 잊지 말고 챙겨요.",
        position: { left: "50%", top: "55%" },
      },
      {
        id: "receipt-out",
        title: "영수증 출구 (RECEIPT)",
        short: "돈 쓴 종이 나오는 곳",
        detail:
          "명세표가 나오는 RECEIPT 출구예요. 나중에 같이 챙겨요.",
        position: { left: "26%", top: "60%" },
      },
    ],
    evidenceOptions: [
      {
        id: "hand-keypad",
        title: "손으로 가리기와 키패드",
        detail: "손으로 가리고 내가 직접 키패드를 눌러요.",
        correct: true,
        feedback:
          "맞아요. 손으로 가리고 직접 눌러야 비밀번호를 안전하게 지킬 수 있어요.",
      },
      {
        id: "tell-stranger",
        title: "낯선 어른에게 말하기",
        detail: "비밀번호를 말하면 빠를 것 같아요.",
        correct: false,
        feedback:
          "괜찮아요. 비밀번호는 어떤 사람에게도 말하면 안 돼요. 다른 증거를 찾아봐요.",
      },
      {
        id: "floor-atm",
        title: "ATM 바닥 노란 선",
        detail: "ATM 앞에 줄 서는 표시가 있어요.",
        correct: false,
        feedback:
          "바닥 선은 비밀번호 보호와 직접 관련이 없어요. 다시 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "cover-type",
        label: "손으로 가리고 내가 직접 누른다",
        detail: "손이나 가방으로 키패드를 가리며 직접 입력해요.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 손으로 가리고 비밀번호를 눌러 안전하게 지켰어요.",
      },
      {
        id: "say-password",
        label: "낯선 어른에게 비밀번호를 말한다",
        detail: "어른이 대신 눌러줄 거예요.",
        correct: false,
        feedback:
          "다시 확인해요. 비밀번호는 절대 말하면 안 돼요. 내가 직접, 손으로 가리고 눌러요.",
      },
      {
        id: "say-loud",
        label: "크게 말하며 직접 누른다",
        detail: "번호를 읽으며 누릅니다.",
        correct: false,
        feedback:
          "괜찮아요. 크게 말하면 다른 사람이 들을 수 있어요. 조용히 손으로 가리고 눌러요.",
      },
    ],
  },
  {
    id: "atm-collect",
    title: "이야기 3. 카드와 명세표를 챙겨요",
    subtitle: "마무리와 안전 점검",
    caseBrief:
      "돈이 나왔어요! 친구가 '빨리 가자, 카드는 놔두고 그냥 가'라고 해요.",
    objective:
      "ATM을 마치기 전에 카드와 명세표를 꼭 챙겨요.",
    investigationGuide:
      "ATM에서 나오는 것들을 확인해요. 카드 출구와 명세표 출구를 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "친구",
    statement: "돈 나왔어! 빨리 가야 해. 카드는 놔두고 그냥 가자.",
    presentPrompt: "ATM을 떠나기 전에 반드시 챙겨야 할 것을 골라요.",
    actionPrompt: "ATM 앞을 떠나기 전에 어떻게 할지 선택해요.",
    safetySentence:
      "돈을 받은 뒤에는 카드와 명세표를 꼭 챙겨요. 카드를 두고 가면 큰일 나요.",
    teacherNote:
      "학생이 카드와 명세표를 모두 확인하고 챙기는지 관찰합니다.",
    requiredEvidenceIds: ["card-out2", "receipt-out2"],
    clues: [
      {
        id: "card-out2",
        title: "카드 출구 (CARD)",
        short: "카드가 나오는 곳",
        detail:
          "ATM을 마치면 카드가 이 CARD 출구로 나와요. 잊고 가면 큰일 나요!",
        position: { left: "50%", top: "72%" },
        required: true,
      },
      {
        id: "receipt-out2",
        title: "영수증 출구 (RECEIPT)",
        short: "돈 쓴 종이가 나오는 곳",
        detail:
          "명세표는 돈을 어떻게 사용했는지 기록이에요. 챙겨두면 나중에 확인할 수 있어요.",
        position: { left: "26%", top: "70%" },
        required: true,
      },
      {
        id: "cash-out",
        title: "현금 출구 (CASH)",
        short: "돈이 나온 곳",
        detail:
          "돈은 이미 받았어요. 하지만 카드와 영수증도 꼭 챙겨요.",
        position: { left: "73%", top: "72%" },
      },
      {
        id: "atm-screen2",
        title: "ATM 완료 화면",
        short: "이용 감사합니다",
        detail:
          "화면에 '이용해 주셔서 감사합니다'가 나왔어요. 하지만 카드와 영수증을 먼저 챙겨요.",
        position: { left: "50%", top: "37%" },
      },
    ],
    evidenceOptions: [
      {
        id: "card-receipt",
        title: "카드와 명세표 출구",
        detail: "카드와 명세표를 모두 챙겨야 해요.",
        correct: true,
        feedback:
          "맞아요. 카드와 명세표를 두 가지 모두 챙겨야 안전해요.",
      },
      {
        id: "atm-screen-ev",
        title: "ATM 완료 화면",
        detail: "이용이 끝났다고 나와 있어요.",
        correct: false,
        feedback:
          "완료 화면만 보면 카드를 두고 갈 수 있어요. 카드와 명세표 출구를 찾아봐요.",
      },
      {
        id: "friend-bag-ev",
        title: "친구 가방",
        detail: "친구가 먼저 가려고 가방을 메고 있어요.",
        correct: false,
        feedback:
          "친구가 급해도 괜찮아요. 카드와 명세표를 먼저 챙겨요. 다시 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "take-both",
        label: "카드와 명세표를 모두 챙기고 ATM을 마친다",
        detail: "두 가지를 모두 확인하고 출발합니다.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 카드와 명세표를 챙기고 안전하게 ATM 사용을 마쳤어요.",
      },
      {
        id: "leave-card",
        label: "돈만 챙기고 카드는 두고 간다",
        detail: "서두르다 카드를 ATM에 둡니다.",
        correct: false,
        feedback:
          "다시 확인해요. 카드를 두고 가면 다른 사람이 쓸 수 있어요. 꼭 챙겨요.",
      },
      {
        id: "go-quick",
        label: "친구를 따라 바로 출발한다",
        detail: "아무것도 챙기지 않고 급하게 갑니다.",
        correct: false,
        feedback:
          "괜찮아요. 친구가 급해도 카드와 명세표를 챙기고 가요. 잠깐이면 돼요.",
      },
    ],
  },
];

const EMPTY_EVIDENCE_IDS: string[] = [];

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

// ATM scene: each episode maps to a different ATM panel layout label
const sceneLabels: Record<string, string> = {
  "atm-card": "💳 카드 넣기 · 돈 찾기",
  "atm-password": "🔐 비밀번호 입력",
  "atm-collect": "🧾 카드 · 명세표 챙기기",
};

export default function AtmSimulationPage() {
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("case");
  const [foundByEpisode, setFoundByEpisode] = useState<Record<string, string[]>>({});
  const [completedEpisodeIds, setCompletedEpisodeIds] = useState<string[]>([]);
  const [stars, setStars] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [easyMode, setEasyMode] = useState(true);
  const [guideText, setGuideText] = useState(episodes[0].caseBrief);
  const [itemPocketOpen, setItemPocketOpen] = useState(false);
  const [itemPocketSolved, setItemPocketSolved] = useState(false);
  const [itemPocketHints, setItemPocketHints] = useState(0);
  const [itemPocketWrongAttempts, setItemPocketWrongAttempts] = useState(0);
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
  const foundEvidenceIds = useMemo(
    () => foundByEpisode[episode.id] ?? EMPTY_EVIDENCE_IDS,
    [foundByEpisode, episode.id]
  );
  const readyForStatement = episode.requiredEvidenceIds.every((id) =>
    foundEvidenceIds.includes(id)
  );
  const collectedClues = useMemo(
    () => episode.clues.filter((clue) => foundEvidenceIds.includes(clue.id)),
    [episode.clues, foundEvidenceIds]
  );

  const { displayed, done, skip } = useTypewriter(guideText);

  useEffect(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    const bgm = new Audio("/assets/sound/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.16;
    bgmRef.current = bgm;
    if (!savedMute && !savedBgmMute) {
      bgm.play().catch(() => undefined);
    }
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
    if (nextMuted) {
      audioRef.current?.pause();
      bgmRef.current?.pause();
      return;
    }
    if (!isBgmMuted) playBgmIfAllowed();
  };

  const toggleBgmMute = () => {
    const nextMuted = !isBgmMuted;
    setIsBgmMuted(nextMuted);
    localStorage.setItem("haemileum_bgm_muted", String(nextMuted));
    if (nextMuted || isMuted) {
      bgmRef.current?.pause();
      return;
    }
    playBgmIfAllowed();
  };

  const toggleVoiceGender = () => {
    const nextGender = voiceGender === "female" ? "male" : "female";
    setVoiceGender(nextGender);
    localStorage.setItem("haemileum_voice_gender", nextGender);
    window.setTimeout(() => speak(guideText), 50);
  };

  const resetEpisodeInteraction = () => {
    setSelectedEvidenceId(null);
    setSelectedActionId(null);
    setFeedback(null);
  };

  const startInvestigation = () => {
    playBgmIfAllowed();

    if (!itemPocketSolved) {
      setItemPocketOpen(true);
      updateGuide("먼저 준비 주머니를 열고 ATM에서 사용할 은행 카드를 골라요.");
      return;
    }

    setPhase("investigate");
    resetEpisodeInteraction();
    updateGuide(episode.investigationGuide);
  };

  const collectClue = (clue: EvidenceClue) => {
    playBgmIfAllowed();
    setFoundByEpisode((prev) => {
      const current = prev[episode.id] ?? [];
      if (current.includes(clue.id)) return prev;
      return { ...prev, [episode.id]: [...current, clue.id] };
    });
    const nextFound = [...foundEvidenceIds, clue.id];
    const isReady = episode.requiredEvidenceIds.every((id) => nextFound.includes(id));
    updateGuide(
      isReady
        ? `${clue.detail} 필요한 것을 모았어요. 이제 이음이를 불러서 맞는지 확인해요.`
        : clue.detail
    );
  };

  const requestHint = () => {
    playBgmIfAllowed();
    setHintCount((count) => count + 1);
    if (phase === "investigate") {
      const missing = episode.clues.find(
        (clue) => clue.required && !foundEvidenceIds.includes(clue.id)
      );
      updateGuide(
        missing
          ? `힌트: 이번 이야기에서는 '${missing.title}'을 살펴보는 것이 중요해요. 반짝이는 위치를 찾아 눌러보세요.`
          : "힌트: 필요한 것을 다 모았어요. 이제 이음이를 불러도 좋아요."
      );
      return;
    }
    if (phase === "present") {
      const correct = episode.evidenceOptions.find((option) => option.correct);
      updateGuide(`힌트: 확인해야 할 것은 '${correct?.title}'예요.`);
      return;
    }
    if (phase === "action") {
      const correct = episode.actionChoices.find((choice) => choice.correct);
      updateGuide(`힌트: 안전한 행동은 '${correct?.label}'처럼 순서를 지키는 선택이에요.`);
      return;
    }
    updateGuide(episode.teacherNote);
  };

  const openStatement = () => {
    playBgmIfAllowed();
    if (!readyForStatement) {
      setHintCount((count) => count + 1);
      updateGuide("아직 더 살펴볼 것이 있어요. 반짝이는 곳을 조금 더 찾아보고 이음이를 불러요.");
      return;
    }
    setPhase("statement");
    resetEpisodeInteraction();
    updateGuide(`${episode.statementSpeaker}의 말: "${episode.statement}"`);
  };

  const handleStatementChoice = (choice: "follow" | "check" | "help") => {
    playBgmIfAllowed();
    if (choice === "follow") {
      setWrongAttempts((count) => count + 1);
      setFeedback({
        tone: "careful",
        title: "다시 확인해요",
        body: "바로 따라가기 전에 주변을 한 번 더 살펴보면 더 안전해요.",
      });
      updateGuide("괜찮아요. 이번에는 바로 따라가지 말고 '잠깐 확인!'으로 증거를 골라봐요.");
      return;
    }
    if (choice === "help") {
      setHintCount((count) => count + 1);
      updateGuide(episode.teacherNote);
      return;
    }
    setPhase("present");
    setFeedback(null);
    setSelectedEvidenceId(null);
    updateGuide(episode.presentPrompt);
  };

  const presentEvidence = (option: EvidenceOption) => {
    playBgmIfAllowed();
    setSelectedEvidenceId(option.id);
    if (!option.correct) {
      setWrongAttempts((count) => count + 1);
      setFeedback({ tone: "careful", title: "다시 살펴봐요", body: option.feedback });
      updateGuide(option.feedback);
      return;
    }
    setFeedback({ tone: "success", title: "증거 확인", body: option.feedback });
    setPhase("action");
    updateGuide(`${option.feedback} ${episode.actionPrompt}`);
  };

  const chooseAction = (choice: ActionChoice) => {
    playBgmIfAllowed();
    setSelectedActionId(choice.id);
    if (!choice.correct) {
      setWrongAttempts((count) => count + 1);
      setFeedback({ tone: "careful", title: "다시 선택해요", body: choice.feedback });
      updateGuide(choice.feedback);
      return;
    }
    const nextCompleted = completedEpisodeIds.includes(episode.id)
      ? completedEpisodeIds
      : [...completedEpisodeIds, episode.id];
    setCompletedEpisodeIds(nextCompleted);
    setStars(nextCompleted.length);
    setFeedback({ tone: "safe", title: "성공! 잘 했어요", body: choice.feedback });
    setPhase("judgement");
    updateGuide(`${choice.feedback} 오늘의 생활 문장: ${episode.safetySentence}`);
  };

  const saveResult = (finalCompletedIds: string[]) => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    const studentName = localStorage.getItem("haemileum_selected_student") || "학생";
    const previousXp = parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
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
    const evidenceCount = Object.values(foundByEpisode).reduce(
      (sum, ids) => sum + ids.length,
      0
    );
    const score = Math.max(70, 100 - wrongAttempts * 6 - hintCount * 4);
    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "ATM 사용하기",
      score,
      status: "완료",
      emotion: "안정",
      completedAt: new Date().toLocaleString("ko-KR"),
      evidenceCount,
      hintsUsed: hintCount,
      wrongAttempts,
      itemPocketSolved,
      itemPocketHints,
      itemPocketWrongAttempts,
      completedEpisodes: finalCompletedIds.length,
      safetySentences: episodes.map((item) => item.safetySentence),
    });
    returnItemIdsToHome(["bank_card"]);
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const moveNext = () => {
    playBgmIfAllowed();
    if (episodeIndex >= episodes.length - 1) {
      setPhase("complete");
      setFeedback(null);
      updateGuide(
        "ATM 사용 3가지를 모두 마쳤어요. 이제 실제 생활에서도 직접 사용하기, 비밀번호 가리기, 카드 챙기기를 차례로 떠올릴 수 있어요."
      );
      saveResult(completedEpisodeIds);
      return;
    }
    const nextIndex = episodeIndex + 1;
    setEpisodeIndex(nextIndex);
    setPhase("case");
    resetEpisodeInteraction();
    updateGuide(episodes[nextIndex].caseBrief);
  };

  const restart = () => {
    hasSavedRef.current = false;
    returnItemIdsToHome(["bank_card"]);
    setEpisodeIndex(0);
    setPhase("case");
    setFoundByEpisode({});
    setCompletedEpisodeIds([]);
    setStars(0);
    setWrongAttempts(0);
    setHintCount(0);
    setItemPocketOpen(false);
    setItemPocketSolved(false);
    setItemPocketHints(0);
    setItemPocketWrongAttempts(0);
    setLevelUpInfo(null);
    resetEpisodeInteraction();
    updateGuide(episodes[0].caseBrief);
  };

  const progressLabel = `${episodeIndex + 1}/${episodes.length}`;

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-[#080f1e] text-white"
      onClick={playBgmIfAllowed}
    >
      <style>{`
        @keyframes clue-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.5); }
          50% { transform: translate(-50%, -50%) scale(1.07); box-shadow: 0 0 0 14px rgba(96, 165, 250, 0); }
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .clue-pulse { animation: clue-pulse 1.7s ease-in-out infinite; }
        .panel-in { animation: panel-in 0.25s ease-out both; }
      `}</style>

      {/* 전체 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#080f1e] via-[#0d1830] to-[#060d18]" />

      <div className="relative z-10 flex h-full flex-col">
        {/* ── 헤더 ── */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-200">해밀 안전탐정단</p>
            <h1 className="truncate text-lg font-black sm:text-xl">
              ATM 사용하기
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
              이야기 {progressLabel}
            </span>
            <span className="rounded-md border border-blue-300/30 bg-blue-300/15 px-3 py-2 text-blue-100">
              안전도장 {stars}/{episodes.length}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEasyMode((v) => !v); }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {easyMode ? "쉬운 모드 켜짐" : "쉬운 모드 꺼짐"}
            </button>
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
        <section className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[270px_1fr_300px]">
          {/* 왼쪽: 에피소드 정보 */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs font-black text-blue-300">{episode.subtitle}</p>
              <h2 className="mt-1 text-xl font-black leading-tight">{episode.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                {episode.objective}
              </p>
            </div>

            <div className="grid gap-2">
              {episodes.map((item, index) => {
                const isCurrent = index === episodeIndex;
                const isComplete = completedEpisodeIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-md border px-3 py-2 text-xs font-bold ${isCurrent
                      ? "border-blue-300 bg-blue-400/15 text-white"
                      : isComplete
                        ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.title.replace("이야기 ", "")}</span>
                      <span>{isComplete ? "성공" : isCurrent ? "진행" : "대기"}</span>
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

          {/* 가운데: ATM 씬 */}
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 shadow-2xl">
            {/* ATM 이미지 배경 */}
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/assets/atm/atm-machine.png')",
                backgroundColor: "#0d1f3c",
              }}
            />
            {/* 하단 페이드 — 버튼·패널이 화면에 뜰 때 가독성 확보 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040810]/55 via-transparent to-[#040810]/20" />
            {/* 에피소드 단계 레이블 */}
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-blue-400/40 bg-[#0d1f3c]/75 px-4 py-1.5 text-xs font-black text-blue-200 backdrop-blur-sm">
              {sceneLabels[episode.id]}
            </div>

            {/* 탐정 수집 단서 버튼 */}
            {phase === "investigate" &&
              episode.clues.map((clue) => {
                const found = foundEvidenceIds.includes(clue.id);
                const shouldPulse = easyMode && clue.required && !found;
                return (
                  <button
                    key={clue.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); collectClue(clue); }}
                    className={`absolute z-20 min-h-12 w-36 -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-2 text-xs font-black shadow-lg transition ${found
                      ? "border-emerald-300 bg-emerald-500/85 text-white"
                      : shouldPulse
                        ? "clue-pulse border-blue-200 bg-blue-400 text-slate-950"
                        : "border-white/40 bg-slate-950/70 text-white hover:bg-blue-500/80"
                      }`}
                    style={{ left: clue.position.left, top: clue.position.top }}
                  >
                    {found ? "수집 완료" : clue.title}
                  </button>
                );
              })}

            {/* 이야기 시작 카드 */}
            {phase === "case" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-lg border border-white/15 bg-slate-950/88 p-5 text-center shadow-2xl backdrop-blur-md">
                  <p className="text-xs font-black text-blue-200">오늘의 이야기</p>
                  <h2 className="mt-2 text-2xl font-black">{episode.title}</h2>
                  <p className="mt-4 text-base font-semibold leading-7 text-slate-100">
                    {episode.caseBrief}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startInvestigation(); }}
                      className="h-11 rounded-md bg-blue-500 px-5 text-sm font-black text-white hover:bg-blue-400"
                    >
                      연습 시작
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); requestHint(); }}
                      className="h-11 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-black hover:bg-white/20"
                    >
                      선생님과 함께하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 상황 말풍선 */}
            {phase === "statement" && (
              <div className="absolute inset-x-4 top-8 z-20 mx-auto max-w-2xl rounded-lg border border-amber-200/40 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <p className="text-xs font-black text-amber-200">상황 말풍선</p>
                <p className="mt-3 text-xl font-black leading-8">
                  {`${episode.statementSpeaker}: "${episode.statement}"`}
                </p>
                {feedback && (
                  <p className="mt-3 rounded-md bg-rose-500/15 p-3 text-sm font-bold leading-6 text-rose-100">
                    {feedback.body}
                  </p>
                )}
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStatementChoice("follow"); }}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-3 text-sm font-black hover:bg-white/20"
                  >
                    그냥 따른다
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStatementChoice("check"); }}
                    className="rounded-md bg-amber-300 px-3 py-3 text-sm font-black text-slate-950 hover:bg-amber-200"
                  >
                    잠깐 확인!
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStatementChoice("help"); }}
                    className="rounded-md border border-teal-200/30 bg-teal-400/15 px-3 py-3 text-sm font-black text-teal-50 hover:bg-teal-400/25"
                  >
                    도움 받기
                  </button>
                </div>
              </div>
            )}

            {/* 증거 제시 */}
            {phase === "present" && (
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-blue-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-blue-200">증거 제시</p>
                    <h3 className="mt-1 text-xl font-black">{episode.presentPrompt}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); requestHint(); }}
                    className="h-9 rounded-md border border-white/10 bg-white/10 px-3 text-xs font-black hover:bg-white/20"
                  >
                    힌트
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {episode.evidenceOptions.map((option) => {
                    const selected = selectedEvidenceId === option.id;
                    const selectedWrong = selected && !option.correct;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); presentEvidence(option); }}
                        className={`min-h-24 rounded-lg border p-4 text-left transition ${selected && option.correct
                          ? "border-emerald-300 bg-emerald-500/20"
                          : selectedWrong
                            ? "border-rose-300 bg-rose-500/20"
                            : "border-white/10 bg-white/10 hover:border-blue-200 hover:bg-white/15"
                          }`}
                      >
                        <p className="text-base font-black">{option.title}</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                          {option.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 안전 행동 선택 */}
            {phase === "action" && (
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-blue-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-blue-200">안전 행동 선택</p>
                    <h3 className="mt-1 text-xl font-black">{episode.actionPrompt}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); requestHint(); }}
                    className="h-9 rounded-md border border-white/10 bg-white/10 px-3 text-xs font-black hover:bg-white/20"
                  >
                    힌트
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  {episode.actionChoices.map((choice) => {
                    const selected = selectedActionId === choice.id;
                    const selectedWrong = selected && !choice.correct;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); chooseAction(choice); }}
                        className={`rounded-lg border p-4 text-left transition ${selected && choice.correct
                          ? "border-emerald-300 bg-emerald-500/20"
                          : selectedWrong
                            ? "border-rose-300 bg-rose-500/20"
                            : "border-white/10 bg-white/10 hover:border-blue-200 hover:bg-white/15"
                          }`}
                      >
                        <p className="text-base font-black">{choice.label}</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">
                          {choice.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 성공 판정 */}
            {phase === "judgement" && feedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-lg border border-blue-200/40 bg-slate-950/90 p-5 text-center shadow-2xl backdrop-blur-md">
                  <p className="text-xs font-black text-blue-200">성공! 잘 했어요</p>
                  <h2 className="mt-2 text-2xl font-black text-blue-100">
                    {feedback.title}
                  </h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                    {feedback.body}
                  </p>
                  <div className="mt-4 rounded-lg border border-amber-200/30 bg-amber-300/10 p-4 text-left">
                    <p className="text-xs font-black text-amber-100">현실 연결 문장</p>
                    <p className="mt-2 text-base font-black leading-7">
                      {episode.safetySentence}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveNext(); }}
                    className="mt-5 h-11 rounded-md bg-blue-500 px-6 text-sm font-black text-white hover:bg-blue-400"
                  >
                    {episodeIndex >= episodes.length - 1 ? "결과 보기" : "다음 이야기"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 해밀 수첩 */}
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-blue-200">해밀 수첩</p>
                <h3 className="text-lg font-black">살펴본 것</h3>
              </div>
              <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-black">
                {collectedClues.length}/{episode.clues.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {collectedClues.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm font-semibold leading-6 text-slate-300">
                  아직 살펴본 것이 없어요. 화면에서 반짝이는 곳을 찾아 눌러보세요.
                </div>
              )}
              {collectedClues.map((clue) => (
                <div
                  key={clue.id}
                  className={`rounded-lg border p-3 ${clue.required
                    ? "border-blue-200/40 bg-blue-300/10"
                    : "border-white/10 bg-white/5"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black">{clue.title}</p>
                    {clue.required && (
                      <span className="rounded-md bg-blue-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                        핵심
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                    {clue.short}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              {phase === "investigate" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openStatement(); }}
                  className={`h-11 rounded-md text-sm font-black ${readyForStatement
                    ? "bg-blue-400 text-slate-950 hover:bg-blue-300"
                    : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/20"
                    }`}
                >
                  {readyForStatement ? "이음이 호출" : "살펴볼 것 더 찾기"}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); requestHint(); }}
                className="h-10 rounded-md border border-white/10 bg-white/10 text-xs font-black hover:bg-white/20"
              >
                힌트 보기
              </button>
            </div>
          </aside>
        </section>

        {/* ── 푸터: 이음이 가이드 ── */}
        <footer className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded-lg border border-blue-300/30 bg-slate-950/85 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-blue-200">해밀이 가이드</p>
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
              <p className="min-h-12 text-sm font-bold leading-6 text-slate-100 sm:text-base">
                {displayed}
                {!done && <span className="ml-1 animate-pulse text-blue-300">|</span>}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black lg:w-72">
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">힌트</p>
                <p className="mt-1 text-lg text-amber-200">{hintCount}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">재확인</p>
                <p className="mt-1 text-lg text-rose-200">{wrongAttempts}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-3">
                <p className="text-slate-300">살펴본 것</p>
                <p className="mt-1 text-lg text-blue-200">
                  {Object.values(foundByEpisode).reduce((sum, ids) => sum + ids.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── 완료 오버레이 ── */}
      {phase === "complete" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#040810]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-blue-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-xs font-black text-blue-200">오늘의 연습 완료</p>
            <h2 className="mt-2 text-2xl font-black">ATM 사용 잘 해냈어요</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              직접 사용하고, 비밀번호를 지키고, 카드와 명세표를 챙겼어요.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {episodes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-sm font-black text-blue-100">{item.subtitle}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                    {item.safetySentence}
                  </p>
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
                className="flex flex-1 items-center justify-center rounded-md bg-blue-500 py-3 text-sm font-black text-white hover:bg-blue-400"
              >
                학생 홈
              </Link>
            </div>
          </div>
        </div>
      )}

      {phase !== "complete" && (
        <ItemPocket
          missionId="atm"
          open={itemPocketOpen}
          solved={itemPocketSolved}
          onOpenChange={setItemPocketOpen}
          onGuide={updateGuide}
          onSuccess={() => setItemPocketSolved(true)}
          onWrong={() => setItemPocketWrongAttempts((count) => count + 1)}
          onHint={setItemPocketHints}
        />
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
