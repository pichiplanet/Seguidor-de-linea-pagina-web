// --- Inject CSS ---
if (!document.getElementById('poolgame-style')) {
  const style = document.createElement('style');
  style.id = 'poolgame-style';
  style.textContent = `
#pool-game-container {
  display: none;
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  margin: auto;
  width: 640px;
  max-width: 98vw;
  height: 420px;
  max-height: 90vh;
  background: rgba(20,20,20,0.93);
  border-radius: 18px;
  box-shadow: 0 0 32px #000;
  z-index: 9998;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
body.dou-mode #pool-game-container {
  display: flex;
}
#pool-game {
  background: #165a1e;
  border-radius: 12px;
  margin: 14px auto 0 auto;
  display: block;
  box-shadow: 0 0 20px #0006;
  border: 4px solid #222;
}
#pool-game-instructions {
  color: #fff;
  font-weight: bold;
  font-size: 1.07rem;
  margin-top: 10px;
  letter-spacing: 0.04em;
  text-align: center;
  text-shadow: 0 1px 4px #000a;
}
  `;
  document.head.appendChild(style);
}

// --- Inject HTML ---
if (!document.getElementById('pool-game-container')) {
  const html = document.createElement('div');
  html.id = 'pool-game-container';
  html.innerHTML = `
    <canvas id="pool-game" width="600" height="350"></canvas>
    <div id="pool-game-instructions">
      Turno de <span id="pool-player-name">Rojo</span> — Haz clic o toca para tirar
    </div>
  `;
  document.body.appendChild(html);
}

// --- POOL GAME LOGIC ---
const poolColors = ["red", "blue", "green", "pink"];
const poolNames = ["Rojo", "Azul", "Verde", "Rosa"];
let poolBalls, poolCurrentPlayer, poolGameActive;
let poolWidth = 600, poolHeight = 350;

function resetPoolGame() {
  poolBalls = [
    {x: 100, y: 175, vx: 0, vy: 0, color: "red", alive: true},
    {x: 200, y: 175, vx: 0, vy: 0, color: "blue", alive: true},
    {x: 300, y: 175, vx: 0, vy: 0, color: "green", alive: true},
    {x: 400, y: 175, vx: 0, vy: 0, color: "pink", alive: true}
  ];
  poolCurrentPlayer = 0;
  poolGameActive = true;
  updatePlayerName();
  drawPoolGame(document.getElementById("pool-game").getContext("2d"));
}

function updatePlayerName() {
  let tries = 0;
  while (!poolBalls[poolCurrentPlayer].alive && tries < 5) {
    poolCurrentPlayer = (poolCurrentPlayer + 1) % poolBalls.length;
    tries++;
  }
  document.getElementById("pool-player-name").textContent = poolNames[poolCurrentPlayer];
}

function drawPoolGame(ctx) {
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.fillStyle = "#165a1e";
  ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.fillStyle = "#111";
  for (const [px,py] of [[0,0],[ctx.canvas.width,0],[0,ctx.canvas.height],[ctx.canvas.width,ctx.canvas.height]]) {
    ctx.beginPath(); ctx.arc(px,py,24,0,Math.PI*2); ctx.fill();
  }
  for (const ball of poolBalls) {
    if (!ball.alive) continue;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 18, 0, Math.PI*2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function updatePoolGame() {
  for (const ball of poolBalls) {
    if (!ball.alive) continue;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.98;
    ball.vy *= 0.98;
    if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.05) ball.vy = 0;
    if (ball.x < 18) { ball.x = 18; ball.vx *= -0.7; }
    if (ball.x > poolWidth - 18) { ball.x = poolWidth - 18; ball.vx *= -0.7; }
    if (ball.y < 18) { ball.y = 18; ball.vy *= -0.7; }
    if (ball.y > poolHeight - 18) { ball.y = poolHeight - 18; ball.vy *= -0.7; }
    let pocketed = false;
    if (Math.hypot(ball.x, ball.y) < 22) pocketed = true;
    if (Math.hypot(ball.x - poolWidth, ball.y) < 22) pocketed = true;
    if (Math.hypot(ball.x, ball.y - poolHeight) < 22) pocketed = true;
    if (Math.hypot(ball.x - poolWidth, ball.y - poolHeight) < 22) pocketed = true;
    if (pocketed) {
      ball.alive = false;
      ball.vx = ball.vy = 0;
    }
  }
  for (let i=0; i<poolBalls.length; ++i) for (let j=i+1; j<poolBalls.length; ++j) {
    const a = poolBalls[i], b = poolBalls[j];
    if (!a.alive || !b.alive) continue;
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx,dy);
    if (dist > 0 && dist < 36) {
      const nx = dx/dist, ny = dy/dist;
      const overlap = 36 - dist;
      a.x -= nx * overlap/2; b.x += nx * overlap/2;
      a.y -= ny * overlap/2; b.y += ny * overlap/2;
      const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
      const impact = dvx * nx + dvy * ny;
      if (impact > 0) continue;
      const impulse = impact * 0.85;
      a.vx += impulse * nx; a.vy += impulse * ny;
      b.vx -= impulse * nx; b.vy -= impulse * ny;
    }
  }
}

