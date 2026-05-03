// ============================
// CANDY PIXEL - Game Constants
// ============================

// Canvas (GDD: 1280×720, 16:9)
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Physics
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;

// Player
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;
export const PLAYER_SPEED = 5.5;
export const PLAYER_JUMP_FORCE = -13;
export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_START_AMMO = 30; // GDD § 2.3: munição inicial (Bombons)
export const PLAYER_SHOOT_COOLDOWN = 12; // frames
export const PLAYER_INVINCIBLE_TIME = 90; // frames (1.5s at 60fps)

// Projectiles
export const PLAYER_BULLET_SPEED = 10;
export const PLAYER_BULLET_DAMAGE = 1;
export const ENEMY_BULLET_SPEED = 5;
export const ENEMY_BULLET_DAMAGE = 1;
export const BULLET_WIDTH = 12;
export const BULLET_HEIGHT = 4;
export const TRAIL_LENGTH = 5;

// Enemies
export const DRONE_WIDTH = 36;
export const DRONE_HEIGHT = 28;
export const DRONE_SPEED = 2.0; // GDD: 2.0 u/s na Zona 1
export const DRONE_SPEED_Z2 = 3.5; // GDD: 3.5 u/s na Zona 2
export const DRONE_HEALTH = 1; // GDD: 1 HP
export const DRONE_SHOOT_COOLDOWN = 120; // frames

export const TRACKER_WIDTH = 32;
export const TRACKER_HEIGHT = 30;
export const TRACKER_SPEED = 1.2; // patrol speed
export const TRACKER_CHASE_SPEED = 4.0; // chase speed (GDD: 4.0 u/s)
export const TRACKER_HEALTH = 2;
export const TRACKER_DETECTION_RADIUS = 360; // ~6 unidades (GDD: raio 6)
export const TRACKER_LOST_TIME = 180; // 3s at 60fps — tempo para desistir da perseguição

export const TURRET_WIDTH = 32;
export const TURRET_HEIGHT = 32;
export const TURRET_HEALTH = 3;
export const TURRET_SHOOT_COOLDOWN = 150; // GDD: intervalo 2.5s (150 frames a 60fps)
export const TURRET_BULLET_SPEED = 6; // GDD: velocidade do projétil 6.0 u/s

// Boss (GDD: 15 HP, 3 fases)
export const BOSS_WIDTH = 120;
export const BOSS_HEIGHT = 100;
export const BOSS_HEALTH = 15;
export const BOSS_SHOOT_COOLDOWN_P1 = 60; // Fase 1: tiro único a cada 1s
export const BOSS_SHOOT_COOLDOWN_P2 = 45; // Fase 2: 2 tiros a cada 0.75s
export const BOSS_SHOOT_COOLDOWN_P3 = 30; // Fase 3: rajada a cada 0.5s
export const BOSS_SPAWN_COOLDOWN_P1 = 600; // Fase 1: drones a cada 10s
export const BOSS_SPAWN_COOLDOWN_P2 = 480; // Fase 2: trackers a cada 8s
export const BOSS_SPAWN_COOLDOWN_P3 = 300; // Fase 3: ondas mistas a cada 5s
export const BOSS_BULLET_SPREAD = 0.3; // radians

// Collectibles
export const COLLECTIBLE_SIZE = 20;
export const HEALTH_RESTORE = 1;
export const AMMO_RESTORE = 10;
export const DATA_CHIP_SCORE = 100;

// Score (GDD v2.0: drone=10, rastreador=25, atirador=40)
export const DRONE_KILL_SCORE = 10;
export const TRACKER_KILL_SCORE = 25;
export const TURRET_KILL_SCORE = 40;
export const BOSS_KILL_SCORE = 500;

// Camera
export const CAMERA_LERP = 0.08;
export const CAMERA_OFFSET_X = CANVAS_WIDTH * 0.35;
export const CAMERA_OFFSET_Y = CANVAS_HEIGHT * 0.5;

// Level
export const GROUND_Y = CANVAS_HEIGHT - 40;
export const PLATFORM_HEIGHT = 16;
export const VOID_Y = CANVAS_HEIGHT + 200; // fall below this = death

// Section widths
export const STREETS_WIDTH = 3000; // Candy Land width
export const DUCTS_WIDTH = 3500; // Candy Woods width
export const BOSS_ARENA_WIDTH = CANVAS_WIDTH;

// Colors (Candy Pixel Palette — GDD § 7.3)
export const COLORS = {
  // Backgrounds — gradiente suave céu de algodão-doce
  background: "#FFD6E8", // Rosa algodão-doce
  backgroundGradientTop: "#FFC0DE", // Rosa pastel topo
  backgroundGradientBottom: "#E8B5F0", // Lavanda pastel base
  // Cores temáticas (mantém chaves antigas mas valores candy)
  magenta: "#FF8FB8", // Rosa chiclete
  cyan: "#9FE8E0", // Hortelã claro
  neonGreen: "#A8D88A", // Verde matcha pastel
  red: "#FF8B8B", // Vermelho morango pastel
  orange: "#FFB370", // Laranja caramelo
  yellow: "#FFE89B", // Amarelo baunilha
  purple: "#C8A8E8", // Lavanda
  darkPurple: "#8B6BAE", // Lavanda escura
  white: "#FFF8F0", // Branco baunilha
  black: "#3A2840", // Marrom-uva escuro (em vez de preto puro)
  gray: "#B8A4C8", // Cinza lilás
  darkGray: "#6B4F7A", // Cinza-uva
  // Player — cupcake protagonista (rosa+marrom)
  playerBody: "#FFB8D0", // Rosa cupcake
  playerGlow: "#FFE89B", // Brilho dourado
  // Inimigos — vegetais um pouco saturados pra contrastar com fundo pastel
  droneBody: "#7FBE5C", // Verde alface vivo
  droneGlow: "#A8D88A",
  trackerBody: "#FF9550", // Laranja cenoura
  trackerGlow: "#FFB370",
  turretBody: "#E85858", // Vermelho tomate
  turretGlow: "#FF8B8B",
  bossBody: "#3D7A2E", // Verde alface gigante (mais escuro pra ser ameaçador)
  bossGlow: "#7FBE5C",
  // Plataformas — waffle/biscoito
  platformGlow: "#D4956B", // Cor de biscoito
  // Projéteis
  bulletPlayer: "#E8117F", // Framboesa intenso — contrasta com fundo rosa pastel e casinhas caramelo
  bulletEnemy: "#7FBE5C", // Verde
  // Coletáveis
  healthPickup: "#FF8FB8", // Cupcake rosa
  ammoPickup: "#FFB347", // Embalagem dourada
  dataChip: "#C8A8E8", // Pirulito lavanda
  // HUD
  hud: "#FFF8F0",
  hudHealth: "#FF8FB8",
  hudAmmo: "#FFB347",
  hudScore: "#FFE89B",
} as const;

// Particles
export const PARTICLE_COUNT_EXPLOSION = 15;
export const PARTICLE_COUNT_COLLECT = 8;
export const PARTICLE_LIFE = 40; // frames
