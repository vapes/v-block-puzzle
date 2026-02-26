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
  let pendingGameOver = false;

  renderer.init(layout);
  renderer.updateGrid(state);
  renderer.updateScore(state);
  renderer.renderTray(state);
  renderer.updateBombDisplay(state);

  function onPlace(piece: Piece, pos: GridPosition, _trayIndex: number): void {
    const { cleared, linesCleared } = state.placePiece(piece, pos);
    state.removePieceFromTray(piece.id);

    // Check bomb milestones
    const bombsEarned = state.checkBombMilestone();

    renderer.updateGrid(state);
    renderer.updateScore(state);
    renderer.renderTray(state);
    renderer.updateBombDisplay(state);

    if (bombsEarned > 0) {
      renderer.showBombEarnedAnim();
    }

    if (cleared.length > 0) {
      renderer.animateClear(cleared);
      renderer.showCombo(state.combo, linesCleared);
    }

    if (!state.canAnyPieceBePlaced()) {
      if (state.bombCount > 0) {
        pendingGameOver = true;
        renderer.setBombPulse(true);
      } else {
        state.gameOver = true;
        setTimeout(() => {
          renderer.showGameOver(true);
        }, 400);
      }
    }
  }

  function onBomb(): void {
    if (state.bombCount <= 0 || renderer.isBombAnimating()) return;

    const cleared = state.useBomb();
    renderer.updateBombDisplay(state);
    renderer.setBombPulse(false);

    if (cleared.length === 0) {
      // Grid was already empty, just update
      if (pendingGameOver) {
        pendingGameOver = false;
      }
      return;
    }

    renderer.animateBombClear(cleared, () => {
      renderer.updateGrid(state);
      renderer.updateScore(state);

      if (pendingGameOver) {
        pendingGameOver = false;
        // Grid is now empty, game continues
      }
    });
  }

  function onRestart(): void {
    state.reset();
    pendingGameOver = false;
    renderer.showGameOver(false);
    renderer.setBombPulse(false);
    renderer.updateGrid(state);
    renderer.updateScore(state);
    renderer.renderTray(state);
    renderer.updateBombDisplay(state);
  }

  const input = new InputHandler(renderer, state, onPlace, onRestart, onBomb);
  input.init(layout);

  // Main loop
  app.ticker.add((dt: number) => {
    renderer.updateClearAnimations();
    renderer.updateComboAnimation(dt);
    renderer.updateBombAnimation();
    renderer.updateBombPulse();
    renderer.updateBombNewAnim(dt);
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
    renderer.updateBombDisplay(state);
    input.updateLayout(layout);
    if (state.gameOver) {
      renderer.showGameOver(true);
    }
    if (pendingGameOver) {
      renderer.setBombPulse(true);
    }
  });
}

main();