function poolIsBallsMoving() {
  return poolBalls.some(b=>b.alive&&(Math.abs(b.vx)>0.1||Math.abs(b.vy)>0.1));
}

function getAliveCount() {
  return poolBalls.reduce((acc,b)=>acc+(b.alive?1:0),0);
}

function poolGameLoop() {
  if (!poolGameActive) return;
  const ctx = document.getElementById("pool-game").getContext("2d");
  updatePoolGame();
  drawPoolGame(ctx);

  if (getAliveCount() === 1) {
    poolGameActive = false;
    const winner = poolBalls.findIndex(b=>b.alive);
    setTimeout(()=>{
      document.getElementById("pool-game-instructions").innerHTML =
        `<span style="color:${poolColors[winner]}; font-weight:bold;">¡${poolNames[winner]} gana!</span> <button onclick="resetPoolGame();poolGameActive=true;poolGameLoop();">Reiniciar</button>`;
    }, 500);
    return;
  }
  requestAnimationFrame(poolGameLoop);
}

function shootBall(e, isTouch) {
  if (!poolGameActive) return;
  if (poolIsBallsMoving()) return;
  const canvas = document.getElementById("pool-game");
  const rect = canvas.getBoundingClientRect();
  let mouseX, mouseY;
  if (isTouch) {
    const touch = e.changedTouches[0];
    mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
  } else {
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  }
  const ball = poolBalls[poolCurrentPlayer];
  if (!ball.alive) return;
  const dx = mouseX - ball.x, dy = mouseY - ball.y;
  const norm = Math.hypot(dx,dy);
  if (norm < 5) return;
  ball.vx = Math.max(-12, Math.min(12, dx/8));
  ball.vy = Math.max(-12, Math.min(12, dy/8));
  let next = poolCurrentPlayer;
  for (let i=1;i<=poolBalls.length;i++) {
    let tryIdx = (poolCurrentPlayer + i) % poolBalls.length;
    if (poolBalls[tryIdx].alive) {
      next = tryIdx; break;
    }
  }
  poolCurrentPlayer = next;
  updatePlayerName();
}
document.getElementById("pool-game").addEventListener("mousedown", function(e) {
  shootBall(e, false);
});
document.getElementById("pool-game").addEventListener("touchend", function(e) {
  shootBall(e, true);
});

function showOrHidePoolGame() {
  const container = document.getElementById("pool-game-container");
  if (document.body.classList.contains('dou-mode')) {
    container.style.display = "flex";
    let w = 600, h = 350;
    if (window.innerWidth < 700) {
      w = Math.round(window.innerWidth * 0.94);
      h = Math.round(w * 0.57);
    }
    const canvas = document.getElementById("pool-game");
    canvas.width = w;
    canvas.height = h;
    poolWidth = w;
    poolHeight = h;
    resetPoolGame();
    setTimeout(poolGameLoop, 60);
  } else {
    container.style.display = "none";
    poolGameActive = false;
  }
}

// If you already have a toggleDouMode function, call showOrHidePoolGame() inside it.
// Otherwise, add a global observer here:
if (!window.toggleDouMode) {
  window.toggleDouMode = function() {
    document.body.classList.toggle('dou-mode');
    showOrHidePoolGame();
  };
}
window.addEventListener('DOMContentLoaded', showOrHidePoolGame);
window.addEventListener('resize', ()=>{
  if (document.body.classList.contains('dou-mode')) showOrHidePoolGame();
});
