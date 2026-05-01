import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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

// Flame tongue positions around the full circle (angle in degrees, scale factor)
const FLAME_TONGUES = [
  { angle: -90, scale: 1.2, delay: 0,     h: 36 },  // top-center (tallest)
  { angle: -60, scale: 1.0, delay: 0.12,  h: 30 },  // top-right
  { angle: -120, scale: 1.0, delay: 0.25, h: 30 },  // top-left
  { angle: -30, scale: 0.85, delay: 0.4,  h: 26 },  // right-upper
  { angle: -150, scale: 0.85, delay: 0.55, h: 26 },  // left-upper
  { angle: 0,   scale: 0.75, delay: 0.35, h: 22 },   // right
  { angle: 180, scale: 0.75, delay: 0.5,  h: 22 },   // left
  { angle: -75, scale: 1.05, delay: 0.08, h: 32 },   // top-right inner
  { angle: -105, scale: 1.05, delay: 0.18, h: 32 },  // top-left inner
  { angle: -45, scale: 0.9, delay: 0.3,   h: 28 },   // diagonal right
  { angle: -135, scale: 0.9, delay: 0.42, h: 28 },   // diagonal left
  { angle: 30,  scale: 0.6, delay: 0.6,   h: 18 },   // bottom-right
  { angle: 150, scale: 0.6, delay: 0.7,   h: 18 },   // bottom-left
  { angle: 90,  scale: 0.5, delay: 0.65,  h: 14 },   // bottom (smallest)
];

// Ember particles that float upward
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

    // Color logic based on streak
    const getFireTheme = () => {
        if (isGodlike) return {
            primary: "34,211,238",   // cyan
            secondary: "6,182,212",
            bg: "bg-cyan-500/20",
            ring: "rgba(34,211,238,0.8)",
        };
        if (isInferno) return {
            primary: "236,72,153",   // pink
            secondary: "219,39,119",
            bg: "bg-pink-500/20",
            ring: "rgba(236,72,153,0.8)",
        };
        return {
            primary: "249,115,22",   // orange
            secondary: "234,88,12",
            bg: "bg-orange-500/20",
            ring: "rgba(249,115,22,0.8)",
        };
    };

    const theme = getFireTheme();

    // TFT-style fire aura: multiple flame tongues around the circle
    const renderFireAura = () => {
      if (!isOnFire) return null;
      
      const tongueCount = isGodlike ? 14 : isInferno ? 11 : 8;
      const tongues = FLAME_TONGUES.slice(0, tongueCount);
      const emberCount = isGodlike ? 9 : isInferno ? 7 : 4;
      const embers = EMBERS.slice(0, emberCount);

      return (
        <div className="absolute inset-[-8px] z-20 pointer-events-none">
          {/* Flame tongues positioned around the circle */}
          {tongues.map((t, i) => {
            // Calculate position on the circle edge
            const rad = (t.angle * Math.PI) / 180;
            const radius = 48; // % from center to edge
            const cx = 50 + Math.cos(rad) * radius;
            const cy = 50 + Math.sin(rad) * radius;
            
            return (
              <div
                key={i}
                className="absolute animate-flame-tongue"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: `${t.h * 0.55}px`,
                  height: `${t.h}px`,
                  transform: `translate(-50%, -90%) rotate(${t.angle + 90}deg) scale(${t.scale})`,
                  animationDelay: `${t.delay}s`,
                  animationDuration: `${0.6 + Math.random() * 0.4}s`,
                  background: `linear-gradient(to top, rgba(${theme.primary},0.9), rgba(${theme.primary},0.5) 40%, rgba(${theme.secondary},0.2) 70%, transparent)`,
                  borderRadius: '50% 50% 20% 20%',
                  filter: `blur(1px) drop-shadow(0 0 3px rgba(${theme.primary},0.6))`,
                }}
              />
            );
          })}

          {/* Floating ember particles */}
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
                background: `rgba(${theme.primary},0.9)`,
                boxShadow: `0 0 ${e.size + 2}px rgba(${theme.primary},0.6)`,
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

        {/* === THE RING OF FIRE (TFT-style) === */}
        {isOnFire && (
          <div 
            className="absolute inset-[-4px] rounded-full border-2 animate-ring-of-fire pointer-events-none z-30" 
            style={{ borderColor: `rgba(${theme.primary},0.8)` }}
          />
        )}

        {/* === TFT-STYLE FIRE AURA === */}
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