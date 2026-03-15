const gallery = document.getElementById("gallery");
const storyPanelEl = document.getElementById("storyPanel");
const storyMoverEl = document.getElementById("storyMover");
const storyInner = document.getElementById("storyInner");

const hoverPreview = document.getElementById("hoverPreview");
const hoverPreviewImg = document.getElementById("hoverPreviewImg");

const statsOverlay = document.getElementById("statsOverlay");


entries.forEach((entry, i) => {
  // Create wrapper
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.index = i;

  // Create image
  const img = document.createElement("img");
  img.src = entry.src;
  img.alt = entry.date;
  img.loading = "lazy";

  // Create caption
  const caption = document.createElement("div");
  caption.className = "caption";

  caption.innerHTML = `
    <div class="date">${entry.date}</div>
    <div class="location">${entry.location}</div>
    <div class="food">${entry.food}</div>
  `;

  // Append image + caption to card
  card.appendChild(img);
  card.appendChild(caption);

  // Append card to gallery
  gallery.appendChild(card);
});


// ABOUT POP UP
const projectOverlay = document.getElementById("projectOverlay");
const projectOverlayClose = document.getElementById("projectOverlayClose");

function openProjectOverlay(e) {
  if (window.innerWidth <= 899) return;
  e.preventDefault();
  projectOverlay.classList.add("show");
  projectOverlay.setAttribute("aria-hidden", "false");
}

function closeProjectOverlay() {
  projectOverlay.classList.remove("show");
  projectOverlay.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("#projectLink");
  if (link) {
    openProjectOverlay(e);
  }

  if (
    e.target.id === "projectOverlayClose" ||
    e.target.id === "projectOverlay"
  ) {
    closeProjectOverlay();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProjectOverlay();
});





// 2) Build story lines (placeholder logic — you can rewrite tone later)
const storyLines = entries.map((e) => {
  return `On ${e.date}, she ate <span class="foodHighlight">${e.food}</span> in ${e.location}.`;
});

const storyHTML = storyLines
  .map((line, i) => `<p data-index="${i}">${line}</p>`)
  .join("");

storyInner.innerHTML = storyHTML;

// 4) Sync: highlight story line based on which card is active (mobile)
function setActiveIndex(idx) {
  // highlight story line
  const prev = storyInner.querySelector("p.active");
  if (prev) prev.classList.remove("active");

  const cur = storyInner.querySelector(`p[data-index="${idx}"]`);
  if (cur) cur.classList.add("active");
  launchFlyingFood(entries[idx].food, idx);
}


// Use IntersectionObserver to detect the most visible slide in the horizontal scroller
const cards = Array.from(document.querySelectorAll(".card"));

// Desktop hover preview in the center
cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    if (window.innerWidth <= 899) return;

    const img = card.querySelector("img");
    if (!img) return;

    hoverPreviewImg.src = img.src;
    hoverPreviewImg.alt = img.alt || "";
    hoverPreview.classList.add("show");
  });

  card.addEventListener("mouseleave", () => {
    if (window.innerWidth <= 899) return;
    hoverPreview.classList.remove("show");
  });
});

// ===== DATA OVERLAY =====
function getMostCommon(arr) {
  const counts = {};
  let winner = "";
  let max = 0;

  arr.forEach((item) => {
    if (!item) return;
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] > max) {
      max = counts[item];
      winner = item;
    }
  });

  return winner;
}

const photoCount = entries.length;

const countries = new Set(
  entries
    .map((entry) => entry.country)
    .filter(Boolean)
).size;

const foods = entries.map((entry) => entry.food);
const mostCommonFood = getMostCommon(foods);

const cities = entries.map((entry) => {
  if (!entry.location) return "";
  return entry.location.split(",")[0].trim();
});
const mostPhotographedCity = getMostCommon(cities);

statsOverlay.innerHTML = `
<div>
    <a href="#" class="projectLink" id="projectLink">Food Alara Eats</a>
  </div>
  <div># photos: ${photoCount}</div>
  <div>Countries: ${countries || 0}</div>
  <div>Most common food: ${mostCommonFood}</div>
  <div>Most photographed city: ${mostPhotographedCity}</div>
`;

