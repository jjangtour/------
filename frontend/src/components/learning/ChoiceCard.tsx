"use client";

import { MissionChoice } from "@/types/learningMission";

interface ChoiceCardProps {
  choices: MissionChoice[];
  selectedChoiceId: string | null;
  onSelect: (choice: MissionChoice) => void;
  disabled?: boolean;
}

export default function ChoiceCard({
  choices,
  selectedChoiceId,
  onSelect,
  disabled = false,
}: ChoiceCardProps) {
  const numberEmojis = ["①", "②", "③", "④"];

  return (
    <div className="flex flex-col gap-3.5">
      {choices.map((choice, index) => {
        const isSelected = selectedChoiceId === choice.id;
        const numLabel = numberEmojis[index] || `${index + 1}`;

        return (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice)}
            className={`group relative flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all shadow-sm active:scale-[0.99] ${
              disabled ? "cursor-not-allowed opacity-60" : ""
            } ${
              isSelected
                ? "border-emerald-500 bg-emerald-50/80 shadow-md ring-4 ring-emerald-100"
                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 hover:shadow-md"
            }`}
          >
            {/* 번호 / 아이콘 */}
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-900"
              }`}
            >
              {choice.icon || numLabel}
            </span>

            {/* 선택지 내용 */}
            <div className="min-w-0 flex-1">
              <span className="text-xl font-black leading-snug text-slate-900 sm:text-2xl">
                {choice.text}
              </span>
            </div>

            {/* 선택 완료 체크 표시 */}
            {isSelected && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black shadow-sm">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
