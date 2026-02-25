import * as PIXI from 'pixi.js';
import { GRID_SIZE } from './constants';
import { GameState } from './gameState';
import { Renderer } from './renderer';
import { Layout } from './types';
import { Piece, GridPosition } from './types';

// Vertical offset above finger when dragging so user can see the piece
const DRAG_OFFSET_Y = -80;

export class InputHandler {
  private renderer: Renderer;
  private state: GameState;
  private layout!: Layout;
  private draggingPiece: Piece | null = null;
  private draggingTrayIndex: number = -1;
  private dragX = 0;
  private dragY = 0;
  private lastGridPos: GridPosition | null = null;
  private onPlace: (piece: Piece, pos: GridPosition, trayIndex: number) => void;
  private onRestart: () => void;

  constructor(
    renderer: Renderer,
    state: GameState,
    onPlace: (piece: Piece, pos: GridPosition, trayIndex: number) => void,
    onRestart: () => void,
  ) {
    this.renderer = renderer;
    this.state = state;
    this.onPlace = onPlace;
    this.onRestart = onRestart;
  }

  init(layout: Layout): void {
    this.layout = layout;
    this.setupEventListeners();
  }

  updateLayout(layout: Layout): void {
    this.layout = layout;
  }

  updateState(state: GameState): void {
    this.state = state;
  }

  private setupEventListeners(): void {
    const stage = this.renderer.app.stage;
    stage.interactive = true;
    stage.hitArea = new PIXI.Rectangle(0, 0, this.layout.width, this.layout.height);

    stage.on('pointerdown', this.onPointerDown.bind(this));
    stage.on('pointermove', this.onPointerMove.bind(this));
    stage.on('pointerup', this.onPointerUp.bind(this));
    stage.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  private onPointerDown(e: PIXI.FederatedPointerEvent): void {
    // Handle game over tap
    if (this.state.gameOver) {
      this.onRestart();
      return;
    }

    // Check if tapping a tray piece
    const x = e.global.x;
    const y = e.global.y;

    for (let i = 0; i < this.state.tray.length; i++) {
      const piece = this.state.tray[i];
      if (!piece) continue;

      const container = this.renderer.getTrayPieceContainer(i);
      if (!container) continue;

      const bounds = container.getBounds();
      if (x >= bounds.x - 10 && x <= bounds.x + bounds.width + 10 &&
          y >= bounds.y - 10 && y <= bounds.y + bounds.height + 10) {
        this.startDrag(piece, i, x, y);
        break;
      }
    }
  }

  private startDrag(piece: Piece, trayIndex: number, x: number, y: number): void {
    this.draggingPiece = piece;
    this.draggingTrayIndex = trayIndex;
    this.dragX = x;
    this.dragY = y + DRAG_OFFSET_Y;
    this.lastGridPos = null;

    // Hide the tray piece
    const container = this.renderer.getTrayPieceContainer(trayIndex);
    if (container) container.alpha = 0.3;

    this.renderer.showDragPiece(piece, this.dragX, this.dragY);
    this.updateGhost();
  }

  private onPointerMove(e: PIXI.FederatedPointerEvent): void {
    if (!this.draggingPiece) return;

    this.dragX = e.global.x;
    this.dragY = e.global.y + DRAG_OFFSET_Y;

    this.renderer.showDragPiece(this.draggingPiece, this.dragX, this.dragY);
    this.updateGhost();
  }

  private updateGhost(): void {
    if (!this.draggingPiece) return;

    const gridPos = this.screenToGrid(this.dragX, this.dragY, this.draggingPiece);

    if (gridPos) {
      const valid = this.state.canPlace(this.draggingPiece, gridPos);
      this.renderer.showGhost(this.draggingPiece, gridPos, valid);
      this.lastGridPos = gridPos;

      if (valid) {
        const destroyable = this.state.getDestroyableCells(this.draggingPiece, gridPos);
        this.renderer.showDestroyableHighlight(destroyable);
      } else {
        this.renderer.hideDestroyableHighlight();
      }
    } else {
      this.renderer.hideGhost();
      this.renderer.hideDestroyableHighlight();
      this.lastGridPos = null;
    }
  }

  private onPointerUp(_e: PIXI.FederatedPointerEvent): void {
    if (!this.draggingPiece) return;

    const piece = this.draggingPiece;
    const trayIndex = this.draggingTrayIndex;

    // Try to place
    if (this.lastGridPos && this.state.canPlace(piece, this.lastGridPos)) {
      this.renderer.hideDragPiece();
      this.renderer.hideGhost();
      this.renderer.hideDestroyableHighlight();
      this.onPlace(piece, this.lastGridPos, trayIndex);
    } else {
      // Snap back
      const container = this.renderer.getTrayPieceContainer(trayIndex);
      if (container) container.alpha = 1;
      this.renderer.hideDragPiece();
      this.renderer.hideGhost();
      this.renderer.hideDestroyableHighlight();
    }

    this.draggingPiece = null;
    this.draggingTrayIndex = -1;
    this.lastGridPos = null;
  }

  private screenToGrid(sx: number, sy: number, piece: Piece): GridPosition | null {
    const { cellSize, gridOriginX, gridOriginY, gridTotalSize } = this.layout;

    // Get piece center offset
    const offset = this.renderer.getDragPieceOffset(piece);

    // Calculate top-left of the piece on screen
    const pieceTopLeftX = sx - offset.offsetX;
    const pieceTopLeftY = sy - offset.offsetY;

    // Convert to grid coordinates (snap to nearest cell)
    const col = Math.round((pieceTopLeftX - gridOriginX) / cellSize);
    const row = Math.round((pieceTopLeftY - gridOriginY) / cellSize);

    // Check if the piece center is roughly over the grid
    const centerX = sx;
    const centerY = sy;
    const margin = cellSize * 2;

    if (
      centerX < gridOriginX - margin ||
      centerX > gridOriginX + gridTotalSize + margin ||
      centerY < gridOriginY - margin ||
      centerY > gridOriginY + gridTotalSize + margin
    ) {
      return null;
    }

    return { row, col };
  }
}
