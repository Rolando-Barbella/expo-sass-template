import * as Notifications from 'expo-notifications';
import { PropsWithChildren, useEffect } from 'react';

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.info('Notification received:', notification.request.identifier);
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.info(
          'Notification opened:',
          response.notification.request.content.data,
        );
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return children;
}
