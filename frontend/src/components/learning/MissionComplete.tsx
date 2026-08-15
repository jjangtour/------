"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { LearningMission, SKILL_METAS } from "@/types/learningMission";
import { getLevelInfo } from "@/utils/level";
import AudioButton from "./AudioButton";

interface MissionCompleteProps {
  mission: LearningMission;
  studentName: string;
  earnedXp: number;
  totalAttempts: number;
  hintsUsed: number;
  onRestart: () => void;
}

export default function MissionComplete({
  mission,
  studentName,
  earnedXp,
  totalAttempts,
  hintsUsed,
  onRestart,
}: MissionCompleteProps) {
  const skillMeta = SKILL_METAS[mission.skill];

  const studentTotalXp = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(
      localStorage.getItem(`haemileum_student_xp_${studentName}`) || "0",
      10
    );
  }, [studentName]);

  const levelInfo = useMemo(
    () => getLevelInfo(studentTotalXp),
    [studentTotalXp]
  );

  const completeVoiceText = `축하합니다! ${studentName} 학생, ${mission.title} 미션을 완료했습니다. 오늘 배운 것: ${mission.takeaway}`;

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl sm:p-10 text-center animate-fade-in">
      {/* 축하 뱃지 */}
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-6xl shadow-inner ring-4 ring-emerald-200">
        🎉
      </div>

      <p className="mt-6 text-sm font-bold text-emerald-700">미션 완료!</p>

      <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
        참 잘했어요, {studentName} 학생!
      </h1>

      <p className="mt-2 text-base font-semibold text-slate-600">
        생활에서 필요한 중요한 능력을 멋지게 연습했어요.
      </p>

      <div className="mt-4 flex justify-center">
        <AudioButton text={completeVoiceText} label="완료 축하 듣기" size="md" autoPlay={true} />
      </div>

      {/* 오늘 배운 것 (Takeaway) 카드 */}
      <div className="my-8 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-green-50 p-6 text-left shadow-sm">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
          <span>✨</span>
          <span>오늘 배운 중요한 생활 약속</span>
        </div>
        <p className="mt-3 text-2xl font-black leading-snug text-emerald-950 sm:text-3xl">
          "{mission.takeaway}"
        </p>
      </div>

      {/* 보상 및 성취 카드 */}
      <div className="grid grid-cols-2 gap-3.5 mb-8">
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-center">
          <p className="text-xs font-bold text-amber-800">획득 경험치</p>
          <p className="mt-1 text-2xl font-black text-amber-950">
            +{earnedXp} XP
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-center">
          <p className="text-xs font-bold text-emerald-800">나의 이음 레벨</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">
            {levelInfo.badge} {levelInfo.title}
          </p>
        </div>
      </div>

      {/* 네비게이션 액션 버튼 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-4 text-base font-black text-slate-700 hover:bg-slate-50 transition active:scale-95"
        >
          한 번 더 연습하기 ↺
        </button>

        <Link
          href="/mission"
          className="flex-1 rounded-2xl bg-emerald-700 py-4 text-base font-black text-white shadow-md hover:bg-emerald-800 transition active:scale-95 flex items-center justify-center"
        >
          다른 미션 고르기 🎯
        </Link>
      </div>

      <div className="mt-4">
        <Link
          href="/student/home"
          className="text-sm font-bold text-slate-500 hover:text-emerald-700 underline"
        >
          학생 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
