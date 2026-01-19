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
            presentation: 'formSheet', 
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.70],
            sheetInitialDetentIndex: 0,
            sheetExpandsWhenScrolledToEdge: false,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
