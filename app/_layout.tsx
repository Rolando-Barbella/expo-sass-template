import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors, UI } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="login-sheet"
          options={{
            presentation: 'formSheet',
            headerShown: false,
            contentStyle: styles.loginSheetContent,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [UI.loginSheet.heightRatio],
            sheetInitialDetentIndex: 0,
            sheetExpandsWhenScrolledToEdge: false,
            sheetCornerRadius: 20,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loginSheetContent: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
});
