import Link from "next/link";

const menuItems = [
  { href: "/student/select", label: "학생 선택" },
  { href: "/student/home", label: "학생 홈" },
  { href: "/student/homecoming", label: "안심귀가" },
  { href: "/student/house", label: "우리집" },
  { href: "/village", label: "마을" },
  { href: "/mission/select", label: "미션" },
  { href: "/emotion/check", label: "마음 기록" },
  { href: "/routine/check", label: "루틴" },
  { href: "/teacher/dashboard", label: "교사" },
  { href: "/parent/dashboard", label: "학부모" },
  { href: "/admin/tools", label: "관리" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="text-xl font-black text-emerald-700">
          해밀이음
        </Link>

        <nav className="flex flex-nowrap gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm font-bold text-slate-600 lg:justify-end lg:overflow-visible lg:pb-0">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-slate-50 px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
