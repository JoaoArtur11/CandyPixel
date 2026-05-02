"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";
import { drawCandyTitle } from "@/lib/game/candy-ui";

interface ControlsScreenProps {
  onBack: () => void;
}

export default function ControlsScreen({ onBack }: ControlsScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background candy
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, COLORS.backgroundGradientTop);
    grad.addColorStop(1, COLORS.backgroundGradientBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sprinkles estáticos decorativos
    const sprinkleColors = [
      COLORS.magenta,
      COLORS.cyan,
      COLORS.yellow,
      COLORS.purple,
      COLORS.neonGreen,
    ];
    for (let i = 0; i < 20; i++) {
      const px = (i * 131 + 40) % CANVAS_WIDTH;
      const py = (i * 73) % CANVAS_HEIGHT;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
      ctx.translate(px, py);
      ctx.rotate(i * 0.9);
      ctx.fillRect(-3, -1, 6, 2);
      ctx.restore();
    }

    // Título em gradient candy
    drawCandyTitle(ctx, "Controles", CANVAS_WIDTH / 2, 72, 36);

    // Divisor candy
    ctx.strokeStyle = COLORS.magenta + "50";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - 200, 90);
    ctx.lineTo(CANVAS_WIDTH / 2 + 200, 90);
    ctx.stroke();
    for (const sx of [CANVAS_WIDTH / 2 - 200, CANVAS_WIDTH / 2 + 200]) {
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.arc(sx, 90, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lista de controles
    const controls = [
      { key: "A / D  ou  Setas", action: "Mover esquerda / direita" },
      { key: "W / Seta Cima / Espaco", action: "Pular" },
      { key: "S / Seta Baixo", action: "Descer de plataformas" },
      { key: "J  ou  Clique Esquerdo", action: "Atirar" },
      { key: "ESC  ou  P", action: "Pausar" },
    ];

    const startY = 118;
    const spacing = 52;

    controls.forEach((ctrl, i) => {
      const y = startY + i * spacing;

      // Pill da tecla (candy style)
      const keyW = 270;
      ctx.fillStyle = COLORS.playerBody + "40";
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - keyW - 10, y, keyW, 36, 10);
      ctx.fill();
      ctx.strokeStyle = COLORS.magenta + "70";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - keyW - 10, y, keyW, 36, 10);
      ctx.stroke();

      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 13px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText(ctrl.key, CANVAS_WIDTH / 2 - keyW / 2 - 10, y + 23);

      // Acao
      ctx.fillStyle = COLORS.black + "CC";
      ctx.font = "14px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "left";
      ctx.fillText(ctrl.action, CANVAS_WIDTH / 2 + 10, y + 23);
    });

    // Secao objetivo
    const objY = startY + controls.length * spacing + 28;

    ctx.fillStyle = COLORS.magenta;
    ctx.font = "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif";
    ctx.textAlign = "center";
    ctx.fillText("Objetivo", CANVAS_WIDTH / 2, objY);

    // Pill de fundo para o bloco de objetivo
    ctx.fillStyle = COLORS.playerBody + "25";
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH / 2 - 320, objY + 8, 640, 80, 12);
    ctx.fill();
    ctx.strokeStyle = COLORS.magenta + "40";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(CANVAS_WIDTH / 2 - 320, objY + 8, 640, 80, 12);
    ctx.stroke();

    ctx.fillStyle = COLORS.black + "BB";
    ctx.font = "13px 'Fredoka', 'Comic Sans MS', cursive, serif";
    ctx.fillText(
      "Atravesse Candy Land e Candy Woods devorando doces.",
      CANVAS_WIDTH / 2,
      objY + 30,
    );
    ctx.fillText(
      "Derrote o Alface Gigante no QG das Verduras para salvar o sabor.",
      CANVAS_WIDTH / 2,
      objY + 50,
    );
    ctx.fillText(
      "Colete pirulitos de dados para aumentar sua pontuacao.",
      CANVAS_WIDTH / 2,
      objY + 70,
    );

    // Rodape
    ctx.fillStyle = COLORS.darkPurple + "60";
    ctx.font = "12px 'Fredoka', 'Comic Sans MS', cursive, serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Pressione ESC ou ENTER para voltar",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 28,
    );
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onBack]);

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
