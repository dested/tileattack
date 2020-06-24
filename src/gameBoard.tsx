import {GameTile} from './gameTile';
import {unreachable} from './types/unreachable';
import {groupBy, randomBetween, randomElement, unique} from './utils/utilts';
import {TetrisAttackAssets} from './assetManager';
import {AnimationConstants, boardHeight, boardWidth, tileSize} from './constants';
import {HashArray} from './utils/hashArray';

export type GameMode = 'endless' | 'puzzle';
export type PopAnimation = {
  matchPhase: 'blink' | 'solid' | 'pop';
  matchTimer: number;
  popAnimationIndex: number;
  popDialog: {
    comboCount: number;
    startingY: number;
    tick: number;
    x: number;
  };
  queuedPops: GameTile[];
};

export type ComboTracker = {
  aboveY: number;
  timer: number;
  x: number;
};

export type SwapAnimation = {
  swapTickCount: number;
  x1: number;
  x2: number;
  y: number;
};
export type DroppingAnimation = {
  bottomY: number;
  bouncingTiles: GameTile[];
  comboParticipatingTiles: GameTile[];
  dropBouncePhase: 'not-started' | 'regular' | 'low' | 'high' | 'mid';

  dropBounceTick: number;
  droppingPhase: 'falling' | 'stalled' | 'bouncing';
  dropTickCount: number;
  x: number;
};

export type TileColor = 'green' | 'purple' | 'red' | 'yellow' | 'teal' | 'blue';
export const GameTiles: TileColor[] = ['green', 'purple', 'red', 'yellow', 'teal', 'blue'];

type BlockGridElement = GameTile | 'empty' | 'blocked';

export class GameBoard {
  assets!: {
    block: {
      black: {[color in TileColor]: HTMLCanvasElement};
      bounceHigh: {[color in TileColor]: HTMLCanvasElement};
      bounceLow: {[color in TileColor]: HTMLCanvasElement};
      bounceMid: {[color in TileColor]: HTMLCanvasElement};
      dark: {[color in TileColor]: HTMLCanvasElement};
      popped: {[color in TileColor]: HTMLCanvasElement};
      regular: {[color in TileColor]: HTMLCanvasElement};
      transparent: {[color in TileColor]: HTMLCanvasElement};
    };
    boxes: {
      pop: HTMLCanvasElement;
      repeat: HTMLCanvasElement;
    };
    numbers: {
      10: HTMLCanvasElement;
      11: HTMLCanvasElement;
      12: HTMLCanvasElement;
      13: HTMLCanvasElement;
      14: HTMLCanvasElement;
      15: HTMLCanvasElement;
      16: HTMLCanvasElement;
      17: HTMLCanvasElement;
      18: HTMLCanvasElement;
      19: HTMLCanvasElement;
      2: HTMLCanvasElement;
      3: HTMLCanvasElement;
      4: HTMLCanvasElement;
      5: HTMLCanvasElement;
      6: HTMLCanvasElement;
      7: HTMLCanvasElement;
      8: HTMLCanvasElement;
      9: HTMLCanvasElement;
    };
  };

  boardOffsetPosition: number;
  comboCount: number = 1;
  comboTrackers: ComboTracker[] = [];
  cursor: {x: number; y: number} = {x: 0, y: 0};
  droppingColumns: DroppingAnimation[] = [];
  popAnimations: PopAnimation[] = [];
  speed = 10;
  swapAnimation?: SwapAnimation;
  tickCount = 0;
  tiles = new HashArray<GameTile>();
  topMostRow = 0;
  private _lowestVisibleRow?: number;

