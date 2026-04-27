import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAddPlayer } from "@/lib/api";

export default function AddPlayer() {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("123456");
  const addPlayerMutation = useAddPlayer();

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

  return (
    <div className="space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tổng quan
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Quản lý tay vợt</p>
        <h1 className="font-display text-2xl font-bold">Thêm Tay Vợt</h1>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-surface/70 p-5 space-y-5">
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

        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground">
          Tay vợt mới khởi điểm <span className="font-mono-stat font-semibold text-foreground">1200 ĐH</span> (hạng Bạc) và sẽ được xếp hạng động từ trận đấu đầu tiên.
        </div>

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
          <UserPlus className="size-4" />
          {addPlayerMutation.isPending ? "Đang tạo…" : "Tạo tay vợt"}
        </button>
      </form>
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