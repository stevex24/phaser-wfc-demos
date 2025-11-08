import WFCDemo from "./scene_v4.js";

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  backgroundColor: "#000000",
  pixelArt: true,
  scene: WFCDemo,
};

const game = new Phaser.Game(config);

