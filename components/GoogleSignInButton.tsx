import { useThemeColor } from '@/hooks/use-theme-color';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const googleLogo = require('../assets/images/google-sign-in.png');

type GoogleSignInButtonProps = {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

export function GoogleSignInButton({ onPress, isLoading = false, disabled = false }: GoogleSignInButtonProps) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { borderColor },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <Image source={googleLogo} style={styles.logo} resizeMode="contain" />
      <ThemedText type="link">Sign in with Google</ThemedText>
      {isLoading ? <ActivityIndicator size="small" /> : <View style={styles.spacer} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  logo: {
    width: 22,
    height: 22,
  },
  spacer: {
    width: 16,
  },
});
