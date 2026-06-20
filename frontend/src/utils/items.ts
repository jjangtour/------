export type ItemId =
  | "bus_card"
  | "payment_card"
  | "bank_card"
  | "student_id"
  | "phone"
  | "emergency_card"
  | "cash"
  | "fishing_rod";

export type MissionItemId = "bus" | "kiosk" | "atm";

export type PocketItem = {
  id: ItemId;
  name: string;
  icon: string;
  place: string;
  action: string;
  colorClass: string;
  usedFor: MissionItemId[];
  wrongMessage: string;
};

export type MissionItemChallenge = {
  missionId: MissionItemId;
  title: string;
  prompt: string;
  situation: string;
  correctItemId: ItemId;
  optionItemIds: ItemId[];
  successMessage: string;
  actionMessage: string;
  hints: string[];
};

export type HomeItemRoom = {
  id: string;
  title: string;
  description: string;
  itemIds: ItemId[];
  accentClass: string;
};

export type ItemUseRecord = {
  studentName: string;
  missionId: MissionItemId;
  selectedItemId: ItemId;
  correctItemId: ItemId;
  correct: boolean;
  hintsUsed: number;
  attemptedAt: string;
};

const OWNED_ITEMS_KEY = "haemileum_owned_items";
const PACKED_ITEMS_KEY = "haemileum_packed_items";
const IN_USE_ITEMS_KEY = "haemileum_in_use_items";
const HOME_ROOMS_KEY = "haemileum_home_rooms";
const ITEM_RECORDS_KEY = "haemileum_item_records";

export const POCKET_ITEMS: PocketItem[] = [
  {
    id: "bus_card",
    name: "버스카드",
    icon: "BUS",
    place: "버스",
    action: "단말기에 찍기",
    colorClass: "border-sky-200 bg-sky-50 text-sky-950",
    usedFor: ["bus"],
    wrongMessage: "버스카드는 버스를 탈 때 써요. 지금 상황에 맞는 물건을 다시 골라볼까요?",
  },
  {
    id: "payment_card",
    name: "결제 카드",
    icon: "PAY",
    place: "가게/키오스크",
    action: "카드 인식기에 대기",
    colorClass: "border-amber-200 bg-amber-50 text-amber-950",
    usedFor: ["kiosk"],
    wrongMessage: "결제 카드는 물건을 살 때 써요. 지금 미션을 다시 확인해볼까요?",
  },
  {
    id: "bank_card",
    name: "은행 카드",
    icon: "BANK",
    place: "ATM",
    action: "카드 넣는 곳에 넣기",
    colorClass: "border-blue-200 bg-blue-50 text-blue-950",
    usedFor: ["atm"],
    wrongMessage: "은행 카드는 ATM에서 돈을 찾거나 넣을 때 써요.",
  },
  {
    id: "student_id",
    name: "학생증",
    icon: "ID",
    place: "학교/도서관",
    action: "직원에게 보여주기",
    colorClass: "border-violet-200 bg-violet-50 text-violet-950",
    usedFor: [],
    wrongMessage: "학생증은 학교나 도서관에서 주로 써요. 지금 필요한 카드를 다시 찾아볼까요?",
  },
  {
    id: "phone",
    name: "휴대폰",
    icon: "PHONE",
    place: "연락이 필요할 때",
    action: "보호자에게 전화하기",
    colorClass: "border-emerald-200 bg-emerald-50 text-emerald-950",
    usedFor: [],
    wrongMessage: "휴대폰은 연락이 필요할 때 써요. 지금은 미션에 맞는 카드를 골라요.",
  },
  {
    id: "emergency_card",
    name: "비상 연락 카드",
    icon: "SOS",
    place: "도움이 필요할 때",
    action: "가까운 어른에게 보여주기",
    colorClass: "border-rose-200 bg-rose-50 text-rose-950",
    usedFor: [],
    wrongMessage: "비상 연락 카드는 길을 잃거나 도움이 필요할 때 써요.",
  },
  {
    id: "cash",
    name: "현금",
    icon: "CASH",
    place: "가게",
    action: "직원에게 건네기",
    colorClass: "border-lime-200 bg-lime-50 text-lime-950",
    usedFor: [],
    wrongMessage: "현금도 물건을 살 때 쓸 수 있지만, 이번 키오스크 미션에서는 결제 카드를 연습해요.",
  },
  {
    id: "fishing_rod",
    name: "낚시대",
    icon: "ROD",
    place: "물가/낚시터",
    action: "낚시하기",
    colorClass: "border-emerald-200 bg-emerald-50 text-emerald-950",
    usedFor: [],
    wrongMessage: "낚시대를 가지고 낚시터로 가면 낚시를 할 수 있어요.",
  },
];

