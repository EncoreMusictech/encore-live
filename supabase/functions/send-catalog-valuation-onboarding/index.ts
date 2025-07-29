import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  user_id?: string;
  user_email: string;
  module_id: string;
  access_source: string;
}

const generateEmailHTML = (userEmail: string, accessSource: string) => {
  const firstName = userEmail.split('@')[0].split('.')[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Catalog Valuation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            font-weight: bold;
        }
        h1 {
            color: #1e293b;
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 0;
        }
        .welcome-message {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .feature-item {
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            text-align: center;
        }
        .feature-icon {
            width: 40px;
            height: 40px;
            background: #667eea;
            border-radius: 8px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .getting-started {
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        .step-number {
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .feature-grid {
                grid-template-columns: 1fr;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CV</div>
            <h1>Welcome to Catalog Valuation!</h1>
            <p class="subtitle">Your professional music IP valuation platform</p>
        </div>

        <div class="welcome-message">
            <h2 style="margin-top: 0; color: #1e293b;">Hello ${capitalizedName}! 👋</h2>
            <p style="margin-bottom: 0;">You now have access to our industry-leading catalog valuation tools. We're excited to help you make informed decisions about your music investments and catalog acquisitions.</p>
        </div>

        <h3 style="color: #1e293b; margin-bottom: 20px;">🎯 Key Features You Can Use Now</h3>
        
        <div class="feature-grid">
            <div class="feature-item">
                <div class="feature-icon">📊</div>
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">DCF Analysis</h4>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Advanced discounted cash flow modeling with industry benchmarks</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">📈</div>
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">Risk Assessment</h4>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Comprehensive risk analysis and confidence scoring</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">🎵</div>
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">Spotify Integration</h4>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Real-time streaming data and popularity metrics</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">💰</div>
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">Multiple Valuations</h4>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Compare DCF, multiple-based, and risk-adjusted values</p>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="https://plxsenykjisqutxcvjeg.supabase.co/catalog-valuation" class="cta-button">
                Start Your First Valuation →
            </a>
        </div>

        <div class="getting-started">
            <h3 style="color: #1e293b; margin-top: 0;">🚀 Getting Started (3 Simple Steps)</h3>
            
            <div class="step">
                <div class="step-number">1</div>
                <div>
                    <strong>Search for an Artist</strong><br>
                    <span style="color: #64748b;">Use our Spotify integration to find and analyze any artist's catalog</span>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">2</div>
                <div>
                    <strong>Configure Your Analysis</strong><br>
                    <span style="color: #64748b;">Set your valuation parameters, discount rates, and growth assumptions</span>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">3</div>
                <div>
                    <strong>Review Results</strong><br>
                    <span style="color: #64748b;">Get comprehensive valuation reports with confidence scores and risk analysis</span>
                </div>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <h3 style="color: #1e293b; margin-top: 0;">💡 Pro Tip</h3>
            <p style="margin-bottom: 0; color: #475569;">Start with popular artists to see how our valuation engine compares to known market transactions. This will help you understand our methodology and build confidence in the platform.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin: 0 0 16px 0;">Need help getting started?</p>
            <a href="mailto:support@encoremusic.tech" style="color: #667eea; text-decoration: none; font-weight: 500;">Contact our support team →</a>
        </div>

        <div class="footer">
            <p>This email was sent because you gained access to the Catalog Valuation module${accessSource ? ` via ${accessSource}` : ''}.</p>
            <p style="margin: 8px 0 0 0;">
                <a href="https://plxsenykjisqutxcvjeg.supabase.co" style="color: #667eea; text-decoration: none;">Encore Music</a> | 
                Professional Music IP Management
            </p>
        </div>
    </div>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[CATALOG-ONBOARDING] Function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, user_email, module_id, access_source }: OnboardingEmailRequest = await req.json();
    
    console.log("[CATALOG-ONBOARDING] Processing email for:", { user_id, user_email, module_id });

    if (!user_email) {
      throw new Error("Missing required field: user_email");
    }

    // For test scenarios, use a default user_id if not provided
    const effectiveUserId = user_id || 'test-user-' + Date.now();

    // Generate the HTML email content
    const htmlContent = generateEmailHTML(user_email, access_source);
    
    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Encore Music <onboarding@resend.dev>",
      to: [user_email],
      subject: "Welcome to Catalog Valuation - Get Started Today!",
      html: htmlContent,
      tags: [
        { name: 'category', value: 'onboarding' },
        { name: 'module', value: 'catalog-valuation' },
        { name: 'user_id', value: effectiveUserId }
      ]
    });

    console.log("[CATALOG-ONBOARDING] Email sent successfully:", emailResponse);

    // Update the onboarding email record with delivery status
    if (emailResponse.data?.id) {
      await supabase
        .from('onboarding_emails')
        .update({ 
          delivery_status: 'sent',
          email_data: {
            resend_id: emailResponse.data.id,
            sent_at: new Date().toISOString(),
            access_source
          }
        })
        .eq('user_id', effectiveUserId)
        .eq('module_id', module_id)
        .eq('email_type', 'welcome');

      console.log("[CATALOG-ONBOARDING] Database updated with delivery status");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Onboarding email sent successfully",
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("[CATALOG-ONBOARDING] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);