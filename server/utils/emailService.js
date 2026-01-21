const Brevo = require("@getbrevo/brevo");

// Initialize Brevo API Instance
let apiInstance = new Brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// CORE EMAIL SENDER (BREVO API)
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

// ---  ENHANCED PROFESSIONAL STYLES ---
const wrapperStyle = `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 50px 20px; color: #2c3e50;`;
const containerStyle = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eef2f3;`;
const headerStyle = `background: linear-gradient(135deg, #4c2a85 0%, #6c3db5 100%); padding: 40px 30px; text-align: center; color: #ffffff;`;
const contentStyle = `padding: 40px 35px; line-height: 1.8; font-size: 16px; color: #444;`;
const footerStyle = `background-color: #fbfbfc; padding: 25px; text-align: center; font-size: 13px; color: #95a5a6; border-top: 1px solid #f0f0f0;`;
const btnStyle = `display: inline-block; background: linear-gradient(to right, #4c2a85, #6c3db5); color: #ffffff !important; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 12px rgba(76, 42, 133, 0.2); transition: all 0.3s ease;`;
const badgeStyle = `display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px;`;

// -----------------------------
// EMAIL TEMPLATES
// -----------------------------

const sendWelcomeEmail = (email, name) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <div style="font-size: 50px; margin-bottom: 10px;">🚀</div>
          <h1 style="margin:0; font-size: 28px; letter-spacing: 1px;">Welcome to ScoreVeda</h1>
        </div>
        <div style="${contentStyle}">
          <span style="${badgeStyle} background-color: #e8f5e9; color: #2e7d32;">Account Verified</span>
          <p>Hi <strong>${name}</strong>,</p>
          <p>The future of academic excellence starts here. We are excited to have you on board! Your account is now active and ready for use.</p>
          <p>ScoreVeda is designed to help you streamline your examination process with precision and ease. Log in now to explore your personalized dashboard.</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "#"}/login" style="${btnStyle}">Access Dashboard</a>
          </div>
          <p style="margin-top: 35px; border-top: 1px solid #eee; pt: 20px; font-style: italic;">Best Regards,<br/><strong>Team ScoreVeda</strong></p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Portal. All rights reserved.</p>
          <p>You received this email because you registered on ScoreVeda.</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, "Welcome to ScoreVeda! 🚀", html);
};

const sendOtpEmail = (
  email,
  name,
  otpCode,
  subject = "Verify Your Account",
) => {
  const isDeletion = subject.toLowerCase().includes("deletion");
  const title = isDeletion ? "Security Confirmation" : "Email Verification";
  const color = isDeletion ? "#e74c3c" : "#4c2a85";

  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: ${color}; padding: 40px 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 50px; margin-bottom: 10px;">🔑</div>
          <h1 style="margin:0; font-size: 26px;">${title}</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>To ensure the security of your account, please use the following One-Time Password (OTP) to complete your request:</p>
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: ${color}; font-family: monospace;">${otpCode}</span>
            <p style="font-size: 13px; color: #7f8c8d; margin-top: 10px;">Expires in 10 minutes</p>
          </div>
          <p style="font-size: 14px; color: #e74c3c; background: #fff5f5; padding: 10px; border-radius: 6px;"><strong>Note:</strong> If you did not initiate this request, please change your password immediately to secure your account.</p>
        </div>
        <div style="${footerStyle}">
          <p>Secure Verification Engine • ScoreVeda Cloud</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, subject, html);
};

const sendForgotPasswordOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 50px; margin-bottom: 10px;">🔐</div>
          <h1 style="margin:0; font-size: 26px;">Password Reset</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset the password for your ScoreVeda account. Please use the verification code below:</p>
          <div style="background: #fffaf0; border: 2px dashed #f39c12; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #e67e22;">${otpCode}</span>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email. Your current password will remain active.</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Security Team</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, "Reset Your Password", html);
};

