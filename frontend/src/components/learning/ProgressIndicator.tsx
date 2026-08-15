"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepTitles,
}: ProgressIndicatorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-black text-slate-500">
        <span>미션 진행 상태</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {currentStep} / {totalSteps} 단계
        </span>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={index} className="flex-1">
              <div
                className={`h-2.5 w-full rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500"
                    : isCurrent
                    ? "bg-emerald-400 ring-2 ring-emerald-200"
                    : "bg-slate-200"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
