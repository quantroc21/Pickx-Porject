import { useState } from "react";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAddPlayer } from "@/lib/api";
import { useUserAuth } from "@/hooks/useUserAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserSignup() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const signupMutation = useAddPlayer();
  const { login } = useUserAuth();
  const navigate = useNavigate();

  const ready = 
    name.trim().length >= 2 && 
    password.length >= 4 && 
    password === confirmPassword;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    
    signupMutation.mutate(
      { name: name.trim(), password },
      {
        onSuccess: (data) => {
          login(data.id);
          toast.success("Đăng ký thành công! Chào mừng bạn đến với PickX.");
          navigate("/");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
         <ArrowLeft className="size-4" /> Quay lại Đăng nhập
      </Link>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Tạo tài khoản</p>
        <h1 className="font-display text-2xl font-bold">Gia Nhập Cộng Đồng PickX</h1>
      </header>

      <p className="text-sm text-muted-foreground border border-dashed border-primary/30 p-4 rounded-xl bg-primary/5">
        Hãy điền họ tên thật của bạn để BTC và mọi người có thể nhận diện khi xếp trận. Tên của bạn sẽ được dùng làm ID đăng nhập.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Họ và Tên (Dùng làm Username)
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mật khẩu mới
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 4 ký tự"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            className="h-12 w-full rounded-xl border border-border/60 bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {password && confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-[10px] text-destructive">Mật khẩu xác nhận không khớp</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!ready || signupMutation.isPending}
          className={cn(
            "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-display text-sm font-bold uppercase tracking-wider transition-all",
            ready
              ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] active:scale-[0.99]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {signupMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {signupMutation.isPending ? "Đang xử lý…" : "Đăng ký tham gia"}
        </button>
      </form>
    </div>
  );
}
