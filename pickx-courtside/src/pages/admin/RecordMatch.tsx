import { useState } from "react";
import { ArrowLeft, Check, Trophy, Radio, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PlayerPicker } from "@/components/pickx/PlayerPicker";
import { usePlayers, useRecordMatch, useLiveCourts, useCancelCourt } from "@/lib/api";
import type { Player, Court } from "@/lib/types";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Pickleball score validation ────────────────────────────── */
function isValidPickleballScore(s1: number, s2: number, targetScore: number): { valid: boolean; message: string } {
  const hi = Math.max(s1, s2);
  const lo = Math.min(s1, s2);

  if (s1 === s2) return { valid: false, message: "Tỉ số không được hoà." };
  if (hi < targetScore) return { valid: false, message: `Ít nhất một đội phải đạt ${targetScore} điểm để thắng.` };
  if (lo >= targetScore - 1 && (hi - lo) < 2) return { valid: false, message: `Khi tỉ số sát nút, đội thắng phải hơn 2 điểm (hiện ${hi}–${lo}).` };
  if (lo < targetScore - 1 && hi !== targetScore) return { valid: false, message: `Nếu đội thua dưới ${targetScore - 1} điểm thì đội thắng phải đúng ${targetScore} điểm.` };

  return { valid: true, message: "" };
}

