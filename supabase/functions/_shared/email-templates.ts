/**
 * Shared elegant email template system for ENCORE Music
 * Uses hosted logo images for consistent branding across all emails.
 */

const LOGO_ICON = "https://storage.googleapis.com/msgsndr/8BUYWIq31koZgf2U2ynj/media/6993c555ceaa05a044a66721.png";
const LOGO_WITH_TITLE = "https://storage.googleapis.com/msgsndr/8BUYWIq31koZgf2U2ynj/media/6993c55509780943706d06a2.png";
const HERO_BG = "https://www.encoremusic.tech/images/email-hero-bg.jpg";

const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  accent: "#8b5cf6",
  dark: "#0f172a",
  text: "#1e293b",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  bgLight: "#f8fafc",
  bgCard: "#ffffff",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  dangerDark: "#dc2626",
};

/** Base email wrapper with ENCORE branding */
function emailLayout(opts: {
  preheader?: string;
  headerIcon?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  body: string;
  footerText?: string;
  accentColor?: string;
}): string {
  const accent = opts.accentColor || COLORS.primary;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${opts.headerTitle || "ENCORE"}</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bgLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>` : ""}
  
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bgLight};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.bgCard};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Hero Header with studio background -->
          <tr>
            <td style="padding:0;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:320px;">
                <v:fill type="frame" src="${HERO_BG}" color="#0f172a" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <div style="background:url('${HERO_BG}') center/cover no-repeat #0f172a;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(15,23,42,0.85),rgba(99,102,241,0.35));">
                  
                  <!-- Badge: ANALOG SOUL. DIGITAL SPINE. -->
                  <tr>
                    <td style="padding:28px 40px 0 40px;text-align:center;">
                      <div style="display:inline-block;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.35);border-radius:50px;padding:7px 18px;">
                        <span style="display:inline-block;width:6px;height:6px;background:#8b5cf6;border-radius:50%;margin-right:2px;vertical-align:middle;"></span>
                        <span style="display:inline-block;width:6px;height:6px;background:#d4a843;border-radius:50%;margin-right:2px;vertical-align:middle;"></span>
                        <span style="display:inline-block;width:6px;height:6px;background:rgba(139,92,246,0.6);border-radius:50%;margin-right:5px;vertical-align:middle;"></span>
                        <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#8b5cf6;vertical-align:middle;">ANALOG SOUL. DIGITAL SPINE.</span>
                      </div>
                    </td>
                  </tr>

                  <!-- ENCORE! headline -->
                  <tr>
                    <td style="padding:14px 40px 0 40px;text-align:center;">
                      <img src="${LOGO_WITH_TITLE}" alt="ENCORE" width="180" style="display:inline-block;max-width:180px;height:auto;" />
                    </td>
                  </tr>

                  <!-- RIGHTS MANAGEMENT SYSTEMS pill -->
                  <tr>
                    <td style="padding:12px 40px 0 40px;text-align:center;">
                      <div style="display:inline-block;background:rgba(139,92,246,0.85);border-radius:14px;padding:8px 22px;">
                        <span style="font-size:12px;font-weight:800;color:#0f172a;letter-spacing:0.5px;">RIGHTS MANAGEMENT SYSTEMS</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Tagline -->
                  <tr>
                    <td style="padding:12px 40px 0 40px;text-align:center;">
                      <p style="margin:0;font-size:14px;font-weight:700;color:#8b5cf6;">Track your rights like you track your hits.</p>
                    </td>
                  </tr>

                  <!-- Accent divider -->
                  <tr>
                    <td style="padding:14px 40px 0 40px;text-align:center;">
                      <div style="height:2px;width:60px;margin:0 auto;border-radius:2px;background:linear-gradient(90deg,${accent},${COLORS.accent});"></div>
                    </td>
                  </tr>

                  ${opts.headerTitle ? `
                  <tr>
                    <td style="padding:12px 40px 24px 40px;text-align:center;">
                      ${opts.headerIcon ? `<span style="font-size:24px;">${opts.headerIcon}</span><br/>` : ""}
                      <h2 style="margin:4px 0 0 0;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${opts.headerTitle}</h2>
                      ${opts.headerSubtitle ? `<p style="margin:5px 0 0 0;font-size:13px;color:rgba(255,255,255,0.7);">${opts.headerSubtitle}</p>` : ""}
                    </td>
                  </tr>
                  ` : `
                  <tr><td style="padding:0 0 24px 0;">&nbsp;</td></tr>
                  `}
                </table>
              </div>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 40px 36px 40px;">
              ${opts.body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${COLORS.border};padding-top:24px;text-align:center;">
                    <img src="${LOGO_ICON}" alt="ENCORE" width="28" style="display:inline-block;max-width:28px;height:auto;margin-bottom:12px;" />
                    <p style="margin:0 0 4px 0;font-size:12px;color:${COLORS.textLight};">
                      ${opts.footerText || "Encore Music Technology — Professional Music IP Management"}
                    </p>
                    <p style="margin:0 0 6px 0;font-size:11px;color:${COLORS.textLight};">
                      &copy; ${year} Encore Music. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:11px;">
                      <a href="mailto:support@encoremusic.tech?subject=ENCORE%20Support%20Request" style="color:${COLORS.primary};text-decoration:none;">support@encoremusic.tech</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable CTA button */
function ctaButton(text: string, url: string, color?: string): string {
  const bg = color || COLORS.primary;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0;">
        <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,${bg},${COLORS.accent});color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.2px;mso-padding-alt:0;">
          <!--[if mso]><i style="letter-spacing:36px;mso-font-width:-100%;mso-text-raise:26pt">&nbsp;</i><![endif]-->
          <span style="mso-text-raise:13pt;">${text}</span>
          <!--[if mso]><i style="letter-spacing:36px;mso-font-width:-100%">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}

/** Info box with icon */
function infoBox(content: string, icon?: string): string {
  return `<div style="background:${COLORS.bgLight};border-radius:10px;padding:20px 24px;margin:20px 0;border:1px solid ${COLORS.border};">
    ${icon ? `<span style="font-size:20px;margin-right:8px;">${icon}</span>` : ""}${content}
  </div>`;
}

/** Key-value detail row */
function detailRow(label: string, value: string, color?: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:${COLORS.textMuted};width:130px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;font-weight:600;color:${color || COLORS.text};">${value}</td>
  </tr>`;
}

