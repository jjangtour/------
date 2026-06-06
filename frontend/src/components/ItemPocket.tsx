"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  checkoutItemId,
  getInUseItemIds,
  getOwnedItemIds,
  getPackedItemIds,
  ItemId,
  MissionItemId,
  MISSION_ITEM_CHALLENGES,
  POCKET_ITEM_MAP,
  recordItemUse,
} from "@/utils/items";

type ItemPocketAttempt = {
  selectedItemId: ItemId;
  correct: boolean;
  hintsUsed: number;
};

type ItemPocketProps = {
  missionId: MissionItemId;
  open?: boolean;
  solved?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGuide?: (message: string) => void;
  onSuccess?: (attempt: ItemPocketAttempt) => void;
  onWrong?: (attempt: ItemPocketAttempt) => void;
  onHint?: (hintCount: number) => void;
};

type FeedbackTone = "idle" | "careful" | "success";

const readStudentName = () => {
  if (typeof window === "undefined") return "학생";
  return localStorage.getItem("haemileum_selected_student") || "학생";
};

export default function ItemPocket({
  missionId,
  open,
  solved = false,
  onOpenChange,
  onGuide,
  onSuccess,
  onWrong,
  onHint,
}: ItemPocketProps) {
  const challenge = MISSION_ITEM_CHALLENGES[missionId];
  const [internalOpen, setInternalOpen] = useState(false);
  const [ownedItemIds, setOwnedItemIds] = useState<ItemId[]>(() => getOwnedItemIds());
  const [packedItemIds, setPackedItemIds] = useState<ItemId[]>(() => getPackedItemIds());
  const [inUseItemIds, setInUseItemIds] = useState<ItemId[]>(() => getInUseItemIds());
  const [hintCount, setHintCount] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    message: string;
  }>({
    tone: "idle",
    message: challenge.situation,
  });

  const panelOpen = open ?? internalOpen;
  const ownedItemSet = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);
  const packedItemSet = useMemo(() => new Set(packedItemIds), [packedItemIds]);
  const inUseItemSet = useMemo(() => new Set(inUseItemIds), [inUseItemIds]);
  const optionItems = challenge.optionItemIds.map((id) => POCKET_ITEM_MAP[id]);
  const correctItem = POCKET_ITEM_MAP[challenge.correctItemId];
  const hasCorrectItem =
    packedItemSet.has(challenge.correctItemId) ||
    inUseItemSet.has(challenge.correctItemId);

  const setPanelOpen = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  };

  useEffect(() => {
    const syncItems = () => {
      setOwnedItemIds(getOwnedItemIds());
      setPackedItemIds(getPackedItemIds());
      setInUseItemIds(getInUseItemIds());
    };
    window.addEventListener("storage", syncItems);

    return () => {
      window.removeEventListener("storage", syncItems);
    };
  }, []);

  const sendGuide = (message: string) => {
    onGuide?.(message);
  };

  const handleOpen = () => {
    setPanelOpen(true);
    const message = solved
      ? `${challenge.title}는 준비 완료예요.`
      : challenge.prompt;
    setFeedback({
      tone: solved ? "success" : "idle",
      message,
    });
    sendGuide(message);
  };

  const handleHint = () => {
    const nextHintCount = Math.min(hintCount + 1, challenge.hints.length);
    const hint = challenge.hints[nextHintCount - 1] ?? challenge.hints.at(-1);

    setHintCount(nextHintCount);
    setFeedback({
      tone: "idle",
      message: hint ?? challenge.situation,
    });
    onHint?.(nextHintCount);
    sendGuide(hint ?? challenge.situation);
  };

  const handleItemSelect = (itemId: ItemId) => {
    const item = POCKET_ITEM_MAP[itemId];
    const itemOwned = ownedItemSet.has(itemId);
    const itemPacked = packedItemSet.has(itemId);
    const itemInUse = inUseItemSet.has(itemId);
    setSelectedItemId(itemId);

    if (!itemOwned) {
      const message = `${item.name}은 아직 우리집에 없어요. 우리집에서 물건을 챙긴 뒤 다시 골라요.`;
      setFeedback({ tone: "careful", message });
      sendGuide(message);
      return;
    }

    if (!itemPacked && !(solved && itemInUse)) {
      const message = `${item.name}은 우리집에 있지만 아직 주머니에 챙기지 않았어요. 우리집에서 '챙기기'를 눌러 가져와요.`;
      setFeedback({ tone: "careful", message });
      sendGuide(message);
      return;
    }

    const correct = itemId === challenge.correctItemId;
    const attempt = {
      selectedItemId: itemId,
      correct,
      hintsUsed: hintCount,
    };

    recordItemUse({
      studentName: readStudentName(),
      missionId,
      selectedItemId: itemId,
      correctItemId: challenge.correctItemId,
      correct,
      hintsUsed: hintCount,
      attemptedAt: new Date().toLocaleString("ko-KR"),
    });

    if (!correct) {
      const message = item.wrongMessage;
      setFeedback({ tone: "careful", message });
      onWrong?.(attempt);
      sendGuide(message);
      return;
    }

    if (itemPacked) {
      const nextItems = checkoutItemId(itemId);
      setOwnedItemIds(nextItems.ownedItemIds);
      setPackedItemIds(nextItems.packedItemIds);
      setInUseItemIds(nextItems.inUseItemIds);
    }

    const message = `${challenge.successMessage} ${challenge.actionMessage}`;
    setFeedback({ tone: "success", message });
    onSuccess?.(attempt);
    sendGuide(message);
    window.setTimeout(() => setPanelOpen(false), 900);
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleOpen();
        }}
        className={`fixed bottom-4 right-4 z-[70] flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-black shadow-2xl backdrop-blur-md transition hover:-translate-y-0.5 ${
          solved
            ? "border-emerald-300 bg-emerald-500 text-slate-950"
            : hasCorrectItem
              ? "border-amber-200 bg-amber-300 text-slate-950"
              : "border-white/20 bg-slate-950/88 text-white"
        }`}
        aria-label="준비 주머니 열기"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-xs text-slate-950 shadow-sm">
          BAG
        </span>
        <span>
          <span className="block text-xs opacity-70">해밀이의</span>
          <span className="block">{solved ? "준비 완료" : "준비 주머니"}</span>
        </span>
      </button>

      {panelOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          onClick={(event) => {
            event.stopPropagation();
            setPanelOpen(false);
          }}
        >
          <section
            className="w-full max-w-3xl rounded-lg border border-white/10 bg-slate-950 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-200">
                    해밀이의 준비 주머니
                  </p>
                  <h2 className="mt-1 text-2xl font-black">{challenge.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20"
                >
                  닫기
                </button>
              </div>
              <p className="mt-3 text-base font-bold leading-7 text-slate-100">
                {challenge.prompt}
              </p>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_230px]">
              <div className="grid gap-3 sm:grid-cols-3">
                {optionItems.map((item) => {
                  const owned = ownedItemSet.has(item.id);
                  const packed = packedItemSet.has(item.id);
                  const inUse = inUseItemSet.has(item.id);
                  const selected = selectedItemId === item.id;
                  const isCorrectHint =
                    hintCount >= 2 && item.id === challenge.correctItemId && !solved;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(item.id)}
                      className={`min-h-40 rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${
                        packed || inUse
                          ? item.colorClass
                          : "border-slate-700 bg-slate-900 text-slate-400"
                      } ${
                        selected ? "ring-4 ring-white/25" : ""
                      } ${
                        isCorrectHint ? "ring-4 ring-amber-300" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-xs font-black text-slate-950 shadow-sm">
                          {item.icon}
                        </span>
                        <span className="rounded-md bg-white/85 px-2 py-1 text-[10px] font-black text-slate-700">
                          {inUse ? "미션 중" : packed ? "챙김" : owned ? "집에 있음" : "잠김"}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black">{item.name}</h3>
                      <p className="mt-2 text-xs font-bold leading-5 opacity-80">
                        {item.place} · {item.action}
                      </p>
                    </button>
                  );
                })}
              </div>

              <aside className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black text-slate-300">이음이 말</p>
                <p
                  className={`mt-2 text-sm font-bold leading-6 ${
                    feedback.tone === "success"
                      ? "text-emerald-200"
                      : feedback.tone === "careful"
                        ? "text-amber-100"
                        : "text-slate-100"
                  }`}
                >
                  {feedback.message}
                </p>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={handleHint}
                    className="h-11 rounded-md bg-amber-300 px-3 text-sm font-black text-slate-950 hover:bg-amber-200"
                  >
                    힌트 보기 {hintCount > 0 ? `(${hintCount})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => sendGuide(feedback.message)}
                    className="h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm font-black hover:bg-white/20"
                  >
                    다시 듣기
                  </button>
                  {!hasCorrectItem && (
                    <Link
                      href="/student/house"
                      className="flex min-h-11 items-center justify-center rounded-md bg-emerald-500 px-3 text-center text-sm font-black text-slate-950 hover:bg-emerald-400"
                    >
                      우리집에서 챙기기
                    </Link>
                  )}
                </div>

                <div className="mt-4 rounded-md bg-slate-900 p-3 text-xs font-bold leading-5 text-slate-300">
                  {solved || hintCount >= challenge.hints.length
                    ? `정답 물건: ${correctItem.name}`
                    : "힌트를 보면 필요한 물건을 더 쉽게 찾을 수 있어요."}
                  <br />
                  우리집에서 물건을 챙기면 미션 중에 사용할 수 있어요.
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
