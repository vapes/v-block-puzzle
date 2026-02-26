import * as PIXI from 'pixi.js';
import { GRID_SIZE, COLORS, CLEAR_ANIM_DURATION } from './constants';
import { GameState } from './gameState';
import { Layout } from './types';
import { Piece, GridPosition } from './types';

const CELL_GAP = 2;
const CELL_RADIUS = 4;

interface ComboParticle {
  graphics: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  gravity: number;
  size: number;
}

export class Renderer {
  app: PIXI.Application;
  layout!: Layout;
  private gridContainer!: PIXI.Container;
  private cellGraphics: PIXI.Graphics[][] = [];
  private trayContainer!: PIXI.Container;
  private trayPieceContainers: PIXI.Container[] = [];
  private scoreText!: PIXI.Text;
  private highScoreText!: PIXI.Text;
  private dragContainer!: PIXI.Container;
  private ghostContainer!: PIXI.Container;
  private destroyableContainer!: PIXI.Container;
  private gameOverContainer!: PIXI.Container;
  private overlayGraphics!: PIXI.Graphics;
  private clearAnimations: { graphics: PIXI.Graphics; startTime: number }[] = [];
  private comboContainer!: PIXI.Container;
  private comboMainText!: PIXI.Text;
  private comboSubText!: PIXI.Text;
  private comboGlow!: PIXI.Graphics;
  private comboParticles: ComboParticle[] = [];
  private comboAnimTime = 0;
  private comboAnimActive = false;
  private comboBonusText!: PIXI.Text;

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

    // Destroyable cells overlay (below ghost)
    this.destroyableContainer = new PIXI.Container();
    this.app.stage.addChild(this.destroyableContainer);

    // Ghost overlay for placement preview
    this.ghostContainer = new PIXI.Container();
    this.app.stage.addChild(this.ghostContainer);

    // Drag layer (on top of everything)
    this.dragContainer = new PIXI.Container();
    this.app.stage.addChild(this.dragContainer);

