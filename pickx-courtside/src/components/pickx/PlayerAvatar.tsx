import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getTier } from "@/lib/tiers";
import type { Player } from "@/lib/types";
import { Flame, Bandage } from "lucide-react"; // Note: Bandage might not exist, I'll use Stethoscope or a custom SVG or just styles. I'll check Lucide. 
// Actually, Lucide doesn't have Bandage. I'll use Cross or just CSS.
import { Skull } from "lucide-react"; 


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
    const isBruised = streak <= -3;
    
    const [showComment, setShowComment] = useState(false);

    useEffect(() => {
      if (!player.last_comment || !player.last_comment_time || !player.id) return;
      
      const commentAge = Date.now() - new Date(player.last_comment_time).getTime();
      const isRecent = commentAge < 3 * 60 * 1000; // Only show if comment was generated in the last 3 minutes
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

    return (
      <div className="relative inline-flex shrink-0">
        <div
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold border-2 transition-all duration-500",
          SIZE[size],
          streak >= 5 && "animate-burning-aura border-orange-500 scale-110 z-10",
          streak >= 3 && streak < 5 && "ring-4 ring-warning/40 shadow-glow scale-105",
          isBruised && "grayscale-[0.6] opacity-80 brightness-90",
          className,
        )}
        style={{ 
          borderColor: ring ? `hsl(var(--${tier.color}))` : 'transparent',
          backgroundColor: 'hsl(var(--surface-elevated))'
        }}
      >
        {player.avatar_url ? (
          <img 
            src={player.avatar_url} 
            alt={player.name} 
            className={cn(
                "size-full rounded-full object-cover transition-all",
                isOnFire && "animate-fast-pulse"
            )} 
          />
        ) : (
          <span className="leading-none text-muted-foreground">{initials}</span>
        )}

        {/* Status Overlays */}
        {streak >= 3 && (
          <div className="absolute inset-[-4px] rounded-full border-2 border-orange-500 animate-ring-of-fire pointer-events-none" />
        )}
        
        {streak >= 3 && (
          <>
            <div className="absolute -top-1 right-0 z-20 animate-fire-flicker">
              <Flame className={cn("text-orange-500 fill-current", streak >= 5 ? "size-3.5" : "size-2.5")} />
            </div>
            {streak >= 5 && (
              <>
                <div className="absolute -bottom-1 left-2 z-20 animate-fire-flicker [animation-delay:0.2s]">
                  <Flame className="size-2.5 text-red-500 fill-current" />
                </div>
                <div className="absolute top-1/2 -right-1.5 z-20 animate-fire-flicker [animation-delay:0.1s]">
                  <Flame className="size-2 text-yellow-500 fill-current" />
                </div>
              </>
            )}
          </>
        )}

        {isBruised && (
          <div className="absolute inset-0 rounded-full bg-accent/20 pointer-events-none mix-blend-multiply flex items-center justify-center">
             {/* Bruise effect overlay */}
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
              {/* Distinctive Chunky Tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-white border-l-transparent border-r-transparent border-b-transparent border-t-[8px] border-l-[8px] border-r-[8px]" />
              <div className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 border-solid border-t-slate-200 border-l-transparent border-r-transparent border-b-transparent border-t-[10px] border-l-[10px] border-r-[10px] -z-10" />
            </div>
          </div>
        )}
      </div>
      </div>
    );
}