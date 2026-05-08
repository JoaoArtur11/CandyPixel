# CANDY PIXEL

Jogo 2D side-scroller de ação / run & gun desenvolvido com Canvas API e Next.js. Em um mundo feito de doces invadido por alimentos saudáveis, o jogador é o último rebelde açucarado disposto a atravessar o mapa e derrotar o Alface Gigante no QG das Verduras.

## Gameplay

**Objetivo:** atravessar Candy Land e Candy Woods devorando doces e eliminando vilões verdes, até chegar ao QG das Verduras e derrotar o Alface Gigante.

### Zonas

| Zona | Nome | Descrição |
|------|------|-----------|
| 1 | Candy Land | Terreno plano, inimigos básicos, sem projéteis. Zona de aprendizado. |
| 2 | Candy Woods | Plataformas em alturas variadas, inimigos rastreadores e atiradores. Munição mais escassa. |
| 3 | QG das Verduras | Arena do boss. Alface Gigante com 3 fases (HP 15→11, 10→6, 5→1). |

### Inimigos

| Inimigo | HP | Comportamento | Score |
|---------|----|--------------|-------|
| Alface Voador | 1 | Patrulha horizontal entre dois pontos | 10 |
| Cenoura Rastreadora | 2 | Persegue o jogador no raio de detecção, retorna após 3s | 25 |
| Tomate Atirador | 3 | Estacionário, dispara a cada 2,5s | 40 |
| Alface Gigante (Boss) | 15 | 3 fases com padrões distintos; contato causa 2 HP | 500 |

### Sistemas

- **Doçura (vida):** 5 pontos, exibidos como cupcakes no HUD. I-frames de 1,5s após dano.
- **Bombons (munição):** começa em 30 na Zona 2, expande para 60 na Zona 3.
- **Buffs:** Bolo (escudo que absorve 1 hit) e Milkshake (munição infinita por 8s).
- **Queda em abismo:** Game Over instantâneo.

### Controles

| Tecla | Ação |
|-------|------|
| A / D ou Setas | Mover |
| W / Espaço | Pular |
| S / Seta Baixo | Descer de plataforma |
| J / Clique Esquerdo | Atirar na direção do cursor |
| ESC | Pausar |
| P | Continuar (quando pausado) |

Controles podem ser remapeados em **CONFIGURAÇÕES** no menu principal.

## Stack Tecnológica

- **Engine:** Canvas 2D (sem bibliotecas externas de jogo)
- **Framework:** Next.js 16 + React 19
- **Linguagem:** TypeScript
- **Áudio:** Web Audio API (síntese procedural)
- **Estilização:** Tailwind CSS
- **Resolução:** 1280×720 (16:9)

## Arquitetura

```
lib/game/
  engine.ts      — loop principal, game state, update/render
  types.ts       — interfaces (Player, Enemy, GameState, etc.)
  constants.ts   — constantes de gameplay, física, paleta candy
  player.ts     — movimento, pulo, tiro, i-frames
  enemies.ts    — IA dos inimigos (patrulha, perseguição, tiro, boss)
  levels.ts     — geração das 3 zonas
  projectiles.ts — bombons e projéteis inimigos
  collisions.ts  — AABB
  camera.ts     — follow suave + screen shake
  renderer.ts    — desenho de tudo (sprites, HUD, parallax)
  particles.ts   — explosões e coletas
  audio.ts      — síntese procedural (SFX + chiptune)
  input.ts      — teclado + mouse
  settings.ts    — persistência de configurações (localStorage)

components/
  game-canvas.tsx    — canvas de jogo (React)
  menu-screen.tsx    — menu principal
  settings-screen.tsx — remapeamento + volume
  credits-screen.tsx — créditos
  game-over-screen.tsx
  victory-screen.tsx
  controls-screen.tsx — tutorial
```

## Como rodar

```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`. O GDD interativo está em `/gdd`.

### Build de produção
```bash
npm run build
npm run start
```

## Equipe

| Nome | Responsabilidade |
|------|------------------|
| Ives Leonardo Mendes Lima | Arquitetura, game loop, física, câmera |
| José Lucas Marques Silva | Tiro, Doçura, munição, buffs |
| Pablo Farias | IA dos inimigos, boss Alface Gigante |
| Andreas Leonardo | Menus, HUD, pontuação, feedbacks |
| João Artur Veras | Pixel art, áudio, level design, parallax |

**Disciplina:** Introdução ao Desenvolvimento de Jogos
**Professor:** Samuel Vinícius Pereira de Oliveira
**Instituto:** iCEV — 2026.1

## Base técnica

O motor de jogo foi construído sobre a estrutura do projeto acadêmico [game-facul](https://github.com/sammuelmsaraiva/game-facul) (tema original: cyberpunk). Toda a camada visual, narrativa, balanceamento e mecânicas temáticas (Doçura, bombons, buffs, inimigos) foram adaptadas conforme o GDD Candy Pixel v2.1.

## Licença

Projeto acadêmico — uso educacional.