export const POCKET_ITEM_MAP = POCKET_ITEMS.reduce(
  (map, item) => ({ ...map, [item.id]: item }),
  {} as Record<ItemId, PocketItem>
);

export const MISSION_ITEM_CHALLENGES: Record<MissionItemId, MissionItemChallenge> = {
  bus: {
    missionId: "bus",
    title: "버스를 탈 준비",
    prompt: "버스가 왔어요. 버스를 타려면 무엇이 필요할까요?",
    situation: "버스에 오르면 먼저 단말기에 알맞은 카드를 찍어야 해요.",
    correctItemId: "bus_card",
    optionItemIds: ["bus_card", "payment_card", "student_id"],
    successMessage: "좋아요! 버스를 탈 때는 버스카드를 찍어요.",
    actionMessage: "버스카드를 단말기에 가져다 대는 행동까지 떠올렸어요.",
    hints: [
      "버스를 탈 때 쓰는 카드를 찾아요.",
      "교통카드처럼 버스 그림이 있는 카드를 살펴보세요.",
      "버스카드를 눌러볼까요?",
    ],
  },
  kiosk: {
    missionId: "kiosk",
    title: "키오스크 결제 준비",
    prompt: "햄버거를 골랐어요. 이제 계산하려면 무엇이 필요할까요?",
    situation: "키오스크 화면에서 결제하기를 누른 뒤 카드 인식기에 카드를 대요.",
    correctItemId: "payment_card",
    optionItemIds: ["payment_card", "bus_card", "cash"],
    successMessage: "좋아요! 물건을 살 때는 결제 카드를 써요.",
    actionMessage: "결제 카드를 카드 인식기에 가져다 대는 행동까지 연결했어요.",
    hints: [
      "물건을 살 때 쓰는 카드를 찾아요.",
      "버스카드가 아니라 결제할 때 쓰는 카드를 살펴보세요.",
      "결제 카드를 눌러볼까요?",
    ],
  },
  atm: {
    missionId: "atm",
    title: "ATM 사용 준비",
    prompt: "은행 기계에서 돈을 찾으려고 해요. 무엇을 넣어야 할까요?",
    situation: "ATM은 은행 카드를 넣은 뒤 화면 안내를 따라 사용해요.",
    correctItemId: "bank_card",
    optionItemIds: ["bank_card", "bus_card", "student_id"],
    successMessage: "좋아요! 은행 기계에는 은행 카드를 넣어요.",
    actionMessage: "은행 카드를 카드 넣는 곳에 넣는 행동까지 떠올렸어요.",
    hints: [
      "은행 기계에서 쓰는 카드를 찾아요.",
      "버스카드나 학생증이 아니라 은행 카드가 필요해요.",
      "은행 카드를 눌러볼까요?",
    ],
  },
};

export const HOME_ITEM_ROOMS: HomeItemRoom[] = [
  {
    id: "door",
    title: "현관 준비 선반",
    description: "밖에 나가기 전에 버스카드와 결제 카드를 챙겨요.",
    itemIds: ["bus_card", "payment_card"],
    accentClass: "border-sky-200 bg-sky-50 text-sky-950",
  },
  {
    id: "desk",
    title: "책상 카드 서랍",
    description: "은행 카드와 학생증을 구분해서 넣어 둬요.",
    itemIds: ["bank_card", "student_id"],
    accentClass: "border-blue-200 bg-blue-50 text-blue-950",
  },
  {
    id: "safety",
    title: "안전 연락판",
    description: "도움이 필요할 때 쓸 휴대폰과 비상 연락 카드를 준비해요.",
    itemIds: ["phone", "emergency_card", "cash"],
    accentClass: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
];

const parseStoredIds = <T extends string>(
  raw: string | null,
  allowedIds: readonly T[]
): T[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is T => allowedIds.includes(id));
  } catch {
    return [];
  }
};

export const getOwnedItemIds = (): ItemId[] => {
  if (typeof window === "undefined") return [];
  return parseStoredIds(
    localStorage.getItem(OWNED_ITEMS_KEY),
    POCKET_ITEMS.map((item) => item.id)
  );
};

