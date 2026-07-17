// Browser Notification Utility for UTeM ATech
// Handles permission requests, scheduling, and sending of activity reminders

const NOTIFICATION_ICON = '/favicon.ico';
const APP_NAME = 'UTeM ATech';

/**
 * Request browser notification permission from the user.
 * Returns true if granted, false otherwise.
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications.');
        return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

/**
 * Check current notification permission status.
 */
export const getNotificationPermission = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
};

/**
 * Send an immediate browser notification.
 */
export const sendNotification = (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const notification = new Notification(title, {
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        ...options,
    });
    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);
    return notification;
};

/**
 * Schedule a notification at a specific Date object.
 * Returns a timeout ID you can use to cancel it.
 */
export const scheduleNotification = (fireAt, title, options = {}) => {
    const now = Date.now();
    const delay = fireAt.getTime() - now;
    if (delay <= 0) return null; // Already past

    const timeoutId = setTimeout(() => {
        sendNotification(title, options);
    }, delay);

    return timeoutId;
};

/**
 * Parse a session date+time string into a Date object.
 * Accepts date like "2026-06-01" and startTime like "09:00"
 */
const parseSessionDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, 0);
    } catch {
        return null;
    }
};

/**
 * Schedule reminder notifications for all of a user's registered activities.
 * Call this once after fetching user activities.
 * Returns array of timeout IDs to allow cancellation.
 */
export const scheduleActivityReminders = (activities) => {
    if (Notification.permission !== 'granted') return [];
    
    const timeoutIds = [];

    activities.forEach(activity => {
        const sessions = activity.sessions || [];
        const title = activity.seminarTitle || 'Your Activity';

        sessions.forEach(session => {
            const sessionDate = parseSessionDateTime(session.date, session.startTime);
            if (!sessionDate) return;

            const now = Date.now();
            const sessionTime = sessionDate.getTime();

            // 24 hours before
            const t24h = new Date(sessionTime - 24 * 60 * 60 * 1000);
            if (t24h.getTime() > now) {
                const id = scheduleNotification(t24h, `${APP_NAME} — Tomorrow's Session`, {
                    body: `"${title}" starts tomorrow at ${session.startTime}. Get ready!`,
                    tag: `activity-24h-${activity.id}-${session.date}`,
                });
                if (id) timeoutIds.push(id);
            }

            // 1 hour before
            const t1h = new Date(sessionTime - 60 * 60 * 1000);
            if (t1h.getTime() > now) {
                const id = scheduleNotification(t1h, `${APP_NAME} — Starting Soon!`, {
                    body: `"${title}" starts in 1 hour at ${session.startTime}. Don't miss it!`,
                    tag: `activity-1h-${activity.id}-${session.date}`,
                });
                if (id) timeoutIds.push(id);
            }

            // 15 minutes before
            const t15m = new Date(sessionTime - 15 * 60 * 1000);
            if (t15m.getTime() > now) {
                const id = scheduleNotification(t15m, `${APP_NAME} — Starting in 15 min!`, {
                    body: `"${title}" is about to start at ${session.startTime}. Join now!`,
                    tag: `activity-15m-${activity.id}-${session.date}`,
                });
                if (id) timeoutIds.push(id);
            }
        });
    });

    return timeoutIds;
};

/**
 * Get upcoming sessions (next 7 days) from a list of activities.
 * Returns array of { activity, session, sessionDate } sorted by date ascending.
 */
export const getUpcomingSessions = (activities) => {
    const now = Date.now();
    const cutoff = now + 7 * 24 * 60 * 60 * 1000;
    const results = [];

    activities.forEach(activity => {
        const sessions = activity.sessions || [];
        sessions.forEach(session => {
            const sessionDate = parseSessionDateTime(session.date, session.startTime);
            if (!sessionDate) return;
            const t = sessionDate.getTime();
            if (t > now && t <= cutoff) {
                results.push({ activity, session, sessionDate });
            }
        });
    });

    return results.sort((a, b) => a.sessionDate - b.sessionDate);
};

/**
 * Returns a countdown string for a future date, e.g. "2h 30m" or "1d 4h"
 */
export const getCountdownString = (targetDate) => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return 'Now';

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
};

/**
 * Check if a session is within 24 hours.
 */
export const isWithin24Hours = (dateStr, timeStr) => {
    const sessionDate = parseSessionDateTime(dateStr, timeStr);
    if (!sessionDate) return false;
    const diff = sessionDate.getTime() - Date.now();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
};

/**
 * Parse session date for display
 */
export const parseSessionDate = parseSessionDateTime;
