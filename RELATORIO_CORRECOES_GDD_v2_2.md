# Relatório de Correções — GDD Candy Pixel v2.1 → v2.2

**Data:** 2026-04-22
**Base:** `CANDY_PIXEL_GDD_v2_1-2.docx`
**Objetivo:** consolidar inconsistências identificadas na revisão do GDD e propor textos de substituição, para aplicação direta no documento Word antes do início da implementação.

---

## Resumo Executivo

Foram identificadas **7 inconsistências** e **3 lacunas** no GDD v2.1. Nenhuma compromete o escopo ou o cronograma — todas são ajustes de especificação que evitam decisões improvisadas durante a implementação.

| # | Categoria | Seção(ões) | Severidade |
|---|-----------|-----------|------------|
| 1 | Stack técnica incompleta (Electron não planejado) | 1.1, 9.1, 9.3, 9.4 | **Alta** |
| 2 | Regra de "cair do mapa" não definida | 2.5 | Média |
| 3 | Faixas de HP do boss com gap | 5.1, 6.4 | Média |
| 4 | Trigger do upgrade de munição Z2→Z3 ambíguo | 5.3 | Baixa |
| 5 | Howler.js ausente da stack documentada | 9.1 | Baixa |
| 6 | Resolução + pixel art sem scale factor definido | 7.4 | Média |
| 7 | Dependência entre 5.3 e 2.3 (munição inicial) | 2.3, 5.3 | Baixa |
| 8 | Gap — plano de testes ausente | 9.4 | Média |
| 9 | Gap — não-objetivos não documentados | (novo) | Baixa |
| 10 | Gap — mockups ausentes na seção 10 | 10 | Alta (entrega) |

---

## Decisão pendente: Next.js vs Vite

A ficha técnica (1.1) e a stack (9.1) mantêm **Next.js 15 + React 19**. Para um jogo 2D offline empacotado com Electron, Next.js não agrega valor (SSR, roteamento e build server-side não são usados). **Vite + React** seria mais leve e com build mais rápido.

**Mantive Next.js nas correções abaixo** por ser decisão do time. Se optarem por trocar, as alterações são:
- 1.1 e 9.1: `Next.js 15 + React 19` → `Vite 5 + React 19`
- 9.2: remover `app/` (Next.js), usar estrutura Vite padrão (`src/`, `public/`)
- Cronograma não muda

**Recomendação:** fazer uma POC de 2h na Sprint 1 empacotando "hello world" com Electron na stack escolhida. Se Next.js+Electron mostrar atrito, migrar para Vite ainda custa pouco.

---

## Correções detalhadas

### Correção 1 — Stack técnica: Electron explícito

**Seção 1.1 (Ficha Técnica), linha "Engine / Stack"**

> ❌ **Antes:**
> Next.js + React + TypeScript + HTML5 Canvas API. Empacotado como aplicação desktop utilizando Electron

> ✅ **Depois:**
> Next.js 15 + React 19 + TypeScript + HTML5 Canvas API + Howler.js (áudio). Empacotado como aplicação desktop Windows utilizando Electron (electron-builder para geração do .exe)

**Seção 9.1 (Stack Tecnológica) — adicionar linhas:**

| Tecnologia | Uso no Projeto |
|-----------|----------------|
| Electron | Empacotamento desktop — geração do executável `.exe` |
| electron-builder | Build e distribuição do instalador |
| Howler.js | Biblioteca de áudio — SFX e música |

**Seção 9.3 (Divisão de Tarefas) — adicionar ao Ives Mendes:**
> ◆ Configuração do Electron + electron-builder — POC na Sprint 1, build final na Sprint 6

**Seção 9.4 (Cronograma) — ajustes:**
- **Sprint 1:** adicionar "POC de empacotamento Electron (hello world rodando como .exe)"
- **Sprint 6:** trocar "Build de teste local" por "Build Electron `.exe` — playtesting interno, correção de bugs"

---

### Correção 2 — Regra de "cair do mapa"

**Seção 2.5 (Condições de Vitória e Derrota)**

