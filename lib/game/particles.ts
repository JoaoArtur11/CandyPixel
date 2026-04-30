// ============================
// CANDY PIXEL - Particle System
// ============================

import type { Particle } from "./types";
import {
  PARTICLE_COUNT_EXPLOSION,
  PARTICLE_COUNT_COLLECT,
  PARTICLE_LIFE,
} from "./constants";

export function createExplosionParticles(
  x: number,
  y: number,
  color: string,
  count: number = PARTICLE_COUNT_EXPLOSION,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life: PARTICLE_LIFE + Math.random() * 20,
      maxLife: PARTICLE_LIFE + 20,
      alpha: 1,
    });
  }
  return particles;
}

// Paleta candy de sprinkles — cada coleta espalha várias cores misturadas.
const SPRINKLE_COLORS = [
  "#FF5FA8", // rosa chiclete
  "#FFB347", // caramelo
  "#FFD86B", // baunilha
  "#B08BE8", // lilás
  "#7FBE5C", // verde matcha
  "#9FE8E0", // hortelã
  "#FF8B8B", // morango pastel
] as const;

export function createCollectParticles(
  x: number,
  y: number,
  _color: string,
): Particle[] {
  const particles: Particle[] = [];
  // Dobro de partículas para celebrar a coleta com "chuva" de sprinkles
  const count = PARTICLE_COUNT_COLLECT * 2;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      // Size maior pro sprinkle ser visível como "palitinho"
      size: 4 + Math.random() * 3,
      color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length],
      life: 35 + Math.random() * 20,
      maxLife: 55,
      alpha: 1,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // slight gravity on particles
    p.life--;
    p.alpha = Math.max(0, p.life / p.maxLife);
    p.size *= 0.98;
  }
  return particles.filter((p) => p.life > 0);
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  camX: number,
  camY: number,
) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 5;
    // Partículas com size >= 4 viram sprinkles (palitinhos rotativos candy).
    // Partículas menores permanecem como explosão quadrada tradicional.
    if (p.size >= 4) {
      // Rotação determinística derivada da velocidade — sem campo extra no type
      const angle = Math.atan2(p.vy, p.vx) + p.life * 0.06;
      ctx.translate(p.x - camX, p.y - camY);
      ctx.rotate(angle);
      const len = p.size * 1.6;
      const thick = Math.max(1.5, p.size * 0.4);
      ctx.fillRect(-len / 2, -thick / 2, len, thick);
    } else {
      ctx.fillRect(
        p.x - camX - p.size / 2,
        p.y - camY - p.size / 2,
        p.size,
        p.size,
      );
    }
    ctx.restore();
  }
}
