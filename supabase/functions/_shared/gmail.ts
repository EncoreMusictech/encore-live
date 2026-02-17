/**
 * Gmail API Email Sender using Google Workspace Service Account
 * with Domain-Wide Delegation (JWT → OAuth2 token exchange).
 *
 * Secrets required:
 *   GOOGLE_SERVICE_ACCOUNT_JSON – full JSON key file contents
 *   GMAIL_SENDER_EMAIL          – e.g. noreply@encoremusic.tech
 */

// -- helpers for base64url encoding (no padding) --
function base64url(input: Uint8Array): string {
  const binStr = Array.from(input, (b) => String.fromCharCode(b)).join("");
  return btoa(binStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textToBase64url(text: string): string {
  return base64url(new TextEncoder().encode(text));
}

// -- RSA private key import from PEM --
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// -- create signed JWT --
async function createJwt(
  serviceAccountEmail: string,
  privateKey: CryptoKey,
  impersonateEmail: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccountEmail,
    sub: impersonateEmail,
    scope: "https://www.googleapis.com/auth/gmail.send",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = textToBase64url(JSON.stringify(header));
  const encodedPayload = textToBase64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

// -- exchange JWT for access token --
async function getAccessToken(jwt: string): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Google OAuth token exchange failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  return data.access_token;
}

// -- build RFC 2822 MIME message --
function buildMimeMessage(opts: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): string {
  const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`;
  const toHeader = opts.to.join(", ");

  let headers = `From: ${opts.from}\r\nTo: ${toHeader}\r\nSubject: ${opts.subject}\r\n`;
  if (opts.replyTo) {
    headers += `Reply-To: ${opts.replyTo}\r\n`;
  }
  headers += `MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

  const body = `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${btoa(unescape(encodeURIComponent(opts.html)))}\r\n--${boundary}--`;

  return headers + body;
}

// -- token cache (module-level, per isolate lifetime) --
let cachedToken: { token: string; expiresAt: number } | null = null;

/** Send an email via the Gmail API using a service account. */
export async function sendGmail(opts: {
  to: string[];
  subject: string;
  html: string;
  from?: string; // Display name portion, e.g. "Encore Music Support"
  replyTo?: string;
}): Promise<{ id: string; threadId: string }> {
  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const senderEmail = Deno.env.get("GMAIL_SENDER_EMAIL");

  if (!saJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON secret");
  if (!senderEmail) throw new Error("Missing GMAIL_SENDER_EMAIL secret");

  const sa = JSON.parse(saJson);

  console.log(`[Gmail] Service account email: ${sa.client_email}`);
  console.log(`[Gmail] Impersonating: ${senderEmail}`);
  console.log(`[Gmail] Client ID: ${sa.client_id}`);

  // Reuse token if still valid (with 60s buffer)
  const now = Date.now();
  if (!cachedToken || cachedToken.expiresAt < now + 60_000) {
    const privateKey = await importPrivateKey(sa.private_key);
    const jwt = await createJwt(sa.client_email, privateKey, senderEmail);
    console.log(`[Gmail] JWT created, exchanging for access token...`);
    const accessToken = await getAccessToken(jwt);
    console.log(`[Gmail] Access token obtained successfully`);
    cachedToken = { token: accessToken, expiresAt: now + 3500_000 };
  }

  const fromHeader = opts.from ? `${opts.from} <${senderEmail}>` : senderEmail;

  const raw = buildMimeMessage({
    from: fromHeader,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });

  const encodedMessage = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${senderEmail}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cachedToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gmail API send failed (${resp.status}): ${errText}`);
  }

  return resp.json();
}
