"use client";

import { useEffect, useRef, useCallback } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";

/** Mesmas medidas usadas no desenho dos botões (hit-test de clique). */
const GO_BTN_W = 280;
const GO_BTN_H = 44;
const GO_BTN_Y1 = 330;
const GO_BTN_Y2 = 388;

function canvasLogicalPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

interface GameOverScreenProps {
  score: number;
  onRetry: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({
  score,
  onRetry,
  onMenu,
}: GameOverScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  /** Qual botão está sob o mouse (null = nenhum; desenho sem destaque fixo no primeiro). */
  const hoverButtonRef = useRef<"retry" | "menu" | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      timeRef.current++;
      const t = timeRef.current;

      // Background triste mas ainda candy: lavanda escura
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, "#8B3A5A");
      grad.addColorStop(1, "#4A1A30");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sprinkles caindo lentamente (game over = triste)
      for (let i = 0; i < 20; i++) {
        const fallSpeed = 0.15 + (i % 4) * 0.08;
        const px = (i * 131 + 40) % CANVAS_WIDTH;
        const py = ((t * fallSpeed + i * 73) % (CANVAS_HEIGHT + 20)) - 10;
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(t * 0.015 + i) * 0.1;
        ctx.fillStyle = COLORS.red;
        ctx.translate(px, py);
        ctx.rotate(i * 0.8 + t * 0.02);
        ctx.fillRect(-4, -1.5, 8, 3);
        ctx.restore();
      }

      // Cupcakinho triste (olhinhos X) no centro superior
      drawSadCupcake(ctx, CANVAS_WIDTH / 2, 90, 38, t);

      // Titulo "Game Over" em fonte cursiva
      const bounce = Math.sin(t * 0.05) * 3;
      ctx.save();
      // Sombra
      ctx.fillStyle = "#60102080";
      ctx.font = "bold 52px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", CANVAS_WIDTH / 2 + 3, 178 + bounce + 4);
      // Principal
      ctx.fillStyle = COLORS.red;
      ctx.shadowColor = "#FF4060";
      ctx.shadowBlur = 20;
      ctx.fillText("Game Over", CANVAS_WIDTH / 2, 178 + bounce);
      ctx.restore();

      // Subtítulo sem prefixo terminal
      ctx.fillStyle = COLORS.white + "80";
      ctx.font = "14px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "O Alface Gigante venceu desta vez...",
        CANVAS_WIDTH / 2,
        215,
      );

      // Divisor
      ctx.strokeStyle = COLORS.red + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 160, 235);
      ctx.lineTo(CANVAS_WIDTH / 2 + 160, 235);
      ctx.stroke();

      // Score
      ctx.fillStyle = COLORS.yellow;
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 6;
      ctx.font = "bold 24px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(`Pontuacao: ${score}`, CANVAS_WIDTH / 2, 278);
      ctx.shadowBlur = 0;

      const btnY1 = GO_BTN_Y1;
      const btnY2 = GO_BTN_Y2;
      const btnW = GO_BTN_W;
      const btnH = GO_BTN_H;
      const btnX = CANVAS_WIDTH / 2 - btnW / 2;
      const hover = hoverButtonRef.current;

      const drawPrimaryStyle = (y: number) => {
        const g = ctx.createLinearGradient(btnX, y, btnX + btnW, y);
        g.addColorStop(0, COLORS.magenta + "D0");
        g.addColorStop(1, COLORS.yellow + "D0");
        ctx.fillStyle = g;
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(btnX, y, btnW, btnH, 22);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.playerGlow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(btnX, y, btnW, btnH, 22);
        ctx.stroke();
      };

      const drawMutedStyle = (y: number) => {
        ctx.fillStyle = COLORS.white + "20";
        ctx.beginPath();
        ctx.roundRect(btnX, y, btnW, btnH, 22);
        ctx.fill();
        ctx.strokeStyle = COLORS.white + "50";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(btnX, y, btnW, btnH, 22);
        ctx.stroke();
      };

      // Tentar Novamente
      if (hover === "retry") drawPrimaryStyle(btnY1);
      else drawMutedStyle(btnY1);
      ctx.textAlign = "center";
      ctx.fillStyle = hover === "retry" ? COLORS.black : COLORS.white + "CC";
      ctx.font = "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText("Tentar Novamente  [ENTER]", CANVAS_WIDTH / 2, btnY1 + 28);

      // Voltar ao Menu
      if (hover === "menu") drawPrimaryStyle(btnY2);
      else drawMutedStyle(btnY2);
      ctx.fillStyle = hover === "menu" ? COLORS.black : COLORS.white + "CC";
      ctx.font =
        hover === "menu"
          ? "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif"
          : "15px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText("Voltar ao Menu  [ESC]", CANVAS_WIDTH / 2, btnY2 + 28);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        playMenuSelectSound();
        onRetry();
      }
      if (e.code === "Escape") {
        e.preventDefault();
        playMenuSelectSound();
        onMenu();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onRetry, onMenu]);

  const hitTestButton = useCallback(
    (clientX: number, clientY: number): "retry" | "menu" | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const { x, y } = canvasLogicalPoint(canvas, clientX, clientY);
      const cx = CANVAS_WIDTH / 2;
      const half = GO_BTN_W / 2;
      if (x >= cx - half && x <= cx + half) {
        if (y >= GO_BTN_Y1 && y < GO_BTN_Y1 + GO_BTN_H) return "retry";
        if (y >= GO_BTN_Y2 && y < GO_BTN_Y2 + GO_BTN_H) return "menu";
      }
      return null;
    },
    [],
  );

  // Mouse (não pointer): mesmo padrão do menu/config — evita falha no Electron
  // após GameCanvas usar setPointerCapture ao atirar.
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const hit = hitTestButton(e.clientX, e.clientY);
      hoverButtonRef.current = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
    },
    [hitTestButton],
  );

  const handleMouseLeave = useCallback(() => {
    hoverButtonRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = "default";
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitTestButton(e.clientX, e.clientY);
      if (hit === "retry") {
        e.preventDefault();
        playMenuSelectSound();
        onRetry();
      } else if (hit === "menu") {
        e.preventDefault();
        playMenuSelectSound();
        onMenu();
      }
    },
    [hitTestButton, onRetry, onMenu],
  );

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        imageRendering: "pixelated",
        touchAction: "none",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
      }}
      tabIndex={0}
    />
  );
}

// Cupcake triste com olhinhos X para game over
function drawSadCupcake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
) {
  const sway = Math.sin(time * 0.04) * 3;

  ctx.save();
  ctx.translate(sway, 0);

  // Forminha
  ctx.fillStyle = "#A06040C0";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.42, cy + size * 0.08);
  ctx.lineTo(cx + size * 0.42, cy + size * 0.08);
  ctx.lineTo(cx + size * 0.55, cy + size * 0.8);
  ctx.lineTo(cx - size * 0.55, cy + size * 0.8);
  ctx.closePath();
  ctx.fill();

  // Glacê
  ctx.fillStyle = COLORS.red + "B0";
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.08, size * 0.46, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Olhinhos X (triste)
  ctx.strokeStyle = COLORS.black + "CC";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const eyeY = cy - size * 0.12;
  for (const ex of [cx - size * 0.16, cx + size * 0.16]) {
    const r = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(ex - r, eyeY - r);
    ctx.lineTo(ex + r, eyeY + r);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex + r, eyeY - r);
    ctx.lineTo(ex - r, eyeY + r);
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  // Boquinha triste
  ctx.strokeStyle = COLORS.black + "AA";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.22, size * 0.14, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.restore();
}
