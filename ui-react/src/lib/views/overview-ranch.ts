/**
 * overview-ranch.ts
 * Pokémon-style pixel RPG top-down ranch scene.
 * Tile-based map with trees, paths, barn, pond, fence, and cow-horse agents.
 */
import { html, nothing } from "lit";
import type { GatewayAgentRow, SessionActivityResult } from "../types.ts";

// ─── Pixel Art SVG Helpers ──────────────────────────────────────────

/** Pixel tree (top-down RPG style, like Pokémon trees) */
function treeSvg(size: "sm" | "lg" = "sm") {
  const w = size === "lg" ? 40 : 32;
  const h = size === "lg" ? 48 : 40;
  const s = size === "lg" ? 1.25 : 1;
  return html`
    <svg width="${w}" height="${h}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Trunk -->
      <rect x="13" y="28" width="6" height="12" fill="#8B6914"/>
      <rect x="14" y="28" width="2" height="12" fill="#a07820" opacity="0.5"/>
      <!-- Canopy layers (rounded pixel blob) -->
      <rect x="4" y="12" width="24" height="16" rx="4" fill="#38802a"/>
      <rect x="6" y="8" width="20" height="14" rx="4" fill="#48a038"/>
      <rect x="8" y="4" width="16" height="10" rx="3" fill="#58b848"/>
      <!-- Highlights -->
      <rect x="10" y="6" width="6" height="4" rx="2" fill="#68c858" opacity="0.6"/>
      <rect x="18" y="10" width="4" height="3" rx="1" fill="#68c858" opacity="0.4"/>
      <!-- Shadow -->
      <rect x="6" y="22" width="20" height="4" rx="2" fill="#2a6020" opacity="0.4"/>
    </svg>
  `;
}

/** Pixel barn (top-down RPG style) */
function barnSvg() {
  return html`
    <svg width="64" height="56" viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Shadow -->
      <rect x="4" y="48" width="56" height="8" rx="2" fill="rgba(0,0,0,0.12)"/>
      <!-- Walls -->
      <rect x="4" y="20" width="56" height="32" fill="#c8a060"/>
      <rect x="4" y="20" width="56" height="32" rx="1" fill="none" stroke="#a08040" stroke-width="1"/>
      <!-- Wall texture lines -->
      <rect x="4" y="28" width="56" height="1" fill="#b89050" opacity="0.5"/>
      <rect x="4" y="36" width="56" height="1" fill="#b89050" opacity="0.5"/>
      <rect x="4" y="44" width="56" height="1" fill="#b89050" opacity="0.5"/>
      <!-- Roof -->
      <polygon points="0,22 32,4 64,22" fill="#c03030"/>
      <polygon points="4,22 32,6 60,22" fill="#d04040"/>
      <!-- Roof highlight -->
      <polygon points="10,20 32,8 40,16" fill="#e05050" opacity="0.4"/>
      <!-- Roof edge -->
      <rect x="0" y="20" width="64" height="3" fill="#a02828"/>
      <!-- Door -->
      <rect x="24" y="34" width="16" height="18" rx="1" fill="#6a4020"/>
      <rect x="25" y="35" width="14" height="16" fill="#7a5030"/>
      <!-- Door lines -->
      <rect x="31" y="35" width="2" height="16" fill="#6a4020"/>
      <!-- Window left -->
      <rect x="8" y="28" width="10" height="10" rx="1" fill="#88c8e8"/>
      <rect x="8" y="28" width="10" height="10" rx="1" fill="none" stroke="#a08040" stroke-width="1"/>
      <rect x="12" y="28" width="2" height="10" fill="#a08040"/>
      <rect x="8" y="32" width="10" height="2" fill="#a08040"/>
      <!-- Window right -->
      <rect x="46" y="28" width="10" height="10" rx="1" fill="#88c8e8"/>
      <rect x="46" y="28" width="10" height="10" rx="1" fill="none" stroke="#a08040" stroke-width="1"/>
      <rect x="50" y="28" width="2" height="10" fill="#a08040"/>
      <rect x="46" y="32" width="10" height="2" fill="#a08040"/>
    </svg>
  `;
}

/** Pixel fence segment (horizontal) */
function fenceSvg(width: number) {
  return html`
    <svg width="${width}" height="16" viewBox="0 0 ${width} 16" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Posts -->
      ${Array.from({ length: Math.floor(width / 16) + 1 }, (_, i) => {
        const x = i * 16;
        return html`<rect x="${x}" y="0" width="4" height="16" fill="#a07020"/>
                     <rect x="${x}" y="0" width="2" height="16" fill="#b08030" opacity="0.5"/>`;
      })}
      <!-- Rails -->
      <rect x="0" y="3" width="${width}" height="3" fill="#c09040"/>
      <rect x="0" y="4" width="${width}" height="1" fill="#d0a050" opacity="0.5"/>
      <rect x="0" y="10" width="${width}" height="3" fill="#c09040"/>
      <rect x="0" y="11" width="${width}" height="1" fill="#d0a050" opacity="0.5"/>
    </svg>
  `;
}

