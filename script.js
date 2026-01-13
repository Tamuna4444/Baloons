
const HOUSE_SKINS = {
  red:   ["./image/redh.png",   "./image/bigred.png",  "./image/bigredhouse.png"],
  blue:  ["./image/blueh.png",  "./image/bigblue.png","./image/bigbluehouse.png"],
  green: ["./image/greenh.png", "./image/biggreen.png","./image/biggreenhouse.png"],
  yellow:["./image/yellow.png","./image/bluehdouble.png", "./image/bigyellowhouse.png"],
};
const HOUSE_NEED = 5;       // 15 ბუშტზე აფრინდეს სახლი

const HOUSE_BALLOON_PAIRS = {
  green: "./image/blgreenyellow.png",
  blue: "./image/blblueyellow.png",
  red: "./image/blredyellow.png",
  yellow: "./image/blorangeyellow.png"
};
const SINGLE_BALLOON_IMAGES = {
  red:    "./image/redbaloon.png",
  blue:   "./image/b.png",
  green:  "./image/greenbaloons.png",
  yellow: "./image/ybaloons.png"
};



// streak ლოგიკა – ზედიზედ 5 ბუშტზე ერთ სახლზე
let streakHouseId = null;
let streakCount   = 0;
const STREAK_TARGET = 5;     // რამდენი ზედიზედ
const STREAK_BONUS  = 5;     // რამდენი ქულა დაემატოს ბონუსად
const mainMenu = document.getElementById('mainMenu');
const startBtn = document.getElementById('startBtn');
let gameStarted = false;

startBtn.addEventListener('click', () => {
  unlockAudioOnce();     // ✅ პირველივე კლიკზე გახსნა (iPhone fix)
  startNewGame();
});
// === SFX: Click + Bomb ===
const SFX = {
  click: new Audio("./sound/click.wav"),
  bomb:  new Audio("./sound/boom.wav"),
  attach: new Audio("./sound/balloonattach.wav"),
  fly:    new Audio("./sound/housefly.wav"),
  gameover: new Audio("./sound/gameover.mp3")
};
SFX.attach.volume = 0.8;
SFX.fly.volume    = 0.8; 
SFX.gameover.volume = 0.8;

SFX.click.volume = 0.8;
SFX.bomb.volume  = 0.8;

let audioUnlocked = false;

// iOS/Safari unlock
function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  SFX.click.play().then(() => {
    SFX.click.pause();
    SFX.click.currentTime = 0;
  }).catch(() => {});
}
// 🔊 UNLOCK AUDIO ON FIRST USER INTERACTION (GLOBAL, SAFE)
document.addEventListener("pointerdown", unlockAudioOnce, { once: true });
// ✅ CLICK SOUND FOR ALL BUTTONS
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  // Option A: არ ვუკრათ sound toggle-ზე, თორემ switch-ის click ორჯერ “იგრძნობა”
  if (btn.id === "soundToggle") return;

  // Option B: თუ გინდა ზოგ ღილაკზე არ იყოს ხმა, დაამატე მათ class="no-click-sfx"
  if (btn.classList.contains("no-click-sfx")) return;

  playSfx("click");
});
// play helper (respects soundOn from Settings section)
const SFX_COOLDOWN = {
  click: 60,
  attach: 90,
  bomb: 120,
  fly: 200,
  gameover: 400
};
const lastSfxAt = {};

