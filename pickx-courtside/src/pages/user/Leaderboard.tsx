import { Link } from "react-router-dom";
import { Crown, Flame, Snowflake, TrendingUp, Trophy, Zap, Skull } from "lucide-react";
import { usePlayers } from "@/lib/api";
import { TIER_HEX, getTier } from "@/lib/tiers";
import { TierBadge } from "@/components/pickx/TierBadge";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: rawPlayers = [], isLoading } = usePlayers();
  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang nạp dữ liệu máy chủ...</div>;
  const players = (rawPlayers || [])
    .filter((p: any) => p && typeof p === "object" && "elo" in p)
    .sort((a,b) => b.elo - a.elo);
  
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <div className="relative">
          <div className="absolute inset-0 size-24 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <Trophy className="relative size-16 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold">Chưa có tay vợt nào</h2>
          <p className="text-xs text-muted-foreground">Hãy đăng ký ngay để trở thành người đứng đầu!</p>
        </div>
        <Link to="/signup" className="rounded-full bg-surface px-6 py-2 text-xs font-bold uppercase tracking-wider text-primary ring-1 ring-border/60 hover:bg-primary/10 transition-colors">
          Đăng ký ngay
        </Link>
      </div>
    );
  }

  const first = players[0];
  const second = players[1];
  const third = players[2];
  const rest = players.slice(3);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-podium p-5 pb-3">
        <div className="absolute inset-0 bg-gradient-radial-glow opacity-80" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Mùa giải 04</p>
              <h1 className="font-display text-2xl font-bold leading-tight">Bảng Xếp Hạng</h1>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/60">
              <TrendingUp className="size-3 text-primary" />
              {players.length} tay vợt
            </div>
          </div>

          {/* Podium */}
          <div className="mt-6 grid grid-cols-3 items-end gap-3 min-h-[200px]">
            {second ? <PodiumSpot player={second} place={2} heightCls="h-24" /> : <div className="h-24" />}
            {first ? <PodiumSpot player={first}  place={1} heightCls="h-32" highlight /> : <div className="h-32" />}
            {third ? <PodiumSpot player={third}  place={3} heightCls="h-20" /> : <div className="h-20" />}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Thứ Hạng
          </h2>
          <span className="text-[11px] text-muted-foreground">Hạng · Tay vợt · ĐH</span>
        </div>

        <ul className="space-y-2">
          {rest.map((p, i) => {
            const rank = i + 4;
            const tier = getTier(p.elo);
            const winRate = Math.round((p.wins / Math.max(1, p.wins + p.losses)) * 100);
            return (
              <li key={p.id}>
                <Link
                  to={`/player/${p.id}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-border/60 bg-surface/70 p-3",
                    "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface hover:shadow-card active:scale-[0.99]",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background font-mono-stat text-xs font-semibold text-muted-foreground ring-1 ring-border/60">
                    {rank}
                  </span>
                  <PlayerAvatar player={p} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4">
                      <p className="truncate font-display text-base font-semibold">{p.name}</p>
                      {p.streak >= 3 && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-orange-950/60 px-2.5 py-1 text-[10px] font-bold text-orange-400 ring-1 ring-orange-500/30">
                          <Flame className="size-3 text-orange-500 fill-orange-500" />
                          NHÀO VÔ · {p.streak}
                        </div>
                      )}
                      {p.streak === 2 && (
                        <div className="flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold text-warning/70 ring-1 ring-warning/20">
                          <Zap className="size-2.5" /> HƯNG PHẤN
                        </div>
                      )}
                      {p.streak <= -3 && (
                        <div className="flex items-center gap-0.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent ring-1 ring-accent/30">
                          <Skull className="size-2.5" /> BẦM DẬP · {Math.abs(p.streak)}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
                      <TierBadge elo={p.elo} size="sm" />
                      <span className="font-mono-stat opacity-60">{winRate}% Thắng</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="stat-number text-lg font-bold leading-none" style={{ color: TIER_HEX[tier.key] }}>
                      {p.elo}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">ĐH</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

import type { Player } from "@/lib/types";

interface PodiumSpotProps {
  player: Player;
  place: 1 | 2 | 3;
  heightCls: string;
  highlight?: boolean;
}

function PodiumSpot({ player, place, heightCls, highlight }: PodiumSpotProps) {
  if (!player) return null;
  const tier = getTier(player.elo);
  const placeColor =
    place === 1
      ? "hsl(var(--tier-gold))"
      : place === 2
      ? "hsl(var(--tier-silver))"
      : "hsl(var(--tier-bronze))";

  return (
    <Link to={`/player/${player.id}`} className="group flex flex-col items-center text-center">
      <div className="relative">
        {highlight && (
          <Crown
            className={cn(
              "absolute left-1/2 size-5 -translate-x-1/2 z-50 drop-shadow-md transition-all duration-300",
              (player.streak && player.streak >= 3) ? "-top-9" : "-top-5"
            )}
            style={{ color: placeColor }}
            fill="currentColor"
          />
        )}
        <div
          className="rounded-full p-[2px] transition-transform group-hover:-translate-y-1"
          style={{ background: `linear-gradient(135deg, ${placeColor}, transparent 80%)` }}
        >
          <PlayerAvatar player={player} size={highlight ? "xl" : "lg"} />
        </div>
      </div>
      <p className="mt-2 line-clamp-1 font-display text-xs font-semibold">{player.name}</p>
      <p className="stat-number text-[15px] font-bold" style={{ color: TIER_HEX[tier.key] }}>
        {player.elo}
      </p>
      <div
        className={cn(
          "mt-2 w-full rounded-t-2xl border-x border-t border-border/40 backdrop-blur-sm flex flex-col items-center justify-center",
          heightCls,
        )}
        style={{
          background: `linear-gradient(180deg, ${placeColor}33 0%, transparent 100%)`,
        }}
      >
        <span
          className={cn(
            "font-display font-black tracking-tighter",
            place === 1 ? "text-3xl" : "text-2xl"
          )}
          style={{ 
            color: placeColor,
            opacity: 0.9,
            textShadow: `0 0 15px ${placeColor}33`
          }}
        >
          #{place}
        </span>
      </div>
    </Link>
  );
}