import { useState } from "react";
import { ArrowLeft, UserPlus, Trash2, Search, Loader2, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAddPlayer, usePlayers, useDeletePlayer, useResetPassword } from "@/lib/api";
import { PlayerAvatar } from "@/components/pickx/PlayerAvatar";
import { TierBadge } from "@/components/pickx/TierBadge";

export default function AddPlayer() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("123456");
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [search, setSearch] = useState("");
  
  const { data: players = [], isLoading } = usePlayers();
  const addPlayerMutation = useAddPlayer();
  const deleteMutation = useDeletePlayer();
  const resetPasswordMutation = useResetPassword();

  const ready = name.trim().length >= 2 && password.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    addPlayerMutation.mutate({ name: name.trim(), password: password.trim(), skillLevel }, {
      onSuccess: () => {
        setName("");
        setHandle("");
        setPassword("123456");
        setSkillLevel("intermediate");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Bạn có chắc muốn xoá tay vợt "${name}"? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(id);
    }
  }

  function handleResetPassword(id: string, name: string) {
    if (window.confirm(`Bạn có chắc muốn đặt lại mật khẩu của "${name}" về mặc định là '123456' không?`)) {
      resetPasswordMutation.mutate(id);
    }
  }

  const filtered = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.handle || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const SKILL_OPTIONS = [
    { value: "beginner", label: "Mới tập chơi", desc: "Khởi điểm 950 Elo" },
    { value: "intermediate", label: "Chơi được rồi", desc: "Khởi điểm 1000 Elo" },
    { value: "advanced", label: "Khá / Chơi lâu", desc: "Khởi điểm 1025 Elo" },
    { value: "expert", label: "Rất giỏi", desc: "Khởi điểm 1050 Elo" },
  ];

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

          <Field label="Trình độ ban đầu" required hint="Giúp hệ thống xếp trận cân ngay từ đầu">
            <div className="grid grid-cols-2 gap-2">
              {SKILL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSkillLevel(opt.value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                    skillLevel === opt.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border/60 bg-background hover:bg-surface-elevated"
                  )}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetPassword(p.id, p.name)}
                      className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60 hover:bg-warning/10 hover:text-warning hover:ring-warning/30 transition-all"
                      title="Khôi phục mật khẩu (123456)"
                    >
                      <Key className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border/60 hover:bg-danger/10 hover:text-danger hover:ring-danger/30 transition-all"
                      title="Xoá tay vợt"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
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