import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  audiobooks,
  getBestAudiobooks,
  getAudiobooksByCuration,
  getAllCurationCategories,
} from '@/utils/audiobookData';
import AudiobookBanner from '@/components/audiobook/AudiobookBanner';
import AudiobookCard from '@/components/audiobook/AudiobookCard';
import CurationSection from '@/components/audiobook/CurationSection';
import './audiobook.css';

export const metadata: Metadata = {
  title: '오디오북 | 해밀이음',
  description: '아이들을 위한 따뜻한 오디오북을 들어보세요. 전문 성우가 읽어주는 동화와 학습 콘텐츠.',
};

export default function AudiobookMainPage() {
  const bestBooks = getBestAudiobooks();
  const curationCategories = getAllCurationCategories();

  // Emoji mapping for curation categories
  const emojiMap: Record<string, string> = {
    '감성 성장': '💚',
    '사회성 향상': '🤝',
    '학습 동기': '📖',
    '모험과 상상': '🚀',
  };

  // Best book for blur background
  const primaryBestBook = bestBooks[0] || audiobooks[0];

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Section 1: Hero Banner */}
      <AudiobookBanner />

      {/* Section 2: 오늘의 오디오북 (Welaaa MonthBook style) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 to-teal-900 px-4 py-12 text-white sm:px-6 sm:py-16">
        {/* Blur cover background */}
        {primaryBestBook && (
          <div
            className="audiobook-blur-bg"
            style={{ backgroundImage: `url(${primaryBestBook.coverImage})` }}
          />
        )}
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight sm:text-2xl">
              🎧 오늘의 오디오북
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-black text-emerald-300 ring-1 ring-emerald-400/30">
              인기 베스트
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
            {bestBooks.map((book) => (
              <Link
                key={book.id}
                href={`/audiobook/${book.id}`}
                className="group block"
              >
                {/* 120x173px Cover */}
                <div className="relative aspect-[120/173] w-full overflow-hidden rounded-xl bg-slate-800 shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:ring-emerald-400/40">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 150px, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black text-emerald-400">
                    ⏱️ {book.duration}
                  </div>
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/90 text-white opacity-0 shadow-md transition-all duration-300 scale-75 group-hover:opacity-100 group-hover:scale-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="line-clamp-1 text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="mt-1 truncate text-xs font-bold text-white/50">
                    {book.author} · 성우 {book.narrator}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Curation Sections */}
      <div className="bg-white">
        <div className="mx-auto max-w-6xl py-6">
          {curationCategories.map((category) => {
            const books = getAudiobooksByCuration(category);
            const emoji = emojiMap[category] || '📚';
            return (
              <CurationSection
                key={category}
                title={category}
                books={books}
                emoji={emoji}
              />
            );
          })}
        </div>
      </div>

      {/* Section 4: All Audiobooks Grid */}
      <section className="bg-stone-50 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
              전체 오디오북
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-400">
              해밀이음에 등록된 모든 오디오북 목록입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
            {audiobooks.map((book) => (
              <AudiobookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Bottom CTA */}
      <section className="mx-4 mt-12 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-700 px-6 py-12 text-center text-white shadow-xl sm:mx-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl shadow-inner animate-bounce">
            🎧
          </span>
          <h2 className="mt-6 text-2xl font-black sm:text-3xl">
            더 많은 오디오북이 준비되고 있어요
          </h2>
          <p className="mt-3 text-sm font-bold text-emerald-100 sm:text-base">
            아이들의 꿈과 희망을 키워줄 유익한 오디오 콘텐츠가 지속적으로 업데이트됩니다.
          </p>
          <div className="mt-8">
            <Link
              href="/student/home"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black text-emerald-800 shadow-lg transition hover:bg-emerald-50 active:scale-95"
            >
              홈으로 가기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
