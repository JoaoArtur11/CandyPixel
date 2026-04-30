// ============================
// CANDY PIXEL - Player Logic
// ============================

import type { Player, GameState, InputState, Projectile } from "./types";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_MAX_HEALTH,
  PLAYER_START_AMMO,
  PLAYER_SHOOT_COOLDOWN,
  PLAYER_INVINCIBLE_TIME,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_DAMAGE,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  GRAVITY,
  MAX_FALL_SPEED,
  VOID_Y,
  GROUND_Y,
  TRAIL_LENGTH,
  COLORS,
} from "./constants";
import { aabb, isLandingOnTop } from "./collisions";
import {
  playJumpSound,
  playShootSound,
  playHitSound,
  playHealthPickupSound,
  playAmmoPickupSound,
  playShieldBuffSound,
  playMilkshakeBuffSound,
  playWeaponUnlockSound,
  playCollectSound,
} from "./audio";
import { createExplosionParticles } from "./particles";
import { shakeCamera } from "./camera";

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    direction: "right",
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    ammo: PLAYER_START_AMMO,
    maxAmmo: PLAYER_START_AMMO,
    score: 0,
    isGrounded: false,
    isJumping: false,
    isShooting: false,
    shootCooldown: 0,
    invincible: false,
    invincibleTimer: 0,
    animFrame: 0,
    animTimer: 0,
    alive: true,
    canShoot: false,
    shieldActive: false,
    milkshakeTimer: 0,
  };
}

