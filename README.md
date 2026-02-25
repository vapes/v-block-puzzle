# Block Puzzle

A sleek, addictive block puzzle game built with PixiJS and TypeScript. Drag and drop colorful pieces onto the grid, complete rows and columns to clear them, and chase your high score.

### [Play Now](https://vapes.github.io/v-block-puzzle/)

---

![Block Puzzle](https://img.shields.io/badge/game-block%20puzzle-e94560?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PixiJS](https://img.shields.io/badge/PixiJS-ff5733?style=for-the-badge)

## How to Play

1. **Drag** a piece from the tray at the bottom
2. **Drop** it onto the 8x8 grid
3. **Clear** complete rows or columns to score points
4. **Chain** consecutive clears to build combos and multiply your score
5. The game ends when no remaining pieces can fit on the board

## Features

- **8x8 grid** with smooth drag-and-drop controls
- **22 unique block shapes** — lines, squares, L-shapes, T-shapes, S/Z-shapes, corners, and more
- **Combo system** — chain consecutive line clears for multiplied points
- **Ghost preview** — see exactly where your piece will land before you drop it
- **Clear animations** — satisfying visual feedback when rows and columns are completed
- **Persistent high score** — saved locally in your browser
- **Fully responsive** — works on desktop and mobile with touch support

## Tech Stack

| | |
|---|---|
| **Renderer** | [PixiJS](https://pixijs.com/) 7 |
| **Language** | TypeScript |
| **Bundler** | Vite |
| **Deployment** | GitHub Pages via Actions |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  main.ts        — App entry point and game loop
  gameState.ts   — Core game logic (grid, scoring, combos)
  renderer.ts    — PixiJS rendering and animations
  input.ts       — Mouse and touch input handling
  layout.ts      — Responsive layout calculations
  constants.ts   — Grid size, shapes, colors, timing
  types.ts       — TypeScript type definitions
```

## License

ISC
