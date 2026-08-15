"use client";

import AudioButton from "./AudioButton";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-lg font-black text-white shadow-sm">
            Q
          </span>
          <p className="text-xs font-bold text-emerald-800">
            질문을 잘 읽고 생각해 보세요
          </p>
        </div>

        <AudioButton text={question} label="질문 듣기" size="sm" />
      </div>

      <h2 className="mt-4 text-2xl font-black leading-snug text-slate-950 sm:text-3xl">
        {question}
      </h2>
    </div>
  );
}
