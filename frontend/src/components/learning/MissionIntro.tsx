"use client";

import { LearningMission, SKILL_METAS, DIFFICULTY_LABELS } from "@/types/learningMission";
import AudioButton from "./AudioButton";

interface MissionIntroProps {
  mission: LearningMission;
  studentName: string;
  onStart: () => void;
}

export default function MissionIntro({
  mission,
  studentName,
  onStart,
}: MissionIntroProps) {
  const skillMeta = SKILL_METAS[mission.skill];
  const diffMeta = DIFFICULTY_LABELS[mission.difficulty];

  const introVoiceText = `오늘의 미션. ${mission.title}. ${mission.subtitle || ""}. ${studentName} 학생, 시작해 볼까요?`;

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg sm:p-10">
      {/* 상단 뱃지 및 카테고리 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${skillMeta.bgColor} ${skillMeta.textColor} ${skillMeta.borderColor}`}
          >
            {skillMeta.icon} {skillMeta.name}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-black border ${diffMeta.color}`}
          >
            {diffMeta.icon} {diffMeta.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">
          <span>⭐</span>
          <span>+{mission.xp} XP</span>
        </div>
      </div>

      {/* 미션 메인 소개 */}
      <div className="my-8 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-5xl shadow-inner ring-4 ring-emerald-100">
          {mission.icon}
        </div>

        <p className="mt-5 text-sm font-bold text-emerald-700">
          {studentName} 학생을 위한 오늘의 미션
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
          {mission.title}
        </h1>

        {mission.subtitle && (
          <p className="mt-3 text-base font-semibold text-slate-600">
            {mission.subtitle}
          </p>
        )}

        <div className="mt-5 flex justify-center">
          <AudioButton text={introVoiceText} label="미션 안내 듣기" size="md" />
        </div>
      </div>

      {/* 안내 카드 */}
      <div className="rounded-2xl bg-emerald-50/70 p-5 border border-emerald-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌱</span>
          <div>
            <p className="text-sm font-black text-emerald-950">
              천천히 살펴보고 골라보세요
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
              틀려도 괜찮아요. 힌트를 보거나 다시 도전하면 돼요!
            </p>
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <div className="mt-8">
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-2xl bg-emerald-700 py-4 text-xl font-black text-white shadow-md transition-all hover:bg-emerald-800 hover:shadow-lg active:scale-[0.98]"
        >
          미션 시작하기 🚀
        </button>
      </div>
    </div>
  );
}
