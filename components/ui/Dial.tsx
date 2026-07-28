/**
 * Dial — the Player's signature instrument, and a real gain dial rather
 * than a picture of one.
 *
 * - The needle points at the **current volume**, across a 270° gain sweep
 *   with a printed scale, the way a hi-fi gain knob does. The first cut
 *   swept the needle back and forth on a fixed loop that meant nothing;
 *   it looked like an instrument but did not behave like one.
 * - **Dragging** the dial sets volume (vertical travel, the standard knob
 *   gesture — true rotary tracking is fiddly near the centre and worse
 *   one-handed in the dark, which is this app's actual use scene).
 * - **Tapping** plays or pauses.
 * - While playing, the needle trembles slightly around the set level, the
 *   way a VU needle never sits perfectly still.
 *
 * The volume Slider on the Player stays: this is the expressive control,
 * and the slider remains the precise one and the one a screen reader can
 * actually operate (`accessibilityRole="adjustable"` needs a node that
 * isn't already the play/pause button).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

import { withAlpha } from '@/constants/theme';

const DIAL_SIZE = 216;
const FACE_SIZE = 176;

/** A gain sweep, not a full circle: 270° with a 90° dead zone at the
 *  bottom, which is what makes a knob read as a knob. */
const ANGLE_MIN = -135;
const ANGLE_MAX = 135;
/** 0%, 25%, 50%, 75%, 100% get a long tick — a scale you can actually
 *  read a level against. */
const TICK_COUNT = 21;
const MAJOR_EVERY = 5;

/** How far the whole dial dims at the bottom of the warming-up breath.
 *  Deliberately shallow — this is a "still waking up" signal, not a
 *  flash. */
const LOADING_DIM = 0.45;

/** Live tremble around the set level while playing. Small on purpose: the
 *  needle should look alive, not agitated, next to someone falling asleep. */
const TREMBLE_DEG = 2.2;
const TREMBLE_MS = 1400;

/** Full-scale travel distance for a drag, in points. Roughly the dial's own
 *  height, so a gesture across the control spans the whole range. */
const DRAG_RANGE_PX = 200;
/** Movement under this is a tap (play/pause), not a volume drag. */
const TAP_SLOP_PX = 6;

const angleForVolume = (v: number) => ANGLE_MIN + (ANGLE_MAX - ANGLE_MIN) * Math.max(0, Math.min(1, v));

