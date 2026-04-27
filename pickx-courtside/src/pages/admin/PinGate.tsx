import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const LENGTH = 4;

export default function PinGate() {
  const { unlock } = useAdminAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pin.length === LENGTH) {
      const ok = unlock(pin);
      if (ok) navigate("/admin", { replace: true });
      else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
          inputRef.current?.focus();
        }, 600);
      }
    }
  }, [pin, unlock, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Lock className="size-6 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Khu vực BTC</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Nhập mã PIN</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dùng 1234 để xem demo</p>
        </div>

        <div
          className={cn(
            "flex justify-center gap-3 transition-transform",
            error && "animate-[pulse-ring_0.4s_ease-out]",
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {Array.from({ length: LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                className={cn(
                  "grid size-14 place-items-center rounded-xl border bg-surface text-2xl font-bold transition-all",
                  filled ? "border-primary text-primary shadow-glow" : "border-border/60 text-muted-foreground",
                  error && "border-danger text-danger",
                )}
              >
                {filled ? "•" : ""}
              </div>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={LENGTH}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, LENGTH))}
          className="sr-only text-base"
          aria-label="Mã PIN BTC"
        />

        {error && <p className="text-sm font-medium text-danger">Sai mã PIN. Vui lòng thử lại.</p>}
      </div>
    </div>
  );
}