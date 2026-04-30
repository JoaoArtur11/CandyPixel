// ============================
// CANDY PIXEL - Game Engine
// ============================

import type { GameState, InputState, GameScreen } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { createPlayer, updatePlayer } from "./player";
import { updateEnemies } from "./enemies";
import { updateProjectiles } from "./projectiles";
import {
  generateLevel,
  generateBackgroundBuildings,
  updateMovingPlatforms,
} from "./levels";
import { createCamera, updateCamera } from "./camera";
import { updateParticles } from "./particles";
import { consumePressed } from "./input";
import { render } from "./renderer";
import {
  playCollectSound,
  playVictorySound,
  playGameOverSound,
  startMusic,
  stopMusic,
} from "./audio";
import { createCollectParticles } from "./particles";
import { COLORS } from "./constants";

export function createGameState(): GameState {
  const level = generateLevel();
  const backgroundBuildings = generateBackgroundBuildings();

  return {
    screen: "menu",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    camera: createCamera(),
    level,
    backgroundBuildings,
    time: 0,
    deltaTime: 1,
    bossDefeated: false,
    screenShake: 0,
    currentZone: "streets",
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
    announcedZones: [],
    zoneAnnouncePending: false,
    floatingMessages: [],
  };
}

export function resetGame(state: GameState): GameState {
  const level = generateLevel();
  return {
    ...state,
    screen: "ready",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    camera: createCamera(),
    level,
    time: 0,
    deltaTime: 1,
    bossDefeated: false,
    screenShake: 0,
    currentZone: "streets",
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
    announcedZones: [],
    zoneAnnouncePending: false,
    floatingMessages: [],
  };
}

