"use client";

import { useRef, useEffect, useCallback } from "react";
import type { GameState, InputState } from "@/lib/game/types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/game/constants";
import { gameUpdate, gameRender } from "@/lib/game/engine";
import { createInputState, setupInput, consumePressed } from "@/lib/game/input";

interface GameCanvasProps {
  gameState: React.MutableRefObject<GameState>;
  inputState: React.MutableRefObject<InputState>;
  onScreenChange: (screen: GameState["screen"]) => void;
}

export default function GameCanvas({
  gameState,
  inputState,
  onScreenChange,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastScreenRef = useRef<GameState["screen"]>("menu");

  // Atualiza coordenadas do mouse em coords do mundo (canvas lógico + câmera)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;
      const cam = gameState.current.camera;
      inputState.current.mouseWorldX = screenX + cam.x;
      inputState.current.mouseWorldY = screenY + cam.y;
    },
    [gameState, inputState],
  );

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameState.current;
    const input = inputState.current;

    // Update
    gameUpdate(state, input);

    // Detect screen changes
    if (state.screen !== lastScreenRef.current) {
      lastScreenRef.current = state.screen;
      onScreenChange(state.screen);
    }

    // Render
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameRender(ctx, state);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, inputState, onScreenChange]);

  useEffect(() => {
    const cleanup = setupInput(inputState.current);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cleanup();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop, inputState]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      onMouseMove={handleMouseMove}
      style={{
        imageRendering: "pixelated",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='none' stroke='%23FF5FA8' stroke-width='3'/><circle cx='16' cy='16' r='2' fill='%23FFB347'/><line x1='16' y1='2' x2='16' y2='8' stroke='%23FF5FA8' stroke-width='3' stroke-linecap='round'/><line x1='16' y1='24' x2='16' y2='30' stroke='%23FF5FA8' stroke-width='3' stroke-linecap='round'/><line x1='2' y1='16' x2='8' y2='16' stroke='%23FF5FA8' stroke-width='3' stroke-linecap='round'/><line x1='24' y1='16' x2='30' y2='16' stroke='%23FF5FA8' stroke-width='3' stroke-linecap='round'/></svg>") 16 16, crosshair`,
      }}
      tabIndex={0}
    />
  );
}
