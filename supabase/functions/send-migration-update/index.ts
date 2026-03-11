import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function migrationUpdateEmail(companyName: string): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Migration Update — ${companyName}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;">Migration Tracker is live — here's how to track progress and upload your data directly.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
  <div style="display:inline-block;background:#6366f1;border-radius:14px;padding:8px 22px;margin-bottom:12px;">
    <span style="font-size:12px;font-weight:800;color:#fff;letter-spacing:0.5px;">ENCORE</span>
  </div>
  <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#fff;">📋 Migration Update</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">${companyName} — Data Migration Progress</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#ffffff;padding:32px 40px;border-radius:0 0 12px 12px;">

  <!-- Intro -->
  <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 20px;">
    Hi ${companyName} Team,
  </p>
  <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
    Your <strong>Migration Tracker</strong> is now live on ENCORE. This tool gives you full visibility into every phase of your data migration — from initial setup through final validation.
  </p>

  <!-- Section 1: Migration Tracker -->
  <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #6366f1;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">📊 How to Use the Migration Tracker</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Navigate to your <strong>Account Detail</strong> page and open the <strong>Migration</strong> tab</li>
      <li>View real-time progress across all migration phases (Setup → Mapping → Validation → Ingestion → QA)</li>
      <li>Each entity (contracts, copyrights, contacts, catalog items) is tracked individually</li>
      <li>Use the <strong>Sync from DB</strong> button to refresh counts from your live database at any time</li>
      <li>Upload a CSV migration report to compare source-system totals against ingested data</li>
    </ul>
  </div>

  <!-- Section 2: Data Security -->
  <div style="background:#f0fdf4;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #22c55e;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">🔒 Data Security & Residency</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>All data is stored in a dedicated <strong>Supabase PostgreSQL</strong> database with row-level security (RLS)</li>
      <li>Your data is logically isolated — only authorized users within your account can access it</li>
      <li>All connections are encrypted in transit (TLS 1.2+) and at rest (AES-256)</li>
      <li>ENCORE staff access is audit-logged and restricted to support purposes only</li>
    </ul>
  </div>

  <!-- Section 3: Uploading Contracts -->
  <div style="background:#fef9f0;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #f59e0b;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">📄 Uploading Contracts</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 10px;">
      You can upload and manage your contracts directly from the platform:
    </p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Navigate to your <strong>Account Detail</strong> page and select the <strong>Contracts</strong> tab</li>
      <li>Click the <strong>Upload</strong> tab to upload individual contract PDFs</li>
      <li>Our AI-powered parser will automatically extract key terms, interested parties, and schedules from the PDF</li>
      <li>Review the extracted data across three tabs: <strong>Details</strong>, <strong>PDF Preview</strong>, and <strong>Analysis</strong></li>
      <li>Confirm and save — the contract will be linked to your account and visible in the Contracts List</li>
      <li>For bulk imports, use the <strong>Bulk Import</strong> tab to upload a spreadsheet of contract metadata</li>
    </ul>
  </div>

  <!-- Section 4: Uploading Copyrights / Works -->
  <div style="background:#f0f4ff;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #3b82f6;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">🎵 Uploading Copyrights / Works</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 10px;">
      Upload your works catalog directly into the system:
    </p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Navigate to the <strong>Works</strong> tab in your Account Detail page</li>
      <li>Click the <strong>Upload</strong> tab to upload a spreadsheet of your works catalog</li>
      <li>The system accepts standard spreadsheet formats with columns for work title, writers, publishers, ISWC, and other metadata</li>
      <li>Review the grouped and validated works before committing them to the database</li>
      <li>Uploaded works will appear in the <strong>Works List</strong> and can be linked to contracts</li>
    </ul>
  </div>

  <!-- Section 5: Phase 4 Action Items -->
  <div style="background:#fdf2f8;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #ec4899;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">🎯 Phase 4: Ingestion — Action Items</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 10px;">
      We're now entering the <strong>Ingestion</strong> phase. Here's what you can do to accelerate the process:
    </p>
    <ol style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Upload your contract PDFs via the Contracts tab (individually or in bulk)</li>
      <li>Upload your works/copyrights spreadsheet via the Works tab</li>
      <li>Review any AI-extracted data for accuracy and correct where needed</li>
      <li>Use the Migration Tracker to verify entity counts match your source systems</li>
    </ol>
  </div>

  <!-- Section 6: Phase 5 Preview -->
  <div style="background:#f5f3ff;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #8b5cf6;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">🔮 Coming Next: Phase 5 — Validation & QA</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0;">
      Once ingestion is complete, we'll run a full validation pass comparing your source data against ingested records. 
      You'll receive a detailed reconciliation report highlighting any discrepancies, with tools to resolve them directly in the platform.
    </p>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin:28px 0 12px;">
    <a href="https://encore-live.lovable.app" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">
      Open ENCORE Platform →
    </a>
  </div>

  <p style="font-size:13px;color:#94a3b8;text-align:center;margin:16px 0 0;">
    Questions? Reply to this email or reach out to <a href="mailto:support@encoremusic.tech" style="color:#6366f1;">support@encoremusic.tech</a>
  </p>

</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#94a3b8;">© ${year} ENCORE Music Technology. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[MIGRATION-UPDATE] Function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, company_name } = await req.json();

    if (!to_email) {
      throw new Error("Missing required field: to_email");
    }

    const companyName = company_name || "Your Company";
    console.log("[MIGRATION-UPDATE] Sending to:", to_email, "for company:", companyName);

    const htmlContent = migrationUpdateEmail(companyName);

    const result = await sendGmail({
      to: [to_email],
      subject: `${companyName} — Migration Tracker Update & Upload Instructions`,
      html: htmlContent,
      from: "Encore Music",
    });

    console.log("[MIGRATION-UPDATE] Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, message: "Migration update email sent", email_id: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[MIGRATION-UPDATE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
