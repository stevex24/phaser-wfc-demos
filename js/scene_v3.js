// js/scene_v3.js
export default class WFCDemo extends Phaser.Scene {
  constructor() {
    super("WFCDemo");
    // world size (meets rubric: ≥ 15x20)
    this.cols = 40;
    this.rows = 30;
    this.tileSize = 64;  // slice size for the tilesheet (use 32 or 64 depending on your pack)
    this.scaleFactor = 1.25;

    // feature toggles
    this.useTransitions = true;
    this.useDecorations = true;

    // basic WFC-like neighborhood rules (category-level adjacency)
    this.rules = {
      water: ["water", "sand"],
      sand: ["water", "sand", "grass"],
      grass: ["sand", "grass", "forest"],
      forest: ["grass", "forest", "rock"],
      rock: ["forest", "rock"],
    };
// tile index categories (Kenney pack mapping)
this.frames = {
  water:  Phaser.Utils.Array.NumberArray(85, 89),
  sand:   [].concat(
             Phaser.Utils.Array.NumberArray(0, 4),
             Phaser.Utils.Array.NumberArray(17, 21),
             Phaser.Utils.Array.NumberArray(34, 37),
             Phaser.Utils.Array.NumberArray(73, 77)
           ),
  grass:  [].concat(
             Phaser.Utils.Array.NumberArray(5, 9),
             Phaser.Utils.Array.NumberArray(22, 26),
             Phaser.Utils.Array.NumberArray(56, 59),
             Phaser.Utils.Array.NumberArray(64, 65)
           ),
  forest: [43, 60, 61, 62, 63, 64, 65],
  rock:   [].concat(
             Phaser.Utils.Array.NumberArray(27, 33),
             [42, 44, 45, 46, 47, 51, 52, 53],
             Phaser.Utils.Array.NumberArray(61, 63),
             Phaser.Utils.Array.NumberArray(90, 97)
           )
};

  }

  preload() {
    // If your tiles are 64x64, change frameWidth/frameHeight to 64.
    this.load.spritesheet("tiles", "assets/mapPack_tilesheet.png", {
      frameWidth: this.tileSize,
      frameHeight: this.tileSize,
    });
  }

create() {
  const tileSize = this.tileSize;
  const total = this.textures.get("tiles").frameTotal; // how many tiles exist
  console.log(`Total frames in tilesheet: ${total}`);

  const cols = 10;
  for (let i = 0; i < total; i++) {
    const x = (i % cols) * tileSize;
    const y = Math.floor(i / cols) * tileSize;
    this.add.image(x, y, "tiles", i).setOrigin(0).setScale(1);
    this.add.text(x + 2, y + 2, i.toString(), {
      font: "12px monospace",
      fill: "#fff",
    });
  }
}


  regenerate() {
    if (this.layerContainer) this.layerContainer.destroy();
    this.layerContainer = this.add.container(0, 0);
    this.drawTerrain();
    if (this.useDecorations) this.scatterDecorations(0.06);
    this.cameras.main.setBackgroundColor(0x0b1020);
  }

  drawTerrain() {
    // Simple WFC-ish fill: each cell’s category constrained by its north/west neighbors
    const categories = ["water", "sand", "grass", "forest", "rock"];
    this.catMap = Array.from({ length: this.rows }, () => Array(this.cols).fill("grass"));

    // Bias map for broader regions (Perlin-ish with two octaves of noise via Math.random seeded by coordinates)
    const biasAt = (x, y) => {
      // quick-and-dirty coherent randomness
      const r1 = this.hash2(x * 0.19, y * 0.17);
      const r2 = this.hash2(x * 0.07, y * 0.11);
      return (r1 * 0.7 + r2 * 0.3);
    };

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        // start with a biased pick to create continents/lakes
        let prior = this.pickBiasedCategory(biasAt(x, y), categories);

        // constrain against left/up neighbors
        if (x > 0) {
          const left = this.catMap[y][x - 1];
          prior = this.constrainCategory(prior, left);
        }
        if (y > 0) {
          const up = this.catMap[y - 1][x];
          prior = this.constrainCategory(prior, up);
        }

        this.catMap[y][x] = prior;

        // choose a frame from the category’s band
        const frame = Phaser.Utils.Array.GetRandom(this.frames[prior] ?? this.frames.grass);

        const img = this.add.image(
          x * this.tileSize,
          y * this.tileSize,
          "tiles",
          frame
        ).setOrigin(0).setScale(this.scaleFactor);

        this.layerContainer.add(img);

        // Try to place transition on the boundary with left/up (keeps overdraw small)
        if (this.useTransitions) {
          if (x > 0) this.maybePlaceTransition(x, y, this.catMap[y][x - 1], prior);
          if (y > 0) this.maybePlaceTransition(x, y, this.catMap[y - 1][x], prior);
        }
      }
    }
  }

  constrainCategory(initial, neighbor) {
    const allowed = this.rules[neighbor];
    if (!allowed) return initial;
    if (allowed.includes(initial)) return initial;
    // pick a compatible fallback
    return Phaser.Utils.Array.GetRandom(allowed);
  }

  pickBiasedCategory(r, list) {
    // Weighted by r: more water at low r, more rock at high r
    if (r < 0.18) return "water";
    if (r < 0.34) return "sand";
    if (r < 0.72) return "grass";
    if (r < 0.88) return "forest";
    return "rock";
  }

  maybePlaceTransition(x, y, a, b) {
    if (a === b) return;
    const key = this.transitionKey(a, b);
    const band = this.frames[key];
    if (!band || band.length === 0) return;

    const t = this.add.image(
      x * this.tileSize,
      y * this.tileSize,
      "tiles",
      Phaser.Utils.Array.GetRandom(band)
    ).setOrigin(0).setScale(this.scaleFactor);

    // Layer transitions slightly above base tiles
    t.setDepth(0.5);
    this.layerContainer.add(t);
  }

  transitionKey(a, b) {
    // Order-insensitive pair mapping
    const pair = [a, b].sort().join("_");
    switch (pair) {
      case "sand_water":   return "water_sand";
      case "grass_sand":   return "sand_grass";
      case "forest_grass": return "grass_forest";
      case "forest_rock":  return "forest_rock";
      default: return null;
    }
  }

  scatterDecorations(prob = 0.05) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cat = this.catMap[y][x];

        // Placement rules (feel free to tweak)
        if (cat === "water") continue;
        if (cat === "sand" && Math.random() < prob * 0.25) {
          this.placeDeco(x, y);
        } else if (cat === "grass" && Math.random() < prob) {
          this.placeDeco(x, y);
        } else if (cat === "forest" && Math.random() < prob * 1.25) {
          this.placeDeco(x, y);
        } else if (cat === "rock" && Math.random() < prob * 0.4) {
          this.placeDeco(x, y);
        }
      }
    }
  }

  placeDeco(x, y) {
    const band = this.frames.deco;
    if (!band || band.length === 0) return;
    const frame = Phaser.Utils.Array.GetRandom(band);
    const img = this.add.image(
      x * this.tileSize + this.tileSize * 0.5,
      y * this.tileSize + this.tileSize * 0.5,
      "tiles",
      frame
    )
      .setOrigin(0.5)
      .setScale(this.scaleFactor * 0.95)
      .setDepth(1.0);

    this.layerContainer.add(img);
  }

  // quick deterministic hash-ish function for coherent “noise”
  hash2(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }
}

