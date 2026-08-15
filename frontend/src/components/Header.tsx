"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubMenuItem {
  href: string;
  label: string;
  desc?: string;
  icon?: string;
  badge?: string;
}

interface MainCategory {
  id: string;
  label: string;
  icon: string;
  matchPrefixes: string[];
  subItems: SubMenuItem[];
}

const MENU_CATEGORIES: MainCategory[] = [
  {
    id: "student",
    label: "학생 공간",
    icon: "🏠",
    matchPrefixes: ["/student"],
    subItems: [
      { href: "/student/home", label: "학생 홈", icon: "🏡", desc: "나의 레벨과 추천 미션" },
      { href: "/student/select", label: "학생 선택", icon: "👤", desc: "학습할 학생 이름 변경" },
      { href: "/student/house", label: "우리집", icon: "🛋️", desc: "아이템 및 준비물 보관함" },
      { href: "/student/homecoming", label: "안심귀가", icon: "🚶", desc: "길 찾기 및 안전 귀가" },
    ],
  },
  {
    id: "learning",
    label: "학습·미션",
    icon: "🎯",
    matchPrefixes: ["/mission", "/simulation"],
    subItems: [
      { href: "/mission", label: "생활 국어 미션", icon: "🎯", desc: "6대 핵심 역량 교육콘텐츠", badge: "신규" },
      { href: "/mission/select", label: "마을 시뮬레이션", icon: "🗺️", desc: "장소별 가상 체험 활동" },
      { href: "/simulation/one-bite-writing", label: "한입글쓰기", icon: "✍️", desc: "말하면 글이 되는 마법 글쓰기" },
    ],
  },
  {
    id: "village",
    label: "생활마을",
    icon: "🏡",
    matchPrefixes: ["/village", "/workshop"],
    subItems: [
      { href: "/village", label: "해밀마을", icon: "🌳", desc: "2D/3D 인터랙티브 맵 탐험" },
      { href: "/workshop", label: "자립공방", icon: "🛠️", desc: "생활 도구 및 주머니 아이템" },
    ],
  },
  {
    id: "mind_library",
    label: "마음·도서관",
    icon: "📖",
    matchPrefixes: ["/emotion", "/routine", "/ebook", "/audiobook"],
    subItems: [
      { href: "/emotion/check", label: "마음 기록", icon: "😊", desc: "오늘의 감정 진단과 케어" },
      { href: "/routine/check", label: "생활 루틴", icon: "✓", desc: "하루 습관 실천 체크" },
      { href: "/ebook", label: "전자책 (이북)", icon: "📚", desc: "PDF 교재 및 도서 뷰어" },
      { href: "/audiobook", label: "오디오북", icon: "🎧", desc: "AI 음성으로 듣는 이야기" },
    ],
  },
  {
    id: "management",
    label: "교사·관리",
    icon: "👥",
    matchPrefixes: ["/teacher", "/parent", "/admin"],
    subItems: [
      { href: "/teacher/dashboard", label: "교사 대시보드", icon: "👨‍🏫", desc: "6대 역량 분석 및 학생 지도" },
      { href: "/parent/dashboard", label: "학부모 안심", icon: "👨‍👩‍👧", desc: "자녀 학습 및 귀가 현황" },
      { href: "/admin/tools", label: "시스템 관리", icon: "⚙️", desc: "데이터 및 플랫폼 설정" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // 현재 라우트에 해당하는 활성 대카테고리 자동 감지
  const activeCategoryId = useMemo(() => {
    for (const cat of MENU_CATEGORIES) {
      if (cat.matchPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return cat.id;
      }
    }
    return null;
  }, [pathname]);

  // 서브바에 노출할 현재 카테고리 (호버 우선, 없으면 현재 활성 카테고리)
  const currentNavCategory = useMemo(() => {
    const targetId = hoveredCategory || activeCategoryId;
    return MENU_CATEGORIES.find((c) => c.id === targetId) || null;
  }, [hoveredCategory, activeCategoryId]);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      onMouseLeave={() => setHoveredCategory(null)}
      className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur shadow-sm transition-all"
    >
      {/* ── 1. 메인 탑 네비게이션 바 ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* 로고 영역 (절대 줄바꿈/찌그러짐 방지 shrink-0 whitespace-nowrap) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-decoration-none group"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-md transition group-hover:scale-105 group-hover:bg-emerald-700">
            🌱
          </span>
          <div className="shrink-0 whitespace-nowrap">
            <span className="text-xl font-black tracking-tight text-emerald-800 group-hover:text-emerald-900">
              해밀이음
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              생활 교육 플랫폼
            </span>
          </div>
        </Link>

        {/* 데스크톱 대카테고리 탭 목록 (lg 이상) */}
        <nav className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
          {MENU_CATEGORIES.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const isHovered = hoveredCategory === cat.id;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                className="relative py-1"
              >
                <button
                  type="button"
                  onClick={() => setHoveredCategory((prev) => (prev === cat.id ? null : cat.id))}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-sm"
                      : isHovered
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-60">▼</span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* 모바일 햄버거 메뉴 버튼 (lg 미만) */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/mission"
            className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-900"
          >
            🎯 미션
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xl font-black"
            aria-label="전체 메뉴 열기"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ── 2. 데스크톱 동적 서브 네비게이션 바 (Sub-bar) ── */}
      {currentNavCategory && (
        <div className="hidden lg:block border-t border-slate-100 bg-slate-50/90 py-2.5 shadow-inner transition-all animate-fade-in">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <span>{currentNavCategory.icon}</span>
                <span>{currentNavCategory.label}</span>
              </span>
              <span className="text-slate-300">|</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentNavCategory.subItems.map((sub) => {
                const isCurrent = pathname === sub.href;

                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-emerald-600 text-white font-black shadow-sm"
                        : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80"
                    }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                    {sub.badge && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-amber-950">
                        {sub.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. 모바일 전체 메뉴 Drawer / Accordion ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            {MENU_CATEGORIES.map((cat) => {
              const isExpanded =
                mobileExpandedCat === cat.id ||
                (!mobileExpandedCat && activeCategoryId === cat.id);

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMobileExpandedCat((prev) => (prev === cat.id ? null : cat.id))
                    }
                    className="flex w-full items-center justify-between p-4 text-left font-black text-slate-800 bg-white"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-3 grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50">
                      {cat.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center justify-between rounded-xl p-3 text-sm font-bold transition-all ${
                              isSubActive
                                ? "bg-emerald-700 text-white font-black shadow-sm"
                                : "bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{sub.icon}</span>
                              <div>
                                <p className="leading-tight">{sub.label}</p>
                                {sub.desc && (
                                  <p
                                    className={`text-[11px] font-normal leading-tight mt-0.5 ${
                                      isSubActive ? "text-emerald-100" : "text-slate-400"
                                    }`}
                                  >
                                    {sub.desc}
                                  </p>
                                )}
                              </div>
                            </div>
                            {sub.badge && (
                              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
