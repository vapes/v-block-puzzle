export interface Piece {
  shape: number[][];
  color: number;
  id: number;
}

export interface Cell {
  filled: boolean;
  color: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Layout {
  width: number;
  height: number;
  cellSize: number;
  gridOriginX: number;
  gridOriginY: number;
  trayY: number;
  traySlotWidth: number;
  trayCellSize: number;
  scoreY: number;
  gridTotalSize: number;
}
