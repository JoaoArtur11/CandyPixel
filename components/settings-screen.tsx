"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from "@/lib/game/constants";
import {
  playMenuSelectSound,
  setMusicVolume,
  setSfxVolume,
  getMusicVolume,
  getSfxVolumeValue,
} from "@/lib/game/audio";
import { drawCandyTitle } from "@/lib/game/candy-ui";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  getKeyDisplayName,
  ACTION_LABELS,
  type GameAction,
  type GameSettings,
  type KeyBindings,
  isKeyConflict,
} from "@/lib/game/settings";
import { refreshKeyMap } from "@/lib/game/input";

interface SettingsScreenProps {
  onBack: () => void;
}

// Itens do menu: 6 ações (cada com 2 slots) + 2 sliders de volume + restaurar padrão
type MenuSection = "controls" | "volume" | "actions";

interface MenuItem {
  section: MenuSection;
  action?: GameAction;
  slotIndex?: number; // 0 = primária, 1 = secundária
  volumeType?: "music" | "sfx";
  id: string;
}

function buildMenuItems(): MenuItem[] {
  const items: MenuItem[] = [];
  const actions: GameAction[] = [
    "left",
    "right",
    "jump",
    "down",
    "shoot",
    "pause",
  ];

  for (const action of actions) {
    items.push({
      section: "controls",
      action,
      slotIndex: 0,
      id: `${action}-0`,
    });
    items.push({
      section: "controls",
      action,
      slotIndex: 1,
      id: `${action}-1`,
    });
  }

  items.push({ section: "volume", volumeType: "music", id: "vol-music" });
  items.push({ section: "volume", volumeType: "sfx", id: "vol-sfx" });
  items.push({ section: "actions", id: "reset" });

  return items;
}

