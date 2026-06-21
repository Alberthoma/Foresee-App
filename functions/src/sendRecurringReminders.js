const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { sendReminderEmail, SENDGRID_API_KEY } = require("./emailChannel");
const { sendReminderPush } = require("./pushChannel");

if (!getApps().length) {
  initializeApp();
}

const APP_ID = "wittfinances-282f1";
const THRESHOLDS = [5, 1, 0];

// Mismo mecanismo que el cliente (index.html ~línea 7574): barrido hacia
// adelante día por día en vez de calcular "próxima fecha de vencimiento" —
// evita por construcción los bugs de meses de 28-31 días (ej. day=31 en
// febrero simplemente no matchea ese mes, que es el comportamiento correcto).
function getThresholdMatch(today, dayOfMonth) {
  for (const ahead of THRESHOLDS) {
    const target = new Date(today);
    target.setDate(today.getDate() + ahead);
    if (target.getDate() === dayOfMonth) {
      return { ahead, dueDateISO: target.toISOString().split("T")[0] };
    }
  }
  return null;
}

// recurringExpenses vive en artifacts/{APP_ID}/users/{uid}/recurringExpenses/{docId}
function extractUid(docPath) {
  const parts = docPath.split("/");
  const idx = parts.indexOf("users");
  return idx >= 0 ? parts[idx + 1] : null;
}

// Dedup por canal — cada canal se reintenta independiente si falla; un
// canal exitoso no bloquea al otro. status:'sent' es lo único que evita
// reenvío; status:'failed'/'pending' permite reintentar al día siguiente.
async function runChannelWithDedup({ db, reminderKey, channelName, sendFn }) {
  const logRef = db.collection("emailReminderLog").doc(`${reminderKey}_${channelName}`);
  const existing = await logRef.get();
  if (existing.exists && existing.data().status === "sent") {
    return { skipped: true, reason: "already-sent" };
  }

  await logRef.set(
    { ...existing.data(), channel: channelName, status: "pending", claimedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  try {
    await sendFn();
    await logRef.update({ status: "sent", sentAt: FieldValue.serverTimestamp() });
    return { sent: true };
  } catch (err) {
    await logRef.update({
      status: "failed",
      errorMessage: String((err && err.message) || err),
    });
    return { failed: true, error: String((err && err.message) || err) };
  }
}

async function runReminderSweep() {
  const db = getFirestore();
  const auth = getAuth();
  const today = new Date();

  const snap = await db.collectionGroup("recurringExpenses").get();
  const userEmailCache = new Map();
  const prefCache = new Map();

  const tasks = snap.docs.map(async (doc) => {
    const exp = doc.data();
    const uid = extractUid(doc.ref.path);
    if (!uid) return { skipped: true, reason: "no-uid" };

    const day = parseInt(exp.day, 10);
    if (!day || day < 1 || day > 31) return { skipped: true, reason: "bad-day" };

    const match = getThresholdMatch(today, day);
    if (!match) return { skipped: true, reason: "no-match" };

    if (!prefCache.has(uid)) {
      const prefSnap = await db
        .doc(`artifacts/${APP_ID}/users/${uid}/user_data/preferences`)
        .get();
      prefCache.set(uid, prefSnap.exists ? prefSnap.data() : {});
    }
    const prefs = prefCache.get(uid);
    const wantsEmail = !!prefs.emailRemindersEnabled;
    const wantsPush = !!prefs.pushRemindersEnabled;
    if (!wantsEmail && !wantsPush) {
      return { skipped: true, reason: "opted-out" };
    }

    const reminderKey = `${uid}_${doc.id}_${match.dueDateISO}_${match.ahead}`;
    const channelResults = {};

    if (wantsEmail) {
      channelResults.email = await runChannelWithDedup({
        db,
        reminderKey,
        channelName: "email",
        sendFn: async () => {
          if (!userEmailCache.has(uid)) {
            const userRecord = await auth.getUser(uid);
            userEmailCache.set(uid, userRecord.email || null);
          }
          const toEmail = userEmailCache.get(uid);
          if (!toEmail) throw new Error("user sin email en Auth");
          await sendReminderEmail({
            toEmail,
            description: exp.description || "(sin descripción)",
            amount: exp.amount,
            dueDateISO: match.dueDateISO,
            threshold: match.ahead,
          });
        },
      });
    }

    if (wantsPush) {
      channelResults.push = await runChannelWithDedup({
        db,
        reminderKey,
        channelName: "push",
        sendFn: () =>
          sendReminderPush({
            uid,
            description: exp.description || "(sin descripción)",
            amount: exp.amount,
            threshold: match.ahead,
          }),
      });
    }

    return { channelResults, reminderKey };
  });

  const results = await Promise.allSettled(tasks);

  const summary = { sent: 0, failed: 0, skipped: 0, errors: 0 };
  results.forEach((r) => {
    if (r.status !== "fulfilled") {
      console.error("[sendRecurringExpenseReminders] tarea rechazada:", r.reason);
      summary.errors++;
      return;
    }
    const v = r.value;
    if (!v.channelResults) {
      summary.skipped++;
      return;
    }
    Object.values(v.channelResults).forEach((cr) => {
      if (cr.sent) summary.sent++;
      else if (cr.failed) summary.failed++;
      else summary.skipped++;
    });
  });

  console.log(`[sendRecurringExpenseReminders] sweep complete: ${JSON.stringify(summary)}`);
  return summary;
}

const sendRecurringExpenseReminders = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "America/New_York",
    region: "us-central1",
    secrets: [SENDGRID_API_KEY],
  },
  async () => {
    await runReminderSweep();
  },
);

module.exports = {
  sendRecurringExpenseReminders,
  runReminderSweep,
  getThresholdMatch,
  extractUid,
};