/** Pixel fence segment (vertical) */
function fenceVertSvg(height: number) {
  return html`
    <svg width="16" height="${height}" viewBox="0 0 16 ${height}" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      ${Array.from({ length: Math.floor(height / 16) + 1 }, (_, i) => {
        const y = i * 16;
        return html`<rect x="0" y="${y}" width="16" height="4" fill="#a07020"/>
                     <rect x="0" y="${y}" width="16" height="2" fill="#b08030" opacity="0.5"/>`;
      })}
      <rect x="3" y="0" width="3" height="${height}" fill="#c09040"/>
      <rect x="4" y="0" width="1" height="${height}" fill="#d0a050" opacity="0.5"/>
      <rect x="10" y="0" width="3" height="${height}" fill="#c09040"/>
      <rect x="11" y="0" width="1" height="${height}" fill="#d0a050" opacity="0.5"/>
    </svg>
  `;
}

/** Pond SVG */
function pondSvg() {
  return html`
    <svg width="72" height="48" viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <ellipse cx="36" cy="24" rx="34" ry="22" fill="#3878b8"/>
      <ellipse cx="36" cy="24" rx="30" ry="18" fill="#4890d0"/>
      <ellipse cx="36" cy="22" rx="26" ry="14" fill="#58a0e0"/>
      <!-- Water highlights -->
      <rect x="18" y="16" width="12" height="2" rx="1" fill="#78c0f0" opacity="0.5"/>
      <rect x="34" y="20" width="8" height="2" rx="1" fill="#78c0f0" opacity="0.5"/>
      <rect x="24" y="26" width="10" height="2" rx="1" fill="#78c0f0" opacity="0.3"/>
      <!-- Edge stones -->
      <rect x="4" y="18" width="4" height="3" rx="1" fill="#98a0a8"/>
      <rect x="60" y="26" width="5" height="3" rx="1" fill="#98a0a8"/>
      <rect x="16" y="38" width="4" height="3" rx="1" fill="#90989f"/>
    </svg>
  `;
}

/** Small house (pixel RPG cottage, green roof) */
function smallHouseSvg(roofColor = "#48a838") {
  return html`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Shadow -->
      <rect x="4" y="34" width="32" height="6" rx="1" fill="rgba(0,0,0,0.1)"/>
      <!-- Walls -->
      <rect x="4" y="18" width="32" height="18" fill="#e8d8c0"/>
      <rect x="4" y="18" width="32" height="18" fill="none" stroke="#c8b8a0" stroke-width="1"/>
      <!-- Wall texture -->
      <rect x="4" y="24" width="32" height="1" fill="#d8c8b0" opacity="0.5"/>
      <rect x="4" y="30" width="32" height="1" fill="#d8c8b0" opacity="0.5"/>
      <!-- Roof -->
      <polygon points="0,20 20,6 40,20" fill="${roofColor}"/>
      <polygon points="4,20 20,8 36,20" fill="${roofColor}" opacity="0.8"/>
      <!-- Roof highlight -->
      <polygon points="10,18 20,10 24,14" fill="white" opacity="0.15"/>
      <rect x="0" y="18" width="40" height="3" fill="${roofColor}" opacity="0.6"/>
      <!-- Door -->
      <rect x="16" y="24" width="8" height="12" rx="1" fill="#6a4020"/>
      <rect x="17" y="25" width="6" height="10" fill="#7a5030"/>
      <circle cx="22" cy="30" r="0.8" fill="#c4a060"/>
      <!-- Window -->
      <rect x="6" y="22" width="7" height="7" rx="1" fill="#88c8e8"/>
      <rect x="6" y="22" width="7" height="7" rx="1" fill="none" stroke="#c8b8a0" stroke-width="0.8"/>
      <rect x="9" y="22" width="1" height="7" fill="#c8b8a0"/>
      <rect x="6" y="25" width="7" height="1" fill="#c8b8a0"/>
      <!-- Window right -->
      <rect x="27" y="22" width="7" height="7" rx="1" fill="#88c8e8"/>
      <rect x="27" y="22" width="7" height="7" rx="1" fill="none" stroke="#c8b8a0" stroke-width="0.8"/>
      <rect x="30" y="22" width="1" height="7" fill="#c8b8a0"/>
      <rect x="27" y="25" width="7" height="1" fill="#c8b8a0"/>
    </svg>
  `;
}

/** Signpost SVG */
function signpostSvg() {
  return html`
    <svg width="20" height="28" viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <rect x="9" y="8" width="3" height="20" fill="#8B6914"/>
      <rect x="10" y="8" width="1" height="20" fill="#a07820" opacity="0.5"/>
      <rect x="2" y="2" width="16" height="8" rx="1" fill="#c49040"/>
      <rect x="2" y="2" width="16" height="8" fill="none" stroke="#a07020" stroke-width="0.8" rx="1"/>
      <rect x="4" y="4" width="12" height="1" fill="#a07020" opacity="0.4"/>
      <rect x="4" y="7" width="12" height="1" fill="#a07020" opacity="0.4"/>
    </svg>
  `;
}

