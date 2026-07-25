import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';

import * as haptics from '@/lib/haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Routed through the setting like every other haptic. A tab press is
        // the most repeated touch in the app and the easiest one to resent,
        // so it must be as switchable as the rest.
        haptics.select();
        props.onPressIn?.(ev);
      }}
    />
  );
}
