import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor: _darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = lightColor ?? Colors.light.background;

  return <View style={[styles.container, { backgroundColor }, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
});
