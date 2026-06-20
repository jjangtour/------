'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getBookById } from '@/utils/ebookData';
import '../../ebook.css';

export default function EbookReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const book = getBookById(id);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const touchStartRef = useRef(0);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load PDF.js and document
  useEffect(() => {
    if (!book) return;

    let cancelled = false;

    async function loadPdf() {
      try {
        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source to local file
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({
          url: book!.pdfPath,
          disableAutoFetch: false,
          disableStream: false,
        });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('PDF load error:', err);
        setError(
          'PDF 파일을 불러올 수 없습니다. 파일이 존재하는지 확인해 주세요.'
        );
        setIsLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [book]);

  // Render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      const pdf = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        // pdfjs v4: render() returns RenderTask with .promise
        if (renderTask.promise) {
          await renderTask.promise;
        } else {
          await renderTask;
        }
      } catch (err) {
        console.error('Page render error:', err);
      }
    },
    [scale]
  );

  useEffect(() => {
    if (!isLoading && !error && totalPages > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, isLoading, error, totalPages, renderPage]);

  // Navigation
  const goNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  }, [currentPage, totalPages]);

  const goPrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  }, [currentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block copy/save/print
      if (
        e.ctrlKey &&
        ['c', 's', 'p', 'a', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        return;
      }
      // Block Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return;
      }
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }

      // Navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNextPage();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrevPage();
      }
      // Zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((s) => Math.min(s + 0.2, 3));
      }
      if (e.key === '-') {
        e.preventDefault();
        setScale((s) => Math.max(s - 0.2, 0.5));
      }
      // Escape fullscreen
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNextPage, goPrevPage]);

  // Block right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Touch swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      diff > 0 ? goNextPage() : goPrevPage();
    }
  };

  // Auto-hide controls
  const showControlsBriefly = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        /* ignore */
      }
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!book) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <span className="text-6xl">📚</span>
          <h1 className="mt-4 text-2xl font-black text-white">
            도서를 찾을 수 없습니다
          </h1>
          <Link
            href="/ebook"
            className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            ← 도서 목록으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pdf-secure-container relative flex min-h-screen flex-col bg-slate-950"
      onMouseMove={showControlsBriefly}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 flex items-center justify-between bg-slate-900/95 px-4 py-3 backdrop-blur transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/ebook/${book.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            ←
          </Link>
          <div>
            <h1 className="text-sm font-black text-white line-clamp-1">
              {book.title}
            </h1>
            <p className="text-xs font-bold text-white/50">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white transition hover:bg-white/20"
            title="축소"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-xs font-bold text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white transition hover:bg-white/20"
            title="확대"
          >
            +
          </button>

          <div className="mx-2 h-6 w-px bg-white/10" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm text-white transition hover:bg-white/20"
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
          >
            {isFullscreen ? '⊠' : '⊞'}
          </button>
        </div>
      </header>

      {/* ── Canvas Area ───────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {isLoading ? (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-white/60">
              PDF를 불러오는 중...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md text-center">
            <span className="text-5xl">📄</span>
            <h2 className="mt-4 text-xl font-black text-white">
              PDF를 불러올 수 없습니다
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/50">{error}</p>
            <p className="mt-4 text-xs font-semibold text-white/30">
              PDF 파일을{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-400">
                public{book.pdfPath}
              </code>{' '}
              경로에 넣어주세요.
            </p>
            <Link
              href={`/ebook/${book.id}`}
              className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              ← 도서 상세로
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Page navigation areas - click to turn */}
            <div
              className="absolute left-0 top-0 z-10 h-full w-1/3 cursor-pointer"
              onClick={goPrevPage}
            />
            <div
              className="absolute right-0 top-0 z-10 h-full w-1/3 cursor-pointer"
              onClick={goNextPage}
            />

            <canvas
              ref={canvasRef}
              className="mx-auto rounded-lg shadow-2xl"
              style={{
                maxHeight: 'calc(100vh - 140px)',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom Bar ────────────────────────────────────────────── */}
      <footer
        className={`sticky bottom-0 z-50 flex items-center justify-between bg-slate-900/95 px-4 py-3 backdrop-blur transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrevPage}
            disabled={currentPage <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) setCurrentPage(page);
              }}
              className="w-14 rounded-lg bg-white/10 px-2 py-1.5 text-center text-sm font-bold text-white outline-none ring-1 ring-white/10 focus:ring-emerald-500"
            />
            <span className="text-sm font-bold text-white/50">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={goNextPage}
            disabled={currentPage >= totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
          >
            ›
          </button>
        </div>

        {/* Progress bar */}
        <div className="hidden flex-1 px-6 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{
                width: totalPages
                  ? `${(currentPage / totalPages) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Security notice */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <span className="text-xs font-bold text-white/30">🔒 보안 열람</span>
        </div>
      </footer>

      {/* Security watermark overlay */}
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center opacity-[0.02]">
        <p className="rotate-[-30deg] text-6xl font-black text-white select-none">
          해밀이음
        </p>
      </div>
    </div>
  );
}
