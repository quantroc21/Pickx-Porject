import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getTier } from "@/lib/tiers";
import type { Player } from "@/lib/types";
import { Flame, Skull } from "lucide-react";


interface PlayerAvatarProps {
  player: Pick<Player, "name" | "elo" | "avatar_url" | "streak" | "id"> & Partial<Pick<Player, "last_comment" | "last_comment_time">>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const SIZE = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-2xl",
};

export function PlayerAvatar({ player, size = "md", ring = false, className }: PlayerAvatarProps) {
  if (!player || !player.name) return <div className={cn("rounded-full bg-muted", SIZE[size])} />;
  
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tier = getTier(player.elo ?? 1000);
    const streak = player.streak || 0;
    const isOnFire = streak >= 3;
    const isInferno = streak >= 5;
    const isBruised = streak <= -3;
    
    const [showComment, setShowComment] = useState(false);

    useEffect(() => {
      if (!player.last_comment || !player.last_comment_time || !player.id) return;
      
      const commentAge = Date.now() - new Date(player.last_comment_time).getTime();
      const isRecent = commentAge < 3 * 60 * 1000;
      const storageKey = `seen_comment_${player.id}_${player.last_comment_time}`;
      
      if (isRecent && !sessionStorage.getItem(storageKey)) {
        setShowComment(true);
        const timer = setTimeout(() => {
          setShowComment(false);
          sessionStorage.setItem(storageKey, "true");
        }, 7000);
        return () => clearTimeout(timer);
      }
    }, [player.last_comment, player.last_comment_time, player.id]);

    // Helper to calculate flame positions
    const renderFlames = () => {
      if (!isOnFire) return null;
      
      const flameCount = Math.min(streak, 12); // Cap at 12 visual flames for performance/UX
      const flames = [];
      
      for (let i = 0; i < flameCount; i++) {
        // Distribute flames in an arc from -130deg to 130deg
        const startAngle = -130;
        const endAngle = 130;
        const angle = flameCount > 1 
          ? startAngle + (i * (endAngle - startAngle)) / (flameCount - 1)
          : 0;
        
        // Use sine/cosine for circular positioning
        const radius = 55; // % of container size
        const x = Math.sin((angle * Math.PI) / 180) * radius;
        const y = -Math.cos((angle * Math.PI) / 180) * radius;
        
        flames.push(
          <div 
            key={i}
            className="absolute z-20 animate-fire-flicker pointer-events-none"
            style={{
              left: `calc(50% + ${x}%)`,
              top: `calc(50% + ${y}%)`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <Flame 
              className={cn(
                "fill-current",
                i % 2 === 0 ? "text-orange-500" : "text-orange-400",
                isInferno ? "size-5" : "size-4",
                "drop-shadow-[0_0_5px_rgba(255,100,0,0.6)]"
              )} 
            />
          </div>
        );
      }
      return flames;
    };

    return (
      <div className="relative inline-flex shrink-0">
        {/* HEAT GLOW BACKGROUND - Grows with streak */}
        {isOnFire && (
          <div className={cn(
              "absolute rounded-full blur-xl animate-pulse pointer-events-none z-0",
              isInferno ? "bg-orange-600/50" : "bg-orange-500/30"
          )} 
          style={{ 
            inset: `-${8 + Math.min(streak, 10)}px`,
          }} />
        )}

        <div
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold transition-all duration-500",
          SIZE[size],
          isInferno && "scale-110 z-10",
          isOnFire && !isInferno && "scale-105",
          isBruised && "grayscale-[0.6] opacity-80 brightness-90",
          className,
        )}
        style={{ 
          border: ring ? `2px solid hsl(var(--${tier.color}))` : 'none',
          backgroundColor: 'hsl(var(--surface-elevated))'
        }}
      >
        {player.avatar_url ? (
          <img 
            src={player.avatar_url} 
            alt={player.name} 
            className="size-full rounded-full object-cover transition-all"
          />
        ) : (
          <span className="leading-none text-muted-foreground">{initials}</span>
        )}

        {/* === THE RING OF FIRE === */}
        {isOnFire && (
          <div className="absolute inset-[-4px] rounded-full border-2 animate-ring-of-fire pointer-events-none z-30" />
        )}

        {/* === DYNAMIC FLAME STREAK SYSTEM === */}
        {renderFlames()}

        {/* Rising Sparks (Only for high streaks) */}
        {isInferno && (
          <>
            <div className="absolute -top-6 left-1/4 animate-fire-particles">
              <div className="size-1 rounded-full bg-yellow-400 shadow-[0_0_4px_yellow]" />
            </div>
            <div className="absolute -top-8 right-1/3 animate-fire-particles [animation-delay:0.5s]">
              <div className="size-1.5 rounded-full bg-orange-400 shadow-[0_0_4px_orange]" />
            </div>
          </>
        )}

        {isBruised && (
          <div className="absolute inset-0 rounded-full bg-accent/20 pointer-events-none mix-blend-multiply flex items-center justify-center">
             <div className="absolute top-1/4 left-1/4 size-2 rounded-full bg-purple-900/40 blur-[2px]" />
             <div className="absolute top-1/2 right-1/4 size-3 rounded-full bg-blue-900/30 blur-[3px]" />
             <Skull className="size-1/2 text-accent/30 rotate-12" />
          </div>
        )}
        
        {/* Duolingo-style Speech Bubble */}
        {showComment && player.last_comment && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce-in drop-shadow-xl min-w-max pointer-events-none">
            <div className="relative rounded-2xl bg-white px-4 py-2 font-display text-sm font-bold text-slate-800 border-2 border-slate-200">
              {player.last_comment}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-white border-l-transparent border-r-transparent border-b-transparent border-t-[8px] border-l-[8px] border-r-[8px]" />
              <div className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 border-solid border-t-slate-200 border-l-transparent border-r-transparent border-b-transparent border-t-[10px] border-l-[10px] border-r-[10px] -z-10" />
            </div>
          </div>
        )}
      </div>
      </div>
    );
}