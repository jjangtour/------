'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedAudiobooks, AudiobookData } from '@/utils/audiobookData';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export default function AudiobookBanner() {
  const featured = getFeaturedAudiobooks();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef(0);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(idx);
        setIsTransitioning(false);
      }, 400);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % featured.length);
  }, [current, featured.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + featured.length) % featured.length);
  }, [current, featured.length, goTo]);

  // Auto-play every 5 seconds
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  // Touch / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  if (featured.length === 0) return null;

  const book: AudiobookData = featured[current];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 h-[400px] sm:h-[500px]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        {/* Floating music notes */}
        <div className="absolute right-[10%] top-[20%] text-4xl text-white/10 animate-float">
          ♪
        </div>
        <div className="absolute right-[25%] bottom-[30%] text-3xl text-white/10 animate-float" style={{ animationDelay: '1s' }}>
          ♫
        </div>
        <div className="absolute left-[15%] bottom-[15%] text-2xl text-white/10 animate-float" style={{ animationDelay: '2s' }}>
          🎵
        </div>
      </div>

      <div className="relative mx-auto flex h-full max-w-6xl items-center px-4 sm:px-6">
        <div className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Text */}
          <div
            key={`text-${current}`}
            className={`transition-opacity duration-400 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white/80">
                🎧 오디오북 · {book.category} · {book.targetAge}
              </span>
            </div>

            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              {book.title}
            </h2>

            {book.subtitle && (
              <p className="mt-2 text-base font-bold text-white/60">
                {book.subtitle}
              </p>
            )}

            <p className="mt-4 max-w-lg text-base font-semibold leading-7 text-white/80 sm:text-lg">
              {book.shortDescription}
            </p>

            <p className="mt-3 text-sm font-bold text-white/50">
              글 {book.author} · 🎙️ 성우 {book.narrator} · ⏱️{' '}
              {formatDuration(book.totalSeconds)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/audiobook/${book.id}`}
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:bg-white/90 active:scale-95"
              >
                🎧 지금 듣기
              </Link>
              <Link
                href={`/audiobook/${book.id}`}
                className="rounded-full border-2 border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                📖 자세히 보기
              </Link>
            </div>
          </div>

          {/* Right: Book cover */}
          <div className="hidden justify-center lg:flex lg:justify-end">
            <div
              key={`cover-${current}`}
              className={`transition-opacity duration-400 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="relative">
                <div className="relative h-80 w-56 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20 sm:h-96 sm:w-64 animate-float">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Book spine effect */}
                <div className="absolute left-0 top-0 h-full w-3 rounded-l-xl bg-gradient-to-r from-black/30 to-transparent" />

                {/* Headphone badge */}
                <div className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl shadow-lg ring-4 ring-emerald-900">
                  🎧
                </div>

                {/* Best badge */}
                {book.isBest && (
                  <div className="absolute -left-3 -bottom-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-yellow-900 shadow-lg">
                    👑
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === current
                ? 'w-8 bg-white'
                : 'w-2.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`슬라이드 ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