> ❌ **Antes:**
> ◆ Derrota: pontos de vida do personagem chegam a zero ou cair do mapa.

> ✅ **Depois:**
> ◆ Derrota: pontos de vida do personagem chegam a zero **ou** cair em abismo (queda no vazio abaixo do mapa) — queda em abismo resulta em Game Over instantâneo, independente da vida atual.

**Justificativa:** evita ambiguidade "cair tira 1 vida" vs "cair mata". Instantâneo é o padrão do gênero (Mario, Celeste) e simplifica a implementação: basta checar `player.y > mapHeight + margem` → trigger Game Over.

---

### Correção 3 — Faixas de HP do Boss

**Seção 5.1 (Zona 3 — Clímax)**

> ❌ **Antes:**
> ◆ Boss possui 3 fases de ataque com padrões distintos conforme perde vida

> ✅ **Depois:**
> ◆ Boss possui 3 fases de ataque, cada uma com 5 pontos de HP:
>   - **Fase 1:** HP 15 a 11
>   - **Fase 2:** HP 10 a 6
>   - **Fase 3:** HP 5 a 1
>   - HP 0 → boss derrotado → tela de vitória

**Seção 6.4 (Alface Gigante Chefe) — linha "Fases de ataque"**

> ❌ **Antes:**
> 3 fases conforme perde vida (HP 15→10→5→0)

> ✅ **Depois:**
> 3 fases conforme perde vida — Fase 1: HP 15-11 | Fase 2: HP 10-6 | Fase 3: HP 5-1

**Justificativa:** a notação `15→10→5→0` sugere 4 transições mas só há 3 fases; a notação por range fecha todos os pontos de HP sem gap.

---

### Correção 4 — Trigger do upgrade de munição

**Seção 5.3 (Zona 2 — Recompensa)**

> ❌ **Antes:**
> Ao completar a Zona 2, o jogador recebe uma "Bolsa de Bombons Reforçada" que expande sua capacidade máxima de munição de 30 para 60 unidades. Qualquer munição coletada a partir desse ponto aplica-se ao novo limite.

> ✅ **Depois:**
> Ao atravessar a transição de Zona 2 para Zona 3, o jogador recebe automaticamente a "Bolsa de Bombons Reforçada" — um item narrativo (não coletável) que expande sua capacidade máxima de munição de 30 para 60 unidades. O estoque atual no momento da transição é preservado; apenas o teto máximo aumenta. Qualquer munição coletada a partir desse ponto respeita o novo limite de 60.

---

### Correção 5 — Consistência entre 2.3 e 5.3

**Seção 2.3 (Sistema de Munição)**

> ❌ **Antes:**
> O jogador desbloqueia o sistema de tiro ao final da Zona 1, iniciando a Zona 2 com 30 unidades de munição

> ✅ **Depois:**
> O jogador desbloqueia o sistema de tiro ao final da Zona 1 (coleta do "Lançador de Bombom" — ver 5.3), iniciando a Zona 2 com 30 unidades de munição e capacidade máxima de 30. A capacidade máxima é expandida para 60 ao entrar na Zona 3.

---

### Correção 6 — Resolução e pixel art scale factor

**Seção 7.4 (Especificações Técnicas Visuais)**

> ❌ **Antes:**
> ◆ Resolução de canvas: 1280×720px (16:9)
> ◆ Pixel art sem antialiasing (rendering pixelado via CSS image-rendering: pixelated)

> ✅ **Depois:**
> ◆ Resolução de janela: 1280×720px (16:9)
> ◆ **Resolução lógica do canvas:** 426×240px, escalada ×3 para exibição (scale factor inteiro evita distorção de pixels)
> ◆ Sprites desenhados em resolução nativa 426×240 e renderizados sem antialiasing (`imageSmoothingEnabled = false` no contexto 2D + CSS `image-rendering: pixelated`)
> ◆ Tamanhos de sprite: personagem e inimigos básicos em 16×16 ou 24×24; boss em 48×64

**Justificativa:** sem scale factor fixo, sprites pixel art renderizados em resolução arbitrária ficam borrados ou com pixels de tamanhos desiguais. Scale ×3 (426×240 → 1278×720, com 2px de margem) é padrão seguro.