export const saveOwnedItemIds = (itemIds: ItemId[]) => {
  if (typeof window === "undefined") return;
  const uniqueIds = Array.from(new Set(itemIds));
  localStorage.setItem(OWNED_ITEMS_KEY, JSON.stringify(uniqueIds));
  window.dispatchEvent(new Event("storage"));
};

export const unlockItemIds = (itemIds: ItemId[]) => {
  const nextIds = Array.from(new Set([...getOwnedItemIds(), ...itemIds]));
  saveOwnedItemIds(nextIds);
  return nextIds;
};

export const getPackedItemIds = (): ItemId[] => {
  if (typeof window === "undefined") return [];
  return parseStoredIds(
    localStorage.getItem(PACKED_ITEMS_KEY),
    POCKET_ITEMS.map((item) => item.id)
  );
};

export const savePackedItemIds = (itemIds: ItemId[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PACKED_ITEMS_KEY, JSON.stringify(Array.from(new Set(itemIds))));
  window.dispatchEvent(new Event("storage"));
};

export const packItemIds = (itemIds: ItemId[]) => {
  const ownedItemSet = new Set(getOwnedItemIds());
  const packableIds = itemIds.filter((id) => ownedItemSet.has(id));
  const nextPackedIds = Array.from(new Set([...getPackedItemIds(), ...packableIds]));

  savePackedItemIds(nextPackedIds);
  return nextPackedIds;
};

export const unpackItemIds = (itemIds: ItemId[]) => {
  const removingIds = new Set(itemIds);
  const nextPackedIds = getPackedItemIds().filter((id) => !removingIds.has(id));

  savePackedItemIds(nextPackedIds);
  return nextPackedIds;
};

export const getInUseItemIds = (): ItemId[] => {
  if (typeof window === "undefined") return [];
  return parseStoredIds(
    localStorage.getItem(IN_USE_ITEMS_KEY),
    POCKET_ITEMS.map((item) => item.id)
  );
};

export const saveInUseItemIds = (itemIds: ItemId[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(IN_USE_ITEMS_KEY, JSON.stringify(Array.from(new Set(itemIds))));
  window.dispatchEvent(new Event("storage"));
};

export const checkoutItemId = (itemId: ItemId) => {
  const nextPackedIds = getPackedItemIds().filter((id) => id !== itemId);
  const nextInUseIds = Array.from(new Set([...getInUseItemIds(), itemId]));

  savePackedItemIds(nextPackedIds);
  saveInUseItemIds(nextInUseIds);

  return {
    ownedItemIds: getOwnedItemIds(),
    packedItemIds: nextPackedIds,
    inUseItemIds: nextInUseIds,
  };
};

export const returnItemIdsToHome = (itemIds: ItemId[]) => {
  const returningIds = Array.from(new Set(itemIds));
  if (returningIds.length === 0) {
    return {
      ownedItemIds: getOwnedItemIds(),
      packedItemIds: getPackedItemIds(),
      inUseItemIds: getInUseItemIds(),
    };
  }

  const nextInUseIds = getInUseItemIds().filter((id) => !returningIds.includes(id));

  saveInUseItemIds(nextInUseIds);

  return {
    ownedItemIds: getOwnedItemIds(),
    packedItemIds: getPackedItemIds(),
    inUseItemIds: nextInUseIds,
  };
};

export const getBuiltHomeRoomIds = () => {
  if (typeof window === "undefined") return [];
  return parseStoredIds(
    localStorage.getItem(HOME_ROOMS_KEY),
    HOME_ITEM_ROOMS.map((room) => room.id)
  );
};

export const saveBuiltHomeRoomIds = (roomIds: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOME_ROOMS_KEY, JSON.stringify(Array.from(new Set(roomIds))));
  window.dispatchEvent(new Event("storage"));
};

export const recordItemUse = (record: ItemUseRecord) => {
  if (typeof window === "undefined") return;

  try {
    const saved = JSON.parse(localStorage.getItem(ITEM_RECORDS_KEY) || "[]");
    const records = Array.isArray(saved) ? saved : [];
    records.push(record);
    localStorage.setItem(ITEM_RECORDS_KEY, JSON.stringify(records));
  } catch {
    localStorage.setItem(ITEM_RECORDS_KEY, JSON.stringify([record]));
  }
};
