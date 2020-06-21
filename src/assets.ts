import _1 from './assets/game/blocks.png';
import _2 from './assets/game/selectionBox.png';

export type AssetKeys = 'game.blocks' | 'game.selectionBox';
export const Assets: {[key in AssetKeys]: {asset: string; height: number; width: number}} = {
  'game.blocks': {asset: _1, width: 130, height: 149},
  'game.selectionBox': {asset: _2, width: 36, height: 20},
};
