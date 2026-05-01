import { cn } from "@/lib/utils";
import { useState, useEffect, useId, useRef } from "react";
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

const CanvasFireAura = ({ theme, isGodlike, isInferno }: { theme: { primary: string, core: string, colorMatrix: string, bg: string }, isGodlike: boolean, isInferno: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

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
      isSpire: boolean;

      constructor() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 34 + (Math.random() * 4 - 2);
        
        this.x = 100 + Math.cos(angle) * radius;
        this.y = 110 + Math.sin(angle) * radius;

        this.isSpire = angle > -2.35 && angle < -0.78;

        this.vx = (Math.random() - 0.5) * 1.5;
        
        if (this.isSpire) {
          this.vy = -1.5 - Math.random() * 3.5;
          this.size = 12 + Math.random() * 12;
          this.maxLife = 35 + Math.random() * 30;
          this.vx += (100 - this.x) * 0.03; 
        } else {
          this.vy = -0.5 - Math.random() * 1.5;
          this.size = 6 + Math.random() * 8;
          this.maxLife = 20 + Math.random() * 15;
        }
        this.life = this.maxLife;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.isSpire) {
          this.vx += Math.sin(this.life * 0.1) * 0.06;
        }

        this.life--;
        this.size *= 0.95; 
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.size < 0.5) return;
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
          a = p * 0.8;
        }

        grad.addColorStop(0, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${a * 0.5})`);
        grad.addColorStop(1, `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, 200, 200);
      ctx.globalCompositeOperation = "lighter";

      const spawnRate = isGodlike ? 12 : isInferno ? 9 : 6;
      for (let i = 0; i < spawnRate; i++) {
        particles.push(new Particle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, isGodlike, isInferno]);

  return (
    <div className="absolute top-1/2 left-1/2 -ml-[100px] -mt-[110px] w-[200px] h-[200px] pointer-events-none z-20">
      <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
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

        {/* === CANVAS PARTICLE FIRE AURA === */}
        {isOnFire && <CanvasFireAura theme={theme} isGodlike={isGodlike} isInferno={isInferno} />}

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