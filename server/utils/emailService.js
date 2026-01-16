const nodemailer = require("nodemailer");
const dns = require("dns");

// --- ☢️ THE NUCLEAR FIX: FORCE IPv4 GLOBALLY ---
// This tells Node.js to prefer IPv4 for ALL connections in this file.
// This fixes the specific "Connection Timeout" on Render Free Tier.
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (error) {
    console.warn("Could not set default result order (not critical)");
  }
}

// --- UPDATED CONFIGURATION (SSL MODE) ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // ⬅️ CHANGED: 465 is "Implicit SSL" (more reliable on cloud)
  secure: true, // ⬅️ CHANGED: Must be TRUE for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Network Stability Settings
  connectionTimeout: 20000, // Increased to 20 seconds
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false,
  },
});

// --- HELPER: RETRY WRAPPER ---
const sendWithRetry = async (mailOptions, retries = 2) => {
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.warn(`⚠️ Email attempt failed. Error: ${err.message}`);
    if (retries > 0) {
      console.warn(`⏳ Retrying... (${retries} attempts left)`);
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return sendWithRetry(mailOptions, retries - 1);
    }
    throw err;
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"ScoreVeda" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    await sendWithRetry(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 Email sent to ${to}`);
    }
    return true; // Return true on success
  } catch (error) {
    console.error("📛 CRITICAL EMAIL ERROR:", error.message);
    // Return false so the frontend knows it failed (if you handled that logic)
    return false;
  }
};

// --- PRE-DEFINED EMAIL TEMPLATES ---

const sendWelcomeEmail = (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4c2a85;">Welcome to ScoreVeda! 🚀</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account has been successfully created.</p>
      <p>You can now login and start exploring exams.</p>
      <br/>
      <p>Happy Learning,<br/>The ScoreVeda Team</p>
    </div>
  `;
  return sendEmail(email, "Welcome to ScoreVeda!", html);
};

const sendExamSubmissionEmail = (email, name, examTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2ecc71;">Exam Submitted Successfully ✅</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We have received your submission for <strong>${examTitle}</strong>.</p>
      <p>Please wait for the teacher to grade your theory answers. You will be notified once the results are out.</p>
    </div>
  `;

  return sendEmail(email, `Submission Received: ${examTitle}`, html);
};

const sendResultUpdateEmail = (
  email,
  name,
  examTitle,
  score,
  total,
  hasCert,
  resultId
) => {
  let certMsg = hasCert
    ? `<p style="color: #27ae60; font-weight: bold;">🎓 Congratulations! You passed. You can now download your Certificate from your profile.</p>`
    : `<p>Check your detailed performance analysis on the portal.</p>`;

  const resultLink = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/result/${resultId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #3498db;">Results Declared! 📢</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your marks for <strong>${examTitle}</strong> have been updated.</p>
      <h3>Score: ${score} / ${total}</h3>
      ${certMsg}
      <br/>
      <p>
        <a href="${resultLink}"
        style="background: #4c2a85; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Result
        </a>
      </p>
    </div>
  `;
  return sendEmail(email, `Result Update: ${examTitle}`, html);
};

const sendOtpEmail = (
  email,
  name,
  otpCode,
  subject = "Your Verification Code"
) => {
  const title = subject.toLowerCase().includes("deletion")
    ? "Confirm Account Deletion"
    : "Verify Your Account";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #4c2a85; text-align: center;">${title}</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use the One Time Password (OTP) below to proceed. This code expires in 10 minutes.</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
        ${otpCode}
      </div>
      <p style="font-size: 12px; color: #777; text-align: center;">If you didn't request this, please ignore this email immediately.</p>
    </div>
  `;
  return sendEmail(email, subject, html);
};

const sendForgotPasswordOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 520px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
      <h2 style="color: #e67e22; text-align: center;">🔐 Password Reset Request</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your <strong>ScoreVeda</strong> account password.</p>
      <p>Please use the OTP below to reset your password. This OTP is valid for <strong>10 minutes</strong>.</p>
      <div style="background: #fff3cd; border: 1px dashed #f39c12; padding: 16px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #d35400; margin: 20px 0;">
        ${otpCode}
      </div>
      <p style="font-size: 14px;">If you did <strong>not</strong> request a password reset, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #777; text-align: center; margin-top: 25px;">© ${new Date().getFullYear()} ScoreVeda · All rights reserved</p>
    </div>
  `;
  return sendEmail(email, "Password Reset OTP – ScoreVeda", html);
};

const sendPasswordChangedEmail = (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 520px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
      <h2 style="color: #27ae60; text-align: center;">✅ Password Changed Successfully</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>This is a confirmation that your <strong>ScoreVeda</strong> account password has been changed successfully.</p>
      <p style="color: #c0392b;">⚠️ If you did NOT change your password, please contact support immediately.</p>
      <p style="font-size: 12px; color: #777; text-align: center; margin-top: 25px;">© ${new Date().getFullYear()} ScoreVeda · All rights reserved</p>
    </div>
  `;
  return sendEmail(email, "Your Password Was Changed – ScoreVeda", html);
};

const sendChangeEmailOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 520px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
      <h2 style="color: #2980b9; text-align: center;">📧 Verify New Email Address</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>You requested to change your email address for your <strong>ScoreVeda</strong> account.</p>
      <p>Please use the OTP below to verify your new email address. This OTP is valid for <strong>10 minutes</strong>.</p>
      <div style="background: #ecf5ff; border: 1px dashed #3498db; padding: 16px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #2980b9; margin: 20px 0;">
        ${otpCode}
      </div>
      <p style="font-size: 12px; color: #777; text-align: center; margin-top: 25px;">© ${new Date().getFullYear()} ScoreVeda · All rights reserved</p>
    </div>
  `;
  return sendEmail(email, "Verify New Email – ScoreVeda", html);
};

const sendEmailChangedConfirmationEmail = (email, name, oldEmail, newEmail) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 520px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
      <h2 style="color: #27ae60; text-align: center;">✅ Email Address Updated</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>ScoreVeda</strong> account email address has been changed successfully.</p>
      <p><strong>Old Email:</strong> ${oldEmail}<br/><strong>New Email:</strong> ${newEmail}</p>
      <p style="color: #c0392b;">⚠️ If you did NOT make this change, please contact support immediately.</p>
      <p style="font-size: 12px; color: #777; text-align: center; margin-top: 25px;">© ${new Date().getFullYear()} ScoreVeda · All rights reserved</p>
    </div>
  `;
  return sendEmail(email, "Email Address Changed – ScoreVeda", html);
};

module.exports = {
  sendWelcomeEmail,
  sendExamSubmissionEmail,
  sendResultUpdateEmail,
  sendOtpEmail,
  sendForgotPasswordOtpEmail,
  sendPasswordChangedEmail,
  sendChangeEmailOtpEmail,
  sendEmailChangedConfirmationEmail,
  sendEmail,
};
