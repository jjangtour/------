export type LevelInfo = {
  level: number;
  title: string;
  badge: string;
  currentXpInLevel: number;
  xpNeededForNext: number;
  totalXp: number;
};

export function getLevelInfo(totalXp: number): LevelInfo {
  const level = Math.floor(totalXp / 200) + 1;
  const titles = [
    "새싹 이음이",
    "초보 이음이",
    "튼튼 이음이",
    "반짝 이음이",
    "안전 마스터",
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  const currentXpInLevel = totalXp % 200;

  return {
    level,
    title,
    badge: title.split(" ")[0] || "새싹",
    currentXpInLevel,
    xpNeededForNext: 200,
    totalXp,
  };
}
