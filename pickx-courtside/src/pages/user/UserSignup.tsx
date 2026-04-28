import { useState } from "react";
import { ArrowLeft, Loader2, UserPlus, AlertCircle, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAddPlayer } from "@/lib/api";
import { useUserAuth } from "@/hooks/useUserAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserSignup() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  const signupMutation = useAddPlayer();
  const { login } = useUserAuth();
  const navigate = useNavigate();

  const SKILL_OPTIONS = [
    { value: "beginner", label: "Mới tập chơi", desc: "Mới biết luật, đang học cơ bản" },
    { value: "intermediate", label: "Chơi được rồi", desc: "Biết chơi, đánh vui với bạn bè" },
    { value: "advanced", label: "Khá / Chơi lâu", desc: "Chơi thường xuyên, có kỹ thuật" },
    { value: "expert", label: "Rất giỏi", desc: "Thi đấu nhiều, trình độ cao" },
  ];

  const ready = 
    name.trim().length >= 3 && 
    password.length >= 4 && 
    password === confirmPassword;

  function handleNameChange(val: string) {
    setName(val);
    setErrorMsg("");
    setNameSuggestions([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    
    setErrorMsg("");
    setNameSuggestions([]);

    signupMutation.mutate(
      { name: name.trim(), password, skillLevel },
      {
        onSuccess: (data) => {
          login(data.id);
          toast.success("Đăng ký thành công! Chào mừng bạn đến với PickX.");
          navigate("/");
        },
        onError: (err: any) => {
          const msg = err?.message?.toLowerCase() || "";
          if (msg.includes("name already exists") || msg.includes("already exists")) {
             setErrorMsg("Tên này đã có cao thủ sử dụng rồi!");
             const trimmedName = name.trim();
             setNameSuggestions([
               `${trimmedName} 2`,
               `${trimmedName} (Pro)`,
               `${trimmedName} PickX`
             ]);
          } else {
             setErrorMsg(err?.message || "Đã xảy ra lỗi, vui lòng thử lại.");
             toast.error(err?.message || "Đã xảy ra lỗi");
          }
        }
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
        Hãy nhập Tên hoặc Nickname rõ ràng (VD: Quân Lê, Nhân kikyo) để Host dễ dàng ghi nhận điểm số cho bạn.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tên hiển thị (Tối thiểu 3 ký tự)
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="VD: Quân Lê, Nhân kikyo..."
            className={cn(
              "h-12 w-full rounded-xl border bg-surface px-4 text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2",
              errorMsg && nameSuggestions.length > 0 
                ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/30" 
                : "border-border/60 focus:border-primary/50 focus:ring-primary/30"
            )}
          />
          
          {/* Duplicate Name Suggestions UI */}
          {errorMsg && nameSuggestions.length > 0 && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <div className="flex items-start gap-2 mb-3 text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <p className="text-sm font-medium leading-tight">{errorMsg}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-primary" /> Bạn có muốn thử các tên sau không?
                </p>
                <div className="flex flex-wrap gap-2">
                  {nameSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNameChange(suggestion)}
                      className="inline-flex items-center rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border/50 transition-colors hover:bg-primary hover:text-primary-foreground hover:ring-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {errorMsg && nameSuggestions.length === 0 && (
             <p className="mt-1.5 text-xs font-medium text-destructive">{errorMsg}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Trình độ hiện tại
          </label>
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
                    : "border-border/60 bg-surface hover:bg-surface-elevated"
                )}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
              </button>
            ))}
          </div>
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
            <p className="mt-1.5 text-[11px] font-medium text-destructive">Mật khẩu xác nhận không khớp</p>
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
