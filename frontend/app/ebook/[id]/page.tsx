'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getBookById } from '@/utils/ebookData';
import BookPreviewModal from '@/components/ebook/BookPreviewModal';
import '../ebook.css';

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const book = getBookById(id);
  const [showPreview, setShowPreview] = useState(false);

  if (!book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <span className="text-6xl">📚</span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            도서를 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            요청하신 도서가 존재하지 않거나 삭제되었습니다.
          </p>
          <Link
            href="/ebook"
            className="mt-6 inline-flex rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            ← 도서 목록으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Header Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700">
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
            <Link href="/ebook" className="hover:text-white/80 transition">
              이북
            </Link>
            <span>›</span>
            <span className="text-white/70">{book.title}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
            {/* Book cover */}
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

            {/* Book info */}
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
                글/그림 {book.author} · {book.publisher} · {book.publishDate}
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
                    {book.pages}
                  </p>
                  <p className="text-xs font-bold text-white/50">페이지</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
                  <p className="text-lg font-black text-white">
                    {book.chapters.length}
                  </p>
                  <p className="text-xs font-bold text-white/50">챕터</p>
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
                  onClick={() => setShowPreview(true)}
                  className="rounded-full bg-white px-6 py-3.5 text-sm font-black text-emerald-900 shadow-lg transition hover:bg-white/90 active:scale-95"
                >
                  🔍 미리보기
                </button>
                <Link
                  href={`/ebook/${book.id}/reader`}
                  className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
                >
                  📖 자세히 보기 (이북 읽기)
                </Link>
                <Link
                  href="/ebook"
                  className="rounded-full border-2 border-white/20 px-6 py-3.5 text-sm font-black text-white/70 transition hover:bg-white/10"
                >
                  ← 목록으로
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Table of Contents Preview ────────────────────────────── */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-black text-slate-950 sm:text-2xl">
            📋 목차 미리보기
          </h2>
          <div className="mt-8 space-y-2">
            {book.chapters.map((ch) => (
              <div
                key={ch.number}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200/80 transition hover:bg-emerald-50 hover:ring-emerald-200"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                    {ch.number}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {ch.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  p.{ch.page}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Author Section ───────────────────────────────────────── */}
      <section className="bg-stone-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 ring-1 ring-purple-200/50 sm:p-10">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-4xl shadow-lg">
                ✍️
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-purple-500">
                  저자 소개
                </p>
                <h3 className="mt-1 text-xl font-black text-purple-900">
                  {book.author}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  {book.authorBio}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h3 className="text-xl font-black text-slate-950">
            이 책이 마음에 드셨나요?
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            이북으로 바로 읽어보세요!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="rounded-full bg-slate-100 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              🔍 미리보기
            </button>
            <Link
              href={`/ebook/${book.id}/reader`}
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-800"
            >
              📖 이북으로 읽기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Preview Modal */}
      <BookPreviewModal
        book={book}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </main>
  );
}
