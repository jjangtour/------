'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { type AudioChapter, formatTime } from '@/utils/audiobookData';

interface AudioPlayerProps {
  chapters: AudioChapter[];
  bookTitle: string;
  narrator: string;
  coverImage: string;
  totalSeconds: number;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

export default function AudioPlayer({
  chapters,
  bookTitle,
  narrator,
  coverImage,
  totalSeconds,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Calculate chapter start times
  const chapterStartTimes = chapters.reduce<number[]>((acc, ch, idx) => {
    if (idx === 0) return [0];
    return [...acc, acc[idx - 1] + chapters[idx - 1].duration];
  }, []);

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update current chapter based on time
  useEffect(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapterStartTimes[i]) {
        if (i !== currentChapter) {
          setCurrentChapter(i);
        }
        break;
      }
    }
  }, [currentTime, chapterStartTimes, chapters.length, currentChapter]);

  const speakChapter = useCallback(
    (chapterIdx: number) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(
        chapters[chapterIdx].title
      );
      utterance.lang = 'ko-KR';
      utterance.rate = speed;
      synthRef.current.speak(utterance);
    },
    [chapters, speed]
  );

  const startPlayback = useCallback(() => {
    speakChapter(currentChapter);

    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + speed;
        if (next >= totalSeconds) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (synthRef.current) synthRef.current.cancel();
          return totalSeconds;
        }
        return next;
      });
    }, 1000);
  }, [currentChapter, speed, totalSeconds, speakChapter]);

  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (synthRef.current) synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      startPlayback();
    }
  };

  const goToChapter = (idx: number) => {
    if (idx < 0 || idx >= chapters.length) return;
    const wasPlaying = isPlaying;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (synthRef.current) synthRef.current.cancel();

    setCurrentChapter(idx);
    setCurrentTime(chapterStartTimes[idx]);

    if (wasPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        speakChapter(idx);
        intervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + speed;
            if (next >= totalSeconds) {
              setIsPlaying(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              if (synthRef.current) synthRef.current.cancel();
              return totalSeconds;
            }
            return next;
          });
        }, 1000);
      }, 100);
    }
  };

  const prevChapter = () => goToChapter(currentChapter - 1);
  const nextChapter = () => goToChapter(currentChapter + 1);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(ratio * totalSeconds, totalSeconds));

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (synthRef.current) synthRef.current.cancel();

    setCurrentTime(newTime);

    if (isPlaying) {
      // Determine which chapter we're now in
      let newChapter = 0;
      for (let i = chapters.length - 1; i >= 0; i--) {
        if (newTime >= chapterStartTimes[i]) {
          newChapter = i;
          break;
        }
      }
      speakChapter(newChapter);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + speed;
          if (next >= totalSeconds) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (synthRef.current) synthRef.current.cancel();
            return totalSeconds;
          }
          return next;
        });
      }, 1000);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (isPlaying) {
      speakChapter(currentChapter);
    }
  };

  // Restart interval when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + speed;
          if (next >= totalSeconds) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (synthRef.current) synthRef.current.cancel();
            return totalSeconds;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  const progressPercent = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

  return (
    <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
      {/* Header: Cover + Title */}
      <div className="flex items-center gap-4 p-5 border-b border-slate-100">
        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl shadow-md">
          <Image
            src={coverImage}
            alt={bookTitle}
            fill
            sizes="60px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-900">
            {bookTitle}
          </h3>
          <p className="mt-0.5 text-sm font-bold text-slate-400">
            🎙️ 성우 {narrator}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pt-6 pb-4">
        {/* Play controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prevChapter}
            disabled={currentChapter === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="이전 챕터"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="audio-play-btn flex h-[60px] w-[60px] items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-xl hover:scale-105 active:scale-95"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={nextChapter}
            disabled={currentChapter === chapters.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="다음 챕터"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zm2 0h2V6h-2v12z" transform="scale(-1,1) translate(-24,0)" />
              <path d="M16 6h2v12h-2zm-10 0v12l8.5-6z" />
            </svg>
          </button>
        </div>

        {/* Audio wave animation */}
        <div className="mt-4 flex items-end justify-center gap-1 h-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`audio-wave-bar w-1 rounded-full bg-emerald-500 transition-all ${
                isPlaying
                  ? 'animate-audio-wave'
                  : 'h-1'
              }`}
              style={{
                animationDelay: isPlaying ? `${i * 0.15}s` : undefined,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div
            className="audio-progress group relative h-2 cursor-pointer rounded-full bg-slate-200 transition-all hover:h-3"
            onClick={handleProgressClick}
          >
            <div
              className="audio-progress-fill absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-md ring-2 ring-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalSeconds)}</span>
          </div>
        </div>

        {/* Speed controls */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1">속도</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`speed-btn rounded-full px-3 py-1.5 text-xs font-black transition ${
                speed === s
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Chapter list */}
      <div className="border-t border-slate-100 px-3 py-3">
        <h4 className="px-2 pb-2 text-xs font-black text-slate-400 uppercase tracking-wider">
          📋 챕터 목록
        </h4>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {chapters.map((ch, idx) => (
            <button
              key={ch.number}
              onClick={() => goToChapter(idx)}
              className={`chapter-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                idx === currentChapter
                  ? 'bg-emerald-50 ring-1 ring-emerald-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                    idx === currentChapter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {ch.number}
                </span>
                <span
                  className={`truncate text-sm font-bold ${
                    idx === currentChapter
                      ? 'text-emerald-800'
                      : 'text-slate-700'
                  }`}
                >
                  {ch.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs font-bold text-slate-400">
                  {formatTime(ch.duration)}
                </span>
                {idx === currentChapter && isPlaying && (
                  <span className="flex h-4 w-4 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
