export default class WaveFunctionCollapse {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = ['water', 'land'];
  }

  generate() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const tile = Math.random() < 0.5 ? 'water' : 'land';
        row.push(tile);
      }
      grid.push(row);
    }
    return grid;
  }
}
window.WaveFunctionCollapse = WaveFunctionCollapse;


