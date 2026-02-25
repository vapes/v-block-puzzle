import { GRID_SIZE, SHAPES, PIECE_COLORS, TRAY_SLOTS } from './constants';
import { Cell, Piece, GridPosition } from './types';

let nextPieceId = 0;

export class GameState {
  grid: Cell[][];
  tray: (Piece | null)[];
  score: number;
  highScore: number;
  combo: number;
  gameOver: boolean;

  constructor() {
    this.grid = this.createEmptyGrid();
    this.tray = [];
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.combo = 0;
    this.gameOver = false;
    this.refillTray();
  }

  private createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push({ filled: false, color: 0 });
      }
      grid.push(row);
    }
    return grid;
  }

  private loadHighScore(): number {
    try {
      return parseInt(localStorage.getItem('blockpuzzle_highscore') || '0', 10);
    } catch {
      return 0;
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem('blockpuzzle_highscore', this.highScore.toString());
    } catch {
      // ignore
    }
  }

  generatePiece(): Piece {
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const colorIdx = Math.floor(Math.random() * PIECE_COLORS.length);
    return {
      shape: SHAPES[shapeIdx],
      color: PIECE_COLORS[colorIdx],
      id: nextPieceId++,
    };
  }

  refillTray(): void {
    if (this.tray.every((p) => p === null)) {
      this.tray = [];
      for (let i = 0; i < TRAY_SLOTS; i++) {
        this.tray.push(this.generatePiece());
      }
    }
  }

  canPlace(piece: Piece, pos: GridPosition): boolean {
    for (const [r, c] of piece.shape) {
      const gr = pos.row + r;
      const gc = pos.col + c;
      if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
      if (this.grid[gr][gc].filled) return false;
    }
    return true;
  }

  placePiece(piece: Piece, pos: GridPosition): { cleared: number[][]; linesCleared: number } {
    // Place blocks
    for (const [r, c] of piece.shape) {
      this.grid[pos.row + r][pos.col + c] = { filled: true, color: piece.color };
    }

    // Add score for placing
    this.score += piece.shape.length;

    // Check for completed rows and columns
    const clearedRows: number[] = [];
    const clearedCols: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (this.grid[r].every((cell) => cell.filled)) {
        clearedRows.push(r);
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!this.grid[r][c].filled) {
          full = false;
          break;
        }
      }
      if (full) clearedCols.push(c);
    }

    const linesCleared = clearedRows.length + clearedCols.length;

    // Collect cells to clear
    const cleared: number[][] = [];

    if (linesCleared > 0) {
      // Update combo
      this.combo++;

      // Score: lines * GRID_SIZE * combo multiplier
      const lineScore = linesCleared * GRID_SIZE * this.combo;
      this.score += lineScore;

      for (const r of clearedRows) {
        for (let c = 0; c < GRID_SIZE; c++) {
          cleared.push([r, c]);
          this.grid[r][c] = { filled: false, color: 0 };
        }
      }
      for (const c of clearedCols) {
        for (let r = 0; r < GRID_SIZE; r++) {
          if (!clearedRows.includes(r)) {
            cleared.push([r, c]);
          }
          this.grid[r][c] = { filled: false, color: 0 };
        }
      }
    } else {
      this.combo = 0;
    }

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    return { cleared, linesCleared };
  }

  removePieceFromTray(pieceId: number): void {
    const idx = this.tray.findIndex((p) => p !== null && p.id === pieceId);
    if (idx >= 0) {
      this.tray[idx] = null;
    }
    this.refillTray();
  }

  canAnyPieceBePlaced(): boolean {
    for (const piece of this.tray) {
      if (piece === null) continue;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (this.canPlace(piece, { row: r, col: c })) return true;
        }
      }
    }
    return false;
  }

  checkGameOver(): boolean {
    if (!this.canAnyPieceBePlaced()) {
      this.gameOver = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.grid = this.createEmptyGrid();
    this.tray = [];
    this.score = 0;
    this.combo = 0;
    this.gameOver = false;
    this.refillTray();
  }
}
