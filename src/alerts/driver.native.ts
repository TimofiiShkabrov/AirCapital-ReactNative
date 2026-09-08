import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
const CHANNEL = "capital-changes";
Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
}) });
export async function requestAlerts() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "AirCapital", importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: false, allowBadge: false },
  });
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
export async function sendAlert(title: string, body: string) {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) return false;
  // No account names, balances or API data on the lock screen, and no remote push tokens.
  await Notifications.scheduleNotificationAsync({ content: { title, body, sound: false },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL } : null });
  return true;
}