interface DialProps {
  isPlaying: boolean;
  isLoading?: boolean;
  /** 0–1. Drives the needle. */
  volume: number;
  onVolumeChange: (volume: number) => void;
  color: string;
  reduceMotion?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function Dial({
  isPlaying,
  isLoading = false,
  volume,
  onVolumeChange,
  color,
  reduceMotion = false,
  onPress,
  accessibilityLabel,
}: DialProps) {
  const needle = useSharedValue(angleForVolume(volume));
  const tremble = useSharedValue(0);
  const glow = useSharedValue(isPlaying ? 1 : 0.35);
  const press = useSharedValue(0);
  const load = useSharedValue(isLoading ? LOADING_DIM : 1);

  // The needle follows volume. During a drag it is written directly (see the
  // PanResponder) so it tracks the finger without a timing animation
  // chasing every intermediate value.
  const dragging = useRef(false);
  useEffect(() => {
    if (dragging.current) return;
    needle.value = withTiming(angleForVolume(volume), { duration: reduceMotion ? 0 : 220 });
  }, [volume, reduceMotion, needle]);

  // Playing: a live tremble around wherever the needle is sitting.
  useEffect(() => {
    cancelAnimation(tremble);
    if (isPlaying && !reduceMotion) {
      tremble.value = withRepeat(
        withSequence(
          withTiming(TREMBLE_DEG, { duration: TREMBLE_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(-TREMBLE_DEG, { duration: TREMBLE_MS, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      tremble.value = withTiming(0, { duration: reduceMotion ? 0 : 400 });
    }
  }, [isPlaying, reduceMotion, tremble]);

  useEffect(() => {
    glow.value = withTiming(isPlaying ? 1 : 0.35, { duration: 400 });
  }, [isPlaying, glow]);

  // Warming up: the dial dims and breathes slowly rather than spinning a
  // spinner at someone about to fall asleep. Generating sound is not a
  // spinner's kind of wait, and shipping no loading affordance at all left
  // the screen looking simply unresponsive while audio decoded.
  useEffect(() => {
    cancelAnimation(load);
    if (!isLoading) {
      load.value = withTiming(1, { duration: 260 });
      return;
    }
    if (reduceMotion) {
      load.value = LOADING_DIM;
      return;
    }
    load.value = withRepeat(
      withSequence(
        withTiming(LOADING_DIM, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [isLoading, reduceMotion, load]);

  // Latest-callback refs: the PanResponder is created once (rebuilding it
  // per render swaps the live responder for a never-granted one mid-gesture
  // and drops every subsequent move — the exact bug the volume Slider shipped
  // with once already).
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const onVolumeChangeRef = useRef(onVolumeChange);
  onVolumeChangeRef.current = onVolumeChange;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const startVolume = useRef(volume);

  const applyDrag = useCallback((dy: number) => {
    // Up increases, the way every hardware fader and software knob behaves.
    const next = Math.max(0, Math.min(1, startVolume.current - dy / DRAG_RANGE_PX));
    needle.value = angleForVolume(next);
    onVolumeChangeRef.current(next);
  }, [needle]);
  const applyDragRef = useRef(applyDrag);
  applyDragRef.current = applyDrag;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Claim the gesture only once it is clearly a drag, so a plain tap
      // still reaches the play/pause path below.
      onMoveShouldSetPanResponder: (_e, g) =>
        !isLoadingRef.current && Math.abs(g.dy) > TAP_SLOP_PX,
      onPanResponderGrant: () => {
        dragging.current = true;
        startVolume.current = volumeRef.current;
      },
      onPanResponderMove: (_e, g) => {
        if (isLoadingRef.current) return;
        applyDragRef.current(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        dragging.current = false;
        const moved = Math.abs(g.dx) > TAP_SLOP_PX || Math.abs(g.dy) > TAP_SLOP_PX;
        if (!moved && !isLoadingRef.current) onPressRef.current();
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
      },
    })
  ).current;

  const handlePressIn = () => {
    press.value = withTiming(1, { duration: 90 });
  };
  const handlePressOut = () => {
    press.value = withTiming(0, { duration: 160 });
  };

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needle.value + tremble.value}deg` }],
  }));
  const faceStyle = useAnimatedStyle(() => ({
    opacity: (0.85 + glow.value * 0.15) * load.value,
    transform: [{ scale: 1 - press.value * 0.02 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * load.value,
  }));
  const rimStyle = useAnimatedStyle(() => ({
    opacity: load.value,
  }));

  const ticks = Array.from({ length: TICK_COUNT });

  return (
    <View
      {...panResponder.panHandlers}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: isLoading, disabled: isLoading }}
      style={styles.hitArea}
    >
      <View style={[styles.dial, { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2 }]}>
        {ticks.map((_, i) => {
          const isMajor = i % MAJOR_EVERY === 0;
          // Ticks span the gain sweep, not a full circle — the dead zone at
          // the bottom is what tells you which way is "off".
          const angle = ANGLE_MIN + ((ANGLE_MAX - ANGLE_MIN) / (TICK_COUNT - 1)) * i;
          return (
            <Animated.View
              key={i}
              style={[
                StyleSheet.absoluteFillObject,
                styles.tickPivot,
                { transform: [{ rotate: `${angle}deg` }] },
                rimStyle,
              ]}
            >
              <View
                style={[
                  styles.tick,
                  {
                    height: isMajor ? 9 : 5,
                    width: isMajor ? 2 : 1.5,
                    // Minor ticks were at 0.28, which disappears against a
                    // true-black night surface.
                    backgroundColor: withAlpha(color, isMajor ? 0.7 : 0.4),
                  },
                ]}
              />
            </Animated.View>
          );
        })}

        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.glowLayer,
            { borderRadius: DIAL_SIZE / 2 },
            glowStyle,
          ]}
        >
          <LinearGradient
            colors={[withAlpha(color, 0.22), withAlpha(color, 0)]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.face,
            {
              width: FACE_SIZE,
              height: FACE_SIZE,
              borderRadius: FACE_SIZE / 2,
              borderColor: withAlpha(color, 0.4),
            },
            faceStyle,
          ]}
        >
          <LinearGradient
            colors={[withAlpha(color, 0.1), withAlpha(color, 0.02)]}
            style={[StyleSheet.absoluteFill, { borderRadius: FACE_SIZE / 2 }]}
          />
          <Animated.View style={[StyleSheet.absoluteFillObject, needleStyle]}>
            <View style={[styles.needle, { backgroundColor: color }]} />
          </Animated.View>
          <View style={[styles.hub, { backgroundColor: color }]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickPivot: {
    alignItems: 'center',
  },
  tick: {
    borderRadius: 1,
  },
  glowLayer: {
    overflow: 'hidden',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  // The rotate transform on the absoluteFillObject parent pivots around
  // that view's own centre — the face's true centre — so the needle only
  // has to span from there to the rim.
  needle: {
    position: 'absolute',
    top: 8,
    bottom: '50%',
    left: '50%',
    width: 2.5,
    marginLeft: -1.25,
    borderRadius: 1.5,
  },
  hub: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    marginTop: -4,
    marginLeft: -4,
    borderRadius: 4,
  },
});
