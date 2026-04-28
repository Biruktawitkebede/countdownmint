// functions/index.js
// Cloud Function to send upcoming event emails on a schedule

const functions = require("firebase-functions");   // Firebase Functions SDK
const admin = require("firebase-admin");           // Firebase Admin SDK
const nodemailer = require("nodemailer");          // Nodemailer for emails

admin.initializeApp();                             // Initialize Firebase Admin
const db = admin.firestore();                      // Firestore reference

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,           // Set via: firebase functions:config:set email.user="..." email.pass="..."
    pass: functions.config().email.pass
  }
});

// Helper to build email HTML
const emailTemplate = (event, user) => `
  <div>
    <h3>Reminder, ${user.name || user.email}</h3>
    <p>Your event is coming up soon.</p>
    <p><strong>${event.title}</strong></p>
    <p>${new Date(
      event.startAt.toDate ? event.startAt.toDate() : event.startAt
    ).toLocaleString()}</p>
    <p>Location: ${event.location || "TBA"}</p>
  </div>
`;

// Scheduled function runs every hour in Addis Ababa time
exports.sendUpcomingEventEmails = functions.pubsub
  .schedule("every 1 hours")
  .timeZone("Africa/Addis_Ababa")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const in24h = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 24 * 60 * 60 * 1000
    );

    // Query events starting in the next 24 hours, not yet notified
    const eventsSnap = await db.collection("events")
      .where("startAt", ">=", now)
      .where("startAt", "<=", in24h)
      .where("reminderSent", "==", false)
      .get();

    const batch = db.batch();
    const tasks = [];

    for (const doc of eventsSnap.docs) {
      const eventData = doc.data();
      const event = { id: doc.id, ...eventData };

      // Registrations subcollection
      const regsSnap = await db.collection("events")
        .doc(event.id)
        .collection("registrations")
        .get();

      regsSnap.forEach(reg => {
        const user = reg.data();
        if (!user.email) return;

        tasks.push(
          transporter.sendMail({
            from: functions.config().email.user,
            to: user.email,
            subject: `Reminder: ${event.title} starts soon`,
            html: emailTemplate(event, user)
          })
        );
      });

      // Mark reminder as sent
      batch.update(db.collection("events").doc(event.id), {
        reminderSent: true
      });
    }

    // Send emails + update events
    await Promise.all(tasks);
    await batch.commit();

    return null;
  });
