import * as React from 'react';
import {withRouter} from 'react-router-dom';
import {GameCanvas} from './gameCanvas';
import {FC} from 'react';

export const Component:FC = () => (
  <div style={{display: 'flex', flex: 1, justifyContent: 'center'}}>
    <div
      style={{
        height: '100%',
        position: 'fixed',
        width: window.innerHeight > window.innerWidth ? '100vw' : '30vw',
        flexDirection: 'column',
        display: 'flex',
      }}
    >
      <GameCanvas/>
    </div>
  </div>
);

export let Builder = withRouter(Component);
