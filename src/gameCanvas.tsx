import keyboardJS from 'keyboardjs';
import {inject, observer} from 'mobx-react';
import * as React from 'react';
import {MainStoreName, MainStoreProps} from './store/main/store';
import {makeSheet, TetrisAttackAssets} from './assetManager';
import blocks from './assets/game/blocks.png';
import comboBoxes from './assets/game/comboBoxes.png';
import numbers from './assets/game/numbers.png';
import {JoyStick} from './components/joystick';
import {isMobile} from './utils/utilts';
import {FC, useCallback} from 'react';
import {EventData, JoystickManager, JoystickOutputData} from 'nipplejs';
import {GameBoard} from './gameBoard';
import {boardHeight, boardWidth, tileSize} from './constants';

const leftJoystickOptions = {
  mode: 'static',
  color: 'white',
  size: 70,
  position: {
    top: '70%',
    left: '50%',
  },
} as const;
const rightJoystickOptions = {
  mode: 'static',
  color: 'white',
  size: 70,
  position: {
    top: '70%',
    left: '50%',
  },
  lockX: true,
  lockY: true,
} as const;
const styles = {
  leftJoyStick: {
    position: 'absolute',
    height: '50%',
    width: '60%',
    bottom: 0,
    left: 0,
    background: 'transparent',
  },
  rightJoystick: {
    position: 'absolute',
    height: '50%',
    width: '40%',
    bottom: 0,
    right: 0,
    background: 'transparent',
  },
} as const;

export class GameCanvas extends React.Component {
  private board?: GameBoard;
  private canvas = React.createRef<HTMLCanvasElement>();
  private canvasContext!: CanvasRenderingContext2D;

  canvasRender() {
    this.canvasContext.clearRect(0, 0, this.canvas.current!.width, this.canvas.current!.height);
    if (!this.board) {
      window.requestAnimationFrame(() => this.canvasRender());
      return;
    }

    this.board.draw(this.canvasContext);

    window.requestAnimationFrame(() => this.canvasRender());
  }

