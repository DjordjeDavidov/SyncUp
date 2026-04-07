function createHashSeed(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seedText) {
  let state = createHashSeed(seedText);

  return function next() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function chance(rng, probability) {
  return rng() < probability;
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function shuffle(rng, items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = clone[index];
    clone[index] = clone[swapIndex];
    clone[swapIndex] = current;
  }

  return clone;
}

function sampleSize(rng, items, size) {
  return shuffle(rng, items).slice(0, Math.max(0, Math.min(size, items.length)));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(items) {
  return Array.from(new Set(items));
}

function daysAgo(baseDate, days, minutes = 0) {
  return new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000 - minutes * 60 * 1000);
}

function daysFromNow(baseDate, days, minutes = 0) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000 + minutes * 60 * 1000);
}

function encodeSvgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createBannerDataUri(seed, label) {
  const palette = [
    ["#0f172a", "#1d4ed8", "#38bdf8"],
    ["#111827", "#7c3aed", "#c084fc"],
    ["#1f2937", "#ea580c", "#fdba74"],
    ["#0b1120", "#059669", "#6ee7b7"],
    ["#172033", "#db2777", "#f9a8d4"],
  ];
  const colors = palette[createHashSeed(seed) % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 480" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="55%" stop-color="${colors[1]}"/>
        <stop offset="100%" stop-color="${colors[2]}"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="480" fill="url(#g)"/>
    <circle cx="1260" cy="140" r="150" fill="rgba(255,255,255,0.08)"/>
    <circle cx="320" cy="360" r="220" fill="rgba(255,255,255,0.06)"/>
    <path d="M0 360C180 300 350 320 520 360S860 450 1060 390 1360 230 1600 290V480H0Z" fill="rgba(255,255,255,0.08)"/>
  </svg>`;

  return encodeSvgDataUri(svg);
}

function createAvatarUrl(seed) {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

module.exports = {
  chance,
  createAvatarUrl,
  createBannerDataUri,
  createRng,
  daysAgo,
  daysFromNow,
  pick,
  randomInt,
  sampleSize,
  shuffle,
  slugify,
  unique,
};
