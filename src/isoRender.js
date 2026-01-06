function clamp255(x) { return x < 0 ? 0 : (x > 255 ? 255 : x); }

// Render-time only: returns a new color int; does NOT mutate palettes/stored colors.
function applyBreathingRGB(color, breathe) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;

  const rr = clamp255(Math.round(r * breathe));
  const gg = clamp255(Math.round(g * breathe));
  const bb = clamp255(Math.round(b * breathe));

  return (rr << 16) | (gg << 8) | bb;
}

export function renderWorld(scene) {
  scene.g.clear();
  const useEscher = (scene.mode === "escher");
  drawIso(scene, useEscher);
}

export function drawIso(scene, useEscher) {
  const g = scene.g;
  const W = scene.cols;
  const H = scene.rows;
  const isoW = scene.isoW;
  const isoH = scene.isoH;
  const Z = scene.blockZ;

  const cx0 = scene.scale.gameSize.width / 2;
  const cy0 = 100;

  const isoX = (x, y) => cx0 + (x - y) * (isoW / 2);
  const isoY = (x, y) => cy0 + (x + y) * (isoH / 2);

  // Step 4D: extremely subtle palette breathing (2% amp, slow)
  const tSec = (scene.time?.now ?? 0) / 1000; // seconds; uses existing Phaser clock if present
  const amp = 0.02;                           // 2%
  const period = 16.0;                        // seconds
  const breathe = 1.0 + amp * Math.sin((2 * Math.PI * tSec) / period);


  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cat = scene.catMap[y][x];
      const base = scene.palette[cat];

      const topCol0   = scene.shade(base, +0.1);
      const leftCol0  = scene.shade(base, -0.1);
      const rightCol0 = scene.shade(base, -0.2);

      const topCol   = applyBreathingRGB(topCol0, breathe);
      const leftCol  = applyBreathingRGB(leftCol0, breathe);
      const rightCol = applyBreathingRGB(rightCol0, breathe);

      let cx = isoX(x, y);
      let cy = isoY(x, y);

      let lift = useEscher ? scene.heightMap[y][x] : 0;

      if (useEscher) {
        // Step 4C: extremely subtle Escher-only height shimmer (±1–2 px)
        const t = (scene.time?.now ?? 0) / 1000; // seconds; safe if time plugin exists
        const phase = x * 0.73 + y * 1.31;      // deterministic per-tile phase
        lift += 1.5 * Math.sin(t * 1.0 + phase);
      }

      cy -= lift;

      // --- top face ---
      g.fillStyle(topCol, 1);
      g.beginPath();
      g.moveTo(cx, cy - isoH / 2);
      g.lineTo(cx + isoW / 2, cy);
      g.lineTo(cx, cy + isoH / 2);
      g.lineTo(cx - isoW / 2, cy);
      g.closePath();
      g.fillPath();

      // --- left face ---
      g.fillStyle(leftCol, 1);
      g.beginPath();
      g.moveTo(cx - isoW / 2, cy);
      g.lineTo(cx, cy + isoH / 2);
      g.lineTo(cx, cy + isoH / 2 + Z);
      g.lineTo(cx - isoW / 2, cy + Z);
      g.closePath();
      g.fillPath();

      // --- right face ---
      g.fillStyle(rightCol, 1);
      g.beginPath();
      g.moveTo(cx + isoW / 2, cy);
      g.lineTo(cx, cy + isoH / 2);
      g.lineTo(cx, cy + isoH / 2 + Z);
      g.lineTo(cx + isoW / 2, cy + Z);
      g.closePath();
      g.fillPath();
    }
  }
}