function playSfx(key) {
  if (!soundOn) return;
  const a = SFX[key];
  if (!a) return;

  const now = performance.now();
  const cd = SFX_COOLDOWN[key] ?? 80;
  if (lastSfxAt[key] && (now - lastSfxAt[key]) < cd) return;
  lastSfxAt[key] = now;

  try {
    a.pause();
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}


// ეკრანები
const mainScreen = document.getElementById('mainScreen');


const gameArea = document.getElementById('gameArea');
let   houses   = [...document.querySelectorAll('.house')];
const scoreEl  = document.getElementById('score');
let score = 0;
const livesEl = document.getElementById("lives");
let lives = 3;          // start lives
let missedBombs = 0;    // რამდენი ბომბი დაეცა მიწაზე

function updateLivesUI(){
  if (!livesEl) return;
  livesEl.textContent = "❤️".repeat(lives);
}
updateLivesUI();

let hasYellowHouse = false;


function unlockYellowHouse() {
  const yellowHouse = document.getElementById('house-yellow');
  if (!yellowHouse) return;

  yellowHouse.classList.remove('hidden');
}


function updateScoreUI() {
  scoreEl.textContent = `${t("score")}: ${score}`;

  if (!hasYellowHouse && score >= 100) {
    hasYellowHouse = true;
    unlockYellowHouse();
  }
}


// ქულების ცვლადი უკვე ზემოთ გაქვს let score = 0; (არ გააორმაგო)


let hasSpeedUpgrade    = false;
let hasDoublePalette   = false;

let fallSpeedMultiplier  = 1;  // 40 ქულაზე გაიზრდება
let maxBalloonsPerHouse  = 5;  // თავიდან 5, მერე 10

let gameStartTime = 0;

function updateDifficulty() {
  // ⏱ დროის მიხედვით: პირველივე წამებში ოდნავ აჩქარდეს
  const tSec = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;

  let m = 1.15;              // ✅ თავიდანვე ცოტა სწრაფი
  if (tSec >= 3) m += 0.15;  // 3 წამში +0.15
  if (tSec >= 6) m += 0.20;  // 6 წამში +0.20 (ჯამში +0.35)

  // 🎯 ქულის მიხედვით: 200+ ქულაზე აშკარა აჩქარება
  if (score >= 200) m += 0.55;
  if (score >= 400) m += 0.35;

  // ზედა ზღვარი (რომ “არ გაფრინდეს”)
  fallSpeedMultiplier = Math.min(m, 3.0);
}
const isMobile = matchMedia("(hover: none) and (pointer: coarse)").matches;
if (isMobile) {
  fallSpeedMultiplier = Math.min(fallSpeedMultiplier, 2.2); // იყო 3.0-მდე
}
// ფერების სია სახლებიდან (შესაცვლელი იქნება, როცა ყვითელი დაემატება)
let COLORS = houses.map(h => (h.dataset.color || '').trim().toLowerCase());


const GOLD_BALLOON_IMAGE = "./image/goldballoon.png";

// ✅ კონტროლი
const GOLD_BASE_CHANCE = 0.04;    // 4% (შესამჩნევი)
const GOLD_COOLDOWN_MS = 9000;    // 9 წამი   // 15 წამი
let lastGoldTime = 0;
const BOMB_CHANCE    = 0.25; // 25% ბომბი
const BOMB_PENALTY   = 2;    // ბომბზე -2 ქულა
const BALLOON_POINTS = 5;    // სწორ ბუშტზე +5 ქულა

function getSpawnInterval(){
  if (score >= 400) return 900;   // ძალიან სწრაფი
  if (score >= 300) return 1000;  // 300+ → გახშირება (200-ზე სწრაფი)
  if (score >= 200) return 1100;  // 200+ → ახლა რაც გაქვს
  return 1400;                    // საწყისი
}

function getBombChance(){
  if (score >= 400) return 0.45;  // უფრო ხშირად ბომბი
  if (score >= 300) return 0.40;  // 300+ → გახშირება (200-ზე მეტია)
  if (score >= 200) return 0.35;
  return 0.25;
}

function spawnLoop(){
  if (!gameStarted) return;
  spawnItem();
 spawnTimerId = setTimeout(spawnLoop, getSpawnInterval());
}


function spawnItem() {
  // upgraded სახლები (რომლებზეც უკვე გვინდა ორფერიანი ბუშტები)
  const upgradedHouses = houses.filter(h => h.dataset.upgraded === "1");

  // 25% ბომბი – იგივე დატოვე
  const isBomb = Math.random() < getBombChance();

  // შევქმნათ ელემენტი
  const el = document.createElement('div');

  // 💣 ბომბი – ძველი ლოგიკა
 if (isBomb) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  el.className = "bomb-img";
  el.dataset.type = "bomb";
  el.dataset.color = color;
  el.dataset.exploded = "0";

  const img = document.createElement("img");
 img.src = BOMB_IMAGES[Math.floor(Math.random() * BOMB_IMAGES.length)];
  img.draggable = false;

  el.appendChild(img);

  // 🔥 კლიკზე / თაჩზე აფეთქება
el.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  el.dataset.exploded = "1";
  el.dataset.safePop = "1";   // ✅ ეს დაამატე: ჰაერში აფეთქდა → ქულა არ შეიცვალოს
  explodeBomb(el);
}, { passive: false });
} else {
  // ✅ GOLD first (არ იყოს დამოკიდებული upgradedHouses-ზე)
const now = Date.now();

const spawnGold =
  score >= 30 &&
  lives < 3 &&
  (now - lastGoldTime) > GOLD_COOLDOWN_MS &&
  Math.random() < GOLD_BASE_CHANCE;

if (spawnGold) lastGoldTime = now;

if (spawnGold) {
  el.className = "balloon-img gold";
  el.dataset.type = "gold";
  el.dataset.color = "gold";

  const img = document.createElement("img");
  img.src = GOLD_BALLOON_IMAGE;
  img.draggable = false;

  // ✅ დიაგნოსტიკა: ნახე იტვირთება თუ არა
  img.onload = () => console.log("✅ GOLD image loaded:", img.src);
  img.onerror = () => console.log("❌ GOLD image missing:", img.src);

  el.appendChild(img);

} else {


    // 🎈 თუ უკვე არსებობს upgraded სახლი → 60% შანსი იყოს “pair”
    const spawnPair = upgradedHouses.length > 0 && Math.random() < 0.6;

    if (spawnPair) {
      const target = upgradedHouses[Math.floor(Math.random() * upgradedHouses.length)];
      const color = (target.dataset.color || "").trim().toLowerCase();

      el.className = "balloon-pair";
      el.dataset.type = "pair";
      el.dataset.color = color;

      const img = document.createElement("img");
      img.src = HOUSE_BALLOON_PAIRS[color];
      img.draggable = false;
      el.appendChild(img);

    } else {
      // 🟢 ჩვეულებრივი ერთფერიანი ბუშტი
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.className = "balloon-img";
      el.dataset.type = "balloon";
      el.dataset.color = color;

      const img = document.createElement("img");
      img.src = SINGLE_BALLOON_IMAGES[color];
      img.draggable = false;
      el.appendChild(img);
    }
  }
}

  // პოზიცია ზემოდან
  const r = gameArea.getBoundingClientRect();
  const startX = Math.random() * (r.width - 80);
  el.style.left = `${startX}px`;
  el.style.top  = `-140px`;

  gameArea.appendChild(el);

  enableDragX(el);
  fall(el);
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

  // 💣 აფეთქება მხოლოდ ბომბისთვის
  if (balloon.dataset.type === "bomb") {
    explodeBomb(balloon);
  } else {
    balloon.remove();
  }

  return;
}