/** Priority badge */
function priorityBadge(priority: string): string {
  const colors: Record<string, string> = {
    low: COLORS.success,
    medium: COLORS.warning,
    high: COLORS.danger,
    critical: COLORS.dangerDark,
  };
  const bg = colors[priority?.toLowerCase()] || COLORS.textMuted;
  return `<span style="display:inline-block;background:${bg};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${priority?.toUpperCase() || "LOW"}</span>`;
}

// ─── PUBLIC TEMPLATE BUILDERS ────────────────────────────────────

/** 1. Welcome email — new user account created */
export function welcomeEmail(opts: {
  email: string;
  tempPassword: string;
  clientName: string;
  role: string;
  appUrl?: string;
}): string {
  const appUrl = opts.appUrl || "https://www.encoremusic.tech";
  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hello,</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Your account for <strong style="color:${COLORS.text};">${opts.clientName}</strong> has been created. Use the credentials below to sign in.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Email", opts.email)}
        ${detailRow("Password", `<code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace;letter-spacing:1px;">${opts.tempPassword}</code>`)}
        ${detailRow("Role", `<span style="text-transform:capitalize;">${opts.role}</span>`)}
      </table>
    `, "🔑")}
    ${ctaButton("Sign In to Your Account", `${appUrl}/auth`)}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;">⚠️ <strong>Important:</strong> Please change your password after your first login for security.</p>
    </div>
  `;

  return emailLayout({
    preheader: `Your ${opts.clientName} account is ready — sign in now`,
    headerIcon: "👋",
    headerTitle: "Welcome to ENCORE",
    headerSubtitle: `Your account for ${opts.clientName} is ready`,
    body,
  });
}