  constructor(public gameMode: GameMode, start?: string) {
    switch (gameMode) {
      case 'endless':
        this.boardOffsetPosition = tileSize * (boardHeight / 2);
        if (this.gameMode === 'endless') {
          for (let y = 0; y < 15; y++) {
            this.fillRandom(y);
          }
        }
        // this.boardOffsetPosition = tileSize * boardHeight;

        break;
      case 'puzzle':
        if (start) {
          const rows = start
            .split('\n')
            .map((a) => a.trimEnd())
            .filter((a) => a);

          const topPad = boardHeight - rows.length;
          for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
              if (rows[y].charAt(x) === ' ') continue;
              const color = this.charToColor(rows[y].charAt(x));
              this.tiles.push(new GameTile(this, color, true, x, topPad + y));
            }
          }
        }
        this.boardOffsetPosition = tileSize * boardHeight;
        break;
    }
  }

  get boardPaused() {
    return this.popAnimations.length > 0;
  }

  get lowestVisibleRow() {
    if (this._lowestVisibleRow !== undefined) return this._lowestVisibleRow;

    switch (this.gameMode) {
      case 'endless':
        for (let y = this.topMostRow; y < 10000; y++) {
          if (this.boardOffsetPosition - y * tileSize <= 0) {
            this._lowestVisibleRow = y - 1;
            return this._lowestVisibleRow;
          }
        }
        return 10000;
      case 'puzzle':
        this._lowestVisibleRow = Math.max(...this.tiles.map((t) => t.y)) + 1;
        return this._lowestVisibleRow;
      default:
        throw unreachable(this.gameMode);
    }
  }

  clone() {
    const board = new GameBoard(this.gameMode);
    board.assets = this.assets;
    board.boardOffsetPosition = this.boardOffsetPosition;
    board.comboCount = this.comboCount;
    board.comboTrackers = this.comboTrackers.map((a) => ({...a}));
    board.cursor = {...this.cursor};
    board.tiles = new HashArray<GameTile>();
    board.tiles.pushRange(this.tiles.map((a) => a.clone(board)));
    board.droppingColumns = this.droppingColumns.map((a) => ({
      droppingPhase: a.droppingPhase,
      dropBouncePhase: a.dropBouncePhase,
      bottomY: a.bottomY,
      x: a.x,
      dropBounceTick: a.dropBounceTick,
      dropTickCount: a.dropTickCount,
      bouncingTiles: a.bouncingTiles.map((t) => board.tiles.getByKey(t.getHash())),
      comboParticipatingTiles: a.comboParticipatingTiles.map((t) => board.tiles.getByKey(t.getHash())),
    }));
    board.popAnimations = this.popAnimations.map((a) => ({
      matchPhase: a.matchPhase,
      popAnimationIndex: a.popAnimationIndex,
      matchTimer: a.matchTimer,
      queuedPops: a.queuedPops.map((t) => board.tiles.getByKey(t.getHash())),
      popDialog: {...a.popDialog},
    }));
    board.speed = this.speed;
    board.swapAnimation = this.swapAnimation ? {...this.swapAnimation} : undefined;
    board.tickCount = this.tickCount;
    board.topMostRow = this.topMostRow;
    board._lowestVisibleRow = this._lowestVisibleRow;
    return board;
  }

  draw(context: CanvasRenderingContext2D) {
    context.save();
    context.fillStyle = '#cccccc';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.translate(0, boardHeight * tileSize - this.boardOffsetPosition);
    context.lineWidth = 1;
    for (let y = this.topMostRow; y < this.lowestVisibleRow + 1; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const tile = this.getTile(x, y);
        if (tile) tile.draw(context);
        if (y === this.lowestVisibleRow) {
          context.fillStyle = '#00000099';
          context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    const selectionBox = TetrisAttackAssets.assets['game.selectionBox'].image;
    if ((this.tickCount % AnimationConstants.cursorFlex) * 2 < AnimationConstants.cursorFlex) {
      context.drawImage(
        selectionBox,
        this.cursor.x * tileSize - 2,
        this.cursor.y * tileSize - 2,
        tileSize * 2 + 4,
        tileSize + 4
      );
    } else {
      context.drawImage(
        selectionBox,
        this.cursor.x * tileSize - 4,
        this.cursor.y * tileSize - 4,
        tileSize * 2 + 8,
        tileSize + 8
      );
    }

    for (const popAnimation of this.popAnimations) {
      if (popAnimation.popDialog.tick > 2) {
        let offset = GameBoard.getBoxOffset(popAnimation.popDialog.tick);
        if (offset === -1) {
          continue;
        }

        if (popAnimation.queuedPops.length > 3) {
          this.drawBox(
            context,
            'pop',
            popAnimation.queuedPops.length as keyof GameBoard['assets']['numbers'],
            popAnimation.popDialog.x,
            popAnimation.popDialog.startingY - offset
          );
          offset += tileSize;
        }
        if (popAnimation.popDialog.comboCount > 1) {
          this.drawBox(
            context,
            'repeat',
            popAnimation.popDialog.comboCount as keyof GameBoard['assets']['numbers'],
            popAnimation.popDialog.x,
            popAnimation.popDialog.startingY - offset
          );
        }
      }
      popAnimation.popDialog.tick++;
    }

    context.restore();
  }

  drawBox(
    context: CanvasRenderingContext2D,
    type: 'pop' | 'repeat',
    count: keyof GameBoard['assets']['numbers'],
    x: number,
    y: number
  ) {
    context.drawImage(this.assets.boxes[type], x, y, tileSize, tileSize - 1);
    switch (type) {
      case 'repeat':
        if (this.assets.numbers[count]) {
          context.drawImage(this.assets.numbers[count], x + 6, y + 3, 10, 9);
        }
        break;
      case 'pop':
        if (this.assets.numbers[count]) {
          context.drawImage(this.assets.numbers[count], x + 3, y + 3, 10, 9);
        }
        break;
      default:
        throw unreachable(type);
    }
  }

  fillRandom(y: number) {
    for (let x = 0; x < boardWidth; x++) {
      this.tiles.push(new GameTile(this, randomElement(GameTiles), true, x, y));
    }
  }

  getTile(x: number, y: number) {
    return this.tiles.getByKey(y * 1000 + x);
    // const gameTiles = this.tiles.filter((a) => a.x === x && a.y === y);
    // return gameTiles[0];
  }

  isEmpty(y: number) {
    for (let x = 0; x < boardWidth; x++) {
      if (this.getTile(x, y)) {
        return false;
      }
    }
    return true;
  }

  loadAssetSheets(
    blockAssetSheet: HTMLCanvasElement[][],
    comboBoxesAssetSheet: HTMLCanvasElement[][],
    numbersAssetSheet: HTMLCanvasElement[][]
  ) {
    function convertToColor(assets: HTMLCanvasElement[]): {[color in TileColor]: HTMLCanvasElement} {
      return {
        green: assets[0],
        purple: assets[1],
        red: assets[2],
        yellow: assets[3],
        teal: assets[4],
        blue: assets[5],
      };
    }

    this.assets = {
      block: {
        regular: convertToColor(blockAssetSheet[0]),
        bounceHigh: convertToColor(blockAssetSheet[1]),
        bounceMid: convertToColor(blockAssetSheet[2]),
        bounceLow: convertToColor(blockAssetSheet[3]),
        dark: convertToColor(blockAssetSheet[4]),
        popped: convertToColor(blockAssetSheet[5]),
        transparent: convertToColor(blockAssetSheet[6]),
        black: convertToColor(blockAssetSheet[7]),
      },
      boxes: {
        pop: comboBoxesAssetSheet[0][0],
        repeat: comboBoxesAssetSheet[0][1],
      },
      numbers: {
        2: numbersAssetSheet[0][0],
        3: numbersAssetSheet[0][1],
        4: numbersAssetSheet[0][2],
        5: numbersAssetSheet[0][3],
        6: numbersAssetSheet[0][4],
        7: numbersAssetSheet[0][5],
        8: numbersAssetSheet[0][6],
        9: numbersAssetSheet[0][7],
        10: numbersAssetSheet[0][8],
        11: numbersAssetSheet[0][9],
        12: numbersAssetSheet[0][10],
        13: numbersAssetSheet[0][11],
        14: numbersAssetSheet[0][13],
        15: numbersAssetSheet[0][14],
        16: numbersAssetSheet[0][15],
        17: numbersAssetSheet[0][16],
        18: numbersAssetSheet[0][17],
        19: numbersAssetSheet[0][18],
      },
    };
  }

  moveDown() {
    if (this.cursor.y >= this.lowestVisibleRow - 1) {
      return false;
    }
    this.cursor.y++;
    return true;
  }

  moveLeft() {
    if (this.cursor.x <= 0) {
      return false;
    }
    this.cursor.x--;
    return true;
  }

  moveRight() {
    if (this.cursor.x >= boardWidth - 2) {
      return false;
    }

    this.cursor.x++;
    return true;
  }

  moveUp() {
    if (this.cursor.y < this.topMostRow - 1) {
      return false;
    }
    this.cursor.y--;
    return true;
  }

  swap(): boolean {
    if (this.swapAnimation) {
      return false;
    }
    const x = this.cursor.x;
    const y = this.cursor.y;
    const tile = this.getTile(x, y);
    const tileRight = this.getTile(x + 1, y);
    if (!tile && !tileRight) {
      return false;
    }
    if (tile && !tileRight) {
      if (this.droppingColumns.find((a) => a.x === x + 1 && a.bottomY === y - 1)) {
        // cant swap bottom of the dropped column while its falling
        return false;
      }
    }
    if (!tile && tileRight) {
      if (this.droppingColumns.find((a) => a.x === x && a.bottomY === y - 1)) {
        // cant swap bottom of the dropped column while its falling
        return false;
      }
    }

    if (
      this.popAnimations.find(
        (p) =>
          p.matchPhase === 'pop' &&
          p.popAnimationIndex === p.queuedPops.length - 1 &&
          p.queuedPops.some((q) => (q.x === x || q.x === x + 1) && q.y > y)
      )
    ) {
      // cant swap that column before the last pop happens
      return false;
    }

    if ((!tile || tile.swappable) && (!tileRight || tileRight.swappable)) {
      this.swapAnimation = {
        swapTickCount: AnimationConstants.swapTicks,
        x1: x,
        x2: x + 1,
        y,
      };
      tile?.setSwappable(false);
      tileRight?.setSwappable(false);
      return true;
    }
    return false;
  }

  tick() {
    this.tickCount++;
    this._lowestVisibleRow = undefined;

    // this.runAutoSwapper();
    this.pushUpBoard();
    this.makeSureBoardIsFull();
    this.tickTiles();
    this.updateSwap();
    this.updatePop();

    this.testMatches();
    this.dropPieces();
    this.findNewDrops();
  }
  toString(): string {
    let str = '';
    for (let y = 0; y < this.lowestVisibleRow; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const tile = this.tiles.afind((a) => a.x === x && a.y === y);
        if (!tile) {
          str += ' ';
        } else {
          switch (tile.color) {
            case 'green':
              str += 'g';
              break;
            case 'purple':
              str += 'p';
              break;
            case 'red':
              str += 'r';
              break;
            case 'yellow':
              str += 'y';
              break;
            case 'teal':
              str += 't';
              break;
            case 'blue':
              str += 'b';
              break;
          }
        }
      }
      str += '\n';
    }
    return str;
  }

  private buildBlockGrid() {
    const blockGrid: BlockGridElement[][] = [];
    for (let y = this.topMostRow; y < this.lowestVisibleRow + 1; y++) {
      blockGrid[y] = [];
      for (let x = 0; x < boardWidth; x++) {
        const tile = this.getTile(x, y);
        if (!tile) blockGrid[y][x] = 'empty';
        else if (!tile.swappable || this.tileIsFloating(tile)) blockGrid[y][x] = 'blocked';
        else blockGrid[y][x] = tile;
      }
    }
    return blockGrid;
  }

  private charToColor(s: string): TileColor {
    switch (s) {
      case 'g':
        return 'green';
      case 'p':
        return 'purple';
      case 'r':
        return 'red';
      case 'y':
        return 'yellow';
      case 't':
        return 'teal';
      case 'b':
        return 'blue';
    }
    throw new Error('Color not found');
  }

  private dropPieces() {
    for (let i = this.droppingColumns.length - 1; i >= 0; i--) {
      const droppingPiece = this.droppingColumns[i];

      if (droppingPiece.droppingPhase === 'bouncing') {
        if (droppingPiece.dropBounceTick > 0) {
          droppingPiece.dropBounceTick--;
          if (droppingPiece.dropBouncePhase === 'low' && droppingPiece.dropBounceTick === 2) {
            for (const gameTile of droppingPiece.bouncingTiles) {
              if (!gameTile.matched) gameTile.setSwappable(true);
            }
            for (const comboParticipatingTile of droppingPiece.comboParticipatingTiles) {
              comboParticipatingTile.setComboViable(true);
            }
          }
        } else if (droppingPiece.dropBounceTick === 0) {
          if (this.popAnimations.length > 0) {
            for (let j = droppingPiece.bouncingTiles.length - 1; j >= 0; j--) {
              const gameTile = droppingPiece.bouncingTiles[j];
              if (this.popAnimations.find((a) => a.queuedPops.some((t) => t === gameTile))) {
                droppingPiece.bouncingTiles.splice(j, 1);
              }
            }
          }

          switch (droppingPiece.dropBouncePhase) {
            case 'regular':
              droppingPiece.dropBounceTick = AnimationConstants.dropBounceTicks;
              droppingPiece.dropBouncePhase = 'low';
              for (const gameTile of droppingPiece.bouncingTiles) {
                gameTile.drawType = 'bounce-low';
              }
              break;
            case 'low':
              droppingPiece.dropBounceTick = AnimationConstants.dropBounceTicks;
              droppingPiece.dropBouncePhase = 'high';
              for (const gameTile of droppingPiece.bouncingTiles) {
                gameTile.drawType = 'bounce-high';
              }
              break;
            case 'high':
              droppingPiece.dropBounceTick = AnimationConstants.dropBounceTicks;
              droppingPiece.dropBouncePhase = 'mid';
              for (const gameTile of droppingPiece.bouncingTiles) {
                gameTile.drawType = 'bounce-mid';
              }
              break;
            case 'mid':
              for (const gameTile of droppingPiece.bouncingTiles) {
                gameTile.drawType = 'regular';
              }
              this.droppingColumns.splice(i, 1);
              break;
          }
        }
      } else {
        if (droppingPiece.dropTickCount > 0) {
          droppingPiece.dropTickCount--;
        } else if (droppingPiece.dropTickCount === 0) {
          if (
            this.getTile(droppingPiece.x, droppingPiece.bottomY + 1) ||
            droppingPiece.bottomY + 1 >= this.lowestVisibleRow
          ) {
            // we started to fall but something is below us now so we're done for now.
            this.droppingColumns.splice(i, 1);
            continue;
          }

          droppingPiece.droppingPhase = 'falling';
          for (let y = droppingPiece.bottomY; y >= this.topMostRow; y--) {
            const tile = this.getTile(droppingPiece.x, y);
            if (tile) {
              if (this.isSwapping(tile)) {
                break;
              }
              const oldHash = tile.getHash();
              tile.setY(tile.y + 1);
              this.tiles.reassign(oldHash, tile);
            }
          }
          droppingPiece.bottomY += 1;
          if (
            this.getTile(droppingPiece.x, droppingPiece.bottomY + 1) ||
            droppingPiece.bottomY + 1 >= this.lowestVisibleRow
          ) {
            droppingPiece.bouncingTiles = [];

            for (let y = this.topMostRow + 1; y <= droppingPiece.bottomY; y++) {
              const tile = this.getTile(droppingPiece.x, y);
              if (tile) {
                droppingPiece.bouncingTiles.push(tile);
                tile.setSwappable(false);
              }
            }
            droppingPiece.dropBounceTick = 1;
            droppingPiece.dropBouncePhase = 'regular';
            droppingPiece.droppingPhase = 'bouncing';
          } else {
            droppingPiece.dropTickCount = 0;
          }
        }
      }
    }
  }

  private findNewDrops() {
    const lowestRow = this.lowestVisibleRow;
    for (let y = this.topMostRow; y < lowestRow; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const tile = this.getTile(x, y);
        if (tile && tile.swappable) {
          if (
            lowestRow > tile.y + 1 &&
            !this.getTile(tile.x, tile.y + 1) &&
            !(
              this.swapAnimation?.y === tile.y + 1 &&
              (this.swapAnimation?.x1 === tile.x || this.swapAnimation?.x2 === tile.x)
            )
          ) {
            tile.setSwappable(false);
            const fellBecauseOfPop = this.comboTrackers.find((a) => a.x === tile.x && tile.y < a.aboveY);

            const comboParticipatingTiles: GameTile[] = [];
            if (fellBecauseOfPop) {
              for (let fallingY = tile.y; fallingY >= this.topMostRow; fallingY--) {
                const fallingTile = this.getTile(tile.x, fallingY);
                if (fallingTile) comboParticipatingTiles.push(fallingTile);
              }
            }

            this.droppingColumns.push({
              dropTickCount: AnimationConstants.dropStallTicks,
              bouncingTiles: [],
              dropBounceTick: 0,
              x: tile.x,
              bottomY: tile.y,
              dropBouncePhase: 'not-started',
              droppingPhase: 'stalled',
              comboParticipatingTiles,
            });
          }
        }
      }
    }
    if (this.droppingColumns.length === 0 && this.popAnimations.length === 0) {
      this.comboCount = 1;
    }
    for (let i = this.comboTrackers.length - 1; i >= 0; i--) {
      this.comboTrackers[i].timer--;
      if (this.comboTrackers[i].timer === 0) {
        this.comboTrackers.splice(i, 1);
      }
    }
  }

  private isSwapping(tile: GameTile) {
    if (!this.swapAnimation) return false;
    return this.swapAnimation.y === tile.y && (tile.x === this.swapAnimation.x1 || tile.x === this.swapAnimation.x2);
  }

  private makeSureBoardIsFull() {
    if (this.gameMode === 'endless') {
      const currentLowestY = this.lowestVisibleRow;
      for (let y = this.topMostRow; y < currentLowestY; y++) {
        if (this.isEmpty(y)) {
          this.topMostRow = y;
        } else {
          /*
          if (boardHeight * tileSize - this.boardOffsetPosition - this.rows[this.topMostRow].tiles[0].drawY < 0) {
            // alert('dead');
          }
*/
          break;
        }
      }

      if (this.boardOffsetPosition % tileSize === 0) {
        let lowestY = 0;
        for (const tile of this.tiles.array) {
          if (lowestY < tile.y) {
            lowestY = tile.y;
          }
        }
        const maxY = lowestY + 1;
        if (maxY - this.topMostRow < 15) {
          for (let y = 0; y < 15 - (maxY - this.topMostRow); y++) {
            this.fillRandom(maxY + y);
          }
        }
      }
    }
  }

  private popTile(tile: GameTile) {
    if (!this.tiles.exists(tile)) {
      throw new Error('bad pop');
    } else {
      this.tiles.removeItem(tile);
    }
  }

  private pushUpBoard() {
    if (!this.boardPaused && this.gameMode === 'endless') {
      if (this.tickCount % (60 - this.speed) === 0) {
        this.boardOffsetPosition += 1;
      }
    }
  }

  private runAutoSwapper() {
    if (!this.swapAnimation) {
      let count = 0;
      while (count < 10) {
        this.cursor.x = randomElement([0, 1, 2, 3, 4]);
        this.cursor.y = randomBetween(this.topMostRow, this.lowestVisibleRow);
        if (this.swap()) {
          break;
        }
        count++;
      }
    }
  }

  private testMatches() {
    const blockGrid = this.buildBlockGrid();

    let queuedPops: GameTile[] = [];
    for (let y = this.topMostRow; y < this.lowestVisibleRow; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const tile = blockGrid[y][x];
        if (tile === 'empty' || tile === 'blocked') continue;
        let total: number;
        if (tile.x < boardWidth - 1) {
          total = this.testTile(blockGrid, queuedPops, tile.color, 'right', tile.x + 1, tile.y, 1);
          if (total >= 3) {
            queuedPops.push(tile);
          }
        }
        total = this.testTile(blockGrid, queuedPops, tile.color, 'down', tile.x, tile.y + 1, 1);
        if (total >= 3) {
          queuedPops.push(tile);
        }
      }
    }
    queuedPops = unique(queuedPops);
    for (const queuedPop of queuedPops) {
      queuedPop.matched = true;
      queuedPop.setSwappable(false);
    }

    if (queuedPops.length > 0) {
      const topMostLeftMostTile = [...queuedPops].sort((a, b) => a.y * boardWidth + a.x - (b.y * boardWidth + b.x))[0];
      let triggeredCombo = false;
      if (queuedPops.some((a) => a.comboViable)) {
        triggeredCombo = true;
        this.comboCount++;
      }
      const popAnimation: PopAnimation = {
        queuedPops: queuedPops.reverse(),
        popAnimationIndex: 0,
        matchPhase: 'blink',
        matchTimer: AnimationConstants.matchBlinkTicks,
        popDialog: {
          startingY: topMostLeftMostTile.drawY,
          x: topMostLeftMostTile.drawX,
          comboCount: triggeredCombo ? this.comboCount : 1,
          tick: 0,
        },
      };
      this.popAnimations.push(popAnimation);
    }

    for (const tile of this.tiles) {
      tile.setComboViable(false);
    }
  }

  private testTile(
    blockGrid: BlockGridElement[][],
    queuedPops: GameTile[],
    color: GameTile['color'],
    direction: 'left' | 'right' | 'up' | 'down',
    x: number,
    y: number,
    count: number
  ): number {
    const tile = blockGrid![y][x];
    if (tile === 'empty' || tile === 'blocked' || !tile) return count;

    switch (direction) {
      case 'left':
        if (tile.color === color) {
          const total = this.testTile(blockGrid, queuedPops, color, 'left', x - 1, y, count + 1);
          if (total >= 3) {
            queuedPops.push(tile);
          }
          return total;
        }
        return count;
      case 'right':
        if (tile.color === color) {
          const total = this.testTile(blockGrid, queuedPops, color, 'right', x + 1, y, count + 1);
          if (total >= 3) {
            queuedPops.push(tile);
          }
          return total;
        }
        return count;
      case 'up':
        if (tile.color === color) {
          const total = this.testTile(blockGrid, queuedPops, color, 'up', x, y - 1, count + 1);
          if (total >= 3) {
            queuedPops.push(tile);
          }
          return total;
        }
        return count;
      case 'down':
        if (y < this.lowestVisibleRow && tile.color === color) {
          const total = this.testTile(blockGrid, queuedPops, color, 'down', x, y + 1, count + 1);
          if (total >= 3) {
            queuedPops.push(tile);
          }
          return total;
        }
        return count;
      default:
        throw unreachable(direction);
    }
  }

  private tickTiles() {
    for (let y = this.lowestVisibleRow; y >= this.topMostRow; y--) {
      for (let x = 0; x < boardWidth; x++) {
        const tile = this.getTile(x, y);
        tile?.tick();
      }
    }
  }

  private tileIsFloating(tile: GameTile) {
    return (
      this.droppingColumns.find((a) => a.x === tile.x && a.dropBouncePhase === 'not-started') ||
      (!this.getTile(tile.x, tile.y + 1) && tile.y > this.lowestVisibleRow)
    );
  }

  private updatePop() {
    for (let i = this.popAnimations.length - 1; i >= 0; i--) {
      const popAnimation = this.popAnimations[i];
      switch (popAnimation.matchPhase) {
        case 'blink':
          if (popAnimation.matchTimer > 0) {
            popAnimation.matchTimer--;
          } else {
            popAnimation.matchPhase = 'solid';
            popAnimation.matchTimer = AnimationConstants.matchSolidTicks;
          }
          break;
        case 'solid':
          if (popAnimation.matchTimer > 0) {
            popAnimation.matchTimer--;
          } else {
            popAnimation.matchPhase = 'pop';
            popAnimation.matchTimer = AnimationConstants.matchPopTicksEach;
          }
          break;
        case 'pop':
          if (popAnimation.matchTimer > 0) {
            popAnimation.matchTimer--;
          } else {
            if (popAnimation.popAnimationIndex < popAnimation.queuedPops.length - 1) {
              popAnimation.popAnimationIndex++;
              popAnimation.matchPhase = 'pop';
              popAnimation.matchTimer = AnimationConstants.matchPopTicksEach;
            } else {
              this.popAnimations.splice(i, 1);

              for (const group of groupBy(popAnimation.queuedPops, (a) => a.x)) {
                this.comboTrackers.push({
                  x: group.key,
                  timer: 2,
                  aboveY: Math.max(...group.items.map((a) => a.y)),
                });
              }

              for (const tile of popAnimation.queuedPops) {
                this.popTile(tile);
              }
              continue;
            }
          }
          break;
      }

      for (const tile of popAnimation.queuedPops) {
        switch (popAnimation.matchPhase) {
          case 'blink':
            tile.drawType = popAnimation.matchTimer % 2 === 0 ? 'matched' : 'matched-blink';
            break;
          case 'solid':
            if (popAnimation.matchTimer > 0) {
              tile.drawType = 'popping';
            }
            break;
          case 'pop':
            if (popAnimation.matchTimer > 0) {
              const topPop = popAnimation.queuedPops[popAnimation.popAnimationIndex];
              if (topPop?.x === tile.x && topPop?.y === tile.y) {
                tile.drawType = 'popped';
              } else {
                if (tile.drawType !== 'popped') tile.drawType = 'popping';
              }
            }
            break;
          case undefined:
            break;
        }
      }
    }
  }

  private updateSwap() {
    if (this.swapAnimation) {
      const tile1 = this.getTile(this.swapAnimation.x1, this.swapAnimation.y);
      const tile2 = this.getTile(this.swapAnimation.x2, this.swapAnimation.y);
      if (this.swapAnimation.swapTickCount > 0) {
        this.swapAnimation.swapTickCount--;
        const swapPercent = 1 - this.swapAnimation.swapTickCount / AnimationConstants.swapTicks;
        if (tile1) {
          tile1.drawX = tile1.x * tileSize + tileSize * swapPercent;
        }
        if (tile2) {
          tile2.drawX = tile2.x * tileSize - tileSize * swapPercent;
        }
      } else if (this.swapAnimation.swapTickCount === 0) {
        let tile1OldHash: number | undefined;
        let tile2OldHash: number | undefined;
        if (tile1) {
          tile1OldHash = tile1.getHash();
          tile1.setX(this.swapAnimation.x2);
          tile1.setSwappable(true);
        }
        if (tile2) {
          tile2OldHash = tile2.getHash();
          tile2.setX(this.swapAnimation.x1);
          tile2.setSwappable(true);
        }
        if (tile1OldHash !== undefined && tile2OldHash !== undefined) {
          this.tiles.swapItems(tile1, tile2);
        } else if (tile1OldHash !== undefined) {
          this.tiles.reassign(tile1OldHash, tile1);
        } else if (tile2OldHash !== undefined) {
          this.tiles.reassign(tile2OldHash, tile2);
        }
        this.swapAnimation = undefined;
      }
    }
  }

  static getBoxOffset(tick: number) {
    if (tick < 7) {
      return tick - 2;
    } else if (tick < 7) {
      return 5 + Math.ceil((tick - 7) / 2);
    } else if (tick < 7 + 8) {
      return 9 + Math.ceil((tick - 7 - 8) / 3);
    } else if (tick < 7 + 8 + 32) {
      return 13 + Math.ceil((tick - 7 - 8 - 8) / 4);
    } else if (tick < 7 + 8 + 32 + 30) {
      return 20;
    } else {
      return -1;
    }
  }
}
