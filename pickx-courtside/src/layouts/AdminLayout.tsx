import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, ClipboardList, Shuffle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const NAV = [
  { to: "/admin",            label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/record",     label: "Ghi trận",  icon: ClipboardList },
  { to: "/admin/matchmaker", label: "Ghép trận", icon: Shuffle },
  { to: "/admin/players",    label: "Tay vợt",   icon: UserPlus },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <span className="font-display text-xl font-bold leading-none">X</span>
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-bold tracking-tight">PickX</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Khu vực BTC</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/admin");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-danger/50 hover:text-danger"
          >
            <LogOut className="size-3" />
            Khoá
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-5 animate-fade-in">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 liquid-glass safe-bottom rounded-t-[2.5rem] border-t-0">
        <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2 pt-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "group flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "relative grid size-10 place-items-center rounded-full transition-all",
                        isActive
                          ? "bg-primary/15 text-primary shadow-glow"
                          : "bg-transparent text-muted-foreground group-hover:bg-muted/50",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    <span className="font-display uppercase tracking-wider">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}