/** 2. Client invitation email */
export function clientInvitationEmail(opts: {
  inviteeName: string;
  companyName: string;
  subscriberName: string;
  acceptUrl: string;
  role: string;
  supportEmail?: string;
}): string {
  const supportEmail = opts.supportEmail || "support@encoremusic.tech";
  const roleLabel = opts.role === "admin" ? "an administrator" : opts.role === "user" ? "a team member" : "a client";

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hi ${opts.inviteeName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 8px;">
      You've been invited to join <strong style="color:${COLORS.text};">${opts.companyName}</strong> as ${roleLabel} on the ENCORE platform.
    </p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 28px;">
      Click the button below to create your account and get started:
    </p>
    ${ctaButton("Accept Invitation", opts.acceptUrl)}
    <p style="font-size:13px;color:${COLORS.textLight};line-height:1.6;margin:24px 0 0;border-top:1px solid ${COLORS.border};padding-top:16px;">
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${opts.acceptUrl}" style="color:${COLORS.primary};word-break:break-all;font-size:12px;">${opts.acceptUrl}</a>
    </p>
    <p style="font-size:13px;color:${COLORS.textLight};margin:12px 0 0;">
      This invitation expires in 7 days. Questions? Contact <a href="mailto:${supportEmail}?subject=Invitation%20Question%20-%20${encodeURIComponent(opts.companyName)}" style="color:${COLORS.primary};">${supportEmail}</a>.
    </p>
  `;

  return emailLayout({
    preheader: opts.companyName && opts.companyName !== opts.subscriberName && opts.companyName !== 'ENCORE'
      ? `You've been invited to join ${opts.companyName} on ENCORE`
      : `You've been invited to join ENCORE`,
    headerIcon: "✉️",
    headerTitle: "You're Invited!",
    headerSubtitle: opts.companyName && opts.companyName !== opts.subscriberName && opts.companyName !== 'ENCORE'
      ? `Join ${opts.companyName} on ENCORE`
      : `You're invited to ENCORE`,
    body,
  });
}

/** 3. Support ticket confirmation (sent to customer) */
export function supportTicketConfirmationEmail(opts: {
  firstName: string;
  ticketId: string;
  subject: string;
}): string {
  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hi ${opts.firstName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Thank you for contacting ENCORE Support. We've received your request and our team is reviewing it.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Ticket ID", opts.ticketId)}
        ${detailRow("Subject", opts.subject)}
      </table>
    `, "🎫")}
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 16px;">
      We typically respond within <strong style="color:${COLORS.text};">24 hours</strong>. For urgent matters, please indicate "Critical" priority in your ticket.
    </p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Need to add more details? <a href="mailto:support@encoremusic.tech?subject=Re%3A%20Ticket%20${encodeURIComponent(opts.ticketId)}%20-%20${encodeURIComponent(opts.subject)}" style="color:${COLORS.primary};font-weight:600;">Reply to this ticket →</a>
    </p>
    ${ctaButton("View Your Dashboard", "https://www.encoremusic.tech/dashboard")}
  `;

  return emailLayout({
    preheader: `We received your support request — Ticket ${opts.ticketId}`,
    headerIcon: "✅",
    headerTitle: "Support Request Received",
    headerSubtitle: `Ticket ${opts.ticketId}`,
    body,
  });
}

/** 4. Support ticket notification (sent to internal team) */
export function supportTicketInternalEmail(opts: {
  ticketId: string;
  priority: string;
  category: string;
  feature: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  description: string;
}): string {
  const body = `
    <p style="font-size:15px;color:${COLORS.textMuted};margin:0 0 20px;">A new support ticket has been submitted.</p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Ticket ID", `<strong>${opts.ticketId}</strong>`)}
        ${detailRow("Priority", priorityBadge(opts.priority))}
        ${detailRow("Category", opts.category || "Not specified")}
        ${detailRow("Feature", opts.feature || "Not specified")}
      </table>
    `, "📋")}
    <h3 style="font-size:15px;color:${COLORS.text};margin:24px 0 12px;">Customer</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow("Name", `${opts.firstName} ${opts.lastName}`)}
      ${detailRow("Email", `<a href="mailto:${opts.email}?subject=Re%3A%20Support%20Ticket%20${encodeURIComponent(opts.ticketId)}" style="color:${COLORS.primary};">${opts.email}</a>`)}
    </table>
    <h3 style="font-size:15px;color:${COLORS.text};margin:0 0 8px;">Subject</h3>
    <p style="font-size:14px;font-weight:600;color:${COLORS.text};margin:0 0 16px;">${opts.subject}</p>
    <h3 style="font-size:15px;color:${COLORS.text};margin:0 0 8px;">Description</h3>
    <div style="background:${COLORS.bgLight};border-radius:8px;padding:16px;border:1px solid ${COLORS.border};">
      <p style="font-size:14px;color:${COLORS.textMuted};white-space:pre-wrap;margin:0;line-height:1.7;">${opts.description}</p>
    </div>
  `;

  return emailLayout({
    preheader: `[${opts.priority?.toUpperCase()}] New support ticket: ${opts.subject}`,
    headerIcon: "🚨",
    headerTitle: "New Support Ticket",
    headerSubtitle: opts.ticketId,
    body,
    accentColor: opts.priority === "critical" || opts.priority === "high" ? COLORS.danger : undefined,
  });
}

/** 5. Catalog valuation onboarding */
export function catalogValuationOnboardingEmail(opts: {
  userName: string;
  accessSource: string;
}): string {
  const features = [
    { icon: "📊", title: "DCF Analysis", desc: "Advanced discounted cash flow modeling" },
    { icon: "⚡", title: "Risk Assessment", desc: "Comprehensive risk analysis and scoring" },
    { icon: "🎵", title: "Spotify Integration", desc: "Real-time streaming data and metrics" },
    { icon: "📈", title: "Multi-Method Valuation", desc: "Compare DCF, multiple-based & risk-adjusted values" },
  ];

  const featureRows = features
    .map(
      (f) =>
        `<tr>
          <td style="padding:10px 12px 10px 0;vertical-align:top;font-size:22px;width:36px;">${f.icon}</td>
          <td style="padding:10px 0;">
            <strong style="font-size:14px;color:${COLORS.text};">${f.title}</strong>
            <p style="margin:2px 0 0;font-size:13px;color:${COLORS.textMuted};">${f.desc}</p>
          </td>
        </tr>`
    )
    .join("");

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hello ${opts.userName}! 👋</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      You now have access to our industry-leading catalog valuation tools. We're excited to help you make informed decisions about your music investments.
    </p>
    <h3 style="font-size:15px;color:${COLORS.text};margin:0 0 12px;">Key Features</h3>
    <div style="background:${COLORS.bgLight};border-radius:10px;padding:8px 16px;border:1px solid ${COLORS.border};margin-bottom:28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${featureRows}
      </table>
    </div>
    ${ctaButton("Start Your First Valuation →", "https://www.encoremusic.tech/dashboard/catalog-valuation")}
    <p style="font-size:14px;color:${COLORS.textMuted};text-align:center;margin:20px 0 0;">
      Need help? <a href="mailto:support@encoremusic.tech?subject=Catalog%20Valuation%20Support%20Request" style="color:${COLORS.primary};font-weight:500;">Contact our support team →</a>
    </p>
  `;

  return emailLayout({
    preheader: "Welcome to Catalog Valuation — start your first valuation today",
    headerIcon: "🎯",
    headerTitle: "Welcome to Catalog Valuation",
    headerSubtitle: "Your professional music IP valuation platform",
    body,
    footerText: `This email was sent because you gained access to the Catalog Valuation module${opts.accessSource ? ` via ${opts.accessSource}` : ""}.`,
  });
}