---

### Gap 8 — Plano de testes mínimo

**Adicionar nova subseção 9.6 após 9.5:**

> **9.6 Plano de Testes Mínimo**
>
> Cada sprint entrega uma funcionalidade que deve ser validada antes de avançar:
>
> | Sprint | Teste de aceite |
> |--------|----------------|
> | 1 | Jogador move, pula e colide com plataforma em 60fps por 2min sem crash |
> | 2 | Alface Voador patrulha e é destruído ao ser atingido; HUD mostra score |
> | 3 | Cenoura persegue dentro do raio; Tomate atira a cada 2,5s; munição esgota e é recoletada |
> | 4 | Boss transita corretamente entre as 3 fases; ondas de inimigos aparecem nos intervalos |
> | 5 | Fluxo completo Menu → Gameplay → Game Over → Menu sem recarregar a aplicação |
> | 6 | `.exe` empacotado abre em máquina Windows limpa (sem Node/npm instalados) |
> | 7 | Playtest com 3 pessoas externas; cada uma completa uma run inteira sem orientação verbal |

---

### Gap 9 — Não-objetivos (escopo explicitamente fora)

**Adicionar nova subseção 1.5 após 1.4:**

> **1.5 Não-objetivos (Fora de Escopo)**
>
> Para manter o escopo viável no prazo da disciplina, os seguintes itens são **explicitamente** fora do escopo desta entrega:
>
> ◆ Suporte a gamepad / joystick (apenas teclado + mouse)
> ◆ Sistema de save / progresso persistente (cada partida começa do zero)
> ◆ Remapeamento de controles pelo jogador
> ◆ Multiplayer local ou online
> ◆ Localização — apenas português brasileiro
> ◆ Suporte a macOS / Linux — build apenas Windows
> ◆ Leaderboard online / integração com serviços externos

---

### Gap 10 — Mockups ausentes (seção 10)

A seção 10 contém apenas as legendas "Figura 1" e "Figura 2", sem as imagens. **Ação requerida antes da entrega:** inserir os mockups no `.docx` original. Não é possível corrigir via texto.

---

## Checklist de aplicação no .docx

Ordem sugerida para editar o documento Word:

- [ ] Seção 1.1 — atualizar linha "Engine / Stack" (Correção 1)
- [ ] Seção 1.5 — criar subseção "Não-objetivos" (Gap 9)
- [ ] Seção 2.3 — atualizar texto da munição (Correção 5)
- [ ] Seção 2.5 — atualizar condição de derrota (Correção 2)
- [ ] Seção 5.1 — atualizar bullet das fases do boss (Correção 3)
- [ ] Seção 5.3 — atualizar texto do upgrade Z2→Z3 (Correção 4)
- [ ] Seção 6.4 — atualizar linha "Fases de ataque" (Correção 3)
- [ ] Seção 7.4 — atualizar especificações técnicas visuais (Correção 6)
- [ ] Seção 9.1 — adicionar linhas Electron, electron-builder, Howler.js (Correção 1)
- [ ] Seção 9.3 — adicionar responsabilidade Electron ao Ives (Correção 1)
- [ ] Seção 9.4 — ajustar Sprint 1 e Sprint 6 (Correção 1)
- [ ] Seção 9.6 — criar subseção "Plano de Testes Mínimo" (Gap 8)
- [ ] Seção 10 — inserir mockups (Gap 10)
- [ ] Rodapé — atualizar versão para "GDD v2.2 — Candy Pixel — Abril 2026"

---

## Decisões a confirmar com a equipe antes da Sprint 1

1. **Next.js ou Vite?** (ver seção no topo)
2. **Renderer do áudio:** Howler.js ou Web Audio API nativa? (mantive Howler.js nas correções)
3. **Resolução lógica 426×240 está OK ou preferem 320×180 (×4) para sprites menores?**
4. **Cair no abismo = Game Over instantâneo** ou prefere "tira 1 vida e respawna no último ponto seguro"? (mantive instantâneo; a segunda opção é mais complexa mas mais amigável)
