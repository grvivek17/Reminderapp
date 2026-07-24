import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

export const getCurrentPosition = async () => {
  try {
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude
    };
  } catch (error) {
    console.error('Error getting location', error);
    return null;
  }
};

export const scheduleNotification = async (title, body, id = 1, delayMs = 0) => {
  try {
    await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: new Date(Date.now() + delayMs) },
        }
      ]
    });
  } catch (error) {
    console.error('Error scheduling notification', error);
  }
};
