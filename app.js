const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const coinsEl = document.querySelector('#coins');
const hiEl = document.querySelector('#high-score');
const levelEl = document.querySelector('#level');
const statusEl = document.querySelector('#status');
const startBtn = document.querySelector('#start');
const pauseBtn = document.querySelector('#pause');
const modeEl = document.querySelector('#mode');
const soundBtn = document.querySelector('#sound-toggle');
const coinBtn = document.querySelector('#use-coin');
const licenseBtn = document.querySelector('#music-license');
const licenseDialog = document.querySelector('#license-dialog');

const size = 18;
const cell = canvas.width / size;
const dirs = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const baseDelay = 150;
let snake, food, golden, coinDrop, walls, dir, nextDir, score, coins, level;
let playing = false;
let paused = false;
let moveTimer;
let growthTimer;
let effectTimer;
let speedFactor = 1;
let swipeStart;
let sound = true;
let audio;
let bgm;

const high = () => Number(localStorage.getItem('snakebyte-high') || 0);
const saveHigh = () => localStorage.setItem('snakebyte-high', String(Math.max(high(), score)));
const same = (a, b) => a.x === b.x && a.y === b.y;
const blocked = (p) => snake.some((s) => same(s, p)) || walls.some((w) => same(w, p));

function beep(freq, duration = .08, type = 'square') {
  if (!sound) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audio ??= new AudioCtor();
  if (audio.state === 'suspended') audio.resume();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(.045, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function playBgm() {
  if (!sound) return;
  bgm ??= new Audio('assets/blossom.mp3');
  bgm.loop = true;
  bgm.volume = .25;
  bgm.play().catch(() => {});
}

function stopBgm() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

function emptyCell() {
  let point;
  do point = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
  while (blocked(point));
  return point;
}

function hasPath(start, target, candidateWalls) {
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  while (queue.length) {
    const point = queue.shift();
    if (same(point, target)) return true;
    for (const d of Object.values(dirs)) {
      const next = { x: point.x + d.x, y: point.y + d.y };
      const key = `${next.x},${next.y}`;
      if (next.x < 0 || next.x >= size || next.y < 0 || next.y >= size || seen.has(key)) continue;
      if (candidateWalls.some((wall) => same(wall, next)) || snake.some((part) => same(part, next))) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

function buildWalls() {
  if (modeEl.value !== 'level') return [];
  const segmentCount = Math.min(10, Math.max(1, Math.ceil((2 + (level - 1) * 2) / 2)));
  const wallDirs = [dirs.right, dirs.down];
  let safe = [];
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = [];
    for (let segment = 0; segment < segmentCount; segment += 1) {
      const length = 2 + Math.floor(Math.random() * 3);
      const direction = wallDirs[Math.floor(Math.random() * wallDirs.length)];
      const start = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
      const blocks = Array.from({ length }, (_, index) => ({ x: start.x + direction.x * index, y: start.y + direction.y * index }));
      if (blocks.every((point) => point.x >= 0 && point.x < size && point.y >= 0 && point.y < size && !snake.some((part) => same(part, point)) && !same(point, food) && !candidate.some((wall) => same(wall, point)))) candidate.push(...blocks);
    }
    if (candidate.length && hasPath(snake[0], food, candidate)) {
      safe = candidate;
      break;
    }
  }
  return safe;
}

function updateHud() {
  scoreEl.textContent = score;
  coinsEl.textContent = coins;
  hiEl.textContent = high();
  levelEl.textContent = level;
}

function reset() {
  clearTimeout(moveTimer);
  clearTimeout(growthTimer);
  clearTimeout(effectTimer);
  stopBgm();
  speedFactor = 1;
  snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
  dir = dirs.right;
  nextDir = dir;
  score = 0;
  coins = 0;
  level = 1;
  walls = [];
  food = emptyCell();
  golden = null;
  coinDrop = null;
  playing = false;
  paused = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'PAUSE';
  updateHud();
  render();
  statusEl.textContent = 'Arrow keys / WASD / swipe to move.';
}

function start() {
  reset();
  playing = true;
  walls = buildWalls();
  startBtn.textContent = 'RESTART';
  pauseBtn.disabled = false;
  playBgm();
  scheduleMove();
  scheduleGrowth();
}

function scheduleMove() {
  clearTimeout(moveTimer);
  if (!playing || paused) return;
  const levelFactor = Math.min(2.5, 1 + (level - 1) * .1);
  moveTimer = setTimeout(() => { move(); scheduleMove(); }, baseDelay / (levelFactor * speedFactor));
}

function scheduleGrowth() {
  clearTimeout(growthTimer);
  if (!playing || paused) return;
  growthTimer = setTimeout(() => { grow(); scheduleGrowth(); }, 5000);
}

function grow() {
  if (!snake.length) return;
  snake.push({ ...snake[snake.length - 1] });
  beep(260, .1, 'triangle');
  statusEl.textContent = 'AUTO GROWTH +1';
  setTimeout(() => { if (playing && !paused) statusEl.textContent = 'Arrow keys / WASD / swipe to move.'; }, 500);
  render();
}

function move() {
  if (!playing || paused) return;
  coinDrop = null;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
    return gameOver('WALL HIT — GAME OVER');
  }
  if (walls.some((wall) => same(wall, head))) return gameOver('WALL HIT — GAME OVER');
  const ate = same(head, food);
  const body = ate ? snake : snake.slice(0, -1);
  if (body.some((part) => same(part, head))) return gameOver('SELF HIT — GAME OVER');

  snake.unshift(head);
  if (ate) {
    score += 10;
    beep(520);
    if (Math.random() < .1) { coins += 1; coinDrop = { ...head }; beep(880, .12, 'triangle'); }
    food = emptyCell();
    if (Math.random() < .12) golden = emptyCell();
    const nextLevel = 1 + Math.floor(score / 50);
    if (nextLevel !== level) { level = nextLevel; walls = buildWalls(); beep(680, .12, 'triangle'); }
  } else {
    snake.pop();
  }
  if (golden && same(head, golden)) {
    score += 25;
    golden = null;
    applySpeed(1.25, 'GOLDEN BYTE! SPEED UP');
    beep(740, .16, 'sawtooth');
  }
  saveHigh();
  updateHud();
  render();
}

function applySpeed(factor, message) {
  clearTimeout(effectTimer);
  speedFactor = factor;
  statusEl.textContent = message;
  effectTimer = setTimeout(() => {
    speedFactor = 1;
    if (playing && !paused) statusEl.textContent = 'Arrow keys / WASD / swipe to move.';
  }, 5000);
}

function gameOver(message) {
  playing = false;
  paused = false;
  clearTimeout(moveTimer);
  clearTimeout(growthTimer);
  stopBgm();
  pauseBtn.disabled = true;
  beep(110, .25, 'sawtooth');
  statusEl.textContent = message;
  saveHigh();
  updateHud();
}

function togglePause() {
  if (!playing) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
  statusEl.textContent = paused ? 'PAUSED' : 'Arrow keys / WASD / swipe to move.';
  if (paused) { clearTimeout(moveTimer); clearTimeout(growthTimer); bgm?.pause(); }
  else { playBgm(); scheduleMove(); scheduleGrowth(); }
}

function render() {
  ctx.fillStyle = '#10102c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0,229,255,.08)';
  for (let i = 1; i < size; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height);
    ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell);
    ctx.stroke();
  }
  walls.forEach((wall) => draw(wall, '#7c1dfd', 'square'));
  if (food) draw(food, '#ff2d95', 'circle');
  if (golden) draw(golden, '#ffd300', 'circle');
  if (coinDrop) draw(coinDrop, '#ffd300', 'triangle');
  snake.forEach((part, index) => draw(part, index ? '#2bff88' : '#ff3030', index ? 'square' : 'triangle', dir));
}

function draw(point, color, shape = 'square', direction = dirs.up) {
  const centerX = point.x * cell + cell / 2;
  const centerY = point.y * cell + cell / 2;
  ctx.fillStyle = color;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(centerX, centerY, cell / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'triangle') {
    ctx.beginPath();
    const radius = cell / 2 - 2;
    const tip = { x: centerX + direction.x * radius, y: centerY + direction.y * radius };
    const base = { x: centerX - direction.x * radius, y: centerY - direction.y * radius };
    const perpendicular = { x: -direction.y * radius * .8, y: direction.x * radius * .8 };
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(base.x + perpendicular.x, base.y + perpendicular.y);
    ctx.lineTo(base.x - perpendicular.x, base.y - perpendicular.y);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(point.x * cell + 2, point.y * cell + 2, cell - 4, cell - 4);
  }
}

function setDirection(name) {
  const next = dirs[name];
  if (next && next.x !== -nextDir.x && next.y !== -nextDir.y) {
    nextDir = next;
    beep(180, .025, 'triangle');
  }
}

document.addEventListener('keydown', (event) => {
  if (licenseDialog.open) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const map = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ' ': 'pause' };
  if (map[key]) {
    event.preventDefault();
    if (map[key] === 'pause') togglePause(); else setDirection(map[key]);
  }
});

