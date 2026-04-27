import { useState } from "react";
import { Check, Search } from "lucide-react";
import { usePlayers } from "@/lib/api";
import { PlayerAvatar } from "./PlayerAvatar";
import { TierBadge } from "./TierBadge";
import { cn } from "@/lib/utils";

interface PlayerPickerProps {
  label: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  disabledIds?: string[];
  max?: number;
  accent?: "primary" | "accent";
}

export function PlayerPicker({
  label,
  selected,
  onChange,
  disabledIds = [],
  max = 2,
  accent = "primary",
}: PlayerPickerProps) {
  const { data: MOCK_PLAYERS = [] } = usePlayers();
  const [q, setQ] = useState("");
  const filtered = MOCK_PLAYERS.filter(
    (p) =>
      !q.trim() ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.handle.toLowerCase().includes(q.toLowerCase()),
  );

  function toggle(id: string) {
    if (disabledIds.includes(id)) return;
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (selected.length < max) onChange([...selected, id]);
  }

  const accentClass = accent === "primary" ? "text-primary" : "text-accent";
  const accentBg = accent === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground";

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/70 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className={cn("font-display text-sm font-bold uppercase tracking-[0.18em]", accentClass)}>{label}</h3>
        <span className="stat-number text-xs text-muted-foreground">
          {selected.length}/{max}
        </span>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tay vợt..."
          className="h-10 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          const isDisabled = disabledIds.includes(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                disabled={isDisabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/40 bg-background/50 hover:border-primary/30",
                  isDisabled && "cursor-not-allowed opacity-30 hover:border-border/40",
                )}
              >
                <PlayerAvatar player={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <TierBadge elo={p.elo} />
                    <span className="stat-number">{p.elo}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full transition-all",
                    isSelected ? accentBg : "bg-background ring-1 ring-border/60",
                  )}
                >
                  {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
            Không có tay vợt phù hợp.
          </li>
        )}
      </ul>
    </div>
  );
}