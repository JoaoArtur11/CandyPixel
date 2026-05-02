"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

interface VictoryScreenProps {
  score: number;
  onMenu: () => void;
}

export default function VictoryScreen({ score, onMenu }: VictoryScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      timeRef.current++;
      const t = timeRef.current;

      // Background festivo: gradiente amarelo-dourado para rosa
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#FFE0A0");
      grad.addColorStop(0.5, COLORS.background);
      grad.addColorStop(1, COLORS.backgroundGradientBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sprinkles de celebração voando em todas direções
      const confettiColors = [
        COLORS.magenta,
        COLORS.cyan,
        COLORS.yellow,
        COLORS.purple,
        COLORS.neonGreen,
        COLORS.orange,
        COLORS.playerBody,
      ];
      for (let i = 0; i < 60; i++) {
        const speed = 0.4 + (i % 6) * 0.12;
        const px = ((t * speed * 0.6 + i * 97) % (CANVAS_WIDTH + 20)) - 10;
        const py = ((t * speed * 0.4 + i * 61) % (CANVAS_HEIGHT + 20)) - 10;
        const alpha = 0.35 + Math.sin(t * 0.03 + i) * 0.2;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = confettiColors[i % confettiColors.length];
        ctx.translate(px, py);
        ctx.rotate(i * 0.9 + t * 0.04);
        // Mistura de formatos: sprinkle e quadradinho
        if (i % 3 === 0) {
          ctx.fillRect(-4, -1.5, 8, 3);
        } else {
          ctx.fillRect(-2.5, -2.5, 5, 5);
        }
        ctx.restore();
      }

      // Cupcake feliz grande no topo
      drawHappyCupcake(ctx, CANVAS_WIDTH / 2, 95, 46, t);

      // Titulo "Vitoria!" com bounce
      const bounceY = Math.sin(t * 0.05) * 6;
      ctx.save();
      // Sombra
      ctx.fillStyle = COLORS.playerGlow + "60";
      ctx.font = "bold 52px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText("Vitoria!", CANVAS_WIDTH / 2 + 3, 194 + bounceY + 4);
      // Principal
      ctx.fillStyle = COLORS.neonGreen;
      ctx.shadowColor = "#60D840";
      ctx.shadowBlur = 24;
      ctx.fillText("Vitoria!", CANVAS_WIDTH / 2, 194 + bounceY);
      ctx.restore();

      // Subtítulo sem prefixo terminal
      ctx.fillStyle = COLORS.black + "B0";
      ctx.font = "15px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText("O Alface Gigante foi derrotado!", CANVAS_WIDTH / 2, 228);
      ctx.fillText("O sabor doce esta salvo!", CANVAS_WIDTH / 2, 248);

      // Linha decorativa
      ctx.strokeStyle = COLORS.neonGreen + "50";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 180, 268);
      ctx.lineTo(CANVAS_WIDTH / 2 + 180, 268);
      ctx.stroke();
      for (const sx of [CANVAS_WIDTH / 2 - 180, CANVAS_WIDTH / 2 + 180]) {
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(sx, 268, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Score
      ctx.fillStyle = COLORS.black + "DD";
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 6;
      ctx.font = "bold 26px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(`Pontuacao Final: ${score}`, CANVAS_WIDTH / 2, 308);
      ctx.shadowBlur = 0;

      // Rank com cor adequada
      let rank = "D";
      if (score >= 2000) rank = "S";
      else if (score >= 1500) rank = "A";
      else if (score >= 1000) rank = "B";
      else if (score >= 500) rank = "C";

      const rankColor =
        rank === "S"
          ? COLORS.yellow
          : rank === "A"
            ? COLORS.neonGreen
            : rank === "B"
              ? COLORS.cyan
              : COLORS.white;
      ctx.fillStyle = rankColor;
      ctx.shadowColor = rankColor;
      ctx.shadowBlur = 12;
      ctx.font = "bold 38px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(`Rank: ${rank}`, CANVAS_WIDTH / 2, 356);
      ctx.shadowBlur = 0;

      // Botão voltar ao menu
      const btnY = 400;
      const btnW = 280;
      const btnH = 44;
      const btnGrad = ctx.createLinearGradient(
        CANVAS_WIDTH / 2 - btnW / 2,
        btnY,
        CANVAS_WIDTH / 2 + btnW / 2,
        btnY,
      );
      btnGrad.addColorStop(0, COLORS.magenta + "D0");
      btnGrad.addColorStop(1, COLORS.yellow + "D0");
      ctx.fillStyle = btnGrad;
      ctx.shadowColor = COLORS.playerGlow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - btnW / 2, btnY, btnW, btnH, 22);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = COLORS.playerGlow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - btnW / 2, btnY, btnW, btnH, 22);
      ctx.stroke();
      ctx.fillStyle = COLORS.black;
      ctx.font = "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText("Voltar ao Menu  [ENTER]", CANVAS_WIDTH / 2, btnY + 28);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space" || e.code === "Escape") {
        e.preventDefault();
        playMenuSelectSound();
        onMenu();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onMenu]);

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
      tabIndex={0}
    />
  );
}

// Cupcake feliz com estrelinha e sorriso para a tela de vitória
function drawHappyCupcake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
) {
  const bob = Math.sin(time * 0.06) * 4;

  ctx.save();
  ctx.translate(0, bob);

  // Forminha
  ctx.fillStyle = "#D4956BCC";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.42, cy + size * 0.08);
  ctx.lineTo(cx + size * 0.42, cy + size * 0.08);
  ctx.lineTo(cx + size * 0.55, cy + size * 0.8);
  ctx.lineTo(cx - size * 0.55, cy + size * 0.8);
  ctx.closePath();
  ctx.fill();

  // Listras na forminha
  ctx.strokeStyle = "#A0622A60";
  ctx.lineWidth = 1;
  for (let s = 1; s <= 3; s++) {
    const ratio = s / 4;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.42 + size * 0.84 * ratio, cy + size * 0.08);
    ctx.lineTo(cx - size * 0.55 + size * 1.1 * ratio, cy + size * 0.8);
    ctx.stroke();
  }

  // Glacê (verde vitória!)
  ctx.fillStyle = COLORS.neonGreen + "CC";
  ctx.shadowColor = "#60D840";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.08, size * 0.47, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Swirl
  ctx.strokeStyle = "#FFFFFF70";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.06, size * 0.24, Math.PI * 0.1, Math.PI * 1.2);
  ctx.stroke();

  // Estrelinha no topo
  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.shadowBlur = 8;
  const starCy = cy - size * 0.44;
  drawStar(ctx, cx, starCy, size * 0.14, size * 0.07);
  ctx.shadowBlur = 0;

  // Olhinhos felizes (arqueados)
  ctx.strokeStyle = COLORS.black + "CC";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const eyeY = cy - size * 0.12;
  for (const ex of [cx - size * 0.16, cx + size * 0.16]) {
    ctx.beginPath();
    ctx.arc(ex, eyeY + size * 0.04, size * 0.08, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  // Boquinha sorridente
  ctx.strokeStyle = COLORS.black + "AA";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.14, size * 0.16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
