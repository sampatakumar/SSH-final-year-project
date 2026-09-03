import axios from "axios";
import { env } from "../../config/env.js";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
} from "./email.templates.js";

// In-memory buffer for testing & local inspectability
const sentEmailsLog = [];

export const emailService = {
  /**
   * Send an email through the configured provider
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML body
   * @param {string} options.text - Plaintext body fallback
   */
  sendEmail: async ({ to, subject, html, text }) => {
    const from = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM.includes("<") ? env.EMAIL_FROM.match(/<([^>]+)>/)[1] : env.EMAIL_FROM}>`;

    const emailRecord = {
      to,
      from,
      subject,
      html,
      text,
      sentAt: new Date().toISOString(),
      provider: env.EMAIL_PROVIDER,
    };

    // 1. Resend Provider
    if (env.EMAIL_PROVIDER === "resend" && env.EMAIL_API_KEY) {
      try {
        const response = await axios.post(
          "https://api.resend.com/emails",
          {
            from: env.EMAIL_FROM,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            text,
          },
          {
            headers: {
              Authorization: `Bearer ${env.EMAIL_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        emailRecord.providerId = response.data?.id;
        sentEmailsLog.push(emailRecord);
        return { success: true, id: response.data?.id };
      } catch (error) {
        console.error("[EmailService:Resend] Error sending email:", error.response?.data || error.message);
        throw new Error(`Failed to send email via Resend: ${error.response?.data?.message || error.message}`);
      }
    }

    // 2. Mock / Console / Dev Mode
    sentEmailsLog.push(emailRecord);
    if (env.NODE_ENV !== "test") {
      console.log(`\n================== [EMAIL SERVICE (${env.EMAIL_PROVIDER.toUpperCase()})] ==================`);
      console.log(`To:      ${to}`);
      console.log(`From:    ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Time:    ${emailRecord.sentAt}`);
      console.log(`---------------------------------------------------------------`);
      console.log(text);
      console.log(`========================================================================\n`);
    }

    return { success: true, mock: true, id: `mock-${Date.now()}` };
  },

  /**
   * Helper to send custom Smart Skill Hub verification email
   */
  sendVerificationEmail: async ({ to, firstName, verificationLink }) => {
    const template = getVerificationEmailTemplate({ firstName, verificationLink });
    return emailService.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  },

  /**
   * Helper to send custom Smart Skill Hub password reset email
   */
  sendPasswordResetEmail: async ({ to, firstName, resetLink }) => {
    const template = getPasswordResetEmailTemplate({ firstName, resetLink });
    return emailService.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  },

  /**
   * Retrieve sent emails log (for testing)
   */
  getSentEmails: () => [...sentEmailsLog],

  /**
   * Clear sent emails log (for test cleanup)
   */
  clearSentEmails: () => {
    sentEmailsLog.length = 0;
  },
};

export default emailService;
