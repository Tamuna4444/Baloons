// ----- SELECTORS / STATE -----
const gameArea = document.getElementById('gameArea');
const houses   = [...document.querySelectorAll('.house')];
const scoreEl  = document.getElementById('score');
let score = 0;

// ფერების სია პირდაპირ სახლებიდან
const COLORS = houses.map(h => (h.dataset.color || '').trim().toLowerCase());

// ----- SPAWN -----
setInterval(spawnBalloon, 1400);

function spawnBalloon() {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const b = document.createElement('div');
  b.className = `balloon ${color}`;
  b.dataset.color = color;

  const r = gameArea.getBoundingClientRect();
  const startX = Math.random() * (r.width - 60);
  b.style.left = `${startX}px`;
  b.style.top  = `-100px`;
  gameArea.appendChild(b);

  enableDragX(b);
  fall(b);
}

// ----- FALL LOOP -----
function fall(balloon) {
  let y = -100, vy = 1.6, alive = true;

  const step = () => {
    if (!alive) return;
    y += vy;
    balloon.style.top = `${y}px`;

    if (tryAttach(balloon)) {           // დამაგრდა
      alive = false;
      balloon.remove();
      return;
    }

    if (y > gameArea.getBoundingClientRect().height + 120) {
      alive = false;
      balloon.remove();
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ----- ONLY CHECK THE HOUSE WITH THE SAME COLOR -----
function tryAttach(balloon) {
  const color = (balloon.dataset.color || '').trim().toLowerCase();
  const house = document.querySelector(`.house[data-color="${color}"]`);
  if (!house) return false;

  const br = balloon.getBoundingClientRect();
  const bx = (br.left + br.right) / 2;
  const by = br.bottom;

  const anchor = house.querySelector('.anchor');
  const ar = anchor.getBoundingClientRect();

  const inside = bx >= ar.left && bx <= ar.right && by >= ar.top && by <= ar.bottom;
  if (!inside) return false;

  attachToRoof(house, color);
  score++;
  scoreEl.textContent = 'Score: ' + score;

  const need = +house.dataset.need || 3;
  const has  = +house.dataset.has  || 0;
  if (has >= need) flyHouse(house);

  return true;
}

// ----- VISUAL ATTACH -----
function attachToRoof(house, color) {
  house.dataset.has = String((+house.dataset.has || 0) + 1);
  const anchor = house.querySelector('.anchor');
  anchor.classList.add('sway');

  const idx = anchor.querySelectorAll('.b').length;
  const spots = [{x:-30,y:0},{x:0,y:5},{x:30,y:0},{x:-18,y:26},{x:18,y:26}];
  const s = spots[Math.min(idx, spots.length-1)];

  const tether = document.createElement('div');
  tether.className = 'tether';
  tether.style.left = `calc(50% + ${s.x}px)`;
  tether.style.height = '44px';

  const bub = document.createElement('div');
  bub.className = `b ${color}`;
  bub.style.left = `calc(50% + ${s.x - 14}px)`;
  bub.style.top  = `${s.y}px`;

  anchor.appendChild(tether);
  anchor.appendChild(bub);
}

// ----- HOUSE FLY -----
function flyHouse(h) {
  h.classList.add('fly');
  setTimeout(() => h.remove(), 1400);
}

// ----- HORIZONTAL DRAG ONLY -----
function enableDragX(el) {
  let dragging = false, startX = 0, baseX = 0;

  const move = e => {
    if (!dragging) return;
    let nx = baseX + (e.clientX - startX);
    const max = gameArea.getBoundingClientRect().width - 60;
    if (nx < 0) nx = 0;
    if (nx > max) nx = max;
    el.style.left = `${nx}px`;
  };
  const up = () => {
    dragging = false;
    el.classList.remove('dragging');
    window.removeEventListener('pointermove', move);
  };

  el.addEventListener('pointerdown', e => {
    dragging = true;
    el.classList.add('dragging');
    startX = e.clientX;
    baseX = parseFloat(el.style.left) || 0;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  });
}