// Hitbox de um elemento interativo no canvas (coordenadas lógicas 1280x720).
// Usada para mapear cliques de mouse → índice do menu.
interface Hitbox {
  x: number;
  y: number;
  w: number;
  h: number;
  itemIndex: number;
  // Para barras de volume: se true, clicar em posição x ajusta o valor
  isVolumeBar?: boolean;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const hitboxesRef = useRef<Hitbox[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [remapping, setRemapping] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const menuItems = buildMenuItems();

  const updateAndSave = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    refreshKeyMap();
  }, []);

  // Converte coordenadas do evento de mouse → coordenadas lógicas (1280x720)
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const findHitboxAt = useCallback((x: number, y: number): Hitbox | null => {
    for (const hb of hitboxesRef.current) {
      if (x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) {
        return hb;
      }
    }
    return null;
  }, []);

  // Hover: ao passar o mouse sobre um elemento, muda seleção
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (remapping) return;
      const { x, y } = getCanvasCoords(e);
      const hb = findHitboxAt(x, y);
      if (hb && hb.itemIndex !== selectedIndex) {
        setSelectedIndex(hb.itemIndex);
      }
    },
    [getCanvasCoords, findHitboxAt, remapping, selectedIndex],
  );

  // Click: aciona o elemento clicado.
  //   - Slot de controle → inicia remapeamento
  //   - Barra de volume → ajusta valor pela posição X do clique
  //   - Restaurar padrão → reseta settings
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (remapping) return;
      const { x, y } = getCanvasCoords(e);
      const hb = findHitboxAt(x, y);
      if (!hb) return;

      setSelectedIndex(hb.itemIndex);
      const item = menuItems[hb.itemIndex];

      if (item.section === "controls" && item.action) {
        setRemapping(true);
        setConflictMsg(null);
        playMenuSelectSound();
        return;
      }

      if (item.section === "volume" && item.volumeType && hb.isVolumeBar) {
        // Hitbox inclui 60px extras do rótulo %; só a faixa útil da barra
        // (primeiros 340px) vale para o cálculo do valor.
        const BAR_WIDTH = 340;
        const barStart = hb.x;
        const barEnd = hb.x + BAR_WIDTH;
        const clamped = Math.max(barStart, Math.min(x, barEnd));
        const ratio = (clamped - barStart) / BAR_WIDTH;
        const newVal = Math.round(ratio * 100);
        if (item.volumeType === "music") {
          setMusicVolume(newVal);
          updateAndSave({ ...settings, musicVolume: newVal });
        } else {
          setSfxVolume(newVal);
          updateAndSave({ ...settings, sfxVolume: newVal });
        }
        playMenuSelectSound();
        return;
      }

      if (item.section === "actions" && item.id === "reset") {
        const defaults = resetSettings();
        setSettings(defaults);
        refreshKeyMap();
        setMusicVolume(defaults.musicVolume);
        setSfxVolume(defaults.sfxVolume);
        playMenuSelectSound();
      }
    },
    [
      getCanvasCoords,
      findHitboxAt,
      remapping,
      menuItems,
      settings,
      updateAndSave,
    ],
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      timeRef.current++;
      const t = timeRef.current;

      // Reset hitboxes a cada frame — são repopulados abaixo conforme desenho
      const hitboxes: Hitbox[] = [];

      // Background candy
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, COLORS.backgroundGradientTop);
      grad.addColorStop(1, COLORS.backgroundGradientBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sprinkles decorativos ao fundo
      const sprinkleColors = [
        COLORS.magenta,
        COLORS.cyan,
        COLORS.yellow,
        COLORS.purple,
      ];
      for (let i = 0; i < 18; i++) {
        const px = (i * 149 + 30) % CANVAS_WIDTH;
        const py = (i * 83 + Math.sin(t * 0.01 + i) * 18) % CANVAS_HEIGHT;
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(t * 0.02 + i) * 0.1;
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.translate(px, py);
        ctx.rotate(i * 0.7);
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
      }

      // Título em gradient candy
      drawCandyTitle(ctx, "Configuracoes", CANVAS_WIDTH / 2, 45, 30);

      // Divider
      ctx.strokeStyle = COLORS.cyan + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2 - 250, 60);
      ctx.lineTo(CANVAS_WIDTH / 2 + 250, 60);
      ctx.stroke();

      // === SEÇÃO CONTROLES ===
      const controlsY = 100;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 20px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "left";
      ctx.fillText("★ CONTROLES", 120, controlsY);

      ctx.fillStyle = COLORS.darkPurple + "AA";
      ctx.font = "14px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "right";
      ctx.fillText(
        "ENTER para remapear  |  DEL para limpar",
        CANVAS_WIDTH - 120,
        controlsY,
      );

      const actions: GameAction[] = [
        "left",
        "right",
        "jump",
        "down",
        "shoot",
        "pause",
      ];
      const rowH = 42;
      const startY = controlsY + 28;

      for (let ai = 0; ai < actions.length; ai++) {
        const action = actions[ai];
        const y = startY + ai * rowH;
        const keys = settings.keyBindings[action];

        // Label da ação — maior, mais legível
        ctx.fillStyle = COLORS.darkPurple + "EE";
        ctx.font = "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "right";
        ctx.fillText(ACTION_LABELS[action], CANVAS_WIDTH / 2 - 80, y + 24);

        // Slot primário e secundário
        for (let slot = 0; slot < 2; slot++) {
          const itemIdx = ai * 2 + slot;
          const isSelected = itemIdx === selectedIndex;
          const isRemapping = isSelected && remapping;

          const slotX = CANVAS_WIDTH / 2 - 60 + slot * 190;
          const slotW = 170;
          const slotH = 34;
          const slotY = y + 6;
          const slotR = 10;

          // Registrar hitbox do slot para clique/hover
          hitboxes.push({
            x: slotX,
            y: slotY,
            w: slotW,
            h: slotH,
            itemIndex: itemIdx,
          });

          // Background do slot — PILL CANDY CLARO para contraste com o fundo rosa
          if (isRemapping) {
            ctx.fillStyle = "#FFE89B"; // amarelo baunilha sólido
            ctx.strokeStyle = "#FF9F40";
            ctx.shadowColor = "#FFB347";
            ctx.shadowBlur = 12;
          } else if (isSelected) {
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = COLORS.magenta;
            ctx.shadowColor = COLORS.magenta;
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = "#FFFFFFD8"; // branco translúcido — alto contraste
            ctx.strokeStyle = COLORS.magenta + "70";
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.roundRect(slotX, slotY, slotW, slotH, slotR);
          ctx.fill();
          ctx.lineWidth = isSelected ? 2 : 1.5;
          ctx.beginPath();
          ctx.roundRect(slotX, slotY, slotW, slotH, slotR);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Texto da tecla — fonte maior, escura
          if (isRemapping) {
            const blink = Math.sin(t * 0.15) > 0;
            ctx.fillStyle = blink ? "#8B5A00" : "#8B5A0080";
            ctx.font = "bold 15px 'Fredoka', 'Comic Sans MS', cursive, serif";
            ctx.textAlign = "center";
            ctx.fillText("PRESSIONE...", slotX + slotW / 2, slotY + 23);
          } else {
            const keyCode = keys[slot];
            ctx.fillStyle = keyCode
              ? COLORS.darkPurple
              : COLORS.darkPurple + "55";
            ctx.font = "bold 16px 'Fredoka', 'Comic Sans MS', cursive, serif";
            ctx.textAlign = "center";
            ctx.fillText(
              keyCode
                ? getKeyDisplayName(keyCode)
                : slot === 1
                  ? "---"
                  : "VAZIO",
              slotX + slotW / 2,
              slotY + 23,
            );
          }
        }
      }

      // Conflito message
      if (conflictMsg) {
        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 14px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "center";
        ctx.fillText(
          conflictMsg,
          CANVAS_WIDTH / 2,
          startY + actions.length * rowH + 20,
        );
      }

      // === SEÇÃO VOLUME ===
      const volSectionY = startY + actions.length * rowH + 40;
      ctx.fillStyle = COLORS.magenta;
      ctx.font = "bold 20px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "left";
      ctx.fillText("♪ VOLUME", 120, volSectionY);

      ctx.fillStyle = COLORS.darkPurple + "AA";
      ctx.font = "14px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "right";
      ctx.fillText("← → para ajustar", CANVAS_WIDTH - 120, volSectionY);

      const volTypes: Array<{
        type: "music" | "sfx";
        label: string;
        value: number;
      }> = [
        { type: "music", label: "Musica", value: settings.musicVolume },
        { type: "sfx", label: "Efeitos", value: settings.sfxVolume },
      ];

      const volStartY = volSectionY + 26;
      const controlItemCount = actions.length * 2;

      for (let vi = 0; vi < volTypes.length; vi++) {
        const vol = volTypes[vi];
        const y = volStartY + vi * 44;
        const itemIdx = controlItemCount + vi;
        const isSelected = itemIdx === selectedIndex;

        // Label
        ctx.fillStyle = COLORS.darkPurple + "EE";
        ctx.font = "bold 17px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "right";
        ctx.fillText(vol.label, CANVAS_WIDTH / 2 - 80, y + 20);

        // Barra de volume — fundo branco candy
        const barX = CANVAS_WIDTH / 2 - 60;
        const barW = 340;
        const barH = 22;
        const barY = y + 6;
        const barR = 11;

        // Registrar hitbox da barra (clique ajusta valor pela posição X)
        hitboxes.push({
          x: barX,
          y: barY - 6,
          w: barW + 60, // inclui área do texto % para clique ser mais fácil
          h: barH + 12,
          itemIndex: itemIdx,
          isVolumeBar: true,
        });

        // Background claro
        ctx.fillStyle = isSelected ? "#FFFFFF" : "#FFFFFFC0";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barR);
        ctx.fill();

        // Fill colorido
        const fillW = (vol.value / 100) * barW;
        const volColor = vol.type === "music" ? COLORS.magenta : "#FFB347";
        const volGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        volGrad.addColorStop(0, volColor);
        volGrad.addColorStop(1, "#FFD86B");
        ctx.fillStyle = volGrad;
        if (fillW > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, barR);
          ctx.clip();
          ctx.fillRect(barX, barY, fillW, barH);
          ctx.restore();
        }

        // Borda
        ctx.strokeStyle = isSelected ? COLORS.magenta : COLORS.magenta + "80";
        ctx.lineWidth = isSelected ? 2 : 1.5;
        if (isSelected) {
          ctx.shadowColor = COLORS.magenta;
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barR);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Porcentagem
        ctx.fillStyle = COLORS.darkPurple;
        ctx.font = "bold 16px 'Fredoka', 'Comic Sans MS', cursive, serif";
        ctx.textAlign = "left";
        ctx.fillText(`${vol.value}%`, barX + barW + 14, barY + 17);
      }

      // === RESTAURAR PADRÃO ===
      const resetY = volStartY + volTypes.length * 44 + 24;
      const resetIdx = controlItemCount + volTypes.length;
      const isResetSelected = selectedIndex === resetIdx;

      hitboxes.push({
        x: CANVAS_WIDTH / 2 - 140,
        y: resetY,
        w: 280,
        h: 40,
        itemIndex: resetIdx,
      });

      ctx.fillStyle = isResetSelected ? "#FF8B8B" : "#FFFFFFB0";
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 140, resetY, 280, 40, 14);
      ctx.fill();
      ctx.strokeStyle = isResetSelected ? COLORS.red : COLORS.red + "70";
      ctx.lineWidth = isResetSelected ? 2 : 1.5;
      if (isResetSelected) {
        ctx.shadowColor = COLORS.red;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 140, resetY, 280, 40, 14);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isResetSelected ? "#FFFFFF" : COLORS.red;
      ctx.font = "bold 16px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText("RESTAURAR PADRAO", CANVAS_WIDTH / 2, resetY + 26);

      // Footer
      ctx.fillStyle = COLORS.darkPurple + "90";
      ctx.font = "14px 'Fredoka', 'Comic Sans MS', cursive, serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "W/S ou mouse para navegar  |  ESC para voltar",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 24,
      );

      // Commit dos hitboxes do frame — usados pelos handlers de mouse
      hitboxesRef.current = hitboxes;

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [selectedIndex, remapping, settings, conflictMsg, menuItems]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Se está remapeando, capturar a tecla pressionada
      if (remapping) {
        e.preventDefault();

        // ESC cancela o remapeamento
        if (e.code === "Escape") {
          setRemapping(false);
          setConflictMsg(null);
          return;
        }

        const item = menuItems[selectedIndex];
        if (!item.action || item.slotIndex === undefined) return;

        // Verificar conflitos
        const conflict = isKeyConflict(
          settings.keyBindings,
          item.action,
          e.code,
        );
        if (conflict) {
          setConflictMsg(
            `"${getKeyDisplayName(e.code)}" ja esta em uso por "${ACTION_LABELS[conflict]}"`,
          );
          setTimeout(() => setConflictMsg(null), 2000);
          return;
        }

        // Aplicar nova tecla
        const newBindings: KeyBindings = { ...settings.keyBindings };
        const keys = [...newBindings[item.action]] as [string, string | null];
        keys[item.slotIndex] = e.code;
        newBindings[item.action] = keys as [string, string | null];

        const newSettings = { ...settings, keyBindings: newBindings };
        updateAndSave(newSettings);
        setRemapping(false);
        setConflictMsg(null);
        playMenuSelectSound();
        return;
      }

      // Navegação normal
      if (e.code === "Escape" || e.code === "Backspace") {
        e.preventDefault();
        playMenuSelectSound();
        onBack();
        return;
      }

      // Navegação vertical com grade: controles têm 2 colunas, ↓/↑ preserva coluna.
      // Layout:
      //   idx 0..11  = controles (6 linhas × 2 colunas, primário=par, secundário=ímpar)
      //   idx 12     = volume música
      //   idx 13     = volume SFX
      //   idx 14     = restaurar padrão
      const CONTROLS_COUNT = 12;
      const VOL_MUSIC = 12;
      const VOL_SFX = 13;
      const RESET_IDX = 14;

      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          let next: number;
          if (prev < CONTROLS_COUNT) {
            // Nos controles: sobe 2 preservando coluna; wrap no topo vai para reset
            next = prev - 2;
            if (next < 0) next = RESET_IDX;
          } else if (prev === VOL_MUSIC) {
            // Música → pause primário (última linha de controles, coluna 0)
            next = 10;
          } else if (prev === VOL_SFX) {
            next = VOL_MUSIC;
          } else {
            // Reset → SFX
            next = VOL_SFX;
          }
          playMenuSelectSound();
          return next;
        });
        return;
      }

      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          let next: number;
          if (prev < CONTROLS_COUNT) {
            // Nos controles: desce 2 preservando coluna; transborda para volume música
            next = prev + 2;
            if (next >= CONTROLS_COUNT) next = VOL_MUSIC;
          } else if (prev === VOL_MUSIC) {
            next = VOL_SFX;
          } else if (prev === VOL_SFX) {
            next = RESET_IDX;
          } else {
            // Reset → primeiro controle (wrap)
            next = 0;
          }
          playMenuSelectSound();
          return next;
        });
        return;
      }

      const item = menuItems[selectedIndex];

      // ← / → alternam coluna dentro dos controles (primário ↔ secundário).
      // Em outras seções, seguem para o ajuste de volume abaixo.
      if (item.section === "controls") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          if (selectedIndex % 2 === 1) {
            setSelectedIndex(selectedIndex - 1);
            playMenuSelectSound();
          }
          return;
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          if (selectedIndex % 2 === 0) {
            setSelectedIndex(selectedIndex + 1);
            playMenuSelectSound();
          }
          return;
        }
      }

      // Enter = ação
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();

        if (item.section === "controls" && item.action) {
          // Iniciar remapeamento
          setRemapping(true);
          setConflictMsg(null);
          playMenuSelectSound();
        } else if (item.section === "actions" && item.id === "reset") {
          // Restaurar padrão
          const defaults = resetSettings();
          setSettings(defaults);
          refreshKeyMap();
          setMusicVolume(defaults.musicVolume);
          setSfxVolume(defaults.sfxVolume);
          playMenuSelectSound();
        }
        return;
      }

      // Delete = limpar slot de tecla
      if (e.code === "Delete" || e.code === "Backspace") {
        if (
          item.section === "controls" &&
          item.action &&
          item.slotIndex !== undefined
        ) {
          e.preventDefault();
          const newBindings: KeyBindings = { ...settings.keyBindings };
          const keys = [...newBindings[item.action]] as [string, string | null];

          // Não permitir limpar se é a única tecla restante
          if (item.slotIndex === 0 && !keys[1]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }
          if (item.slotIndex === 1 && !keys[0]) {
            setConflictMsg("Acao precisa ter pelo menos 1 tecla");
            setTimeout(() => setConflictMsg(null), 2000);
            return;
          }

          keys[item.slotIndex] = null;
          // Se limpou o primário, mover secundário para primário
          if (item.slotIndex === 0 && keys[1]) {
            keys[0] = keys[1];
            keys[1] = null;
          }
          newBindings[item.action] = keys as [string, string | null];

          const newSettings = { ...settings, keyBindings: newBindings };
          updateAndSave(newSettings);
          playMenuSelectSound();
        }
        return;
      }

      // ← → = ajustar volume
      if (item.section === "volume" && item.volumeType) {
        const step = 5;
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          const current =
            item.volumeType === "music"
              ? settings.musicVolume
              : settings.sfxVolume;
          const newVal = Math.max(0, current - step);
          if (item.volumeType === "music") {
            setMusicVolume(newVal);
            updateAndSave({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            updateAndSave({ ...settings, sfxVolume: newVal });
          }
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          const current =
            item.volumeType === "music"
              ? settings.musicVolume
              : settings.sfxVolume;
          const newVal = Math.min(100, current + step);
          if (item.volumeType === "music") {
            setMusicVolume(newVal);
            updateAndSave({ ...settings, musicVolume: newVal });
          } else {
            setSfxVolume(newVal);
            updateAndSave({ ...settings, sfxVolume: newVal });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, remapping, settings, menuItems, onBack, updateAndSave]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        imageRendering: "pixelated",
        width: "100%",
        maxWidth: `${CANVAS_WIDTH}px`,
        height: "auto",
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        cursor: "pointer",
      }}
      tabIndex={0}
    />
  );
}