  async componentDidMount() {
    const sheets = await Promise.all([
      makeSheet(blocks, {width: 16, height: 16}, {width: 3, height: 3}),
      makeSheet(comboBoxes, {width: 16, height: 15}, {width: 0, height: 0}),
      makeSheet(numbers, {width: 10, height: 9}, {width: 0, height: 0}),
      TetrisAttackAssets.load(),
    ]);
    const blockAssetSheet = sheets[0];
    const comboBoxesAssetSheet = sheets[1];
    const numbersAssetSheet = sheets[2];
    this.canvasContext = this.canvas.current!.getContext('2d')!;
    this.canvasContext.imageSmoothingEnabled = false;

    const maps = {
      sevenCombo: `
bgtgbg
rrbbgg
bbbrbr
rrgybt
rbbryt
yrggbb`,
      weirdDrop: `
ttbrgr
rgrgrg
rgtgrg
rgtrgr
ytytyt
`,
      slide: `
tt tgr
rg grg
rg grg
grtrgr
ytytyt
`,
      puzzles: {
        original1: [
          {board: ' r rr ', moves: 1},
          {board: '  t   \n tt t ', moves: 1},
          {board: '  gr  \n  rg  \n  rg  ', moves: 1},
          {board: '  by  \n  by  \n  yb  \n  by  \n  by  ', moves: 1},
          {board: '  g   \nggtt t', moves: 1},
          {board: '      \nrrprpp', moves: 1},
          {board: '  r   \n  r   \n  t   \n  r   \n  r   \n  tt  ', moves: 1},
          {board: '    y \n    y \n ppyp ', moves: 1},
          {board: '  t   \n  gt  \n  ggt ', moves: 1},
          {board: '  yr  \n  ry  \n  yr  \n  ry  \n  yr  ', moves: 3},
        ],
        original2: [
          {board: '  y   \n  r   \n  r   \n  y   \n  ryy ', moves: 1},
          {board: ' b    \n gb   \n bgg  ', moves: 1},
          {board: '  tt  \n pptp ', moves: 1},
          {board: '  rg  \n  rgrg', moves: 2},
          {board: '      \ntbtbtb', moves: 3},
          {board: '  t   \nttg   \nggy   \nyyr   \nrrp   \nppb   \nbbt   \nttg   \nggy   \nyyrb  \nrrbb  ', moves: 1},
          {board: '   b  \n  gb  \n bgg  ', moves: 2},
          {board: '  p   \n  p   \n  r   \n  rp  \n  pr  ', moves: 2},
          {board: '  gg  \n  yy  \n  yg  ', moves: 2},
          {board: ' rt   \n tr   \n rtrr ', moves: 2},
        ],
        original3: [
          {board: '  y   \n  r   \n  r   \n yy   \n yr y ', moves: 2},
          {board: '  t   \n  g   \n  g   \n  tgg \n  tgt ', moves: 2},
          {board: '  ty  \n  yt  \nt ty y', moves: 2},
          {board: '  r   \n  b   \n  y   \n  yb  \n  br  \n ryr  ', moves: 2},
          {board: '   y  \n   bp \n  ppb \n pyybp', moves: 3},
          {board: '   y  \n   r  \n   pyy\n   yrr\n   bpp\n   tbb\n   gtt\n   ygg\n   ryy\n  yyrr', moves: 2},
          {board: '   r  \n   p  \n   r  \n   r  \n   p  \n  pr  \n  prpp', moves: 2},
          {board: ' gr   \n rgrg ', moves: 3},
          {board: '   t  \n   t  \n  bp  \n  tt  \n  pb  \n bpb  ', moves: 2},
          {board: '   p  \n  gp  \n ggb  \n bbp  ', moves: 2},
        ],
        original4: [
          {board: '  r   \n  y   \n  r   \n brr  \n yyb  \n rbr  ', moves: 2},
          {board: '  yy  \n  bp  \n  yb  \n bpp  ', moves: 2},
          {board: '  y   \n  b   \n  b   \n  g   \n  ggy \n  byy ', moves: 3},
          {board: '  rr  \n  gtt \n  grgt', moves: 2},
          {board: '   t  \n  tp  \n  gp  \n  tg  \n  pg  \nttgp  ', moves: 3},
          {board: '      \ngbt   \npry   \nyyp   \nprt   \npggrb \nbrbbg \nttgrg \nttprp \nggbbg ', moves: 1},
          {board: '  g   \n  y   \n  y   \nyyt   \ngyggtt', moves: 2},
          {board: '  y   \n  yb  \n  rry \n  brb ', moves: 3},
          {board: '  r   \n  yr  \n  ry  \n  tt  \n  yg  \n tgg  ', moves: 3},
          {board: '    y \n    y \n    r \n   ry \n  rgt \n ggyy \n tyyt ', moves: 3},
        ],
        original5: [
          {board: '   p  \n   g  \n   g  \n   r  \n   r  \n   g  \n   r  \n   g  \n ppgpp', moves: 2},
          {board: '   pp \n  rgp \n  rbr \n bbgg ', moves: 3},
          {board: '  p   \n  yp  \n  by  \n  bt  \n  tb  \n  ptyy', moves: 3},
          {board: '  rrt \n  ryp \n  ypp \n  ptt \n  ypp ', moves: 3},
          {board: '      \nbbttbb\npgrygp\nprggyp\ntrttyt\npbggbp', moves: 5},
          {board: '      \nb b b \ny r y \np r p \ny g y \np g g \nybrby ', moves: 3},
          {board: '   b  \n   g  \n r b  \n grg  \n rgbg ', moves: 3},
          {board: '   y  \n  gg  \n  rb  \n  ry  \n ybg  \n gbr  ', moves: 3},
          {board: '  b   \n  p   \n pt   \n yy   \n tbp  \n ytb  ', moves: 3},
          {board: '  yty \nttytty\nyppypt', moves: 3},
        ],
        original6: [
          {board: ' tg   \n tb   \n br   \n gtrr \n gbgg ', moves: 3},
          {board: ' gp   \nrbp   \nbtb   \npbp   \nbgtg  \nbrrp  \npptp  ', moves: 3},
          {board: '    b \n   br \n  ybr \n  grb \n ygbr \n gyby ', moves: 4},
          {board: ' p    \n yy   \n rp   \n ry   \n tt   \n rry  \n tpyy ', moves: 4},
          {board: ' tp   \n rg   \n rr   \n gg   \n tp   \n rttp ', moves: 4},
          {board: '    t \n    b \n b  y \n t by \n typt \n pptb \n tbby ', moves: 3},
          {board: ' y    \n py   \n rr   \n yyp  \n rprr ', moves: 4},
          {board: '   r  \n ggb  \n rrg  \n trb  \n rttbr', moves: 4},
          {board: '  g   \n  p   \n  t   \n pb   \n yby  \n bpg  \n ypg  \n ptp  \n ptp  ', moves: 4},
          {board: '   b  \n  by  \n  gty \n  ryt \n  rtr \n ttrb \n grgt ', moves: 4},
        ],
      },
      big: `ytyy t\nygpttp\npprtrr\npgpggt\ntgtppg\ngppggt\npggppt\ngttpyg\ngpptpp\nyggppg\ngppttg`,
    } as const;

    // seed('a');

    this.board = new GameBoard('endless', maps.puzzles.original2[5].board);
    this.board.loadAssetSheets(blockAssetSheet, comboBoxesAssetSheet, numbersAssetSheet);
    this.board.tick();
    setInterval(() => {
      this.board!.tick();
    }, 16);

    let leftDown = false;
    let rightDown = false;
    let downDown = false;
    let upDown = false;
    let shiftDown = false;
    let enterDown = false;
    keyboardJS.bind(
      'left',
      () => {
        if (leftDown) {
          return;
        }
        leftDown = true;
        this.board!.moveLeft();
      },
      () => (leftDown = false)
    );

    keyboardJS.bind(
      'right',
      () => {
        if (rightDown) {
          return;
        }
        rightDown = true;
        this.board!.moveRight();
      },
      () => (rightDown = false)
    );

    keyboardJS.bind(
      'a',
      () => {
        if (enterDown) {
          return;
        }
        enterDown = true;
        this.board!.swap();
      },
      () => (enterDown = false)
    );

    keyboardJS.bind(
      'down',
      () => {
        if (downDown) {
          return;
        }
        downDown = true;
        this.board!.moveDown();
      },
      () => (downDown = false)
    );
    keyboardJS.bind(
      'up',
      () => {
        if (upDown) {
          return;
        }
        upDown = true;
        this.board!.moveUp();
      },
      () => (upDown = false)
    );

    keyboardJS.bind(
      'shift',
      () => {
        if (this.board!.gameMode !== 'endless') return;
        if (shiftDown) {
          return;
        }
        shiftDown = true;
        for (let i = 0; i < tileSize; i++) {
          setTimeout(() => {
            this.board!.boardOffsetPosition += 1;
          }, i * 15);
        }
      },
      () => (shiftDown = false)
    );

    this.canvasRender();
  }