export default function RecordMatch() {
  const navigate = useNavigate();
  const recordMutation = useRecordMatch();
  const { data: liveCourtsData } = useLiveCourts();
  const courts = liveCourtsData?.courts ?? [];
  const activeCourts = courts.filter((c) => c.status === "warmup" || c.status === "live");

  const [targetScore, setTargetScore] = useState<number>(11);
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  const scoreCheck = isValidPickleballScore(score1, score2, targetScore);
  const ready = team1.length === 2 && team2.length === 2 && scoreCheck.valid;
  const winner = score1 === score2 ? null : score1 > score2 ? 1 : 2;

  function selectCourt(court: Court) {
    setTeam1([...court.team1]);
    setTeam2([...court.team2]);
    setSelectedCourtId(court.id);
    setScore1(0);
    setScore2(0);
  }

  function handleOpenConfirm() {
    if (!scoreCheck.valid) {
      toast.error(scoreCheck.message);
      return;
    }
    setConfirmOpen(true);
  }

  function submit() {
    setConfirmOpen(false);
    recordMutation.mutate(
      { team1Ids: team1, team2Ids: team2, score1, score2, targetScore },
      { onSuccess: () => navigate("/admin") }
    );
  }

  const cancelMutation = useCancelCourt();
  const [cancellingIdx, setCancellingIdx] = useState<number | null>(null);

  function handleCancelCourt(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn huỷ trận đấu này? Toàn bộ tay vợt sẽ được giải phóng.")) {
      cancelMutation.mutate(idx, {
        onSuccess: () => {
          toast.success("Đã huỷ trận đấu!");
          if (selectedCourtId === `c${idx}`) setSelectedCourtId(null);
        }
      });
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tổng quan
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Trận mới</p>
        <h1 className="font-display text-2xl font-bold">Ghi Nhận Trận Đấu</h1>
      </header>

      {/* ── Live Courts Quick-Select ────────────────────────── */}
      {activeCourts.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-primary animate-pulse" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Chọn nhanh từ sân đang đấu
            </p>
          </div>
          <div className="grid gap-2">
            {activeCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                isSelected={selectedCourtId === court.id}
                onSelect={() => selectCourt(court)}
                onCancel={(e) => handleCancelCourt(courts.indexOf(court), e)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Divider or Manual Picker ──────────────────────── */}
      {activeCourts.length > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border/60" />
          <span className="font-semibold uppercase tracking-widest">Hoặc chọn thủ công</span>
          <span className="h-px flex-1 bg-border/60" />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <PlayerPicker label="Đội 1" selected={team1} onChange={(ids) => { setTeam1(ids); setSelectedCourtId(null); }} disabledIds={team2} accent="primary" />
        <PlayerPicker label="Đội 2" selected={team2} onChange={(ids) => { setTeam2(ids); setSelectedCourtId(null); }} disabledIds={team1} accent="accent" />
      </div>

      {/* ── Score entry ───────────────────────────────────── */}
      <section className="rounded-2xl border border-border/60 bg-surface/70 p-5">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Tỉ số chung cuộc</p>
          <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1 border border-border/60">
            <button
              onClick={() => { setTargetScore(11); setScore1(0); setScore2(0); }}
              className={cn("px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all", targetScore === 11 ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground")}
            >
              Đến 11
            </button>
            <button
              onClick={() => { setTargetScore(15); setScore1(0); setScore2(0); }}
              className={cn("px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all", targetScore === 15 ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground")}
            >
              Đến 15
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4">
          <ScoreColumn label="Đội 1" ids={team1} value={score1} onChange={setScore1} winning={winner === 1} />
          <p className="font-display text-lg font-bold text-muted-foreground sm:text-2xl">vs</p>
          <ScoreColumn label="Đội 2" ids={team2} value={score2} onChange={setScore2} winning={winner === 2} />
        </div>

        {/* Validation feedback */}
        {(score1 > 0 || score2 > 0) && !scoreCheck.valid && (
          <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-center text-xs font-medium text-danger ring-1 ring-danger/20">
            {scoreCheck.message}
          </p>
        )}
        {(score1 > 0 || score2 > 0) && scoreCheck.valid && (
          <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-center text-xs font-medium text-success ring-1 ring-success/20">
            ✓ Tỉ số hợp lệ theo luật Pickleball
          </p>
        )}
      </section>

      <button
        type="button"
        disabled={!ready}
        onClick={handleOpenConfirm}
        className={cn(
          "h-14 w-full rounded-2xl font-display text-base font-bold uppercase tracking-wider transition-all",
          ready
            ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99]"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <Trophy className="size-5" />
          Ghi nhận trận
        </span>
      </button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Xác nhận kết quả</DialogTitle>
            <DialogDescription>
              Tỉ số chung cuộc: <span className="font-bold text-foreground">{score1} – {score2}</span>. Elo của cả 4 tay vợt sẽ được tính lại theo luật Pickleball.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-11 rounded-lg border border-border/60 bg-surface px-4 text-sm font-semibold hover:bg-muted/40"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={submit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-primary px-5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Check className="size-4" /> Xác nhận
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Court Quick-Select Card ──────────────────────────────── */
function CourtCard({ court, isSelected, onSelect, onCancel }: { court: Court; isSelected: boolean; onSelect: () => void; onCancel: (e: React.MouseEvent) => void }) {
  const { data: players = [] } = usePlayers();
  const t1 = court.team1.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  const t2 = court.team2.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:cursor-pointer",
        isSelected
          ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30 shadow-glow"
          : "border-border/60 bg-surface/70 hover:border-primary/30 hover:shadow-card",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg font-display text-xs font-bold uppercase",
          isSelected ? "bg-primary text-primary-foreground" : "bg-background text-primary",
        )}
      >
        {court.name.replace("Court ", "")}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
        {/* Team 1 */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex shrink-0 gap-1.5">
            {t1.map((p) => (
              <PlayerAvatar key={p.id} player={p} size="xs" ring />
            ))}
          </div>
          <p className="truncate text-xs font-bold text-foreground">
            {t1.map(p => p.name.split(' ').pop()).join(" + ")}
          </p>
        </div>

        {/* VS Divider - Tiny line */}
        <div className="flex items-center gap-2">
          <div className="h-px w-4 bg-border/40" />
          <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50">VS</span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex shrink-0 gap-1.5">
            {t2.map((p) => (
              <PlayerAvatar key={p.id} player={p} size="xs" ring />
            ))}
          </div>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {t2.map(p => p.name.split(' ').pop()).join(" + ")}
          </p>
        </div>
      </div>
      {isSelected && (
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/30">
          ĐÃ CHỌN
        </span>
      )}
      
      {!isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(e);
          }}
          className="group/btn grid size-8 place-items-center rounded-lg bg-surface text-muted-foreground ring-1 ring-border/60 hover:bg-danger/10 hover:text-danger hover:ring-danger/30 transition-all"
          title="Huỷ trận"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ── Score Column ──────────────────────────────────────────── */
function ScoreColumn({
  label,
  ids,
  value,
  onChange,
  winning,
}: {
  label: string;
  ids: string[];
  value: number;
  onChange: (n: number) => void;
  winning: boolean;
}) {
  const { data: players = [] } = usePlayers();
  const tplayers = ids.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{label}</p>
        <p className="max-w-[120px] truncate text-[11px] font-black uppercase text-primary">
          {tplayers.length > 0 ? tplayers.map(p => p.name.split(' ').pop()).join(" & ") : "Chưa chọn"}
        </p>
      </div>
      <div className="flex gap-2">
        {tplayers.length > 0 ? (
          tplayers.map((p) => <PlayerAvatar key={p.id} player={p} size="md" ring />)
        ) : (
          <div className="grid size-11 place-items-center rounded-full border border-dashed border-border/60 text-xs text-muted-foreground">
            ?
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid size-7 place-items-center rounded-full border border-border/60 bg-background text-sm font-bold hover:border-primary/40 sm:size-10 sm:text-lg"
          aria-label="Decrease"
        >
          –
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={15}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
          className={cn(
            "h-10 w-12 rounded-lg border bg-background text-center font-display text-xl font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/40 sm:h-16 sm:w-20 sm:rounded-2xl sm:text-3xl",
            winning ? "border-primary text-primary shadow-glow" : "border-border/60",
          )}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(15, value + 1))}
          className="grid size-7 place-items-center rounded-full border border-border/60 bg-background text-sm font-bold hover:border-primary/40 sm:size-10 sm:text-lg"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
}