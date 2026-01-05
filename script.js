
const HOUSE_SKINS = {
  red:   ["./image/redh.png",   "./image/bigred.png",  "./image/bigredhouse.png"],
  blue:  ["./image/blueh.png",  "./image/bigblue.png","./image/bigbluehouse.png"],
  green: ["./image/greenh.png", "./image/biggreen.png","./image/biggreenhouse.png"],
  yellow:["./image/yellowh.png","./image/bluehdouble.png", "./image/bigyellowhouse.png"],
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
  mainMenu.classList.add('hidden');
  gameStarted = true;
  spawnLoop();
  // setInterval(spawnTestBalloonPair, 1200); // ❌ არ გვჭირდება
});
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
  scoreEl.textContent = 'Score: ' + score;

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
  if (score >= 400) return 900;
  if (score >= 200) return 1100;
  return 1400;
}

function getBombChance(){
  if (score >= 400) return 0.45;
  if (score >= 200) return 0.35;
  return 0.25; // შენი ახლანდელი
}

function spawnLoop(){
  if (!gameStarted) return;
  spawnItem();
  setTimeout(spawnLoop, getSpawnInterval());
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
      balloon.remove();
      return;
    }

 if (y > gameArea.getBoundingClientRect().height + 120) {

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
    const prev = score;
    score = Math.max(0, score - BOMB_PENALTY);
   updateScoreUI();

    // streak წყდება
    streakHouseId = null;
    streakCount   = 0;

    // თუ ქულა დაკლებით 0-მდე ჩამოვიდა → Game Over
    if (prev > 0 && score === 0) {
      gameOver();
    }

    return true; // დამუშავდა (fall() მოაშორებს ელემენტს)
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
   "./image/redbombred.png"
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
score += 10;
updateScoreUI();

 

  // მერე აფრენა
  h.classList.add('fly');

  setTimeout(() => {
    const anchor = h.querySelector('.anchor');
  if (anchor) {
  anchor.innerHTML = '';
  anchor.classList.remove('sway');
  anchor.dataset.pairsPlaced = "0"; // ✅ ეს დაამატე
}

    h.dataset.has = '0';

    changeHouseSkin(h);
    // როცა სახლი განახლდება
   h.dataset.upgraded = "1";
    h.classList.remove('fly');
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

function gameOver() {
  gameStarted = false;       // spawnLoop შეწყდება
  clearFallingItems();

  // აქ აჩვენე ლამაზი Summary
  openSummary(score);
}
function explodeBomb(bomb) {
  bomb.classList.add('explode');

  setTimeout(() => {
    bomb.remove();
  }, 400);
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

function openSummary(score) {
  summaryScoreEl.textContent = score;
  const top = addScore(score);
renderScoreboard(top, score);
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
  mainMenu.classList.remove('hidden'); // Start ეკრანი
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
  const list = loadScores();

  list.push({
    score,
    date: Date.now()
  });

  // Sort: highest first
  list.sort((a, b) => b.score - a.score);

  // Keep top 5
  const top = list.slice(0, 5);
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


  box.innerHTML = list.map((item, i) => `
    <div class="scoreboard-row">
      <div class="scoreboard-rank">${i + 1}</div>
      <div class="scoreboard-name">${escapeHtml(item.name)}</div>
      <div class="scoreboard-score">${item.score}</div>
    </div>
  `).join("");
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