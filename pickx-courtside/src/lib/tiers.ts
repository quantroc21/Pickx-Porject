import type { Tier, TierKey } from "./types";

export const TIERS: Tier[] = [
  { key: "bronze",   label: "Đồng",     min: 0,    max: 1100, color: "tier-bronze" },
  { key: "silver",   label: "Bạc",      min: 1100, max: 1300, color: "tier-silver" },
  { key: "gold",     label: "Vàng",     min: 1300, max: 1500, color: "tier-gold" },
  { key: "platinum", label: "Bạch Kim", min: 1500, max: 1700, color: "tier-platinum" },
  { key: "pro",      label: "Cao Thủ",  min: 1700, max: Infinity, color: "tier-pro" },
];

export function getTier(elo: number): Tier {
  return TIERS.find((t) => elo >= t.min && elo < t.max) ?? TIERS[0];
}

export function getNextTier(elo: number): Tier | null {
  const current = getTier(elo);
  const idx = TIERS.findIndex((t) => t.key === current.key);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function tierProgress(elo: number): { percent: number; pointsToNext: number; nextLabel: string | null } {
  const current = getTier(elo);
  const next = getNextTier(elo);
  if (!next) return { percent: 100, pointsToNext: 0, nextLabel: null };
  const span = next.min - current.min;
  const into = elo - current.min;
  return {
    percent: Math.max(2, Math.min(100, (into / span) * 100)),
    pointsToNext: Math.round(Math.max(0, next.min - elo)),
    nextLabel: next.label,
  };
}

export const TIER_HEX: Record<TierKey, string> = {
  bronze: "hsl(var(--tier-bronze))",
  silver: "hsl(var(--tier-silver))",
  gold: "hsl(var(--tier-gold))",
  platinum: "hsl(var(--tier-platinum))",
  pro: "hsl(var(--tier-pro))",
};