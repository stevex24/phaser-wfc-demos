import { PALETTES } from "./palettes.js";
import { solveCategories, pickCategory } from "./terrainWFC.js";
import { buildHeightMap } from "./heightMap.js";
import { renderWorld } from "./isoRender.js";
import { shade, hash2 } from "./util.js";

export class IllusionWorld extends Phaser.Scene {
  constructor() {
    super("IllusionWorld");
  }

  create() {
    // --- Core map dimensions ---
    this.cols = 28;
    this.rows = 18;
    this.isoW = 40;
    this.isoH = 20;
    this.blockZ = 12;

    // --- Modes ---
    this.modes = ["iso", "escher"];
    this.modeIndex = 0;
    this.mode = this.modes[this.modeIndex];

    // --- Terrain categories & adjacency rules ---
    this.cats = ["water","sand","grass","forest","rock"];
    this.rules = {
      water:  ["water","sand"],
      sand:   ["water","sand","grass"],
      grass:  ["sand","grass","forest"],
      forest: ["grass","forest","rock"],
      rock:   ["forest","rock"]
    };

    // --- Palettes ---
    this.palettes = PALETTES;
    this.paletteIndex = 0;
    this.palette = { ...this.palettes[0].colors };

    // --- Graphics ---
    this.g = this.add.graphics();

    // --- HUD ---
    this.hudGeom = document.getElementById("geomMode");
    this.hudPal  = document.getElementById("palName");
    this.hudGeom.textContent = "Isometric";
    this.hudPal.textContent  = this.palettes[0].name;

    // --- Buttons & hotkeys ---
    document.getElementById("regenBtn").onclick = () => this.regenerate();
    document.getElementById("geomBtn").onclick  = () => this.toggleMode();
    document.getElementById("aiBtn").onclick    = () => this.aiMutate();
    document.getElementById("palBtn").onclick   = () => this.cyclePalette();

    this.input.keyboard.on("keydown-R", () => this.regenerate());
    this.input.keyboard.on("keydown-G", () => this.toggleMode());
    this.input.keyboard.on("keydown-A", () => this.aiMutate());
    this.input.keyboard.on("keydown-P", () => this.cyclePalette());

    this.regenerate();
  }

  regenerate() {
    this.catMap = solveCategories(
      this.cols,
      this.rows,
      this.rules,
      (x, y) => pickCategory(x, y, hash2)
    );

    this.heightMap = buildHeightMap(this.cols, this.rows, hash2);
    renderWorld(this);
  }

  aiMutate() {
    const jitter = () => Phaser.Math.FloatBetween(-0.10, 0.10);
    const mutateColor = (hex) => {
      const c = Phaser.Display.Color.IntegerToColor(hex);
      let hsv = Phaser.Display.Color.RGBToHSV(c.red, c.green, c.blue);
      hsv.h = (hsv.h + jitter() + 1.0) % 1.0;
      hsv.s = Phaser.Math.Clamp(hsv.s + jitter() * 0.5, 0.3, 1.0);
      hsv.v = Phaser.Math.Clamp(hsv.v + jitter() * 0.4, 0.4, 1.0);
      const rgb = Phaser.Display.Color.HSVToRGB(hsv.h, hsv.s, hsv.v);
      return Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b);
    };

    for (const k of Object.keys(this.palette)) {
      this.palette[k] = mutateColor(this.palette[k]);
    }

    renderWorld(this);
  }

  cyclePalette() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.palette = { ...this.palettes[this.paletteIndex].colors };
    document.getElementById("palName").textContent = this.palettes[this.paletteIndex].name;
    renderWorld(this);
  }

  toggleMode() {
    this.modeIndex = (this.modeIndex + 1) % this.modes.length;
    this.mode = this.modes[this.modeIndex];
    document.getElementById("geomMode").textContent =
      (this.mode === "iso") ? "Isometric" : "Escher";
    renderWorld(this);
  }

  // expose utilities for renderer compatibility
  shade(hex, delta) {
    return shade(hex, delta);
  }
}

