const screen1 = document.getElementById('screen1');
const screen2 = document.getElementById('screen2');
const confettiLayer = document.getElementById('confetti');

const arena = document.getElementById('arena');
const yesBtn = document.getElementById('yesBtn');
const noBtn  = document.getElementById('noBtn');

let dodgeCount = 0;
let endMode = false;
let noStartLeft = 0;

// 10 simple phases (short)
const phases = [
  "No 💔",
  "Nope 🙅‍♀️",
  "Nah 😤",
  "Hmm 🤔",
  "Stop 🙈",
  "Hey 😭",
  "Uh 😳",
  "Wait 👀",
  "Maybe 💘",
  "Fine 💞"
];

// end animation: No -> Yes -> No -> Yes -> Yes
const endCycle = ["No 💔", "Yes 💚", "No 💔", "Yes 💚", "Yes 💚"];

function placeSideBySide(){
  const w = arena.clientWidth;
  const gap = 14;

  // reset to baseline position before measuring
  yesBtn.style.top = "50%";
  noBtn.style.top = "50%";

  const yesW = yesBtn.offsetWidth;
  const noW  = noBtn.offsetWidth;

  const total = yesW + gap + noW;
  const leftStart = (w - total) / 2;

  yesBtn.style.left = leftStart + "px";
  noBtn.style.left  = (leftStart + yesW + gap) + "px";

  noStartLeft = parseFloat(noBtn.style.left);
}

function burstConfetti(){
  const colors = ["#22c55e","#ef4444","#111827","#f59e0b","#3b82f6","#ec4899"];
  const count = 160;
  for (let i=0; i<count; i++){
    const piece = document.createElement('i');
    piece.style.left = (Math.random()*100) + "vw";
    piece.style.width = (6 + Math.random()*8) + "px";
    piece.style.height = (10 + Math.random()*14) + "px";
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDuration = (1.6 + Math.random()*1.6) + "s";
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

function goNext(){
  burstConfetti();
  setTimeout(() => {
    screen1.classList.add('hidden');
    screen2.classList.remove('hidden');
  }, 250);
}

function shakeNo(){
  noBtn.classList.remove('shaking');
  void noBtn.offsetWidth;
  noBtn.classList.add('shaking');
}

// iPhone-safe, big-space movement: within the card but below header area
function moveNoRandom(){
  const pad = 10;

  const container = screen1.getBoundingClientRect();
  const bw = noBtn.offsetWidth;
  const bh = noBtn.offsetHeight;

  // Avoid the top header area on small screens
  // (roughly: title + subtitle region)
  const headerSafeY = Math.min(150, container.height * 0.28);

  const minX = pad;
  const maxX = Math.max(pad, container.width - bw - pad);

  const minY = headerSafeY;
  const maxY = Math.max(headerSafeY, container.height - bh - pad);

  const x = minX + Math.random() * (maxX - minX);
  const y = minY + Math.random() * (maxY - minY);

  // Convert to arena-relative positioning (button stays inside the card visually)
  const arenaRect = arena.getBoundingClientRect();
  const left = x - (arenaRect.left - container.left);
  const top  = y - (arenaRect.top  - container.top);

  noBtn.style.transition = "left 0.18s cubic-bezier(.34,1.56,.64,1), top 0.18s cubic-bezier(.34,1.56,.64,1)";
  noBtn.style.left = left + "px";
  noBtn.style.top  = top + "px";

  noBtn.classList.remove("panic");
  void noBtn.offsetWidth;
  noBtn.classList.add("panic");
}

function finalizeNoAtStartAndCycle(){
  endMode = true;

  noBtn.style.left = noStartLeft + "px";
  noBtn.style.top  = "50%";

  let i = 0;
  const tick = () => {
    const text = endCycle[Math.min(i, endCycle.length - 1)];
    noBtn.textContent = text;

    if (text.includes("Yes")) {
      noBtn.classList.remove('no');
      noBtn.classList.add('yes');
    } else {
      noBtn.classList.remove('yes');
      noBtn.classList.add('no');
    }

    i++;
    if (i < endCycle.length) {
      setTimeout(tick, 220);
    } else {
      noBtn.textContent = "Yes 💚";
      noBtn.classList.remove('no');
      noBtn.classList.add('yes');
    }
  };
  tick();
}

function onTryNo(){
  // After end: both buttons go next
  if (endMode) return goNext();

  dodgeCount++;
  noBtn.textContent = phases[Math.min(phases.length - 1, dodgeCount - 1)];

  // small shake a couple times
  if (dodgeCount === 3 || dodgeCount === 6) shakeNo();

  if (dodgeCount >= 10){
    finalizeNoAtStartAndCycle();
    return;
  }

  // more drama later: double hop
  const hops = dodgeCount >= 7 ? 2 : 1;
  for (let i = 0; i < hops; i++) {
    setTimeout(moveNoRandom, i * 110);
  }
}

// Navigation rules:
// - Before end: ONLY YES goes next
// - After end: BOTH buttons go next
yesBtn.addEventListener('click', () => {
  if (endMode) return goNext();
  goNext();
});

// iPhone: use touch/pointer events so "hover dodge" still works via tap
noBtn.addEventListener('click', () => {
  if (endMode) return goNext();
  onTryNo();
});

// Desktop hover
noBtn.addEventListener('mouseenter', () => {
  if (endMode) return;
  onTryNo();
});

// iOS quick tap triggers immediately (prevents 300ms delay / weirdness)
noBtn.addEventListener('touchstart', (e) => {
  if (endMode) return;
  e.preventDefault();
  onTryNo();
}, { passive: false });

noBtn.addEventListener('pointerdown', (e) => {
  // On iOS Safari this fires; keeps it responsive
  if (endMode) return;
  if (e.pointerType === "touch") {
    e.preventDefault();
    onTryNo();
  }
}, { passive: false });

// Keep the mouse “proximity dodge” on desktop only
arena.addEventListener('pointermove', (e) => {
  if (endMode) return;
  if (e.pointerType !== "mouse") return;

  const btn = noBtn.getBoundingClientRect();
  const dist = Math.hypot(
    e.clientX - (btn.left + btn.width/2),
    e.clientY - (btn.top + btn.height/2)
  );

  if (dist < 90) {
    if (!noBtn.dataset.cooldown) {
      noBtn.dataset.cooldown = "1";
      onTryNo();
      setTimeout(() => delete noBtn.dataset.cooldown, 170);
    }
  }
});

window.addEventListener('load', placeSideBySide);
window.addEventListener('resize', placeSideBySide);