const HOUSE_NEED = 15;       // 15 ბუშტზე აფრინდეს სახლი

// streak ლოგიკა – ზედიზედ 5 ბუშტზე ერთ სახლზე
let streakHouseId = null;
let streakCount   = 0;
const STREAK_TARGET = 5;     // რამდენი ზედიზედ
const STREAK_BONUS  = 5;     // რამდენი ქულა დაემატოს ბონუსად
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

  // თუ Double Color Mode ჩართულია –ბუშტები მხოლოდ ორ ფერში მოდის
  if (hasDoublePalette) {
    // ორი ფერი – შეგიძლია შეცვალო, напр. ['red','blue'] თუ გინდა
    availableColors = ['red', 'yellow'];
  }

  const color = availableColors[Math.floor(Math.random() * availableColors.length)];

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
  const color = (balloon.dataset.color || '').trim().toLowerCase();

  // ❌ თუ მოთამაშეს ბუშტზე ხელი არ ჰქონია, საერთოდ არ ვამოწმებთ დაიმაგრა თუ არა
  if (balloon.dataset.touched !== "1") {
    return false;
  }

  // ბუშტის ცენტრის კოორდინატები
  const br = balloon.getBoundingClientRect();
  const bx = (br.left + br.right) / 2;
  const by = br.bottom;

  // ვიპოვოთ რომელ სახლს მივარტყით
  let targetHouse = null;
  for (const house of houses) {
    const anchor = house.querySelector('.anchor');
    const ar = anchor.getBoundingClientRect();

    const inside =
      bx >= ar.left &&
      bx <= ar.right &&
      by >= ar.top &&
      by <= ar.bottom;

    if (inside) {
      targetHouse = house;
      break;
    }
  }

  // არცერთ სახლს არ მოხვდა
  if (!targetHouse) return false;

  const houseColor = (targetHouse.dataset.color || '').trim().toLowerCase();

  if (houseColor === color) {
    // ✅ სწორ სახლზე მიამაგრა
    attachToRoof(targetHouse, color);

    // --- ქულები (ძირითადი + streak ლოგიკა) ---

    // ჩვეულებრივი ქულა თითო ბუშტზე
    score += 1;

    // streak – ზედიზედ 5 ბუშტი ერთ სახლზე
    const id = targetHouse.id;
    if (streakHouseId === id) {
      streakCount++;
    } else {
      streakHouseId = id;
      streakCount   = 1;
    }

    if (streakCount === STREAK_TARGET) {
      // 🎁 ბონუს ქულა
      score += STREAK_BONUS;
      streakCount = 0; // რომ ისევ შეძლოს 5-ის შეკრება და ბონუსი

      // სურვილისამებრ: პატარა ანიმაცია სახლზე
      targetHouse.classList.add('house-bonus');
      setTimeout(() => targetHouse.classList.remove('house-bonus'), 400);
    }

    scoreEl.textContent = 'Score: ' + score;

    // რამდენი ბუშტი აქვს უკვე ამ სახლს
    const has  = +targetHouse.dataset.has || 0;
    const need = HOUSE_NEED;

    // თუ უკვე 15 ბუშტი აქვს – აფრინდება
    if (has >= need) {
      flyHouse(targetHouse);
    }

  } else {
    // ❌ არასწორი სახლთან მოხვდა – ქულა იკლებს
    score = Math.max(0, score - 1);
    scoreEl.textContent = 'Score: ' + score;

    // streak გასუსტი – ზედიზედ სერია წყდება
    streakHouseId = null;
    streakCount   = 0;
  }

  // ნებისმიერ შემთხვევაში ბუშტი დამუშავებულია
  return true;
}
function attachToRoof(house, color) {
  // რამდენი ბუშტი ჰქონდა მანამდე ამ სახლს
  let count = +house.dataset.has || 0;
  count++;
  house.dataset.has = count;

  const anchor = house.querySelector('.anchor');
  anchor.classList.add('sway');

  // ვიპოვოთ ან შევქმნათ cluster კონტეინერი
  let cluster = anchor.querySelector('.cluster');
  if (!cluster) {
    cluster = document.createElement('div');
    cluster.className = 'cluster';
    anchor.appendChild(cluster);
  }

  // შევქმნათ ახალი ბუშტი + მისი ძაფი
  const balloon = document.createElement('div');
  balloon.className = `b ${color}`;

  const tether = document.createElement('div');
  tether.className = 'tether';

  cluster.appendChild(tether);
  cluster.appendChild(balloon);

  // --- განლაგება — "Up" სტილის ღრუბელი ---

  const balloons = cluster.querySelectorAll('.b');
  const total = balloons.length;

  // რამდენი სვეტი გვინდა (maxCols იქ ცოტათი მართავს სიგანეს)
  const maxCols = 6;
  const cols = Math.min(maxCols, Math.ceil(Math.sqrt(total * 1.4)));
  const rows = Math.ceil(total / cols);

  const spacingX = 20;  // ჰორიზონტალური დაშორება
  const spacingY = 18;  // ვერტიკალური დაშორება

  // თავიდან დავალაგოთ ყველა ბუშტი, რომ ლამაზი ფორმა გამოდგეს
  balloons.forEach((b, index) => {
    const t = cluster.querySelectorAll('.tether')[index];

    const row = Math.floor(index / cols);
    const col = index % cols;

    // ცენტრში გასწორება
    const offsetX = (col - (cols - 1) / 2) * spacingX;
    const offsetY = -(row * spacingY);

    // ოდნავ random, რომ "ცოცხალი" იყოს
    const randX = (Math.random() * 8) - 4;   // -4..+4px
    const randY = (Math.random() * 6) - 3;   // -3..+3px

    const x = offsetX + randX;
    const y = offsetY + randY;

    b.style.left = `${70 + x - 13}px`; // 70px = დაახლოებით შუა წერტილი cluster-ში
    b.style.top  = `${80 + y - 34}px`; // 80px = cluster ქვევიდან

    // ძაფის პოზიცია ბუშტის ქვეშ
    t.style.left = `${70 + x}px`;
    t.style.top  = `${80 + y}px`;
  });
}

