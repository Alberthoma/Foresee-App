const sgMail = require("@sendgrid/mail");
const { defineSecret, defineString } = require("firebase-functions/params");

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
// No es secreta — es la dirección "from" ya verificada en SendGrid (Single
// Sender Verification). Configurable por si se cambia más adelante.
const SENDGRID_FROM_EMAIL = defineString("SENDGRID_FROM_EMAIL", {
  default: "albertomatosgil@gmail.com",
});

let configured = false;
function ensureConfigured() {
  if (configured) return;
  sgMail.setApiKey(SENDGRID_API_KEY.value());
  configured = true;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(amount) || 0,
  );
}

function buildReminderEmail({ toEmail, description, amount, dueDateISO, threshold }) {
  const dayLabel =
    threshold === 0 ? "hoy" : threshold === 1 ? "mañana" : `en ${threshold} días`;
  const subject =
    threshold === 0
      ? `Hoy vence: ${description}`
      : `Recordatorio: "${description}" vence ${dayLabel}`;
  const html = `
    <p>Hola,</p>
    <p>Tu gasto recurrente <strong>${escapeHtml(description)}</strong> vence ${dayLabel} (${dueDateISO}).</p>
    <p>Monto: <strong>${escapeHtml(formatCurrency(amount))}</strong></p>
    <p>— Foresee</p>
  `;
  return {
    to: toEmail,
    from: { email: SENDGRID_FROM_EMAIL.value(), name: "Foresee" },
    subject,
    html,
  };
}

async function sendReminderEmail({ toEmail, description, amount, dueDateISO, threshold }) {
  ensureConfigured();
  await sgMail.send(
    buildReminderEmail({ toEmail, description, amount, dueDateISO, threshold }),
  );
}

module.exports = { sendReminderEmail, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL };
