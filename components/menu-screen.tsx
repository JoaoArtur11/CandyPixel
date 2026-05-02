"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";
import { drawCandyTitle, drawCandyWrapper } from "@/lib/game/candy-ui";

interface MenuScreenProps {
  onPlay: () => void;
  onSettings: () => void;
  onCredits: () => void;
  onExit: () => void;
}

export default function MenuScreen({
  onPlay,
  onSettings,
  onCredits,
  onExit,
}: MenuScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: "JOGAR", action: onPlay },
    { label: "CONFIGURACOES", action: onSettings },
    { label: "CREDITOS", action: onCredits },
    { label: "SAIR", action: onExit },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const drawMenu = () => {
      timeRef.current++;
      const t = timeRef.current;

      // ========= Background: gradiente candy =========
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, COLORS.backgroundGradientTop);
      grad.addColorStop(0.55, COLORS.background);
      grad.addColorStop(1, COLORS.backgroundGradientBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // ========= Listras diagonais estilo embrulho de bala (identidade de jogo) =========
      drawDiagonalStripes(ctx, t);

      // ========= Sprinkles caindo =========
      const sprinkleColors = [
        COLORS.magenta,
        COLORS.cyan,
        COLORS.yellow,
        COLORS.purple,
        COLORS.neonGreen,
        COLORS.orange,
      ];
      for (let i = 0; i < 40; i++) {
        const fallSpeed = 0.25 + (i % 5) * 0.1;
        const px = (i * 137 + 30) % CANVAS_WIDTH;
        const py = ((t * fallSpeed + i * 89) % (CANVAS_HEIGHT + 20)) - 10;
        const alpha = 0.3 + Math.sin(t * 0.02 + i) * 0.18;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.translate(px, py);
        ctx.rotate(i * 0.9 + t * 0.03);
        ctx.fillRect(-4, -1.5, 8, 3);
        ctx.restore();
      }

      // ========= Pirulito gigante decorativo no lado direito =========
      drawGiantLollipop(
        ctx,
        CANVAS_WIDTH - 220,
        CANVAS_HEIGHT / 2 - 20,
        180,
        t,
      );

      // ========= Cupcakes auxiliares no canto inferior direito =========
      drawMenuCupcake(ctx, CANVAS_WIDTH - 140, CANVAS_HEIGHT - 120, 42, t);
      drawMenuCupcake(ctx, CANVAS_WIDTH - 60, CANVAS_HEIGHT - 90, 32, t + 40);

      // ========= Layout alinhado à esquerda =========
      const leftX = 60;

      // Banner "placa de confeitaria" atrás do título
      const bannerY = 110;
      const bannerH = 128;
      const bannerW = 640;
      ctx.save();
      ctx.fillStyle = "#FFFFFFB0";
      ctx.shadowColor = COLORS.magenta + "80";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(leftX - 15, bannerY, bannerW, bannerH, 20);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Borda dupla candy
      ctx.strokeStyle = COLORS.magenta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(leftX - 15, bannerY, bannerW, bannerH, 20);
      ctx.stroke();
      ctx.strokeStyle = COLORS.playerGlow + "90";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(leftX - 8, bannerY + 7, bannerW - 14, bannerH - 14, 16);
      ctx.stroke();
      // Bolinhas decorativas nos cantos (pregos da placa)
      for (const [bx, by] of [
        [leftX - 5, bannerY + 10],
        [leftX + bannerW - 20, bannerY + 10],
        [leftX - 5, bannerY + bannerH - 10],
        [leftX + bannerW - 20, bannerY + bannerH - 10],
      ] as const) {
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Título "CANDY PIXEL" alinhado à esquerda com bounce
      const titleBounce = Math.sin(t * 0.04) * 5;
      const titleY = 188 + titleBounce;
      drawCandyTitle(ctx, "CANDY PIXEL", leftX, titleY, 56, "left");

      // Subtítulo
      ctx.fillStyle = COLORS.darkPurple;
      ctx.font = "bold 18px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "left";
      ctx.fillText("Defenda o Doce!", leftX + 4, titleY + 34);

      // ========= Itens de menu — balas embrulhadas alinhadas à esquerda =========
      const startY = 310;
      const itemSpacing = 70;
      const wrapperW = 420;
      const wrapperH = 54;

      for (let i = 0; i < menuItems.length; i++) {
        const itemY = startY + i * itemSpacing;
        const isSelected = i === selectedIndex;
        const floatY = isSelected ? Math.sin(t * 0.1) * 2.5 : 0;
        // Levemente empurrado à direita quando selecionado
        const slideX = isSelected ? 12 + Math.sin(t * 0.1) * 2 : 0;

        drawCandyWrapper(
          ctx,
          leftX + slideX,
          itemY - wrapperH / 2 + floatY,
          wrapperW,
          wrapperH,
          isSelected,
        );

        // Seta animada à esquerda (indicador de seleção)
        if (isSelected) {
          const arrowOffset = Math.sin(t * 0.12) * 4;
          ctx.fillStyle = COLORS.magenta;
          ctx.font = "bold 24px serif";
          ctx.textAlign = "right";
          ctx.fillText("❯", leftX - 8 + arrowOffset, itemY + 8 + floatY);
        }

        // Texto do item (dentro do corpo central da bala)
        const textX =
          leftX + slideX + wrapperH * 0.7 + (wrapperW - wrapperH * 1.4) / 2;
        ctx.fillStyle = isSelected ? COLORS.black : COLORS.darkPurple + "CC";
        ctx.font = `bold 19px 'Fredoka', 'Comic Sans MS', cursive, serif`;
        ctx.textAlign = "center";
        ctx.fillText(menuItems[i].label, textX, itemY + 7 + floatY);
      }

      // ========= Rodapé estilo fliperama =========
      const footerY = CANVAS_HEIGHT - 40;
      // Piscar "PRESS ENTER TO START"
      const blink = Math.sin(t * 0.08) > 0;
      if (blink) {
        ctx.fillStyle = COLORS.magenta;
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 8;
        ctx.font = "bold 14px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "left";
        ctx.fillText("★  PRESSIONE ENTER PARA JOGAR  ★", leftX, footerY);
        ctx.shadowBlur = 0;
      }
      // Instruções navegação
      ctx.fillStyle = COLORS.darkPurple + "AA";
      ctx.font = "11px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "left";
      ctx.fillText("W/S ou ↑/↓ para navegar", leftX, footerY + 22);

      animId = requestAnimationFrame(drawMenu);
    };

    animId = requestAnimationFrame(drawMenu);
    return () => cancelAnimationFrame(animId);
  }, [selectedIndex, menuItems]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          playMenuSelectSound();
          return next;
        });
      }
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        menuItems[selectedIndex].action();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, menuItems]);

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

