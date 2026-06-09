"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SafeReturnRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/homecoming");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center">
      <div className="text-emerald-600 font-bold animate-pulse text-lg">
        안심귀가 화면으로 이동하는 중...
      </div>
    </div>
  );
}
