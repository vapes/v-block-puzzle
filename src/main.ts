import * as PIXI from 'pixi.js';
import { GameState } from './gameState';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { computeLayout } from './layout';
import { Piece, GridPosition } from './types';

function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  const app = new PIXI.Application({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  const state = new GameState();
  const renderer = new Renderer(app);
  let layout = computeLayout(window.innerWidth, window.innerHeight);

  renderer.init(layout);
  renderer.updateGrid(state);
  renderer.updateScore(state);
  renderer.renderTray(state);

  function onPlace(piece: Piece, pos: GridPosition, _trayIndex: number): void {
    const { cleared, linesCleared } = state.placePiece(piece, pos);
    state.removePieceFromTray(piece.id);

    renderer.updateGrid(state);
    renderer.updateScore(state);
    renderer.renderTray(state);

    if (cleared.length > 0) {
      renderer.animateClear(cleared);
      renderer.showCombo(state.combo, linesCleared);
    }

    if (state.checkGameOver()) {
      setTimeout(() => {
        renderer.showGameOver(true);
      }, 400);
    }
  }

  function onRestart(): void {
    state.reset();
    renderer.showGameOver(false);
    renderer.updateGrid(state);
    renderer.updateScore(state);
    renderer.renderTray(state);
  }

  const input = new InputHandler(renderer, state, onPlace, onRestart);
  input.init(layout);

  // Main loop
  app.ticker.add((dt: number) => {
    renderer.updateClearAnimations();
    renderer.updateComboAnimation(dt);
  });

  // Handle resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    app.renderer.resize(w, h);
    layout = computeLayout(w, h);
    renderer.init(layout);
    renderer.updateGrid(state);
    renderer.updateScore(state);
    renderer.renderTray(state);
    input.updateLayout(layout);
    if (state.gameOver) {
      renderer.showGameOver(true);
    }
  });
}

main();
