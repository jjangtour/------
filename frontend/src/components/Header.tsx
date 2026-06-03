import Link from "next/link";

const menuItems = [
  { href: "/", label: "홈" },
  { href: "/student/select", label: "학생 선택" },
  { href: "/student/home", label: "학생 홈" },
  { href: "/mission/select", label: "미션 선택" },
  { href: "/emotion/check", label: "감정 기록" },
  { href: "/routine/check", label: "루틴 체크" },
  { href: "/teacher/dashboard", label: "교사 대시보드" },
  { href: "/parent/dashboard", label: "학부모 화면" },
  { href: "/admin/tools", label: "관리자" },
];

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-xl font-bold text-blue-700">
          해밀이음
        </Link>

        <nav className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600 md:justify-end">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-slate-50 px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}