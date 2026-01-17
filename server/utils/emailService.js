const Brevo = require("@getbrevo/brevo");

// Initialize Brevo API Instance
let apiInstance = new Brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// -----------------------------
// CORE EMAIL SENDER (BREVO API)
// -----------------------------
const sendEmail = async (to, subject, htmlContent) => {
  try {
    let sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: "ScoreVeda",
      email: "scorevedaofficial@gmail.com",
    };
    sendSmtpEmail.to = [{ email: to }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 Brevo API: Email sent successfully to ${to}`);
    }
    return true;
  } catch (error) {
    console.error("❌ Brevo API Error:", error.message);
    return false;
  }
};

// --- 🎨 SHARED STYLES ---
const wrapperStyle = `font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;`;
const containerStyle = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;`;
const headerStyle = `background: linear-gradient(135deg, #4c2a85 0%, #6c3db5 100%); padding: 30px; text-align: center;`;
const contentStyle = `padding: 30px; line-height: 1.6; font-size: 16px; color: #555;`;
const footerStyle = `background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888;`;
const btnStyle = `display: inline-block; background-color: #4c2a85; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; margin-top: 20px;`;

// -----------------------------
// EMAIL TEMPLATES
// -----------------------------

const sendWelcomeEmail = (email, name) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="${headerStyle}"><h1 style="color: #fff; margin:0; font-size: 24px;">Welcome Aboard! 🚀</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><p>We are thrilled to have you join <strong>ScoreVeda</strong>! Your account has been successfully created.</p><div style="text-align: center;"><a href="${process.env.FRONTEND_URL || "#"}/login" style="${btnStyle}">Login to Dashboard</a></div><p style="margin-top: 30px;">Happy Learning,<br/>The ScoreVeda Team</p></div><div style="${footerStyle}"><p>&copy; ${new Date().getFullYear()} ScoreVeda. All rights reserved.</p></div></div></div>`;
  return sendEmail(email, "Welcome to ScoreVeda! 🚀", html);
};

const sendOtpEmail = (
  email,
  name,
  otpCode,
  subject = "Verify Your Account",
) => {
  const title = subject.toLowerCase().includes("deletion")
    ? "Confirm Account Deletion"
    : "Verify Your Email";
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="${headerStyle}"><h1 style="color: #fff; margin:0; font-size: 24px;">${title}</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><p>Please use the verification code below to complete your action. This code is valid for 10 minutes.</p><div style="background: #f0f4f8; border-left: 5px solid #4c2a85; padding: 20px; margin: 25px 0; text-align: center;"><span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4c2a85;">${otpCode}</span></div><p style="font-size: 14px; color: #999;">If you did not request this, please ignore this email immediately.</p></div><div style="${footerStyle}"><p>Secure Verification System • ScoreVeda</p></div></div></div>`;
  return sendEmail(email, subject, html);
};

const sendForgotPasswordOtpEmail = (email, name, otpCode) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 30px; text-align: center;"><h1 style="color: #fff; margin:0; font-size: 24px;">🔐 Password Reset</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><p>Use the code below to proceed with your reset:</p><div style="background: #fff8f0; border: 1px dashed #e67e22; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;"><span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d35400;">${otpCode}</span></div></div><div style="${footerStyle}"><p>&copy; ${new Date().getFullYear()} ScoreVeda Security</p></div></div></div>`;
  return sendEmail(email, "Reset Your Password", html);
};

const sendPasswordChangedEmail = (email, name) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;"><h1 style="color: #fff; margin:0; font-size: 24px;">✅ Password Updated</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><p>Your password was changed successfully.</p></div><div style="${footerStyle}"><p>&copy; ${new Date().getFullYear()} ScoreVeda Security</p></div></div></div>`;
  return sendEmail(email, "Security Alert: Password Changed", html);
};

const sendExamSubmissionEmail = (email, name, examTitle) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="${headerStyle}"><h1 style="color: #fff; margin:0; font-size: 24px;">Submission Received 📝</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><p>Submission received for <strong>${examTitle}</strong>.</p></div><div style="${footerStyle}"><p>&copy; ${new Date().getFullYear()} ScoreVeda Exams</p></div></div></div>`;
  return sendEmail(email, `Exam Submitted: ${examTitle}`, html);
};

const sendResultUpdateEmail = (
  email,
  name,
  examTitle,
  score,
  total,
  hasCert,
  resultId,
) => {
  let certMsg = hasCert
    ? `<p style="color: #27ae60; font-weight: bold; background: #e8f8f5; padding: 10px; border-radius: 5px;">🎓 Congratulations! You passed. Your certificate is ready.</p>`
    : `<p>Check your analysis on the portal.</p>`;
  const resultLink = `${process.env.FRONTEND_URL || "https://score-veda.vercel.app"}/result/${resultId}`;
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="background: linear-gradient(135deg, #2980b9 0%, #3498db 100%); padding: 30px; text-align: center;"><h1 style="color: #fff; margin:0; font-size: 24px;">Results Declared! 📢</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><div style="text-align: center; margin: 30px 0;"><h2 style="font-size: 48px; margin: 0; color: #333;">${score}<span style="font-size: 24px; color: #999;">/${total}</span></h2></div>${certMsg}<div style="text-align: center;"><a href="${resultLink}" style="${btnStyle}">View Result</a></div></div><div style="${footerStyle}"><p>&copy; ${new Date().getFullYear()} ScoreVeda Results</p></div></div></div>`;
  return sendEmail(email, `Result Update: ${examTitle}`, html);
};

const sendChangeEmailOtpEmail = (email, name, otpCode) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="${headerStyle}"><h1 style="color: #fff; margin:0; font-size: 24px;">Verify New Email</h1></div><div style="${contentStyle}"><p>Hi <strong>${name}</strong>,</p><div style="background: #f0f4f8; border-left: 5px solid #4c2a85; padding: 20px; margin: 25px 0; text-align: center;"><span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4c2a85;">${otpCode}</span></div></div></div></div>`;
  return sendEmail(email, "Verify New Email – ScoreVeda", html);
};

const sendEmailChangedConfirmationEmail = (email, name, oldEmail, newEmail) => {
  const html = `<div style="${wrapperStyle}"><div style="${containerStyle}"><div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;"><h1 style="color: #fff; margin:0; font-size: 24px;">Email Updated ✅</h1></div><div style="${contentStyle}"><p>Changed from ${oldEmail} to ${newEmail}</p></div></div></div>`;
  return sendEmail(email, "Security Alert: Email Changed", html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOtpEmail,
  sendForgotPasswordOtpEmail,
  sendPasswordChangedEmail,
  sendExamSubmissionEmail,
  sendResultUpdateEmail,
  sendChangeEmailOtpEmail,
  sendEmailChangedConfirmationEmail,
};
