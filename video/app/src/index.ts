import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS, Main, totalFrames} from './Main';
import {EP01} from './episodes/ep01';
import {EP02} from './episodes/ep02';

// 편마다 Composition 하나: npx remotion render Ep02 out/ep02.mp4
const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    [EP01, EP02].map((ep) =>
      React.createElement(Composition, {
        key: ep.id,
        id: ep.id.replace('ep', 'Ep'),
        component: Main as React.FC<any>,
        defaultProps: {ep},
        durationInFrames: totalFrames(ep),
        fps: FPS,
        width: 1920,
        height: 1080,
      }),
    ),
  );

registerRoot(Root);
