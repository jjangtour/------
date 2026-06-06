import Link from "next/link";

const menuItems = [
  { href: "/student/select", label: "학생 선택" },
  { href: "/student/home", label: "학생 홈" },
  { href: "/student/house", label: "우리집" },
  { href: "/simulation/town", label: "마을" },
  { href: "/mission/select", label: "미션" },
  { href: "/emotion/check", label: "마음 기록" },
  { href: "/routine/check", label: "루틴" },
  { href: "/teacher/dashboard", label: "교사" },
  { href: "/parent/dashboard", label: "학부모" },
  { href: "/admin/tools", label: "관리" },
];

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="text-xl font-black text-emerald-700">
          해밀이음
        </Link>

        <nav className="flex flex-wrap gap-2 text-sm font-bold text-slate-600 lg:justify-end">
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
