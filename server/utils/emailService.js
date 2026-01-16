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

// --- 🎨 SHARED STYLES FOR CONSISTENCY ---
const wrapperStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f9f9f9;
  padding: 40px 20px;
  color: #333;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid #eee;
`;

const headerStyle = `
  background: linear-gradient(135deg, #4c2a85 0%, #6c3db5 100%);
  padding: 30px;
  text-align: center;
`;

const contentStyle = `
  padding: 30px;
  line-height: 1.6;
  font-size: 16px;
  color: #555;
`;

const footerStyle = `
  background-color: #f1f1f1;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #888;
`;

const btnStyle = `
  display: inline-block;
  background-color: #4c2a85;
  color: #ffffff;
  text-decoration: none;
  padding: 12px 25px;
  border-radius: 6px;
  font-weight: bold;
  margin-top: 20px;
`;

// -----------------------------
// EMAIL TEMPLATES
// -----------------------------

const sendWelcomeEmail = (email, name) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color: #fff; margin:0; font-size: 24px;">Welcome Aboard! 🚀</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We are thrilled to have you join <strong>ScoreVeda</strong>! Your account has been successfully created.</p>
          <p>You now have access to our comprehensive exam portal. Whether you are here to test your skills or prepare for your next big challenge, we've got you covered.</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || '#'}/login" style="${btnStyle}">Login to Dashboard</a>
          </div>
          <p style="margin-top: 30px;">Happy Learning,<br/>The ScoreVeda Team</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, "Welcome to ScoreVeda! 🚀", html);
};

const sendOtpEmail = (email, name, otpCode, subject = "Verify Your Account") => {
  // Customize title based on action (Deletion vs Verification)
  const title = subject.toLowerCase().includes("deletion") 
    ? "Confirm Account Deletion" 
    : "Verify Your Email";

  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color: #fff; margin:0; font-size: 24px;">${title}</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Please use the verification code below to complete your action. This code is valid for <strong>10 minutes</strong>.</p>
          
          <div style="background: #f0f4f8; border-left: 5px solid #4c2a85; padding: 20px; margin: 25px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4c2a85;">${otpCode}</span>
          </div>

          <p style="font-size: 14px; color: #999;">If you did not request this, please ignore this email immediately.</p>
        </div>
        <div style="${footerStyle}">
          <p>Secure Verification System • ScoreVeda</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
};

const sendForgotPasswordOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin:0; font-size: 24px;">🔐 Password Reset</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Use the code below to proceed:</p>
          
          <div style="background: #fff8f0; border: 1px dashed #e67e22; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d35400;">${otpCode}</span>
          </div>

          <p>This code expires in 10 minutes. If you didn't request a reset, you can safely ignore this email.</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Security</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, "Reset Your Password", html);
};

const sendPasswordChangedEmail = (email, name) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin:0; font-size: 24px;">✅ Password Updated</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>This is a confirmation that your <strong>ScoreVeda</strong> account password has been changed successfully.</p>
          <p style="background: #fbeaea; color: #c0392b; padding: 15px; border-radius: 5px; font-size: 14px;">
            ⚠️ If you did NOT make this change, please contact support immediately to secure your account.
          </p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Security</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, "Security Alert: Password Changed", html);
};

const sendExamSubmissionEmail = (email, name, examTitle) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color: #fff; margin:0; font-size: 24px;">Submission Received 📝</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We have successfully received your submission for <strong>${examTitle}</strong>.</p>
          <p>Your answers have been recorded. If this exam includes theory questions, please wait for your instructor to grade them.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #777;">You will be notified via email once the final results are declared.</p>
          </div>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Exams</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, `Exam Submitted: ${examTitle}`, html);
};

const sendResultUpdateEmail = (email, name, examTitle, score, total, hasCert, resultId) => {
  let certMsg = hasCert
    ? `<p style="color: #27ae60; font-weight: bold; background: #e8f8f5; padding: 10px; border-radius: 5px;">🎓 Congratulations! You passed. Your certificate is ready for download.</p>`
    : `<p>Check your detailed performance analysis on the portal.</p>`;

  const resultLink = `${process.env.FRONTEND_URL || "https://score-veda.vercel.app"}/result/${resultId}`;

  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #2980b9 0%, #3498db 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin:0; font-size: 24px;">Results Declared! 📢</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your marks for <strong>${examTitle}</strong> have been released.</p>
          
          <div style="text-align: center; margin: 30px 0;">
             <h2 style="font-size: 48px; margin: 0; color: #333;">${score}<span style="font-size: 24px; color: #999;">/${total}</span></h2>
             <p style="margin: 5px 0 0 0; color: #777; font-size: 14px;">YOUR SCORE</p>
          </div>

          ${certMsg}

          <div style="text-align: center;">
            <a href="${resultLink}" style="${btnStyle}">View Detailed Result</a>
          </div>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Results</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, `Result Update: ${examTitle}`, html);
};

const sendChangeEmailOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color: #fff; margin:0; font-size: 24px;">Verify New Email</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You requested to change your email address. Please verify this new address using the code below:</p>
          <div style="background: #f0f4f8; border-left: 5px solid #4c2a85; padding: 20px; margin: 25px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4c2a85;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #999;">Valid for 10 minutes.</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, "Verify New Email – ScoreVeda", html);
};

const sendEmailChangedConfirmationEmail = (email, name, oldEmail, newEmail) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin:0; font-size: 24px;">Email Updated ✅</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your account email address has been successfully updated.</p>
          <ul style="background: #f9f9f9; padding: 15px 30px; border-radius: 8px; list-style: none;">
            <li style="margin-bottom: 10px;"><strong>Old Email:</strong> ${oldEmail}</li>
            <li><strong>New Email:</strong> ${newEmail}</li>
          </ul>
          <p style="font-size: 14px; color: #c0392b; margin-top: 20px;">
            ⚠️ If you did NOT authorize this change, please contact support immediately.
          </p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda</p>
        </div>
      </div>
    </div>
  `;
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
