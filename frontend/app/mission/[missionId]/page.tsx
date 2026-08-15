"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { getMissionById } from "@/data/missions";
import MissionPlayer from "@/components/learning/MissionPlayer";

interface MissionPlayerPageProps {
  params: Promise<{
    missionId: string;
  }>;
}

export default function MissionPlayerPage({ params }: MissionPlayerPageProps) {
  const resolvedParams = use(params);
  const missionId = resolvedParams.missionId;

  const mission = useMemo(() => {
    return getMissionById(missionId);
  }, [missionId]);

  if (!mission) {
    return (
      <main className="min-h-screen bg-[#eef6f0] px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <span className="text-5xl">🔍</span>
          <h1 className="mt-4 text-2xl font-black text-slate-800">
            미션을 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            선택하신 미션 번호({missionId})가 존재하지 않거나 준비 중입니다.
          </p>
          <div className="mt-6">
            <Link
              href="/mission"
              className="inline-block rounded-2xl bg-emerald-700 px-6 py-3 text-base font-black text-white shadow-md hover:bg-emerald-800"
            >
              미션 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef6f0] py-4 sm:py-8">
      <MissionPlayer mission={mission} />
    </main>
  );
}