const io = new IntersectionObserver(
  (entriesObs) => {
    // pick the entry with highest intersection ratio
    let best = null;
    for (const ent of entriesObs) {
      if (!best || ent.intersectionRatio > best.intersectionRatio) best = ent;
    }
    if (best && best.isIntersecting) {
      const idx = Number(best.target.dataset.index);
      setActiveIndex(idx);
    }
  },
  {
    root: gallery,        // IMPORTANT: observe visibility within the horizontal scroller
    threshold: [0.4, 0.6, 0.8],
  }
);

cards.forEach((c) => io.observe(c));
// start at the beginning
window.addEventListener("load", () => {
  gallery.scrollLeft = 0;
  setActiveIndex(0);
});



const galleryEl = gallery; // reuse

let targetProgress = 0;
let currentProgress = 0;
let rafId = null;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function syncScroll(p) {
  const galleryMax = galleryEl.scrollWidth - galleryEl.clientWidth;
  galleryEl.scrollLeft = p * galleryMax;

  const panelH = storyPanelEl.clientHeight;
  // const contentH = storyInner.scrollHeight;
  const contentH = storyMoverEl.scrollHeight;
  const maxTranslate = Math.max(0, contentH - panelH);

  const y = -p * maxTranslate;
  storyMoverEl.style.transform = `translateY(${y}px)`;
}

function animate() {
  // Ease factor: smaller = smoother but slower, larger = snappier
  const ease = 0.12;

  currentProgress += (targetProgress - currentProgress) * ease;

  // Snap when very close to avoid endless micro-movement
  if (Math.abs(targetProgress - currentProgress) < 0.0005) {
    currentProgress = targetProgress;
  }

  syncScroll(currentProgress);
  // onProgressChanged(currentProgress);

  // Continue until we reach the target
  if (currentProgress !== targetProgress) {
    rafId = requestAnimationFrame(animate);
  } else {
    rafId = null;
  }
}

function kickAnimation() {
  if (rafId === null) rafId = requestAnimationFrame(animate);
}

function addInput(deltaProgress) {
  targetProgress = clamp(targetProgress + deltaProgress, 0, 1);
  kickAnimation();
}

function onWheel(e) {
  if (window.innerWidth > 899) return;
  e.preventDefault();

  const delta = e.deltaY || e.deltaX || 0;
  addInput(delta / 1800); // adjust sensitivity (smaller denominator = faster)
}

window.addEventListener("wheel", onWheel, { passive: false });

// Touch support: drag up/down anywhere -> drives both
let touchStartY = null;

window.addEventListener("touchstart", (e) => {
  if (window.innerWidth > 899) return;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  if (window.innerWidth > 899) return;
  if (touchStartY === null) return;

  e.preventDefault();

  const y = e.touches[0].clientY;
  const dy = touchStartY - y; // swipe up -> positive
  touchStartY = y;

  addInput(dy / 900); // adjust sensitivity (smaller = faster)
}, { passive: false });

window.addEventListener("touchend", () => {
  touchStartY = null;
});

window.addEventListener("load", () => {
  targetProgress = 0;
  currentProgress = 0;
  syncScroll(0);
});



// FLYING FOOD
const flyingFoods = {
  pizza: "food/pizza.png",
  pretzel: "food/pretzel.png",
  udon: "food/udon.png",
  taco: "food/taco.png",
  "ice cream": "food/ice_cream.png",
  pastry: "food/muffin.png",
  cake: "food/cake.png"
};

const flyingFoodLayer = document.getElementById("flyingFoodLayer");
let lastFlyingIndex = -1;

function launchFlyingFood(foodName, idx) {
  if (window.innerWidth > 899) return;
  if (idx === lastFlyingIndex) return;

  const key = foodName.trim().toLowerCase();
  const imgSrc = flyingFoods[key];
  if (!imgSrc) return;

  lastFlyingIndex = idx;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.className = "flyingFood";

  const randomTop = 20 + Math.random() * 60;
  const randomRotate = -20 + Math.random() * 40;
  const randomSize = 90 + Math.random() * 40;

  img.style.top = `${randomTop}%`;
  img.style.width = `${randomSize}px`;
  img.style.transform = `translateY(-50%) rotate(${randomRotate}deg)`;

  img.addEventListener("animationend", () => {
    img.remove();
  });

  flyingFoodLayer.appendChild(img);
}