const groundY =
  gameArea.getBoundingClientRect().height -
  (window.innerHeight * 0.12);

if (y > groundY) {

  // 💣 ბომბი თუ არ აფეთქდა და მიწას დაეცა -> -1 სიცოცხლე
  if (balloon.dataset.type === "bomb" && balloon.dataset.exploded !== "1") {
    missedBombs++;
    lives = Math.max(0, lives - 1);
    updateLivesUI();

    // სურვილისამებრ: ქულაც დააკლო (შენზეა)
    // score = Math.max(0, score - BOMB_MISS_PENALTY);
    // updateScoreUI();

    if (lives <= 0) {
      gameOver();
    }
  }

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

if (balloon.dataset.touched !== "1" && balloon.dataset.type !== "gold") {
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
  const type = (balloon.dataset.type || "balloon");

  // 🟡 GOLD: ნებისმიერ სახლზე ემაგრება, +1 life
if (type === "gold") {
  attachGoldToRoof(targetHouse);
  return true;
}

  // 💣 ბომბი: სახლს თუ მოხვდა → -2, არ ვამაგრებთ სახურავზე
 if (type === "bomb") {
  // ✅ თუ მოთამაშემ ჰაერში ააფეთქა → ქულა არ აკლდება
  if (balloon.dataset.safePop === "1") {
    return true;
  }

  const prev = score;
  score = Math.max(0, score - BOMB_PENALTY);
  updateScoreUI();

  streakHouseId = null;
  streakCount   = 0;

  if (prev > 0 && score === 0) {
    gameOver();
  }

  return true;
}
if (type === "pair") {
  // ✅ გამოიყენე უკვე დამუშავებული "color"
  if (houseColor !== color) return true;

  attachPairToRoof(targetHouse, houseColor);
  return true;
}
if (houseColor === color) {
  attachToRoof(targetHouse, color);
  return true;


    // ჩვეულებრივი ქულა თითო ბუშტზე
   score += BALLOON_POINTS; // +5

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

   updateScoreUI();

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
const BOMB_IMAGES = [
  "./image/redbomb.png",
   "./image/bluebomb.png",
   "./image/greenbomb.png",
  "./image/greybomb.png",
   "./image/blachbomb.png",
   "./image/redbombred.png",
   "./image/blackbomb.png",
   "./image/blacklitlebombo.png",
   "./image/bluredbomb.png",
];
const BOMB_MISS_PENALTY = 3;


function attachToRoof(house, color) {

  // რამდენი ბუშტი ჰქონდა მანამდე ამ სახლს
  let count = Number(house.dataset.has || 0);
  count++;
  house.dataset.has = String(count);

  const anchor = house.querySelector('.anchor');
  if (!anchor) return;

  anchor.classList.add('sway');

  // cluster
  let cluster = anchor.querySelector('.cluster');
  if (!cluster) {
    cluster = document.createElement('div');
    cluster.className = 'cluster';
    anchor.appendChild(cluster);
  }

  // ✅ PNG ბუშტი (იმავე ზომით რაც ცვივა)
  const img = document.createElement("img");
  img.src = SINGLE_BALLOON_IMAGES[color];   // შენი ობიექტი (red/blue/green/yellow)
  img.className = "bimg";
  img.alt = color;
  img.draggable = false;

  cluster.appendChild(img);
  playSfx("attach");

  // --- განლაგება (ერთნაირად ყველა ბუშტისთვის) ---
  const balloons = [...cluster.querySelectorAll('.bimg')];
  const total = balloons.length;

  const maxCols = 4;
  const cols = Math.min(maxCols, Math.ceil(Math.sqrt(total * 1.4)));
  const spacingX = 34;
  const spacingY = 26;

  balloons.forEach((b, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const offsetX = (col - (cols - 1) / 2) * spacingX;
    const offsetY = -(row * spacingY);

    b.style.left = `calc(50% + ${offsetX}px)`;
    b.style.top  = `${70 + offsetY}px`;
  });

  // ✅ აქედან იწყება მთავარი FIX:
  score += BALLOON_POINTS;     // +5
  updateScoreUI();

  // ✅ HOUSE_NEED-ზე აფრენა
  if (count >= HOUSE_NEED) {
    flyHouse(house);
  }
}
function attachGoldToRoof(house) {
  // +1 life (max 3)
  lives = Math.min(3, lives + 1);
  updateLivesUI();

  // house balloons count +1 (რომ პროგრესშიც ითვლებოდეს)
  let count = Number(house.dataset.has || 0);
  count++;
  house.dataset.has = String(count);

  const anchor = house.querySelector('.anchor');
  if (!anchor) return;

  anchor.classList.add('sway');

  // cluster
  let cluster = anchor.querySelector('.cluster');
  if (!cluster) {
    cluster = document.createElement('div');
    cluster.className = 'cluster';
    anchor.appendChild(cluster);
  }

  // gold balloon image
  const img = document.createElement("img");
  img.src = GOLD_BALLOON_IMAGE;
  img.className = "bimg gold-attached";
  img.alt = "gold";
  img.draggable = false;
  cluster.appendChild(img);
  playSfx("attach");

  // layout (იგივე პრინციპით როგორც attachToRoof)
  const balloons = [...cluster.querySelectorAll('.bimg')];
  const total = balloons.length;

  const maxCols = 4;
  const cols = Math.min(maxCols, Math.ceil(Math.sqrt(total * 1.4)));
  const spacingX = 34;
  const spacingY = 26;

  balloons.forEach((b, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const offsetX = (col - (cols - 1) / 2) * spacingX;
    const offsetY = -(row * spacingY);

    b.style.left = `calc(50% + ${offsetX}px)`;
    b.style.top  = `${70 + offsetY}px`;
  });

  // score (იგივე ქულა როგორც ჩვეულებრივზე)
  score += BALLOON_POINTS;
  updateScoreUI();

  // fly check
  if (count >= HOUSE_NEED) {
    flyHouse(house);
  }
}
function attachPairToRoof(house, color) {
  let count = Number(house.dataset.has || 0);
  count += 2; // pair = 2 ბუშტი
  house.dataset.has = String(count);

  const anchor = house.querySelector('.anchor');
  if (!anchor) return;

  anchor.classList.add('sway');

  // ✅ cluster აკლდა — ეს იყო მთავარი ბაგი
  let cluster = anchor.querySelector('.cluster');
  if (!cluster) {
    cluster = document.createElement('div');
    cluster.className = 'cluster';
    anchor.appendChild(cluster);
  }

  const src = HOUSE_BALLOON_PAIRS[color];
  if (!src) return;

  const img = document.createElement('img');
  img.src = src;
  img.className = 'b-pair';
  img.draggable = false;
  cluster.appendChild(img);
  playSfx("attach");

  // --- განლაგება ყველა pair-ზე ---
  const pairs = [...cluster.querySelectorAll('.b-pair')];
  const total = pairs.length;

  const maxCols = 3;
  const cols = Math.min(maxCols, Math.ceil(Math.sqrt(total * 1.2)));
  const spacingX = 60;
  const spacingY = 40;

  pairs.forEach((p, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const offsetX = (col - (cols - 1) / 2) * spacingX;
    const offsetY = -(row * spacingY);

    p.style.left = `calc(50% + ${offsetX}px)`;
    p.style.top  = `${60 + offsetY}px`;
  });

  // ✅ ქულა + UI
  score += BALLOON_POINTS * 2;
  updateScoreUI();

  // ✅ HOUSE_NEED-ზე აფრენა
  if (count >= HOUSE_NEED) {
    flyHouse(house);
  }
}


// --- FLY HOUSE ---
function flyHouse(h) {
  // ✅ guard: ერთ სახლზე ერთდროულად 2-ჯერ არ გაეშვას
  if (h.dataset.flying === "1") return;
  h.dataset.flying = "1";

  score += 10;
  updateScoreUI();
playSfx("fly"); // ✅ house takeoff sound
  h.classList.add('fly');

  setTimeout(() => {
    const anchor = h.querySelector('.anchor');
    if (anchor) {
      anchor.innerHTML = '';
      anchor.classList.remove('sway');
      anchor.dataset.pairsPlaced = "0";
    }

    h.dataset.has = '0';

    changeHouseSkin(h);
    h.dataset.upgraded = "1";

    h.classList.remove('fly');

    // ✅ unlock
    h.dataset.flying = "0";
  }, 1500);
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
function clearFallingItems() {
  // შენს რეალურ კლასებს ვასუფთავებთ
  gameArea.querySelectorAll('.balloon-img, .balloon-pair, .bomb-img').forEach(el => el.remove());
}

let gameOverPlayed = false; // ✅ ერთჯერადად

function gameOver() {
  if (gameOverPlayed) return;   // ✅ guard
  gameOverPlayed = true;

  gameStarted = false;
  playSfx("gameover");          // ✅ აქ

  clearFallingItems();
  openSummary(score);
}
function explodeBomb(bomb) {
   playSfx("bomb"); 
  const rect = bomb.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();

  // 💥 Explosion visual
  const explosion = document.createElement("div");
  explosion.className = "bomb-explosion";

  explosion.style.left = (rect.left - gameRect.left + rect.width / 2 - 60) + "px";
  explosion.style.top  = (rect.top - gameRect.top + rect.height / 2 - 60) + "px";

  gameArea.appendChild(explosion);

  // 🌪 Screen shake
  gameArea.classList.add("screen-shake");
  setTimeout(() => gameArea.classList.remove("screen-shake"), 300);

  // 🧹 Cleanup
  setTimeout(() => explosion.remove(), 450);

  // Remove bomb itself
  bomb.remove();
}
function popBalloonMidAir(el) {
  // უკვე თუ დაიპოპა/წაიშალა
  if (!el || el.dataset.popped === "1") return;
  el.dataset.popped = "1";

  const rect = el.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();

  const pop = document.createElement("div");
  pop.className = "balloon-pop";
  pop.style.left = (rect.left - gameRect.left + rect.width / 2 - 55) + "px";
  pop.style.top  = (rect.top - gameRect.top + rect.height / 2 - 55) + "px";

  gameArea.appendChild(pop);

  setTimeout(() => pop.remove(), 400);
  el.remove(); // ✅ ქულას არ ვეხებით
}

function spawnTestBalloonPair() {
  const img = document.createElement("img");

  // შემთხვევით აირჩევს ერთ-ერთს
  img.src = balloonImages[Math.floor(Math.random() * balloonImages.length)];
  img.className = "balloon-pair";

  img.style.left = Math.random() * (gameArea.clientWidth - 70) + "px";
  img.style.top = "-120px";

  gameArea.appendChild(img);

  let y = -120;
  const speed = 2.3;

  const timer = setInterval(() => {
    y += speed;
    img.style.top = y + "px";

    if (y > gameArea.clientHeight + 150) {
      clearInterval(timer);
      img.remove();
    }
  }, 16);

  // ტესტისთვის — კლიკზე გაქრეს
  img.addEventListener("click", () => {
    clearInterval(timer);
    img.remove();
  });
}
function changeHouseSkin(house) {
  const color = (house.dataset.color || "").trim().toLowerCase();
  const img   = house.querySelector("img");
  const skins = HOUSE_SKINS[color];

  if (!img || !skins) return;

  let level = Number(house.dataset.level || 0);

  if (level < skins.length - 1) {
    level++;
    house.dataset.level = String(level);
    img.src = skins[level];
  }

  // 🔹 LEVEL CLASS UPDATE
  house.classList.remove("level-0", "level-1", "level-2");
  house.classList.add("level-" + level);

  // 🔹 Final house emphasis
  if (level === 2) {
    img.classList.add("house--big");
  }
}


function spawnHouseBalloonPair(house) {
  const color = (house.dataset.color || "").trim().toLowerCase();
  const src = HOUSE_BALLOON_PAIRS[color];
  if (!src) return;

  const anchor = house.querySelector(".anchor");
  if (!anchor) return;

  // თუ ძველი ჯერ კიდევ არის — წავშალოთ
  const old = anchor.querySelector("img.pair-on-house");
  if (old) old.remove();

  const img = document.createElement("img");
  img.src = src;
  img.className = "pair-on-house";

  anchor.appendChild(img);

  // 1) გამოჩნდეს და “დაჯდეს” სახლზე
  requestAnimationFrame(() => img.classList.add("show"));

  // 2) ცოტა ხანი “დამაგრებულად” იდგეს, მერე აფრინდეს
  setTimeout(() => img.classList.add("fly"), 600);

  // 3) წაშლა
  setTimeout(() => img.remove(), 1800);
}
function getBombSpawnInterval() {
  if (score >= 200) return 1200;
  if (score >= 400) return 900;
  return 1800;
}
// Summary modal refs
const summaryModal = document.getElementById("summaryModal");
const summaryScoreEl = document.getElementById("summaryScore");
const summaryHintEl = document.getElementById("summaryHint");
const summaryCloseBtn = document.getElementById("summaryCloseBtn");
const summaryRestartAdBtn = document.getElementById("summaryRestartAdBtn");

async function openSummary(score) {
  summaryScoreEl.textContent = score;

  // 1) Local scoreboard (დარჩეს როგორც fallback / offline)
  const top = addScore(score);
  renderScoreboard(top, score);

  // 2) Yandex leaderboard (თუ ხელმისაწვდომია)
  const ok = await submitScoreToYandex(score);

  if (ok) {
    const res = await fetchTopFromYandex(5);
    const entries = normalizeYandexEntries(res);
    if (entries.length) {
      renderYandexScoreboard(entries, score);
    }
  }

  summaryHintEl.textContent = "";
  summaryModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeSummary() {
  summaryModal.classList.add("hidden");
  document.body.style.overflow = "";
}

// backdrop click closes
summaryModal.addEventListener("click", (e) => {
  if (e.target && e.target.getAttribute("data-close") === "summary") {
    closeSummary();
  }
});

summaryCloseBtn.addEventListener("click", () => {
  closeSummary();
  stopGame();                       // ✅ გაჩერება
  mainMenu.classList.remove('hidden'); // ✅ Start ეკრანი
});

// --- Yandex Fullscreen Ad helper ---
async function showFullscreenAd() {
  if (!window.ysdk || !ysdk.adv || typeof ysdk.adv.showFullscreenAdv !== "function") {
    // SDK არ არის ან ad API არ მუშაობს
    return { ok: false, reason: "SDK not ready" };
  }

  try {
    await ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => console.log("Ad open"),
        onClose: () => console.log("Ad close"),
        onError: (e) => console.log("Ad error", e)
      }
    });
    return { ok: true };
  } catch (e) {
    console.log("Fullscreen ad failed:", e);
    return { ok: false, reason: "ad failed" };
  }
}

// Restart game — Watch Ad
summaryRestartAdBtn.addEventListener("click", async () => {
  // UX: disable while loading
  summaryRestartAdBtn.disabled = true;
  summaryHintEl.textContent = "Loading ad...";

  const res = await showFullscreenAd();

  // რეკლამა რომც ვერ გაეშვას, ხშირად მაინც აჯობებს restart გააკეთოს (შენ გადაწყვიტე)
  summaryHintEl.textContent = "";

  // 1) დახურე ფანჯარა
  closeSummary();

  // 2) აქ ჩასვი შენი რეალური restart logic:
  // resetAllState(); showMainMenu(); startGame();
  restartGameToStart(); // <-- ამ ფუნქციას ქვემოთ მოგცემ შაბლონად

  summaryRestartAdBtn.disabled = false;
});
function restartGameToStart() {
  score = 0;
  lives = 3;
  missedBombs = 0;
  updateScoreUI();
  updateLivesUI();

  // გაწმენდა
  gameArea.querySelectorAll('.balloon-img, .balloon-pair, .bomb-img').forEach(el => el.remove());

  // დაბრუნება თამაშზე
  mainMenu.classList.add('hidden');
  gameStarted = true;
  spawnLoop();
}
const SCOREBOARD_KEY = "balloons_top_scores_v1";

function loadScores() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(SCOREBOARD_KEY) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  // ✅ migrate old schema to always have {score, date, name}
  list = list
    .filter(x => x && typeof x.score === "number")
    .map(x => ({
      score: x.score,
      date: typeof x.date === "number" ? x.date : Date.now(),
      name: (typeof x.name === "string" && x.name.trim()) ? x.name.trim() : "Player"
    }));

  return list;
}

function saveScores(list) {
  localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(list));
}

