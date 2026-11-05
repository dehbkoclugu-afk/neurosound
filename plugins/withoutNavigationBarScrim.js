/**
 * Removes the grey band Android paints behind three-button navigation.
 *
 * React Native's edge-to-edge setup turns on `isNavigationBarContrastEnforced`
 * (WindowUtil.kt), so the system lays its own translucent scrim over the tab
 * bar's bottom inset and the app ends in a grey strip that matches nothing.
 * The tab bar already paints that inset itself, and app/_layout.tsx sets the
 * button colour from the theme, so the scrim adds nothing. It runs after
 * super.onCreate because that is where React Native switches it on.
 */

const { withMainActivity } = require('expo/config-plugins');

const ANCHOR = 'super.onCreate(null)';
const LINE =
  'if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) window.isNavigationBarContrastEnforced = false';

module.exports = function withoutNavigationBarScrim(config) {
  return withMainActivity(config, (config) => {
    const source = config.modResults.contents;
    if (source.includes(LINE)) return config;
    if (!source.includes(ANCHOR)) {
      throw new Error(`withoutNavigationBarScrim: "${ANCHOR}" not found in MainActivity`);
    }
    config.modResults.contents = source.replace(ANCHOR, `${ANCHOR}\n    ${LINE}`);
    return config;
  });
};
