export function shade(hex, delta) {
  const c = Phaser.Display.Color.IntegerToColor(hex);
  let hsv = Phaser.Display.Color.RGBToHSV(c.red, c.green, c.blue);
  hsv.v = Phaser.Math.Clamp(hsv.v + delta, 0, 1);
  const rgb = Phaser.Display.Color.HSVToRGB(hsv.h, hsv.s, hsv.v);
  return Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b);
}

export function hash2(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

