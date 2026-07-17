import { setGlobalOptions } from "firebase-functions/v2";
import { onValueCreated } from "firebase-functions/v2/database";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { google } from "googleapis";

// Initialize Firebase Admin
initializeApp();
const db = getDatabase();
const adminAuth = getAuth();

// For cost control and to match database region
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 });

export const resetUserPasswords = onCall(async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
        throw new HttpsError("unauthenticated", "You must be logged in to reset passwords.");
    }

    const callerSnapshot = await db.ref(`users/${callerUid}`).get();
    const callerProfile = callerSnapshot.val();
    if (callerProfile?.isAdmin !== true) {
        throw new HttpsError("permission-denied", "Only admins can reset user passwords.");
    }

    const userIds = Array.isArray(request.data?.userIds)
        ? Array.from(new Set(request.data.userIds.filter(uid => typeof uid === "string" && uid.trim())))
        : [];
    const password = String(request.data?.password || "");

    if (userIds.length === 0) {
        throw new HttpsError("invalid-argument", "Select at least one user.");
    }

    if (userIds.length > 50) {
        throw new HttpsError("invalid-argument", "You can reset up to 50 users at once.");
    }

    if (password.length < 8) {
        throw new HttpsError("invalid-argument", "Password must be at least 8 characters.");
    }

    const results = [];
    for (const uid of userIds) {
        if (uid === callerUid) {
            results.push({ uid, ok: false, error: "Admins cannot reset their own password here." });
            continue;
        }

        const userSnapshot = await db.ref(`users/${uid}`).get();
        const userProfile = userSnapshot.val();
        if (!userProfile) {
            results.push({ uid, ok: false, error: "User profile not found." });
            continue;
        }

        try {
        await adminAuth.updateUser(uid, { password });
        await db.ref(`users/${uid}`).update({
            adminPasswordResetAt: Date.now(),
            adminPasswordResetBy: callerUid,
        });
            results.push({ uid, ok: true });
        } catch (error) {
            results.push({ uid, ok: false, error: error.message || "Password reset failed." });
        }
    }

    return {
        updated: results.filter(result => result.ok).length,
        failed: results.filter(result => !result.ok),
    };
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Cloud Function triggered when a new seminar is added to RTDB.
 * Generates a Google Meet link using the Google Calendar API if it's an online seminar.
 */
export const generateMeetLink = onValueCreated({
    ref: "/seminars/{seminarId}",
    instance: "zingoprj01-training-site-default-rtdb"
}, async (event) => {
    const seminarData = event.data.val();
    const seminarId = event.params.seminarId;

    // Only proceed if it's an Online seminar with Google Meet as the location
    if (seminarData.locationType !== "Online" || !seminarData.location.toLowerCase().includes("meet")) {
        console.log(`Seminar ${seminarId} is not an online Google Meet event. Skipping.`);
        return null;
    }

    // Skip if a meet link already exists
    if (seminarData.meetLink) {
        console.log(`Seminar ${seminarId} already has a meet link. Skipping.`);
        return null;
    }

    try {
        console.log(`Generating Meet Link for Seminar: ${seminarData.title}`);

        // 1. Authenticate with the Cloud Functions runtime service account.
        const auth = new google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/calendar.events"]
        });

        const calendar = google.calendar({ version: "v3", auth });

        // 2. Prepare Event Data for Google Calendar
        // Assume we take the first session for the calendar event
        const firstSession = seminarData.sessions && seminarData.sessions.length > 0 
            ? seminarData.sessions[0] 
            : null;

        if (!firstSession || !firstSession.date || !firstSession.startTime) {
            console.warn("Seminar is missing session date/time. Cannot create calendar event.");
            return null;
        }

        // Format: 2026-03-15T10:00:00+08:00 (Assuming Malaysia time for UTeM)
        const startDateTime = `${firstSession.date}T${firstSession.startTime}:00+08:00`;
        const endDateTime = firstSession.endTime 
            ? `${firstSession.date}T${firstSession.endTime}:00+08:00`
            : `${firstSession.date}T23:59:59+08:00`; // Default to end of day if no end time

        const eventConfig = {
            summary: seminarData.title,
            description: seminarData.description || "Hosted via Zingo Training",
            start: {
                dateTime: startDateTime,
                timeZone: "Asia/Kuala_Lumpur",
            },
            end: {
                dateTime: endDateTime,
                timeZone: "Asia/Kuala_Lumpur",
            },
            conferenceData: {
                createRequest: {
                    requestId: seminarId, // Unique ID for the generate request
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            }
        };

        // 3. Call Google Calendar API
        console.log("Calling Google Calendar API...");
        const response = await calendar.events.insert({
            calendarId: 'primary', // Use the Service Account's own internal calendar
            requestBody: eventConfig,
            conferenceDataVersion: 1 // Required to generate the Meet link
        });

        // 4. Extract generated Meet Link
        const meetLink = response.data.hangoutLink;

        if (meetLink) {
            console.log(`Successfully generated Meet link: ${meetLink}`);
            
            // 5. Update Firebase Realtime Database
            const seminarRef = db.ref(`seminars/${seminarId}`);
            await seminarRef.update({
                meetLink: meetLink
            });
            console.log("Successfully updated Realtime Database with the Meet link.");
        } else {
            console.error("Failed to generate Meet link. Google Calendar API response did not include a hangoutLink.", response.data);
        }

    } catch (error) {
        console.error("Error generating Google Meet link:", error);
    }

    return null;
});