function addScore(score) {
  const list = loadScores().filter(it => it && typeof it.score === "number");

  // ✅ თუ იგივე ქულა უკვე არსებობს — არ დავამატოთ ახალი ჩანაწერი,
  // უბრალოდ განვაახლოთ თარიღი (ანუ "ბოლოს მიღებული")
  const existing = list.find(it => it.score === score);
  if (existing) {
    existing.date = Date.now();
  } else {
    list.push({ score, date: Date.now() });
  }

  // ✅ საბოლოო დედუპი: ერთ ქულაზე ერთი ჩანაწერი (ვტოვებთ ყველაზე ახალს)
  const map = new Map();
  for (const it of list) {
    const prev = map.get(it.score);
    if (!prev || (it.date || 0) > (prev.date || 0)) {
      map.set(it.score, it);
    }
  }

  const unique = [...map.values()];

  // Sort: highest first, და თუ ერთნაირია — ახალი ზემოთ
  unique.sort((a, b) => (b.score - a.score) || ((b.date || 0) - (a.date || 0)));

  const top = unique.slice(0, 5);
  saveScores(top);
  return top;
}

function renderScoreboard(list, currentScore) {
  const box = document.getElementById("scoreboardList");
  if (!box) return;

  let youUsed = false;

  box.innerHTML = list.map((item, i) => {
    // ✅ თუ ძველი ჩანაწერია და name არ აქვს → "Player"
    let name = (item && typeof item.name === "string" && item.name.trim())
      ? item.name.trim()
      : "Player";

    // ✅ მხოლოდ ერთი "You" — მიმდინარე შედეგზე
    if (!youUsed && item.score === currentScore) {
      name = "You";
      youUsed = true;
    }

    return `
      <div class="scoreboard-row">
        <div class="scoreboard-rank">${i + 1}</div>
        <div class="scoreboard-name">${escapeHtml(name)}</div>
        <div class="scoreboard-score">${item.score}</div>
      </div>
    `;
  }).join("");



}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
let spawnTimerId = null; // თუ spawnLoop setTimeout-ს იყენებს

