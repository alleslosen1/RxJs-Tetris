// main.ts

import "./style.css";
import { fromEvent, interval, merge } from "rxjs";
import { filter, map, scan, takeWhile } from "rxjs/operators";
import { Tetromino, randomTetromino, rotate } from "./tetromino";
import {
  Board,
  createEmptyBoard,
  canPlaceTetromino,
  mergeTetromino,
  FallingBlock,
  GRID_WIDTH,
  GRID_HEIGHT,
} from "./board";

/** Viewport and Game Constants */
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / GRID_HEIGHT,
};

/** Action Types for FRP state updates */
type Action =
  | { type: "tick" }
  | { type: "left" }
  | { type: "right" }
  | { type: "down" }
  | { type: "rotate" }
  | { type: "drop" };

/** Game State */
export type State = Readonly<{
  board: Board;
  currentBlock: FallingBlock;
  nextTetromino: Tetromino;
  gameOver: boolean;
  score: number;
}>;

/**
 * Spawns a new falling block (tetromino) at the top of the board,
 * using the provided tetromino.
 * It centers the tetromino horizontally.
 * @param board The current board.
 * @param tetromino The tetromino to spawn.
 */
const spawnNewBlock = (board: Board, tetromino: Tetromino): FallingBlock => {
  const tetrominoWidth = tetromino.shape[0].length;
  const x = Math.floor((GRID_WIDTH - tetrominoWidth) / 2);
  return { tetromino, x, y: 0 };
};

/** Initial game state */
const initialState: State = {
  board: createEmptyBoard(),
  currentBlock: spawnNewBlock(createEmptyBoard(), randomTetromino()),
  nextTetromino: randomTetromino(),
  gameOver: false,
  score: 0,
};

/**
 * clearRows checks the board for any full rows (i.e. rows with no null cells)
 * and removes them. It then prepends the same number of empty rows to the top.
 * @param board The current game board.
 * @returns An object with the new board and the number of rows cleared.
 */
const clearRows = (board: Board): { board: Board; rowsCleared: number } => {
  const remainingRows = board.filter(row => row.some(cell => cell === null));
  const rowsCleared = GRID_HEIGHT - remainingRows.length;
  const newRows = Array.from({ length: rowsCleared }, () => new Array(GRID_WIDTH).fill(null));
  return { board: newRows.concat(remainingRows), rowsCleared };
};

/**
 * updateState processes an action and returns a new state.
 * - "tick" and "down" actions attempt to move the active tetromino down.
 * - "left" and "right" actions move the tetromino horizontally if valid.
 * - "rotate" attempts to rotate the tetromino.
 * - "drop" instantly drops the tetromino to the lowest valid position.
 * - When the tetromino can’t move further down, it is merged into the board,
 *   full rows are cleared (and score is updated), and a new tetromino is spawned.
 * - The new current block uses the nextTetromino, and a new random tetromino is generated for preview.
 * - If the new tetromino cannot be placed, the game is marked as over.
 *
 * @param state The current game state.
 * @param action The action to process.
 * @returns The updated state.
 */
