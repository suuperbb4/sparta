import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS, Main, totalFrames} from './Main';

const Root: React.FC = () =>
  React.createElement(Composition, {
    id: 'Main',
    component: Main,
    durationInFrames: totalFrames(),
    fps: FPS,
    width: 1920,
    height: 1080,
  });

registerRoot(Root);
