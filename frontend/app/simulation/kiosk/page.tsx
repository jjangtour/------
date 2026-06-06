"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ItemPocket from "@/components/ItemPocket";
import { getLevelInfo } from "@/utils/level";
import { returnItemIdsToHome } from "@/utils/items";

type CharacterKey = "boy" | "girl";
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
  sceneImage: string;
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

const characters: Record<CharacterKey, { name: string; image: string }> = {
  boy: { name: "도윤", image: "/assets/kiosk/kiosk-boy.png" },
  girl: { name: "하늘", image: "/assets/kiosk/kiosk-girl.png" },
};

// 에피소드별 화면 단계 레이블
const sceneLabels: Record<string, string> = {
  "kiosk-order": "🍔 메뉴 선택 화면",
  "kiosk-payment": "💳 결제 방법 확인",
  "kiosk-receipt": "✅ 결제 완료 · 영수증",
};

const episodes: Episode[] = [
  {
    id: "kiosk-order",
    title: "이야기 1. 메뉴를 골라요",
    subtitle: "불고기버거 세트 선택하기",
    sceneImage: "/assets/kiosk/episode1-menu.png",
    caseBrief:
      "햄버거 가게 키오스크 앞에 왔어요. 불고기 버거 세트를 주문할 거예요. 친구가 '아무거나 빨리 눌러!'라고 해요.",
    objective:
      "천천히 화면을 봐요. 불고기버거 세트와 '카드만 돼요' 안내를 먼저 찾아요.",
    investigationGuide:
      "키오스크 화면을 천천히 살펴보세요. 불고기버거 세트 메뉴와 카드 안내문을 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "친구",
    statement: "아무거나 눌러도 돼! 빨리빨리 해. 뒤에 사람 기다리잖아.",
    presentPrompt: "천천히 확인해야 할 것을 골라요.",
    actionPrompt: "안전한 주문 방법을 선택해요.",
    safetySentence:
      "키오스크는 천천히 봐요. 메뉴를 확인하고 올바른 것을 눌러요.",
    teacherNote:
      "학생이 조급해하지 않고 메뉴를 차례로 확인하는지 관찰합니다.",
    requiredEvidenceIds: ["kiosk-burger", "kiosk-card-notice"],
    clues: [
      {
        id: "kiosk-title",
        title: "메뉴 선택 화면",
        short: "메뉴를 선택해 주세요!",
        detail:
          "화면에 '메뉴를 선택해 주세요!'라고 나와 있어요. 먹고 싶은 것을 고르면 돼요.",
        position: { left: "80%", top: "10%" },
      },
      {
        id: "kiosk-burger",
        title: "불고기버거 세트",
        short: "오늘 주문할 메뉴 — 화면 왼쪽 위",
        detail:
          "불고기버거 세트예요. 버거와 음료가 같이 나와요. 이것을 눌러야 해요.",
        position: { left: "58%", top: "29%" },
        required: true,
      },
      {
        id: "kiosk-drink",
        title: "음료수",
        short: "음료만 따로 주문할 때",
        detail:
          "음료수만 단품으로 주문할 때 눌러요. 오늘은 세트를 주문하니까 불고기버거 세트를 눌러요.",
        position: { left: "81%", top: "25%" },
      },
      {
        id: "kiosk-card-notice",
        title: "'카드만 돼요' 안내문",
        short: "현금 사용 불가 — 화면 하단",
        detail:
          "화면 아래에 '다음은 카드만 돼요! 현금은 사용하실 수 없습니다.'라고 나와 있어요. 지폐는 넣으면 안 돼요.",
        position: { left: "58%", top: "72%" },
        required: true,
      },
    ],
    evidenceOptions: [
      {
        id: "burger-and-notice",
        title: "불고기버거 세트 메뉴와 카드 안내문",
        detail: "메뉴를 찾고 카드만 된다는 안내를 미리 확인해요.",
        correct: true,
        feedback:
          "맞아요. 메뉴와 결제 안내를 확인하면 천천히 올바르게 주문할 수 있어요.",
      },
      {
        id: "friend-voice",
        title: "친구의 말",
        detail: "친구가 빨리 누르라고 해요.",
        correct: false,
        feedback:
          "괜찮아요. 친구 말보다 화면 안내를 먼저 봐요. 불고기버거 세트와 카드 안내문을 찾아봐요.",
      },
      {
        id: "store-deco",
        title: "가게 인테리어",
        detail: "벽에 맛있어 보이는 그림들이 있어요.",
        correct: false,
        feedback:
          "가게 장식은 주문에 도움이 안 돼요. 화면에서 불고기버거 세트를 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "select-carefully",
        label: "천천히 보고 불고기버거 세트를 선택한다",
        detail: "화면을 보고 차례로 눌러요.",
        correct: true,
        feedback: "성공! 잘 했어요. 천천히 확인하고 올바르게 주문했어요.",
      },
      {
        id: "rush-anything",
        label: "친구 말대로 아무거나 빨리 누른다",
        detail: "서두르다 원하지 않는 메뉴를 고를 수 있어요.",
        correct: false,
        feedback:
          "다시 확인해요. 급해도 괜찮아요. 화면을 보고 불고기버거 세트를 눌러요.",
      },
      {
        id: "give-up",
        label: "너무 어려워서 처음부터 다시 한다",
        detail: "취소하고 다시 시작합니다.",
        correct: false,
        feedback:
          "괜찮아요. 어렵지 않아요. 불고기버거 세트 그림을 찾아 눌러봐요.",
      },
    ],
  },
  {
    id: "kiosk-payment",
    title: "이야기 2. 잠깐 확인!",
    subtitle: "카드 전용 기계와 결제하기",
    sceneImage: "/assets/kiosk/episode2-payment.png",
    caseBrief:
      "메뉴를 골랐어요. 결제 화면이 나왔어요. 친구가 '지폐를 넣자! 돈 넣는 곳 있잖아!'라고 해요.",
    objective:
      "급해도 괜찮아요. '카드만 돼요' 안내문을 먼저 확인하고 결제해요.",
    investigationGuide:
      "결제 화면을 살펴보세요. '카드만 돼요' 안내문과 카드 투입구를 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "친구",
    statement: "지폐를 넣자! 여기 돈 넣는 곳 있잖아. 빨리 넣어!",
    presentPrompt: "계산 방법을 알려주는 것을 골라요.",
    actionPrompt: "안전한 결제 방법을 선택해요.",
    safetySentence:
      "결제 전에 카드만 되는지 안내문을 봐요. 지폐를 넣으면 안 돼요.",
    teacherNote:
      "학생이 지폐 유혹을 이기고 카드 전용 안내문을 확인하는지 관찰합니다.",
    requiredEvidenceIds: ["kiosk-card-sign", "kiosk-card-slot"],
    clues: [
      {
        id: "kiosk-payment-screen",
        title: "선택한 메뉴와 금액",
        short: "불고기버거 세트 10,900원",
        detail:
          "결제 화면에 주문한 메뉴와 금액이 나와 있어요. 확인하고 결제해요.",
        position: { left: "82%", top: "30%" },
      },
      {
        id: "kiosk-card-sign",
        title: "'카드만 돼요' 안내문",
        short: "현금 사용 불가 표시 — 화면 중단",
        detail:
          "화면 가운데 '다음은 카드만 돼요 현금은 사용하실 수 없습니다.'라고 나와 있어요. 지폐는 넣으면 안 돼요.",
        position: { left: "90%", top: "55%" },
        required: true,
      },
      {
        id: "kiosk-card-slot",
        title: "카드투입구",
        short: "카드를 넣는 곳 — 기계 하단",
        detail:
          "'↑ 카드투입구 ↑' 표시가 있는 슬롯이에요. 여기에 카드를 꽂아서 결제해요.",
        position: { left: "65%", top: "75%" },
        required: true,
      },
      {
        id: "kiosk-pay-btn",
        title: "결제하기 버튼",
        short: "빨간 결제 버튼",
        detail:
          "카드를 넣으면 '결제하기' 버튼이 활성화돼요. 취소 말고 결제하기를 눌러요.",
        position: { left: "83%", top: "60%" },
      },
    ],
    evidenceOptions: [
      {
        id: "sign-and-slot",
        title: "'카드만 돼요' 안내문과 카드투입구",
        detail: "안내문을 보면 이 기계는 카드로만 결제해야 해요.",
        correct: true,
        feedback:
          "맞아요. 안내문과 카드투입구를 보면 카드로만 결제한다는 걸 알 수 있어요.",
      },
      {
        id: "friend-bag",
        title: "친구 가방",
        detail: "친구가 가방에서 지폐를 꺼내려 해요.",
        correct: false,
        feedback:
          "친구 가방은 결제 방법을 알려주지 않아요. '카드만 돼요' 안내문을 찾아봐요.",
      },
      {
        id: "store-chair",
        title: "취소 버튼",
        detail: "주문을 멈추는 회색 버튼이 있어요.",
        correct: false,
        feedback:
          "취소하지 않아도 돼요. '카드만 돼요' 안내문과 카드투입구를 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "use-card",
        label: "안내문을 확인하고 카드를 넣어 결제한다",
        detail: "카드투입구에 카드를 꽂아 결제해요.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 안내문을 확인하고 카드로 안전하게 결제했어요.",
      },
      {
        id: "try-cash",
        label: "친구 말대로 지폐를 넣으려 한다",
        detail: "지폐 넣는 곳을 찾아봅니다.",
        correct: false,
        feedback:
          "다시 확인해요. '카드만 돼요' 기계에 지폐를 넣으면 안 돼요. 카드투입구를 찾아봐요.",
      },
      {
        id: "restart-order",
        label: "처음부터 주문을 다시 한다",
        detail: "취소하고 처음부터 다시 시작합니다.",
        correct: false,
        feedback:
          "괜찮아요. 취소하지 않아도 돼요. 카드투입구에 카드를 꽂으면 결제할 수 있어요.",
      },
    ],
  },
  {
    id: "kiosk-receipt",
    title: "이야기 3. 영수증을 선택해요",
    subtitle: "결제 완료 확인과 영수증",
    sceneImage: "/assets/kiosk/episode3-receipt.png",
    caseBrief:
      "카드로 결제했어요! 결제 완료 화면이 나왔어요. 친구가 '영수증 필요 없어, 빨리 가자!'라고 해요.",
    objective:
      "결제가 잘 됐는지 확인해요. 영수증은 받아도 되고 안 받아도 괜찮아요.",
    investigationGuide:
      "결제 완료 화면을 살펴보세요. 결제 완료 확인과 영수증 버튼을 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "친구",
    statement: "영수증 필요 없어. 그냥 빨리 가자!",
    presentPrompt: "주문이 잘 됐는지 확인할 것을 골라요.",
    actionPrompt: "결제 완료 후 안전한 행동을 선택해요.",
    safetySentence:
      "결제 완료 화면을 확인해요. 영수증은 받아도 되고 안 받아도 괜찮아요.",
    teacherNote:
      "학생이 결제 완료를 확인하고 영수증 여부를 스스로 선택하는지 관찰합니다.",
    requiredEvidenceIds: ["kiosk-done-screen", "kiosk-receipt-btn"],
    clues: [
      {
        id: "kiosk-check-icon",
        title: "결제 완료! ✓",
        short: "초록 체크 표시",
        detail:
          "초록색 체크 표시와 '결제 완료!'가 나왔어요. 주문이 성공적으로 됐어요.",
        position: { left: "85%", top: "25%" },
        required: true,
      },
      {
        id: "kiosk-done-screen",
        title: "주문 내역",
        short: "불고기버거 세트 10,900원",
        detail:
          "주문 내역에 불고기버거 세트와 금액이 나와 있어요. 제대로 주문됐는지 확인해요.",
        position: { left: "83%", top: "41%" },
      },
      {
        id: "kiosk-receipt-btn",
        title: "영수증 받기 / 받지 않기",
        short: "영수증 선택 버튼 — 화면 하단",
        detail:
          "영수증을 받으면 주문 내용을 확인할 수 있어요. 받지 않아도 괜찮아요.",
        position: { left: "89%", top: "68%" },
        required: true,
      },
      {
        id: "kiosk-card-return",
        title: "카드투입구",
        short: "카드를 꺼내는 곳",
        detail:
          "결제가 끝나면 카드가 이 투입구로 나와요. 카드를 잊지 말고 챙겨요.",
        position: { left: "50%", top: "75%" },
      },
    ],
    evidenceOptions: [
      {
        id: "done-and-receipt",
        title: "결제 완료 화면과 영수증 버튼",
        detail: "완료 화면으로 주문 성공을 확인하고, 영수증을 선택해요.",
        correct: true,
        feedback:
          "맞아요. 결제 완료 화면을 확인하고 영수증을 선택하면 주문이 끝나요.",
      },
      {
        id: "store-menu",
        title: "가게 벽 메뉴판",
        detail: "벽에 메뉴 그림이 보여요.",
        correct: false,
        feedback:
          "메뉴판은 결제 완료와 관계없어요. 화면의 완료 표시를 찾아봐요.",
      },
      {
        id: "next-person",
        title: "다음 사람",
        detail: "뒤에 사람이 기다리고 있어요.",
        correct: false,
        feedback:
          "뒤 사람이 있어도 괜찮아요. 결제 완료 화면을 먼저 확인해요.",
      },
    ],
    actionChoices: [
      {
        id: "confirm-and-choose",
        label: "결제 완료를 확인하고 영수증을 선택한다",
        detail: "화면을 보고 영수증 받기 또는 받지 않기를 눌러요.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 결제를 확인하고 영수증까지 선택했어요. 카드도 챙겨요!",
      },
      {
        id: "go-without-check",
        label: "확인 없이 그냥 간다",
        detail: "결제가 됐는지 모르고 자리를 떠납니다.",
        correct: false,
        feedback:
          "다시 확인해요. 결제 완료 화면을 먼저 보고, 카드도 챙기고 나서 이동해요.",
      },
      {
        id: "restart-again",
        label: "결제가 됐는지 불안해서 처음부터 다시 한다",
        detail: "처음부터 다시 시작합니다.",
        correct: false,
        feedback:
          "괜찮아요. 결제 완료 화면이 나오면 주문이 성공한 거예요. 다시 하지 않아도 돼요.",
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

export default function KioskSimulationPage() {
  const [character, setCharacter] = useState<CharacterKey>("boy");
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

  const resetEpisodeInteraction = () => {
    setSelectedEvidenceId(null);
    setSelectedActionId(null);
    setFeedback(null);
  };

  const startInvestigation = () => {
    playBgmIfAllowed();

    if (!itemPocketSolved) {
      setItemPocketOpen(true);
      updateGuide("먼저 준비 주머니를 열고 키오스크에서 계산할 때 필요한 물건을 골라요.");
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
    setHintCount((c) => c + 1);
    if (phase === "investigate") {
      const missing = episode.clues.find(
        (clue) => clue.required && !foundEvidenceIds.includes(clue.id)
      );
      updateGuide(
        missing
          ? `힌트: '${missing.title}'을 살펴보는 것이 중요해요. 반짝이는 위치를 눌러보세요.`
          : "힌트: 필요한 것을 다 모았어요. 이제 이음이를 불러도 좋아요."
      );
      return;
    }
    if (phase === "present") {
      const correct = episode.evidenceOptions.find((o) => o.correct);
      updateGuide(`힌트: 확인해야 할 것은 '${correct?.title}'예요.`);
      return;
    }
    if (phase === "action") {
      const correct = episode.actionChoices.find((c) => c.correct);
      updateGuide(`힌트: 안전한 행동은 '${correct?.label}'처럼 순서를 지키는 선택이에요.`);
      return;
    }
    updateGuide(episode.teacherNote);
  };

  const openStatement = () => {
    playBgmIfAllowed();
    if (!readyForStatement) {
      setHintCount((c) => c + 1);
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
      setWrongAttempts((c) => c + 1);
      setFeedback({ tone: "careful", title: "다시 확인해요", body: "바로 따라가기 전에 화면을 한 번 더 봐요." });
      updateGuide("괜찮아요. 이번에는 바로 따라가지 말고 '잠깐 확인!'으로 증거를 골라봐요.");
      return;
    }
    if (choice === "help") {
      setHintCount((c) => c + 1);
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
      setWrongAttempts((c) => c + 1);
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
      setWrongAttempts((c) => c + 1);
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
    const evidenceCount = Object.values(foundByEpisode).reduce((sum, ids) => sum + ids.length, 0);
    const score = Math.max(70, 100 - wrongAttempts * 6 - hintCount * 4);
    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "패스트푸드 주문",
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
    returnItemIdsToHome(["payment_card"]);
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const moveNext = () => {
    playBgmIfAllowed();
    if (episodeIndex >= episodes.length - 1) {
      setPhase("complete");
      setFeedback(null);
      updateGuide(
        "패스트푸드 주문 3가지를 모두 마쳤어요. 이제 실제 생활에서도 천천히 확인하고, 카드로 결제하고, 영수증을 선택할 수 있어요."
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
    returnItemIdsToHome(["payment_card"]);
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
      className="fixed inset-0 overflow-hidden bg-[#1a0e05] text-white"
      onClick={playBgmIfAllowed}
    >
      <style>{`
        @keyframes clue-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.5); }
          50% { transform: translate(-50%, -50%) scale(1.07); box-shadow: 0 0 0 14px rgba(251, 191, 36, 0); }
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .clue-pulse { animation: clue-pulse 1.7s ease-in-out infinite; }
        .panel-in { animation: panel-in 0.25s ease-out both; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e05] via-[#231505] to-[#100a02]" />

      <div className="relative z-10 flex h-full flex-col">
        {/* ── 헤더 ── */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-200">해밀 안전탐정단</p>
            <h1 className="truncate text-lg font-black sm:text-xl">패스트푸드 주문</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
              이야기 {progressLabel}
            </span>
            <span className="rounded-md border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-amber-100">
              안전도장 {stars}/{episodes.length}
            </span>
            {/* 캐릭터 선택 */}
            {(["boy", "girl"] as CharacterKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCharacter(k); }}
                className={`h-9 rounded-md border px-3 transition ${character === k
                  ? "border-amber-300/50 bg-amber-300/20 text-amber-100"
                  : "border-white/10 bg-white/10 hover:bg-white/20"
                  }`}
              >
                {characters[k].name}
              </button>
            ))}
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
              <p className="text-xs font-black text-amber-300">{episode.subtitle}</p>
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
                      ? "border-amber-300 bg-amber-400/15 text-white"
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

          {/* 가운데: 키오스크 씬 */}
          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 shadow-2xl">
            {/* 에피소드별 키오스크 씬 이미지 (bg-contain) */}
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-500"
              style={{
                backgroundImage: `url('${episode.sceneImage}')`,
                backgroundColor: "#2a1a0a",
              }}
            />
            {/* 하단 페이드 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a0e05]/60 via-transparent to-[#1a0e05]/15" />
            {/* 에피소드 단계 레이블 */}
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-amber-400/40 bg-[#1a0e05]/75 px-4 py-1.5 text-xs font-black text-amber-200 backdrop-blur-sm">
              {sceneLabels[episode.id]}
            </div>

            {/* 탐정 단서 버튼 */}
            {phase === "investigate" &&
              episode.clues.map((clue) => {
                const found = foundEvidenceIds.includes(clue.id);
                const shouldPulse = easyMode && clue.required && !found;
                return (
                  <button
                    key={clue.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); collectClue(clue); }}
                    className={`absolute z-20 min-h-11 w-28 -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-2 text-xs font-black shadow-lg transition ${found
                      ? "border-emerald-300 bg-emerald-500/85 text-white"
                      : shouldPulse
                        ? "clue-pulse border-amber-200 bg-amber-400 text-slate-950"
                        : "border-white/40 bg-slate-950/70 text-white hover:bg-amber-500/80"
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
                  <p className="text-xs font-black text-amber-200">오늘의 이야기</p>
                  <h2 className="mt-2 text-2xl font-black">{episode.title}</h2>
                  <p className="mt-4 text-base font-semibold leading-7 text-slate-100">
                    {episode.caseBrief}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startInvestigation(); }}
                      className="h-11 rounded-md bg-amber-500 px-5 text-sm font-black text-slate-950 hover:bg-amber-400"
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
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-amber-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-amber-200">증거 제시</p>
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
                            : "border-white/10 bg-white/10 hover:border-amber-200 hover:bg-white/15"
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
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-emerald-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-200">안전 행동 선택</p>
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
                            : "border-white/10 bg-white/10 hover:border-emerald-200 hover:bg-white/15"
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
                <div className="w-full max-w-xl rounded-lg border border-amber-200/40 bg-slate-950/90 p-5 text-center shadow-2xl backdrop-blur-md">
                  <p className="text-xs font-black text-amber-200">성공! 잘 했어요</p>
                  <h2 className="mt-2 text-2xl font-black text-amber-100">{feedback.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                    {feedback.body}
                  </p>
                  <div className="mt-4 rounded-lg border border-amber-200/30 bg-amber-300/10 p-4 text-left">
                    <p className="text-xs font-black text-amber-100">현실 연결 문장</p>
                    <p className="mt-2 text-base font-black leading-7">{episode.safetySentence}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveNext(); }}
                    className="mt-5 h-11 rounded-md bg-amber-500 px-6 text-sm font-black text-slate-950 hover:bg-amber-400"
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
                <p className="text-xs font-black text-amber-200">해밀 수첩</p>
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
                    ? "border-amber-200/40 bg-amber-300/10"
                    : "border-white/10 bg-white/5"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black">{clue.title}</p>
                    {clue.required && (
                      <span className="rounded-md bg-amber-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                        핵심
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{clue.short}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              {phase === "investigate" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openStatement(); }}
                  className={`h-11 rounded-md text-sm font-black ${readyForStatement
                    ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
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
              <p className="min-h-12 text-sm font-bold leading-6 text-slate-100 sm:text-base">
                {displayed}
                {!done && <span className="ml-1 animate-pulse text-amber-300">|</span>}
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
                <p className="mt-1 text-lg text-amber-200">
                  {Object.values(foundByEpisode).reduce((sum, ids) => sum + ids.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── 완료 오버레이 ── */}
      {phase === "complete" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0500]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-amber-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-xs font-black text-amber-200">오늘의 연습 완료</p>
            <h2 className="mt-2 text-2xl font-black">패스트푸드 주문 잘 해냈어요</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              화면을 보고, 천천히 확인하고, 카드로 결제했어요.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {episodes.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-black text-amber-100">{item.subtitle}</p>
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
                className="flex flex-1 items-center justify-center rounded-md bg-amber-500 py-3 text-sm font-black text-slate-950 hover:bg-amber-400"
              >
                학생 홈
              </Link>
            </div>
          </div>
        </div>
      )}

      {phase !== "complete" && (
        <ItemPocket
          missionId="kiosk"
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
