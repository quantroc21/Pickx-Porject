import { cn } from "@/lib/utils";
import { useState, useEffect, useId, useRef } from "react";
import { getTier } from "@/lib/tiers";
import type { Player } from "@/lib/types";
import { Skull } from "lucide-react";
import React from "react";

interface PlayerAvatarProps {
  player: Pick<Player, "name" | "elo" | "avatar_url" | "streak" | "id"> & Partial<Pick<Player, "last_comment" | "last_comment_time">>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const SIZE = {
  xs: "size-7 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-xl",
  xl: "size-20 text-2xl",
};

const SCALES = {
  xs: 0.35,
  sm: 0.4,
  md: 0.5,
  lg: 0.7,
  xl: 1.0,
};

const CanvasFireAura = ({ theme, isGodlike, isInferno, size = "md" }: { theme: any, isGodlike: boolean, isInferno: boolean, size?: keyof typeof SCALES }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = SCALES[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const pRGB = theme.primary.split(',').map(Number);
    const cRGB = theme.core.split(',').map(Number);
    const colors = {
      core: cRGB,
      mid: pRGB,
      edge: pRGB.map((c: number) => Math.max(0, c - 100))
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      initialSize: number;
      isSpire: boolean;

      constructor() {
        const angle = Math.random() * Math.PI * 2;
        const radius = (45 + Math.random() * 4) * scale;
        
        this.x = 100 + Math.cos(angle) * radius;
        this.y = 100 + Math.sin(angle) * radius;

        this.isSpire = angle > -1.8 && angle < -1.3;

        if (this.isSpire) {
          this.vx = (100 - this.x) * 0.12 + (Math.random() - 0.5) * 0.2;
          this.vy = (-2.0 - Math.random() * 2.0) * scale;
          this.initialSize = (8 + Math.random() * 8) * scale;
          this.maxLife = 35 + Math.random() * 15;
        } else {
          this.vx = (100 - this.x) * 0.01 + (Math.random() - 0.5) * 0.3;
          this.vy = (-1.0 - Math.random() * 1.5) * scale;
          this.initialSize = (5 + Math.random() * 4) * scale;
          this.maxLife = 25 + Math.random() * 10;
        }
        this.size = this.initialSize;
        this.life = this.maxLife;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy -= 0.02 * scale;
        this.life--;
        
        if (this.isSpire) {
          this.size = this.initialSize * (this.life / this.maxLife);
        } else {
          this.size = this.initialSize * Math.pow(this.life / this.maxLife, 0.8);
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.size < 0.15) return;
        const p = this.life / this.maxLife; 
        
        ctx.beginPath();
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        
        let r, g, b, a;
        if (p > 0.6) {
          const ratio = (p - 0.6) / 0.4;
          r = colors.mid[0] + (colors.core[0] - colors.mid[0]) * ratio;
          g = colors.mid[1] + (colors.core[1] - colors.mid[1]) * ratio;
          b = colors.mid[2] + (colors.core[2] - colors.mid[2]) * ratio;
          a = p;
        } else {
          const ratio = p / 0.6;
          r = colors.edge[0] + (colors.mid[0] - colors.edge[0]) * ratio;
          g = colors.edge[1] + (colors.mid[1] - colors.edge[1]) * ratio;
          b = colors.edge[2] + (colors.mid[2] - colors.edge[2]) * ratio;
          a = p * 0.7;
        }

        grad.addColorStop(0, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${a * 0.5})`);
        grad.addColorStop(1, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const render = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(0, 0, 200, 200);
      
      ctx.globalCompositeOperation = "lighter";

      const spawnRate = isGodlike ? 30 : isInferno ? 20 : 15;

      for (let i = 0; i < spawnRate; i++) {
        particles.push(new Particle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0 || p.size < 0.15) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, isGodlike, isInferno, scale]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[48%] w-[200px] h-[200px] pointer-events-none z-20 mix-blend-screen">
      <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
    </div>
  );
};

const CanvasRainEffect = ({ size = "md" }: { size?: keyof typeof SCALES }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = SCALES[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let drops: Drop[] = [];

    class Drop {
      x: number;
      y: number;
      speed: number;
      len: number;
      opacity: number;

      constructor() {
        this.reset();
        this.y = Math.random() * 200;
      }

      reset() {
        const area = 120 * scale;
        this.x = 100 - area/2 + Math.random() * area;
        this.y = 100 - area/2 - 40; // Spawn higher up
        this.speed = (5 + Math.random() * 8) * scale;
        this.len = (8 + Math.random() * 12) * scale;
        this.opacity = 0.2 + Math.random() * 0.4; // More visible
      }

      update() {
        this.y += this.speed;
        const bottom = 100 + (60 * scale);
        if (this.y > bottom) {
          this.reset();
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(148, 163, 184, ${this.opacity})`;
        ctx.lineWidth = 1.5 * scale; // Thicker rain
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.len);
        ctx.stroke();
      }
    }

    // More rain drops
    const dropCount = Math.floor(40 * scale);

    for (let i = 0; i < dropCount; i++) {
      drops.push(new Drop());
    }

    const render = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // Longer trails
      ctx.fillRect(0, 0, 200, 200);

      ctx.globalCompositeOperation = "source-over";
      drops.forEach(drop => {
        drop.update();
        drop.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [scale]);

  return (
    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10">
      <canvas ref={canvasRef} width={200} height={200} className="w-full h-full opacity-80" />
    </div>
  );
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

  const getFireTheme = () => {
    if (isGodlike) return {
      primary: "34,211,238",
      core: "180,255,255",
      colorMatrix: "0 0 0 0 0.13  0 0 0 0 0.83  0 0 0 0 0.93  0 0 0 1 0",
      bg: "bg-cyan-500/25",
    };
    if (isInferno) return {
      primary: "236,72,153",
      core: "255,180,220",
      colorMatrix: "0 0 0 0 0.93  0 0 0 0 0.28  0 0 0 0 0.60  0 0 0 1 0",
      bg: "bg-pink-500/25",
    };
    return {
      primary: "249,115,22",
      core: "255,230,80",
      colorMatrix: "0 0 0 0 0.98  0 0 0 0 0.45  0 0 0 0 0.09  0 0 0 1 0",
      bg: "bg-orange-500/25",
    };
  };

  const theme = getFireTheme();

  return (
    <div className="relative inline-flex shrink-0">
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

        {isOnFire && <CanvasFireAura theme={theme} isGodlike={isGodlike} isInferno={isInferno} size={size} />}

        {isBruised && <CanvasRainEffect size={size} />}

        {isBruised && (
          <div className="absolute inset-0 rounded-full bg-accent/20 pointer-events-none mix-blend-multiply flex items-center justify-center">
             <div className="absolute top-1/4 left-1/4 size-2 rounded-full bg-purple-900/40 blur-[2px]" />
             <div className="absolute top-1/2 right-1/4 size-3 rounded-full bg-blue-900/30 blur-[3px]" />
             <Skull className="size-1/2 text-accent/40 rotate-12" />
          </div>
        )}
        
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