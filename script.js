const HOUSE_SKINS = {
  red:   ["./image/redh.png",   "./image/purpleyellow2.png"],
  blue:  ["./image/blueh.png",  "./image/bluehdouble.png"],
  green: ["./image/greenh.png", "./image/greeyellow3.png"],
  yellow:["./image/yellowh.png","./image/yellowhdouble.png"]
};
const HOUSE_NEED = 5;       // 15 ბუშტზე აფრინდეს სახლი

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
    setInterval(spawnTestBalloonPair, 1200);
});
// ეკრანები
const mainScreen = document.getElementById('mainScreen');


const gameArea = document.getElementById('gameArea');
let   houses   = [...document.querySelectorAll('.house')];
const scoreEl  = document.getElementById('score');
let score = 0;
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



const BOMB_CHANCE    = 0.25; // 25% ბომბი
const BOMB_PENALTY   = 2;    // ბომბზე -2 ქულა
const BALLOON_POINTS = 5;    // სწორ ბუშტზე +5 ქულა

// --- SPAWN BALLOONS ---
setInterval(() => {
  
  if (!gameStarted) return;
  spawnItem();
}, 1400);


function spawnItem() {
  // ფერები იგივე ლოგიკით
  let availableColors = COLORS;
  if (hasDoublePalette) {
    availableColors = ['red', 'yellow'];
  }

  const color = availableColors[Math.floor(Math.random() * availableColors.length)];

  // გადაწყვიტე: ბუშტი თუ ბომბი
  const isBomb = Math.random() < BOMB_CHANCE;

  const el = document.createElement('div');
  el.dataset.color = color;

  if (isBomb) {
    el.className = `bomb ${color}`;
    el.dataset.type = "bomb";
  } else {
    el.className = `balloon ${color}`;
    el.dataset.type = "balloon";
  }

  const r = gameArea.getBoundingClientRect();
  const startX = Math.random() * (r.width - 60);
  el.style.left = `${startX}px`;
  el.style.top  = `-100px`;

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
  const type = (balloon.dataset.type || "balloon");

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
  if (houseColor === color) {
    // ✅ სწორ სახლზე მიამაგრა
    attachToRoof(targetHouse, color);

    // --- ქულები (ძირითადი + streak ლოგიკა) ---

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
  // ბუშტების გასუფთავება
  const anchor = h.querySelector('.anchor');
  if (anchor) {
    anchor.innerHTML = '';
    anchor.classList.remove('sway');
  }

  h.dataset.has = '0';

 
  // 🔁 სახლის შეცვლა
changeHouseSkin(h);

  // დაბრუნება ქუჩაზე
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
function gameOver() {
  gameStarted = false;

  // ეკრანზე დავაბრუნოთ მთავარი მენიუ
  mainMenu.classList.remove('hidden');

  // გაწმინდოს მიმდინარე ვარდნადი ობიექტები
  gameArea.querySelectorAll('.balloon, .bomb').forEach(el => el.remove());

  // სურვილისამებრ შეტყობინება
  alert("Game Over!");
}
function explodeBomb(bomb) {
  bomb.classList.add('explode');

  setTimeout(() => {
    bomb.remove();
  }, 400);
}
const balloonImages = [
  "./image/balloon-green-yellow.png",
  "./image/balloon-orange-blue.png",
  "./image/purplegre.png",
  "./image/purpleyellow.png"
];

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
  const img = house.querySelector("img");
  const skins = HOUSE_SKINS[color];

  if (!img || !skins || skins.length === 0) return;

  // აირჩიოს ახალი, რომელიც არ არის იგივე
  const current = img.getAttribute("src") || "";
  let next = skins[Math.floor(Math.random() * skins.length)];

  if (skins.length > 1) {
    while (next === current) {
      next = skins[Math.floor(Math.random() * skins.length)];
    }
  }

  img.src = next;
}