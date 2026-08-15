import {
  MissionExecutionLog,
  MissionSkill,
  SKILL_METAS,
} from "@/types/learningMission";

const LEARNING_LOGS_KEY = "haemileum_learning_logs";
const RESULTS_KEY = "haemileum_results";

export function getSelectedStudentName(): string {
  if (typeof window === "undefined") return "김하늘";
  return localStorage.getItem("haemileum_selected_student") || "김하늘";
}

export function saveMissionExecutionLog(log: MissionExecutionLog): void {
  if (typeof window === "undefined") return;

  try {
    // 1. 상세 교육콘텐츠 로그 저장 (haemileum_learning_logs)
    const logsRaw = localStorage.getItem(LEARNING_LOGS_KEY) || "[]";
    const logs: MissionExecutionLog[] = JSON.parse(logsRaw);
    logs.push(log);
    localStorage.setItem(LEARNING_LOGS_KEY, JSON.stringify(logs));

    // 2. 기존 해밀이음 결과(haemileum_results) 호환 객체 저장 (기존 학생 홈 / 교사 대시보드 호환)
    const skillMeta = SKILL_METAS[log.skill];
    const resultsRaw = localStorage.getItem(RESULTS_KEY) || "[]";
    const results = JSON.parse(resultsRaw);

    const totalWrong = log.answer_history.reduce(
      (sum, step) => sum + (step.attemptCount > 1 ? step.attemptCount - 1 : 0),
      0
    );

    results.push({
      studentName: log.student_id,
      mission: `${skillMeta ? `[${skillMeta.shortName}] ` : ""}${log.mission_id}`,
      score: log.score,
      status: "완료",
      emotion: "안정",
      completedAt: log.completed_at,
      skill: log.skill,
      difficulty: log.difficulty,
      hintsUsed: log.hint_count,
      wrongAttempts: totalWrong,
      firstTryCorrect: log.is_first_try_correct,
      durationSeconds: log.duration_seconds,
      xpEarned: log.xp_earned,
    });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));

    // 3. 학생 경험치(XP) 가산
    const xpKey = `haemileum_student_xp_${log.student_id}`;
    const currentXp = parseInt(localStorage.getItem(xpKey) || "0", 10);
    const nextXp = currentXp + log.xp_earned;
    localStorage.setItem(xpKey, nextXp.toString());

    // 4. 전역 스토리지 이벤트 발생
    window.dispatchEvent(new Event("storage"));

    // 5. 백엔드 API 비동기 전송 시도
    fetch("/api/mission/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    }).catch((err) => {
      console.warn("미션 로그 API 비동기 저장 실패 (오프라인 모드 유지):", err);
    });
  } catch (err) {
    console.error("saveMissionExecutionLog 에러:", err);
  }
}

export function getLearningLogs(studentName?: string): MissionExecutionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEARNING_LOGS_KEY) || "[]";
    const logs: MissionExecutionLog[] = JSON.parse(raw);
    if (!studentName || studentName === "전체") return logs;
    return logs.filter((l) => l.student_id === studentName);
  } catch {
    return [];
  }
}

export interface SkillStat {
  skill: MissionSkill;
  name: string;
  shortName: string;
  icon: string;
  totalAttempts: number;
  completedCount: number;
  accuracyRate: number; // 0 ~ 100%
  firstTryRate: number; // 첫 시도 정답률 %
  totalHints: number;
  averageDuration: number;
}

export function getSkillStatistics(studentName?: string): Record<MissionSkill, SkillStat> {
  const logs = getLearningLogs(studentName);

  const skills: MissionSkill[] = [
    "key_info",
    "fact_opinion",
    "cause_effect",
    "social_context",
    "information_judgment",
    "claim_reason",
  ];

  const stats: Record<MissionSkill, SkillStat> = {} as any;

  skills.forEach((skillKey) => {
    const meta = SKILL_METAS[skillKey];
    const skillLogs = logs.filter((l) => l.skill === skillKey);

    const completedCount = skillLogs.length;
    const totalSteps = skillLogs.reduce(
      (sum, l) => sum + l.answer_history.length,
      0
    );
    const correctSteps = skillLogs.reduce(
      (sum, l) =>
        sum + l.answer_history.filter((s) => s.correct).length,
      0
    );
    const firstTryCount = skillLogs.filter((l) => l.is_first_try_correct).length;
    const totalHints = skillLogs.reduce((sum, l) => sum + l.hint_count, 0);
    const totalDuration = skillLogs.reduce(
      (sum, l) => sum + l.duration_seconds,
      0
    );

    const accuracyRate =
      totalSteps > 0 ? Math.round((correctSteps / totalSteps) * 100) : completedCount > 0 ? 80 : 0;
    const firstTryRate =
      completedCount > 0 ? Math.round((firstTryCount / completedCount) * 100) : 0;
    const averageDuration =
      completedCount > 0 ? Math.round(totalDuration / completedCount) : 0;

    stats[skillKey] = {
      skill: skillKey,
      name: meta.name,
      shortName: meta.shortName,
      icon: meta.icon,
      totalAttempts: totalSteps,
      completedCount,
      accuracyRate,
      firstTryRate,
      totalHints,
      averageDuration,
    };
  });

  return stats;
}
