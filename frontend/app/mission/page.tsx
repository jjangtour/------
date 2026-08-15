"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_LEARNING_MISSIONS,
  keyInfoMission,
  factOpinionMission,
  causeEffectMission,
  socialContextMission,
  informationJudgmentMission,
  claimReasonMission,
} from "@/data/missions";
import {
  MissionSkill,
  MissionDifficulty,
  SKILL_METAS,
  DIFFICULTY_LABELS,
} from "@/types/learningMission";
import { getLevelInfo } from "@/utils/level";

const subscribeToStorage = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getSelectedStudent = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("haemileum_selected_student") || "김하늘"
    : "김하늘";

const getSelectedStudentXp = () => {
  if (typeof window === "undefined") return 0;
  const name = localStorage.getItem("haemileum_selected_student") || "김하늘";
  return parseInt(
    localStorage.getItem(`haemileum_student_xp_${name}`) || "0",
    10
  );
};

export default function MissionListPage() {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<MissionSkill | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    MissionDifficulty | "all"
  >("all");

  const studentName = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudent,
    () => "김하늘"
  );
  const totalXp = useSyncExternalStore(
    subscribeToStorage,
    getSelectedStudentXp,
    () => 0
  );
  const levelInfo = useMemo(() => getLevelInfo(totalXp), [totalXp]);

  const filteredMissions = useMemo(() => {
    return ALL_LEARNING_MISSIONS.filter((m) => {
      if (selectedSkill !== "all" && m.skill !== selectedSkill) return false;
      if (
        selectedDifficulty !== "all" &&
        m.difficulty !== selectedDifficulty
      )
        return false;
      return true;
    });
  }, [selectedSkill, selectedDifficulty]);

  const skillKeys: MissionSkill[] = [
    "key_info",
    "fact_opinion",
    "cause_effect",
    "social_context",
    "information_judgment",
    "claim_reason",
  ];

  return (
    <main className="min-h-screen bg-[#eef6f0] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        {/* 상단 대형 배너 헤더 */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 px-7 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/80 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-white/20">
                  <span>🎯</span> 생활 국어 교육콘텐츠
                </span>
                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                  {studentName} 학생,
                  <br />
                  오늘의 생활 미션을 골라봐요!
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold text-emerald-100">
                  교과서의 핵심 내용을 실생활 상황에서 짧고 재미있게 연습해요.
                </p>
              </div>

              {/* 레벨 & XP 위젯 */}
              <div className="rounded-3xl bg-white/15 px-7 py-5 text-center ring-1 ring-white/25 backdrop-blur-sm">
                <p className="text-xs font-bold text-emerald-200">나의 이음 레벨</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {levelInfo.badge} {levelInfo.title}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">
                  {levelInfo.totalXp} XP
                </p>
              </div>
            </div>
          </div>

          {/* 서브 네비게이션 툴바 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-7 py-4 sm:px-10 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-600">
              6개 핵심 영역 중 원하는 미션을 선택하세요
            </p>
            <div className="flex gap-2">
              <Link
                href="/mission/select"
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-50 transition"
              >
                🗺️ 생활마을 장소별 시뮬레이션
              </Link>
              <Link
                href="/student/home"
                className="rounded-xl bg-slate-200/80 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-300 transition"
              >
                학생 홈
              </Link>
            </div>
          </div>
        </div>

        {/* 6대 핵심 영역 필터 버튼 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-slate-600">
              핵심 학습 영역 고르기
            </h2>
            {selectedSkill !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedSkill("all")}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                전체 영역 보기
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
            <button
              type="button"
              onClick={() => setSelectedSkill("all")}
              className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-black transition-all shadow-sm active:scale-95 ${
                selectedSkill === "all"
                  ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🌈</span>
              <span>전체 ({ALL_LEARNING_MISSIONS.length})</span>
            </button>

            {skillKeys.map((skillKey) => {
              const meta = SKILL_METAS[skillKey];
              const isSelected = selectedSkill === skillKey;
              return (
                <button
                  key={skillKey}
                  type="button"
                  onClick={() => setSelectedSkill(skillKey)}
                  className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 border ${
                    isSelected
                      ? `${meta.bgColor} ${meta.textColor} ${meta.borderColor} ring-2 ring-emerald-500 shadow-md`
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 난이도 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-bold text-slate-500 mr-2">난이도:</span>
          {(["all", 1, 2, 3] as const).map((diff) => {
            const isSelected = selectedDifficulty === diff;
            const label =
              diff === "all"
                ? "전체 난이도"
                : `${DIFFICULTY_LABELS[diff].icon} ${DIFFICULTY_LABELS[diff].label}`;

            return (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`rounded-full px-3 py-1 text-xs font-black transition-all ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 미션 카드 그리드 목록 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMissions.map((mission) => {
            const skillMeta = SKILL_METAS[mission.skill];
            const diffMeta = DIFFICULTY_LABELS[mission.difficulty];

            return (
              <div
                key={mission.id}
                className="group flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-400 hover:shadow-lg"
              >
                <div>
                  {/* 상단 뱃지 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${skillMeta.bgColor} ${skillMeta.textColor} ${skillMeta.borderColor}`}
                    >
                      {skillMeta.icon} {skillMeta.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-black border ${diffMeta.color}`}
                    >
                      {diffMeta.icon} {diffMeta.label}
                    </span>
                  </div>

                  {/* 미션 제목 및 설명 */}
                  <div className="flex items-start gap-4 mb-3">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl shadow-inner group-hover:scale-105 transition-transform">
                      {mission.icon}
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {mission.title}
                      </h3>
                      {mission.subtitle && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {mission.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 미션 단계 및 배움 목표 요약 */}
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500">배울 내용</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 leading-snug">
                      "{mission.takeaway}"
                    </p>
                  </div>
                </div>

                {/* 하단 버튼 및 보상 */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <span>⭐</span>
                    <span>+{mission.xp} XP</span>
                  </div>

                  <Link
                    href={`/mission/${mission.id}`}
                    className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-95"
                  >
                    미션 시작하기 ➔
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 도움말 안내 카드 */}
        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🌱</span>
            <div>
              <h4 className="text-base font-black text-amber-950">
                언제든 다시 연습할 수 있어요
              </h4>
              <p className="mt-1 text-sm font-semibold text-amber-900 leading-relaxed">
                해밀이음 교육콘텐츠는 틀려도 벌점이나 실패가 없습니다.
                음성으로 다시 듣고 힌트를 보며 천천히 나의 생각을 키워보세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
