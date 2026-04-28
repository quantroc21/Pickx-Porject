import { NavLink, useLocation } from "react-router-dom";
import { Trophy, Radio, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUserAuth } from "@/hooks/useUserAuth";

const NAV_ITEMS = [
  { path: "/ranking", icon: Trophy, match: /^\/ranking/ },
  { path: "/", icon: Radio, match: /^$/ }, // Home is "/"
  { path: "/me", icon: User, match: /^\/me|^\/player\// },
];

export function BottomNav() {
  const location = useLocation();
  const { userId } = useUserAuth();

  return (
    <div className="fixed inset-x-0 bottom-8 z-40 px-8 flex justify-center safe-bottom">
      <nav
        className="flex w-full max-w-[320px] items-center justify-around rounded-full liquid-glass p-2 shadow-elevated overflow-hidden"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => {
          // Accurate active state matching
          let isActive = false;
          if (item.path === "/") {
            isActive = location.pathname === "/";
          } else if (item.path === "/ranking") {
            isActive = location.pathname === "/ranking";
          } else if (item.path === "/me") {
            // Active if on login Page, /me page, or current user's profile
            isActive = location.pathname === "/me" || 
                       location.pathname === "/login" || 
                       (location.pathname.startsWith("/player/") && location.pathname.includes(userId || "___none___"));
          }
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-1 items-center justify-center py-4 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="relative z-10 size-6" strokeWidth={2.2} />
              
              {isActive && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-0 z-0 bg-primary/15 rounded-full"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}