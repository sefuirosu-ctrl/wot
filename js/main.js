// js/main.js - ПОЛНЫЙ ФАЙЛ С ЛОКАЛИЗАЦИЕЙ, ИГРОЙ И НАСТРОЙКАМИ
import { loadLanguage, t } from "./i18n.js";
import { localizeAllUI, localizeHUD } from "./ui-localization.js";
import { Events } from "./events.js";
import { PETS } from "./pets.js";

/* ======================
   BUILD INFO
====================== */
const BUILD_VERSION = "2.1.0";

/* ======================
   CONSTANTS
====================== */
const COLS = 10;
const ROWS = 20;
const CELL = 30;

const FALL_BASE = 800;
const FALL_MIN = 60;
const LOCK_DELAY_BASE = 300;

/* ======================
   GAME STATE
====================== */
const Game = {
  started: false,
  paused: false,
  gameOver: false,
  gameOverTime: 0,

  score: 0,
  level: 1,
  lines: 0,

  effects: [],
  lockDelayBonus: 0,

  hero: null,
  pet: null
};

// PlayerSettings теперь будет заполняться из GameSettings
const PlayerSettings = {
  language: "en",
  difficulty: "normal"
};

const DIFFICULTY_MULTIPLIER = {
  easy: 0.7,
  normal: 1.0,
  hard: 1.3,
  hardcore: 1.6
};

/* ======================
   PIECE STATE MACHINE
====================== */
const PieceState = {
  FALLING: "FALLING",
  LANDED: "LANDED",
  LOCKING: "LOCKING",
  SPAWNING: "SPAWNING"
};

let pieceState = PieceState.SPAWNING;

/* ======================
   DOM ELEMENTS
====================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const holdCanvas = document.getElementById("hold");
const nextCanvas = document.getElementById("next");
const holdCtx = holdCanvas.getContext("2d");
const nextCtx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const timeEl  = document.getElementById("time");

/* ======================
   TETROMINOES
====================== */
const COLORS = [
  null,
  "#00f0f0","#f0f000","#a000f0",
  "#00f000","#f00000","#0000f0","#f0a000"
];

const SHAPES = [
  [],
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
];

/* ======================
   FIELD
====================== */
let board;
let activePiece;
let nextPiece;
let holdPiece;
let canHold = true;

/* ======================
   TIMERS
====================== */
let lastTime = 0;
let fallTimer = 0;
let lockTimer = 0;
let startTime = 0;

/* ======================
   GRAPHICS SETTINGS
====================== */
let graphicsSettings = {
  ghostPiece: true,
  gridLines: true,
  holdPreview: true,
  nextPreview: true
};

/* ======================
   HELPERS
====================== */
const clone = m => m.map(r => r.slice());

function createPiece() {
  const id = Math.floor(Math.random() * 7) + 1;
  return {
    shape: clone(SHAPES[id]),
    color: id,
    x: 4,
    y: 0
  };
}

function collides(p, x, y) {
  return p.shape.some((r, dy) => r.some((v, dx) => {
    if (!v) return false;
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return true;
    return board[ny][nx];
  }));
}

/* ======================
   UPDATE GRAPHICS SETTINGS
====================== */
function updateGraphicsSettings() {
  // Получаем текущие настройки из GameSettings если доступны
  if (window.GameSettings && window.GameSettings.initialized) {
    graphicsSettings = {
      ghostPiece: window.GameSettings.ghost_piece,
      gridLines: window.GameSettings.grid_lines,
      holdPreview: window.GameSettings.hold_preview,
      nextPreview: window.GameSettings.next_preview
    };
  }
  
  // Если превью отключены, очищаем холсты
  if (!graphicsSettings.holdPreview) {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  }
  
  if (!graphicsSettings.nextPreview) {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  }
}

/* ======================
   DRAW GRID
====================== */
function drawGrid() {
  if (!graphicsSettings.gridLines) return;
  
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  
  // Вертикальные линии
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ROWS * CELL);
    ctx.stroke();
  }
  
  // Горизонтальные линии
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(COLS * CELL, y * CELL);
    ctx.stroke();
  }
}