export function gameUpdate(state: GameState, input: InputState): GameState {
  // Tela "ready": qualquer tecla inicia o jogo
  if (state.screen === "ready") {
    const anyKey =
      input.left ||
      input.right ||
      input.jump ||
      input.down ||
      input.shoot ||
      input.jumpPressed ||
      input.shootPressed;
    if (anyKey) {
      state.screen = "playing";
      startMusic();
      consumePressed(input);
    }
    return state;
  }

  if (state.screen !== "playing" && state.screen !== "paused") {
    return state;
  }

  // Pause / Unpause / Exit
  if (state.screen === "paused") {
    if (input.pausePressed) {
      // ESC enquanto pausado = voltar ao menu (desistir da partida)
      state.screen = "menu";
      stopMusic();
      consumePressed(input);
      return state;
    }
    if (input.unpausePressed) {
      // P enquanto pausado = continuar jogando
      state.screen = "playing";
      consumePressed(input);
      return state;
    }
    consumePressed(input);
    return state;
  }

  if (input.pausePressed) {
    // ESC durante gameplay = pausar
    state.screen = "paused";
    consumePressed(input);
    return state;
  }

  // Migração defensiva: se o state foi criado por uma versão antiga (via HMR
  // em dev ou save antigo), os campos novos podem estar indefinidos.
  if (!state.announcedZones) state.announcedZones = [];
  if (state.zoneAnnouncePending === undefined)
    state.zoneAnnouncePending = false;
  if (!state.floatingMessages) state.floatingMessages = [];

  // Tick + cleanup das mensagens flutuantes
  for (const msg of state.floatingMessages) msg.life--;
  state.floatingMessages = state.floatingMessages.filter((m) => m.life > 0);

  // Enquanto o cartaz de nova zona está visível, congela entidades e aguarda
  // o jogador pressionar Enter/Espaço/Pular/Atirar para dispensar.
  if (state.zoneAnnouncePending) {
    const dismissed =
      input.jumpPressed || input.shootPressed || input.pausePressed;
    if (dismissed) {
      state.zoneAnnouncePending = false;
      state.zoneTransitionTimer = 0;
      consumePressed(input);
    } else {
      consumePressed(input);
      // Apenas tick de tempo para animar o cartaz — nenhuma lógica de gameplay
      state.time++;
      return state;
    }
  }

  state.time++;

  // Update moving platforms
  updateMovingPlatforms(state.platforms);

  // Update player
  const { newProjectile } = updatePlayer(state, input);
  if (newProjectile) {
    state.projectiles.push(newProjectile);
  }

  // Track collectibles before update for sound effects
  const prevCollected = state.collectibles.filter((c) => c.collected).length;

  // Update enemies
  const enemyProjectiles = updateEnemies(state);
  state.projectiles.push(...enemyProjectiles);

  // Update projectiles
  updateProjectiles(state);

  // Check new collectibles
  const newCollected = state.collectibles.filter((c) => c.collected).length;
  if (newCollected > prevCollected) {
    playCollectSound();
    // Find newly collected items for particles
    for (const col of state.collectibles) {
      if (col.collected && col.animTimer !== -1) {
        const color =
          col.type === "health"
            ? COLORS.healthPickup
            : col.type === "ammo"
              ? COLORS.ammoPickup
              : COLORS.dataChip;
        state.particles.push(
          ...createCollectParticles(
            col.x + col.width / 2,
            col.y + col.height / 2,
            color,
          ),
        );
        col.animTimer = -1; // Mark as already spawned particles
      }
    }
  }

  // Update camera
  updateCamera(state.camera, state.player, state);

  // Update particles com limite máximo para manter performance
  state.particles = updateParticles(state.particles);
  const MAX_PARTICLES = 300;
  if (state.particles.length > MAX_PARTICLES) {
    state.particles = state.particles.slice(-MAX_PARTICLES);
  }

  // Detecção de mudança de zona
  const px = state.player.x;
  let newZone: typeof state.currentZone = "streets";
  if (px >= state.level.sections.boss.startX) newZone = "boss";
  else if (px >= state.level.sections.ducts.startX) newZone = "ducts";

  if (newZone !== state.currentZone) {
    state.currentZone = newZone;

    // GDD §5.3: ao entrar na Zona 3, "Bolsa de Bombons Reforçada" expande a
    // capacidade máxima de 30 para 60. Preserva o estoque atual.
    if (newZone === "boss" && state.player.maxAmmo < 60) {
      state.player.maxAmmo = 60;
      state.floatingMessages.push({
        text: "★ BOLSA REFORCADA — 60 BOMBONS! ★",
        color: "#FFB347",
        life: 180,
        maxLife: 180,
        yOffset: -60,
      });
    }

    // Só mostra o cartaz se for a primeira vez que o jogador chega nessa zona.
    // Se ele voltar e entrar de novo, não reabre o anúncio.
    if (!state.announcedZones.includes(newZone)) {
      state.announcedZones.push(newZone);
      const zoneNames = {
        streets: "CANDY LAND",
        ducts: "CANDY WOODS",
        boss: "QG DAS VERDURAS",
      };
      state.zoneTransitionName = zoneNames[newZone];
      state.zoneTransitionTimer = 9999; // permanece até o jogador dispensar
      state.zoneAnnouncePending = true;
    }
  }

  // O timer agora só decrementa fora do modo "announce pending" — gerido acima.
  if (state.zoneTransitionTimer > 0 && !state.zoneAnnouncePending) {
    state.zoneTransitionTimer--;
  }

  // Damage flash timer
  if (state.damageFlashTimer > 0) {
    state.damageFlashTimer--;
  }

  // Check game over
  if (!state.player.alive) {
    state.screen = "gameover";
    stopMusic();
    playGameOverSound();
  }

  // Check victory
  if (state.bossDefeated) {
    state.screen = "victory";
    stopMusic();
    playVictorySound();
  }

  consumePressed(input);

  return state;
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  if (
    state.screen === "playing" ||
    state.screen === "paused" ||
    state.screen === "ready"
  ) {
    render(ctx, state);
  }
}
