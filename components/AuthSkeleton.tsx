import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Colors, UI } from '@/constants/theme';

export function AuthSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.light.skeletonBase, Colors.light.skeletonHighlight],
  });

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[styles.button, styles.google, { backgroundColor }]} />
      <Animated.View style={[styles.button, styles.apple, { backgroundColor }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderRadius: UI.radii.authButton,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  google: {
    height: 44,
  },
  apple: {
    width: '100%',
    height: 50,
    marginTop: 12,
  },
});