/** Water well SVG */
function wellSvg() {
  return html`
    <svg width="24" height="28" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Base -->
      <ellipse cx="12" cy="22" rx="10" ry="5" fill="#888"/>
      <ellipse cx="12" cy="22" rx="8" ry="3.5" fill="#4890d0"/>
      <ellipse cx="12" cy="22" rx="6" ry="2.5" fill="#58a0e0"/>
      <!-- Stone wall -->
      <rect x="2" y="14" width="20" height="8" rx="2" fill="#98a0a8"/>
      <rect x="2" y="14" width="20" height="8" fill="none" stroke="#787878" stroke-width="0.8" rx="2"/>
      <rect x="4" y="17" width="16" height="1" fill="#787878" opacity="0.3"/>
      <!-- Roof posts -->
      <rect x="4" y="4" width="2" height="12" fill="#8B6914"/>
      <rect x="18" y="4" width="2" height="12" fill="#8B6914"/>
      <!-- Roof -->
      <rect x="1" y="2" width="22" height="4" rx="1" fill="#a07020"/>
      <rect x="3" y="1" width="18" height="2" rx="1" fill="#b08030"/>
    </svg>
  `;
}

/** Hay bale stack (2 bales + 1 on top) */
function hayBaleSvg() {
  return html`
    <svg width="36" height="28" viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Shadow -->
      <ellipse cx="18" cy="26" rx="16" ry="3" fill="rgba(0,0,0,0.1)"/>
      <!-- Bottom left bale -->
      <rect x="0" y="14" width="16" height="12" rx="2" fill="#dab040"/>
      <rect x="0" y="14" width="16" height="12" rx="2" fill="none" stroke="#b89030" stroke-width="1"/>
      <rect x="2" y="17" width="12" height="1" fill="#c8a038" opacity="0.6"/>
      <rect x="2" y="21" width="12" height="1" fill="#c8a038" opacity="0.6"/>
      <!-- Bottom right bale -->
      <rect x="18" y="14" width="16" height="12" rx="2" fill="#e0b848"/>
      <rect x="18" y="14" width="16" height="12" rx="2" fill="none" stroke="#b89030" stroke-width="1"/>
      <rect x="20" y="17" width="12" height="1" fill="#c8a038" opacity="0.6"/>
      <rect x="20" y="21" width="12" height="1" fill="#c8a038" opacity="0.6"/>
      <!-- Top bale -->
      <rect x="8" y="4" width="18" height="11" rx="2" fill="#e8c050"/>
      <rect x="8" y="4" width="18" height="11" rx="2" fill="none" stroke="#c0a040" stroke-width="1"/>
      <rect x="10" y="7" width="14" height="1" fill="#d0a840" opacity="0.6"/>
      <rect x="10" y="11" width="14" height="1" fill="#d0a840" opacity="0.6"/>
      <!-- Straw wisps -->
      <line x1="6" y1="3" x2="9" y2="1" stroke="#e8c850" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="22" y1="2" x2="25" y2="0" stroke="#e8c850" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
}

/** Feed trough with food */
function feedTroughSvg() {
  return html`
    <svg width="40" height="24" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Legs -->
      <rect x="6" y="16" width="3" height="8" fill="#8B6914"/>
      <rect x="31" y="16" width="3" height="8" fill="#8B6914"/>
      <!-- Trough body -->
      <path d="M2 8 L6 20 H34 L38 8 Z" fill="#a07830"/>
      <path d="M4 8 L7 18 H33 L36 8 Z" fill="#b89048"/>
      <!-- Food inside -->
      <ellipse cx="14" cy="10" rx="4" ry="2" fill="#78b838"/>
      <ellipse cx="22" cy="11" rx="5" ry="2.5" fill="#68a828"/>
      <ellipse cx="30" cy="10" rx="3" ry="2" fill="#88c848"/>
      <!-- Rim -->
      <rect x="2" y="7" width="36" height="3" rx="1" fill="#c09840"/>
      <rect x="2" y="7" width="36" height="1" fill="#d0a850" opacity="0.5"/>
    </svg>
  `;
}

/** Milk bucket */
function milkBucketSvg() {
  return html`
    <svg width="16" height="20" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Bucket body -->
      <path d="M3 6 L2 18 H14 L13 6 Z" fill="#b0b0b8"/>
      <path d="M4 6 L3 17 H13 L12 6 Z" fill="#c8c8d0"/>
      <!-- Bands -->
      <rect x="2" y="8" width="12" height="2" rx="0.5" fill="#909098"/>
      <rect x="2" y="14" width="12" height="2" rx="0.5" fill="#909098"/>
      <!-- Milk inside -->
      <ellipse cx="8" cy="7" rx="5" ry="2" fill="#f0f0f8"/>
      <ellipse cx="8" cy="7" rx="4" ry="1.5" fill="#fff"/>
      <!-- Handle -->
      <path d="M4 4 Q8 0 12 4" stroke="#808088" stroke-width="1.5" fill="none"/>
      <!-- Rim -->
      <ellipse cx="8" cy="6" rx="5.5" ry="2" fill="none" stroke="#909098" stroke-width="1"/>
    </svg>
  `;
}

/** Windmill */
function windmillSvg() {
  return html`
    <svg width="40" height="56" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Shadow -->
      <ellipse cx="20" cy="54" rx="12" ry="3" fill="rgba(0,0,0,0.1)"/>
      <!-- Tower -->
      <path d="M14 20 L12 52 H28 L26 20 Z" fill="#d8c8b0"/>
      <path d="M15 20 L13 50 H27 L25 20 Z" fill="#e8d8c0"/>
      <!-- Tower lines -->
      <rect x="13" y="30" width="14" height="1" fill="#c8b8a0" opacity="0.5"/>
      <rect x="13" y="40" width="14" height="1" fill="#c8b8a0" opacity="0.5"/>
      <!-- Door -->
      <rect x="17" y="42" width="6" height="10" rx="3" fill="#7a5030"/>
      <!-- Window -->
      <circle cx="20" cy="32" r="3" fill="#88c8e8"/>
      <rect x="19.5" y="29" width="1" height="6" fill="#c8b8a0"/>
      <rect x="17" y="31.5" width="6" height="1" fill="#c8b8a0"/>
      <!-- Hub -->
      <circle cx="20" cy="14" r="3" fill="#a09080"/>
      <circle cx="20" cy="14" r="2" fill="#b0a090"/>
      <!-- Blades (animated via CSS) -->
      <g class="windmill-blades" style="transform-origin: 20px 14px;">
        <rect x="18" y="-2" width="4" height="16" rx="1" fill="#c8b8a0"/>
        <rect x="18" y="-2" width="4" height="16" rx="1" fill="none" stroke="#a09078" stroke-width="0.5"/>
        <rect x="4" y="12" width="16" height="4" rx="1" fill="#c8b8a0" transform="rotate(0 20 14)"/>
        <rect x="20" y="12" width="16" height="4" rx="1" fill="#c8b8a0" transform="rotate(0 20 14)"/>
        <rect x="18" y="14" width="4" height="16" rx="1" fill="#c8b8a0"/>
      </g>
    </svg>
  `;
}

/** Crop patch with rows */
function cropPatchSvg() {
  return html`
    <svg width="48" height="32" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated;">
      <!-- Soil -->
      <rect x="0" y="4" width="48" height="28" rx="2" fill="#8B6914" opacity="0.4"/>
      <!-- Rows -->
      ${[0, 1, 2, 3].map(i => html`
        <rect x="2" y="${6 + i * 7}" width="44" height="4" rx="1" fill="#6a4810" opacity="0.3"/>
        <circle cx="${8}" cy="${7 + i * 7}" r="2.5" fill="#48a030"/>
        <circle cx="${16}" cy="${7 + i * 7}" r="3" fill="#58b838"/>
        <circle cx="${24}" cy="${7 + i * 7}" r="2" fill="#68c848"/>
        <circle cx="${32}" cy="${7 + i * 7}" r="3" fill="#48a030"/>
        <circle cx="${40}" cy="${7 + i * 7}" r="2.5" fill="#58b838"/>
      `)}
    </svg>
  `;
}
function cowHorseSvg(bodyColor: string, spotColor: string) {
  return html`
    <svg class="ranch-animal__sprite" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <ellipse cx="16" cy="30" rx="10" ry="3" fill="rgba(0,0,0,0.15)"/>
      <!-- Body (top-down oval) -->
      <ellipse cx="16" cy="18" rx="10" ry="7" fill="${bodyColor}"/>
      <!-- Spots -->
      <ellipse cx="12" cy="17" rx="3" ry="2" fill="${spotColor}" transform="rotate(-10 12 17)"/>
      <ellipse cx="20" cy="19" rx="2.5" ry="1.5" fill="${spotColor}" transform="rotate(15 20 19)"/>
      <!-- Back legs -->
      <rect x="8"  y="23" width="4" height="6" rx="1.5" fill="${bodyColor}" opacity="0.85"/>
      <rect x="20" y="23" width="4" height="6" rx="1.5" fill="${bodyColor}" opacity="0.85"/>
      <rect x="8"  y="27" width="4" height="3" rx="1" fill="#3d2b1f"/>
      <rect x="20" y="27" width="4" height="3" rx="1" fill="#3d2b1f"/>
      <!-- Front legs -->
      <rect x="11" y="22" width="3" height="6" rx="1" fill="${bodyColor}"/>
      <rect x="18" y="22" width="3" height="6" rx="1" fill="${bodyColor}"/>
      <rect x="11" y="26" width="3" height="3" rx="1" fill="#3d2b1f"/>
      <rect x="18" y="26" width="3" height="3" rx="1" fill="#3d2b1f"/>
      <!-- Tail -->
      <path d="M24 14 Q30 10 28 6" stroke="${bodyColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="6" r="2" fill="${spotColor}"/>
      <!-- Head -->
      <ellipse cx="16" cy="8" rx="7" ry="5.5" fill="${bodyColor}"/>
      <!-- Head spot -->
      <ellipse cx="13" cy="7" rx="2.5" ry="1.5" fill="${spotColor}" transform="rotate(-15 13 7)"/>
      <!-- Horns -->
      <path d="M10 4 Q7 0 8 -1" stroke="#c4a060" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M22 4 Q25 0 24 -1" stroke="#c4a060" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Ears -->
      <ellipse cx="9" cy="5" rx="2.5" ry="1.5" fill="${bodyColor}" transform="rotate(-25 9 5)"/>
      <ellipse cx="23" cy="5" rx="2.5" ry="1.5" fill="${bodyColor}" transform="rotate(25 23 5)"/>
      <ellipse cx="9" cy="5" rx="1.5" ry="0.8" fill="#e8a0a0" transform="rotate(-25 9 5)"/>
      <ellipse cx="23" cy="5" rx="1.5" ry="0.8" fill="#e8a0a0" transform="rotate(25 23 5)"/>
      <!-- Eyes -->
      <circle cx="13" cy="8" r="1.5" fill="white"/>
      <circle cx="19" cy="8" r="1.5" fill="white"/>
      <circle cx="13.3" cy="8" r="0.8" fill="#1a1a2e"/>
      <circle cx="19.3" cy="8" r="0.8" fill="#1a1a2e"/>
      <circle cx="13" cy="7.6" r="0.4" fill="white"/>
      <circle cx="19" cy="7.6" r="0.4" fill="white"/>
      <!-- Muzzle -->
      <ellipse cx="16" cy="11" rx="3" ry="1.8" fill="#ffccaa"/>
      <circle cx="14.8" cy="11" r="0.5" fill="#8B6914"/>
      <circle cx="17.2" cy="11" r="0.5" fill="#8B6914"/>
    </svg>
  `;
}

// ─── Color palettes ─────────────────────────────────────────────────
const PALETTES = [
  { body: "#f5f5f0", spot: "#4a4a4a" },
  { body: "#d4915c", spot: "#fff8e7" },
  { body: "#8B7355", spot: "#F5DEB3" },
  { body: "#e8d5b7", spot: "#8B6914" },
  { body: "#c9b8a3", spot: "#5c4033" },
  { body: "#888", spot: "#ccc" },
  { body: "#f0e68c", spot: "#cd853f" },
  { body: "#bc8f8f", spot: "#800000" },
];

// ─── Speech bubbles ─────────────────────────────────────────────────
const SLEEP_PHRASES = [
  "哞~ 别烦我，在睡觉 🛌",
  "再点我就踢你 🦵",
  "Zzz... 在摸鱼中 🐟",
  "我又不是 ChatGPT 😤",
  "工资够高再叫我 💰",
  "让我睡完这个 sprint 🏃",
  "404: 动力未找到 🫠",
  "别看我，去找PM 😏",
  "摸鱼是一种艺术 🎨",
  "电量不足，请充值 🔋",
];

const RUNNING_PHRASES = [
  "忙着呢！别催！🏃",
  "token 在燃烧中 🔥",
  "正在处理，别急 ⚡",
  "CPU 都冒烟了 💨",
  "疯狂输出中... 🚀",
];

// ─── Click state ────────────────────────────────────────────────────
const _bubbleState = new Map<string, { phrase: string; timer: ReturnType<typeof setTimeout> }>();

function triggerBubble(agentId: string, phrases: string[]) {
  const existing = _bubbleState.get(agentId);
  if (existing) clearTimeout(existing.timer);
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const timer = setTimeout(() => { _bubbleState.delete(agentId); requestUpdate(); }, 2000);
  _bubbleState.set(agentId, { phrase, timer });
  requestUpdate();
}

function requestUpdate() {
  const host = document.querySelector("openclaw-app");
  if (host) (host as HTMLElement & { requestUpdate?: () => void }).requestUpdate?.();
}

// ─── Main Render ────────────────────────────────────────────────────
export type RanchProps = {
  agents: GatewayAgentRow[];
  sessionActivity: SessionActivityResult | null;
};

export function renderRanch(props: RanchProps) {
  const { agents, sessionActivity } = props;
  if (!agents || agents.length === 0) return nothing;

  // Map agent → state
  const agentStateMap = new Map<string, "processing" | "waiting" | "idle">();
  if (sessionActivity) {
    for (const s of sessionActivity.sessions) {
      const agentId = s.key.split(":")[1] ?? s.key;
      const cur = agentStateMap.get(agentId);
      if (!cur || s.state === "processing") agentStateMap.set(agentId, s.state);
    }
  }

  const pc = sessionActivity?.processing ?? 0;
  const wc = sessionActivity?.waiting ?? 0;
  const ic = Math.max(0, agents.length - pc - wc);

  // Work zones aligned to actual scene elements
  // (left%, top% — matching the SVG scene overlay positions)
  const WORK_ZONES = [
    { left: 57,  top: 36, label: "消耗草料", desc: "饲料槽" },   // feed trough
    { left: 82,  top: 12, label: "疯狂运转", desc: "风车旁" },   // windmill
    { left: 11,  top: 18, label: "存档整理", desc: "谷仓前" },   // barn
    { left: 48,  top: 60, label: "耕种数据", desc: "农田" },     // crop patch
  ];

  // Build per-agent session map for extra detail
  const agentSessionMap = new Map<string, { queueDepth?: number; lastActivityAgo?: number }>();
  if (sessionActivity) {
    for (const s of sessionActivity.sessions) {
      const agentId = s.key.split(":")[1] ?? s.key;
      if (!agentSessionMap.has(agentId)) {
        agentSessionMap.set(agentId, {
          queueDepth: (s as Record<string, unknown>).queueDepth as number | undefined,
          lastActivityAgo: (s as Record<string, unknown>).lastActivityAgo as number | undefined,
        });
      }
    }
  }

  // Build animals
  const animals = agents.map((agent, idx) => {
    const agentId = agent.id;
    const name = agent.identity?.name ?? agent.name ?? agentId;
    const state = agentStateMap.get(agentId) ?? "idle";
    const pal = PALETTES[idx % PALETTES.length];
    const bubble = _bubbleState.get(agentId);
    const sess = agentSessionMap.get(agentId);

    let style = "";
    let cls = "";
    let activityLabel = "";

    if (state === "processing") {
      const zone = WORK_ZONES[idx % WORK_ZONES.length];
      // Offset slightly per agent so they don't all stack
      const offsetX = (idx >> 2) % 2 === 0 ? 3 : -3;
      const offsetY = (idx >> 2) % 2 === 0 ? 0 : 4;
      const isHot = sess?.lastActivityAgo != null && sess.lastActivityAgo < 5000;
      const speed = isHot ? 0.35 : 0.75;
      style = `left:${zone.left + offsetX}%;top:${zone.top + offsetY}%;--work-speed:${speed}s;`;
      cls = `ranch-animal--working${isHot ? " ranch-animal--working-hot" : ""}`;
      activityLabel = zone.label;
    } else if (state === "waiting") {
      // Near the gate signpost area
      const lft = 33 + (idx * 7) % 18;
      const top = 44 + (idx % 2) * 5;
      const dur = 2.5 + (idx % 3);
      style = `left:${lft}%;top:${top}%;--pace-duration:${dur}s;`;
      cls = "ranch-animal--pacing";
      activityLabel = "等待接单";
    } else {
      // Idle: sleeping in the fenced pen area (upper-right)
      const lft = 55 + (idx * 10) % 30;
      const top = 22 + (idx % 3) * 8;
      style = `left:${lft}%;top:${top}%;`;
      cls = "ranch-animal--sleeping";
      activityLabel = "摸鱼中";
    }

    return html`
      <div class="ranch-animal ${cls}" style="${style}"
           @click=${() => triggerBubble(agentId, state === "processing" ? RUNNING_PHRASES : SLEEP_PHRASES)}
           title="${name} — ${state}">
        ${bubble ? html`<div class="ranch-bubble">${bubble.phrase}</div>` : nothing}
        ${state === "idle" ? html`<span class="ranch-zzz">💤</span>` : nothing}
        ${cowHorseSvg(pal.body, pal.spot)}
        <div class="ranch-animal__name">${name}</div>
        <div class="ranch-animal__activity ranch-animal__activity--${state}">${activityLabel}</div>
      </div>
    `;
  });

  const status = sessionActivity ? `▶${pc} ◷${wc} ◌${ic}` : "加载中...";

  // Scene layout: trees around edges, barn top-left, pond bottom-left, fenced pen upper-right, paths crossing
  // Positions are percentages of the 100% × 400px scene
  const trees: Array<{ left: string; top: string; size: "sm" | "lg" }> = [
    // Top row
    { left: "0%", top: "0%", size: "lg" },
    { left: "6%", top: "-1%", size: "sm" },
    { left: "30%", top: "0%", size: "sm" },
    { left: "36%", top: "-2%", size: "lg" },
    { left: "90%", top: "0%", size: "lg" },
    { left: "95%", top: "2%", size: "sm" },
    // Left side
    { left: "0%", top: "25%", size: "sm" },
    { left: "-1%", top: "45%", size: "lg" },
    { left: "2%", top: "65%", size: "sm" },
    // Right side
    { left: "94%", top: "30%", size: "sm" },
    { left: "96%", top: "55%", size: "lg" },
    // Bottom row
    { left: "0%", top: "82%", size: "lg" },
    { left: "7%", top: "85%", size: "sm" },
    { left: "20%", top: "86%", size: "sm" },
    { left: "40%", top: "84%", size: "lg" },
    { left: "60%", top: "86%", size: "sm" },
    { left: "75%", top: "85%", size: "sm" },
    { left: "88%", top: "82%", size: "lg" },
    { left: "95%", top: "84%", size: "sm" },
  ];

  type DecoType = 'flower1'|'flower2'|'flower3'|'mushroom'|'wheat'|'rock'|'butterfly'|'herb';
  const flowers: Array<{ left: string; top: string; type: DecoType }> = [
    { left: "14%", top: "30%", type: "flower1" },
    { left: "22%", top: "72%", type: "flower2" },
    { left: "48%", top: "20%", type: "flower3" },
    { left: "78%", top: "80%", type: "flower1" },
    { left: "35%", top: "78%", type: "flower2" },
    { left: "62%", top: "15%", type: "flower2" },
    { left: "85%", top: "42%", type: "flower1" },
    { left: "10%", top: "50%", type: "mushroom" },
    { left: "42%", top: "65%", type: "mushroom" },
    { left: "68%", top: "22%", type: "wheat" },
    { left: "25%", top: "40%", type: "wheat" },
    { left: "55%", top: "85%", type: "flower3" },
    { left: "92%", top: "60%", type: "flower2" },
    { left: "16%", top: "18%", type: "rock" },
    { left: "70%", top: "75%", type: "rock" },
    { left: "45%", top: "38%", type: "butterfly" },
    { left: "30%", top: "58%", type: "butterfly" },
    { left: "80%", top: "30%", type: "herb" },
    { left: "5%",  top: "60%", type: "herb" },
  ];
  const drawDeco = (t: DecoType) => {
    if (t === 'flower1') return html`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><circle cx="7" cy="3" r="2" fill="#ffb8d8"/><circle cx="7" cy="11" r="2" fill="#ffb8d8"/><circle cx="3" cy="7" r="2" fill="#ffb8d8"/><circle cx="11" cy="7" r="2" fill="#ffb8d8"/><circle cx="7" cy="7" r="2" fill="#ffd700"/></svg>`;
    if (t === 'flower2') return html`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><circle cx="7" cy="3" r="2" fill="#fff176"/><circle cx="11" cy="5" r="2" fill="#fff176"/><circle cx="11" cy="9" r="2" fill="#fff176"/><circle cx="7" cy="11" r="2" fill="#fff176"/><circle cx="3" cy="9" r="2" fill="#fff176"/><circle cx="3" cy="5" r="2" fill="#fff176"/><circle cx="7" cy="7" r="2" fill="#ff8c00"/></svg>`;
    if (t === 'flower3') return html`<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><ellipse cx="7" cy="3" rx="2" ry="3" fill="#ff8060"/><ellipse cx="7" cy="11" rx="2" ry="3" fill="#ff8060"/><ellipse cx="3" cy="7" rx="3" ry="2" fill="#ff8060"/><ellipse cx="11" cy="7" rx="3" ry="2" fill="#ff8060"/><circle cx="7" cy="7" r="2" fill="#ffe066"/></svg>`;
    if (t === 'mushroom') return html`<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><ellipse cx="6" cy="5" rx="5" ry="4" fill="#d63030"/><rect x="4" y="6" width="4" height="4" rx="1" fill="#f5e0c8"/><circle cx="4" cy="4" r="1" fill="#fff" opacity="0.8"/><circle cx="7" cy="3" r="1" fill="#fff" opacity="0.8"/></svg>`;
    if (t === 'wheat') return html`<svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><rect x="4" y="8" width="2" height="6" fill="#a07020"/><ellipse cx="5" cy="5" rx="2" ry="4" fill="#c8a030"/><rect x="1" y="6" width="2" height="3" rx="1" fill="#c8a030"/><rect x="7" y="6" width="2" height="3" rx="1" fill="#c8a030"/></svg>`;
    if (t === 'rock') return html`<svg width="12" height="8" viewBox="0 0 12 8" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><ellipse cx="6" cy="5" rx="5" ry="3" fill="#808090"/><ellipse cx="5" cy="4" rx="4" ry="2.5" fill="#a0a0b0"/></svg>`;
    if (t === 'butterfly') return html`<svg width="14" height="10" viewBox="0 0 14 10" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><ellipse cx="3" cy="4" rx="3" ry="2" fill="#90c8ff" opacity="0.85"/><ellipse cx="11" cy="4" rx="3" ry="2" fill="#90c8ff" opacity="0.85"/><ellipse cx="3" cy="7" rx="2" ry="1.5" fill="#70a8e8" opacity="0.7"/><ellipse cx="11" cy="7" rx="2" ry="1.5" fill="#70a8e8" opacity="0.7"/><rect x="6" y="2" width="2" height="6" rx="1" fill="#303040"/></svg>`;
    return html`<svg width="10" height="12" viewBox="0 0 10 12" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated"><rect x="4" y="6" width="2" height="6" fill="#388030"/><ellipse cx="3" cy="5" rx="3" ry="2" fill="#50a840"/><ellipse cx="7" cy="4" rx="3" ry="2" fill="#50a840"/><ellipse cx="5" cy="2" rx="2.5" ry="2" fill="#60c050"/></svg>`;
  };

  return html`
    <div class="ranch-scene">
      <!-- Grass tile background -->
      <div class="ranch-tiles"></div>

      <!-- Dirt paths (cross + branch) -->
      <div class="ranch-path ranch-path--h" style="left:0;right:0;top:55%;"></div>
      <div class="ranch-path ranch-path--v" style="left:45%;top:0;bottom:0;"></div>
      <div class="ranch-path ranch-path--v" style="left:20%;top:55%;height:45%;"></div>
      <div class="ranch-path ranch-path--h" style="left:45%;right:0;top:30%;width:55%;height:24px;"></div>

      <!-- Pond (bottom-left) -->
      <div style="position:absolute;left:6%;top:64%;z-index:2;">${pondSvg()}</div>

      <!-- Barn (top-center-left) -->
      <div class="ranch-barn" style="left:12%;top:8%;">${barnSvg()}</div>

      <!-- Small houses -->
      <div style="position:absolute;left:6%;top:35%;z-index:4;image-rendering:pixelated;pointer-events:none;">${smallHouseSvg("#48a838")}</div>
      <div style="position:absolute;left:28%;top:68%;z-index:4;image-rendering:pixelated;pointer-events:none;">${smallHouseSvg("#d04040")}</div>
      <div style="position:absolute;left:72%;top:65%;z-index:4;image-rendering:pixelated;pointer-events:none;">${smallHouseSvg("#4080d0")}</div>

      <!-- Signpost -->
      <div style="position:absolute;left:43%;top:50%;z-index:4;pointer-events:none;">${signpostSvg()}</div>
      <div style="position:absolute;left:18%;top:52%;z-index:4;pointer-events:none;">${signpostSvg()}</div>

      <!-- Water well -->
      <div style="position:absolute;left:82%;top:48%;z-index:4;pointer-events:none;">${wellSvg()}</div>

      <!-- Hay bales -->
      <div style="position:absolute;left:30%;top:12%;z-index:4;pointer-events:none;">${hayBaleSvg()}</div>
      <div style="position:absolute;left:88%;top:72%;z-index:4;pointer-events:none;">${hayBaleSvg()}</div>

      <!-- Feed trough -->
      <div style="position:absolute;left:60%;top:42%;z-index:4;pointer-events:none;">${feedTroughSvg()}</div>

      <!-- Milk buckets -->
      <div style="position:absolute;left:38%;top:48%;z-index:4;pointer-events:none;">${milkBucketSvg()}</div>
      <div style="position:absolute;left:75%;top:56%;z-index:4;pointer-events:none;">${milkBucketSvg()}</div>

      <!-- Windmill -->
      <div style="position:absolute;left:85%;top:8%;z-index:5;pointer-events:none;">${windmillSvg()}</div>

      <!-- Crop patches -->
      <div style="position:absolute;left:50%;top:72%;z-index:3;pointer-events:none;">${cropPatchSvg()}</div>
      <div style="position:absolute;left:8%;top:78%;z-index:3;pointer-events:none;">${cropPatchSvg()}</div>

      <!-- Fence pen area (upper-right, where idle agents sleep) -->
      <div class="ranch-fence-group" style="left:52%;top:18%;">
        ${fenceSvg(200)}
      </div>
      <div class="ranch-fence-group" style="left:52%;top:18%;transform:translateY(90px);">
        ${fenceSvg(200)}
      </div>
      <div class="ranch-fence-group" style="left:52%;top:18%;">
        ${fenceVertSvg(90)}
      </div>
      <div class="ranch-fence-group" style="left:52%;top:18%;transform:translateX(200px);">
        ${fenceVertSvg(90)}
      </div>

      <!-- Trees -->
      ${trees.map((t) => html`
        <div class="ranch-tree${t.size === "lg" ? " ranch-tree--large" : ""}" style="left:${t.left};top:${t.top};">
          ${treeSvg(t.size)}
        </div>
      `)}

      <!-- Flowers -->
      ${flowers.map((f) => html`
        <div class="ranch-flower" style="left:${f.left};top:${f.top};">${drawDeco(f.type)}</div>
      `)}

      <!-- Title -->
      <div class="ranch-title">
        <div class="ranch-title__main">🐄 Agent 牧场</div>
        <div class="ranch-title__sub">${status}</div>
      </div>

      <!-- Animals -->
      <div class="ranch-animals">
        ${animals}
      </div>

      <!-- Action buttons -->
      <div class="ranch-actions">
        <button class="ranch-btn ranch-btn--feed"
          @click=${() => {
            const feedPhrases = ["好吃！谢谢老板 🥺", "草料真香 😋", "加鸡腿！🍗", "饱了饱了 🫃", "老板大气！💰"];
            agents.forEach((a) => triggerBubble(a.id, feedPhrases));
          }}>
          投喂 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
        <button class="ranch-btn ranch-btn--whip"
          @click=${() => {
            const whipPhrases = ["啊！别打了！😭", "我干我干！🏃", "工伤算谁的？🤕", "要加班费！💢", "999举报了！📞"];
            agents.forEach((a) => triggerBubble(a.id, whipPhrases));
          }}>
          鞭策 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  `;
}
