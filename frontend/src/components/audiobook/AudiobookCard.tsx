import Link from 'next/link';
import Image from 'next/image';
import { AudiobookData } from '@/utils/audiobookData';

interface AudiobookCardProps {
  book: AudiobookData;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export default function AudiobookCard({ book }: AudiobookCardProps) {
  return (
    <Link
      href={`/audiobook/${book.id}`}
      className="audiobook-card group block w-40 shrink-0 sm:w-44"
    >
      {/* Cover */}
      <div className="audiobook-card-cover relative aspect-[3/4] w-full overflow-hidden rounded-xl shadow-md ring-1 ring-slate-200 transition-all group-hover:shadow-xl group-hover:ring-emerald-300">
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 160px, 176px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Play overlay on hover */}
        <div className="audiobook-play-overlay absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-emerald-700 opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
          🎧 {formatDuration(book.totalSeconds)}
        </div>

        {/* Best badge */}
        {book.isBest && (
          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm shadow-md">
            👑
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <h4 className="line-clamp-2 text-sm font-black leading-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
          {book.title}
        </h4>
        <p className="mt-1 truncate text-xs font-bold text-slate-400">
          {book.author} · 🎙️ {book.narrator}
        </p>
      </div>
    </Link>
  );
}