/* ======================
   LOCALIZATION BRIDGE
====================== */
function initLocalization() {
  // Language теперь загружается через settings.js
  console.log("Localization initialized via settings system");
}

// Listen for encyclopedia open events
document.addEventListener("open-encyclopedia", () => {
  console.log("Opening encyclopedia - handled by encyclopedia.js");
});

/* ======================
   INIT
====================== */
function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  activePiece = createPiece();
  nextPiece = createPiece();
  holdPiece = { shape: clone(activePiece.shape), color: activePiece.color };

  Game.score = 0;
  Game.level = 1;
  Game.lines = 0;
  Game.gameOver = false;
  Game.started = false;
  Game.paused = false;

  canHold = true;
  pieceState = PieceState.FALLING;

  fallTimer = 0;
  lockTimer = 0;
  startTime = performance.now();
  
  // Обновляем настройки графики
  updateGraphicsSettings();
  
  // Update HUD labels after reset
  localizeHUD();
}

/* ======================
   EFFECTS (ВОССТАНОВЛЕННЫЙ ФУНКЦИОНАЛ)
====================== */
Events.on("effect:add", effect => {
  Game.effects.push({ ...effect, timer: effect.duration ?? 0 });
});

function updateEffects(dt) {
  Game.lockDelayBonus = 0;

  Game.effects = Game.effects.filter(e => {
    if (e.timer > 0) {
      e.timer -= dt;
      if (e.type === "LOCK_DELAY_BOOST") {
        Game.lockDelayBonus = e.value;
      }
      return e.timer > 0;
    }
    return false;
  });
}

/* ======================
   MERGE & CLEAR (ВОССТАНОВЛЕННЫЙ ФУНКЦИОНАЛ)
====================== */
function mergePiece() {
  activePiece.shape.forEach((r, y) =>
    r.forEach((v, x) => {
      if (!v) return;
      const by = activePiece.y + y;
      const bx = activePiece.x + x;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = activePiece.color;
      }
    })
  );
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(v => v)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }

  if (cleared) {
    Game.lines += cleared;
    Game.score += cleared * 100 * Game.level;
    Game.level = 1 + Math.floor(Game.lines / 10);
    
    // Эффекты в зависимости от количества очищенных линий
    if (cleared >= 4) {
      Events.emit("effect:add", {
        type: "CLEAR_BOOST",
        value: 50,
        duration: 5000
      });
    }
  }
}

/* ======================
   INPUT HANDLING (ВОССТАНОВЛЕННЫЙ ФУНКЦИОНАЛ)
====================== */
document.addEventListener("keydown", e => {
  // ESC - возврат в меню или закрытие модальных окон
  if (e.code === "Escape") {
    // Если открыта энциклопедия - закрываем
    const encyclopedia = document.getElementById("encyclopedia");
    if (encyclopedia && !encyclopedia.classList.contains("hidden")) {
      document.dispatchEvent(new Event("encyclopedia:close"));
      return;
    }
    
    // Если открыты настройки - закрываем
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && !settingsModal.classList.contains("hidden")) {
      document.querySelector('[data-action="close-settings"]')?.click();
      return;
    }
    
    // Если игра в процессе - показываем меню
    if (Game.started && !Game.gameOver) {
      returnToMenu();
      return;
    }
    
    // Если игра окончена - возврат в меню
    if (Game.gameOver) {
      returnToMenu();
      return;
    }
  }

  // GAME OVER → RETURN TO MENU
  if (Game.gameOver) {
    Game.gameOver = false;
    Game.started = false;

    const menu = document.getElementById("startScreen");
    menu.classList.remove("menu-hidden", "menu-hero", "menu-pet");
    menu.classList.add("menu-title");
    
    // Re-localize menu when returning
    document.dispatchEvent(new CustomEvent('languageChanged'));
    return;
  }

  if (!Game.started || Game.paused || Game.gameOver) return;

  // PAUSE HANDLING
  if (e.code === "KeyP" || e.code === "Pause") {
    Game.paused = !Game.paused;
    return;
  }

  // HARD DROP
  if (e.code === "Space") {
    while (!collides(activePiece, activePiece.x, activePiece.y + 1)) {
      activePiece.y++;
      Game.score += 2;
    }
    pieceState = PieceState.LOCKING;
    return;
  }

  // HOLD PIECE
  if ((e.code === "ShiftLeft" || e.code === "ControlLeft") && canHold) {
    const tmp = holdPiece;
    holdPiece = { shape: clone(activePiece.shape), color: activePiece.color };
    activePiece = { shape: clone(tmp.shape), color: tmp.color, x: 4, y: 0 };
    canHold = false;
    pieceState = PieceState.FALLING;
    return;
  }

  // MOVEMENT
  if ((e.code === "ArrowLeft" || e.code === "KeyA") && !collides(activePiece, activePiece.x - 1, activePiece.y)) {
    activePiece.x--;
  }
  if ((e.code === "ArrowRight" || e.code === "KeyD") && !collides(activePiece, activePiece.x + 1, activePiece.y)) {
    activePiece.x++;
  }
  
  // ROTATION
  if ((e.code === "ArrowUp" || e.code === "KeyW")) {
    const r = activePiece.shape[0].map((_, i) =>
      activePiece.shape.map(row => row[i]).reverse()
    );
    if (!collides({ shape: r }, activePiece.x, activePiece.y)) {
      activePiece.shape = r;
    }
  }
  
  // SOFT DROP
  if ((e.code === "ArrowDown" || e.code === "KeyS") && !collides(activePiece, activePiece.x, activePiece.y + 1)) {
    activePiece.y++;
  }
});

