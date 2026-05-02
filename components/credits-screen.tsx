"use client";

import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import { playMenuSelectSound } from "@/lib/game/audio";
import { drawCandyTitle } from "@/lib/game/candy-ui";

interface CreditsScreenProps {
  onBack: () => void;
}

export default function CreditsScreen({ onBack }: CreditsScreenProps) {
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

      // Background candy
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, COLORS.backgroundGradientTop);
      grad.addColorStop(1, COLORS.backgroundGradientBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sprinkles flutuando
      const sprinkleColors = [
        COLORS.magenta,
        COLORS.cyan,
        COLORS.yellow,
        COLORS.purple,
        COLORS.neonGreen,
      ];
      for (let i = 0; i < 25; i++) {
        const px = (i * 131 + t * 0.15) % CANVAS_WIDTH;
        const py = (i * 73 + Math.sin(t * 0.01 + i) * 20) % CANVAS_HEIGHT;
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(t * 0.02 + i) * 0.12;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.translate(px, py);
        ctx.rotate(i * 0.7);
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
      }

      // Título em gradient candy
      drawCandyTitle(ctx, "Creditos", CANVAS_WIDTH / 2, 72, 36);

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

      // Nome do jogo em gradient candy
      drawCandyTitle(ctx, "CANDY PIXEL", CANVAS_WIDTH / 2, 132, 38);

      ctx.fillStyle = COLORS.darkPurple + "A0";
      ctx.font = "18px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(
        "Plataforma 2D de Acao  |  Next.js + Canvas",
        CANVAS_WIDTH / 2,
        162,
      );

      // Cabecalho da equipe
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 26px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText("Equipe de Desenvolvimento", CANVAS_WIDTH / 2, 204);

      const team = [
        {
          name: "Ives Leonardo Mendes Lima",
          role: "Arquitetura, Game Loop, Fisica, Camera",
        },
        {
          name: "Jose Lucas Marques Silva",
          role: "Tiro, Vida (Docura), Municao, Buffs",
        },
        {
          name: "Pablo Farias",
          role: "IA dos Inimigos, Boss Alface Gigante",
        },
        {
          name: "Andreas Leonardo",
          role: "Menus, HUD, Pontuacao, Feedbacks",
        },
        {
          name: "Joao Artur Veras",
          role: "Pixel Art, Audio, Level Design, Parallax",
        },
      ];

      const teamStartY = 240;
      const teamSpacing = 62;
      team.forEach((member, i) => {
        const y = teamStartY + i * teamSpacing;

        // Pill de fundo maior para cada membro
        ctx.fillStyle = COLORS.playerBody + "30";
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 360, y - 20, 720, 54, 14);
        ctx.fill();

        ctx.fillStyle = COLORS.darkPurple + "EE";
        ctx.font = "bold 21px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "center";
        ctx.fillText(member.name, CANVAS_WIDTH / 2, y + 2);

        ctx.fillStyle = COLORS.darkGray + "CC";
        ctx.font = "15px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.fillText(member.role, CANVAS_WIDTH / 2, y + 24);
      });

      // Disciplina
      const infoY = teamStartY + team.length * teamSpacing + 12;
      ctx.fillStyle = COLORS.darkPurple + "90";
      ctx.font = "16px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(
        "Intro. ao Desenvolvimento de Jogos - iCEV 2026.1",
        CANVAS_WIDTH / 2,
        infoY,
      );
      ctx.fillText(
        "Prof. Samuel Vinicius Pereira de Oliveira",
        CANVAS_WIDTH / 2,
        infoY + 24,
      );

      // Obrigado com pulso
      const tyY = infoY + 58;
      const pulse = 0.7 + Math.sin(t * 0.04) * 0.3;
      ctx.fillStyle = COLORS.neonGreen;
      ctx.globalAlpha = pulse;
      ctx.font = "bold 28px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText("Obrigado por jogar!", CANVAS_WIDTH / 2, tyY);
      ctx.globalAlpha = 1;

      // Rodape
      ctx.fillStyle = COLORS.darkPurple + "80";
      ctx.font = "15px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.fillText(
        "Pressione ESC ou ENTER para voltar",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 28,
      );

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
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
