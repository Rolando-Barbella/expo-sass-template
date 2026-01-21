import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Colors } from '@/constants/theme';

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
            contentStyle: { backgroundColor: Colors.light.background, flex: 1 },
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.50],
            sheetInitialDetentIndex: 0,
            sheetExpandsWhenScrolledToEdge: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
