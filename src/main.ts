import * as PIXI from 'pixi.js';
import { GameState } from './gameState';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { computeLayout } from './layout';
import { Piece, GridPosition } from './types';

function requestFullscreen(canvas: HTMLCanvasElement): void {
  // Try canvas fullscreen first (preferred)
  const canvasReq = (canvas as HTMLCanvasElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }).requestFullscreen?.bind(canvas) ??
    (canvas as any).webkitRequestFullscreen?.bind(canvas) ??
    (canvas as any).mozRequestFullScreen?.bind(canvas) ??
    (canvas as any).msRequestFullscreen?.bind(canvas);

  if (canvasReq) {
    canvasReq().catch(() => {});
  } else {
    // Fallback to document element
    const el = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    const docReq = el.requestFullscreen?.bind(el) ??
      el.webkitRequestFullscreen?.bind(el) ??
      (el as any).mozRequestFullScreen?.bind(el) ??
      (el as any).msRequestFullscreen?.bind(el);

    if (docReq) {
      docReq().catch(() => {});
    }
  }

  // Also try to lock screen orientation to landscape
  const screenOrient = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
  if (screenOrient?.lock) {
    screenOrient.lock('landscape').catch(() => {});
  }
}

function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  // On mobile, enter fullscreen on first user tap
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    let fullscreenRequested = false;
    const enterFullscreen = () => {
      if (fullscreenRequested) return;
      fullscreenRequested = true;
      requestFullscreen(canvas);
    };
    // Try touchstart first, then click as fallback
    canvas.addEventListener('touchstart', enterFullscreen, { once: true });
    canvas.addEventListener('pointerdown', enterFullscreen, { once: true });
  }

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
