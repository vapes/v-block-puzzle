import { GRID_SIZE, GRID_PADDING, TRAY_SLOTS } from './constants';
import { Layout } from './types';

export function computeLayout(screenW: number, screenH: number): Layout {
  const padding = GRID_PADDING;

  // Grid takes up most of the width
  const maxGridWidth = screenW - padding * 2;
  // Reserve space for score at top and tray at bottom
  const scoreHeight = 80;
  const trayHeight = screenH * 0.25;
  const availableGridHeight = screenH - scoreHeight - trayHeight - padding * 2;

  const gridTotalSize = Math.min(maxGridWidth, availableGridHeight);
  const cellSize = Math.floor(gridTotalSize / GRID_SIZE);
  const actualGridSize = cellSize * GRID_SIZE;

  const gridOriginX = Math.floor((screenW - actualGridSize) / 2);
  const gridOriginY = scoreHeight + Math.floor((availableGridHeight - actualGridSize) / 2);

  const trayY = gridOriginY + actualGridSize + padding;
  const traySlotWidth = Math.floor(screenW / TRAY_SLOTS);
  const trayCellSize = Math.floor(Math.min(traySlotWidth / 5.5, (screenH - trayY - padding) / 5.5));

  return {
    width: screenW,
    height: screenH,
    cellSize,
    gridOriginX,
    gridOriginY,
    trayY,
    traySlotWidth,
    trayCellSize,
    scoreY: padding,
    gridTotalSize: actualGridSize,
  };
}
