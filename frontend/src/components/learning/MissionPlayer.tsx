"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LearningMission,
  MissionChoice,
  MissionExecutionLog,
  StepAnswerLog,
  SKILL_METAS,
} from "@/types/learningMission";
import { saveMissionExecutionLog, getSelectedStudentName } from "@/utils/mission/storage";
import { stopTtsAudio } from "@/utils/mission/tts";

import MissionIntro from "./MissionIntro";
import SceneCard from "./SceneCard";
import QuestionCard from "./QuestionCard";
import ChoiceCard from "./ChoiceCard";
import HintButton from "./HintButton";
import FeedbackCard from "./FeedbackCard";
import MissionComplete from "./MissionComplete";
import ProgressIndicator from "./ProgressIndicator";

interface MissionPlayerProps {
  mission: LearningMission;
  onFinished?: () => void;
}

type PlayerPhase = "intro" | "playing" | "feedback" | "complete";

export default function MissionPlayer({ mission, onFinished }: MissionPlayerProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState<string>("김하늘");
  const [phase, setPhase] = useState<PlayerPhase>("intro");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<MissionChoice | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // 학습 로그 데이터 추적 상태
  const [answerLogs, setAnswerLogs] = useState<StepAnswerLog[]>([]);
  const [stepAttempts, setStepAttempts] = useState<number>(1);
  const [stepHintUsed, setStepHintUsed] = useState<boolean>(false);
  const [totalHintsCount, setTotalHintsCount] = useState<number>(0);
  const [totalWrongCount, setTotalWrongCount] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setStudentName(getSelectedStudentName());
    startTimeRef.current = Date.now();

    return () => {
      stopTtsAudio();
    };
  }, []);

  const currentStep = mission.steps[currentStepIndex] || mission.steps[0];
  const isLastStep = currentStepIndex >= mission.steps.length - 1;
  const skillMeta = SKILL_METAS[mission.skill];

  // STEP 1: 미션 시작
  const handleStartMission = () => {
    setPhase("playing");
    setCurrentStepIndex(0);
    setSelectedChoice(null);
    setStepAttempts(1);
    setStepHintUsed(false);
    startTimeRef.current = Date.now();
  };

  // STEP 4: 선택지 선택 시 정답 판정 및 피드백 전환
  const handleSelectChoice = (choice: MissionChoice) => {
    setSelectedChoice(choice);
    const correct = choice.correct;
    setIsCorrect(correct);

    if (!correct) {
      setTotalWrongCount((prev) => prev + 1);
    }

    // 단계별 답변 로그 기록
    const currentStepLog: StepAnswerLog = {
      stepId: currentStep.stepId,
      chosenChoiceId: choice.id,
      chosenText: choice.text,
      correct,
      attemptCount: stepAttempts,
      hintUsed: stepHintUsed,
    };

    setAnswerLogs((prev) => {
      const filtered = prev.filter((l) => l.stepId !== currentStep.stepId);
      return [...filtered, currentStepLog];
    });

    setPhase("feedback");
  };

  // STEP 5: 오답 후 재시도
  const handleRetry = () => {
    stopTtsAudio();
    setSelectedChoice(null);
    setStepAttempts((prev) => prev + 1);
    setPhase("playing");
  };

  // STEP 5: 정답 후 다음 단계 또는 완료 처리
  const handleNext = () => {
    stopTtsAudio();

    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setStepAttempts(1);
      setStepHintUsed(false);
      setPhase("playing");
    } else {
      // 모든 스텝 완료 시 결과 저장 및 축하 화면
      handleFinishMission();
    }
  };

  // STEP 7: 완료 및 저장
  const handleFinishMission = () => {
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const score = Math.max(70, 100 - totalWrongCount * 5 - totalHintsCount * 2);
    const isFirstTryCorrect = totalWrongCount === 0;

    const log: MissionExecutionLog = {
      student_id: studentName,
      mission_id: mission.id,
      skill: mission.skill,
      difficulty: mission.difficulty,
      answer_history: answerLogs,
      is_first_try_correct: isFirstTryCorrect,
      attempt_count: totalWrongCount + mission.steps.length,
      hint_count: totalHintsCount,
      duration_seconds: durationSeconds,
      score,
      xp_earned: mission.xp,
      completed_at: new Date().toLocaleString("ko-KR"),
      completion_status: "completed",
    };

    saveMissionExecutionLog(log);
    setPhase("complete");
    onFinished?.();
  };

  // 힌트 조회 이벤트
  const handleHintView = () => {
    if (!stepHintUsed) {
      setStepHintUsed(true);
      setTotalHintsCount((prev) => prev + 1);
    }
  };

  // 다시 처음부터 시작하기
  const handleRestart = () => {
    stopTtsAudio();
    setCurrentStepIndex(0);
    setSelectedChoice(null);
    setAnswerLogs([]);
    setStepAttempts(1);
    setStepHintUsed(false);
    setTotalHintsCount(0);
    setTotalWrongCount(0);
    startTimeRef.current = Date.now();
    setPhase("intro");
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 px-4">
      {/* 1. 인트로 화면 */}
      {phase === "intro" && (
        <MissionIntro
          mission={mission}
          studentName={studentName}
          onStart={handleStartMission}
        />
      )}

      {/* 2. 문제 풀이 및 피드백 화면 */}
      {(phase === "playing" || phase === "feedback") && (
        <div className="space-y-6">
          {/* 상단 네비게이션 & 진행 상태 바 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/mission")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition"
                >
                  ← 목록으로
                </button>
                <span className="text-sm font-black text-slate-800">
                  {mission.icon} {mission.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${skillMeta.bgColor} ${skillMeta.textColor} ${skillMeta.borderColor}`}
                >
                  {skillMeta.icon} {skillMeta.shortName}
                </span>
              </div>
            </div>

            <ProgressIndicator
              currentStep={currentStepIndex + 1}
              totalSteps={mission.steps.length}
            />
          </div>

          {/* STEP 2: 상황 보기 카드 */}
          <SceneCard
            speaker={currentStep.sceneSpeaker}
            icon={currentStep.sceneIcon}
            text={currentStep.sceneText}
            image={currentStep.sceneImage}
            autoPlayTts={phase === "playing" && stepAttempts === 1}
          />

          {/* STEP 3: 질문 카드 */}
          <QuestionCard question={currentStep.question} />

          {/* 힌트 버튼 영역 */}
          {currentStep.hint && (
            <div className="flex justify-end">
              <HintButton
                hint={currentStep.hint}
                onHintView={handleHintView}
              />
            </div>
          )}

          {/* STEP 4: 선택지 카드 (선택 단계) */}
          {phase === "playing" && (
            <div className="pt-2">
              <p className="text-sm font-black text-slate-500 mb-3 px-1">
                알맞은 답을 골라보세요 👇
              </p>
              <ChoiceCard
                choices={currentStep.choices}
                selectedChoiceId={selectedChoice?.id || null}
                onSelect={handleSelectChoice}
              />
            </div>
          )}

          {/* STEP 5: 정답/오답 피드백 카드 (피드백 단계) */}
          {phase === "feedback" && selectedChoice && (
            <div className="pt-2 space-y-4">
              <FeedbackCard
                isCorrect={isCorrect}
                message={
                  isCorrect
                    ? currentStep.correctFeedback
                    : currentStep.wrongFeedback
                }
                reason={selectedChoice.reason}
                onRetry={!isCorrect ? handleRetry : undefined}
                onNext={handleNext}
                isLastStep={isLastStep}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. 미션 완료 화면 */}
      {phase === "complete" && (
        <MissionComplete
          mission={mission}
          studentName={studentName}
          earnedXp={mission.xp}
          totalAttempts={totalWrongCount + mission.steps.length}
          hintsUsed={totalHintsCount}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
