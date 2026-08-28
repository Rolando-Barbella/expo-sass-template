import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4FF',
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let permissionStatus = currentPermissions.status;

  if (permissionStatus !== Notifications.PermissionStatus.GRANTED) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermissions.status;
  }

  if (permissionStatus !== Notifications.PermissionStatus.GRANTED) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('Missing EAS project ID in the Expo app configuration.');
  }

  return (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;
}

type ExpoPushTicket = {
  status: 'ok' | 'error';
  message?: string;
};

export async function sendTestPushNotificationAsync() {
  const expoPushToken = await registerForPushNotificationsAsync();

  if (!expoPushToken) {
    throw new Error('Push notification permission was not granted.');
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      channelId: ANDROID_CHANNEL_ID,
      title: 'Push notifications are working 🔔',
      body: 'This test notification was sent from your Expo SaaS template.',
      data: { source: 'push-notifications-card' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo Push Service returned HTTP ${response.status}.`);
  }

  const result = (await response.json()) as { data?: ExpoPushTicket };

  if (!result.data || result.data.status === 'error') {
    throw new Error(
      result.data?.message ?? 'Expo Push Service rejected the notification.',
    );
  }

  return expoPushToken;
}