function stopGame() {
  gameStarted = false;

  // თუ setTimeout loop გაქვს
  if (spawnTimerId) {
    clearTimeout(spawnTimerId);
    spawnTimerId = null;
  }

  // გაწმენდა ეკრანის (შენივე კლასებით)
  gameArea.querySelectorAll('.balloon-img, .balloon-pair, .bomb-img').forEach(el => el.remove());
}
function resetHousesState() {
  houses.forEach(h => {
    // reset gameplay data
    h.dataset.has = "0";
    h.dataset.level = "0";
    delete h.dataset.upgraded;
    delete h.dataset.flying;

    // reset classes
    h.classList.remove("fly", "level-1", "level-2");
    h.classList.add("level-0");

    // clear roof balloons/cluster
    const anchor = h.querySelector(".anchor");
    if (anchor) {
      anchor.innerHTML = "";
      anchor.classList.remove("sway");
    }

    // reset image to first skin + remove big marker
    const color = (h.dataset.color || "").trim().toLowerCase();
    const img = h.querySelector("img");
    if (img && HOUSE_SKINS[color]) {
      img.src = HOUSE_SKINS[color][0];
      img.classList.remove("house--big");
    }
  });
}
function startNewGame() {
  // 🔁 reset state
  score = 0;
  lives = 3;
  missedBombs = 0;
  streakHouseId = null;
  streakCount = 0;
  gameOverPlayed = false;

  updateScoreUI();
  updateLivesUI();
   document.body.classList.add("game-active");
 resetHousesState();
  // 🧹 ეკრანის გაწმენდა
  gameArea.querySelectorAll(
    '.balloon-img, .balloon-pair, .bomb-img'
  ).forEach(el => el.remove());

  // ▶️ Start
  mainMenu.classList.add('hidden');
  gameStarted = true;
  spawnLoop();
}
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