export function updatePlayer(
  state: GameState,
  input: InputState,
): { newProjectile: Projectile | null } {
  const player = state.player;
  if (!player.alive) return { newProjectile: null };

  // Horizontal movement
  player.vx = 0;
  if (input.left) {
    player.vx = -PLAYER_SPEED;
    player.direction = "left";
  }
  if (input.right) {
    player.vx = PLAYER_SPEED;
    player.direction = "right";
  }

  // Jump
  if (input.jumpPressed && player.isGrounded) {
    player.vy = PLAYER_JUMP_FORCE;
    player.isGrounded = false;
    player.isJumping = true;
    playJumpSound();
  }

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Platform collisions
  player.isGrounded = false;
  for (const platform of state.platforms) {
    // Drop-through: S/↓ permite cair por plataformas flutuantes (não-chão)
    const isGroundPlatform = platform.y >= GROUND_Y;
    if (input.down && !isGroundPlatform) continue;

    const playerRect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    };
    const platRect = {
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    if (isLandingOnTop(playerRect, platRect, player.vy)) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isGrounded = true;
      player.isJumping = false;
    }
  }

  // Void death (cair em buracos entre plataformas)
  if (player.y > VOID_Y) {
    player.health = 0;
    player.alive = false;
    return { newProjectile: null };
  }

  // Left boundary
  if (player.x < 0) player.x = 0;
  // Right boundary
  const maxX = state.level.totalWidth - player.width;
  if (player.x > maxX) player.x = maxX;

  // Boss arena lock — uma vez na zona boss com boss vivo, não pode voltar
  const bossSection = state.level.sections.boss;
  const bossAlive = state.enemies.some((e) => e.type === "boss" && e.alive);
  if (
    bossAlive &&
    state.currentZone === "boss" &&
    player.x < bossSection.startX
  ) {
    player.x = bossSection.startX;
  }

  // Invincibility timer
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  // Shooting
  let newProjectile: Projectile | null = null;
  if (player.shootCooldown > 0) player.shootCooldown--;

  // Tick dos buffs temporais
  if (player.milkshakeTimer > 0) player.milkshakeTimer--;

  // Desbloqueio do tiro só acontece depois do Lançador de Bombom (GDD §5.3)
  const shootAllowed =
    player.canShoot &&
    input.shootPressed &&
    player.shootCooldown <= 0 &&
    (player.ammo > 0 || player.milkshakeTimer > 0);
  if (shootAllowed) {
    // Milkshake: munição infinita por 8s — não decrementa ammo
    if (player.milkshakeTimer <= 0) player.ammo--;
    player.shootCooldown = PLAYER_SHOOT_COOLDOWN;
    player.isShooting = true;

    // Origem do projétil — sempre sai do lado correto do player conforme direction
    const bulletX =
      player.direction === "right"
        ? player.x + player.width
        : player.x - BULLET_WIDTH;
    const bulletY = player.y + player.height * 0.35;

    // Vetor de disparo: se foi via mouse, aponta pro cursor; senão, horizontal
    let vx: number;
    let vy: number;
    if (input.shootFromMouse) {
      const originX = bulletX + BULLET_WIDTH / 2;
      const originY = bulletY + BULLET_HEIGHT / 2;
      const dx = input.mouseWorldX - originX;
      const dy = input.mouseWorldY - originY;
      const len = Math.hypot(dx, dy);
      if (len > 0.0001) {
        vx = (dx / len) * PLAYER_BULLET_SPEED;
        vy = (dy / len) * PLAYER_BULLET_SPEED;
        // Alinhar direção do player com o alvo (faz a arte olhar pra lá)
        player.direction = dx >= 0 ? "right" : "left";
      } else {
        vx =
          player.direction === "right"
            ? PLAYER_BULLET_SPEED
            : -PLAYER_BULLET_SPEED;
        vy = 0;
      }
    } else {
      vx =
        player.direction === "right"
          ? PLAYER_BULLET_SPEED
          : -PLAYER_BULLET_SPEED;
      vy = 0;
    }

    newProjectile = {
      x: bulletX,
      y: bulletY,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      vx,
      vy,
      owner: "player",
      damage: PLAYER_BULLET_DAMAGE,
      alive: true,
      trail: [],
      color: COLORS.bulletPlayer,
    };

    playShootSound();
  } else {
    player.isShooting = false;
  }

  // Animation timer
  player.animTimer++;
  if (player.animTimer > 8) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 4;
  }

  // Enemy collision (contact damage)
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (
      aabb(
        {
          x: player.x,
          y: player.y,
          width: player.width,
          height: player.height,
        },
        { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height },
      )
    ) {
      // GDD: contato com boss causa 2 HP de dano, demais inimigos 1 HP
      const contactDamage = enemy.type === "boss" ? 2 : 1;
      damagePlayer(player, contactDamage, state);
    }
  }

  // Collectible pickup
  for (const collectible of state.collectibles) {
    if (collectible.collected) continue;
    if (
      aabb(
        {
          x: player.x,
          y: player.y,
          width: player.width,
          height: player.height,
        },
        {
          x: collectible.x,
          y: collectible.y,
          width: collectible.width,
          height: collectible.height,
        },
      )
    ) {
      collectible.collected = true;
      switch (collectible.type) {
        case "health":
          player.health = Math.min(
            player.maxHealth,
            player.health + collectible.value,
          );
          playHealthPickupSound();
          state.floatingMessages.push({
            text: "+1 DOCURA",
            color: "#FF8FB8",
            life: 90,
            maxLife: 90,
            yOffset: -100,
          });
          break;
        case "ammo":
          // GDD §5.3: capacidade limitada por maxAmmo (30 até Z2, 60 na Z3)
          player.ammo = Math.min(
            player.maxAmmo,
            player.ammo + collectible.value,
          );
          playAmmoPickupSound();
          break;
        case "data_chip":
          player.score += collectible.value;
          playCollectSound();
          break;
        case "shield_buff":
          // Bolo: escudo que absorve o próximo hit (GDD §2.4)
          player.shieldActive = true;
          playShieldBuffSound();
          state.floatingMessages.push({
            text: "★ ESCUDO DE BOLO ATIVO! ★",
            color: "#FF8FB8",
            life: 150,
            maxLife: 150,
            yOffset: -80,
          });
          break;
        case "milkshake_buff":
          // Milkshake: munição infinita por 8s — 8s * 60fps = 480 frames
          player.milkshakeTimer = 480;
          playMilkshakeBuffSound();
          state.floatingMessages.push({
            text: "★ MUNICAO INFINITA POR 8s! ★",
            color: "#FFE89B",
            life: 150,
            maxLife: 150,
            yOffset: -80,
          });
          break;
        case "weapon_unlock":
          // Lançador de Bombom: desbloqueia tiro ao final da Zona 1
          player.canShoot = true;
          playWeaponUnlockSound();
          state.floatingMessages.push({
            text: "★ LANCADOR DE BOMBOM DESBLOQUEADO! ★",
            color: "#FFB347",
            life: 240,
            maxLife: 240,
            yOffset: -90,
          });
          state.floatingMessages.push({
            text: "Clique do mouse para mirar, J para tiro reto",
            color: "#FFF8F0",
            life: 240,
            maxLife: 240,
            yOffset: -50,
          });
          break;
      }
      // Particles are spawned elsewhere
    }
  }

  return { newProjectile };
}

export function damagePlayer(player: Player, damage: number, state: GameState) {
  if (player.invincible || !player.alive) return;

  // GDD §2.4: Bolo absorve o próximo hit — escudo consome sem reduzir Doçura
  if (player.shieldActive) {
    player.shieldActive = false;
    player.invincible = true;
    player.invincibleTimer = PLAYER_INVINCIBLE_TIME;
    playHitSound();
    shakeCamera(state.camera, 2, 6);
    // Partículas rosa do escudo estourando
    state.particles.push(
      ...createExplosionParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        "#FFB8D0",
        12,
      ),
    );
    return;
  }

  player.health -= damage;
  player.invincible = true;
  player.invincibleTimer = PLAYER_INVINCIBLE_TIME;

  playHitSound();
  shakeCamera(state.camera, 4, 10);
  state.damageFlashTimer = 15; // GDD: tela pisca vermelho ao receber dano
  state.particles.push(
    ...createExplosionParticles(
      player.x + player.width / 2,
      player.y + player.height / 2,
      COLORS.red,
      8,
    ),
  );

  if (player.health <= 0) {
    player.alive = false;
    player.health = 0;
  }
}