document.querySelectorAll('[data-dir]').forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.dir)));
canvas.addEventListener('touchstart', (event) => { swipeStart = event.touches[0]; }, { passive: true });
canvas.addEventListener('touchend', (event) => {
  if (!swipeStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipeStart.clientX;
  const dy = touch.clientY - swipeStart.clientY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  swipeStart = null;
}, { passive: true });

startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', togglePause);
coinBtn.addEventListener('click', () => {
  if (coins < 1) { statusEl.textContent = 'NO FROG COINS'; return; }
  coins -= 1;
  applySpeed(.75, 'FROG COIN! SLOW DOWN');
  beep(300, .12, 'triangle');
  updateHud();
});
soundBtn.addEventListener('click', () => {
  sound = !sound;
  soundBtn.textContent = `SOUND: ${sound ? 'ON' : 'OFF'}`;
  soundBtn.setAttribute('aria-pressed', String(!sound));
  if (sound) { beep(660); if (playing && !paused) playBgm(); }
  else bgm?.pause();
});
licenseBtn.addEventListener('click', () => licenseDialog.showModal());
licenseDialog.addEventListener('click', (event) => { if (event.target === licenseDialog) licenseDialog.close(); });
licenseDialog.addEventListener('close', () => licenseBtn.focus());
modeEl.addEventListener('change', () => { if (playing) start(); });

reset();