const langButtons = document.querySelectorAll(".lang-btn");
const soundToggle = document.getElementById("soundToggle");

// --- Settings open/close ---
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

settingsModal.addEventListener("click", (e) => {
  if (e.target.dataset.close === "settings") {
    settingsModal.classList.add("hidden");
  }
});

// --- Language ---

const translations = {
  en: {
    start: "Start",
    settings: "Settings",
    language: "Language",
    sound: "Sound",
    close: "Close",
    summary: "Summary",
    yourScore: "Your score:",
    restartAd: "Restart game — Watch Ad",
    topScores: "Top scores",
    score: "Score"
  },
  ru: {
    start: "Начать",
    settings: "Настройки",
    language: "Язык",
    sound: "Звук",
    close: "Закрыть",
    summary: "Итоги",
    yourScore: "Ваш счёт:",
    restartAd: "Перезапустить — Смотреть рекламу",
    topScores: "Лучшие результаты",
    score: "Счёт"
  }
};

function t(key){
  const dict = translations[currentLang] || translations.en;
  return dict[key] || (translations.en[key] || key);
}
function detectInitialLanguage() {
  // 1️⃣ localStorage
  const saved = localStorage.getItem("game_lang");
  if (saved === "en" || saved === "ru") return saved;

  // 2️⃣ Yandex SDK
  if (ysdk && ysdk.environment && ysdk.environment.i18n) {
    const lang = ysdk.environment.i18n.lang;
    if (lang && lang.startsWith("en")) return "en";
    if (lang && lang.startsWith("ru")) return "ru";
  }

  // 3️⃣ fallback
  return "ru";
}
function changeLanguage(lang){
  currentLang = (lang === "ru") ? "ru" : "en";
  localStorage.setItem("game_lang", currentLang);

  // Start button
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.textContent = t("start");

  // Settings modal texts
  if (settingsModal) {
    const title = settingsModal.querySelector(".modal-title");
    if (title) title.textContent = t("settings");

    const rows = settingsModal.querySelectorAll(".setting-row span");
    if (rows[0]) rows[0].textContent = t("language");
    if (rows[1]) rows[1].textContent = t("sound");
  }

  if (closeSettingsBtn) closeSettingsBtn.textContent = t("close");

  // Summary modal texts
  const summaryModal = document.getElementById("summaryModal");
  if (summaryModal) {
    const title = document.getElementById("summaryTitle");
    if (title) title.textContent = t("summary");

    const p = summaryModal.querySelector(".modal-text");
    if (p) p.textContent = t("yourScore");

    const top = summaryModal.querySelector(".scoreboard-title");
    if (top) top.textContent = t("topScores");
  }

  const summaryCloseBtn = document.getElementById("summaryCloseBtn");
  if (summaryCloseBtn) summaryCloseBtn.textContent = t("close");

  const summaryRestartAdBtn = document.getElementById("summaryRestartAdBtn");
  if (summaryRestartAdBtn) summaryRestartAdBtn.textContent = t("restartAd");

  // Score label refresh
  updateScoreUI();
}



