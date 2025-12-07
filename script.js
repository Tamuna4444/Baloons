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
let   houses   = [...document.querySelectorAll('.house')];
const scoreEl  = document.getElementById('score');

// ქულების ცვლადი უკვე ზემოთ გაქვს let score = 0; (არ გააორმაგო)

let hasYellowHouse     = false;
let hasSpeedUpgrade    = false;
let hasDoublePalette   = false;

let fallSpeedMultiplier  = 1;  // 40 ქულაზე გაიზრდება
let maxBalloonsPerHouse  = 5;  // თავიდან 5, მერე 10

// ფერების სია სახლებიდან (შესაცვლელი იქნება, როცა ყვითელი დაემატება)
let COLORS = houses.map(h => (h.dataset.color || '').trim().toLowerCase());





// --- SPAWN BALLOONS ---
setInterval(() => {
  if (!gameStarted) return;
  spawnBalloon();
}, 1400);

function spawnBalloon() {
  let availableColors = COLORS;

  // თუ double color რეჟიმი ჩართულია – ავიღოთ ორი ფერი
  if (hasDoublePalette && COLORS.length >= 2) {
    availableColors = COLORS.slice(0, 2);
  }

  // ავირჩიოთ ბუშტის ფერი
  const color = availableColors[Math.floor(Math.random() * availableColors.length)];

  // შევქმნათ ბუშტი
  const b = document.createElement('div');
  b.className = `balloon ${color}`;
  b.dataset.color = color;

  // საწყისი X პოზიცია
  const r = gameArea.getBoundingClientRect();
  const startX = Math.random() * (r.width - 60);
  b.style.left = `${startX}px`;
  b.style.top  = `-100px`;

  // დავამატოთ სათამაშო ველს
  gameArea.appendChild(b);

  // მხოლოდ ჰორიზონტალური გადათრევა
  enableDragX(b);

  // დავიწყოთ ვარდნა
  fall(b);
}

// --- BALLOON FALL ---
function fall(balloon) {
 let y = -100, vy = 1.6 * fallSpeedMultiplier, alive = true;

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
    // ❌ არასწორი – ქულა იკლებს
    score = Math.max(0, score - 1);
    scoreEl.textContent = "Score: " + score;

    // და სახლიდან ერთ ბუშტსაც ვაკლებ
    const has = +targetHouse.dataset.has || 0;
    if (has > 0) {
      const anchor  = targetHouse.querySelector('.anchor');
      const bubbles = anchor.querySelectorAll('.b');
      const tethers = anchor.querySelectorAll('.tether');

      if (bubbles.length > 0) {
        bubbles[bubbles.length - 1].remove();
      }
      if (tethers.length > 0) {
        tethers[tethers.length - 1].remove();
      }

      targetHouse.dataset.has = String(Math.max(0, has - 1));
    }
  }

  return true;
}
function attachToRoof(house, color) {
  // რამდენი ბუშტი ჰქონდა სახლს მანამდე
  const prevHas = +house.dataset.has || 0;
  const newHas  = prevHas + 1;
  house.dataset.has = String(newHas);

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

  // 🎁 BONUS: ყოველ მესამე ბუშტზე ქულები ორჯერ მეტია
if (newHas % 3 === 0) {
  const bonus = 3; // სამი ბუშტის ბონუსი
  score += bonus;
  scoreEl.textContent = "Score: " + score;


    // optional: პატარა ეფექტი სახლზე
    house.classList.add('bonus-glow');
    setTimeout(() => house.classList.remove('bonus-glow'), 600);
  }
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
  if (name === "yellow_house" && !hasYellowHouse) {
    hasYellowHouse = true;
    unlockYellowHouse();
  }

  if (name === "speed1" && !hasSpeedUpgrade) {
    hasSpeedUpgrade = true;
    fallSpeedMultiplier = 1.4; // ოდნავ უფრო სწრაფი
    maxBalloonsPerHouse = 10;  // ახლა უკვე 10 ბუშტი ერთ სახლზე
  }

  if (name === "double_palette" && !hasDoublePalette) {
    hasDoublePalette = true;
    // მერე ვიზუალურად სახურავებსაც გავაფერადებთ საჭიროებისამებრ
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
function unlockYellowHouse() {
  const street = document.getElementById('street');
  if (!street) return;

  const h = document.createElement('div');
  h.id = 'house-yellow';
  h.className = 'house';
  h.dataset.color = 'yellow';
  h.dataset.need  = '5';
  h.dataset.has   = '0';

  // დროებით greenh.png-ს გამოვიყენებთ – როცა დახატავ yellowh.png-ს, აქ შეცვლი
  h.innerHTML = `
    <img src="./image/yellow.png" alt="Yellow House" />
    <div class="anchor"></div>
  `;

  street.appendChild(h);

  // ახალი სახლი გამოიყენოს თამაშმაც
  houses.push(h);
  COLORS.push('yellow');
}