/**
 * Smart Skill Hub Custom Email Templates
 * Responsive, email-client safe HTML + Plain Text Fallback
 * Futuristic Developer / Glassmorphic Dark Aesthetic (Indigo & Cyan Accents)
 */

export const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Custom Verification Email Template
 */
export const getVerificationEmailTemplate = ({ firstName = "Developer", verificationLink }) => {
  const safeName = escapeHtml(firstName);
  const safeLink = escapeHtml(verificationLink);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify your Smart Skill Hub account</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .btn-hover:hover { background: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%) !important; box-shadow: 0 0 25px rgba(99, 102, 241, 0.6) !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07090e; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0d121f; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05); overflow: hidden;">
          
          <!-- Top Accent Glow Line -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #6366f1 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 8px 16px;">
                    <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                      ⚡ SMART SKILL HUB
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td align="center" style="padding: 0 32px 16px 32px;">
              <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 20px; padding: 4px 12px;">
                ACCOUNT VERIFICATION
              </span>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td align="center" style="padding: 0 32px 20px 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px; line-height: 1.3;">
                Verify your Smart Skill Hub account
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Hi <strong style="color: #f8fafc;">${safeName}</strong>,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Welcome to Smart Skill Hub.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                You're one step away from accessing your personalized learning, skill analytics, coding sandbox, GitHub intelligence, resume builder, and career development workspace.
              </p>

              <!-- CTA Button Container -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${safeLink}" target="_blank" class="btn-hover" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-decoration: none; text-transform: uppercase; padding: 14px 36px; border-radius: 12px; box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35); border: 1px solid rgba(255, 255, 255, 0.15);">
                      VERIFY EMAIL →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px; padding: 14px; margin-top: 10px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #38bdf8; font-family: monospace;">
                  <a href="${safeLink}" target="_blank" style="color: #38bdf8; text-decoration: none;">${safeLink}</a>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e293b;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  🔒 <strong>Security Notice:</strong> This verification link is intended only for the account associated with this email address. If you did not sign up for Smart Skill Hub, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #94a3b8;">
                Smart Skill Hub
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                AI-powered developer growth & intelligence platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Verify your Smart Skill Hub account

Hi ${firstName},

Welcome to Smart Skill Hub.

You're one step away from accessing your personalized learning, skill analytics, coding sandbox, GitHub intelligence, resume builder, and career development workspace.

To verify your email address, please click or visit the following link:
${verificationLink}

Security Notice:
This verification link is intended only for the account associated with this email address. If you did not sign up for Smart Skill Hub, you can safely ignore this email.

Smart Skill Hub
AI-powered developer growth & intelligence platform`;

  return { html, text, subject: "Verify your Smart Skill Hub account" };
};

/**
 * Custom Password Reset Email Template
 */
export const getPasswordResetEmailTemplate = ({ firstName = "Developer", resetLink }) => {
  const safeName = escapeHtml(firstName);
  const safeLink = escapeHtml(resetLink);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset your Smart Skill Hub password</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .btn-hover:hover { background: linear-gradient(135deg, #e11d48 0%, #db2777 100%) !important; box-shadow: 0 0 25px rgba(225, 29, 72, 0.6) !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #07090e; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07090e; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0d121f; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05); overflow: hidden;">
          
          <!-- Top Accent Glow Line (Security Rose / Amber) -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #f43f5e 0%, #ec4899 50%, #f43f5e 100%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 12px; padding: 8px 16px;">
                    <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase;">
                      ⚡ SMART SKILL HUB
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td align="center" style="padding: 0 32px 16px 32px;">
              <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #fb7185; background: rgba(251, 113, 133, 0.1); border: 1px solid rgba(251, 113, 133, 0.25); border-radius: 20px; padding: 4px 12px;">
                SECURITY REQUEST
              </span>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td align="center" style="padding: 0 32px 20px 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px; line-height: 1.3;">
                Reset your Smart Skill Hub password
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Hi <strong style="color: #f8fafc;">${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                We received a request to reset the password for your Smart Skill Hub account. If you made this request, please click the button below to set a new password:
              </p>

              <!-- CTA Button Container -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${safeLink}" target="_blank" class="btn-hover" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-decoration: none; text-transform: uppercase; padding: 14px 36px; border-radius: 12px; box-shadow: 0 8px 20px rgba(244, 63, 94, 0.35); border: 1px solid rgba(255, 255, 255, 0.15);">
                      RESET PASSWORD →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px; padding: 14px; margin-top: 10px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #fb7185; font-family: monospace;">
                  <a href="${safeLink}" target="_blank" style="color: #fb7185; text-decoration: none;">${safeLink}</a>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e293b;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  🔒 <strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #94a3b8;">
                Smart Skill Hub
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                AI-powered developer growth & intelligence platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Reset your Smart Skill Hub password

Hi ${firstName},

We received a request to reset the password for your Smart Skill Hub account. If you made this request, please click or visit the following link to set a new password:
${resetLink}

Security Notice:
If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.

Smart Skill Hub
AI-powered developer growth & intelligence platform`;

  return { html, text, subject: "Reset your Smart Skill Hub password" };
};