function applyLanguage(lang){
  langButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  changeLanguage(lang); // ✅ აღარ იყოს დაკომენტარებული
}

langButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.dataset.lang);
  });
});


// --- Sound ---
let soundOn = localStorage.getItem("sound_on") !== "false";

function updateSoundUI(){
  soundToggle.textContent = soundOn ? "🔊" : "🔇";
}

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  localStorage.setItem("sound_on", soundOn);
  updateSoundUI();

  // აქ დაუკავშირე შენი აუდიოები
  // setSoundEnabled(soundOn);
});

updateSoundUI();

// --- YANDEX SDK INIT ---
let ysdk = null;

// === YANDEX LEADERBOARD (server-side) ===
const YANDEX_LB_NAME = "balloons_main";

let yLb = null; // leaderboards instance (depends on SDK version)

async function initYandexLeaderboards() {
  if (!ysdk) return null;

  try {
    // Newer SDK style
    if (typeof ysdk.getLeaderboards === "function") {
      yLb = await ysdk.getLeaderboards();
      return yLb;
    }

    // Older style fallback (some builds expose ysdk.leaderboards)
    if (ysdk.leaderboards) {
      yLb = ysdk.leaderboards;
      return yLb;
    }
  } catch (e) {
    console.log("Leaderboards init failed:", e);
  }

  yLb = null;
  return null;
}

