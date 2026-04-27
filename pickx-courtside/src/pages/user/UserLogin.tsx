import { useState } from "react";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserLogin } from "@/lib/api";
import { useUserAuth } from "@/hooks/useUserAuth";
import { cn } from "@/lib/utils";

export default function UserLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useUserLogin();
  const { login } = useUserAuth();
  const navigate = useNavigate();

  const ready = username.trim().length > 0 && password.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    loginMutation.mutate(
      { username: username.trim(), password: password.trim() },
      {
        onSuccess: (data) => {
          login(data.player_id);
          navigate("/");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
         <ArrowLeft className="size-4" /> Bảng xếp hạng
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Danh tính</p>
        <h1 className="font-display text-2xl font-bold">Đăng Nhập Hệ Thống</h1>
      </header>

      <p className="text-sm text-muted-foreground border border-dashed border-primary/30 p-4 rounded-xl bg-primary/5">
        Xin chào! Hãy sử dụng Username và mật khẩu của bạn để đăng nhập. Nếu bạn là người mới, hãy nhấn <b>Đăng ký ngay</b> để bắt đầu hành trình chinh phục bảng xếp hạng PickX!
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Username (Họ tên viết liền)
          </label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="VD: nguyenvana"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          disabled={!ready || loginMutation.isPending}
          className={cn(
            "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-display text-sm font-bold uppercase tracking-wider transition-all",
            ready
              ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {loginMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {loginMutation.isPending ? "Đang xác thực…" : "Đăng nhập"}
        </button>

        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
