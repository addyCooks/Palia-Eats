import "server-only";
import nodemailer from "nodemailer";

type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function isConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Sends one email through your SMTP account (Gmail app password, Brevo, ...).
// It NEVER throws: a failed email must not break placing an order. Problems are logged.
export async function sendEmail(email: Email): Promise<boolean> {
  if (!isConfigured()) {
    // Development: no SMTP account yet, so show the email in the server console.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n[email not sent: SMTP is not configured]\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`,
      );
    } else {
      console.error("[email] SMTP is not configured; email to", email.to, "was NOT sent.");
    }
    return false;
  }

  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = encrypted from the start; 587 upgrades with STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Give up after a while instead of hanging: a stuck connection must never keep an
      // order's background email task running for minutes.
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 40_000,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return true;
  } catch (error) {
    console.error("[email] Sending failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
