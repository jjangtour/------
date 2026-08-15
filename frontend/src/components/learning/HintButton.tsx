"use client";

import { useState } from "react";
import AudioButton from "./AudioButton";

interface HintButtonProps {
  hint?: string;
  onHintView?: () => void;
}

export default function HintButton({ hint, onHintView }: HintButtonProps) {
  const [showHint, setShowHint] = useState(false);

  if (!hint) return null;

  const toggleHint = () => {
    if (!showHint) {
      onHintView?.();
    }
    setShowHint((prev) => !prev);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggleHint}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all shadow-sm active:scale-95 ${
          showHint
            ? "bg-amber-500 text-white ring-4 ring-amber-200"
            : "bg-amber-100 text-amber-900 hover:bg-amber-200 ring-1 ring-amber-300"
        }`}
        aria-expanded={showHint}
      >
        <span className="text-base">💡</span>
        <span>{showHint ? "힌트 닫기" : "힌트 보기"}</span>
      </button>

      {showHint && (
        <div className="mt-3 w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-md sm:max-w-md animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
              <span>💡</span>
              <span>도움말 힌트</span>
            </div>
            <AudioButton text={hint} size="sm" label="힌트 듣기" />
          </div>
          <p className="mt-2 text-base font-bold text-amber-900 leading-relaxed">
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}
