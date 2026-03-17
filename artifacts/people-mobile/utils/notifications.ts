import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MEETING_KEY = (personId: string) => `notif_${personId}`;
const BIRTHDAY_KEY = (personId: string) => `notif_birthday_${personId}`;
const CUSTOM_DATE_KEY = (personId: string, dateId: string) => `notif_custom_${personId}_${dateId}`;

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelStoredNotifications(key: string): Promise<void> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return;
  try {
    const ids: string[] = JSON.parse(stored);
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  } catch {
    await Notifications.cancelScheduledNotificationAsync(stored);
  }
  await AsyncStorage.removeItem(key);
}

async function scheduleAnnualNotifications(
  key: string,
  title: string,
  body: string,
  month: number,
  day: number,
): Promise<void> {
  await cancelStoredNotifications(key);
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const ids: string[] = [];
  const now = new Date();
  let year = now.getFullYear();

  for (let i = 0; i < 5; i++) {
    const trigger = new Date(year, month - 1, day, 9, 0, 0);
    if (trigger.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
      ids.push(id);
    }
    year++;
  }

  if (ids.length > 0) {
    await AsyncStorage.setItem(key, JSON.stringify(ids));
  }
}

export async function scheduleNextMeetingNotification(
  personId: string,
  personName: string,
  date: string,
  time: string,
): Promise<void> {
  await cancelStoredNotifications(MEETING_KEY(personId));

  if (Platform.OS === 'web') return;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const trigger = new Date(year, month - 1, day, hour, minute, 0);

  if (trigger.getTime() <= Date.now()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Meeting Reminder',
      body: `You're meeting ${personName} today at ${time}`,
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });

  await AsyncStorage.setItem(MEETING_KEY(personId), JSON.stringify([id]));
}

export async function cancelNextMeetingNotification(personId: string): Promise<void> {
  await cancelStoredNotifications(MEETING_KEY(personId));
}

export async function scheduleBirthdayNotification(
  personId: string,
  personName: string,
  birthday: string,
): Promise<void> {
  const [, month, day] = birthday.split('-').map(Number);
  await scheduleAnnualNotifications(
    BIRTHDAY_KEY(personId),
    `🎂 ${personName}'s Birthday!`,
    `Today is ${personName}'s birthday — don't forget to wish them well!`,
    month,
    day,
  );
}

export async function cancelBirthdayNotification(personId: string): Promise<void> {
  await cancelStoredNotifications(BIRTHDAY_KEY(personId));
}

export async function scheduleCustomDateNotification(
  personId: string,
  personName: string,
  dateId: string,
  label: string,
  date: string,
): Promise<void> {
  const [, month, day] = date.split('-').map(Number);
  await scheduleAnnualNotifications(
    CUSTOM_DATE_KEY(personId, dateId),
    `📅 ${label}`,
    `Today marks "${label}" for ${personName}`,
    month,
    day,
  );
}

export async function cancelCustomDateNotification(personId: string, dateId: string): Promise<void> {
  await cancelStoredNotifications(CUSTOM_DATE_KEY(personId, dateId));
}
