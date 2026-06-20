'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedBooks, type BookData } from '@/utils/ebookData';

export default function EbookBanner() {
  const featured = getFeaturedBooks();
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

  // Auto-play
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

  const book: BookData = featured[current];

  /* Gradient palette per slide */
  const gradients = [
    'from-emerald-900 via-emerald-800 to-teal-700',
    'from-indigo-900 via-purple-800 to-fuchsia-700',
    'from-amber-900 via-orange-800 to-rose-700',
  ];

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br ${gradients[current % gradients.length]} transition-colors duration-700`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="ebook-shimmer absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: text */}
          <div
            key={`text-${current}`}
            className={isTransitioning ? 'ebook-banner-exit' : 'ebook-banner-enter'}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-white/80">
                {book.category} · {book.targetAge}
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
              글/그림 {book.author} · {book.publisher}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/ebook/${book.id}`}
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:bg-white/90 active:scale-95"
              >
                📖 자세히 보기
              </Link>
              <Link
                href={`/ebook/${book.id}/reader`}
                className="rounded-full border-2 border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                📚 바로 읽기
              </Link>
            </div>
          </div>

          {/* Right: book cover */}
          <div className="flex justify-center lg:justify-end">
            <div
              key={`cover-${current}`}
              className={`ebook-cover-3d ${isTransitioning ? 'ebook-banner-exit' : 'ebook-banner-enter'}`}
            >
              <div className="ebook-cover-3d-inner relative">
                <div className="ebook-book-float relative h-80 w-56 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20 sm:h-96 sm:w-64">
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

                {/* Best badge */}
                {book.isBest && (
                  <div className="ebook-best-badge absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-yellow-900 shadow-lg">
                    👑
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-2">
            {featured.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`ebook-dot h-2.5 rounded-full transition-all ${
                  idx === current
                    ? 'ebook-dot-active bg-white'
                    : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`슬라이드 ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              aria-label="이전"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              aria-label="다음"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