/* ======================
   UPDATE LOOP (ВОССТАНОВЛЕННЫЙ С ИНТЕГРАЦИЕЙ НАСТРОЕК)
====================== */
function update(dt) {
  updateEffects(dt);

  // Получаем текущую сложность из настроек
  const currentSettings = window.getCurrentSettings ? window.getCurrentSettings() : null;
  const difficulty = currentSettings?.difficulty || PlayerSettings.difficulty;
  const mult = DIFFICULTY_MULTIPLIER[difficulty] || 1.0;
  
  const speed = Math.max(FALL_MIN, (FALL_BASE - (Game.level - 1) * 55) / mult);

  if (pieceState === PieceState.FALLING) {
    fallTimer += dt;
    if (fallTimer >= speed) {
      fallTimer = 0;
      if (!collides(activePiece, activePiece.x, activePiece.y + 1)) {
        activePiece.y++;
      } else {
        pieceState = PieceState.LANDED;
      }
    }
  }

  if (pieceState === PieceState.LANDED) {
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY_BASE + Game.lockDelayBonus) {
      pieceState = PieceState.LOCKING;
    }
  }

  if (pieceState === PieceState.LOCKING) {
    mergePiece();
    clearLines();

    activePiece = nextPiece;
    nextPiece = createPiece();
    canHold = true;

    lockTimer = 0;
    fallTimer = 0;

    if (collides(activePiece, activePiece.x, activePiece.y)) {
      Game.gameOver = true;
      Game.gameOverTime = performance.now();
    } else {
      pieceState = PieceState.FALLING;
    }
  }
}

/* ======================
   DRAW HELPERS (ВОССТАНОВЛЕННЫЙ)
====================== */
function drawBlock(x, y, c) {
  ctx.fillStyle = COLORS[c];
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
}

function drawMiniPiece(ctxMini, piece, cell) {
  if (!piece) return;
  ctxMini.clearRect(0, 0, ctxMini.canvas.width, ctxMini.canvas.height);

  piece.shape.forEach((row, y) => {
    row.forEach((v, x) => {
      if (!v) return;
      ctxMini.fillStyle = COLORS[piece.color];
      ctxMini.fillRect(x * cell, y * cell, cell, cell);
      ctxMini.strokeStyle = "#111";
      ctxMini.strokeRect(x * cell, y * cell, cell, cell);
    });
  });
}

