import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