// --- FLY HOUSE ---
function flyHouse(h) {
  // 🎁 ბონუს ქულა სახლის გაფრენაზე (შეგიძლია ციფრი შეცვალო)
  score += 10;
  scoreEl.textContent = 'Score: ' + score;

  // აფრენის ანიმაცია
  h.classList.add('fly');

  setTimeout(() => {
    // 1) დავასუფთაოთ ბუშტები სახლზე
    const anchor = h.querySelector('.anchor');
    if (anchor) {
      anchor.innerHTML = '';        // ვშლით cluster-ს/ბუშტებს
      anchor.classList.remove('sway');
    }

    // 2) ბუშტების რაოდენობა განულდეს
    h.dataset.has = '0';

    // 3) თუ streak ამ სახლზე იყო, ისიც განულდეს
    if (typeof streakHouseId !== 'undefined' && streakHouseId === h.id) {
      streakHouseId = null;
      streakCount   = 0;
    }

    // 4) house.fly კლასი მოვხსნათ, რომ ისევ „ქვემოთ დაბრუნდეს“
    h.classList.remove('fly');
    // (CSS ანიმაცია დასრულდება, transform მოიხსნება და სახლი ისევ ქუჩაზე დადგება)
  }, 1500); // ოდნავ მეტი, ვიდრე შენი flyUp animation-ის ხანგრძლივობა
}

// --- DRAG BALLOON ---
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

    // ✅ ვამუწებთ, რომ მოთამაშემ უკვე შეეხო ამ ბუშტს
    el.dataset.touched = "1";

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

  // 1) ფონის შეცვლა – Theme 2
  document.body.classList.add('theme-advanced');

  // 2) სამივე სახლის სურათის შეცვლა ორ-ფერი ვერსიებზე
  const redImg   = document.querySelector('#house-red img');
  const blueImg  = document.querySelector('#house-blue img');
  const greenImg = document.querySelector('#house-green img');

  if (redImg)   redImg.src   = './image/blueh-double.png';
  if (blueImg)  blueImg.src  = './image/blueh-double.png';
  if (greenImg) greenImg.src = './image/greenh-double.png';

  // 3) დამატებითი ფერი – yellow (თუ ჯერ არაა, დავამატოთ)
  if (!COLORS.includes('yellow')) {
    COLORS.push('yellow');
  }
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