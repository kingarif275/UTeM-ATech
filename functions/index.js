import { setGlobalOptions } from "firebase-functions/v2";
import { onValueCreated } from "firebase-functions/v2/database";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import process from "node:process";

// Initialize Firebase Admin
initializeApp();
const db = getDatabase();
const adminAuth = getAuth();
const UTeM_LOGO_URL = "https://zingoprj01-training-site.web.app/assets/logo-utem-n89MiDWp.png";
const ATECH_LOGO_URL = "https://zingoprj01-training-site.web.app/assets/logo-atech-CMrfkoWZ.png";

// For cost control and to match database region
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 });

const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value = "") => {
    if (!value) return "TBA";
    const date = new Date(`${value}T00:00:00+08:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
    });
};

const getMailTransport = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465,
        auth: { user, pass },
    });
};

const buildRsvpEmail = (registration) => {
    const attendee = registration.attendee || {};
    const sessions = Array.isArray(registration.sessions) ? registration.sessions : [];
    const sessionRows = sessions.length ? sessions.map((session, index) => `
        <tr>
            <td style="padding:14px;border-bottom:1px solid #e5e7eb;color:#0b2d5c;font-weight:800;">${escapeHtml(session.name || `Session ${index + 1}`)}</td>
            <td style="padding:14px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${escapeHtml(formatDate(session.date))}</td>
            <td style="padding:14px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${escapeHtml([session.startTime, session.endTime].filter(Boolean).join(" - ") || "TBA")}</td>
        </tr>
    `).join("") : `
        <tr>
            <td colspan="3" style="padding:14px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Session details will be confirmed by ATech.</td>
        </tr>
    `;

    return `
<!doctype html>
<html>
<body style="margin:0;background:#f3f6fa;font-family:Montserrat,Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">Your ATech UTeM RSVP has been received.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fa;padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe4ef;">
                    <tr>
                        <td style="background:#0b2d5c;padding:22px 26px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <img src="${UTeM_LOGO_URL}" alt="UTeM" style="height:46px;max-width:96px;object-fit:contain;background:#fff;border-radius:8px;padding:5px;margin-right:12px;vertical-align:middle;">
                                        <img src="${ATECH_LOGO_URL}" alt="ATech" style="height:46px;max-width:130px;object-fit:contain;background:#fff;border-radius:8px;padding:5px;vertical-align:middle;">
                                    </td>
                                    <td align="right" style="color:#fed7aa;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">ATech Verified Training</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 30px 8px;">
                            <div style="color:#f47a20;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Registration Received</div>
                            <h1 style="margin:0;color:#0b2d5c;font-size:34px;line-height:1.08;font-weight:900;">Your RSVP is in, ${escapeHtml(attendee.fullName || "participant")}.</h1>
                            <p style="margin:16px 0 0;color:#4b5563;font-size:16px;line-height:1.7;">We have received your seat reservation. Payment instructions will be sent after review. Your seat is confirmed only after payment.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 30px;">
                            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;">
                                <div style="font-size:12px;color:#9a3412;text-transform:uppercase;letter-spacing:.08em;font-weight:900;">Reference Number</div>
                                <div style="font-size:28px;color:#0b2d5c;font-weight:900;margin-top:4px;">${escapeHtml(registration.referenceNumber || registration.registrationId || "-")}</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 30px 22px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                                <tr>
                                    <td colspan="2" style="background:#f8fafc;padding:16px 18px;color:#0b2d5c;font-size:18px;font-weight:900;">${escapeHtml(registration.seminarTitle || "ATech Training Programme")}</td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;width:38%;color:#6b7280;border-top:1px solid #eef2f7;">Attendee</td>
                                    <td style="padding:13px 18px;color:#1f2937;border-top:1px solid #eef2f7;">${escapeHtml(attendee.fullName || "-")}</td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;color:#6b7280;border-top:1px solid #eef2f7;">Email</td>
                                    <td style="padding:13px 18px;color:#1f2937;border-top:1px solid #eef2f7;">${escapeHtml(attendee.email || "-")}</td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;color:#6b7280;border-top:1px solid #eef2f7;">Role</td>
                                    <td style="padding:13px 18px;color:#1f2937;border-top:1px solid #eef2f7;">${escapeHtml(attendee.role || attendee.profession || "-")}</td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;color:#6b7280;border-top:1px solid #eef2f7;">Organisation / University</td>
                                    <td style="padding:13px 18px;color:#1f2937;border-top:1px solid #eef2f7;">${escapeHtml(attendee.organization || attendee.company || "-")}</td>
                                </tr>
                                <tr>
                                    <td style="padding:13px 18px;color:#6b7280;border-top:1px solid #eef2f7;">Status</td>
                                    <td style="padding:13px 18px;color:#0b2d5c;border-top:1px solid #eef2f7;font-weight:900;">${escapeHtml(registration.status || "Registration Received")}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 30px 24px;">
                            <h2 style="margin:0 0 12px;color:#0b2d5c;font-size:20px;">Selected Session</h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                                <tr style="background:#0b2d5c;">
                                    <th align="left" style="padding:13px 14px;color:#ffffff;font-size:12px;text-transform:uppercase;">Session</th>
                                    <th align="left" style="padding:13px 14px;color:#ffffff;font-size:12px;text-transform:uppercase;">Date</th>
                                    <th align="left" style="padding:13px 14px;color:#ffffff;font-size:12px;text-transform:uppercase;">Time</th>
                                </tr>
                                ${sessionRows}
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 30px 30px;">
                            <a href="https://zingoprj01-training-site.web.app/my-activities" style="display:inline-block;background:#f47a20;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:999px;font-weight:900;">View My Activities</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:18px 30px;color:#6b7280;font-size:12px;line-height:1.6;">
                            This email confirms that ATech UTeM received the RSVP. Please keep the reference number for future communication.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

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

export const sendRsvpConfirmationEmail = onValueCreated({
    ref: "/activity_registrations/{seminarId}/{registrationId}",
    instance: "zingoprj01-training-site-default-rtdb",
}, async (event) => {
    const registration = event.data.val();
    const { seminarId, registrationId } = event.params;
    const attendeeEmail = registration?.attendee?.email;
    const statusRef = db.ref(`activity_registrations/${seminarId}/${registrationId}/emailDelivery`);

    if (!attendeeEmail) {
        await statusRef.set({
            status: "skipped",
            reason: "No attendee email found.",
            updatedAt: new Date().toISOString(),
        });
        return null;
    }

    const transport = getMailTransport();
    if (!transport) {
        await statusRef.set({
            status: "skipped",
            reason: "SMTP_HOST, SMTP_USER, and SMTP_PASS are not configured.",
            to: attendeeEmail,
            updatedAt: new Date().toISOString(),
        });
        console.warn("RSVP email skipped because SMTP is not configured.");
        return null;
    }

    const from = process.env.SMTP_FROM || `"ATech UTeM" <${process.env.SMTP_USER}>`;
    const subject = `ATech RSVP Received: ${registration.seminarTitle || "Training Programme"}`;

    try {
        const result = await transport.sendMail({
            from,
            to: attendeeEmail,
            subject,
            html: buildRsvpEmail(registration),
            text: [
                "ATech UTeM RSVP received.",
                `Programme: ${registration.seminarTitle || "-"}`,
                `Reference: ${registration.referenceNumber || registrationId}`,
                "Payment instructions will be sent after review. Your seat is confirmed only after payment.",
            ].join("\n"),
        });

        await statusRef.set({
            status: "sent",
            to: attendeeEmail,
            messageId: result.messageId || "",
            updatedAt: new Date().toISOString(),
        });
        return null;
    } catch (error) {
        console.error("Failed to send RSVP email:", error);
        await statusRef.set({
            status: "failed",
            to: attendeeEmail,
            error: error.message || "Unknown email error.",
            updatedAt: new Date().toISOString(),
        });
        return null;
    }
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
