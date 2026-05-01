import { cn } from "@/lib/utils";
import { getTier } from "@/lib/tiers";
import type { TierKey } from "@/lib/types";

const TIER_STYLES: Record<TierKey, string> = {
  bronze:   "bg-tier-bronze/15   text-tier-bronze   ring-tier-bronze/30",
  silver:   "bg-tier-silver/15   text-tier-silver   ring-tier-silver/30",
  gold:     "bg-tier-gold/15     text-tier-gold     ring-tier-gold/30",
  platinum: "bg-tier-platinum/15 text-tier-platinum ring-tier-platinum/30",
  pro:      "bg-tier-pro/15      text-tier-pro      ring-tier-pro/40",
};

interface TierBadgeProps {
  elo?: number;
  tier?: TierKey;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({ elo, tier, size = "sm", showLabel = true, className }: TierBadgeProps) {
  const VN_LABEL: Record<TierKey, string> = {
    bronze: "Đồng",
    silver: "Bạc",
    gold: "Vàng",
    platinum: "Bạch Kim",
    pro: "Cao Thủ",
  };
  const resolved = tier
    ? { key: tier, label: VN_LABEL[tier] }
    : getTier(elo ?? 1000);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-[11px] gap-1",
    lg: "px-2.5 py-1 text-sm gap-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-display font-semibold uppercase tracking-wider ring-1 ring-inset",
        TIER_STYLES[resolved.key as TierKey],
        sizeClasses,
        className,
      )}
    >
      {showLabel && resolved.label}
    </span>
  );
}