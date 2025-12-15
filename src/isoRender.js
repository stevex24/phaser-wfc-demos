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

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cat = scene.catMap[y][x];
      const base = scene.palette[cat];

      const topCol   = scene.shade(base, +0.1);
      const leftCol  = scene.shade(base, -0.1);
      const rightCol = scene.shade(base, -0.2);

      let cx = isoX(x, y);
      let cy = isoY(x, y);

      let lift = useEscher ? scene.heightMap[y][x] : 0;
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

