import { cn } from "@/lib/utils";
import { useState, useEffect, useId } from "react";
import { getTier } from "@/lib/tiers";
import type { Player } from "@/lib/types";
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

// Ember particles config
const EMBERS = [
  { x: 15, delay: 0,   dur: 1.2, size: 3 },
  { x: 40, delay: 0.3, dur: 1.5, size: 2.5 },
  { x: 70, delay: 0.7, dur: 1.0, size: 4 },
  { x: 25, delay: 1.0, dur: 1.3, size: 2 },
  { x: 55, delay: 0.5, dur: 1.4, size: 3.5 },
  { x: 85, delay: 0.2, dur: 1.1, size: 3 },
  { x: 10, delay: 0.8, dur: 1.6, size: 2 },
  { x: 65, delay: 0.4, dur: 1.2, size: 3 },
  { x: 35, delay: 0.9, dur: 1.0, size: 4 },
];

export function PlayerAvatar({ player, size = "md", ring = false, className }: PlayerAvatarProps) {
  if (!player || !player.name) return <div className={cn("rounded-full bg-muted", SIZE[size])} />;
  
  const filterId = useId().replace(/:/g, '');

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
    const isGodlike = streak >= 10;
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

    // Color logic based on streak — returns RGB triplet for SVG use
    const getFireTheme = () => {
        if (isGodlike) return {
            primary: "34,211,238",
            core: "180,255,255",    // white-hot cyan
            colorMatrix: "0 0 0 0 0.13  0 0 0 0 0.83  0 0 0 0 0.93  0 0 0 1 0",
            bg: "bg-cyan-500/25",
        };
        if (isInferno) return {
            primary: "236,72,153",
            core: "255,180,220",    // white-hot pink
            colorMatrix: "0 0 0 0 0.93  0 0 0 0 0.28  0 0 0 0 0.60  0 0 0 1 0",
            bg: "bg-pink-500/25",
        };
        return {
            primary: "249,115,22",
            core: "255,230,80",     // intense yellow
            colorMatrix: "0 0 0 0 0.98  0 0 0 0 0.45  0 0 0 0 0.09  0 0 0 1 0",
            bg: "bg-orange-500/25",
        };
    };

    const theme = getFireTheme();

    // Professional CSS Graphic Animation: Sharp Teardrop Flame + Halo
    const renderFireAura = () => {
      if (!isOnFire) return null;

      const emberCount = isGodlike ? 9 : isInferno ? 6 : 3;
      const embers = EMBERS.slice(0, emberCount);

      return (
        <div className="absolute inset-0 z-20 pointer-events-none flex justify-center items-center">
          {/* 1. Core Energy Halo (Smooth Glowing Ring) */}
          <div className="absolute inset-[-10px] rounded-full blur-[6px] animate-pulse"
               style={{ border: `4px solid rgba(${theme.primary}, 0.7)` }} />
          <div className="absolute inset-[-2px] rounded-full blur-[2px]"
               style={{ border: `2px solid rgba(${theme.core}, 0.6)` }} />

          {/* 2. THE MAIN SPIRE (Energy convergence point at the crown) */}
          <div className="absolute -top-[45px] left-1/2 -translate-x-1/2 w-[40px] h-[60px] flex justify-center items-end">
             {/* Wrapper for vertical scaling flicker */}
             <div className="w-full h-full animate-flame-flicker origin-bottom flex justify-center items-end drop-shadow-xl" style={{ filter: `drop-shadow(0 0 8px rgba(${theme.primary}, 0.8))` }}>
                 {/* Outer Glow Flame (Orange/Pink/Cyan) */}
                 <div className="absolute bottom-0 w-[30px] h-[30px] rounded-[0_50%_50%_50%] rotate-45 blur-[1px]"
                      style={{ background: `rgba(${theme.primary}, 0.9)`, transform: 'rotate(45deg) scaleY(2.2)' }} />
                 {/* Inner Core Flame (Bright Yellow/White-hot) */}
                 <div className="absolute bottom-1 w-[16px] h-[16px] rounded-[0_50%_50%_50%] rotate-45 blur-[0.5px]"
                      style={{ background: `rgba(${theme.core}, 1)`, transform: 'rotate(45deg) scaleY(2.5)' }} />
             </div>
          </div>

          {/* 3. Secondary Smaller Spires (For higher streaks) */}
          {isInferno && (
             <>
                <div className="absolute -top-[15px] -left-[15px] w-[20px] h-[40px] flex justify-center items-end -rotate-[25deg]">
                   <div className="w-full h-full animate-flame-flicker origin-bottom flex justify-center items-end delay-75">
                       <div className="absolute bottom-0 w-[16px] h-[16px] rounded-[0_50%_50%_50%] rotate-45 blur-[1px]"
                            style={{ background: `rgba(${theme.primary}, 0.8)`, transform: 'rotate(45deg) scaleY(1.8)' }} />
                   </div>
                </div>
                <div className="absolute -top-[15px] -right-[15px] w-[20px] h-[40px] flex justify-center items-end rotate-[25deg]">
                   <div className="w-full h-full animate-flame-flicker origin-bottom flex justify-center items-end delay-150">
                       <div className="absolute bottom-0 w-[16px] h-[16px] rounded-[0_50%_50%_50%] rotate-45 blur-[1px]"
                            style={{ background: `rgba(${theme.primary}, 0.8)`, transform: 'rotate(45deg) scaleY(1.8)' }} />
                   </div>
                </div>
             </>
          )}

          {/* 4. Embers */}
          {embers.map((e, i) => (
            <div
              key={`ember-${i}`}
              className="absolute animate-ember-float"
              style={{
                left: `${e.x}%`,
                bottom: '50%',
                width: `${e.size}px`,
                height: `${e.size}px`,
                borderRadius: '50%',
                background: `rgba(${theme.core},0.9)`,
                boxShadow: `0 0 ${e.size + 2}px rgba(${theme.primary},0.7)`,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.dur}s`,
              }}
            />
          ))}
        </div>
      );
    };

    return (
      <div className="relative inline-flex shrink-0">
        {/* HEAT GLOW BACKGROUND */}
        {isOnFire && (
          <div className={cn(
              "absolute rounded-full blur-xl animate-pulse pointer-events-none z-0 transition-all duration-700",
              theme.bg
          )} 
          style={{ 
            inset: isInferno ? "-22px" : "-16px",
          }} />
        )}

        <div
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold transition-all duration-500",
          SIZE[size],
          isGodlike && "scale-110 z-10",
          isInferno && !isGodlike && "scale-105 z-10",
          isOnFire && !isInferno && "scale-100",
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

        {/* === SVG TURBULENCE FIRE AURA === */}
        {renderFireAura()}

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