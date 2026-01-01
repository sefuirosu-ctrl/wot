// js/main.js - ПОЛНЫЙ ФАЙЛ С ЛОКАЛИЗАЦИЕЙ И ИГРОЙ
import { loadLanguage, t } from "./i18n.js";
import { localizeAllUI, localizeHUD } from "./ui-localization.js";
import { Events } from "./events.js";
import { PETS } from "./pets.js";

/* ======================
   BUILD INFO
====================== */
const BUILD_VERSION = "2.0.0";

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

const PlayerSettings = {
  language: "en",
  difficulty: "normal"
};

const DIFFICULTY_MULTIPLIER = {
  easy: 0.5,
  normal: 1.0,
  hard: 1.5,
  hardcore: 2.0
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
   DOM
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
   LOCALIZATION BRIDGE (ТОЛЬКО ВЫЗОВЫ)
====================== */
function initLocalization() {
  // Load language from session or default
  const userLang = PlayerSettings.language || 'en';
  
  loadLanguage(userLang)
    .then(() => {
      localizeAllUI();
    })
    .catch((err) => {
      console.warn("Language load failed:", err);
      loadLanguage('en').then(localizeAllUI);
    });
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

  canHold = true;
  pieceState = PieceState.FALLING;

  fallTimer = 0;
  lockTimer = 0;
  startTime = performance.now();
  
  // Update HUD labels after reset
  localizeHUD();
}

/* ======================
   EFFECTS
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
   MERGE & CLEAR
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
  }
}

/* ======================
   INPUT
====================== */
document.addEventListener("keydown", e => {

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

  if (e.code === "Space") {
    while (!collides(activePiece, activePiece.x, activePiece.y + 1)) {
      activePiece.y++;
      Game.score += 2;
    }
    pieceState = PieceState.LOCKING;
    return;
  }

  if ((e.code === "ShiftLeft" || e.code === "ControlLeft") && canHold) {
    const tmp = holdPiece;
    holdPiece = { shape: clone(activePiece.shape), color: activePiece.color };
    activePiece = { shape: clone(tmp.shape), color: tmp.color, x: 4, y: 0 };
    canHold = false;
    pieceState = PieceState.FALLING;
    return;
  }

  if ((e.code === "ArrowLeft" || e.code === "KeyA") && !collides(activePiece, activePiece.x - 1, activePiece.y)) {
    activePiece.x--;
  }
  if ((e.code === "ArrowRight" || e.code === "KeyD") && !collides(activePiece, activePiece.x + 1, activePiece.y)) {
    activePiece.x++;
  }
  if ((e.code === "ArrowUp" || e.code === "KeyW")) {
    const r = activePiece.shape[0].map((_, i) =>
      activePiece.shape.map(row => row[i]).reverse()
    );
    if (!collides({ shape: r }, activePiece.x, activePiece.y)) {
      activePiece.shape = r;
    }
  }
  if ((e.code === "ArrowDown" || e.code === "KeyS") && !collides(activePiece, activePiece.x, activePiece.y + 1)) {
    activePiece.y++;
  }
});

/* ======================
   UPDATE LOOP
====================== */
function update(dt) {
  updateEffects(dt);

  const mult = DIFFICULTY_MULTIPLIER[PlayerSettings.difficulty] || 1.0;
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
   DRAW HELPERS
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
   DRAW
====================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((r, y) => r.forEach((v, x) => v && drawBlock(x, y, v)));

  let gy = activePiece.y;
  while (!collides(activePiece, activePiece.x, gy + 1)) gy++;
  ctx.globalAlpha = 0.25;
  activePiece.shape.forEach((r, sy) => r.forEach((v, sx) => {
    if (v) drawBlock(activePiece.x + sx, gy + sy, activePiece.color);
  }));
  ctx.globalAlpha = 1;

  activePiece.shape.forEach((r, sy) => r.forEach((v, sx) => {
    if (v) drawBlock(activePiece.x + sx, activePiece.y + sy, activePiece.color);
  }));

  drawMiniPiece(holdCtx, holdPiece, 24);
  drawMiniPiece(nextCtx, nextPiece, 24);

  scoreEl.textContent = Game.score;
  levelEl.textContent = Game.level;
  linesEl.textContent = Game.lines;

  const tSec = Math.floor((performance.now() - startTime) / 1000);
  timeEl.textContent = `${String(Math.floor(tSec/60)).padStart(2,"0")}:${String(tSec%60).padStart(2,"0")}`;

  // GAME OVER OVERLAY (используем локализацию)
  if (Game.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.font = "bold 28px Segoe UI";
    ctx.fillText(t('game_over'), canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#e6e6e6";
    ctx.font = "14px Segoe UI";
    ctx.fillText(
      t('press_any_key'),
      canvas.width / 2,
      canvas.height / 2 + 26
    );
  }
}

/* ======================
   MAIN LOOP
====================== */
function loop(t){
  const dt = t - lastTime;
  lastTime = t;

  if (Game.started && !Game.paused && !Game.gameOver) {
    update(dt);
  }

  draw();
  requestAnimationFrame(loop);
}

/* ======================
   MENU FSM
====================== */
const menu = document.getElementById("startScreen");

menu.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.dataset.action === "start") {
    menu.classList.remove("menu-title");
    menu.classList.add("menu-hero");
  }

  if (btn.dataset.hero) {
    Game.hero = btn.dataset.hero;
    menu.classList.remove("menu-hero");
    menu.classList.add("menu-pet");
  }

  if (btn.dataset.pet) {
    Game.pet = btn.dataset.pet;
    menu.classList.add("menu-hidden");
    startNewGame();
  }

  if (btn.dataset.action === "tutorial") {
    document.dispatchEvent(new Event("open-encyclopedia"));
  }

  if (btn.dataset.action === "settings") {
    alert(t('settings_coming_soon') || "Settings coming soon");
  }
});

/* ======================
   START
====================== */
function startNewGame() {
  resetGame();

  lastTime = performance.now();
  fallTimer = 0;
  lockTimer = 0;
  pieceState = PieceState.FALLING;

  Game.started = true;
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initLocalization();
  requestAnimationFrame(loop);
});

// Export for debugging
window.Game = Game;
window.Events = Events;