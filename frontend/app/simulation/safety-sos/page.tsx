"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { getLevelInfo } from "@/utils/level";

type GamePhase = "smishing" | "trashbin" | "complete";

type SuspiciousWord = {
  id: string;
  word: string;
  explanation: string;
};

const suspiciousWords: SuspiciousWord[] = [
  {
    id: "temp-num",
    word: "임시 번호야",
    explanation: "가족이나 친구가 평소와 다르게 '모르는 번호'로 급하게 돈이나 카드를 요구할 때는, 절대로 바로 믿지 말고 직접 전화를 걸어 실제 본인이 맞는지 확인해야 해요.",
  },
  {
    id: "gift-card",
    word: "구글 기프트카드 10만원짜리 사서 핀번호 보내줘",
    explanation: "메신저로 구글 기프트카드나 상품권의 일련번호(핀번호)를 요구하는 것은 대표적인 메신저 피싱 수법입니다. 확인 없이 핀번호를 알려주면 즉시 돈을 잃게 되니 절대 알려주면 안 돼요.",
  },
  {
    id: "scam-link",
    word: "링크 눌러서 설치해줘: http://giftcard-pay.net",
    explanation: "모르는 문자나 메신저로 전송된 인터넷 주소(URL) 링크는 절대 클릭하면 안 돼요! 해킹 프로그램이 설치되어 스마트폰 내 개인정보나 은행 정보가 전부 유출될 수 있습니다.",
  },
];

const negativeEmotions = [
  { id: "anxiety", emoji: "😰 불안", color: "bg-amber-500/20 text-amber-200 border-amber-500/40", targetY: "150px" },
  { id: "anger", emoji: "😡 화남", color: "bg-red-500/20 text-red-200 border-red-500/40", targetY: "150px" },
  { id: "sadness", emoji: "😢 슬픔", color: "bg-blue-500/20 text-blue-200 border-blue-500/40", targetY: "150px" },
];

