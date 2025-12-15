export function buildHeightMap(cols, rows, hash2) {
  const W = cols, H = rows;
  const hm = Array.from({ length: H }, () => Array(W).fill(0));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const slope = (x + y) * 0.3; // diagonal climb
      const noise = hash2(x * 0.12, y * 0.17) * 2.0;
      hm[y][x] = slope + noise;
    }
  }

  // wrap edges to create the illusion of endless ascent
  const wrap = 6.0;
  for (let x = 0; x < W; x++) hm[0][x] = hm[H - 1][x] + wrap;
  for (let y = 0; y < H; y++) hm[y][0] = hm[y][W - 1] + wrap;

  return hm;
}

