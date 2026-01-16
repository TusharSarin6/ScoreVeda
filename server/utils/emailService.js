const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// -----------------------------
// CORE EMAIL SENDER
// -----------------------------
const sendEmail = async (to, subject, htmlContent) => {
  try {
    await resend.emails.send({
      from: "ScoreVeda <onboarding@resend.dev>", // free verified sender
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("📛 Resend Email Error:", error);
    return false;
  }
};

// -----------------------------
// EMAIL TEMPLATES
// -----------------------------

const sendWelcomeEmail = (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color:#4c2a85;">Welcome to ScoreVeda 🚀</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your account has been created successfully.</p>
      <p>Start attempting exams and earn certificates.</p>
      <br/>
      <p>– Team ScoreVeda</p>
    </div>
  `;
  return sendEmail(email, "Welcome to ScoreVeda!", html);
};

const sendOtpEmail = (email, name, otpCode, subject = "Verify Your Email") => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:500px;">
      <h2 style="color:#4c2a85;">Email Verification</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your OTP is:</p>
      <div style="
        font-size:24px;
        letter-spacing:6px;
        font-weight:bold;
        background:#f4f4f4;
        padding:12px;
        text-align:center;
        margin:20px 0;
      ">
        ${otpCode}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;
  return sendEmail(email, subject, html);
};

const sendForgotPasswordOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your password reset OTP:</p>
      <h1>${otpCode}</h1>
      <p>Valid for 10 minutes.</p>
    </div>
  `;
  return sendEmail(email, "Password Reset OTP – ScoreVeda", html);
};

const sendPasswordChangedEmail = (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Changed</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your password was changed successfully.</p>
      <p>If this wasn’t you, contact support immediately.</p>
    </div>
  `;
  return sendEmail(email, "Password Changed – ScoreVeda", html);
};

const sendExamSubmissionEmail = (email, name, examTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Exam Submitted ✅</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Your submission for <b>${examTitle}</b> has been received.</p>
    </div>
  `;
  return sendEmail(email, `Exam Submitted: ${examTitle}`, html);
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
  const resultLink = `${process.env.FRONTEND_URL}/result/${resultId}`;

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Results Declared 📢</h2>
      <p>Hi <b>${name}</b>,</p>
      <p><b>${examTitle}</b></p>
      <h3>${score} / ${total}</h3>
      ${
        hasCert
          ? "<p>🎓 Certificate unlocked!</p>"
          : "<p>Check detailed performance.</p>"
      }
      <a href="${resultLink}">View Result</a>
    </div>
  `;
  return sendEmail(email, `Result Update: ${examTitle}`, html);
};

const sendChangeEmailOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Verify New Email</h2>
      <p>Hi <b>${name}</b>,</p>
      <h1>${otpCode}</h1>
    </div>
  `;
  return sendEmail(email, "Verify New Email – ScoreVeda", html);
};

const sendEmailChangedConfirmationEmail = (email, name, oldEmail, newEmail) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Email Changed</h2>
      <p>${oldEmail} ➝ ${newEmail}</p>
    </div>
  `;
  return sendEmail(email, "Email Changed – ScoreVeda", html);
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
