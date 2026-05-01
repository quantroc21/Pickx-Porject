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
            // feColorMatrix: boost cyan channel
            colorMatrix: "0 0 0 0 0.13  0 0 0 0 0.83  0 0 0 0 0.93  0 0 0 1 0",
            bg: "bg-cyan-500/25",
        };
        if (isInferno) return {
            primary: "236,72,153",
            colorMatrix: "0 0 0 0 0.93  0 0 0 0 0.28  0 0 0 0 0.60  0 0 0 1 0",
            bg: "bg-pink-500/25",
        };
        return {
            primary: "249,115,22",
            // feColorMatrix: warm orange/yellow fire
            colorMatrix: "0 0 0 0 0.98  0 0 0 0 0.45  0 0 0 0 0.09  0 0 0 1 0",
            bg: "bg-orange-500/25",
        };
    };

    const theme = getFireTheme();

    // SVG Turbulence-based fire ring + rising flame wisps
    const renderFireAura = () => {
      if (!isOnFire) return null;

      const displaceScale = isGodlike ? 18 : isInferno ? 15 : 12;
      const strokeW = isGodlike ? 14 : isInferno ? 12 : 10;
      const outerGlowW = isGodlike ? 22 : isInferno ? 18 : 14;
      const emberCount = isGodlike ? 9 : isInferno ? 6 : 3;
      const embers = EMBERS.slice(0, emberCount);
      // SLOWER turbulence for natural fire feel
      const animDur = isGodlike ? "4s" : isInferno ? "5s" : "6s";

      // Rising flame wisps — positioned around the top arc
      const risingFlames = [
        { angle: -90, w: 14, h: 30, delay: 0, dur: 1.8 },      // top center
        { angle: -65, w: 11, h: 26, delay: 0.4, dur: 1.6 },    // top-right
        { angle: -115, w: 11, h: 26, delay: 0.8, dur: 1.7 },   // top-left
        { angle: -40, w: 9, h: 22, delay: 1.2, dur: 1.5 },     // right
        { angle: -140, w: 9, h: 22, delay: 0.6, dur: 1.5 },    // left
        { angle: -78, w: 10, h: 24, delay: 0.2, dur: 1.9 },    // near top-right
        { angle: -102, w: 10, h: 24, delay: 1.0, dur: 1.8 },   // near top-left
      ];
      const flameCount = isGodlike ? 7 : isInferno ? 6 : 5;
      const flames = risingFlames.slice(0, flameCount);

      return (
        <div className="absolute inset-[-14px] z-20 pointer-events-none">
          {/* SVG Turbulence ring — organic distortion */}
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
                  <animate 
                    attributeName="seed" 
                    from="0" 
                    to="100" 
                    dur={animDur}
                    repeatCount="indefinite" 
                  />
                </feTurbulence>
                <feDisplacementMap 
                  in="SourceGraphic" 
                  in2="noise" 
                  scale={displaceScale} 
                  xChannelSelector="R" 
                  yChannelSelector="G" 
                  result="displaced"
                />
                <feGaussianBlur in="displaced" stdDeviation="1.8" result="blurred" />
                <feColorMatrix 
                  in="blurred" 
                  type="matrix" 
                  values={theme.colorMatrix}
                  result="colored"
                />
              </filter>

              <filter id={`${filterId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence 
                  type="fractalNoise" 
                  baseFrequency="0.03 0.07" 
                  numOctaves={2} 
                  result="gnoise"
                >
                  <animate 
                    attributeName="seed" 
                    from="50" 
                    to="150" 
                    dur={animDur}
                    repeatCount="indefinite" 
                  />
                </feTurbulence>
                <feDisplacementMap 
                  in="SourceGraphic" 
                  in2="gnoise" 
                  scale={displaceScale * 1.3}
                  xChannelSelector="G" 
                  yChannelSelector="R" 
                  result="gdisplaced"
                />
                <feGaussianBlur in="gdisplaced" stdDeviation="3.5" result="gblurred" />
                <feColorMatrix 
                  in="gblurred" 
                  type="matrix" 
                  values={theme.colorMatrix}
                  result="gcolored"
                />
              </filter>
            </defs>
            
            {/* Outer glow */}
            <circle 
              cx="60" cy="60" r="44" 
              fill="none" 
              stroke={`rgba(${theme.primary},0.35)`}
              strokeWidth={outerGlowW}
              filter={`url(#${filterId}-glow)`}
            />

            {/* Main fire ring */}
            <circle 
              cx="60" cy="60" r="44" 
              fill="none" 
              stroke={`rgba(${theme.primary},0.85)`}
              strokeWidth={strokeW}
              filter={`url(#${filterId}-fire)`}
            />

            {/* Inner core */}
            <circle 
              cx="60" cy="60" r="44" 
              fill="none" 
              stroke={`rgba(${theme.primary},0.5)`}
              strokeWidth={strokeW * 0.5}
              filter={`url(#${filterId}-fire)`}
              style={{ mixBlendMode: 'screen' }}
            />
          </svg>

          {/* === RISING FLAME WISPS — fire that rises upward === */}
          {flames.map((f, i) => {
            const rad = (f.angle * Math.PI) / 180;
            const r = 48;
            const cx = 50 + Math.cos(rad) * r;
            const cy = 50 + Math.sin(rad) * r;

            return (
              <div
                key={`flame-${i}`}
                className="absolute animate-flame-rise"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: `${f.w}px`,
                  height: `${f.h}px`,
                  background: `radial-gradient(ellipse at 50% 100%, rgba(${theme.primary},0.9) 0%, rgba(${theme.primary},0.4) 50%, transparent 100%)`,
                  borderRadius: '50% 50% 30% 30%',
                  filter: `blur(2.5px)`,
                  transformOrigin: 'center bottom',
                  animationDelay: `${f.delay}s`,
                  animationDuration: `${f.dur}s`,
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