"use client";

import { useState, useEffect } from "react";
import { playTtsAudio, stopTtsAudio } from "@/utils/mission/tts";

interface AudioButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  autoPlay?: boolean;
}

export default function AudioButton({
  text,
  label = "다시 듣기",
  size = "md",
  className = "",
  autoPlay = false,
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (autoPlay && text) {
      // 컴포넌트 마운트 직후 안정적인 재생을 위해 약간의 딜레이 후 단일 재생
      timer = setTimeout(() => {
        handlePlay();
      }, 150);
    }

    const handleStopOther = () => {
      setIsPlaying(false);
    };

    window.addEventListener("haemileum_tts_stop", handleStopOther);

    return () => {
      if (timer) clearTimeout(timer);
      stopTtsAudio();
      window.removeEventListener("haemileum_tts_stop", handleStopOther);
    };
  }, [text, autoPlay]);

  const handlePlay = async () => {
    if (isPlaying) {
      stopTtsAudio();
      setIsPlaying(false);
      return;
    }

    // 다른 모든 오디오 버튼 상태 초기화 이벤트 발송
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("haemileum_tts_stop"));
    }

    setIsPlaying(true);
    await playTtsAudio(
      text,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`inline-flex items-center justify-center rounded-full font-bold transition-all shadow-sm active:scale-95 ${
        isPlaying
          ? "bg-emerald-600 text-white ring-4 ring-emerald-200 animate-pulse"
          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-300"
      } ${sizeClasses[size]} ${className}`}
      title={isPlaying ? "음성 멈추기" : "음성으로 듣기"}
      aria-label={label}
    >
      <span className="text-base">{isPlaying ? "⏹️" : "🔊"}</span>
      <span>{isPlaying ? "듣는 중..." : label}</span>
    </button>
  );
}
