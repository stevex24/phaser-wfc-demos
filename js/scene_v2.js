import WaveFunctionCollapse from './wfc.js';

export default class WFCDemo extends Phaser.Scene {
  constructor() {
    super('WFCDemo');
    this.tileSize = 32;
    this.mapWidth = 20;
    this.mapHeight = 15;
  }

  preload() {
    this.load.spritesheet('kenney_tiles', 'assets/mapPack_tilesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.adjacency = {
      water: ['water', 'sand'],
      sand: ['water', 'sand', 'grass'],
      grass: ['sand', 'grass', 'forest'],
      forest: ['grass', 'forest', 'rock'],
      rock: ['forest', 'rock'],
    };

    this.terrainFrames = {
      water: [0, 1, 2, 3],
      sand: [10, 11, 12, 13],
      grass: [20, 21, 22, 23],
      forest: [30, 31, 32, 33],
      rock: [40, 41, 42, 43],
    };

    this.generateMap();

    this.input.keyboard.on('keydown-R', () => {
      this.children.removeAll();
      this.generateMap();
    });
  }

  generateMap() {
    const terrainTypes = Object.keys(this.adjacency);
    const map = [];

    for (let y = 0; y < this.mapHeight; y++) {
      map[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        let possible = terrainTypes;

        // constrain by neighbors
        if (x > 0) {
          const left = map[y][x - 1];
          possible = possible.filter(t => this.adjacency[left].includes(t));
        }
        if (y > 0) {
          const above = map[y - 1][x];
          possible = possible.filter(t => this.adjacency[above].includes(t));
        }

        const chosen = Phaser.Utils.Array.GetRandom(possible);
        map[y][x] = chosen;

        const frameList = this.terrainFrames[chosen];
        const frame = Phaser.Utils.Array.GetRandom(frameList);

        const tile = this.add.image(
          x * this.tileSize,
          y * this.tileSize,
          'kenney_tiles',
          frame
        );
        tile.setOrigin(0);
      }
    }

    this.add.text(10, 10, 'Press R to regenerate', {
      font: '16px Arial',
      fill: '#ffffff',
    });
  }
}

