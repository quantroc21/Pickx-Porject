import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { usePlayers } from "@/lib/api";
import { PlayerAvatar } from "./PlayerAvatar";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showAdminLink?: boolean;
}

export function AppHeader({ title = "PickX", subtitle, showAdminLink = true }: AppHeaderProps) {
  const { userId } = useUserAuth();
  const { data: players = [] } = usePlayers();
  const me = players.find(p => p.id === userId);

  return (
    <header className="sticky top-0 z-30 liquid-glass border-b-0 border-x-0 border-t-0 rounded-b-3xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-[#1a3a2a] shadow-glow overflow-hidden">
            <img src="/logo.png" alt="X" className="size-full object-cover scale-110" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight">PickX</p>
            {subtitle && <p className="text-[10px] uppercase tracking-wider text-primary">{subtitle}</p>}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {showAdminLink && !me && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Lock className="size-3" />
              BTC
            </Link>
          )}
          {showAdminLink && me && (
            <Link to="/me" className="flex items-center gap-2 rounded-full ring-1 ring-border/60 p-1 pr-3 bg-surface hover:border-primary/50 transition-colors">
              <PlayerAvatar player={me} size="sm" />
              <div className="leading-none">
                <p className="font-display text-xs font-bold">{me.name?.split(' ')[0] || "Tôi"}</p>
                <p className="text-[10px] text-primary font-mono-stat font-bold tracking-wider">{me.elo}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}