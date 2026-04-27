import { Link } from "react-router-dom";
import { Radio, Clock, Swords, Flame, Zap, Skull } from "lucide-react";
import { useLiveCourts, usePlayers } from "@/lib/api";
import { useUserAuth } from "@/hooks/useUserAuth";
import type { Player, Court } from "@/lib/types";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { TierBadge } from "@/components/pickx/TierBadge";
import { cn } from "@/lib/utils";

export default function LiveCourts() {
  const { data: { courts = [], bench = [] } = {}, isLoading: courtsLoading } = useLiveCourts();
  const { data: players = [], isLoading: pLoading } = usePlayers();
  const { userId } = useUserAuth();

  if (courtsLoading || pLoading)
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang kiểm tra lịch sân…</div>;

  const activeCourts = courts.filter((c) => c.status === "live" || c.status === "warmup");

  // Find the court this user is assigned to
  const myCourt = userId
    ? activeCourts.find((c) => [...c.team1, ...c.team2].includes(userId))
    : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Trận đấu</p>
        <h1 className="font-display text-2xl font-bold">Sân Đấu Trực Tiếp</h1>
      </header>

      {/* Global Empty State */}
      {activeCourts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-slide-up">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
            <img 
              src="/mascot.png" 
              alt="Mascot" 
              className="relative w-48 h-48 object-contain drop-shadow-2xl animate-float"
            />
            <div className="absolute -right-4 top-4 bg-surface-elevated border border-border/60 rounded-2xl p-3 shadow-xl max-w-[160px] animate-bounce-in">
              <p className="text-[10px] font-bold leading-tight text-foreground">
                {(() => {
                  const msgs = [
                    "Đang lựa đối thủ 'vừa miếng' cho bạn đây...",
                    "Uống miếng nước, lau mồ hôi rồi chuẩn bị 'vụt' tiếp nào!",
                    "Vợt đã sẵn sàng, chỉ chờ lệnh từ BTC thôi!",
                    "Đừng nhìn điện thoại nữa, khởi động cổ tay đi kìa!",
                    "Tranh thủ làm vài ván khởi động trong lúc chờ sân nhé!",
                    "Nghe nói ai kiên nhẫn chờ đợi sẽ được xếp sân đẹp?"
                  ];
                  return msgs[Math.floor(Date.now() / 10000) % msgs.length];
                })()}
              </p>
              <div className="absolute -left-1.5 top-4 size-3 bg-surface-elevated border-l border-t border-border/60 rotate-45" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold tracking-tight">Hiện không có trận nào</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-70">
              BTC đang sắp xếp lượt thi đấu tiếp theo. Hãy nạp năng lượng nhé!
            </p>
          </div>
        </div>
      )}

      {!userId && activeCourts.length > 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Bạn chưa đăng nhập. Hãy đăng nhập để xem lịch thi đấu cá nhân.</p>
          <Link to="/login" className="inline-block rounded-lg bg-primary/15 px-4 py-2 text-xs font-bold text-primary ring-1 ring-primary/30 hover:bg-primary/25 transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {userId && !myCourt && activeCourts.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-surface/70 p-8 text-center space-y-3">
          <Clock className="mx-auto size-10 text-muted-foreground opacity-40" />
          <p className="font-display text-lg font-bold">Chưa có trận nào cho bạn</p>
          <p className="text-sm text-muted-foreground">
            Ban Tổ Chức chưa xếp bạn vào sân nào. Hãy chờ hoặc hỏi BTC!
          </p>
        </div>
      )}

      {userId && myCourt && (
        <MyCourtHero court={myCourt} players={players} userId={userId} />
      )}

      {/* Bench / Waiting List */}
      {bench.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đang chờ lượt (Bench)</h2>
          <div className="flex flex-wrap gap-2">
            {bench.map(id => {
              const p = players.find(x => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-2 rounded-full bg-surface/50 border border-border/40 py-1.5 pl-1.5 pr-3 ring-1 ring-inset ring-border/20">
                  <PlayerAvatar player={p} size="xs" />
                  <span className="text-[10px] font-bold">{p.name.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Hero Card: the user's assigned match ─────────────────── */
function MyCourtHero({ court, players, userId }: { court: Court; players: Player[]; userId: string }) {
  const onTeam1 = court.team1.includes(userId);
  const myTeamIds = onTeam1 ? court.team1 : court.team2;
  const oppTeamIds = onTeam1 ? court.team2 : court.team1;

  const partnerId = myTeamIds.find((id) => id !== userId);
  const partner = players.find((p) => p.id === partnerId);
  const opponents = oppTeamIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];

  const myTeamAvg = myTeamIds.reduce((sum, id) => sum + (players.find((p) => p.id === id)?.elo || 1000), 0) / 2;
  const oppTeamAvg = oppTeamIds.reduce((sum, id) => sum + (players.find((p) => p.id === id)?.elo || 1000), 0) / 2;
  const winProb = Math.round((1 / (1 + Math.pow(10, (oppTeamAvg - myTeamAvg) / 400))) * 100);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Visual Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border liquid-glass p-7 shadow-sm">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Sẵn sàng thi đấu
            </span>
            <h2 className="font-display text-6xl font-black text-foreground tracking-tighter leading-none">{court.name}</h2>
          </div>
          <div className="text-right pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Xác suất thắng</p>
            <p className="stat-number text-4xl font-black text-primary leading-none">{winProb}%</p>
          </div>
        </div>
      </section>

      {/* The Matchup Card */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="grid divide-y divide-border">
          {/* My Team */}
          <div className="p-4 bg-primary/5">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-primary/20" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">Đội của bạn</p>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {players.find(p => p.id === userId) ? (
                <CompactPlayerRow player={players.find(p => p.id === userId)!} label="BẠN" />
              ) : (
                <div className="h-12 animate-pulse rounded-xl bg-muted" />
              )}
              {partner && <CompactPlayerRow player={partner} label="ĐỒNG ĐỘI" />}
            </div>
          </div>

          {/* VS Divider */}
          <div className="relative h-10 bg-background/50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background px-5 py-1.5 rounded-full border border-border shadow-lg">
                <Swords className="size-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Opponents */}
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Đối thủ</p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {opponents.map((opp) => (
                <CompactPlayerRow key={opp.id} player={opp} showWinRate />
              ))}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="bg-background/80 p-3 border-t border-border">
          <div className="flex items-center justify-between px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Sức mạnh đội: <b className="text-foreground">{Math.round(myTeamAvg)}</b></span>
            <span>Đối thủ: <b className="text-foreground">{Math.round(oppTeamAvg)}</b></span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CompactPlayerRow({ player, label, showWinRate }: { player: Player; label?: string; showWinRate?: boolean }) {
  const winRate = Math.round((player.wins / Math.max(1, player.wins + player.losses)) * 100);
  return (
    <Link to={`/player/${player.id}`} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50">
      <PlayerAvatar player={player} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-base font-bold">{player.name}</p>
          {player.streak >= 3 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-950/60 px-2.5 py-1 text-[10px] font-bold text-orange-400 ring-1 ring-orange-500/30">
              <Flame className="size-3 text-orange-500 fill-orange-500" />
              NHÀO VÔ · {player.streak}
            </div>
          )}
          {player.streak === 2 && (
            <div className="inline-flex items-center rounded-full font-display font-semibold uppercase tracking-wider ring-1 ring-inset px-1.5 py-0.5 text-[8px] gap-1 bg-warning/10 text-warning/70 ring-warning/20">
              <Zap className="size-2" /> HƯNG PHẤN
            </div>
          )}
          {player.streak <= -3 && (
            <div className="inline-flex items-center rounded-full font-display font-semibold uppercase tracking-wider ring-1 ring-inset px-1.5 py-0.5 text-[8px] gap-1 bg-accent/15 text-accent ring-accent/30">
              <Skull className="size-2" /> BẦM DẬP · {Math.abs(player.streak)}
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <TierBadge elo={player.elo} size="sm" />
          {showWinRate && <span>WR {winRate}%</span>}
        </div>
      </div>
      <div className="text-right">
        <p className="stat-number text-sm font-bold">{player.elo}</p>
        <p className="text-[9px] uppercase tracking-tighter text-muted-foreground">ĐH</p>
      </div>
    </Link>
  );
}
