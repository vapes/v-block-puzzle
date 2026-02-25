// Grid
export const GRID_SIZE = 8;
export const GRID_PADDING = 16;

// Colors - vibrant palette
export const COLORS = {
  background: 0x1a1a2e,
  gridBg: 0x16213e,
  cellEmpty: 0x0f3460,
  cellBorder: 0x1a4a7a,
  highlight: 0x00ff88,
  highlightInvalid: 0xff4444,
  text: 0xffffff,
  textSecondary: 0xaaaacc,
  scorePanel: 0x16213e,
  trayBg: 0x0d1b33,
  comboText: 0xffdd44,
  gameOverOverlay: 0x000000,
};

// Block piece colors (must not match any field/board colors)
export const PIECE_COLORS = [
  0xe94560, // red
  0x0984e3, // blue
  0x533483, // purple
  0xf5a623, // orange
  0x44bd32, // green
  0x00b4d8, // cyan
  0xe17055, // coral
  0x6c5ce7, // indigo
];

// Shapes: each shape is an array of [row, col] offsets
export const SHAPES: number[][][] = [
  // Single dot
  [[0, 0]],
  // 2-horizontal
  [[0, 0], [0, 1]],
  // 3-horizontal
  [[0, 0], [0, 1], [0, 2]],
  // 4-horizontal
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  // 5-horizontal
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  // 2-vertical
  [[0, 0], [1, 0]],
  // 3-vertical
  [[0, 0], [1, 0], [2, 0]],
  // 4-vertical
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  // 5-vertical
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  // L-shape
  [[0, 0], [1, 0], [1, 1]],
  // Reverse L
  [[0, 0], [0, 1], [1, 0]],
  // L bottom-right
  [[0, 0], [0, 1], [1, 1]],
  // L top-right
  [[0, 1], [1, 0], [1, 1]],
  // T-shape
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  // Square 2x2
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  // Square 3x3
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  // S-shape
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  // Z-shape
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  // Big L
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  // Big reverse L
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  // Corner 3x3
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  // Plus/cross
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
];

export const TRAY_SLOTS = 3;

// Animation
export const CLEAR_ANIM_DURATION = 300;
export const DROP_ANIM_DURATION = 150;
