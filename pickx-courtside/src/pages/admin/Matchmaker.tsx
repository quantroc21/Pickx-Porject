import { useState } from "react";
import { ArrowLeft, Loader2, Shuffle, Play, MessageSquare, Copy, Check, Activity, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { usePlayers, useMatchmaker, useAssignCourt } from "@/lib/api";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { TierBadge } from "@/components/pickx/TierBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProposedMatch {
  court: number;
  courtName: string;
  team1: string[];
  team2: string[];
  delta: number;
}

export default function Matchmaker() {
  const { data: players = [] } = usePlayers();
  const matchmakerMutation = useMatchmaker();
  const assignMutation = useAssignCourt();
  
  // Load initial states from localStorage
  const [selectedCourts, setSelectedCourts] = useState<number[]>(() => {
    const saved = localStorage.getItem("pickx_selected_courts");
    return saved ? JSON.parse(saved) : [1, 2];
  });

  const [active, setActive] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("pickx_active_players");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [generating, setGenerating] = useState(false);
  const [proposed, setProposed] = useState<ProposedMatch[] | null>(null);

  // Persistence Effects
  function updateCourts(newCourts: number[]) {
    setSelectedCourts(newCourts);
    localStorage.setItem("pickx_selected_courts", JSON.stringify(newCourts));
  }

  function updateActive(newActive: Set<string>) {
    setActive(newActive);
    localStorage.setItem("pickx_active_players", JSON.stringify(Array.from(newActive)));
  }

  function toggleCourt(n: number) {
    const next = selectedCourts.includes(n) 
      ? selectedCourts.filter(x => x !== n) 
      : [...selectedCourts, n].sort();
    updateCourts(next);
    setProposed(null);
  }

  function toggle(id: string) {
    const next = new Set(active);
    next.has(id) ? next.delete(id) : next.add(id);
    updateActive(next);
    setProposed(null);
  }

  function generate() {
    if (active.size < 4) {
      toast.error("Cần ít nhất 4 tay vợt có mặt để ghép trận.");
      return;
    }
    if (selectedCourts.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sân đấu.");
      return;
    }

    setGenerating(true);
    setProposed(null);
    matchmakerMutation.mutate(Array.from(active), {
      onSuccess: (data) => {
        setGenerating(false);
        // Map the generated matches to our SELECTED court numbers
        const matches: ProposedMatch[] = data.courts.slice(0, selectedCourts.length).map((c: any, i: number) => {
           const t1Avg = c.team1.reduce((sum: number, id: string) => sum + (players.find((p) => p.id === id)?.elo || 1000), 0) / 2;
           const t2Avg = c.team2.reduce((sum: number, id: string) => sum + (players.find((p) => p.id === id)?.elo || 1000), 0) / 2;
           const courtNum = selectedCourts[i];
           return {
             court: courtNum,
             courtName: `Sân ${courtNum}`,
             team1: c.team1,
             team2: c.team2,
             delta: Math.round(Math.abs(t1Avg - t2Avg))
           };
        });
        setProposed(matches);
      },
      onError: () => {
        setGenerating(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tổng quan
      </Link>

      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Cân tài thông minh</p>
          <h1 className="font-display text-2xl font-bold">Ghép Trận</h1>
        </div>
        <div className="rounded-full bg-surface px-3 py-1.5 text-[11px] font-semibold ring-1 ring-border/60">
          <span className="stat-number text-primary">{active.size}</span>{" "}
          <span className="text-muted-foreground">có mặt</span>
        </div>
      </header>

      {/* Court Selection Config */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Cấu hình sân Social (Cụm 6 sân)
          </h2>
          <span className="text-[10px] text-primary/60 font-bold uppercase tracking-tight">{selectedCourts.length} sân đang dùng</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const isSel = selectedCourts.includes(n);
            return (
              <button
                key={n}
                onClick={() => toggleCourt(n)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl py-3 border transition-all",
                  isSel 
                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(193,255,114,0.1)]" 
                    : "bg-surface border-border/40 text-muted-foreground opacity-50"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Sân</span>
                <span className="font-display text-lg font-black leading-none">{n}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface/70 p-3">
        <ul className="divide-y divide-border/40 max-h-[300px] overflow-y-auto pr-1">
          {players.map((p) => {
            const isOn = active.has(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <PlayerAvatar player={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <TierBadge elo={p.elo} />
                    <span className="stat-number">{p.elo}</span>
                  </div>
                </div>
                <Switch checked={isOn} onCheckedChange={() => toggle(p.id)} aria-label={`Bật/tắt ${p.name}`} />
              </li>
            );
          })}
          {players.length === 0 && (
            <li className="py-8 text-center text-xs text-muted-foreground">Chưa có người chơi nào đăng ký.</li>
          )}
        </ul>
      </section>

      <button
        onClick={generate}
        disabled={generating || active.size < 4 || selectedCourts.length === 0}
        className={cn(
          "h-14 w-full rounded-2xl font-display text-sm font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2",
          active.size >= 4 && selectedCourts.length > 0
            ? "bg-gradient-primary text-primary-foreground shadow-glow active:scale-95"
            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
        )}
      >
        {generating ? <Loader2 className="size-5 animate-spin" /> : <Shuffle className="size-5" />}
        Xếp Trận Thông Minh
      </button>

      {generating && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-shimmer rounded-2xl border border-border/40 bg-surface/40" />
          ))}
        </div>
      )}

      {proposed && proposed.length > 0 && (
        <section className="space-y-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
            Cặp đấu · {proposed.length} trận
          </h2>
          </div>
          {proposed.map((m) => (
            <ProposedCard 
              key={m.court} 
              match={m} 
              players={players} 
              onAssign={(match) => {
                assignMutation.mutate({
                  courtIdx: match.court - 1,
                  team1Ids: match.team1,
                  team2Ids: match.team2
                });
              }}
              isAssigning={assignMutation.isPending}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ProposedCard({ match, players, onAssign, isAssigning }: { match: ProposedMatch, players: Player[], onAssign: (m: ProposedMatch) => void, isAssigning: boolean }) {
  const t1 = match.team1.map((id) => players.find((p) => p.id === id)!).filter(Boolean);
  const t2 = match.team2.map((id) => players.find((p) => p.id === id)!).filter(Boolean);
  return (
    <article className="group relative rounded-2xl border border-border/40 bg-gradient-court p-4 transition-all hover:border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-display text-base font-bold text-primary/80">{match.courtName}</p>
        </div>
        <span className="rounded-full bg-surface/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-border/60">
          Lệch ±{match.delta} ĐH
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide players={t1} align="left" />
        <p className="font-display text-xs font-bold uppercase text-muted-foreground/40">vs</p>
        <TeamSide players={t2} align="right" />
        
        <div className="col-span-3 mt-4 flex justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAssign(match);
            }}
            disabled={isAssigning}
            style={{ background: 'var(--gradient-assign)' }}
            className="flex items-center justify-center gap-2 rounded-xl px-8 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isAssigning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
            Bắt Đầu Trận
          </button>
        </div>
      </div>
    </article>
  );
}

function TeamSide({ players, align }: { players: Player[]; align: "left" | "right" }) {
  return (
    <div className={cn("flex flex-col gap-1.5", align === "right" && "items-end text-right")}>
      {players.map((p) => (
        <div key={p.id} className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
          <PlayerAvatar player={p} size="sm" />
          <div className={cn("leading-tight", align === "right" && "text-right")}>
            <p className="font-display text-xs font-semibold">{p.name.split(" ")[0]}</p>
            <p className="stat-number text-[10px] text-muted-foreground">{p.elo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}