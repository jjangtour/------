'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAudiobookById } from '@/utils/audiobookData';
import AudioPlayer from '@/components/audiobook/AudioPlayer';
import '../audiobook.css';

export default function AudiobookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const book = getAudiobookById(id);

  if (!book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <span className="text-6xl">🎧</span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            오디오북을 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            요청하신 오디오북이 존재하지 않거나 삭제되었습니다.
          </p>
          <Link
            href="/audiobook"
            className="mt-6 inline-flex rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            ← 오디오북 목록으로
          </Link>
        </div>
      </main>
    );
  }

  const handleScrollToPlayer = () => {
    const playerSection = document.getElementById('player-section');
    playerSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Header Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs font-bold text-white/50">
            <Link href="/" className="hover:text-white/80 transition">
              홈
            </Link>
            <span>›</span>
            <Link href="/audiobook" className="hover:text-white/80 transition">
              오디오북
            </Link>
            <span>›</span>
            <span className="text-white/70">{book.title}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
            {/* Cover image with 3D hover style */}
            <div className="flex justify-center lg:justify-start">
              <div className="ebook-cover-3d">
                <div className="ebook-cover-3d-inner relative">
                  <div className="relative h-96 w-64 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 sm:h-[420px] sm:w-72">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="288px"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Spine */}
                  <div className="absolute left-0 top-0 h-full w-3 rounded-l-2xl bg-gradient-to-r from-black/30 to-transparent" />

                  {book.isBest && (
                    <div className="ebook-best-badge absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-xl font-black text-yellow-900 shadow-lg">
                      👑
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info panel */}
            <div>
              <div className="flex flex-wrap gap-2">
                {book.isBest && (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-yellow-900">
                    👑 베스트
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 ring-1 ring-white/20">
                  {book.category}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 ring-1 ring-white/20">
                  {book.targetAge}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="mt-2 text-base font-bold text-white/50">
                  {book.subtitle}
                </p>
              )}

              <p className="mt-3 text-sm font-bold text-emerald-300">
                글 {book.author} · 🎙️ 성우 {book.narrator} · {book.publisher} · {book.publishDate}
              </p>

              <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/75">
                {book.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm">
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
                  <p className="text-lg font-black text-white">
                    {book.duration}
                  </p>
                  <p className="text-xs font-bold text-white/50">재생시간</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
                  <p className="text-lg font-black text-white">
                    {book.chapters.length}
                  </p>
                  <p className="text-xs font-bold text-white/50">챕터 수</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
                  <p className="text-lg font-black text-white">
                    {book.targetAge}
                  </p>
                  <p className="text-xs font-bold text-white/50">대상</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleScrollToPlayer}
                  className="rounded-full bg-white px-8 py-3.5 text-sm font-black text-emerald-900 shadow-lg transition hover:bg-white/90 active:scale-95 flex items-center gap-2"
                >
                  🎧 듣기
                </button>
                <Link
                  href="/audiobook"
                  className="rounded-full border-2 border-white/20 px-8 py-3.5 text-sm font-black text-white/70 transition hover:bg-white/10"
                >
                  ← 목록으로
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audio Player Section ─────────────────────────────────── */}
      <section id="player-section" className="bg-white py-12 sm:py-16 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-black text-slate-900 sm:text-2xl">
            🎧 오디오북 플레이어
          </h2>
          <AudioPlayer
            chapters={book.chapters}
            bookTitle={book.title}
            narrator={book.narrator}
            coverImage={book.coverImage}
            totalSeconds={book.totalSeconds}
          />
        </div>
      </section>

      {/* ── Author / Narrator Intro Section ────────────────────── */}
      <section className="bg-stone-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Author Card */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 ring-1 ring-emerald-100 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-2xl shadow-md">
                  ✍️
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
                    저자 소개
                  </p>
                  <h3 className="mt-1 text-lg font-black text-emerald-950">
                    {book.author} 작가
                  </h3>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-600">
                    {book.authorBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Narrator Card */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 p-6 ring-1 ring-indigo-100 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-400 text-2xl shadow-md">
                  🎙️
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    성우 소개
                  </p>
                  <h3 className="mt-1 text-lg font-black text-indigo-950">
                    {book.narrator} 성우
                  </h3>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-600">
                    따뜻하고 생동감 넘치는 목소리로 동화 속 인물들의 감정을 풍부하게 표현합니다. 아이들이 이야기에 푹 빠져들 수 있도록 친절하고 다정한 나레이션을 들려줍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      <section className="bg-white py-16 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h3 className="text-xl font-black text-slate-900">
            이 오디오북이 마음에 드셨나요?
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            다른 즐겁고 유익한 오디오북들도 만나보세요!
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/audiobook"
              className="rounded-full bg-emerald-700 px-8 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-800 active:scale-95"
            >
              ← 오디오북 전체 목록으로
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
