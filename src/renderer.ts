import * as PIXI from 'pixi.js';
import { GRID_SIZE, COLORS, CLEAR_ANIM_DURATION } from './constants';
import { GameState } from './gameState';
import { Layout } from './types';
import { Piece, GridPosition } from './types';

const CELL_GAP = 2;
const CELL_RADIUS = 4;

export class Renderer {
  app: PIXI.Application;
  layout!: Layout;
  private gridContainer!: PIXI.Container;
  private cellGraphics: PIXI.Graphics[][] = [];
  private trayContainer!: PIXI.Container;
  private trayPieceContainers: PIXI.Container[] = [];
  private scoreText!: PIXI.Text;
  private highScoreText!: PIXI.Text;
  private comboText!: PIXI.Text;
  private dragContainer!: PIXI.Container;
  private ghostContainer!: PIXI.Container;
  private gameOverContainer!: PIXI.Container;
  private overlayGraphics!: PIXI.Graphics;
  private clearAnimations: { graphics: PIXI.Graphics; startTime: number }[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  init(layout: Layout): void {
    this.layout = layout;

    // Clear everything
    this.app.stage.removeChildren();
    this.cellGraphics = [];
    this.trayPieceContainers = [];
    this.clearAnimations = [];

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(COLORS.background);
    bg.drawRect(0, 0, layout.width, layout.height);
    bg.endFill();
    this.app.stage.addChild(bg);

    this.createScorePanel(layout);
    this.createGrid(layout);
    this.createTray(layout);

    // Ghost overlay for placement preview
    this.ghostContainer = new PIXI.Container();
    this.app.stage.addChild(this.ghostContainer);

    // Drag layer (on top of everything)
    this.dragContainer = new PIXI.Container();
    this.app.stage.addChild(this.dragContainer);

    // Game over overlay
    this.createGameOverUI(layout);
  }

  private createScorePanel(layout: Layout): void {
    const panel = new PIXI.Graphics();
    panel.beginFill(COLORS.scorePanel, 0.8);
    panel.drawRoundedRect(8, layout.scoreY, layout.width - 16, 64, 12);
    panel.endFill();
    this.app.stage.addChild(panel);

    this.scoreText = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: COLORS.text,
    });
    this.scoreText.x = 24;
    this.scoreText.y = layout.scoreY + 18;
    this.app.stage.addChild(this.scoreText);

