const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 固定 Canvas 像素解析度
canvas.width = 800;
canvas.height = 500;

class Target {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  // 畫出圓形目標
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.closePath();
  }
}
let targets = [];
let score = 0;
let totalShots = 0;
let hits = 0;
let isPlaying = false;

// 隨機生成新目標 (避免太貼近邊界)
function spawnTarget() {
  const radius = 25;
  const x = Math.random() * (canvas.width - radius * 4) + radius * 2;
  const y = Math.random() * (canvas.height - radius * 4) + radius * 2;
  targets.push(new Target(x, y, radius, '#ff4757'));
}

// 畫面渲染迴圈 (每秒約 60 畫格)
function render() {
  if (!isPlaying) return;
  
  // 1. 清空畫布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. 繪製所有目標
  targets.forEach(target => target.draw());
  
  requestAnimationFrame(render);
}

// 點擊事件處理
canvas.addEventListener('mousedown', (e) => {
  if (!isPlaying) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  totalShots++;
  let hit = false;

  // 檢查是否命中任何目標
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    const distance = Math.hypot(mouseX - t.x, mouseY - t.y); // 計算距離

    if (distance <= t.radius) {
      hit = true;
      hits++;
      score += 100;
      targets.splice(i, 1); // 銷毀被擊中的目標
      spawnTarget();         // 立即補一顆新的
      playHitAudio();
      break;
    }
  }

  if (!hit) {
    playMissAudio();
  }

  updateHUD();
});

function updateHUD() {
  document.getElementById('score').textContent = score;
  const accuracy = totalShots === 0 ? 100 : Math.round((hits / totalShots) * 100);
  document.getElementById('accuracy').textContent = accuracy;
}
let timeLeft = 30;
let timerInterval = null;

const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

function startGame() {
  // 重設數據
  score = 0;
  totalShots = 0;
  hits = 0;
  timeLeft = 30;
  targets = [];
  isPlaying = true;

  updateHUD();
  document.getElementById('timer').textContent = timeLeft;

  // 隱藏 UI 選單
  startOverlay.classList.add('hidden');
  endOverlay.classList.add('hidden');

  // 初始化生成 3 個目標 (Gridshot 模式)
  for (let i = 0; i < 3; i++) {
    spawnTarget();
  }

  // 啟動渲染迴圈
  render();

  // 計時器
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  isPlaying = false;
  clearInterval(timerInterval);

  // 顯示結算畫面
  document.getElementById('finalScore').textContent = score;
  const accuracy = totalShots === 0 ? 0 : Math.round((hits / totalShots) * 100);
  document.getElementById('finalAccuracy').textContent = accuracy + '%';
  endOverlay.classList.remove('hidden');
}
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 命中高音效
function playHitAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

// 未命中低音效
function playMissAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}