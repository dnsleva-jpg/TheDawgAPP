import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getOnboardingData } from '../onboarding/onboardingStorage';
import { getChallengeForDay } from '../data/challenges';
import { getStartDate, getCalendarDayNumber } from './rewireManager';
import { getStreakData } from './streakManager';

// ─── Configure notification handler (call once at app start) ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Map practiceTime preference to notification hour ───
const TIME_TO_HOUR: Record<string, number> = {
  Morning: 8,
  Afternoon: 13,
  Evening: 19,
  'It varies': 9,
};

/**
 * Schedule (or reschedule) the daily challenge notification.
 * Cancels all existing scheduled notifications first, then sets a new daily trigger.
 */
export async function scheduleDailyNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Cancel existing
    await Notifications.cancelAllScheduledNotificationsAsync();

    const onboarding = await getOnboardingData();
    const hour = TIME_TO_HOUR[onboarding.practiceTime ?? ''] ?? 9;

    // Get tomorrow's challenge for the notification body
    const startDate = await getStartDate();
    let title = "Time to DO NOTHIN.";
    let body = "Your daily challenge is waiting.";

    if (startDate) {
      const todayDay = getCalendarDayNumber(startDate);
      const tomorrowChallenge = getChallengeForDay(todayDay + 1);
      if (tomorrowChallenge) {
        title = `Day ${todayDay + 1}: ${tomorrowChallenge.title}`;
        body = tomorrowChallenge.duration;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  } catch {
    // Notification scheduling failed — non-critical
  }
}

/**
 * Schedule a streak-save reminder for 8 PM if the user hasn't completed
 * a session today. Call this in the evening check or after app foreground.
 */
export async function scheduleStreakReminder(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const streakData = await getStreakData();
    if (streakData.currentStreak === 0) return; // No streak to protect

    const today = new Date().toISOString().split('T')[0];
    if (streakData.lastSessionDate === today) return; // Already completed today

    // Schedule for 8 PM tonight
    const now = new Date();
    const reminder = new Date(now);
    reminder.setHours(20, 0, 0, 0);
    if (reminder <= now) return; // Already past 8 PM

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${streakData.currentStreak}-day streak at risk!`,
        body: "Do a quick session to keep your streak alive.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder,
      },
    });
  } catch {
    // Non-critical
  }
}

/**
 * Schedule a Focus Check notification for the next check day.
 * Focus Checks happen every 4 days (day 1, 5, 9, 13, ...).
 */
export async function scheduleFocusCheckNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const startDate = await getStartDate();
    if (!startDate) return;

    const currentDay = getCalendarDayNumber(startDate);

    // Find next Focus Check day (every 4 days starting at 1)
    let nextCheckDay = 1;
    while (nextCheckDay <= currentDay) {
      nextCheckDay += 4;
    }
    if (nextCheckDay > 90) return; // Program complete

    // Calculate the date of the next check day
    const start = new Date(startDate + 'T00:00:00');
    const nextDate = new Date(start);
    nextDate.setDate(nextDate.getDate() + nextCheckDay - 1);
    nextDate.setHours(10, 0, 0, 0); // 10 AM

    if (nextDate <= new Date()) return; // Already past

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus Check Ready',
        body: `Day ${nextCheckDay} — see how your focus has changed since your last check.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDate,
      },
    });
  } catch {
    // Non-critical
  }
}

/**
 * Call after a session completes to reschedule notifications
 * (removes today's streak reminder since it's no longer needed).
 */
export async function rescheduleAfterSession(): Promise<void> {
  await scheduleDailyNotification();
  await scheduleFocusCheckNotification();
}
