const { getMessaging } = require("firebase-admin/messaging");
const { getFirestore } = require("firebase-admin/firestore");

const APP_ID = "wittfinances-282f1";

function buildPushTitle(threshold) {
  return threshold === 0 ? "Foresee — Hoy vence un pago" : "Foresee — Recordatorio de pago";
}

function buildPushBody({ description, amount, threshold }) {
  const dayLabel =
    threshold === 0 ? "hoy" : threshold === 1 ? "mañana" : `en ${threshold} días`;
  const amountLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount) || 0);
  return `"${description}" vence ${dayLabel} — ${amountLabel}`;
}

// Envía a todos los dispositivos del usuario (puede tener varios tokens
// guardados). Tokens inválidos/expirados se borran solos — limpieza sin
// intervención manual.
async function sendReminderPush({ uid, description, amount, threshold }) {
  const db = getFirestore();
  const tokensSnap = await db
    .collection(`artifacts/${APP_ID}/users/${uid}/fcmTokens`)
    .get();
  if (tokensSnap.empty) return { sent: 0 };

  const tokens = tokensSnap.docs.map((d) => d.id);
  const messaging = getMessaging();
  const response = await messaging.sendEachForMulticast({
    tokens,
    data: {
      title: buildPushTitle(threshold),
      body: buildPushBody({ description, amount, threshold }),
    },
  });

  const staleTokenDeletes = [];
  response.responses.forEach((res, i) => {
    if (
      !res.success &&
      res.error &&
      res.error.code === "messaging/registration-token-not-registered"
    ) {
      staleTokenDeletes.push(
        db
          .doc(`artifacts/${APP_ID}/users/${uid}/fcmTokens/${tokens[i]}`)
          .delete(),
      );
    }
  });
  if (staleTokenDeletes.length) await Promise.allSettled(staleTokenDeletes);

  return { sent: response.successCount };
}

module.exports = { sendReminderPush };