const sendPasswordChangedEmail = (email, name) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
          <h1 style="margin:0; font-size: 26px;">Password Updated</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>This is a security confirmation that your ScoreVeda account password has been successfully updated.</p>
          <p style="background: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; color: #c0392b; font-size: 14px; margin-top: 20px;">
            <strong>Security Alert:</strong> If you did not make this change, please contact our support team immediately or try to reset your password using the "Forgot Password" link.
          </p>
        </div>
        <div style="${footerStyle}">
          <p>Automatic Security Notification • ScoreVeda</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, "Security Alert: Password Changed", html);
};

const sendExamSubmissionEmail = (email, name, examTitle) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <div style="font-size: 50px; margin-bottom: 10px;">📝</div>
          <h1 style="margin:0; font-size: 26px;">Submission Received</h1>
        </div>
        <div style="${contentStyle}">
          <span style="${badgeStyle} background-color: #ebf5ff; color: #007bff;">Confirmed</span>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your examination submission for <strong>"${examTitle}"</strong> has been successfully received and recorded.</p>
          <p>Our system is now processing your responses. If this exam includes subjective or theory questions, your instructor will review them soon.</p>
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666;">
            <strong>Exam Details:</strong><br/>
            Title: ${examTitle}<br/>
            Status: Under Review
          </div>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Exam Engine</p>
        </div>
      </div>
    </div>`;
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
  let certHtml = hasCert
    ? `<div style="background: #e8f5e9; border: 1px solid #2e7d32; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
         <p style="color: #1b5e20; margin: 0; font-weight: bold;">🎓 Performance: Pass</p>
         <p style="color: #2e7d32; margin: 5px 0 0 0; font-size: 13px;">Your official certificate is ready for download.</p>
       </div>`
    : `<div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
         <p style="color: #495057; margin: 0; font-weight: bold;">📊 Analysis Ready</p>
         <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 13px;">View your performance breakdown on the portal.</p>
       </div>`;

  const resultLink = `${process.env.FRONTEND_URL || "https://score-veda.vercel.app"}/result/${resultId}`;

  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #2980b9 0%, #3498db 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 50px; margin-bottom: 10px;">📢</div>
          <h1 style="margin:0; font-size: 26px;">Results Released</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your performance report for <strong>"${examTitle}"</strong> is now available for viewing.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <p style="font-size: 14px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Final Score</p>
            <h2 style="font-size: 64px; margin: 0; color: #2c3e50;">${score}<span style="font-size: 24px; color: #bdc3c7;">/${total}</span></h2>
          </div>

          ${certHtml}

          <div style="text-align: center;">
            <a href="${resultLink}" style="${btnStyle}">View Performance Report</a>
          </div>
        </div>
        <div style="${footerStyle}">
          <p>Generated by ScoreVeda Grading System • ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, `Result Update: ${examTitle}`, html);
};

const sendChangeEmailOtpEmail = (email, name, otpCode) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <div style="font-size: 50px; margin-bottom: 10px;">📧</div>
          <h1 style="margin:0; font-size: 26px;">Verify New Email</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You have requested to update the primary email address for your ScoreVeda account. Please use the code below to verify this new address:</p>
          <div style="background: #f8f9fa; border-left: 5px solid #4c2a85; padding: 25px; margin: 30px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #4c2a85;">${otpCode}</span>
          </div>
          <p style="font-size: 13px; color: #7f8c8d; text-align: center;">This code is valid for 10 minutes.</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Security Hub</p>
        </div>
      </div>
    </div>`;
  return sendEmail(email, "Verify New Email – ScoreVeda", html);
};

const sendEmailChangedConfirmationEmail = (email, name, oldEmail, newEmail) => {
  const html = `
    <div style="${wrapperStyle}">
      <div style="${containerStyle}">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 50px; margin-bottom: 10px;">🔄</div>
          <h1 style="margin:0; font-size: 26px;">Email Updated</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your ScoreVeda account email address has been successfully updated.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Previous:</strong> ${oldEmail}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Current:</strong> ${newEmail}</p>
          </div>
          <p style="color: #e74c3c; font-size: 13px; font-style: italic; margin-top: 20px;">If you did not authorize this change, please contact our security team immediately.</p>
        </div>
        <div style="${footerStyle}">
          <p>&copy; ${new Date().getFullYear()} ScoreVeda Security Hub</p>
        </div>
      </div>
    </div>`;
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