// Cupcake decorativo animado para o menu
function drawMenuCupcake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
) {
  const bob = Math.sin(time * 0.035) * 5;
  const y = cy + bob;

  ctx.save();

  // Forminha
  ctx.fillStyle = "#D4956B90";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.42, y + size * 0.05);
  ctx.lineTo(cx + size * 0.42, y + size * 0.05);
  ctx.lineTo(cx + size * 0.55, y + size * 0.75);
  ctx.lineTo(cx - size * 0.55, y + size * 0.75);
  ctx.closePath();
  ctx.fill();

  // Glacê
  ctx.fillStyle = COLORS.playerBody + "B0";
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, y + size * 0.05, size * 0.46, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Swirl
  ctx.strokeStyle = "#FFD0E870";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, y - size * 0.08, size * 0.22, Math.PI * 0.1, Math.PI * 1.2);
  ctx.stroke();

  // Cerejinha
  ctx.fillStyle = COLORS.turretBody + "C0";
  ctx.beginPath();
  ctx.arc(cx, y - size * 0.38, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Olhinhos
  ctx.fillStyle = COLORS.black + "CC";
  ctx.beginPath();
  ctx.arc(cx - size * 0.14, y - size * 0.1, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + size * 0.14, y - size * 0.1, size * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Listras diagonais candy (estilo embrulho de bala) — ambiente do menu
function drawDiagonalStripes(
  ctx: CanvasRenderingContext2D,
  time: number,
): void {
  ctx.save();
  const stripeWidth = 70;
  const offset = (time * 0.15) % (stripeWidth * 2);
  const diag = Math.hypot(CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.translate(-diag / 2, -diag / 2);

  for (let i = -2; i * stripeWidth * 2 < diag + stripeWidth * 2; i++) {
    const xPos = i * stripeWidth * 2 + offset;
    // Listra rosa translúcida
    ctx.fillStyle = COLORS.magenta + "14";
    ctx.fillRect(xPos, 0, stripeWidth, diag);
    // Listra branco-creme translúcida
    ctx.fillStyle = COLORS.white + "22";
    ctx.fillRect(xPos + stripeWidth, 0, stripeWidth, diag);
  }
  ctx.restore();
}

// Pirulito gigante decorativo com espiral colorida (identidade de jogo)
function drawGiantLollipop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  time: number,
): void {
  const sway = Math.sin(time * 0.02) * 8;
  const x = cx + sway;

  ctx.save();

  // Palito
  ctx.fillStyle = "#FFF8F0";
  ctx.strokeStyle = COLORS.darkPurple + "40";
  ctx.lineWidth = 1.5;
  const stickW = size * 0.1;
  ctx.beginPath();
  ctx.roundRect(
    x - stickW / 2,
    cy + size * 0.3,
    stickW,
    size * 1.1,
    stickW / 2,
  );
  ctx.fill();
  ctx.stroke();

  // Cabeça do pirulito — círculo externo
  const radius = size * 0.45;
  ctx.shadowColor = COLORS.magenta + "AA";
  ctx.shadowBlur = 24;
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(x, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Espiral rotacionando — 4 cores candy
  ctx.save();
  ctx.translate(x, cy);
  ctx.rotate(time * 0.008);
  const spiralColors = ["#FF5FA8", "#FFB347", "#B08BE8", "#7FBE5C"];
  for (let arm = 0; arm < 4; arm++) {
    ctx.fillStyle = spiralColors[arm];
    ctx.beginPath();
    const armOffset = (arm / 4) * Math.PI * 2;
    ctx.moveTo(0, 0);
    for (let step = 0; step <= 40; step++) {
      const tt = step / 40;
      const angle = armOffset + tt * Math.PI * 1.5;
      const r = tt * radius * 0.98;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    for (let step = 40; step >= 0; step--) {
      const tt = step / 40;
      const angle = armOffset + tt * Math.PI * 1.5 + 0.5;
      const r = tt * radius * 0.98;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Borda do pirulito
  ctx.strokeStyle = COLORS.darkPurple + "80";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Brilho/highlight (lustre de plástico)
  ctx.fillStyle = COLORS.white + "90";
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.35,
    cy - radius * 0.4,
    radius * 0.28,
    radius * 0.15,
    -Math.PI / 4,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.restore();
}