  render() {
    return (
      <>
        {/*
        <button
          onClick={this.toggleSpeed}
          style={{
            border: 0,
            backgroundColor: this.state.isSlow ? 'red' : 'blue',
            color: 'white',
            fontSize: 40,
            height: '5rem',
          }}
        >
          {this.state.isSlow ? 'fast' : 'slow'}
        </button>
*/}
        <canvas
          ref={this.canvas}
          style={{display: 'flex', flex: 1, imageRendering: 'pixelated', border: 'solid 2px black'}}
          width={boardWidth * tileSize}
          height={boardHeight * tileSize}
        />
        {isMobile() && <MobileControls board={this.board} />}
      </>
    );
  }
}

const MobileControls: FC<{board?: GameBoard}> = ({board}) => {
  const managerListenerMove = useCallback((manager: JoystickManager) => {
    let canMove = true;
    const onMove = (evt: EventData, stick: JoystickOutputData) => {
      if (!canMove) return;
      canMove = false;
      switch (true) {
        case stick.vector.x < -0.3:
          board!.moveLeft();
          break;
        case stick.vector.x > 0.3:
          board!.moveRight();
          break;
        case stick.vector.y > 0.3:
          board!.moveUp();
          break;
        case stick.vector.y < -0.3:
          board!.moveDown();
          break;
      }
    };

    const onEnd = () => {
      canMove = true;
    };

    manager.on('move', onMove);
    manager.on('end', onEnd);
    return () => {
      manager.off('move', onMove);
      manager.off('end', onEnd);
    };
  }, []);

  const managerListenerShoot = useCallback((manager: any) => {
    let canSwap = true;
    const onMove = (e: any, stick: any) => {
      if (!canSwap) return;
      canSwap = false;
      board!.swap();
    };

    const onEnd = () => {
      canSwap = true;
    };

    manager.on('move', onMove);
    manager.on('end', onEnd);
    return () => {
      manager.off('move', onMove);
      manager.off('end', onEnd);
    };
  }, []);

  return (
    <>
      <JoyStick
        options={leftJoystickOptions}
        containerStyle={styles.leftJoyStick}
        managerListener={managerListenerMove}
      />
      <JoyStick
        options={rightJoystickOptions}
        containerStyle={styles.rightJoystick}
        managerListener={managerListenerShoot}
      />
    </>
  );
};