const updateState = (state: State, action: Action): State => {
  if (state.gameOver) return state;
  const { board, currentBlock } = state;

  switch (action.type) {
    case "tick":
    case "down":
      if (canPlaceTetromino(board, currentBlock.tetromino, currentBlock.x, currentBlock.y + 1)) {
        return { ...state, currentBlock: { ...currentBlock, y: currentBlock.y + 1 } };
      } else {
        const newBoard = mergeTetromino(board, currentBlock);
        const { board: clearedBoard, rowsCleared } = clearRows(newBoard);
        const scoreIncrement = rowsCleared * 100;
        const newBlock = spawnNewBlock(clearedBoard, state.nextTetromino);
        const nextTetromino = randomTetromino();
        if (!canPlaceTetromino(clearedBoard, newBlock.tetromino, newBlock.x, newBlock.y)) {
          return { board: clearedBoard, currentBlock: newBlock, nextTetromino, gameOver: true, score: state.score + scoreIncrement };
        }
        return { board: clearedBoard, currentBlock: newBlock, nextTetromino, gameOver: false, score: state.score + scoreIncrement };
      }
    case "left":
      if (canPlaceTetromino(board, currentBlock.tetromino, currentBlock.x - 1, currentBlock.y)) {
        return { ...state, currentBlock: { ...currentBlock, x: currentBlock.x - 1 } };
      }
      return state;
    case "right":
      if (canPlaceTetromino(board, currentBlock.tetromino, currentBlock.x + 1, currentBlock.y)) {
        return { ...state, currentBlock: { ...currentBlock, x: currentBlock.x + 1 } };
      }
      return state;
    case "rotate":
      const rotatedShape = rotate(currentBlock.tetromino.shape);
      const rotatedTetromino = { ...currentBlock.tetromino, shape: rotatedShape };
      if (canPlaceTetromino(board, rotatedTetromino, currentBlock.x, currentBlock.y)) {
        return { ...state, currentBlock: { ...currentBlock, tetromino: rotatedTetromino } };
      }
      return state;
    case "drop":
      let dropY = currentBlock.y;
      while (canPlaceTetromino(board, currentBlock.tetromino, currentBlock.x, dropY + 1)) {
        dropY++;
      }
      const droppedBlock = { ...currentBlock, y: dropY };
      const newBoardAfterDrop = mergeTetromino(board, droppedBlock);
      const { board: clearedBoardAfterDrop, rowsCleared: rowsClearedDrop } = clearRows(newBoardAfterDrop);
      const scoreIncrementDrop = rowsClearedDrop * 100;
      const newBlockAfterDrop = spawnNewBlock(clearedBoardAfterDrop, state.nextTetromino);
      const nextTetrominoAfterDrop = randomTetromino();
      if (!canPlaceTetromino(clearedBoardAfterDrop, newBlockAfterDrop.tetromino, newBlockAfterDrop.x, newBlockAfterDrop.y)) {
        return { board: clearedBoardAfterDrop, currentBlock: newBlockAfterDrop, nextTetromino: nextTetrominoAfterDrop, gameOver: true, score: state.score + scoreIncrementDrop };
      }
      return { board: clearedBoardAfterDrop, currentBlock: newBlockAfterDrop, nextTetromino: nextTetrominoAfterDrop, gameOver: false, score: state.score + scoreIncrementDrop };
    default:
      return state;
  }
};

/**
 * Renders the current game state.
 * - Draws the board: every cell with a landed tetromino.
 * - Draws the active tetromino.
 * - Updates the score display in the sidebar.
 *
 * @param state The current game state.
 */
const render = (state: State) => {
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement;
  const scoreText = document.getElementById("scoreText");
  if (scoreText) {
    scoreText.textContent = state.score.toString();
  }
  
  // Preserve the game over element before clearing.
  const gameOverElement = document.getElementById("gameOver");

  // Clear the SVG.
  svg.innerHTML = "";

  // Render landed blocks from the board.
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      if (state.board[row][col]) {
        const cell = document.createElementNS(svg.namespaceURI, "rect");
        cell.setAttribute("x", (col * Block.WIDTH).toString());
        cell.setAttribute("y", (row * Block.HEIGHT).toString());
        cell.setAttribute("width", Block.WIDTH.toString());
        cell.setAttribute("height", Block.HEIGHT.toString());
        cell.setAttribute("fill", state.board[row][col]!);
        cell.setAttribute("stroke", "black");
        svg.appendChild(cell);
      }
    }
  }

  // Render the active tetromino.
  const shape = state.currentBlock.tetromino.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const cell = document.createElementNS(svg.namespaceURI, "rect");
        cell.setAttribute("x", ((state.currentBlock.x + col) * Block.WIDTH).toString());
        cell.setAttribute("y", ((state.currentBlock.y + row) * Block.HEIGHT).toString());
        cell.setAttribute("width", Block.WIDTH.toString());
        cell.setAttribute("height", Block.HEIGHT.toString());
        cell.setAttribute("fill", state.currentBlock.tetromino.color);
        cell.setAttribute("stroke", "black");
        svg.appendChild(cell);
      }
    }
  }

  // Append the game over element last so it appears on top.
  if (gameOverElement) {
    svg.appendChild(gameOverElement);
  }
};

