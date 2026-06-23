import nodemailer, { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import dns from 'node:dns/promises';
import net from 'node:net';

// SMTP is configured entirely through env vars so it can point at ANY server —
// a locally hosted SMTP (Postfix/MailHog), a company relay, or a provider.
// There is no artificial per-day cap in this code; limits, if any, come from
// whichever server SMTP_HOST points to.
//
// IMPORTANT: env vars are read LAZILY (inside functions), not at module load.
// server.ts imports this module before it calls dotenv.config(), so reading
// process.env at the top level would capture undefined values.
const getConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true => port 465
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || 'TEDxIITPatna <no-reply@tedx.com>',
});

// Email is optional. If no host is configured we simply skip sending so ticket
// generation keeps working in environments without SMTP set up.
export const isEmailConfigured = (): boolean => Boolean(process.env.SMTP_HOST);

let transporter: Transporter | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  const cfg = getConfig();

  // Resolve the SMTP host to an IPv4 address OURSELVES and connect by IP.
  // Many cloud hosts (Render, etc.) have no routable IPv6, yet smtp.gmail.com
  // advertises an AAAA record — letting the SMTP client pick it causes
  // `connect ENETUNREACH 2404:6800:...:465`. nodemailer's own `family: 4`
  // option does not reliably steer its hostname resolution, so we do the A
  // lookup here and pass the literal IPv4. The original hostname is kept as the
  // TLS servername so Gmail's certificate still validates.
  let host = (cfg.host || '') as string;
  let servername: string | undefined;
  if (host && !net.isIP(host)) {
    try {
      const { address } = await dns.lookup(host, { family: 4 });
      servername = host;
      host = address;
    } catch {
      // DNS failed — fall back to the hostname and let nodemailer resolve it.
    }
  }

  const options = {
    host,
    port: cfg.port,
    secure: cfg.secure,
    family: 4,
    // When we connected by IP, validate TLS against the real hostname.
    ...(servername ? { tls: { servername }, name: servername } : {}),
    // Auth is optional — a local relay may accept mail without credentials.
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    // Fail fast instead of hanging on nodemailer's ~2-minute default. Many hosts
    // (e.g. Render free tier) block/throttle outbound SMTP; without these the
    // awaited send blocks the HTTP response until the platform resets the
    // connection, surfacing on the client as "Cannot reach the server". With
    // them, a dead SMTP errors in seconds and ticket generation still succeeds
    // (tryEmailTicket catches it and reports emailSent: false).
    connectionTimeout: 10_000, // TCP connect
    greetingTimeout: 10_000,   // wait for server 220 greeting
    socketTimeout: 15_000,     // inactivity once connected
  } as SMTPTransport.Options;

  transporter = nodemailer.createTransport(options);

  return transporter;
};

interface TicketEmailInput {
  to: string;
  name?: string;
  ticketId: string;
  session: 'SESSION_1' | 'SESSION_2';
  qrDataUrl: string; // data:image/png;base64,....
}

const prettySession = (session: string) =>
  session === 'SESSION_1' ? 'Session 1' : 'Session 2';

/**
 * Send the attendee their ticket: QR shown inline in the body AND attached as a
 * downloadable PNG, with the ticket id + session. Throws on send failure so the
 * caller can record per-ticket email status (it never throws for "not
 * configured" — callers should check isEmailConfigured() first).
 */
export const sendTicketEmail = async (input: TicketEmailInput): Promise<void> => {
  const { to, name, ticketId, session, qrDataUrl } = input;

  // The data URL is "data:image/png;base64,<payload>" — strip the prefix to get
  // the raw bytes for the attachment / inline CID image.
  const base64 = qrDataUrl.split(',')[1] ?? '';
  const qrBuffer = Buffer.from(base64, 'base64');
  const greeting = name ? `Hi ${name},` : 'Hello,';

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2 style="color:#e62b1e;">TEDxIITPatna</h2>
    <p>${greeting}</p>
    <p>Here is your entry ticket. Please present this QR code at the gate.</p>
    <div style="text-align:center; margin: 24px 0;">
      <img src="cid:ticket-qr" alt="Your ticket QR code" width="240" height="240" style="border:1px solid #eee; padding:8px; background:#fff;" />
    </div>
    <table style="width:100%; font-size:14px; border-collapse:collapse;">
      <tr><td style="color:#666; padding:4px 0;">Ticket ID</td><td style="text-align:right; font-family:monospace;">${ticketId}</td></tr>
      <tr><td style="color:#666; padding:4px 0;">Session</td><td style="text-align:right;">${prettySession(session)}</td></tr>
    </table>
    <p style="color:#888; font-size:12px; margin-top:24px;">This ticket is unique to you. Do not share it — it can only be checked in once.</p>
  </div>`;

  const tx = await getTransporter();
  await tx.sendMail({
    from: getConfig().from,
    to,
    subject: `Your TEDxIITPatna Ticket — ${prettySession(session)}`,
    html,
    attachments: [
      {
        filename: `${ticketId}.png`,
        content: qrBuffer,
        contentType: 'image/png',
        cid: 'ticket-qr', // referenced by the inline <img src="cid:ticket-qr">
      },
    ],
  });
};
