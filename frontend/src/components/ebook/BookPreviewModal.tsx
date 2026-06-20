'use client';

import { useState, useEffect } from 'react';
import type { BookData } from '@/utils/ebookData';

interface BookPreviewModalProps {
  book: BookData;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'copyright' | 'intro' | 'author' | 'toc';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'copyright', label: '판권지', icon: '📜' },
  { key: 'intro', label: '책 소개', icon: '📖' },
  { key: 'author', label: '저자 소개', icon: '✍️' },
  { key: 'toc', label: '목차', icon: '📋' },
];

export default function BookPreviewModal({
  book,
  isOpen,
  onClose,
}: BookPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('copyright');
  const [isClosing, setIsClosing] = useState(false);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('copyright');
      setIsClosing(false);
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${
        isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl ${
          isClosing ? 'modal-content-exit' : 'modal-content-enter'
        }`}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="닫기"
          >
            ✕
          </button>
          <h3 className="text-xl font-black text-white pr-10">{book.title}</h3>
          <p className="mt-1 text-sm font-bold text-white/70">
            {book.author} · {book.publisher}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 px-3 py-3.5 text-center text-xs font-black transition sm:text-sm ${
                  activeTab === tab.key
                    ? 'text-emerald-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <span className="ebook-tab-indicator absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto ebook-scroll p-6" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {activeTab === 'copyright' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 ring-1 ring-amber-200">
                <h4 className="text-lg font-black text-amber-900">📜 판권지</h4>
                <div className="mt-4 space-y-3">
                  <InfoRow label="도서명" value={book.title} />
                  {book.subtitle && (
                    <InfoRow label="부제" value={book.subtitle} />
                  )}
                  <InfoRow label="저자" value={book.author} />
                  <InfoRow label="출판사" value={book.copyrightInfo.publisher} />
                  <InfoRow label="발행일" value={book.copyrightInfo.publishDate} />
                  <InfoRow label="ISBN" value={book.copyrightInfo.isbn} />
                  <InfoRow label="주소" value={book.copyrightInfo.address} />
                  <InfoRow label="연락처" value={book.copyrightInfo.contact} />
                </div>
                <div className="mt-5 rounded-xl bg-white/60 p-4">
                  <p className="text-xs font-bold text-amber-700 leading-5">
                    {book.copyrightInfo.copyright}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-amber-600/80">
                    {book.copyrightInfo.note}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intro' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 ring-1 ring-emerald-200">
                <h4 className="text-lg font-black text-emerald-900">📖 책 소개</h4>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
                  {book.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon="📚" label="분량" value={`${book.pages}쪽`} />
                <StatCard icon="🎯" label="대상 연령" value={book.targetAge} />
                <StatCard icon="📂" label="분류" value={book.category} />
              </div>
            </div>
          )}

          {activeTab === 'author' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 ring-1 ring-purple-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-3xl shadow-lg">
                    ✍️
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-purple-900">
                      {book.author}
                    </h4>
                    <p className="mt-0.5 text-xs font-bold text-purple-500">
                      글/그림 작가
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
                  {book.authorBio}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <h5 className="text-sm font-black text-slate-700">대표 작품</h5>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  《{book.title}》 ({book.publisher}, {book.publishDate})
                </p>
              </div>
            </div>
          )}

          {activeTab === 'toc' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-6 ring-1 ring-sky-200">
                <h4 className="text-lg font-black text-sky-900">📋 목차</h4>
                <div className="mt-4 space-y-2">
                  {book.chapters.map((ch, idx) => (
                    <div
                      key={ch.number}
                      className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 ring-1 ring-sky-100 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-xs font-black text-sky-700">
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
              <p className="text-center text-xs font-bold text-slate-400">
                총 {book.pages}페이지 · {book.chapters.length}개 챕터
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-16 text-xs font-black text-amber-700">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}
