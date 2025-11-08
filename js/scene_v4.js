// js/scene_v4.js
export default class WFCDemo extends Phaser.Scene {
  constructor() {
    super("WFCDemo");
    this.cols = 40;
    this.rows = 30;
    this.tileSize = 64;
    this.scaleFactor = 1.0;
    this.useDecorations = true;

    // Terrain adjacency rules
    this.rules = {
      water: ["water", "sand"],
      sand: ["water", "sand", "grass"],
      grass: ["sand", "grass", "forest"],
      forest: ["grass", "forest", "rock"],
      rock: ["forest", "rock"],
    };

    // Weighting probabilities (bias continuity)
    this.weights = {
      water: 2,
      sand: 1,
      grass: 3,
      forest: 2,
      rock: 2,
    };
  }

  preload() {
    // Kenny tileset
    this.load.spritesheet("tiles", "assets/mapPack_tilesheet.png", {
      frameWidth: this.tileSize,
      frameHeight: this.tileSize,
    });
  }

  create() {
    this.generateMap();

    this.input.keyboard.on("keydown-R", () => {
      this.children.removeAll();
      this.generateMap();
    });

    this.input.keyboard.on("keydown-D", () => {
      this.useDecorations = !this.useDecorations;
      this.children.removeAll();
      this.generateMap();
    });
  }

  // Category color mapping for debug fallback
  getColorFor(type) {
    return {
      water: 0x4060ff,
      sand: 0xf7d87b,
      grass: 0x33aa33,
      forest: 0x1b5e20,
      rock: 0x888888,
    }[type];
  }

  pickNext(current) {
    const options = this.rules[current];
    const weighted = [];
    options.forEach(opt => {
      const weight = this.weights[opt] || 1;
      for (let i = 0; i < weight; i++) weighted.push(opt);
    });
    return Phaser.Utils.Array.GetRandom(weighted);
  }

  generateMap() {
    const grid = [];

    // Initial seed row
    for (let x = 0; x < this.cols; x++) {
      grid[x] = [];
      const first = Phaser.Utils.Array.GetRandom(Object.keys(this.rules));
      grid[x][0] = first;
    }

    // WFC-like propagation
    for (let y = 1; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const top = grid[x][y - 1];
        const left = x > 0 ? grid[x - 1][y] : top;
        const candidates = [...new Set([...this.rules[top], ...this.rules[left]])];
        const weighted = [];
        candidates.forEach(opt => {
          const weight = this.weights[opt] || 1;
          for (let i = 0; i < weight; i++) weighted.push(opt);
        });
        grid[x][y] = Phaser.Utils.Array.GetRandom(weighted);
      }
    }

    // Draw tiles
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const type = grid[x][y];
        const frame = this.pickFrameForType(type, x, y, grid);
        this.add
          .image(x * this.tileSize, y * this.tileSize, "tiles", frame)
          .setOrigin(0)
          .setScale(this.scaleFactor);
      }
    }

    if (this.useDecorations) this.addDecorations(grid);
  }

  pickFrameForType(type, x, y, grid) {
    // crude but functional frame mapping by type
    switch (type) {
      case "water":
        return 85; // blue wave-like tile
      case "sand":
        return 3; // beige dune
      case "grass":
        return 5; // green field
      case "forest":
        return 43; // tree
      case "rock":
        return 47; // stone
      default:
        return 15;
    }
  }

  addDecorations(grid) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const type = grid[x][y];
        if (Math.random() < 0.1) {
          let decoFrame = null;
          if (type === "grass") decoFrame = 59; // leaf
          else if (type === "forest") decoFrame = 60; // fern
          else if (type === "sand") decoFrame = 38; // cactus
          else if (type === "rock") decoFrame = 47; // stone
          if (decoFrame)
            this.add
              .image(x * this.tileSize, y * this.tileSize, "tiles", decoFrame)
              .setOrigin(0)
              .setScale(this.scaleFactor);
        }
      }
    }
  }
}

