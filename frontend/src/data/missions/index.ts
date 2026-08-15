import { LearningMission, MissionSkill, MissionDifficulty } from "@/types/learningMission";
import { keyInfoMission, keyInfoMission2, keyInfoMission3 } from "./keyInfo";
import { factOpinionMission, factOpinionMission2, factOpinionMission3 } from "./factOpinion";
import { causeEffectMission, causeEffectMission2, causeEffectMission3 } from "./causeEffect";
import { socialContextMission, socialContextMission2, socialContextMission3 } from "./socialContext";
import { informationJudgmentMission, informationJudgmentMission2, informationJudgmentMission3 } from "./informationJudgment";
import { claimReasonMission, claimReasonMission2, claimReasonMission3 } from "./claimReason";

// 총 18개 미션 (6개 핵심 영역 × 3단계 난이도 🌱🌿🌳)
export const ALL_LEARNING_MISSIONS: LearningMission[] = [
  // 1. 중요한 정보 찾기 (key_info)
  keyInfoMission,             // M01-1 [🌱 시작] 버스 번호와 도착 시간
  keyInfoMission2,            // M01-2 [🌿 도전] 마트 가격표와 유통기한
  keyInfoMission3,            // M01-3 [🌳 성장] 기차표와 타는 곳

  // 2. 사실과 의견 구별하기 (fact_opinion)
  factOpinionMission,         // M02-1 [🌱 시작] 버스 도착 시간(사실) vs 멋지다(생각)
  factOpinionMission2,        // M02-2 [🌿 도전] 식당 메뉴판(사실) vs 손님 리뷰(생각)
  factOpinionMission3,        // M02-3 [🌳 성장] 도서관 규칙(사실) vs 표어(주장)

  // 3. 원인과 결과 파악하기 (cause_effect)
  causeEffectMission,         // M03-1 [🌱 시작] 버스 놓친 까닭(지각)
  causeEffectMission2,        // M03-2 [🌿 도전] 키오스크 카드 결제 오류 원인
  causeEffectMission3,        // M03-3 [🌳 성장] 분리수거 원인과 환경 결과

  // 4. 마음과 상황 읽기 (social_context)
  socialContextMission,       // M04-1 [🌱 시작] 친구 슬픈 표정 읽기 및 공감
  socialContextMission2,      // M04-2 [🌿 도전] 모둠 활동 역할 배려 제안
  socialContextMission3,      // M04-3 [🌳 성장] 실수로 부딪혔을 때 진심 어린 사과

  // 5. 생활정보 판단하기 (information_judgment)
  informationJudgmentMission, // M05-1 [🌱 시작] 수상한 택배/이벤트 문자(스미싱)
  informationJudgmentMission2,// M05-2 [🌿 도전] 약 봉투 복용법과 보관법 확인
  informationJudgmentMission3,// M05-3 [🌳 성장] 인터넷 과장 광고 및 허위 정보 판별

  // 6. 생각과 이유 말하기 (claim_reason)
  claimReasonMission,         // M06-1 [🌱 시작] 복도 안전 주장과 알맞은 까닭
  claimReasonMission2,        // M06-2 [🌿 도전] 텀블러 사용 주장과 환경 보호 이유
  claimReasonMission3,        // M06-3 [🌳 성장] 온라인 채팅 존댓말 주장과 배려 근거
];

export function getMissionById(missionId: string): LearningMission | undefined {
  return ALL_LEARNING_MISSIONS.find((m) => m.id === missionId);
}

export function getMissionsBySkill(skill: MissionSkill): LearningMission[] {
  return ALL_LEARNING_MISSIONS.filter((m) => m.skill === skill);
}

export function getMissionsByDifficulty(difficulty: MissionDifficulty): LearningMission[] {
  return ALL_LEARNING_MISSIONS.filter((m) => m.difficulty === difficulty);
}

export function getMissionsByLocation(location: string): LearningMission[] {
  return ALL_LEARNING_MISSIONS.filter((m) => m.location === location);
}

export {
  keyInfoMission,
  keyInfoMission2,
  keyInfoMission3,
  factOpinionMission,
  factOpinionMission2,
  factOpinionMission3,
  causeEffectMission,
  causeEffectMission2,
  causeEffectMission3,
  socialContextMission,
  socialContextMission2,
  socialContextMission3,
  informationJudgmentMission,
  informationJudgmentMission2,
  informationJudgmentMission3,
  claimReasonMission,
  claimReasonMission2,
  claimReasonMission3,
};
