"use client";

import { useEffect } from "react";
import AudioButton from "./AudioButton";

interface FeedbackCardProps {
  isCorrect: boolean;
  message: string;
  reason?: string;
  onRetry?: () => void;
  onNext: () => void;
  isLastStep?: boolean;
}

export default function FeedbackCard({
  isCorrect,
  message,
  reason,
  onRetry,
  onNext,
  isLastStep = false,
}: FeedbackCardProps) {
  const fullVoiceText = `${isCorrect ? "잘했어요!" : "괜찮아요. 다시 한번 살펴봐요."} ${message} ${reason || ""}`;

  return (
    <div
      className={`rounded-3xl border-2 p-6 shadow-lg sm:p-8 animate-fade-in ${
        isCorrect
          ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-green-50/50"
          : "border-amber-300 bg-gradient-to-b from-amber-50 to-orange-50/50"
      }`}
    >
      {/* 피드백 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{isCorrect ? "⭐" : "🌱"}</span>
          <div>
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                isCorrect ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {isCorrect ? "정답 확인" : "다시 도전"}
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {isCorrect ? "잘했어요!" : "괜찮아요, 다시 해봐요!"}
            </h3>
          </div>
        </div>

        <AudioButton text={fullVoiceText} label="설명 듣기" size="sm" autoPlay={true} />
      </div>

      {/* 피드백 메시지 본문 */}
      <div className="my-5 rounded-2xl bg-white/90 p-5 shadow-sm border border-slate-100">
        <p className="whitespace-pre-line text-xl font-bold leading-relaxed text-slate-900">
          {message}
        </p>

        {reason && (
          <p className="mt-3 text-base font-semibold leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
            💡 {reason}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {!isCorrect && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-2xl border-2 border-amber-400 bg-white px-6 py-3.5 text-lg font-black text-amber-900 shadow-sm transition hover:bg-amber-100 active:scale-95"
          >
            다시 시도하기 ↺
          </button>
        )}

        {isCorrect && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-emerald-700 px-8 py-3.5 text-lg font-black text-white shadow-md transition hover:bg-emerald-800 hover:shadow-lg active:scale-95"
          >
            {isLastStep ? "미션 완료하기 🎉" : "다음 단계로 가기 ➔"}
          </button>
        )}
      </div>
    </div>
  );
}
