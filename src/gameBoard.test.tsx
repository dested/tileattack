import React from 'react';
import {GameBoard} from './gameBoard';
import {seed} from './utils/utilts';

test('renders learn react link', () => {
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
  const board = new GameBoard('endless');
  for (let i = 0; i < 14800; i++) {
    board.tick();
  }
  expect(board.toString()).toEqual(deterministic);
});