export default function SafetySosPage() {
  const [phase, setPhase] = useState<GamePhase>("smishing");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  
  // 레벨업 정보 상태
  const [levelUpInfo, setLevelUpInfo] = useState<{
    isLevelUp: boolean;
    oldLevel: number;
    newLevel: number;
    title: string;
    badge: string;
  } | null>(null);

  // 대화 및 자막 상태
  const [currentText, setCurrentText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  // 스미싱 의심 단어 찾기 상태
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);

  // 감정 쓰레기통 상태
  const [thrownEmotions, setThrownEmotions] = useState<string[]>([]);
  const [animatingEmotion, setAnimatingEmotion] = useState<string | null>(null);

  // SOS 패닉 버튼 상태
  const [showSosModal, setShowSosModal] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "out">("in");

  // 소리 켜기/끄기 상태
  const [isMuted, setIsMuted] = useState(false);
  const [isBgmMuted, setIsBgmMuted] = useState(false);

  // 음성 성별 상태 (female 또는 male)
  const [voiceGender, setVoiceGender] = useState("female");

  useEffect(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    setIsMuted(savedMute);
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    setIsBgmMuted(savedBgmMute);
    const savedGender = localStorage.getItem("haemileum_voice_gender") || "female";
    setVoiceGender(savedGender);
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("haemileum_sound_muted", String(nextMuted));
    if (nextMuted) {
      if (audioRef.current) audioRef.current.pause();
      if (bgmRef.current) bgmRef.current.pause();
    } else {
      const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
      if (bgmRef.current && !savedBgmMute) {
        bgmRef.current.play().catch((err) => {
          console.warn("BGM play failed on unmute:", err);
        });
      }
    }
  };

  const toggleBgmMute = () => {
    const nextBgmMuted = !isBgmMuted;
    setIsBgmMuted(nextBgmMuted);
    localStorage.setItem("haemileum_bgm_muted", String(nextBgmMuted));
    
    if (bgmRef.current) {
      if (nextBgmMuted || isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch((err) => {
          console.warn("BGM play failed on toggle BGM:", err);
        });
      }
    }
  };

  const toggleVoiceGender = () => {
    const nextGender = voiceGender === "female" ? "male" : "female";
    setVoiceGender(nextGender);
    localStorage.setItem("haemileum_voice_gender", nextGender);
    // 즉각적인 피드백을 위해 변경된 목소리로 현재 설명 재생
    setTimeout(() => {
      speak(currentText);
    }, 50);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // 컴포넌트 마운트 및 언마운트 시 오디오 및 BGM 제어
  useEffect(() => {
    const bgm = new Audio("/assets/sound/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.2;
    bgmRef.current = bgm;

    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    if (!savedMute && !savedBgmMute) {
      bgm.play().catch((err) => {
        console.log("BGM autoplay blocked, waiting for user interaction.", err);
      });
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (bgmRef.current) bgmRef.current.pause();
    };
  }, []);

  const playBgmIfAllowed = useCallback(() => {
    const savedMute = localStorage.getItem("haemileum_sound_muted") === "true";
    const savedBgmMute = localStorage.getItem("haemileum_bgm_muted") === "true";
    if (bgmRef.current && !savedMute && !savedBgmMute && bgmRef.current.paused) {
      bgmRef.current.play().catch((err) => {
        console.warn("BGM play failed on interaction:", err);
      });
    }
  }, []);

  // TTS 구현 (Gemini AI 음성 API)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("haemileum_sound_muted") === "true") return;
    
    // 기존에 재생 중이거나 로딩 중인 오디오가 있다면 즉시 정지 및 스트림 비우기
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
      console.warn("AI Voice play failed:", err);
    });
  }, []);

  // 자막 타이핑 시작
  const startTyping = useCallback((text: string) => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
    }
    setDisplayedText("");
    setIsTypingDone(false);

    let idx = 0;
    typingTimerRef.current = window.setInterval(() => {
      idx++;
      setDisplayedText(text.slice(0, idx));
      if (idx >= text.length) {
        setIsTypingDone(true);
        if (typingTimerRef.current) {
          window.clearInterval(typingTimerRef.current);
        }
      }
    }, 30);
  }, []);

  const skipTyping = useCallback(() => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current);
    }
    setDisplayedText(currentText);
    setIsTypingDone(true);
  }, [currentText]);

  // 가이드 설명 업데이트
  const updateGuide = useCallback((text: string) => {
    setCurrentText(text);
    startTyping(text);
    speak(text);
  }, [startTyping, speak]);

  // 초기 가이드 로드
  useEffect(() => {
    if (phase === "smishing") {
      updateGuide("스마트폰에 의심스러운 피싱 문자가 도착했습니다! 문자 내용 중에서 사기가 의심되는 수상한 문장 3군데를 직접 찾아 클릭해 보세요.");
    } else if (phase === "trashbin") {
      updateGuide("사기 문자를 안전하게 차단했습니다! 하지만 아직 가슴이 쿵쾅거리고 불안할 수 있어요. 불안, 화남, 슬픈 감정 블록들을 마우스로 터치해 쓰레기통에 쏙 집어넣어 보세요.");
    } else if (phase === "complete") {
      updateGuide("정말 잘했어요! 사기 문자에 현혹되지 않고 감정 관리까지 마쳤습니다. 미션 성공! 🎉");
      saveResult();
    }
  }, [phase, updateGuide]);

  // SOS 호흡 루프 애니메이션
  useEffect(() => {
    if (!showSosModal) return;
    const interval = setInterval(() => {
      setBreathPhase((p) => (p === "in" ? "out" : "in"));
    }, 4000); // 4초마다 들이마시고 내쉼
    return () => clearInterval(interval);
  }, [showSosModal]);

  // 스미싱 단어 클릭 핸들러
  const handleWordClick = (word: SuspiciousWord) => {
    playBgmIfAllowed();
    if (foundWords.includes(word.id)) {
      // 이미 찾은 단어인 경우 설명 팝업만 다시 노출
      setActiveExplanation(word.explanation);
      speak(word.explanation);
      return;
    }

    const nextFound = [...foundWords, word.id];
    setFoundWords(nextFound);
    setActiveExplanation(word.explanation);
    setScore((s) => s + 15);
    setStars(Math.min(3, Math.ceil(nextFound.length * 1)));

    updateGuide(word.explanation);

    if (nextFound.length === 3) {
      // 3개 모두 찾은 경우
      setScore(50);
      setTimeout(() => {
        updateGuide("수상한 스미싱 지표를 모두 찾아냈습니다! 아주 훌륭해요. 이제 아래의 '문자 차단하고 감정 관리하기' 버튼을 누르세요.");
      }, 4000);
    }
  };

  // 감정 쓰레기통 투척 핸들러
  const handleEmotionThrow = (id: string, name: string) => {
    playBgmIfAllowed();
    if (thrownEmotions.includes(id) || animatingEmotion) return;

    setAnimatingEmotion(id);
    speak("슉");

    // 날아가는 연출 딜레이 후 소멸 및 상태 추가
    setTimeout(() => {
      const nextThrown = [...thrownEmotions, id];
      setThrownEmotions(nextThrown);
      setAnimatingEmotion(null);
      setScore((s) => s + 16);
      
      const starsMap = [3, 3, 4];
      setStars(starsMap[nextThrown.length - 1] || 4);

      if (nextThrown.length === 3) {
        setScore(100);
        setPhase("complete");
      } else {
        updateGuide(`「${name}」 감정을 쓰레기통에 비웠습니다. 마음이 조금 편안해지기 시작했어요.`);
      }
    }, 1100);
  };

  // 결과 localStorage 기록
  const saveResult = () => {
    const studentName = localStorage.getItem("haemileum_selected_student") || "도윤";
    
    // XP 가산
    const prevXpStr = localStorage.getItem("haemileum_student_xp_" + studentName) || "0";
    const prevXp = parseInt(prevXpStr, 10);
    const nextXp = prevXp + 100;
    localStorage.setItem("haemileum_student_xp_" + studentName, String(nextXp));

    const prevLevelInfo = getLevelInfo(prevXp);
    const nextLevelInfo = getLevelInfo(nextXp);
    if (nextLevelInfo.level > prevLevelInfo.level) {
      setLevelUpInfo({
        isLevelUp: true,
        oldLevel: prevLevelInfo.level,
        newLevel: nextLevelInfo.level,
        title: nextLevelInfo.title,
        badge: nextLevelInfo.badge,
      });
      speak(`축하합니다! 레벨업 하셨습니다! ${nextLevelInfo.level}레벨 ${nextLevelInfo.title}이 되었습니다!`);
    }

    const saved = JSON.parse(localStorage.getItem("haemileum_results") || "[]");
    saved.push({
      studentName,
      mission: "사기 방어와 마음 관리",
      score: 100,
      status: "완료",
      emotion: "안정",
      completedAt: new Date().toLocaleString("ko-KR"),
    });
    localStorage.setItem("haemileum_results", JSON.stringify(saved));
    window.dispatchEvent(new Event("storage"));
  };

  // 다시 하기
  const restart = () => {
    setPhase("smishing");
    setScore(0);
    setStars(0);
    setFoundWords([]);
    setActiveExplanation(null);
    setThrownEmotions([]);
    setAnimatingEmotion(null);
    setLevelUpInfo(null);
  };

  return (
    <main 
      className="fixed inset-0 flex items-center justify-center bg-[#070913] text-white select-none font-sans p-4 sm:p-6"
      onClick={() => { playBgmIfAllowed(); !isTypingDone && skipTyping(); }}
    >
      <style>{`
        @keyframes phone-shake {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-52%) rotate(-1deg); }
          75% { transform: translateX(-48%) rotate(1deg); }
        }
        .phone-shake {
          animation: phone-shake 0.3s ease-in-out infinite;
        }
        @keyframes heart-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.2) drop-shadow(0 0 25px rgba(16, 185, 129, 0.7)); }
        }
        .heart-pulse {
          animation: heart-pulse 4s ease-in-out infinite;
        }
        @keyframes slide-to-bin {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--target-x), var(--target-y)) scale(0.3) rotate(30deg); opacity: 0; }
        }
        .slide-to-bin {
          animation: slide-to-bin 1.1s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .pixel-border {
          border: 4px solid #38bdf8;
          box-shadow: 0 0 0 4px #0284c7, 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          background-color: rgba(11, 23, 44, 0.92);
        }
        .pixel-nametag {
          border: 3px solid #38bdf8;
          box-shadow: 0 0 0 3px #0284c7;
          background-color: #101c36;
        }
        .pop-in {
          animation: pop-bounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes pop-bounce {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── 16:9 비율 유지 게임 콘솔 컨테이너 ── */}
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
        
        {/* 씬 배경 이미지 (교실) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url('/assets/safety/safety-bg.png')` }}
        />

        {/* 배경 어두운 레이어 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/55 pointer-events-none" />

        {/* ── 상단 HUD 계기판 ── */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/85 to-transparent px-6 py-4 z-40">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-xs font-black text-sky-400">연습 점수</span>
            <div className="flex items-center gap-1.5 font-black text-sm text-yellow-400">
              {"★".repeat(stars)}
              <span className="text-white/20">{"★".repeat(4 - stars)}</span>
              <span className="text-white/80 ml-1 text-xs">({score}점)</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white/50 tracking-wider">미션 {phase === "smishing" ? "1/2" : phase === "trashbin" ? "2/2" : "완료"} 단계</span>
            <h2 className="text-sm font-black text-white mt-0.5">
              {phase === "smishing" ? "사기 문자 분석" : phase === "trashbin" ? "감정 분리 청소" : "체험 완료"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceGender}
              className="rounded-xl px-3.5 py-2 text-xs font-black border border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md transition cursor-pointer"
            >
              {voiceGender === "female" ? "👩 여성" : "👨 남성"}
            </button>
            <button
              type="button"
              onClick={toggleBgmMute}
              className={`rounded-xl px-4 py-2 text-xs font-black border backdrop-blur-md transition cursor-pointer ${
                isBgmMuted
                  ? "bg-slate-700/85 hover:bg-slate-600 text-slate-300 border-slate-600/30"
                  : "bg-indigo-600/95 hover:bg-indigo-500 text-white border-indigo-500/30"
              }`}
            >
              {isBgmMuted ? "🔇 음악 끔" : "🎵 음악 켬"}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className={`rounded-xl px-4 py-2 text-xs font-black border backdrop-blur-md transition cursor-pointer ${
                isMuted
                  ? "bg-slate-700/85 hover:bg-slate-600 text-slate-300 border-slate-600/30"
                  : "bg-teal-600/95 hover:bg-teal-500 text-white border-teal-500/30"
              }`}
            >
              {isMuted ? "🔇 음성소리 끔" : "🔊 음성소리 켬"}
            </button>
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              className="rounded-xl bg-red-600/90 hover:bg-red-700 px-4 py-2 text-xs font-black border border-red-500/30 backdrop-blur-md transition cursor-pointer"
            >
              🚨 긴급 SOS
            </button>
            <Link
              href="/student/home"
              className="rounded-xl bg-white/10 hover:bg-white/20 px-5 py-2.5 text-xs font-black border border-white/10 backdrop-blur-md transition"
            >
              나가기
            </Link>
          </div>
        </div>

        {/* ── 페이즈 1: 스미싱 문자 의심부분 터치 연습 ── */}
        {phase === "smishing" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 스마트폰 목업 */}
            <div className="relative w-[340px] h-[340px] bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl p-4 flex flex-col z-20">
              <div className="text-center text-[10px] font-bold text-white/40 border-b border-white/10 pb-1.5 mb-3">
                💬 알 수 없는 발신자 번호
              </div>
              
              {/* 문자 내용 */}
              <div className="flex-1 bg-slate-950 rounded-2xl p-3 text-xs leading-relaxed font-semibold text-slate-300 overflow-y-auto space-y-2">
                <p className="text-[10px] text-white/30 text-center">[스마트폰 메시지 도착]</p>
                <div className="bg-slate-800 p-2.5 rounded-xl border border-white/5">
                  엄마, 나 아들인데 
                  
                  {/* 단어 1 */}
                  <button
                    type="button"
                    onClick={() => handleWordClick(suspiciousWords[0])}
                    className={`mx-1 px-1.5 py-0.5 rounded font-black transition cursor-pointer ${
                      foundWords.includes(suspiciousWords[0].id)
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500"
                        : "bg-red-500/10 text-red-200 border border-dashed border-red-500/40 hover:bg-red-500/20"
                    }`}
                  >
                    {suspiciousWords[0].word}
                  </button>
                  . 편의점 가서 
                  
                  {/* 단어 2 */}
                  <button
                    type="button"
                    onClick={() => handleWordClick(suspiciousWords[1])}
                    className={`my-1.5 block text-left px-1.5 py-1 rounded font-black transition cursor-pointer ${
                      foundWords.includes(suspiciousWords[1].id)
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500"
                        : "bg-red-500/10 text-red-200 border border-dashed border-red-500/40 hover:bg-red-500/20"
                    }`}
                  >
                    🔑 {suspiciousWords[1].word}
                  </button>
                  
                  급하니까 
                  {/* 단어 3 */}
                  <button
                    type="button"
                    onClick={() => handleWordClick(suspiciousWords[2])}
                    className={`my-1.5 block text-left px-1.5 py-1 rounded font-black transition cursor-pointer break-all ${
                      foundWords.includes(suspiciousWords[2].id)
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500"
                        : "bg-red-500/10 text-red-200 border border-dashed border-red-500/40 hover:bg-red-500/20"
                    }`}
                  >
                    🔗 {suspiciousWords[2].word}
                  </button>
                </div>
              </div>

              {/* 완료 후 다음 버튼 */}
              {foundWords.length === 3 && (
                <button
                  type="button"
                  onClick={() => setPhase("trashbin")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs mt-3 transition pop-in"
                >
                  🛡️ 문자 차단하고 감정 관리하기
                </button>
              )}
            </div>

            {/* 개별 단어 해설 말풍선 팝업 (우측) */}
            {activeExplanation && (
              <div className="absolute right-[4%] top-[18%] w-[260px] bg-slate-900/95 border-2 border-sky-400 p-4 rounded-2xl shadow-xl pop-in z-30">
                <h4 className="text-xs font-black text-sky-400 border-b border-white/10 pb-1.5 mb-2 flex items-center gap-1">
                  <span>💡 사기 방지 수칙</span>
                </h4>
                <p className="text-[11px] font-bold text-slate-200 leading-relaxed">{activeExplanation}</p>
                <button
                  type="button"
                  onClick={() => setActiveExplanation(null)}
                  className="w-full bg-slate-800 text-[10px] font-bold py-1.5 rounded-lg mt-3 hover:bg-slate-700 transition"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 페이즈 2: 마음 관리 (감정 쓰레기통) ── */}
        {phase === "trashbin" && (
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* 정중앙 쓰레기통 */}
            <div className="relative w-[180px] h-[180px] bg-slate-800 rounded-3xl border-4 border-slate-600 flex flex-col items-center justify-center shadow-lg z-20">
              <span className="text-5xl block">🗑️</span>
              <span className="text-[10px] font-bold text-slate-400 mt-2">감정 쓰레기통</span>
              
              {/* 삼키기 판정 영역 가이드 */}
              <div className="absolute inset-0 border-4 border-dashed border-sky-400/20 rounded-3xl pointer-events-none" />
            </div>

            {/* 감정 조절 블록들 */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[24%] w-[640px] flex justify-between z-30">
              {negativeEmotions.map((item) => {
                const isThrown = thrownEmotions.includes(item.id);
                const isAnimating = animatingEmotion === item.id;
                
                if (isThrown) return <div key={item.id} className="w-[110px]" />;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleEmotionThrow(item.id, item.emoji)}
                    className={`w-[110px] p-3.5 rounded-2xl border-2 font-bold text-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md ${
                      item.color
                    } ${isAnimating ? "slide-to-bin" : ""}`}
                    style={{
                      "--target-x": item.id === "anxiety" ? "265px" : item.id === "anger" ? "0px" : "-265px",
                      "--target-y": item.targetY,
                    } as React.CSSProperties}
                  >
                    <span className="text-sm block">{item.emoji}</span>
                    <span className="text-[9px] text-white/50 block mt-1">터치해서 버리기</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 하단 대화 상자 ── */}
        {phase !== "complete" && (
          <div className="absolute inset-x-4 bottom-4 z-40">
            <div className="pixel-border relative rounded-2xl p-4 sm:p-5 min-h-[90px] sm:min-h-[110px]">
              <div className="pixel-nametag absolute -top-4 left-6 px-4 py-1 rounded-lg text-xs font-black text-sky-300 tracking-wider">
                이음이 가이드
              </div>

              <p className="text-xs sm:text-sm font-bold leading-relaxed text-slate-100 mt-1">
                {displayedText}
                {!isTypingDone && (
                  <span className="ml-1 text-sky-400 animate-pulse">■</span>
                )}
              </p>

              <div className="absolute right-4 bottom-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(currentText);
                  }}
                  className="text-[10px] text-white/50 hover:text-white/90 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition flex items-center gap-1 font-bold"
                >
                  🔊 다시 듣기
                </button>
                {isTypingDone && (
                  <span className="text-[10px] text-sky-300/70 font-bold animate-bounce">
                    {phase === "smishing" ? "글자 터치 대기 중" : "감정 블록 선택 대기 중"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 전체 미션 완료 결과 모달 ── */}
        {phase === "complete" && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50 pop-in">
            <div className="w-full max-w-sm bg-slate-900 border border-sky-500/30 rounded-3xl p-5 shadow-2xl text-center">
              <span className="text-5xl block animate-bounce">🎉</span>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 mt-3">훈련 완료!</h2>
              
              <div className="my-4 bg-slate-950 py-3 px-3 rounded-2xl border border-white/5 text-xs font-bold text-white/80">
                <p className="text-[10px] text-white/50 uppercase font-black tracking-wider">나의 연습 성적</p>
                <div className="text-2xl my-1.5">
                  <span className="text-yellow-400">{"★".repeat(4)}</span>
                </div>
                <p className="text-xs font-bold flex items-center justify-center gap-2">
                  <span>총 점수: <span className="text-emerald-400">{score}점</span></span>
                  <span className="rounded-full bg-yellow-400 text-slate-950 px-2 py-0.5 text-[10px] font-black">
                    +100 XP 획득!
                  </span>
                </p>
                <p className="text-[10px] text-white/40 mt-1">스미싱 사기 문자를 안전하게 간파하고, 정서 조절 청소까지 완벽하게 수행했습니다!</p>
              </div>

              {/* 약속해요 */}
              <div className="mb-4 rounded-2xl bg-slate-950/60 p-3 border border-white/5 text-left">
                <p className="text-[11px] font-black text-emerald-300 mb-1.5">⭐ 안전한 스마트폰 사용 약속!</p>
                <ul className="text-[10px] text-slate-300 space-y-0.5 font-bold list-disc pl-4">
                  <li>가족이 급한 돈/기프트카드를 요구하면 전화로 직접 확인해요.</li>
                  <li>모르는 사람이 보낸 웹 링크 주소는 절대 누르지 않아요.</li>
                  <li>스마트폰 앱을 설치할 때는 믿을 수 있는 스토어만 써요.</li>
                  <li>기분이 당황스러울 때는 부모님이나 선생님께 즉시 보여드려요.</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restart}
                  className="flex-1 bg-slate-800 border border-white/10 hover:bg-slate-700 py-3 rounded-xl text-xs font-bold transition"
                >
                  다시 하기
                </button>
                <Link
                  href="/student/home"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-xs font-black transition flex items-center justify-center"
                >
                  학생 홈으로
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── 레벨업 축하 오버레이 모달 ── */}
        {levelUpInfo && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-55 pop-in">
            <div className="w-full max-w-sm bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 shadow-2xl text-center">
              <span className="text-6xl block animate-bounce">🎉 LEVEL UP 🎉</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-4">레벨업 축하합니다!</h2>
              <p className="text-xs text-slate-300 mt-2 font-bold leading-relaxed">
                미션을 완료하고 더 똑똑하고 안전하게 성장했어요.
              </p>
              
              <div className="my-5 bg-slate-950 py-4 px-4 rounded-2xl border border-yellow-400/30 flex flex-col items-center gap-2.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-lg animate-pulse">
                  {levelUpInfo.badge}
                </span>
                <div>
                  <p className="text-[10px] text-yellow-400 font-black tracking-wider">새로운 등급</p>
                  <h3 className="text-lg font-black text-white mt-1">
                    {levelUpInfo.newLevel}레벨 · {levelUpInfo.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLevelUpInfo(null)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-3 rounded-xl text-sm font-black transition active:scale-95 cursor-pointer"
              >
                멋져요! 확인
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── SOS 패닉 안정을 위한 호흡 치료 모달 (글로벌 오버레이) ── */}
      {showSosModal && (
        <div className="absolute inset-0 bg-[#090b14]/98 flex items-center justify-center p-4 z-50 pop-in">
          <div className="w-full max-w-md text-center">
            
            {/* 심박 박동을 흉내 낸 호흡 심벌 */}
            <div className="flex justify-center mb-6">
              <span className={`text-8xl block heart-pulse ${breathPhase === "in" ? "scale-110 text-emerald-400" : "scale-95 text-emerald-600"}`}>
                💚
              </span>
            </div>

            <h3 className="text-2xl font-black text-emerald-400">마음 안정을 위한 심호흡</h3>
            <p className="text-sm font-bold text-slate-300 mt-4 leading-relaxed">
              화면의 초록색 하트가 커질 때 숨을 천천히 들이마시고,<br />
              작아질 때 숨을 천천히 내쉬어 보세요.
            </p>

            <div className="mt-8 py-3 px-6 bg-slate-900 border border-white/5 rounded-2xl w-fit mx-auto text-emerald-200 font-black text-lg">
              {breathPhase === "in" ? "🌬️ 천천히 들이마시기 (4초)" : "💨 천천히 내쉬기 (4초)"}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSosModal(false);
                updateGuide(phase === "smishing" ? "다시 사기 문자 찾기 단계로 돌아왔습니다. 문자 속 수상한 곳을 마우스로 찾아보세요." : "다시 감정 조절 단계로 돌아왔습니다. 감정 블록을 클릭해 쓰레기통에 넣으세요.");
              }}
              className="mt-10 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-xl text-xs transition cursor-pointer"
            >
              마음이 괜찮아졌어요 (돌아가기)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
