"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { drawCandyTitle } from "@/lib/game/candy-ui";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

/**
 * Tela de abertura (2.8s): título "CANDY PIXEL" sobe com bounce,
 * sprinkles caem em cascata, pirulito gigante gira no canto.
 * Ao final, faz fade-out para o menu.
 */
export default function SplashScreen({
  onComplete,
  durationMs = 2800,
}: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number>(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    startRef.current = performance.now();

    const draw = () => {
      const elapsed = performance.now() - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Background gradiente candy
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bg.addColorStop(0, COLORS.backgroundGradientTop);
      bg.addColorStop(1, COLORS.backgroundGradientBottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sprinkles caindo (cascata que engrossa conforme o tempo passa)
      const sprinkleColors = [
        COLORS.magenta,
        COLORS.cyan,
        COLORS.yellow,
        COLORS.purple,
        COLORS.neonGreen,
        COLORS.orange,
        COLORS.playerBody,
      ];
      const sprinkleCount = Math.floor(20 + progress * 60);
      for (let i = 0; i < sprinkleCount; i++) {
        const speed = 0.6 + (i % 8) * 0.2;
        const px = (i * 83 + 40) % CANVAS_WIDTH;
        const raw = (elapsed * speed * 0.3 + i * 73) % (CANVAS_HEIGHT + 40);
        const py = raw - 20;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.translate(px, py);
        ctx.rotate(i * 0.7 + elapsed * 0.003);
        ctx.fillRect(-4, -1.5, 8, 3);
        ctx.restore();
      }

      // Pirulito gigante girando no canto inferior esquerdo
      drawSpinningLollipop(ctx, 160, CANVAS_HEIGHT - 180, 140, elapsed);
      // Cupcake decorativo canto inferior direito
      drawSplashCupcake(
        ctx,
        CANVAS_WIDTH - 160,
        CANVAS_HEIGHT - 160,
        80,
        elapsed,
      );

      // Título entrando de baixo para cima com bounce (primeiros 60% do tempo)
      const entry = Math.min(progress / 0.6, 1);
      const ease = 1 - Math.pow(1 - entry, 3); // easeOutCubic
      const targetY = CANVAS_HEIGHT / 2 - 10;
      const startY = CANVAS_HEIGHT + 80;
      const titleY = startY + (targetY - startY) * ease;
      // Bounce residual após chegar
      const bounce =
        entry >= 1 ? Math.sin((elapsed - durationMs * 0.6) * 0.012) * 8 : 0;

      drawCandyTitle(ctx, "CANDY PIXEL", CANVAS_WIDTH / 2, titleY + bounce, 88);

      // Subtítulo aparece depois
      if (progress > 0.55) {
        const subAlpha = Math.min((progress - 0.55) / 0.15, 1);
        ctx.save();
        ctx.globalAlpha = subAlpha;
        ctx.fillStyle = COLORS.darkPurple;
        ctx.font = "bold 22px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "center";
        ctx.fillText("Defenda o Doce!", CANVAS_WIDTH / 2, titleY + bounce + 58);
        ctx.restore();
      }

      // Fade-out nos últimos 20%
      if (progress > 0.8) {
        const fade = (progress - 0.8) / 0.2;
        ctx.fillStyle = `rgba(42, 10, 58, ${fade})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      if (progress >= 1) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
        return;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    // Permite pular a splash com qualquer tecla ou click
    const skip = () => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [durationMs, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      style={{
        imageRendering: "pixelated",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
      }}
    />
  );
}

function drawSpinningLollipop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  elapsed: number,
): void {
  const radius = size * 0.45;

  ctx.save();
  // Palito
  ctx.fillStyle = "#FFF8F0";
  ctx.strokeStyle = COLORS.darkPurple + "50";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - 4, cy + size * 0.2, 8, size, 4);
  ctx.fill();
  ctx.stroke();

  // Cabeça branca
  ctx.fillStyle = COLORS.white;
  ctx.shadowColor = COLORS.magenta + "99";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Espiral girando
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(elapsed * 0.003);
  const colors = ["#FF5FA8", "#FFB347", "#B08BE8", "#7FBE5C"];
  for (let a = 0; a < 4; a++) {
    ctx.fillStyle = colors[a];
    ctx.beginPath();
    const start = (a / 4) * Math.PI * 2;
    ctx.moveTo(0, 0);
    for (let s = 0; s <= 40; s++) {
      const tt = s / 40;
      const ang = start + tt * Math.PI * 1.5;
      const r = tt * radius * 0.95;
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    for (let s = 40; s >= 0; s--) {
      const tt = s / 40;
      const ang = start + tt * Math.PI * 1.5 + 0.5;
      const r = tt * radius * 0.95;
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Borda
  ctx.strokeStyle = COLORS.darkPurple;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Brilho
  ctx.fillStyle = COLORS.white + "99";
  ctx.beginPath();
  ctx.ellipse(
    cx - radius * 0.35,
    cy - radius * 0.4,
    radius * 0.28,
    radius * 0.14,
    -Math.PI / 4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

function drawSplashCupcake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  elapsed: number,
): void {
  const bob = Math.sin(elapsed * 0.003) * 6;
  const y = cy + bob;

  ctx.save();
  // Forminha
  ctx.fillStyle = "#D4956BDD";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.42, y + size * 0.05);
  ctx.lineTo(cx + size * 0.42, y + size * 0.05);
  ctx.lineTo(cx + size * 0.55, y + size * 0.75);
  ctx.lineTo(cx - size * 0.55, y + size * 0.75);
  ctx.closePath();
  ctx.fill();

  // Glacê
  ctx.fillStyle = COLORS.playerBody;
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, y + size * 0.05, size * 0.46, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Cerejinha
  ctx.fillStyle = "#E85858";
  ctx.beginPath();
  ctx.arc(cx, y - size * 0.38, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
