const mainMenu = document.getElementById('mainMenu');
const startBtn = document.getElementById('startBtn');
let gameStarted = false;

startBtn.addEventListener('click', () => {
  mainMenu.classList.add('hidden');
  gameStarted = true;
});
// ეკრანები
const mainScreen = document.getElementById('mainScreen');
const shopScreen = document.getElementById('shopScreen');

// ღილაკები
const btnShop = document.getElementById('btnShop');
const btnHouse = document.getElementById('btnHouse');
const btnSettings = document.getElementById('btnSettings');
const btnBackFromShop = document.getElementById('btnBackFromShop');


const shopPointsEl = document.getElementById('shopPoints');

// ქულების ცვლადი
let score = 0;

// --- Shop გახსნა ---
btnShop.addEventListener('click', () => {
  shopPointsEl.textContent = score;
  mainScreen.classList.add('hidden');
  shopScreen.classList.remove('hidden');
});

// --- Shop Back (დაბრუნება თამაშზე) ---
btnBackFromShop.addEventListener('click', () => {
  shopScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
});





const gameArea = document.getElementById('gameArea');
const houses   = [...document.querySelectorAll('.house')];
const scoreEl  = document.getElementById('score');

// ფერების სია სახლებიდან
const COLORS = houses.map(h => (h.dataset.color || '').trim().toLowerCase());

// --- SPAWN BALLOONS ---
setInterval(() => {
  if (!gameStarted) return;
  spawnBalloon();
}, 1400);

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

// --- BALLOON FALL ---
function fall(balloon) {
  let y = -100, vy = 1.6, alive = true;

  const step = () => {
    if (!alive) return;
    y += vy;
    balloon.style.top = `${y}px`;

    if (tryAttach(balloon)) {
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

// --- HITBOX CHECK ---
function tryAttach(balloon) {
  const color = balloon.dataset.color.toLowerCase();

  const br = balloon.getBoundingClientRect();
  const bx = (br.left + br.right) / 2;
  const by = br.bottom;

  let targetHouse = null;

  for (const house of houses) {
    const anchor = house.querySelector('.anchor');
    const ar = anchor.getBoundingClientRect();

    if (bx >= ar.left && bx <= ar.right && by >= ar.top && by <= ar.bottom) {
      targetHouse = house;
      break;
    }
  }

  if (!targetHouse) return false;

  const houseColor = targetHouse.dataset.color.toLowerCase();

  if (houseColor === color) {
    attachToRoof(targetHouse, color);

    score++;
    scoreEl.textContent = "Score: " + score;

    const need = +targetHouse.dataset.need || 5;
    const has  = +targetHouse.dataset.has || 0;

    if (has >= need) flyHouse(targetHouse);
  } else {
    score = Math.max(0, score - 1);
    scoreEl.textContent = "Score: " + score;
  }

  return true;
}

// --- ADD BALLOON TO HOUSE ---
function attachToRoof(house, color) {
  house.dataset.has = String((+house.dataset.has || 0) + 1);

  const anchor = house.querySelector('.anchor');
  anchor.classList.add('sway');

  const idx = anchor.querySelectorAll('.b').length;
  const spots = [
    {x:-30,y:0},{x:0,y:5},{x:30,y:0},{x:-18,y:26},{x:18,y:26}
  ];
  const s = spots[Math.min(idx, spots.length - 1)];

  const tether = document.createElement('div');
  tether.className = 'tether';
  tether.style.left = `calc(50% + ${s.x}px)`;

  const bub = document.createElement('div');
  bub.className = `b ${color}`;
  bub.style.left = `calc(50% + ${s.x - 14}px)`;
  bub.style.top  = `${s.y}px`;

  anchor.appendChild(tether);
  anchor.appendChild(bub);
}

// --- FLY HOUSE ---
function flyHouse(h) {
  h.classList.add('fly');
  setTimeout(() => h.remove(), 1400);
}

// --- DRAG BALLOON ---
function enableDragX(el) {
  let dragging = false, startX = 0, baseX = 0;

  const move = e => {
    if (!dragging) return;
    let nx = baseX + (e.clientX - startX);
    const max = gameArea.getBoundingClientRect().width - 60;
    nx = Math.max(0, Math.min(max, nx));
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

// ========================
//      SHOP SYSTEM
// ========================
const shopItems = document.querySelectorAll('.shop-item');

shopItems.forEach(item => {
  const btn = item.querySelector('.buy-btn');
  const cost = +item.dataset.cost;

  btn.addEventListener('click', () => {
    if (item.classList.contains("owned")) return;

    if (score < cost) {
      alert("Not enough points!");
      return;
    }

    score -= cost;
    scoreEl.textContent = "Score: " + score;
    shopPointsEl.textContent = score;

    item.classList.add("owned");
    btn.textContent = "Bought";
    btn.disabled = true;

    applyUpgrade(item.dataset.upgrade);
  });
});

function applyUpgrade(name) {
  if (name === "flag") {
    const red = document.getElementById("house-red");
    if (red) red.classList.add("upgrade-flag");

    const layerFlag = document.getElementById("upgrade-flag");
    if (layerFlag) layerFlag.classList.remove("hidden");
  }

  if (name === "chimney") {
    const blue = document.getElementById("house-blue");
    if (blue) blue.classList.add("upgrade-chimney");

    const layerChimney = document.getElementById("upgrade-chimney");
    if (layerChimney) layerChimney.classList.remove("hidden");
  }

  if (name === "flowers") {
    const green = document.getElementById("house-green");
    if (green) green.classList.add("upgrade-flowers");

    const layerFlowers = document.getElementById("upgrade-flowers");
    if (layerFlowers) layerFlowers.classList.remove("hidden");
  }
}
// HOUSE SCREEN LOGIC


const houseScreen   = document.getElementById('houseScreen');
const btnCloseHouse = document.getElementById('btnCloseHouse');

btnHouse.addEventListener('click', () => {
  mainScreen.classList.add('hidden');
  houseScreen.classList.remove('hidden');
});

btnCloseHouse.addEventListener('click', () => {
  houseScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
});