    this.highScoreText = new PIXI.Text('Best: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: COLORS.textSecondary,
    });
    this.highScoreText.anchor.set(1, 0);
    this.highScoreText.x = layout.width - 24;
    this.highScoreText.y = layout.scoreY + 22;
    this.app.stage.addChild(this.highScoreText);

    this.comboText = new PIXI.Text('', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: COLORS.comboText,
    });
    this.comboText.anchor.set(0.5, 0.5);
    this.comboText.x = layout.width / 2;
    this.comboText.y = layout.scoreY + 36;
    this.comboText.alpha = 0;
    this.app.stage.addChild(this.comboText);
  }

  private createGrid(layout: Layout): void {
    this.gridContainer = new PIXI.Container();
    this.gridContainer.x = layout.gridOriginX;
    this.gridContainer.y = layout.gridOriginY;

    // Grid background
    const gridBg = new PIXI.Graphics();
    gridBg.beginFill(COLORS.gridBg);
    gridBg.drawRoundedRect(-6, -6, layout.gridTotalSize + 12, layout.gridTotalSize + 12, 10);
    gridBg.endFill();
    this.gridContainer.addChild(gridBg);

    // Cells
    this.cellGraphics = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: PIXI.Graphics[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = new PIXI.Graphics();
        this.drawCell(cell, layout.cellSize, COLORS.cellEmpty, 1);
        cell.x = c * layout.cellSize;
        cell.y = r * layout.cellSize;
        this.gridContainer.addChild(cell);
        row.push(cell);
      }
      this.cellGraphics.push(row);
    }

    this.app.stage.addChild(this.gridContainer);
  }

  private drawCell(g: PIXI.Graphics, size: number, color: number, alpha: number): void {
    g.clear();
    g.beginFill(color, alpha);
    g.drawRoundedRect(CELL_GAP, CELL_GAP, size - CELL_GAP * 2, size - CELL_GAP * 2, CELL_RADIUS);
    g.endFill();
  }

  private createTray(layout: Layout): void {
    this.trayContainer = new PIXI.Container();

    // Tray background
    const trayBg = new PIXI.Graphics();
    trayBg.beginFill(COLORS.trayBg, 0.6);
    trayBg.drawRoundedRect(4, layout.trayY - 8, layout.width - 8, layout.height - layout.trayY + 4, 16);
    trayBg.endFill();
    this.app.stage.addChild(trayBg);

    this.app.stage.addChild(this.trayContainer);
  }

  private createGameOverUI(layout: Layout): void {
    this.gameOverContainer = new PIXI.Container();
    this.gameOverContainer.visible = false;

    this.overlayGraphics = new PIXI.Graphics();
    this.overlayGraphics.beginFill(COLORS.gameOverOverlay, 0.7);
    this.overlayGraphics.drawRect(0, 0, layout.width, layout.height);
    this.overlayGraphics.endFill();
    this.gameOverContainer.addChild(this.overlayGraphics);

    const gameOverText = new PIXI.Text('Game Over', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: COLORS.text,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 3,
    });
    gameOverText.anchor.set(0.5);
    gameOverText.x = layout.width / 2;
    gameOverText.y = layout.height / 2 - 60;
    this.gameOverContainer.addChild(gameOverText);

    const tapText = new PIXI.Text('Tap to play again', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fill: COLORS.textSecondary,
    });
    tapText.anchor.set(0.5);
    tapText.x = layout.width / 2;
    tapText.y = layout.height / 2 + 10;
    this.gameOverContainer.addChild(tapText);

    this.app.stage.addChild(this.gameOverContainer);
  }

  updateGrid(state: GameState): void {
    const { cellSize } = this.layout;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = state.grid[r][c];
        const color = cell.filled ? cell.color : COLORS.cellEmpty;
        this.drawCell(this.cellGraphics[r][c], cellSize, color, 1);
      }
    }
  }

  updateScore(state: GameState): void {
    this.scoreText.text = `Score: ${state.score}`;
    this.highScoreText.text = `Best: ${state.highScore}`;
  }

  showCombo(combo: number, linesCleared: number): void {
    if (combo <= 0) return;
    let label = '';
    if (linesCleared >= 3) label = 'AMAZING! ';
    else if (linesCleared >= 2) label = 'GREAT! ';
    if (combo > 1) label += `Combo x${combo}!`;
    else if (linesCleared >= 2) label += `${linesCleared} Lines!`;
    else label = '';
    if (!label) return;

    this.comboText.text = label;
    this.comboText.alpha = 1;
    this.comboText.scale.set(1.3);

    // Animate (handled in update loop)
  }

  updateComboAnimation(dt: number): void {
    if (this.comboText.alpha > 0) {
      this.comboText.alpha -= dt * 0.02;
      this.comboText.scale.x += (1 - this.comboText.scale.x) * 0.1;
      this.comboText.scale.y = this.comboText.scale.x;
    }
  }

  renderTray(state: GameState): void {
    this.trayContainer.removeChildren();
    this.trayPieceContainers = [];

    const { traySlotWidth, trayCellSize, trayY } = this.layout;

    for (let i = 0; i < state.tray.length; i++) {
      const piece = state.tray[i];
      if (piece === null) {
        this.trayPieceContainers.push(new PIXI.Container());
        continue;
      }

      const container = new PIXI.Container();
      container.interactive = true;
      container.cursor = 'pointer';

      // Calculate piece bounds for centering
      let maxR = 0, maxC = 0;
      for (const [r, c] of piece.shape) {
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      }
      const pieceW = (maxC + 1) * trayCellSize;
      const pieceH = (maxR + 1) * trayCellSize;

      const slotCenterX = i * traySlotWidth + traySlotWidth / 2;
      container.x = slotCenterX - pieceW / 2;
      container.y = trayY + 20 + ((this.layout.height - trayY - 40) - pieceH) / 2;

      for (const [r, c] of piece.shape) {
        const block = new PIXI.Graphics();
        block.beginFill(piece.color);
        block.drawRoundedRect(CELL_GAP, CELL_GAP, trayCellSize - CELL_GAP * 2, trayCellSize - CELL_GAP * 2, 3);
        block.endFill();
        block.x = c * trayCellSize;
        block.y = r * trayCellSize;
        container.addChild(block);
      }

      this.trayContainer.addChild(container);
      this.trayPieceContainers.push(container);
    }
  }

  getTrayPieceContainer(index: number): PIXI.Container | null {
    return this.trayPieceContainers[index] || null;
  }

  getTrayContainer(): PIXI.Container {
    return this.trayContainer;
  }

  showGhost(piece: Piece, pos: GridPosition, valid: boolean): void {
    this.ghostContainer.removeChildren();
    const { cellSize, gridOriginX, gridOriginY } = this.layout;

    for (const [r, c] of piece.shape) {
      const gr = pos.row + r;
      const gc = pos.col + c;
      if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) continue;

      const ghost = new PIXI.Graphics();
      const color = valid ? piece.color : COLORS.highlightInvalid;
      ghost.beginFill(color, valid ? 0.5 : 0.3);
      ghost.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      ghost.endFill();

      if (valid) {
        ghost.lineStyle(2, COLORS.highlight, 0.7);
        ghost.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      }

      ghost.x = gridOriginX + gc * cellSize;
      ghost.y = gridOriginY + gr * cellSize;
      this.ghostContainer.addChild(ghost);
    }
  }

  hideGhost(): void {
    this.ghostContainer.removeChildren();
  }

  showDragPiece(piece: Piece, x: number, y: number): void {
    this.dragContainer.removeChildren();
    const { cellSize } = this.layout;

    // Calculate piece center offset
    let maxR = 0, maxC = 0;
    for (const [r, c] of piece.shape) {
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }

    const offsetX = ((maxC + 1) * cellSize) / 2;
    const offsetY = ((maxR + 1) * cellSize) / 2;

    for (const [r, c] of piece.shape) {
      const block = new PIXI.Graphics();
      block.beginFill(piece.color, 0.9);
      block.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      block.endFill();
      block.x = x + c * cellSize - offsetX;
      block.y = y + r * cellSize - offsetY;
      this.dragContainer.addChild(block);
    }
  }

  hideDragPiece(): void {
    this.dragContainer.removeChildren();
  }

  animateClear(cells: number[][]): void {
    const { cellSize, gridOriginX, gridOriginY } = this.layout;

    for (const [r, c] of cells) {
      const flash = new PIXI.Graphics();
      flash.beginFill(0xffffff, 0.9);
      flash.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      flash.endFill();
      flash.x = gridOriginX + c * cellSize;
      flash.y = gridOriginY + r * cellSize;
      this.app.stage.addChildAt(flash, this.app.stage.getChildIndex(this.ghostContainer));
      this.clearAnimations.push({ graphics: flash, startTime: Date.now() });
    }
  }

  updateClearAnimations(): void {
    const now = Date.now();
    for (let i = this.clearAnimations.length - 1; i >= 0; i--) {
      const anim = this.clearAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = elapsed / CLEAR_ANIM_DURATION;

      if (progress >= 1) {
        this.app.stage.removeChild(anim.graphics);
        anim.graphics.destroy();
        this.clearAnimations.splice(i, 1);
      } else {
        anim.graphics.alpha = 1 - progress;
        anim.graphics.scale.set(1 + progress * 0.3);
      }
    }
  }

  showGameOver(visible: boolean): void {
    this.gameOverContainer.visible = visible;
  }

  getGameOverContainer(): PIXI.Container {
    return this.gameOverContainer;
  }

  getDragPieceOffset(piece: Piece): { offsetX: number; offsetY: number } {
    const { cellSize } = this.layout;
    let maxR = 0, maxC = 0;
    for (const [r, c] of piece.shape) {
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }
    return {
      offsetX: ((maxC + 1) * cellSize) / 2,
      offsetY: ((maxR + 1) * cellSize) / 2,
    };
  }
}
