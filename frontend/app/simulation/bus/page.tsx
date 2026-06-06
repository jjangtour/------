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
  position: {
    left: string;
    top: string;
  };
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
  scenePosition?: string;
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
    id: "bus-number",
    title: "이야기 1. 이 버스가 맞을까?",
    subtitle: "버스 번호와 가는 곳 확인",
    sceneImage: "/assets/bus/bus-step1-stop.jpg",
    scenePosition: "center 38%",
    caseBrief:
      "학교 앞 정류장에 비슷한 색의 버스 두 대가 왔어요. 45번 버스는 2분 뒤에 시청 방향으로 도착합니다.",
    objective: "색깔이나 사람 수보다 번호와 가는 곳을 먼저 확인해요.",
    investigationGuide:
      "주변을 천천히 살펴보세요. 정류장 표지판, 노선도, 버스 번호판을 해밀 수첩에 모으면 이음이를 부를 수 있어요.",
    statementSpeaker: "친구",
    statement:
      "색깔이 비슷하고 사람들이 많이 타니까 이 버스가 맞을 거야. 빨리 타자!",
    presentPrompt: "친구의 말이 맞는지 확인할 것을 골라요.",
    actionPrompt: "모순을 찾았어요. 이제 안전한 행동을 선택해요.",
    safetySentence:
      "버스를 탈 때는 번호와 가는 곳을 먼저 확인해요. 맞는 버스라면 차례로 타요.",
    teacherNote:
      "학생이 색깔보다 번호와 가는 곳을 먼저 살펴보는지 관찰합니다.",
    requiredEvidenceIds: ["route-map", "bus-number"],
    clues: [
      {
        id: "stop-sign",
        title: "정류장 표지판",
        short: "현재 위치 확인",
        detail: "여기는 해밀초 정류장입니다. 내가 서 있는 위치를 먼저 확인했어요.",
        position: { left: "85%", top: "25%" },
      },
      {
        id: "route-map",
        title: "노선도",
        short: "45번은 시청 방향으로 감",
        detail:
          "노선도에는 45번이 시청 방향으로 간다고 적혀 있어요.",
        position: { left: "55%", top: "18%" },
        required: true,
      },
      {
        id: "bus-number",
        title: "버스 도착 안내",
        short: "45번, 2분 뒤, 시청 방향",
        detail: "버스 도착 안내에는 45번 버스가 2분 뒤에 시청 방향으로 온다고 적혀 있어요.",
        position: { left: "55%", top: "30%" },
        required: true,
      },
      {
        id: "queue",
        title: "사람들의 줄",
        short: "사람 수는 확실한 근거가 아님",
        detail:
          "사람들이 많이 탄다고 내가 가려는 곳으로 간다는 뜻은 아니에요. 번호와 가는 곳을 다시 봐야 해요.",
        position: { left: "80%", top: "67%" },
      },
    ],
    evidenceOptions: [
      {
        id: "bus-color",
        title: "버스 색깔",
        detail: "색깔이 비슷해 보여요.",
        correct: false,
        feedback:
          "괜찮아요. 버스 색깔은 비슷할 수 있어요. 더 정확한 것을 다시 골라볼까요?",
      },
      {
        id: "number-and-route",
        title: "버스 도착 안내와 노선도",
        detail: "45번 버스는 2분 뒤에 오고, 시청 방향으로 가요.",
        correct: true,
        feedback:
          "좋아요. 도착 안내와 노선도를 함께 보니 45번 버스를 기다려야 한다는 걸 확인했어요.",
      },
      {
        id: "friend-bag",
        title: "친구의 가방",
        detail: "친구가 가방을 메고 있어요.",
        correct: false,
        feedback:
          "가방은 버스가 어디로 가는지 알려주지 않아요. 버스 정보를 다시 살펴봐요.",
      },
      {
        id: "many-people",
        title: "많이 타는 사람들",
        detail: "사람들이 많이 줄을 섰어요.",
        correct: false,
        feedback:
          "사람 수는 힌트가 될 수 있지만 확실한 정보는 아니에요. 번호와 가는 곳을 확인해요.",
      },
    ],
    actionChoices: [
      {
        id: "wait-right-bus",
        label: "45번인지 확인하고 기다린다",
        detail: "45번, 시청 방향, 2분 뒤 도착 표시를 보고 기다립니다.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 빨리 타기보다 맞는 버스인지 먼저 확인했어요.",
      },
      {
        id: "ride-now",
        label: "사람들이 타니까 그냥 탄다",
        detail: "사람 수만 보고 결정합니다.",
        correct: false,
        feedback:
          "다시 확인해요. 사람들이 많이 타도 내가 가려는 곳으로 가는 버스가 아닐 수 있어요.",
      },
      {
        id: "scold-friend",
        label: "친구에게 화를 낸다",
        detail: "친구가 틀렸다고 크게 말합니다.",
        correct: false,
        feedback:
          "친구에게 화내지 않아도 돼요. 차분히 '잠깐 확인해 보자'라고 말하면 좋아요.",
      },
    ],
  },
  {
    id: "bus-boarding",
    title: "이야기 2. 버스 안에서 먼저 할 일",
    subtitle: "교통카드, 자리, 손잡이",
    sceneImage: "/assets/bus/bus-step3-terminal.png",
    caseBrief:
      "맞는 버스에 탔어요. 그런데 친구가 '카드는 나중에 찍고 빈자리부터 잡자'라고 말합니다.",
    objective: "탑승 직후 필요한 절차와 안전한 자세를 고릅니다.",
    investigationGuide:
      "버스 안을 살펴보세요. 카드 단말기, 교통카드, 손잡이와 빈자리를 비교해요.",
    statementSpeaker: "친구",
    statement: "카드는 나중에 찍어도 돼. 일단 빈자리부터 빨리 잡자!",
    presentPrompt: "친구의 말에서 헷갈리는 부분을 확인할 것을 골라요.",
    actionPrompt: "버스에 탔을 때 먼저 해야 할 안전 행동을 선택해요.",
    safetySentence:
      "버스에 타면 먼저 카드를 찍어요. 자리가 없으면 손잡이를 꼭 잡아요.",
    teacherNote:
      "탑승 절차와 신체 안전 행동을 순서대로 말할 수 있는지 확인합니다.",
    requiredEvidenceIds: ["card-reader", "bus-card"],
    clues: [
      {
        id: "card-reader",
        title: "카드 단말기",
        short: "타자마자 찍는 곳",
        detail:
          "버스 앞쪽에 교통카드를 찍는 단말기가 있어요. 타면 먼저 여기에 카드를 댑니다.",
        position: { left: "49%", top: "45%" },
        required: true,
      },
      {
        id: "bus-card",
        title: "교통카드",
        short: "결제에 필요한 준비물",
        detail: "교통카드는 손에 준비해 두면 버스에 타자마자 바로 찍을 수 있어요.",
        position: { left: "31%", top: "66%" },
        required: true,
      },
      {
        id: "seat",
        title: "빈자리",
        short: "앉을 수 있으면 천천히 앉기",
        detail: "빈자리가 있으면 주변을 살피고 천천히 앉아요. 급하게 뛰면 위험해요.",
        position: { left: "68%", top: "61%" },
      },
      {
        id: "handle",
        title: "손잡이",
        short: "서 있을 때 잡기",
        detail: "자리에 앉지 못하면 손잡이나 기둥을 잡아 몸을 지켜요.",
        position: { left: "69%", top: "27%" },
      },
    ],
    evidenceOptions: [
      {
        id: "empty-seat",
        title: "빈자리",
        detail: "빈자리가 보여요.",
        correct: false,
        feedback:
          "빈자리도 중요하지만 결제 순서를 설명하는 증거는 아니에요. 카드와 단말기를 다시 봐요.",
      },
      {
        id: "card-and-reader",
        title: "교통카드와 카드 단말기",
        detail: "타자마자 카드를 찍어 요금을 냅니다.",
        correct: true,
        feedback:
          "맞아요. 교통카드와 단말기를 보면 카드를 먼저 찍어야 한다는 걸 알 수 있어요.",
      },
      {
        id: "window-view",
        title: "창밖 풍경",
        detail: "창밖에 가게가 보여요.",
        correct: false,
        feedback:
          "창밖 풍경은 지금 할 일을 알려주지 않아요. 버스 안에서 먼저 해야 할 것을 찾아봐요.",
      },
    ],
    actionChoices: [
      {
        id: "tag-and-hold",
        label: "카드를 찍고 손잡이를 잡는다",
        detail: "결제를 먼저 하고 몸을 안전하게 지킵니다.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 카드도 찍고 몸도 안전하게 지켰어요.",
      },
      {
        id: "run-seat",
        label: "빈자리로 뛰어간다",
        detail: "넘어질 수 있지만 빨리 앉으려고 합니다.",
        correct: false,
        feedback:
          "괜찮아요. 버스 안에서는 뛰지 않아요. 먼저 카드를 찍고 천천히 이동해요.",
      },
      {
        id: "skip-pay",
        label: "카드를 찍지 않고 조용히 선다",
        detail: "결제를 하지 않습니다.",
        correct: false,
        feedback:
          "다시 생각해 봐요. 버스에 탔을 때는 교통카드를 찍어 요금을 내야 해요.",
      },
    ],
  },
  {
    id: "bus-getoff",
    title: "이야기 3. 언제 내려야 할까?",
    subtitle: "안내 방송, 하차벨, 안전 하차",
    sceneImage: "/assets/bus/bus-step4-bell.png",
    caseBrief:
      "목적지 근처 안내 방송이 나왔어요. 친구가 창밖이 낯익으니 바로 문 앞으로 뛰어가자고 말합니다.",
    objective: "내릴 곳을 확인하고 하차벨을 누른 뒤 안전하게 내려요.",
    investigationGuide:
      "버스 안의 소리와 표시를 확인해요. 안내 방송, 하차벨, 문 앞 안전선을 해밀 수첩에 모아보세요.",
    statementSpeaker: "친구",
    statement: "창밖이 낯익어. 지금 바로 문 앞으로 뛰어가면 돼!",
    presentPrompt: "지금 내려야 하는지 확인할 가장 좋은 것을 골라요.",
    actionPrompt: "목적지 안내를 들었을 때 안전한 행동을 선택해요.",
    safetySentence:
      "내릴 곳 안내가 나오면 벨을 눌러요. 버스가 멈추면 천천히 차례로 내려요.",
    teacherNote:
      "안내 방송과 행동 순서를 연결하는지, 급하게 움직이지 않는지 기록합니다.",
    requiredEvidenceIds: ["announcement", "bell"],
    clues: [
      {
        id: "announcement",
        title: "안내 방송",
        short: "다음 정류장 안내",
        detail:
          "안내 방송에서 '다음 정류장은 해밀아파트입니다'라고 말했어요. 내릴 준비를 할 때예요.",
        position: { left: "32%", top: "25%" },
        required: true,
      },
      {
        id: "bell",
        title: "하차벨",
        short: "내릴 뜻을 알리는 버튼",
        detail: "하차벨을 누르면 기사님께 다음 정류장에서 내릴 사람이 있다는 신호가 가요.",
        position: { left: "49%", top: "43%" },
        required: true,
      },
      {
        id: "safety-line",
        title: "문 앞 안전선",
        short: "멈추기 전에는 가까이 가지 않기",
        detail:
          "버스가 움직일 때 문 앞으로 급하게 가면 넘어질 수 있어요. 멈춘 뒤 차례로 이동해요.",
        position: { left: "61%", top: "60%" },
      },
      {
        id: "window",
        title: "창밖 풍경",
        short: "도움이 되는 것",
        detail:
          "낯익은 풍경은 도움이 되지만 정확한 정류장 확인은 방송과 표시가 더 안전해요.",
        position: { left: "75%", top: "35%" },
      },
    ],
    evidenceOptions: [
      {
        id: "window-memory",
        title: "낯익은 창밖",
        detail: "전에 본 건물이 보여요.",
        correct: false,
        feedback:
          "창밖 풍경도 도움이 될 수 있어요. 하지만 내릴 때는 안내 방송과 정류장 표시를 먼저 확인해요.",
      },
      {
        id: "announcement-and-bell",
        title: "안내 방송과 하차벨",
        detail: "다음 정류장 안내를 듣고 하차벨로 신호를 보냅니다.",
        correct: true,
        feedback:
          "좋아요. 방송과 하차벨을 연결해서 내릴 준비를 정확히 판단했어요.",
      },
      {
        id: "door-area",
        title: "문 앞 공간",
        detail: "문 가까이에 서면 빨리 내릴 수 있어요.",
        correct: false,
        feedback:
          "문 앞 공간만 보면 급하게 움직이게 될 수 있어요. 먼저 안내와 하차벨을 확인해요.",
      },
    ],
    actionChoices: [
      {
        id: "press-bell-wait",
        label: "하차벨을 누르고 멈춘 뒤 내린다",
        detail: "신호를 보낸 뒤 버스가 멈출 때까지 기다립니다.",
        correct: true,
        feedback:
          "성공! 잘 했어요. 벨을 누르고, 버스가 멈춘 뒤 차례로 내리기로 했어요.",
      },
      {
        id: "run-door",
        label: "바로 문 앞으로 뛰어간다",
        detail: "버스가 움직이는 중에 급하게 이동합니다.",
        correct: false,
        feedback:
          "다시 확인해요. 버스가 움직일 때 뛰면 넘어질 수 있어요. 하차벨을 먼저 눌러요.",
      },
      {
        id: "shout-driver",
        label: "기사님께 크게 소리친다",
        detail: "벨 대신 큰 소리로 말합니다.",
        correct: false,
        feedback:
          "큰 소리보다 하차벨이 더 안전하고 정확해요. 어려우면 가까운 어른에게 도움을 요청해요.",
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

export default function BusSimulationPage() {
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
  const [isMuted, setIsMuted] = useState(() =>
    readStoredBoolean("haemileum_sound_muted")
  );
  const [isBgmMuted, setIsBgmMuted] = useState(() =>
    readStoredBoolean("haemileum_bgm_muted")
  );
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
      updateGuide("먼저 준비 주머니를 열고 버스를 탈 때 필요한 물건을 골라요.");
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
      updateGuide(`힌트: 친구의 말과 함께 볼 것은 '${correct?.title}'예요.`);
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
        body: "빠르게 따라가기 전에 주변을 한 번 더 살펴보면 더 안전해요.",
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
      setFeedback({
        tone: "careful",
        title: "다시 살펴봐요",
        body: option.feedback,
      });
      updateGuide(option.feedback);
      return;
    }

    setFeedback({
      tone: "success",
      title: "모순 확인",
      body: option.feedback,
    });
    setPhase("action");
    updateGuide(`${option.feedback} ${episode.actionPrompt}`);
  };

  const chooseAction = (choice: ActionChoice) => {
    playBgmIfAllowed();
    setSelectedActionId(choice.id);

    if (!choice.correct) {
      setWrongAttempts((count) => count + 1);
      setFeedback({
        tone: "careful",
        title: "다시 선택해요",
        body: choice.feedback,
      });
      updateGuide(choice.feedback);
      return;
    }

    const nextCompleted = completedEpisodeIds.includes(episode.id)
      ? completedEpisodeIds
      : [...completedEpisodeIds, episode.id];

    setCompletedEpisodeIds(nextCompleted);
    setStars(nextCompleted.length);
    setFeedback({
      tone: "safe",
      title: "성공! 잘 했어요",
      body: choice.feedback,
    });
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
      mission: "버스 타기 연습",
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

    returnItemIdsToHome(["bus_card"]);
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  const moveNext = () => {
    playBgmIfAllowed();

    if (episodeIndex >= episodes.length - 1) {
      setPhase("complete");
      setFeedback(null);
      updateGuide(
        "버스 타기 연습 3가지를 모두 마쳤어요. 이제 실제 생활에서도 번호 확인, 카드 찍기, 하차벨 누르기를 차례로 떠올릴 수 있어요."
      );
      saveResult(completedEpisodeIds);
      return;
    }

    const nextIndex = episodeIndex + 1;
    const nextEpisode = episodes[nextIndex];

    setEpisodeIndex(nextIndex);
    setPhase("case");
    resetEpisodeInteraction();
    updateGuide(nextEpisode.caseBrief);
  };

  const restart = () => {
    hasSavedRef.current = false;
    returnItemIdsToHome(["bus_card"]);
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
      className="fixed inset-0 overflow-hidden bg-[#10151f] text-white"
      onClick={playBgmIfAllowed}
    >
      <style>{`
        @keyframes clue-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.5); }
          50% { transform: translate(-50%, -50%) scale(1.06); box-shadow: 0 0 0 12px rgba(250, 204, 21, 0); }
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .clue-pulse { animation: clue-pulse 1.7s ease-in-out infinite; }
        .panel-in { animation: panel-in 0.25s ease-out both; }
      `}</style>

      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url('${episode.sceneImage}')`,
          backgroundPosition: episode.scenePosition ?? "center center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#10151f]/45 to-[#162033]/80" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-200">해밀 안전탐정단</p>
            <h1 className="truncate text-lg font-black sm:text-xl">
              버스 타기 연습
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
              이야기 {progressLabel}
            </span>
            <span className="rounded-md border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-amber-100">
              안전도장 {stars}/{episodes.length}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setEasyMode((value) => !value);
              }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {easyMode ? "쉬운 모드 켜짐" : "쉬운 모드 꺼짐"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleVoiceGender();
              }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {voiceGender === "female" ? "여성 음성" : "남성 음성"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleBgmMute();
              }}
              className="h-9 rounded-md border border-white/10 bg-white/10 px-3 hover:bg-white/20"
            >
              {isBgmMuted ? "배경음 꺼짐" : "배경음 켜짐"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleMute();
              }}
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

        <section className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[270px_1fr_300px]">
          <aside className="panel-in flex min-h-0 flex-col gap-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <div>
              <p className="text-xs font-black text-sky-300">{episode.subtitle}</p>
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
                      ? "border-sky-300 bg-sky-400/15 text-white"
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

          <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${episode.sceneImage}')`,
                backgroundPosition: episode.scenePosition ?? "center center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />

            {phase === "investigate" &&
              episode.clues.map((clue) => {
                const found = foundEvidenceIds.includes(clue.id);
                const shouldPulse = easyMode && clue.required && !found;

                return (
                  <button
                    key={clue.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      collectClue(clue);
                    }}
                    className={`absolute z-20 min-h-12 w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 py-2 text-xs font-black shadow-lg transition ${found
                      ? "border-emerald-300 bg-emerald-500/85 text-white"
                      : shouldPulse
                        ? "clue-pulse border-amber-200 bg-amber-400 text-slate-950"
                        : "border-white/40 bg-slate-950/70 text-white hover:bg-sky-500/80"
                      }`}
                    style={{ left: clue.position.left, top: clue.position.top }}
                  >
                    {found ? "수집 완료" : clue.title}
                  </button>
                );
              })}

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
                      onClick={(event) => {
                        event.stopPropagation();
                        startInvestigation();
                      }}
                      className="h-11 rounded-md bg-emerald-500 px-5 text-sm font-black text-slate-950 hover:bg-emerald-400"
                    >
                      연습 시작
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        requestHint();
                      }}
                      className="h-11 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-black hover:bg-white/20"
                    >
                      선생님과 함께하기
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatementChoice("follow");
                    }}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-3 text-sm font-black hover:bg-white/20"
                  >
                    그냥 따른다
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatementChoice("check");
                    }}
                    className="rounded-md bg-amber-300 px-3 py-3 text-sm font-black text-slate-950 hover:bg-amber-200"
                  >
                    잠깐 확인!
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatementChoice("help");
                    }}
                    className="rounded-md border border-teal-200/30 bg-teal-400/15 px-3 py-3 text-sm font-black text-teal-50 hover:bg-teal-400/25"
                  >
                    도움 받기
                  </button>
                </div>
              </div>
            )}

            {phase === "present" && (
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-sky-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-sky-200">증거 제시</p>
                    <h3 className="mt-1 text-xl font-black">{episode.presentPrompt}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestHint();
                    }}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          presentEvidence(option);
                        }}
                        className={`min-h-24 rounded-lg border p-4 text-left transition ${selected && option.correct
                          ? "border-emerald-300 bg-emerald-500/20"
                          : selectedWrong
                            ? "border-rose-300 bg-rose-500/20"
                            : "border-white/10 bg-white/10 hover:border-sky-200 hover:bg-white/15"
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

            {phase === "action" && (
              <div className="absolute inset-x-4 top-6 z-20 mx-auto max-w-3xl rounded-lg border border-emerald-200/30 bg-slate-950/88 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-200">안전 행동 선택</p>
                    <h3 className="mt-1 text-xl font-black">{episode.actionPrompt}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      requestHint();
                    }}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          chooseAction(choice);
                        }}
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

            {phase === "judgement" && feedback && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-lg border border-emerald-200/40 bg-slate-950/90 p-5 text-center shadow-2xl backdrop-blur-md">
                  <p className="text-xs font-black text-emerald-200">성공! 잘 했어요</p>
                  <h2 className="mt-2 text-2xl font-black text-emerald-100">
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
                    onClick={(event) => {
                      event.stopPropagation();
                      moveNext();
                    }}
                    className="mt-5 h-11 rounded-md bg-emerald-500 px-6 text-sm font-black text-slate-950 hover:bg-emerald-400"
                  >
                    {episodeIndex >= episodes.length - 1 ? "결과 보기" : "다음 이야기"}
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  onClick={(event) => {
                    event.stopPropagation();
                    openStatement();
                  }}
                  className={`h-11 rounded-md text-sm font-black ${readyForStatement
                    ? "bg-sky-400 text-slate-950 hover:bg-sky-300"
                    : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/20"
                    }`}
                >
                  {readyForStatement ? "이음이 호출" : "살펴볼 것 더 찾기"}
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  requestHint();
                }}
                className="h-10 rounded-md border border-white/10 bg-white/10 text-xs font-black hover:bg-white/20"
              >
                힌트 보기
              </button>
            </div>
          </aside>
        </section>

        <footer className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded-lg border border-sky-300/30 bg-slate-950/85 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-sky-200">해밀이 가이드</p>
                {!done && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      skip();
                    }}
                    className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold hover:bg-white/20"
                  >
                    바로 보기
                  </button>
                )}
              </div>
              <p className="min-h-12 text-sm font-bold leading-6 text-slate-100 sm:text-base">
                {displayed}
                {!done && <span className="ml-1 animate-pulse text-sky-300">|</span>}
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
                <p className="text-slate-300">살펴볼 것</p>
                <p className="mt-1 text-lg text-sky-200">
                  {Object.values(foundByEpisode).reduce((sum, ids) => sum + ids.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {phase === "complete" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070913]/92 p-4">
          <div className="w-full max-w-lg rounded-lg border border-emerald-200/40 bg-slate-950 p-6 text-center shadow-2xl">
            <p className="text-xs font-black text-emerald-200">오늘의 연습 완료</p>
            <h2 className="mt-2 text-2xl font-black">버스 타기 잘 해냈어요</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              주변을 잘 살펴보고, 맞는 방법을 차근차근 골랐어요.
            </p>

            <div className="mt-5 grid gap-2 text-left">
              {episodes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-sm font-black text-emerald-100">{item.subtitle}</p>
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
                className="flex flex-1 items-center justify-center rounded-md bg-emerald-500 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
              >
                학생 홈
              </Link>
            </div>
          </div>
        </div>
      )}

      {phase !== "complete" && (
        <ItemPocket
          missionId="bus"
          open={itemPocketOpen}
          solved={itemPocketSolved}
          onOpenChange={setItemPocketOpen}
          onGuide={updateGuide}
          onSuccess={() => setItemPocketSolved(true)}
          onWrong={() => setItemPocketWrongAttempts((count) => count + 1)}
          onHint={setItemPocketHints}
        />
      )}

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
