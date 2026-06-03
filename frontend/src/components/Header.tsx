import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-blue-700">
          해밀이음
        </Link>

        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-blue-700">
            홈
          </Link>
          <Link href="/student/select" className="hover:text-blue-700">
            학생 선택
          </Link>
          <Link href="/mission/select" className="hover:text-blue-700">
            미션 선택
          </Link>
          <Link href="/teacher/dashboard" className="hover:text-blue-700">
            교사 대시보드
          </Link>
          <Link href="/parent/dashboard" className="hover:text-blue-700">
            학부모 화면
          </Link>
        </nav>
      </div>
    </header>
  );
}