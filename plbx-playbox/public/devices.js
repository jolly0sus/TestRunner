// Device presets. Sizes are CSS *logical* pixels in portrait (width x height);
// landscape swaps them. `camera` picks the punch-hole/notch style for the bezel.
window.PLAYBOX_DEVICES = [
  { id: 's23ultra', name: 'Samsung Galaxy S23 Ultra', w: 384, h: 824, camera: 'punch' },
  { id: 's23',      name: 'Samsung Galaxy S23',       w: 360, h: 780, camera: 'punch' },
  { id: 'pixel8',   name: 'Google Pixel 8',           w: 412, h: 915, camera: 'punch' },
  { id: 'pixel7',   name: 'Google Pixel 7',           w: 412, h: 915, camera: 'punch' },
  { id: 'iphone15promax', name: 'iPhone 15 Pro Max',  w: 430, h: 932, camera: 'island' },
  { id: 'iphone15', name: 'iPhone 15',                w: 393, h: 852, camera: 'island' },
  { id: 'iphone14', name: 'iPhone 14',                w: 390, h: 844, camera: 'notch' },
  { id: 'iphonese', name: 'iPhone SE',                w: 375, h: 667, camera: 'none' },
  { id: 'ipadmini', name: 'iPad Mini',                w: 744, h: 1133, camera: 'none' },
  { id: 'ipadpro11', name: 'iPad Pro 11"',            w: 834, h: 1194, camera: 'none' },
];
