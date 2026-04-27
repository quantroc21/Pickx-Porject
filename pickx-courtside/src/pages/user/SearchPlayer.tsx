import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { usePlayers } from "@/lib/api";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { TierBadge } from "@/components/pickx/TierBadge";
import { cn } from "@/lib/utils";

export default function SearchPlayer() {
  const [q, setQ] = useState("");
  const { data: rawPlayers = [], isLoading } = usePlayers();

  const ranked = useMemo(() => {
    return (rawPlayers || [])
      .filter((p: any) => p && typeof p === "object" && "elo" in p)
      .sort((a,b) => b.elo - a.elo);
  }, [rawPlayers]);

  const results = useMemo(() => {
    if (!q.trim()) return ranked;
    const needle = q.toLowerCase();
    return rawPlayers.filter(
      (p) => p.name.toLowerCase().includes(needle) || p.handle.toLowerCase().includes(needle),
    );
  }, [q, ranked, rawPlayers]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải biểu mẫu dữ liệu...</div>;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Tìm tay vợt</p>
        <h1 className="font-display text-2xl font-bold">Tra Cứu</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc @username"
          className={cn(
            "h-12 w-full rounded-xl border border-border/60 bg-surface pl-10 pr-10 text-base font-medium",
            "placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted/50"
            aria-label="Clear"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {q ? `${results.length} kết quả` : "Tất cả tay vợt"}
      </p>

      <ul className="space-y-2">
        {results.map((p) => (
          <li key={p.id}>
            <Link
              to={`/player/${p.id}`}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <PlayerAvatar player={p} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">@{p.handle}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TierBadge elo={p.elo} />
                <span className="stat-number text-xs font-semibold text-muted-foreground">{p.elo} ĐH</span>
              </div>
            </Link>
          </li>
        ))}
        {results.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Không tìm thấy tay vợt nào khớp "{q}".
          </li>
        )}
      </ul>
    </div>
  );
}