    // Combo animation (above drag layer)
    this.createComboUI(layout);

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
  }

  private createComboUI(layout: Layout): void {
    this.comboContainer = new PIXI.Container();
    this.comboContainer.visible = false;

    // Glow circle behind text
    this.comboGlow = new PIXI.Graphics();
    this.comboContainer.addChild(this.comboGlow);

    // Main combo label ("COMBO x3!")
    this.comboMainText = new PIXI.Text('', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: Math.max(48, Math.floor(layout.width * 0.12)),
      fontWeight: 'bold',
      fill: [0xffdd44, 0xff8800],
      fillGradientType: 0,
      stroke: 0x000000,
      strokeThickness: 6,
      dropShadow: true,
      dropShadowColor: 0xff6600,
      dropShadowBlur: 16,
      dropShadowDistance: 0,
      letterSpacing: 3,
    });
    this.comboMainText.anchor.set(0.5, 0.5);
    this.comboContainer.addChild(this.comboMainText);

    // Sub label ("GREAT!", "AMAZING!", etc.)
    this.comboSubText = new PIXI.Text('', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: Math.max(28, Math.floor(layout.width * 0.065)),
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 0,
    });
    this.comboSubText.anchor.set(0.5, 0.5);
    this.comboContainer.addChild(this.comboSubText);

    // Bonus points text ("+48")
    this.comboBonusText = new PIXI.Text('', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: Math.max(22, Math.floor(layout.width * 0.05)),
      fontWeight: 'bold',
      fill: 0x00ff88,
      stroke: 0x000000,
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 6,
      dropShadowDistance: 0,
    });
    this.comboBonusText.anchor.set(0.5, 0.5);
    this.comboContainer.addChild(this.comboBonusText);

    this.app.stage.addChild(this.comboContainer);
  }

  private spawnComboParticles(cx: number, cy: number, count: number, color: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 6;
      const size = 3 + Math.random() * 5;
      const g = new PIXI.Graphics();
      g.beginFill(color);
      g.drawCircle(0, 0, size);
      g.endFill();
      g.x = cx;
      g.y = cy;
      this.comboContainer.addChildAt(g, 0);
      this.comboParticles.push({
        graphics: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        gravity: 0.15,
        size,
      });
    }
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

    // Determine labels
    let mainLabel = '';
    let subLabel = '';
    let particleColor = 0xffdd44;

    if (combo > 1) {
      mainLabel = `COMBO x${combo}`;
    } else if (linesCleared >= 2) {
      mainLabel = `${linesCleared} LINES`;
    } else {
      // Single line clear, no combo — skip the big animation
      return;
    }

    if (linesCleared >= 3) {
      subLabel = 'AMAZING!';
      particleColor = 0xff44aa;
    } else if (linesCleared >= 2) {
      subLabel = 'GREAT!';
      particleColor = 0x44ddff;
    } else if (combo >= 4) {
      subLabel = 'UNSTOPPABLE!';
      particleColor = 0xff4444;
    } else if (combo >= 3) {
      subLabel = 'ON FIRE!';
      particleColor = 0xff8800;
    }

    // Bonus points display
    const bonusPoints = linesCleared * GRID_SIZE * combo;

    const cx = this.layout.width / 2;
    const cy = this.layout.gridOriginY + this.layout.gridTotalSize / 2;

    // Setup text
    this.comboMainText.text = mainLabel;
    this.comboMainText.x = cx;
    this.comboMainText.y = cy;
    this.comboMainText.scale.set(0.3);
    this.comboMainText.alpha = 1;

    this.comboSubText.text = subLabel;
    this.comboSubText.x = cx;
    this.comboSubText.y = cy - Math.max(40, this.layout.width * 0.1);
    this.comboSubText.scale.set(0.5);
    this.comboSubText.alpha = subLabel ? 1 : 0;

    this.comboBonusText.text = `+${bonusPoints}`;
    this.comboBonusText.x = cx;
    this.comboBonusText.y = cy + Math.max(40, this.layout.width * 0.1);
    this.comboBonusText.scale.set(0.5);
    this.comboBonusText.alpha = 1;

    // Glow
    const glowRadius = Math.max(60, this.layout.width * 0.18);
    this.comboGlow.clear();
    this.comboGlow.beginFill(particleColor, 0.25);
    this.comboGlow.drawCircle(cx, cy, glowRadius);
    this.comboGlow.endFill();
    this.comboGlow.alpha = 1;
    this.comboGlow.scale.set(0.5);

    // Clear old particles
    for (const p of this.comboParticles) {
      this.comboContainer.removeChild(p.graphics);
      p.graphics.destroy();
    }
    this.comboParticles = [];

    // Spawn particles
    const particleCount = Math.min(12 + combo * 4, 40);
    this.spawnComboParticles(cx, cy, particleCount, particleColor);

    // Activate
    this.comboContainer.visible = true;
    this.comboAnimActive = true;
    this.comboAnimTime = 0;
  }

  updateComboAnimation(dt: number): void {
    if (!this.comboAnimActive) return;

    this.comboAnimTime += dt;
    const t = this.comboAnimTime;

    // Phase 1: scale in with bounce (0 - 15 frames)
    // Phase 2: hold (15 - 45 frames)
    // Phase 3: fade out (45 - 75 frames)
    const totalDuration = 75;

    if (t < 15) {
      // Bounce scale-in
      const progress = t / 15;
      const bounce = 1 + Math.sin(progress * Math.PI) * 0.3;
      const scale = progress * bounce;
      this.comboMainText.scale.set(scale);
      this.comboSubText.scale.set(scale * 0.8);
      this.comboBonusText.scale.set(scale * 0.7);
      this.comboGlow.scale.set(0.5 + progress * 0.8);
      this.comboGlow.alpha = progress;
    } else if (t < 45) {
      // Hold with gentle pulse
      const pulse = 1 + Math.sin((t - 15) * 0.15) * 0.05;
      this.comboMainText.scale.set(pulse);
      this.comboSubText.scale.set(pulse * 0.8);
      this.comboBonusText.scale.set(pulse * 0.7);
      // Bonus text floats upward
      this.comboBonusText.y -= dt * 0.3;
      this.comboGlow.scale.set(1.3 + Math.sin((t - 15) * 0.1) * 0.1);
    } else if (t < totalDuration) {
      // Fade out and scale up
      const fadeProgress = (t - 45) / 30;
      const alpha = 1 - fadeProgress;
      const scale = 1 + fadeProgress * 0.3;
      this.comboMainText.alpha = alpha;
      this.comboMainText.scale.set(scale);
      this.comboSubText.alpha = alpha;
      this.comboSubText.scale.set(scale * 0.8);
      this.comboBonusText.alpha = alpha;
      this.comboBonusText.y -= dt * 0.5;
      this.comboGlow.alpha = alpha * 0.5;
      this.comboGlow.scale.set(1.3 + fadeProgress * 0.5);
    } else {
      // Done
      this.comboAnimActive = false;
      this.comboContainer.visible = false;
    }

    // Update particles
    for (let i = this.comboParticles.length - 1; i >= 0; i--) {
      const p = this.comboParticles[i];
      p.graphics.x += p.vx;
      p.graphics.y += p.vy;
      p.vy += p.gravity;
      p.life -= dt / 60 / p.maxLife;

      if (p.life <= 0) {
        this.comboContainer.removeChild(p.graphics);
        p.graphics.destroy();
        this.comboParticles.splice(i, 1);
      } else {
        p.graphics.alpha = Math.max(0, p.life);
        p.graphics.scale.set(p.life);
      }
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

  showDestroyableHighlight(cells: number[][]): void {
    this.destroyableContainer.removeChildren();
    const { cellSize, gridOriginX, gridOriginY } = this.layout;

    for (const [r, c] of cells) {
      const hl = new PIXI.Graphics();
      hl.beginFill(COLORS.destroyHighlight, 0.45);
      hl.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      hl.endFill();
      hl.lineStyle(2, COLORS.destroyHighlight, 0.9);
      hl.drawRoundedRect(CELL_GAP, CELL_GAP, cellSize - CELL_GAP * 2, cellSize - CELL_GAP * 2, CELL_RADIUS);
      hl.x = gridOriginX + c * cellSize;
      hl.y = gridOriginY + r * cellSize;
      this.destroyableContainer.addChild(hl);
    }
  }

  hideDestroyableHighlight(): void {
    this.destroyableContainer.removeChildren();
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