async function submitScoreToYandex(scoreValue) {
  if (!ysdk) return false;
  if (!Number.isFinite(scoreValue)) return false;

  const s = Math.max(0, Math.floor(scoreValue));
  if (!yLb) await initYandexLeaderboards();
  if (!yLb) return false;

  try {
    // Two possible API shapes:
    if (typeof yLb.setLeaderboardScore === "function") {
      await yLb.setLeaderboardScore(YANDEX_LB_NAME, s);
      return true;
    }
    if (typeof yLb.setScore === "function") {
      await yLb.setScore(YANDEX_LB_NAME, s);
      return true;
    }

    // If SDK uses direct method names
    if (typeof yLb.setScore === "function") {
      await yLb.setScore(YANDEX_LB_NAME, s);
      return true;
    }
  } catch (e) {
    console.log("Submit score failed:", e);
  }

  return false;
}

async function fetchTopFromYandex(limit = 5) {
  if (!ysdk) return null;

  if (!yLb) await initYandexLeaderboards();
  if (!yLb) return null;

  try {
    // Newer API
    if (typeof yLb.getLeaderboardEntries === "function") {
      const res = await yLb.getLeaderboardEntries(YANDEX_LB_NAME, {
        quantityTop: limit,
        includeUser: true,
        quantityAround: 0
      });
      return res;
    }

    // Older API
    if (typeof yLb.getEntries === "function") {
      const res = await yLb.getEntries(YANDEX_LB_NAME, {
        quantityTop: limit,
        includeUser: true,
        quantityAround: 0
      });
      return res;
    }
  } catch (e) {
    console.log("Fetch leaderboard failed:", e);
  }

  return null;
}

function normalizeYandexEntries(res) {
  // აბრუნებს ერთიან მასივს: [{name, score, rank}]
  if (!res || !Array.isArray(res.entries)) return [];

  return res.entries.map((e) => {
    const name =
      (e.player && (e.player.publicName || e.player.name)) ||
      "Player";

    const scoreVal =
      (e.score && (e.score.value ?? e.score)) ??
      0;

    return {
      name,
      score: Number(scoreVal) || 0,
      rank: Number(e.rank) || 0
    };
  });
}

function renderYandexScoreboard(entries, currentScore) {
  const box = document.getElementById("scoreboardList");
  if (!box) return;

  box.innerHTML = entries.slice(0, 5).map((item, i) => {
    // "You" თუ ამ ქულას დაემთხვა (უბრალო UX)
    const labelName = (item.score === currentScore) ? "You" : item.name;

    return `
      <div class="scoreboard-row">
        <div class="scoreboard-rank">${item.rank ? item.rank : (i + 1)}</div>
        <div class="scoreboard-name">${escapeHtml(labelName)}</div>
        <div class="scoreboard-score">${item.score}</div>
      </div>
    `;
  }).join("");
}

if (window.YaGames && typeof YaGames.init === "function") {
  YaGames.init().then((_ysdk) => {
    ysdk = _ysdk;

    const detectedLang = detectInitialLanguage();
    applyLanguage(detectedLang);

    // ✅ აქ უნდა იყოს
    initYandexLeaderboards();

  }).catch((e) => {
    console.log("Yandex SDK init error:", e);
    applyLanguage("ru");
  });
} else {
  applyLanguage("ru");
}
