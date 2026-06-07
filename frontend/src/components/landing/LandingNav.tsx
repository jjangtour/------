'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const navItems = [
  { label: '해밀이음 소개', href: '#solution' },
  { label: '생활 미션', href: '#missions' },
  { label: '교사용 도구', href: '#teacher' },
  { label: '가정 연계', href: '#parent' },
  { label: '문의하기', href: '#contact' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-sm backdrop-blur-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a
          href="#hero"
          className={`text-xl font-black transition-colors ${scrolled ? 'text-emerald-700' : 'text-white'}`}
        >
          해밀이음
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-bold transition-colors hover:text-emerald-500 ${
                scrolled ? 'text-slate-600' : 'text-white/80'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/select"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow hover:bg-emerald-700 transition-colors"
          >
            체험하기
          </Link>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex flex-col gap-1 md:hidden ${scrolled ? 'text-slate-700' : 'text-white'}`}
            aria-label="메뉴 열기"
          >
            <span className="h-0.5 w-5 bg-current"></span>
            <span className="h-0.5 w-5 bg-current"></span>
            <span className="h-0.5 w-5 bg-current"></span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white/98 px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-base font-bold text-slate-700 hover:text-emerald-700"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
