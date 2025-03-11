// board.ts

import { Tetromino } from "./tetromino";

/** Board dimensions */
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

/** 
 * Board type: a 2D grid where each cell is either empty (null) 
 * or contains a string representing the color of a landed block.
 */
export type Board = (string | null)[][];

/**
 * Creates an empty board with GRID_HEIGHT rows and GRID_WIDTH columns.
 * Each cell is initialized to null.
 */
export const createEmptyBoard = (): Board => {
  return Array.from({ length: GRID_HEIGHT }, () => new Array(GRID_WIDTH).fill(null));
};

/**
 * Checks if a tetromino can be placed on the board at the specified position.
 * It verifies that every occupied cell of the tetromino is within bounds and 
 * does not overlap an already occupied cell.
 *
 * @param board - The current game board.
 * @param tetromino - The tetromino to test.
 * @param posX - The column index where the top-left of the tetromino will be placed.
 * @param posY - The row index where the top-left of the tetromino will be placed.
 * @returns True if the tetromino can be placed; otherwise, false.
 */
export const canPlaceTetromino = (
  board: Board,
  tetromino: Tetromino,
  posX: number,
  posY: number
): boolean => {
  const shape = tetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = posX + col;
        const boardY = posY + row;
        // Check board boundaries
        if (
          boardX < 0 ||
          boardX >= GRID_WIDTH ||
          boardY < 0 ||
          boardY >= GRID_HEIGHT
        ) {
          return false;
        }
        // Check collision with landed blocks.
        if (board[boardY][boardX] !== null) {
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * Type representing a falling tetromino block.
 */
export type FallingBlock = {
  tetromino: Tetromino;
  x: number; // Column index on the board
  y: number; // Row index on the board
};

/**
 * Merges a falling tetromino into the board.
 * This "locks" the tetromino into the board by writing its color
 * into every cell that is occupied by the tetromino.
 *
 * @param board - The current game board.
 * @param block - The falling block to merge into the board.
 * @returns A new board with the tetromino merged.
 */
export const mergeTetromino = (board: Board, block: FallingBlock): Board => {
  // Create a copy of the board to avoid mutating the original.
  const newBoard = board.map(row => [...row]);
  const shape = block.tetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = block.x + col;
        const boardY = block.y + row;
        // Ensure we're within bounds (should always be true if collision detection works correctly)
        if (
          boardX >= 0 &&
          boardX < GRID_WIDTH &&
          boardY >= 0 &&
          boardY < GRID_HEIGHT
        ) {
          newBoard[boardY][boardX] = block.tetromino.color;
        }
      }
    }
  }
  return newBoard;
};
