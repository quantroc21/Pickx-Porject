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

    // Fire system: Halo + Sharp Flame Spires + Embers
    const renderFireAura = () => {
      if (!isOnFire) return null;

      const displaceScale = isGodlike ? 18 : isInferno ? 15 : 12;
      const strokeW = isGodlike ? 14 : isInferno ? 12 : 10;
      const outerGlowW = isGodlike ? 22 : isInferno ? 18 : 14;
      const emberCount = isGodlike ? 9 : isInferno ? 6 : 3;
      const embers = EMBERS.slice(0, emberCount);
      const animDur = isGodlike ? "4s" : isInferno ? "5s" : "6s";

      // Secondary sharp flames: angle from top, height, delay
      const secondaryFlames = [
        { angle: -55, h: 18, delay: 0.3 },   // right of center
        { angle: -125, h: 16, delay: 0.7 },  // left of center
        { angle: -35, h: 12, delay: 1.1 },   // far right
        { angle: -145, h: 11, delay: 0.5 },  // far left
      ];
      const secCount = isGodlike ? 4 : isInferno ? 3 : 2;

      return (
        <div className="absolute inset-[-14px] z-20 pointer-events-none">
          {/* === HALO: SVG Turbulence Ring === */}
          <svg 
            className="size-full overflow-visible" 
            viewBox="0 0 120 120" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id={`${filterId}-fire`} x="-40%" y="-40%" width="180%" height="180%">
                <feTurbulence 
                  type="fractalNoise" 
                  baseFrequency="0.04 0.09" 
                  numOctaves={3} 
                  result="noise"
                >
                  <animate attributeName="seed" from="0" to="100" dur={animDur} repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={displaceScale} xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="1.8" result="blurred" />
                <feColorMatrix in="blurred" type="matrix" values={theme.colorMatrix} />
              </filter>

              <filter id={`${filterId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves={2} result="gnoise">
                  <animate attributeName="seed" from="50" to="150" dur={animDur} repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="gnoise" scale={displaceScale * 1.3} xChannelSelector="G" yChannelSelector="R" result="gdisplaced" />
                <feGaussianBlur in="gdisplaced" stdDeviation="3.5" />
              </filter>

              {/* Gradient for sharp flame spires: core yellow → edge orange */}
              <linearGradient id={`${filterId}-spire`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={`rgba(${theme.primary},0.6)`} />
                <stop offset="30%" stopColor={`rgba(${theme.primary},1)`} />
                <stop offset="65%" stopColor={`rgba(${theme.core},1)`} />
                <stop offset="100%" stopColor={`rgba(${theme.core},0.7)`} />
              </linearGradient>
            </defs>
            
            {/* Outer glow halo */}
            <circle cx="60" cy="60" r="44" fill="none" stroke={`rgba(${theme.primary},0.35)`} strokeWidth={outerGlowW} filter={`url(#${filterId}-glow)`} />
            {/* Main fire ring */}
            <circle cx="60" cy="60" r="44" fill="none" stroke={`rgba(${theme.primary},0.85)`} strokeWidth={strokeW} filter={`url(#${filterId}-fire)`} />
            {/* Inner core ring */}
            <circle cx="60" cy="60" r="44" fill="none" stroke={`rgba(${theme.primary},0.5)`} strokeWidth={strokeW * 0.5} filter={`url(#${filterId}-fire)`} style={{ mixBlendMode: 'screen' }} />

            {/* === CENTRAL FLAME SPIRE — sharp dagger rising from top === */}
            <g className="animate-flame-spire" style={{ transformOrigin: '60px 16px' }}>
              <path 
                d="M 60,18 C 55,6 56,-4 60,-22 C 64,-4 65,6 60,18 Z"
                fill={`url(#${filterId}-spire)`}
                filter="drop-shadow(0 0 4px rgba(255,200,50,0.8))"
              />
              {/* Bright inner core of the spire */}
              <path 
                d="M 60,16 C 58,6 58,-2 60,-16 C 62,-2 62,6 60,16 Z"
                fill={`rgba(${theme.core},0.9)`}
                style={{ mixBlendMode: 'screen' }}
              />
            </g>

            {/* === SECONDARY SHARP FLAMES around the halo === */}
            {secondaryFlames.slice(0, secCount).map((sf, i) => {
              const rad = (sf.angle * Math.PI) / 180;
              const ox = 60 + Math.cos(rad) * 44;
              const oy = 60 + Math.sin(rad) * 44;
              // Tip position: extend outward from ring
              const tx = 60 + Math.cos(rad) * (44 + sf.h);
              const ty = 60 + Math.sin(rad) * (44 + sf.h);
              // Control points for the dagger shape
              const perpAngle = rad + Math.PI / 2;
              const spread = 3;
              const bx1 = ox + Math.cos(perpAngle) * spread;
              const by1 = oy + Math.sin(perpAngle) * spread;
              const bx2 = ox - Math.cos(perpAngle) * spread;
              const by2 = oy - Math.sin(perpAngle) * spread;

              return (
                <g key={`sec-${i}`} className="animate-flame-spire" style={{ transformOrigin: `${ox}px ${oy}px`, animationDelay: `${sf.delay}s` }}>
                  <path
                    d={`M ${bx1},${by1} Q ${(bx1+tx)/2},${(by1+ty)/2} ${tx},${ty} Q ${(bx2+tx)/2},${(by2+ty)/2} ${bx2},${by2} Z`}
                    fill={`url(#${filterId}-spire)`}
                    filter="drop-shadow(0 0 3px rgba(255,200,50,0.6))"
                  />
                </g>
              );
            })}
          </svg>

          {/* === RISING EMBER PARTICLES === */}
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