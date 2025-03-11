// tetromino.ts

export interface Tetromino {
    shape: number[][]; // 2D matrix defining the block
    color: string;
  }
  
  /**
   * Deep copies a 2D matrix.
   * @param matrix The matrix to copy.
   * @returns A new matrix that is a deep copy of the original.
   */
  export const deepCopy = (matrix: number[][]): number[][] =>
    matrix.map(row => [...row]);
  
  export const TETROMINOES: { [key: string]: Tetromino } = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      color: "cyan",
    },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "yellow",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "purple",
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      color: "green",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      color: "red",
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "blue",
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "orange",
    },
  };
  
  /**
   * Returns a random Tetromino.
   * Each tetromino returned is a deep copy to prevent unintended mutations.
   * @returns A randomly selected tetromino.
   */
  export const randomTetromino = (): Tetromino => {
    const keys = Object.keys(TETROMINOES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    return { shape: deepCopy(TETROMINOES[randKey].shape), color: TETROMINOES[randKey].color };
  };
  
  /**
   * Rotates a tetromino's shape matrix clockwise.
   * @param matrix The tetromino shape matrix.
   * @returns The rotated matrix.
   */
  export const rotate = (matrix: number[][]): number[][] => {
    const n = matrix.length;
    const m = matrix[0].length;
    const rotated = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        rotated[j][n - 1 - i] = matrix[i][j];
      }
    }
    return rotated;
  };
  