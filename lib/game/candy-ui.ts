// Helpers de UI candy compartilhados entre as telas do jogo.
// Formatos temáticos: título com gradiente multicolor + bala embrulhada (candy wrapper).

import { COLORS } from "./constants";

/**
 * Desenha o título "CANDY PIXEL" (ou outro texto) com gradiente horizontal
 * candy (rosa chiclete -> dourado -> lilás) e sombra suave.
 */
export function drawCandyTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  align: CanvasTextAlign = "center",
): void {
  const font = `bold ${size}px 'Fredoka', 'Comic Sans MS', cursive, serif`;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  const metrics = ctx.measureText(text);
  const w = metrics.width;

  // Eixo do gradiente — começa no início do texto
  const gradX0 = align === "left" ? cx : cx - w / 2;
  const gradX1 = align === "left" ? cx + w : cx + w / 2;

  // Sombra dupla (dourada + lilás) para profundidade
  ctx.fillStyle = COLORS.playerGlow + "70";
  ctx.fillText(text, cx + 3, cy + 4);
  ctx.fillStyle = COLORS.purple + "60";
  ctx.fillText(text, cx + 1, cy + 2);

  // Gradiente principal
  const grad = ctx.createLinearGradient(gradX0, cy, gradX1, cy);
  grad.addColorStop(0, "#FF5FA8"); // Rosa chiclete
  grad.addColorStop(0.35, "#FFB347"); // Caramelo
  grad.addColorStop(0.65, "#FFD86B"); // Baunilha
  grad.addColorStop(1, "#B08BE8"); // Lilás

  ctx.fillStyle = grad;
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 18;
  ctx.fillText(text, cx, cy);

  // Contorno fino para legibilidade
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.white + "AA";
  ctx.lineWidth = 1.2;
  ctx.strokeText(text, cx, cy);
  ctx.restore();
}

/**
 * Desenha uma bala embrulhada clássica (candy wrapper) com formato limpo:
 * corpo central arredondado + dois "laços" triangulares suaves nas pontas,
 * com listras diagonais simulando o papel torcido.
 */
export function drawCandyWrapper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  selected: boolean,
): void {
  const knotW = h * 0.7;
  const bodyX = x + knotW;
  const bodyW = w - knotW * 2;
  const cy = y + h / 2;

  // === Cores ===
  const bodyFill = selected ? buildSelectedGradient(ctx, bodyX, bodyW) : null;
  const bodyColor = selected ? undefined : COLORS.playerBody + "60";
  const knotTint = selected ? "#FFB347E0" : COLORS.magenta + "55";
  const strokeColor = selected ? COLORS.playerGlow : COLORS.magenta + "80";
  const strokeWidth = selected ? 2 : 1.3;

  ctx.save();

  // ============ Nó esquerdo (laço torcido) ============
  drawKnot(ctx, x, y, knotW, h, "left", knotTint);

  // ============ Nó direito ============
  drawKnot(ctx, x + w - knotW, y, knotW, h, "right", knotTint);

  // ============ Corpo central — retângulo arredondado sobre os nós ============
  if (bodyFill) {
    ctx.fillStyle = bodyFill;
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 18;
  } else if (bodyColor) {
    ctx.fillStyle = bodyColor;
  }
  ctx.beginPath();
  ctx.roundRect(bodyX, y, bodyW, h, h / 2.2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ============ Contornos ============
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";

  // Contorno corpo
  ctx.beginPath();
  ctx.roundRect(bodyX, y, bodyW, h, h / 2.2);
  ctx.stroke();

  // Contorno nós (sem fundo — apenas linha)
  strokeKnotOutline(ctx, x, y, knotW, h, "left");
  strokeKnotOutline(ctx, x + w - knotW, y, knotW, h, "right");

  // ============ Listras diagonais dentro dos nós (papel torcido) ============
  ctx.strokeStyle = COLORS.white + (selected ? "A0" : "50");
  ctx.lineWidth = 1;
  drawKnotPleats(ctx, x, y, knotW, h, "left");
  drawKnotPleats(ctx, x + w - knotW, y, knotW, h, "right");

  // ============ Brilho/destaque no corpo (simula luz no plástico) ============
  const highlightGrad = ctx.createLinearGradient(bodyX, y, bodyX, y + h * 0.5);
  highlightGrad.addColorStop(0, COLORS.white + (selected ? "70" : "30"));
  highlightGrad.addColorStop(1, COLORS.white + "00");
  ctx.fillStyle = highlightGrad;
  ctx.beginPath();
  ctx.roundRect(bodyX + 6, y + 3, bodyW - 12, h * 0.35, h / 4);
  ctx.fill();

  // Linhas verticais sutis no corpo (padrão candy)
  ctx.strokeStyle = COLORS.white + (selected ? "50" : "25");
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const lx = bodyX + (bodyW / 5) * i;
    ctx.beginPath();
    ctx.moveTo(lx, y + h * 0.18);
    ctx.lineTo(lx, y + h * 0.82);
    ctx.stroke();
  }

  ctx.restore();
  // silenciar "cy unused" em builds estritos
  void cy;
}