/* ======================
   DRAW (ВОССТАНОВЛЕННЫЙ С ИНТЕГРАЦИЕЙ НАСТРОЕК)
====================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем сетку если включена
  drawGrid();

  board.forEach((r, y) => r.forEach((v, x) => v && drawBlock(x, y, v)));

  // Призрачная фигура если включена
  if (graphicsSettings.ghost_piece) {
    let gy = activePiece.y;
    while (!collides(activePiece, activePiece.x, gy + 1)) gy++;
    ctx.globalAlpha = 0.25;
    activePiece.shape.forEach((r, sy) => r.forEach((v, sx) => {
      if (v) drawBlock(activePiece.x + sx, gy + sy, activePiece.color);
    }));
    ctx.globalAlpha = 1;
  }

  // Активная фигура
  activePiece.shape.forEach((r, sy) => r.forEach((v, sx) => {
    if (v) drawBlock(activePiece.x + sx, activePiece.y + sy, activePiece.color);
  }));

  // Hold и Next превью если включены
  if (graphicsSettings.hold_preview && holdPiece) {
    drawMiniPiece(holdCtx, holdPiece, 24);
  }
  
  if (graphicsSettings.next_preview && nextPiece) {
    drawMiniPiece(nextCtx, nextPiece, 24);
  }

  scoreEl.textContent = Game.score;
  levelEl.textContent = Game.level;
  linesEl.textContent = Game.lines;

  const tSec = Math.floor((performance.now() - startTime) / 1000);
  timeEl.textContent = `${String(Math.floor(tSec/60)).padStart(2,"0")}:${String(tSec%60).padStart(2,"0")}`;

  // PAUSED OVERLAY
  if (Game.paused) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f0f000";
    ctx.font = "bold 28px Segoe UI";
    ctx.fillText(t('paused') || "PAUSED", canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "14px Segoe UI";
    ctx.fillText(
      t('press_p_to_continue') || "Press P to continue",
      canvas.width / 2,
      canvas.height / 2 + 26
    );
  }

  // GAME OVER OVERLAY (с локализацией)
  if (Game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 28px Segoe UI";
    ctx.fillText(t('game_over'), canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "16px Segoe UI";
    ctx.fillText(
      `Score: ${Game.score} | Level: ${Game.level} | Lines: ${Game.lines}`,
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    ctx.font = "14px Segoe UI";
    ctx.fillText(
      t('press_any_key'),
      canvas.width / 2,
      canvas.height / 2 + 40
    );
  }
}

/* ======================
   MAIN LOOP (ВОССТАНОВЛЕННЫЙ)
====================== */
function loop(t) {
  const dt = t - lastTime;
  lastTime = t;

  if (Game.started && !Game.paused && !Game.gameOver) {
    update(dt);
  }

  draw();
  requestAnimationFrame(loop);
}

/* ======================
   MENU FSM (ОБНОВЛЕННЫЙ)
====================== */
const menu = document.getElementById("startScreen");

// Проверка что элемент существует
if (!menu) {
    console.error('ERROR: Menu element not found!');
} else {
    console.log('Menu element found, adding listeners');
    
    menu.addEventListener("click", e => {
        console.log('=== MENU CLICK ===');
        console.log('Target:', e.target.tagName, e.target.className);
        
        const btn = e.target.closest("button");
        if (!btn) {
            console.log('No button found');
            return;
        }
        
        console.log('Button found:', btn.textContent);
        console.log('Dataset:', btn.dataset);
        console.log('Current menu class:', menu.className);

        // START GAME
        if (btn.dataset.action === "start") {
            console.log('Switching to hero selection');
            menu.classList.remove("menu-title");
            menu.classList.add("menu-hero");
            console.log('New class:', menu.className);
        }

        // HERO SELECTION
        if (btn.dataset.hero) {
            console.log('Hero selected:', btn.dataset.hero);
            Game.hero = btn.dataset.hero;
            menu.classList.remove("menu-hero");
            menu.classList.add("menu-pet");
            console.log('Switched to pet selection');
            console.log('Game.hero:', Game.hero);
            console.log('Menu class:', menu.className);
        }

        // PET SELECTION
        if (btn.dataset.pet) {
            console.log('Pet selected:', btn.dataset.pet);
            Game.pet = btn.dataset.pet;
            menu.classList.add("menu-hidden");
            console.log('Starting game...');
            console.log('Hero:', Game.hero, 'Pet:', Game.pet);
            startNewGame();
        }

        // TUTORIAL
        if (btn.dataset.action === "tutorial") {
            console.log('Opening tutorial');
            document.dispatchEvent(new Event("open-encyclopedia"));
        }

        // SETTINGS
        if (btn.dataset.action === "settings") {
            console.log('Opening settings');
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                console.log('Settings modal found, removing hidden class');
                settingsModal.classList.remove('hidden');
            } else {
                console.error('Settings modal not found!');
            }
        }
    });
}

