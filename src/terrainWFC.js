export function solveCategories(cols, rows, rules, pickCategoryFn) {
  const W = cols, H = rows;
  const out = Array.from({ length: H }, () => Array(W).fill("grass"));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = pickCategoryFn(x, y);

      if (x > 0) c = constrain(c, out[y][x - 1], rules);
      if (y > 0) c = constrain(c, out[y - 1][x], rules);

      out[y][x] = c;
    }
  }
  return out;
}

export function pickCategory(x, y, hash2) {
  const r = hash2(x * 0.15, y * 0.12);
  if (r < 0.15) return "water";
  if (r < 0.3)  return "sand";
  if (r < 0.7)  return "grass";
  if (r < 0.88) return "forest";
  return "rock";
}

export function constrain(chosen, neighbor, rules) {
  const allowed = rules[neighbor];
  if (!allowed) return chosen;
  if (allowed.includes(chosen)) return chosen;
  return Phaser.Utils.Array.GetRandom(allowed);
}