/**
 * Renders the preview of the next tetromino in the preview SVG.
 * Uses the same cell size as the main board and centers the tetromino.
 * @param nextTetromino The tetromino to preview.
 */
const renderPreview = (nextTetromino: Tetromino) => {
  const previewSvg = document.querySelector("#svgPreview") as SVGGraphicsElement & HTMLElement;
  previewSvg.innerHTML = "";
  const shape = nextTetromino.shape;
  // Use the same cell dimensions as the main board.
  const cellWidth = Block.WIDTH;   // For example, 20px
  const cellHeight = Block.HEIGHT; // For example, 20px
  // Center the tetromino in the preview box.
  const offsetX = (Viewport.PREVIEW_WIDTH - shape[0].length * cellWidth) / 2;
  const offsetY = (Viewport.PREVIEW_HEIGHT - shape.length * cellHeight) / 2;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const cell = document.createElementNS(previewSvg.namespaceURI, "rect");
        cell.setAttribute("x", (offsetX + col * cellWidth).toString());
        cell.setAttribute("y", (offsetY + row * cellHeight).toString());
        cell.setAttribute("width", cellWidth.toString());
        cell.setAttribute("height", cellHeight.toString());
        cell.setAttribute("fill", nextTetromino.color);
        cell.setAttribute("stroke", "black");
        previewSvg.appendChild(cell);
      }
    }
  }
};


/**
 * main() sets up the canvases, key input streams, merges them with the tick stream,
 * and starts the game loop.
 */
export function main() {
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement & HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement & HTMLElement;

  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);

  /** User input: arrow keys and spacebar */
  const key$ = fromEvent<KeyboardEvent>(document, "keydown");
  const left$ = key$.pipe(
    filter((e) => e.code === "ArrowLeft"),
    map((): Action => ({ type: "left" }))
  );
  const right$ = key$.pipe(
    filter((e) => e.code === "ArrowRight"),
    map((): Action => ({ type: "right" }))
  );
  const down$ = key$.pipe(
    filter((e) => e.code === "ArrowDown"),
    map((): Action => ({ type: "down" }))
  );
  const rotate$ = key$.pipe(
    filter((e) => e.code === "ArrowUp"),
    map((): Action => ({ type: "rotate" }))
  );
  const drop$ = key$.pipe(
    filter((e) => e.code === "Space"),
    map((): Action => ({ type: "drop" }))
  );

  // Timer stream that emits a tick action every TICK_RATE_MS milliseconds.
  const tick$ = interval(Constants.TICK_RATE_MS).pipe(map((): Action => ({ type: "tick" })));

  // Merge all action streams.
  const action$ = merge(tick$, left$, right$, down$, rotate$, drop$);

  // Update state using scan and stop the stream once gameOver is true.
  action$
    .pipe(
      scan((state: State, action: Action) => updateState(state, action), initialState),
      takeWhile((state: State) => !state.gameOver, true)
    )
    .subscribe((state: State) => {
      render(state);
      renderPreview(state.nextTetromino);
      // Show or hide the Game Over SVG based on the game state.
      if (state.gameOver) {
        gameover.setAttribute("visibility", "visible");
        console.log("Game Over!");
      } else {
        gameover.setAttribute("visibility", "hidden");
      }
    });
}

// Run main() on window load.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