/* ======================
   RETURN TO MENU FUNCTION
====================== */
function returnToMenu() {
  Game.started = false;
  Game.paused = false;
  Game.gameOver = false;

  const menu = document.getElementById("startScreen");
  const gameArea = document.getElementById("gameArea");
  const encyclopedia = document.getElementById("encyclopedia");
  const settingsModal = document.getElementById("settingsModal");

  // Скрываем все остальные элементы
  if (gameArea) gameArea.classList.add("hidden");
  if (encyclopedia) encyclopedia.classList.add("hidden");
  if (settingsModal) settingsModal.classList.add("hidden");

  // Показываем главное меню
  if (menu) {
    menu.classList.remove("menu-hidden", "menu-hero", "menu-pet", "hidden");
    menu.classList.add("menu-title");
  }
  
  console.log("Returned to main menu");
  
  // Re-localize menu when returning
  document.dispatchEvent(new CustomEvent('languageChanged'));
}

/* ======================
   START NEW GAME (ИСПРАВЛЕННЫЙ)
====================== */
function startNewGame() {
  resetGame();

  // Скрываем меню, показываем игровую область
  const menu = document.getElementById("startScreen");
  const gameArea = document.getElementById("gameArea");
  
  if (menu) menu.classList.add("hidden");
  if (gameArea) gameArea.classList.remove("hidden");

  lastTime = performance.now();
  fallTimer = 0;
  lockTimer = 0;
  pieceState = PieceState.FALLING;

  Game.started = true;
  
  console.log("Game started! Hero:", Game.hero, "Pet:", Game.pet);
}

/* ======================
   INITIALIZATION
====================== */

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initLocalization();
  
  // Слушаем событие открытия настроек
  document.addEventListener('settingsModal:open', () => {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.classList.remove('hidden');
    }
  });
  
  // Слушаем событие открытия энциклопедии
  document.addEventListener('open-encyclopedia', () => {
    const encyclopedia = document.getElementById('encyclopedia');
    const menu = document.getElementById('startScreen');
    if (encyclopedia && menu) {
      encyclopedia.classList.remove('hidden');
      menu.classList.add('hidden');
    }
  });
  
  // Слушаем событие закрытия энциклопедии
  document.addEventListener('encyclopedia:close', () => {
    const encyclopedia = document.getElementById('encyclopedia');
    const menu = document.getElementById('startScreen');
    if (encyclopedia && menu) {
      encyclopedia.classList.add('hidden');
      menu.classList.remove('hidden');
    }
  });
  
  // Слушаем событие изменения настроек
  document.addEventListener('settingsChanged', (event) => {
    if (event.detail && event.detail.settings) {
      // Обновляем настройки графики
      updateGraphicsSettings();
      
      // Обновляем PlayerSettings
      if (window.PlayerSettings) {
        window.PlayerSettings.language = event.detail.settings.language;
        window.PlayerSettings.difficulty = event.detail.settings.difficulty;
      }
    }
  });
  
  requestAnimationFrame(loop);
});

// Export for debugging
window.Game = Game;
window.Events = Events;
window.startNewGame = startNewGame;
window.returnToMenu = returnToMenu;

// Глобальный доступ к настройкам
if (!window.getCurrentSettings && window.GameSettings) {
  window.getCurrentSettings = () => ({ ...window.GameSettings });
}