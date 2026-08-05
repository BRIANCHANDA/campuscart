import { useEffect, useRef, type JSX, type ReactNode } from "react";
import { Animated } from "react-native";

/**
 * Entrance animation — fade + rise. Pass `index` for a staggered cascade
 * across a list (each item starts a little later than the one before).
 */
export function FadeInUp({
  children, index = 0, style,
}: {
  children: ReactNode;
  index?: number;
  style?: object;
}): JSX.Element {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 8) * 55,
      useNativeDriver: true,
    }).start();
  }, [v, index]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