/** 6. Contract email */
export function contractEmail(opts: {
  recipientName: string;
  contractTitle: string;
  contractContent: string;
  senderMessage?: string;
}): string {
  const contractHtml = opts.contractContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin:0 0 10px;line-height:1.6;font-size:14px;color:${COLORS.text};">${line}</p>`)
    .join("");

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Dear ${opts.recipientName},</p>
    ${opts.senderMessage ? `
    <div style="border-left:3px solid ${COLORS.primary};padding-left:16px;margin:0 0 20px;">
      <p style="font-size:14px;color:${COLORS.textMuted};font-style:italic;margin:0;">${opts.senderMessage}</p>
    </div>
    ` : ""}
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 20px;">
      Please find the contract <strong style="color:${COLORS.text};">"${opts.contractTitle}"</strong> below:
    </p>
    <div style="background:${COLORS.bgLight};border:1px solid ${COLORS.border};border-radius:10px;padding:24px;margin:0 0 24px;">
      ${contractHtml}
    </div>
    ${ctaButton("View Contracts", "https://www.encoremusic.tech/dashboard/contracts")}
  `;

  return emailLayout({
    preheader: `Contract: ${opts.contractTitle}`,
    headerIcon: "📄",
    headerTitle: "Contract Document",
    headerSubtitle: opts.contractTitle,
    body,
  });
}

/** 7. Invitation reminder */
export function invitationReminderEmail(opts: {
  daysUntilExpiry: number;
  expiresAt: string;
  isUrgent: boolean;
}): string {
  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hello,</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      This is a ${opts.isUrgent ? "<strong style='color:" + COLORS.danger + ";'>final</strong>" : "friendly"} reminder that your client portal invitation will expire in 
      <strong style="color:${COLORS.text};">${opts.daysUntilExpiry} day${opts.daysUntilExpiry !== 1 ? "s" : ""}</strong>.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Expiration Date", new Date(opts.expiresAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))}
      </table>
    `, opts.isUrgent ? "⚠️" : "📅")}
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 8px;">
      To accept your invitation, please click the link in your original invitation email or contact your administrator.
    </p>
    ${opts.isUrgent ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0;font-size:13px;color:${COLORS.dangerDark};font-weight:600;">⚠️ After expiration, you will need to request a new invitation.</p>
    </div>
    ` : ""}
  `;

  return emailLayout({
    preheader: opts.isUrgent
      ? "Your client portal invitation expires tomorrow!"
      : "Reminder: Your client portal invitation expires soon",
    headerIcon: opts.isUrgent ? "⚠️" : "📋",
    headerTitle: opts.isUrgent ? "Invitation Expiring Soon!" : "Invitation Reminder",
    headerSubtitle: `Expires in ${opts.daysUntilExpiry} day${opts.daysUntilExpiry !== 1 ? "s" : ""}`,
    body,
    accentColor: opts.isUrgent ? COLORS.danger : undefined,
  });
}

