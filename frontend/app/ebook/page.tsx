import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { books, getBestBooks } from '@/utils/ebookData';
import EbookBanner from '@/components/ebook/EbookBanner';
import './ebook.css';

export const metadata: Metadata = {
  title: '이북 도서관 | 해밀이음',
  description: '아이들을 위한 따뜻한 이야기가 가득한 이북 도서관입니다.',
};

export default function EbookPage() {
  const bestBooks = getBestBooks();

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Banner Carousel ──────────────────────────────────────── */}
      <EbookBanner />

      {/* ── Best Book Feature ────────────────────────────────────── */}
      {bestBooks.length > 0 && (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-black text-yellow-800">
                ⭐ BEST
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                베스트 도서
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
                가장 사랑받는 도서를 만나보세요
              </p>
            </div>

            {bestBooks.map((book) => (
              <Link
                key={book.id}
                href={`/ebook/${book.id}`}
                className="group block"
              >
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 ring-1 ring-emerald-200/50 transition-all hover:shadow-xl">
                  <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[280px_1fr]">
                    {/* Cover image */}
                    <div className="flex justify-center">
                      <div className="ebook-cover-3d">
                        <div className="ebook-cover-3d-inner relative h-80 w-56 overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10">
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            sizes="224px"
                            className="object-cover"
                          />
                          <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-r from-black/20 to-transparent" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-yellow-900">
                          👑 베스트
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          {book.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {book.targetAge}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="mt-1 text-sm font-bold text-slate-400">
                          {book.subtitle}
                        </p>
                      )}

                      <p className="mt-3 text-sm font-bold text-emerald-700">
                        {book.author} · {book.publisher}
                      </p>

                      <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-slate-600">
                        {book.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {book.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <span className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow transition group-hover:bg-emerald-800">
                          📖 자세히 보기 →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── All Books Grid ───────────────────────────────────────── */}
      <section className="bg-stone-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
              도서 목록
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
              전체 도서
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
              아이들을 위한 따뜻한 이야기를 만나보세요
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/ebook/${book.id}`}
                className="ebook-card group block overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80"
              >
                {/* Cover */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="ebook-card-cover object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {book.isBest && (
                      <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-black text-yellow-900 shadow">
                        👑 BEST
                      </span>
                    )}
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow backdrop-blur-sm">
                      {book.category}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                    <span className="translate-y-4 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-900 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      자세히 보기
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-black text-slate-900 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {book.author} · {book.publisher}
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 line-clamp-2">
                    {book.shortDescription}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {book.targetAge}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {book.pages}쪽
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-800 to-teal-700 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="text-4xl">📚</span>
          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            더 많은 이야기가 준비되고 있어요
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-white/70">
            새로운 도서가 추가되면 알려드릴게요.
            아이들의 성장을 응원하는 따뜻한 이야기를 기대해 주세요!
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow transition hover:bg-white/90"
          >
            ← 해밀이음 홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}