function buildSelectedGradient(
  ctx: CanvasRenderingContext2D,
  bodyX: number,
  bodyW: number,
): CanvasGradient {
  const grad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  grad.addColorStop(0, "#FF7FB8");
  grad.addColorStop(0.5, "#FFD86B");
  grad.addColorStop(1, "#C8A8E8");
  return grad;
}

/**
 * Desenha o laço lateral (knot) preenchido. Formato:
 * triângulo com base no corpo e ponta externa, com curvas côncavas
 * nas extremidades (papel torcido).
 */
function drawKnot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  side: "left" | "right",
  fill: string,
): void {
  const isLeft = side === "left";
  // Base colada ao corpo, ponta para fora
  const baseX = isLeft ? x + w : x;
  const tipX = isLeft ? x : x + w;
  // Pontas (top / bottom) do laço na extremidade externa
  const tipTopY = y + h * 0.12;
  const tipBotY = y + h * 0.88;
  // Ponto de aperto (onde o papel torce) — fica a ~30% da largura
  const pinchX = isLeft ? x + w * 0.35 : x + w * 0.65;
  const pinchTopY = y + h * 0.3;
  const pinchBotY = y + h * 0.7;

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(baseX, y + h * 0.15);
  // Curva da base superior até a ponta superior passando pelo aperto
  ctx.quadraticCurveTo(pinchX, pinchTopY, tipX, tipTopY);
  // Reta (a extremidade do laço) até a ponta inferior
  ctx.lineTo(tipX, tipBotY);
  // Curva de volta para a base inferior
  ctx.quadraticCurveTo(pinchX, pinchBotY, baseX, y + h * 0.85);
  ctx.closePath();
  ctx.fill();
}

function strokeKnotOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  side: "left" | "right",
): void {
  const isLeft = side === "left";
  const baseX = isLeft ? x + w : x;
  const tipX = isLeft ? x : x + w;
  const tipTopY = y + h * 0.12;
  const tipBotY = y + h * 0.88;
  const pinchX = isLeft ? x + w * 0.35 : x + w * 0.65;
  const pinchTopY = y + h * 0.3;
  const pinchBotY = y + h * 0.7;

  ctx.beginPath();
  ctx.moveTo(baseX, y + h * 0.15);
  ctx.quadraticCurveTo(pinchX, pinchTopY, tipX, tipTopY);
  ctx.lineTo(tipX, tipBotY);
  ctx.quadraticCurveTo(pinchX, pinchBotY, baseX, y + h * 0.85);
  ctx.stroke();
}

/**
 * Desenha 3 dobras internas no laço, partindo do aperto central até
 * as extremidades externa/corpo. Simula as pregas do papel torcido.
 */
function drawKnotPleats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  side: "left" | "right",
): void {
  const isLeft = side === "left";
  const pinchX = isLeft ? x + w * 0.4 : x + w * 0.6;
  const cy = y + h / 2;
  const baseX = isLeft ? x + w : x;
  const tipX = isLeft ? x : x + w;

  // Linha central — aperto até a ponta externa
  ctx.beginPath();
  ctx.moveTo(pinchX, cy);
  ctx.lineTo(tipX + (isLeft ? 3 : -3), cy);
  ctx.stroke();

  // Duas diagonais do aperto até as extremidades do corpo
  ctx.beginPath();
  ctx.moveTo(pinchX, cy);
  ctx.lineTo(baseX, y + h * 0.25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pinchX, cy);
  ctx.lineTo(baseX, y + h * 0.75);
  ctx.stroke();
}
