/**
 * Fifteen quiet seconds: the question, the four intents, the real app, the name.
 * Slow pushes and crossfades only, nothing that flashes. Says what the app does
 * and makes no promise about what the sound does to anyone.
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const FPS = 30;
export const DURATION = 15 * FPS;

const INK = '#F1ECE3';
const NIGHT = '#0A090D';
const SERIF = 'Young Serif';
const SANS = 'Schibsted Grotesk';

// The app's own typefaces; the render waits until they have loaded.
const fontsReady = delayRender('fonts');
Promise.all([
  new FontFace(SERIF, `url(${staticFile('YoungSerif.ttf')})`).load(),
  new FontFace(SANS, `url(${staticFile('SchibstedGrotesk.ttf')})`).load(),
]).then((faces) => {
  faces.forEach((face) => document.fonts.add(face));
  continueRender(fontsReady);
});

export const COPY = {
  tr: {
    question: 'Ne yapmak istiyorsun?',
    intents: ['Uyku', 'Odak', 'Rahatlama', 'Meditasyon'],
    closing: 'Hesap yok. Reklam yok. Çevrimdışı çalışır.',
  },
  'en-US': {
    question: 'What do you need?',
    intents: ['Sleep', 'Focus', 'Relax', 'Meditate'],
    closing: 'No account. No ads. Works offline.',
  },
} as const;

const INTENT_ART = ['sleep', 'focus', 'relax', 'meditate'];
const SHOTS = ['01-home', '03-player', '04-mixer'];

function useFade(duration: number, edge = 15) {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, edge, duration - edge, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const Headline: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 92 }) => (
  <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1.12, color: INK, textAlign: 'center' }}>
    {children}
  </div>
);

const Question: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
  const opacity = useFade(duration);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center', padding: 96 }}>
      <Img
        src={staticFile('signature.png')}
        style={{
          position: 'absolute',
          width: 900,
          opacity: 0.16 * opacity,
          transform: `scale(${interpolate(frame, [0, duration], [1, 1.08])})`,
        }}
      />
      <div style={{ opacity }}>
        <Headline size={112}>{text}</Headline>
      </div>
    </AbsoluteFill>
  );
};

const IntentCard: React.FC<{ art: string; name: string; duration: number }> = ({ art, name, duration }) => {
  const frame = useCurrentFrame();
  const opacity = useFade(duration, 10);
  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT, opacity }}>
      <Img
        src={staticFile(`${art}.jpg`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${interpolate(frame, [0, duration], [1.02, 1.12])})`,
        }}
      />
      <AbsoluteFill style={{ background: 'linear-gradient(transparent 45%, rgba(10,9,13,0.9))' }} />
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 80px 260px' }}>
        <Headline size={132}>{name}</Headline>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// The store screenshots already carry their own headline and phone frame, so
// they run full height with nothing added on top.
const PhoneShot: React.FC<{ src: string; duration: number }> = ({ src, duration }) => {
  const frame = useCurrentFrame();
  const opacity = useFade(duration);
  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center', opacity }}>
      <Img
        src={staticFile(src)}
        style={{
          height: '100%',
          transform: `scale(${interpolate(frame, [0, duration], [1, 1.04])})`,
        }}
      />
    </AbsoluteFill>
  );
};

const Closing: React.FC<{ line: string; duration: number }> = ({ line, duration }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center', opacity, padding: 80 }}>
      <Img
        src={staticFile('signature.png')}
        style={{
          position: 'absolute',
          width: 900,
          opacity: 0.14,
          transform: `scale(${interpolate(frame, [0, duration], [1.08, 1])})`,
        }}
      />
      <Headline size={170}>852Hz</Headline>
      <div style={{ fontFamily: SANS, fontSize: 44, color: 'rgba(241,236,227,0.78)', marginTop: 40, textAlign: 'center' }}>
        {line}
      </div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC<{ lang: keyof typeof COPY }> = ({ lang }) => {
  const { fps } = useVideoConfig();
  const copy = COPY[lang];
  const questionLen = 2 * fps;
  const intentLen = Math.round(1.1 * fps);
  const shotLen = Math.round(2.4 * fps);
  const intentsEnd = questionLen + intentLen * copy.intents.length;
  const shotsEnd = intentsEnd + shotLen * SHOTS.length;

  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT }}>
      <Sequence durationInFrames={questionLen}>
        <Question text={copy.question} duration={questionLen} />
      </Sequence>
      {copy.intents.map((name, i) => (
        <Sequence key={name} from={questionLen + intentLen * i} durationInFrames={intentLen}>
          <IntentCard art={INTENT_ART[i]} name={name} duration={intentLen} />
        </Sequence>
      ))}
      {SHOTS.map((shot, i) => (
        <Sequence key={shot} from={intentsEnd + shotLen * i} durationInFrames={shotLen}>
          <PhoneShot src={`${lang}/${shot}.png`} duration={shotLen} />
        </Sequence>
      ))}
      <Sequence from={shotsEnd}>
        <Closing line={copy.closing} duration={DURATION - shotsEnd} />
      </Sequence>
    </AbsoluteFill>
  );
};
