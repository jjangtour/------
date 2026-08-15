export type MissionSkill =
  | "key_info"              // ① 중요한 정보 찾기
  | "fact_opinion"          // ② 사실과 의견 구별하기
  | "cause_effect"          // ③ 원인과 결과 파악하기
  | "social_context"        // ④ 마음과 상황 읽기
  | "information_judgment"  // ⑤ 생활정보 판단하기
  | "claim_reason";         // ⑥ 생각과 이유 말하기

export type MissionDifficulty = 1 | 2 | 3; // 1: 🌱 시작, 2: 🌿 도전, 3: 🌳 성장

export type LifeArea =
  | "school"         // 학교
  | "transport"      // 교통/이동
  | "shopping"       // 쇼핑/주문
  | "communication"  // 대화/소통
  | "safety"         // 안전
  | "digital";       // 디지털

export interface MissionChoice {
  id: string;
  text: string;
  image?: string;
  icon?: string;
  correct: boolean;
  reason?: string;
}

export interface MissionStepData {
  stepId: string;
  title?: string;
  sceneText: string;
  sceneImage?: string;
  sceneIcon?: string;
  sceneSpeaker?: string;
  question: string;
  choices: MissionChoice[];
  hint?: string;
  correctFeedback: string;
  wrongFeedback: string;
}

export interface LearningMission {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  skill: MissionSkill;
  difficulty: MissionDifficulty;
  gradeBand?: string; // 내부 관리용 (예: "3-4", "5-6")
  lifeArea: LifeArea;
  location?: string;  // 연계 장소 (예: "bus_stop", "school", "convenience", "atm")
  xp: number;         // 획득 기본 경험치
  steps: MissionStepData[]; // STEP 2~6 (문제 1 + 한번 더 문제 등)
  takeaway: string;   // 오늘 배운 것 요약 문장
  curriculum?: {
    grade?: number;
    subject?: string;
    unit?: string;
    competency?: string;
  };
  requiredItemId?: string; // 아이템 주머니 연동 가능성 확보
}

export interface StepAnswerLog {
  stepId: string;
  chosenChoiceId: string;
  chosenText: string;
  correct: boolean;
  attemptCount: number;
  hintUsed: boolean;
}

export interface MissionExecutionLog {
  student_id: string;
  mission_id: string;
  skill: MissionSkill;
  difficulty: MissionDifficulty;
  answer_history: StepAnswerLog[];
  is_first_try_correct: boolean;
  attempt_count: number;
  hint_count: number;
  duration_seconds: number;
  score: number;
  xp_earned: number;
  completed_at: string;
  completion_status: "completed" | "in_progress";
}

export interface SkillMeta {
  id: MissionSkill;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const SKILL_METAS: Record<MissionSkill, SkillMeta> = {
  key_info: {
    id: "key_info",
    name: "중요한 정보 찾기",
    shortName: "정보 찾기",
    description: "생활 안내와 표지판에서 꼭 필요한 정보를 찾아요.",
    icon: "🔍",
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
  },
  fact_opinion: {
    id: "fact_opinion",
    name: "사실과 의견 구별하기",
    shortName: "사실·의견",
    description: "실제 일어난 사실과 개인의 생각을 구별해요.",
    icon: "⚖️",
    color: "sky",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    textColor: "text-sky-800",
  },
  cause_effect: {
    id: "cause_effect",
    name: "원인과 결과 파악하기",
    shortName: "원인·결과",
    description: "어떤 일이 왜 일어났고 어떤 일이 생겼는지 연결해요.",
    icon: "💡",
    color: "emerald",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-800",
  },
  social_context: {
    id: "social_context",
    name: "마음과 상황 읽기",
    shortName: "마음 읽기",
    description: "말과 표정, 상황을 함께 보고 상대방의 마음을 이해해요.",
    icon: "💖",
    color: "rose",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    textColor: "text-rose-800",
  },
  information_judgment: {
    id: "information_judgment",
    name: "생활정보 판단하기",
    shortName: "정보 판단",
    description: "문자, 광고, 안내문을 보고 안전한 행동을 판단해요.",
    icon: "🛡️",
    color: "teal",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
  },
  claim_reason: {
    id: "claim_reason",
    name: "생각과 이유 말하기",
    shortName: "생각·이유",
    description: "나의 생각을 말하고 알맞은 까닭을 설명해요.",
    icon: "🗣️",
    color: "violet",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-800",
  },
};

export const DIFFICULTY_LABELS: Record<MissionDifficulty, { label: string; icon: string; color: string }> = {
  1: { label: "시작", icon: "🌱", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  2: { label: "도전", icon: "🌿", color: "bg-blue-100 text-blue-800 border-blue-300" },
  3: { label: "성장", icon: "🌳", color: "bg-purple-100 text-purple-800 border-purple-300" },
};
