"use client";

import AudioButton from "./AudioButton";

interface SceneCardProps {
  speaker?: string;
  icon?: string;
  text: string;
  image?: string;
  autoPlayTts?: boolean;
}

export default function SceneCard({
  speaker,
  icon = "💬",
  text,
  image,
  autoPlayTts = true,
}: SceneCardProps) {
  const speechText = speaker ? `${speaker}가 말합니다. ${text}` : text;

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      {/* 헤더: 화자 정보 + 오디오 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl shadow-inner">
            {icon}
          </span>
          <div>
            <span className="text-xs font-bold text-slate-400">상황 보기</span>
            <h3 className="text-base font-black text-slate-800">
              {speaker || "생활 상황"}
            </h3>
          </div>
        </div>

        <AudioButton text={speechText} label="상황 다시 듣기" size="md" autoPlay={autoPlayTts} />
      </div>

      {/* 상황 텍스트 본문 */}
      <div className="rounded-2xl bg-[#f8faf9] p-6 border border-emerald-100/60">
        <p className="whitespace-pre-line text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl">
          {text}
        </p>
      </div>

      {image && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <img src={image} alt="상황 그림" className="w-full object-cover max-h-64" />
        </div>
      )}
    </div>
  );
}
