import Link from 'next/link';
import { AudiobookData } from '@/utils/audiobookData';
import AudiobookCard from './AudiobookCard';

interface CurationSectionProps {
  title: string;
  books: AudiobookData[];
  emoji?: string;
}

export default function CurationSection({
  title,
  books,
  emoji,
}: CurationSectionProps) {
  if (books.length === 0) return null;

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6">
        <h3 className="text-lg font-black text-slate-900 sm:text-xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h3>
        <Link
          href="/audiobook"
          className="text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
        >
          더보기 →
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="curation-scroll mt-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {books.map((book) => (
          <div
            key={book.id}
            className="curation-scroll-item"
            style={{ scrollSnapAlign: 'start' }}
          >
            <AudiobookCard book={book} />
          </div>
        ))}
      </div>
    </section>
  );
}
