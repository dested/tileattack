import React from 'react';
import {GameBoard} from './gameBoard';
import {seed} from './utils/utilts';

test('deterministic', () => {
  const deterministic = `      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
g     
p     
tr  b 
bpygr 
rrtptp
rpgpy 
gbytp 
yrprgy
prtgby
ypptrt
rbygtp
ggybpy
bpgybt
rrgybp
      
`;

  seed('gccd');
  console.time('ticks');
  const board = new GameBoard('endless');
  for (let i = 0; i < 14800; i++) {
    board.tick();
  }
  console.timeEnd('ticks');
  expect(board.toString()).toEqual(deterministic);
});
test('clone', () => {
  seed('dcd');
  console.time('ticksclone');
  const board = new GameBoard('endless');
  for (let i = 0; i < 1000; i++) {
    board.tick();
    board.clone();
  }
  console.timeEnd('ticksclone');
  expect(true).toEqual(true);
});
