import React from 'react';
import { Composition } from 'remotion';

import { Promo, COPY, DURATION, FPS } from './Promo';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Promo-tr"
      component={Promo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ lang: 'tr' as keyof typeof COPY }}
    />
    <Composition
      id="Promo-en"
      component={Promo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ lang: 'en-US' as keyof typeof COPY }}
    />
  </>
);
