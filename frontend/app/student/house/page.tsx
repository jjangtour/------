"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getBuiltHomeRoomIds,
  getInUseItemIds,
  getOwnedItemIds,
  getPackedItemIds,
  HOME_ITEM_ROOMS,
  ItemId,
  packItemIds,
  POCKET_ITEM_MAP,
  POCKET_ITEMS,
  saveBuiltHomeRoomIds,
  unpackItemIds,
  unlockItemIds,
} from "@/utils/items";

const getSelectedStudent = () => {
  if (typeof window === "undefined") return "학생";
  return localStorage.getItem("haemileum_selected_student") || "학생";
};

export default function StudentHousePage() {
  const [studentName, setStudentName] = useState(() => getSelectedStudent());
  const [ownedItemIds, setOwnedItemIds] = useState<ItemId[]>(() => getOwnedItemIds());
  const [packedItemIds, setPackedItemIds] = useState<ItemId[]>(() => getPackedItemIds());
  const [inUseItemIds, setInUseItemIds] = useState<ItemId[]>(() => getInUseItemIds());
  const [builtRoomIds, setBuiltRoomIds] = useState<string[]>(() => getBuiltHomeRoomIds());
  const [message, setMessage] = useState("우리집을 정리하면 미션에 필요한 물건을 챙길 수 있어요.");

  const ownedItemSet = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);
  const packedItemSet = useMemo(() => new Set(packedItemIds), [packedItemIds]);
  const inUseItemSet = useMemo(() => new Set(inUseItemIds), [inUseItemIds]);
  const preparedItemCount = new Set([...packedItemIds, ...inUseItemIds]).size;
  const progress = Math.round((preparedItemCount / POCKET_ITEMS.length) * 100);

  const syncState = () => {
    setStudentName(getSelectedStudent());
    setOwnedItemIds(getOwnedItemIds());
    setPackedItemIds(getPackedItemIds());
    setInUseItemIds(getInUseItemIds());
    setBuiltRoomIds(getBuiltHomeRoomIds());
  };

  useEffect(() => {
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
    };
  }, []);

  const buildRoom = (roomId: string) => {
    const room = HOME_ITEM_ROOMS.find((item) => item.id === roomId);
    if (!room) return;

    const nextRoomIds = Array.from(new Set([...builtRoomIds, roomId]));
    saveBuiltHomeRoomIds(nextRoomIds);
    const nextOwnedItemIds = unlockItemIds(room.itemIds);

    setBuiltRoomIds(nextRoomIds);
    setOwnedItemIds(nextOwnedItemIds);
    setPackedItemIds(getPackedItemIds());
    setInUseItemIds(getInUseItemIds());
    setMessage(`${room.title}을 만들었어요. ${room.itemIds.map((id) => POCKET_ITEM_MAP[id].name).join(", ")}이 우리집에 생겼어요. 필요한 물건은 '챙기기'를 눌러요.`);
  };

  const collectAllItems = () => {
    const allRoomIds = HOME_ITEM_ROOMS.map((room) => room.id);
    const allItemIds = POCKET_ITEMS.map((item) => item.id);

    saveBuiltHomeRoomIds(allRoomIds);
    const nextOwnedItemIds = unlockItemIds(allItemIds);
    const nextPackedItemIds = packItemIds(allItemIds);

    setBuiltRoomIds(allRoomIds);
    setOwnedItemIds(nextOwnedItemIds);
    setPackedItemIds(nextPackedItemIds);
    setInUseItemIds(getInUseItemIds());
    setMessage("우리집 준비가 끝났어요. 모든 물건을 주머니에 챙겼어요.");
  };

  const packItem = (itemId: ItemId) => {
    const nextPackedItemIds = packItemIds([itemId]);
    setPackedItemIds(nextPackedItemIds);
    setMessage(`${POCKET_ITEM_MAP[itemId].name}을 준비 주머니에 챙겼어요.`);
  };

  const unpackItem = (itemId: ItemId) => {
    const nextPackedItemIds = unpackItemIds([itemId]);
    setPackedItemIds(nextPackedItemIds);
    setMessage(`${POCKET_ITEM_MAP[itemId].name}을 우리집에 놓고 가요.`);
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="bg-emerald-700 p-7 text-white sm:p-9">
              <p className="text-sm font-bold text-emerald-100">우리집</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {studentName}의 미션 물건을 준비해요
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50">
                현관, 책상, 안전 연락판을 만들면 버스카드, 결제 카드, 은행 카드처럼
                생활 미션에 필요한 물건을 준비 주머니에 넣을 수 있어요.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-emerald-100">
                    <span>준비 진행률</span>
                    <span>{preparedItemCount}/{POCKET_ITEMS.length}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={collectAllItems}
                  className="min-h-12 rounded-md bg-white px-5 py-3 text-sm font-black text-emerald-800 hover:bg-emerald-50"
                >
                  모두 챙기기
                </button>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-base font-black text-amber-950">준비 주머니</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                  {message}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-base font-black text-slate-950">미션에서 사용</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  미션 화면 오른쪽 아래의 준비 주머니를 누르고, 상황에 맞는 물건을 골라요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {HOME_ITEM_ROOMS.map((room) => {
            const built = builtRoomIds.includes(room.id);

            return (
              <section
                key={room.id}
                className={`rounded-lg border p-5 shadow-sm ${room.accentClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black opacity-70">
                      {built ? "완성된 공간" : "만들 공간"}
                    </p>
                    <h2 className="mt-1 text-xl font-black">{room.title}</h2>
                  </div>
                  <span className="rounded-md bg-white px-3 py-1 text-xs font-black shadow-sm">
                    {built ? "완성" : "준비"}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 opacity-80">
                  {room.description}
                </p>

                <div className="mt-5 grid gap-2">
                  {room.itemIds.map((itemId) => {
                    const item = POCKET_ITEM_MAP[itemId];
                    const owned = ownedItemSet.has(itemId);
                    const packed = packedItemSet.has(itemId);
                    const inUse = inUseItemSet.has(itemId);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white">
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              {item.name}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {item.action}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                            {inUse ? "미션 중" : packed ? "챙김" : owned ? "보유" : "미보유"}
                          </span>
                          {owned && !inUse && (
                            <button
                              type="button"
                              onClick={() => (packed ? unpackItem(itemId) : packItem(itemId))}
                              className={`min-h-9 rounded-md px-3 py-2 text-xs font-black ${
                                packed
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  : "bg-emerald-700 text-white hover:bg-emerald-800"
                              }`}
                            >
                              {packed ? "놓고 가기" : "챙기기"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => buildRoom(room.id)}
                  className="mt-5 min-h-12 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  {built ? "물건 다시 챙기기" : "공간 만들고 물건 얻기"}
                </button>
              </section>
            );
          })}
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-lg font-black text-slate-950">
              준비가 끝나면 미션에서 물건을 사용해요
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              버스, 키오스크, ATM 미션에서 준비 주머니를 열고 상황에 맞는 물건을 고르면
              다음 행동으로 이어집니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mission/select"
              className="flex min-h-12 items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            >
              미션 고르기
            </Link>
            <Link
              href="/student/home"
              className="flex min-h-12 items-center justify-center rounded-md bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
            >
              학생 홈
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
