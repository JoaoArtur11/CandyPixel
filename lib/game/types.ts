// ============================
// CANDY PIXEL - Game Types
// ============================

export type GameScreen =
  | "menu"
  | "ready"
  | "playing"
  | "paused"
  | "gameover"
  | "victory"
  | "credits"
  | "controls"
  | "settings";

export type Direction = "left" | "right";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------- Player ----------
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  direction: Direction;
  health: number;
  maxHealth: number;
  ammo: number;
  // Capacidade máxima de munição — GDD §5.3: 30 até fim da Zona 2, 60 na Zona 3
  maxAmmo: number;
  score: number;
  isGrounded: boolean;
  isJumping: boolean;
  isShooting: boolean;
  shootCooldown: number;
  invincible: boolean;
  invincibleTimer: number;
  animFrame: number;
  animTimer: number;
  alive: boolean;
  // GDD §5.3: tiro só desbloqueado ao coletar Lançador de Bombom no fim da Zona 1
  canShoot: boolean;
  // Buff Bolo: absorve o próximo hit sem reduzir Doçura (GDD §2.4)
  shieldActive: boolean;
  // Buff Milkshake: munição infinita por 8s; armazena frames restantes (GDD §2.4)
  milkshakeTimer: number;
}

// ---------- Enemies ----------
export type EnemyType = "drone" | "tracker" | "turret" | "boss";

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  alive: boolean;
  direction: Direction;
  shootCooldown: number;
  shootTimer: number;
  patrolMinX: number;
  patrolMaxX: number;
  animTimer: number;
  // Boss-specific
  bossPhase?: number;
  bossAttackTimer?: number;
  // Tracker-specific
  trackingPlayer?: boolean;
  lostPlayerTimer?: number;
  homeX?: number;
  homeY?: number;
}

// ---------- Platforms ----------
export type PlatformType = "static" | "moving";

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  // Moving platform
  moveMinX?: number;
  moveMaxX?: number;
  moveMinY?: number;
  moveMaxY?: number;
  moveSpeed?: number;
  moveAxis?: "x" | "y";
  moveDirection?: number;
  glowColor: string;
}

// ---------- Projectiles ----------
export type ProjectileOwner = "player" | "enemy";

export interface Projectile {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  owner: ProjectileOwner;
  damage: number;
  alive: boolean;
  trail: Vector2[];
  color: string;
}

// ---------- Collectibles ----------
// shield_buff   = Bolo (absorve 1 dano e some)
// milkshake_buff = Milkshake (munição infinita por 8s)
// weapon_unlock = Lançador de Bombom (fim da Zona 1)
export type CollectibleType =
  | "health"
  | "ammo"
  | "data_chip"
  | "shield_buff"
  | "milkshake_buff"
  | "weapon_unlock";

export interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  type: CollectibleType;
  collected: boolean;
  animTimer: number;
  value: number;
}

// ---------- Particles ----------
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

// ---------- Camera ----------
export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  shakeIntensity: number;
  shakeTimer: number;
}

// ---------- Level ----------
export type LevelSection = "streets" | "ducts" | "boss";

export interface LevelData {
  platforms: Platform[];
  enemies: Enemy[];
  collectibles: Collectible[];
  totalWidth: number;
  bossArenaX: number;
  sections: {
    streets: { startX: number; endX: number };
    ducts: { startX: number; endX: number };
    boss: { startX: number; endX: number };
  };
}

// ---------- Background ----------
export interface BackgroundBuilding {
  x: number;
  width: number;
  height: number;
  color: string;
  windows: { x: number; y: number; lit: boolean }[];
}

// ---------- Game State ----------
export interface GameState {
  screen: GameScreen;
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  projectiles: Projectile[];
  collectibles: Collectible[];
  particles: Particle[];
  camera: Camera;
  level: LevelData;
  backgroundBuildings: BackgroundBuilding[];
  time: number;
  deltaTime: number;
  bossDefeated: boolean;
  screenShake: number;
  currentZone: LevelSection;
  zoneTransitionTimer: number;
  zoneTransitionName: string;
  damageFlashTimer: number;
  // Zonas que já mostraram o cartaz de boas-vindas — evita repetir se o player
  // voltar para a zona anterior e entrar novamente.
  announcedZones: LevelSection[];
  // Quando true, o jogo pausa entidades e espera o jogador pressionar uma tecla
  // para dispensar o cartaz da nova zona.
  zoneAnnouncePending: boolean;
  // Mensagens flutuantes de feedback (ex: "ARMA DESBLOQUEADA!", buffs ativos)
  floatingMessages: FloatingMessage[];
}

export interface FloatingMessage {
  text: string;
  color: string;
  // Frames restantes / total — usado para fade in/out
  life: number;
  maxLife: number;
  // Posição relativa ao centro da tela; se omitido, fica no topo
  yOffset?: number;
}

// ---------- Input ----------
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  shoot: boolean;
  pause: boolean;
  jumpPressed: boolean;
  shootPressed: boolean;
  pausePressed: boolean;
  unpausePressed: boolean;
  // Posição do cursor em coordenadas do mundo (já com offset de câmera aplicado).
  mouseWorldX: number;
  mouseWorldY: number;
  // true se o último tiro foi requisitado via clique do mouse.
  // O projétil então segue o cursor; tecla de tiro mantém direção horizontal.
  shootFromMouse: boolean;
}
