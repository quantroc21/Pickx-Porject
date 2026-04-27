import { Link } from "react-router-dom";
import { ClipboardList, Shuffle, UserPlus, Activity, Users, X, Radio } from "lucide-react";
import { useLiveCourts, usePlayers, useMatches, useCancelCourt } from "@/lib/api";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: { courts = [] } = {}, isLoading: courtsLoading } = useLiveCourts();
  const { data: players = [], isLoading: pLoading } = usePlayers();
  const { data: matches = [], isLoading: mLoading } = useMatches();

  const liveCourts = courts.filter((c) => c.status === "live" || c.status === "warmup");
  const liveCount = liveCourts.length;
  const activeCount = players.length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Chào BTC</p>
        <h1 className="font-display text-3xl font-bold leading-tight">Buổi đấu hôm nay</h1>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <KpiCard icon={Activity} label="Sân đang đấu" value={liveCount} accent="primary" />
        <KpiCard icon={Users}    label="Có mặt"        value={activeCount} />
        <KpiCard icon={ClipboardList} label="Trận đã ghi" value={matches.length} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ActionCard
          to="/admin/record"
          title="Ghi trận"
          description="Nhập tỉ số và cập nhật Elo."
          icon={ClipboardList}
        />
        <ActionCard
          to="/admin/matchmaker"
          title="Ghép trận"
          description="Sinh cặp đấu 2v2 cân tài."
          icon={Shuffle}
          highlight
        />
        <ActionCard
          to="/admin/players"
          title="Tay vợt"
          description="Tạo hồ sơ tay vợt mới."
          icon={UserPlus}
        />
      </div>

      {/* ── Live Courts Management ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-primary animate-pulse" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sân đang đấu
            </h2>
          </div>
          {liveCourts.length > 0 && (
             <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ring-1 ring-primary/30">
               {liveCourts.length} SÂN ĐANG HOẠT ĐỘNG
             </span>
          )}
        </div>

        {liveCourts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground text-sm">
            Hiện chưa có trận nào đang diễn ra.
          </div>
        ) : (
          <div className="grid gap-3">
            {liveCourts.map((court) => (
              <LiveCourtCard key={court.id} court={court} players={players} allCourts={courts} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LiveCourtCard({ court, players, allCourts }: { court: any; players: any[]; allCourts: any[] }) {
  const cancelMutation = useCancelCourt();
  const t1 = court.team1.map((id: string) => players.find((p) => p.id === id)).filter(Boolean);
  const t2 = court.team2.map((id: string) => players.find((p) => p.id === id)).filter(Boolean);
  const idx = allCourts.indexOf(court);

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Bạn có muốn huỷ ${court.name}?`)) {
      cancelMutation.mutate(idx, {
        onSuccess: () => toast.success("Đã huỷ trận đấu!")
      });
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/70 p-3 shadow-sm transition-all hover:border-primary/30">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-background font-display text-xs font-bold text-primary ring-1 ring-border/60">
        {court.name.split(" ").pop()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 overflow-hidden text-xs font-bold">
          <span className="truncate">{t1.map((p: any) => p.name.split(" ").pop()).join("+")}</span>
          <span className="text-[10px] text-muted-foreground">VS</span>
          <span className="truncate">{t2.map((p: any) => p.name.split(" ").pop()).join("+")}</span>
        </div>
      </div>
      <button
        onClick={handleCancel}
        className="grid size-8 place-items-center rounded-lg bg-surface text-muted-foreground ring-1 ring-border/60 hover:bg-danger/10 hover:text-danger hover:ring-danger/30 transition-all"
        title="Huỷ trận"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: "primary";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/70 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon className={`size-3.5 ${accent === "primary" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className={`stat-number mt-2 text-2xl font-bold ${accent === "primary" ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function ActionCard({
  to,
  title,
  description,
  icon: Icon,
  highlight,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-card",
        highlight
          ? "border-primary/40 bg-gradient-to-br from-primary/15 via-surface to-surface"
          : "border-border/60 bg-surface/70 hover:border-primary/30"
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl",
          highlight ? "bg-primary text-primary-foreground shadow-glow" : "bg-background text-primary"
        )}
      >
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="absolute right-4 top-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
        Mở →
      </span>
    </Link>
  );
}