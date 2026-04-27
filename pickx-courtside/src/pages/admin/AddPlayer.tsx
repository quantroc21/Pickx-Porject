import { useState } from "react";
import { ArrowLeft, UserPlus, Trash2, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAddPlayer, usePlayers, useDeletePlayer } from "@/lib/api";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { TierBadge } from "@/components/pickx/TierBadge";

export default function AddPlayer() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("123456");
  const [search, setSearch] = useState("");
  
  const { data: players = [], isLoading } = usePlayers();
  const addPlayerMutation = useAddPlayer();
  const deleteMutation = useDeletePlayer();

  const ready = name.trim().length >= 2 && password.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    addPlayerMutation.mutate({ name: name.trim(), password: password.trim() }, {
      onSuccess: () => {
        setName("");
        setHandle("");
        setPassword("123456");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Bạn có chắc muốn xoá tay vợt "${name}"? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(id);
    }
  }

  const filtered = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.handle || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-6">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Tổng quan
        </Link>

        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Quản lý tay vợt</p>
          <h1 className="font-display text-2xl font-bold">Thêm & Quản lý</h1>
        </header>

        <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-surface/70 p-5 space-y-5 shadow-sm">
          <Field label="Họ và tên" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-base placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field label="Username" hint="Dùng để tìm kiếm & chia sẻ hồ sơ">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
                placeholder="nguyenvana"
                className="h-12 w-full rounded-xl border border-border/60 bg-background pl-7 pr-3 text-base placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </Field>

          <Field label="Mật khẩu" required hint="Dùng để đăng nhập User View">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="text"
              className="h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-base placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <button
            type="submit"
            disabled={!ready || addPlayerMutation.isPending}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-display text-sm font-bold uppercase tracking-wider transition-all",
              ready
                ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99]"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {addPlayerMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {addPlayerMutation.isPending ? "Đang tạo…" : "Tạo tay vợt"}
          </button>
        </form>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Danh sách ({players.length})
          </h2>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên..."
              className="h-9 w-full rounded-lg border border-border/60 bg-surface pl-9 pr-3 text-xs focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/70 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary/40" />
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.02]">
                  <PlayerAvatar player={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <TierBadge elo={p.elo} size="sm" />
                      <span className="text-[10px] text-muted-foreground font-mono-stat">{p.elo} DH</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60 hover:bg-danger/10 hover:text-danger hover:ring-danger/30 transition-all"
                    title="Xoá tay vợt"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy tay vợt nào.
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label} {required && <span className="text-primary">*</span>}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}