/** 8. Password reset email */
export function passwordResetEmail(opts: {
  resetUrl: string;
  userName?: string;
}): string {
  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hi ${opts.userName || "there"},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    ${ctaButton("Reset Your Password", opts.resetUrl)}
    <p style="font-size:14px;color:${COLORS.textMuted};line-height:1.6;margin:24px 0 0;border-top:1px solid ${COLORS.border};padding-top:16px;">
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${opts.resetUrl}" style="color:${COLORS.primary};word-break:break-all;font-size:12px;">${opts.resetUrl}</a>
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;">⚠️ <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.</p>
    </div>
    <p style="font-size:12px;color:${COLORS.textLight};margin:16px 0 0;">This link expires in 1 hour for your security.</p>
  `;

  return emailLayout({
    preheader: "Reset your ENCORE password",
    headerIcon: "🔒",
    headerTitle: "Password Reset",
    headerSubtitle: "Secure your account",
    body,
  });
}

/** 9. Royalty statement email */
export function royaltyStatementEmail(opts: {
  recipientName: string;
  statementPeriod: string;
  totalEarnings: string;
  totalPaid: string;
  balance: string;
  lineItems?: Array<{ title: string; amount: string; source: string }>;
}): string {
  const itemRows = (opts.lineItems || [])
    .map(item => `<tr>
      <td style="padding:8px 12px;font-size:13px;color:${COLORS.text};border-bottom:1px solid ${COLORS.border};">${item.title}</td>
      <td style="padding:8px 12px;font-size:13px;color:${COLORS.textMuted};border-bottom:1px solid ${COLORS.border};">${item.source}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;color:${COLORS.text};text-align:right;border-bottom:1px solid ${COLORS.border};">${item.amount}</td>
    </tr>`)
    .join("");

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Dear ${opts.recipientName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Your royalty statement for <strong style="color:${COLORS.text};">${opts.statementPeriod}</strong> is ready.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Total Earnings", opts.totalEarnings, COLORS.success)}
        ${detailRow("Total Paid", opts.totalPaid)}
        ${detailRow("Balance", opts.balance, COLORS.primary)}
      </table>
    `, "💰")}
    ${itemRows ? `
    <h3 style="font-size:15px;color:${COLORS.text};margin:24px 0 12px;">Earnings Breakdown</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;">
      <tr style="background:${COLORS.bgLight};">
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Work</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Source</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Amount</td>
      </tr>
      ${itemRows}
    </table>
    ` : ""}
    ${ctaButton("View Full Statement", "https://www.encoremusic.tech/dashboard/royalties")}
    <p style="font-size:13px;color:${COLORS.textLight};margin:16px 0 0;text-align:center;">
      Questions about your statement? <a href="mailto:support@encoremusic.tech?subject=Royalty%20Statement%20Inquiry%20-%20${encodeURIComponent(opts.statementPeriod)}" style="color:${COLORS.primary};">Contact support →</a>
    </p>
  `;

  return emailLayout({
    preheader: `Your royalty statement for ${opts.statementPeriod} is ready`,
    headerIcon: "📊",
    headerTitle: "Royalty Statement",
    headerSubtitle: opts.statementPeriod,
    body,
  });
}

/** 10. Contract expiration warning */
export function contractExpirationEmail(opts: {
  recipientName: string;
  contractTitle: string;
  expirationDate: string;
  daysRemaining: number;
  contractType: string;
  counterpartyName: string;
}): string {
  const isUrgent = opts.daysRemaining <= 7;
  const accentColor = isUrgent ? COLORS.danger : COLORS.warning;

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Hi ${opts.recipientName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      ${isUrgent ? `<strong style="color:${COLORS.danger};">Urgent:</strong> ` : ""}Your contract is ${isUrgent ? "expiring very soon" : "approaching its expiration date"}.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Contract", opts.contractTitle)}
        ${detailRow("Type", `<span style="text-transform:capitalize;">${opts.contractType}</span>`)}
        ${detailRow("Counterparty", opts.counterpartyName)}
        ${detailRow("Expires", opts.expirationDate)}
        ${detailRow("Days Remaining", `<span style="color:${accentColor};font-weight:700;">${opts.daysRemaining} day${opts.daysRemaining !== 1 ? "s" : ""}</span>`)}
      </table>
    `, isUrgent ? "🚨" : "⏰")}
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Please review this contract and take any necessary action before the expiration date.
    </p>
    ${ctaButton("Review Contract", "https://www.encoremusic.tech/dashboard/contracts")}
    <p style="font-size:13px;color:${COLORS.textLight};margin:16px 0 0;text-align:center;">
      Need to renew? <a href="mailto:support@encoremusic.tech?subject=Contract%20Renewal%20-%20${encodeURIComponent(opts.contractTitle)}" style="color:${COLORS.primary};">Contact us →</a>
    </p>
  `;

  return emailLayout({
    preheader: `${isUrgent ? "URGENT: " : ""}Contract "${opts.contractTitle}" expires in ${opts.daysRemaining} days`,
    headerIcon: isUrgent ? "🚨" : "⏰",
    headerTitle: isUrgent ? "Contract Expiring Soon!" : "Contract Expiration Notice",
    headerSubtitle: `${opts.daysRemaining} days remaining`,
    body,
    accentColor: isUrgent ? COLORS.danger : undefined,
  });
}

/** 11. Payment confirmation email */
export function paymentConfirmationEmail(opts: {
  recipientName: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceId: string;
  period?: string;
}): string {
  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Dear ${opts.recipientName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Your royalty payment has been processed successfully.
    </p>
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment Amount</p>
      <p style="margin:0;font-size:36px;font-weight:800;color:#047857;">${opts.paymentAmount}</p>
    </div>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference", opts.referenceId)}
        ${detailRow("Date", opts.paymentDate)}
        ${detailRow("Method", opts.paymentMethod)}
        ${opts.period ? detailRow("Period", opts.period) : ""}
        ${detailRow("Status", `<span style="color:${COLORS.success};font-weight:700;">✓ Completed</span>`)}
      </table>
    `, "🧾")}
    ${ctaButton("View Payment History", "https://www.encoremusic.tech/dashboard/royalties")}
    <p style="font-size:13px;color:${COLORS.textLight};margin:16px 0 0;text-align:center;">
      Questions? <a href="mailto:support@encoremusic.tech?subject=Payment%20Inquiry%20-%20${encodeURIComponent(opts.referenceId)}" style="color:${COLORS.primary};">Contact support →</a>
    </p>
  `;

  return emailLayout({
    preheader: `Payment of ${opts.paymentAmount} processed successfully`,
    headerIcon: "✅",
    headerTitle: "Payment Confirmed",
    headerSubtitle: `Reference: ${opts.referenceId}`,
    body,
    accentColor: COLORS.success,
  });
}

/** 12. Monthly billing invoice */
export function monthlyInvoiceEmail(opts: {
  recipientName: string;
  companyName: string;
  invoiceId: string;
  invoiceDate: string;
  dueDate: string;
  modules: Array<{ name: string; price: string }>;
  subtotal: string;
  tax?: string;
  total: string;
  paymentUrl?: string;
}): string {
  const moduleRows = opts.modules
    .map(m => `<tr>
      <td style="padding:10px 12px;font-size:14px;color:${COLORS.text};border-bottom:1px solid ${COLORS.border};">${m.name}</td>
      <td style="padding:10px 12px;font-size:14px;font-weight:600;color:${COLORS.text};text-align:right;border-bottom:1px solid ${COLORS.border};">${m.price}</td>
    </tr>`)
    .join("");

  const body = `
    <p style="font-size:16px;color:${COLORS.text};margin:0 0 16px;">Dear ${opts.recipientName},</p>
    <p style="font-size:15px;color:${COLORS.textMuted};line-height:1.7;margin:0 0 24px;">
      Here is your monthly invoice for <strong style="color:${COLORS.text};">${opts.companyName}</strong>.
    </p>
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Invoice #", opts.invoiceId)}
        ${detailRow("Date", opts.invoiceDate)}
        ${detailRow("Due Date", opts.dueDate)}
      </table>
    `, "📋")}
    <h3 style="font-size:15px;color:${COLORS.text};margin:24px 0 12px;">Module Breakdown</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;">
      <tr style="background:${COLORS.bgLight};">
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Module</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Price</td>
      </tr>
      ${moduleRows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="padding:6px 12px;font-size:14px;color:${COLORS.textMuted};">Subtotal</td>
        <td style="padding:6px 12px;font-size:14px;color:${COLORS.text};text-align:right;">${opts.subtotal}</td>
      </tr>
      ${opts.tax ? `<tr>
        <td style="padding:6px 12px;font-size:14px;color:${COLORS.textMuted};">Tax</td>
        <td style="padding:6px 12px;font-size:14px;color:${COLORS.text};text-align:right;">${opts.tax}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:12px 12px 6px;font-size:18px;font-weight:800;color:${COLORS.text};border-top:2px solid ${COLORS.border};">Total</td>
        <td style="padding:12px 12px 6px;font-size:18px;font-weight:800;color:${COLORS.primary};text-align:right;border-top:2px solid ${COLORS.border};">${opts.total}</td>
      </tr>
    </table>
    ${ctaButton("View Invoice & Pay", opts.paymentUrl || "https://www.encoremusic.tech/dashboard/settings")}
    <p style="font-size:13px;color:${COLORS.textLight};margin:16px 0 0;text-align:center;">
      Billing questions? <a href="mailto:support@encoremusic.tech?subject=Invoice%20Inquiry%20-%20${encodeURIComponent(opts.invoiceId)}" style="color:${COLORS.primary};">Contact billing support →</a>
    </p>
  `;

  return emailLayout({
    preheader: `Invoice ${opts.invoiceId} — ${opts.total} due ${opts.dueDate}`,
    headerIcon: "🧾",
    headerTitle: "Monthly Invoice",
    headerSubtitle: `Invoice ${opts.invoiceId}`,
    body,
  });
}
