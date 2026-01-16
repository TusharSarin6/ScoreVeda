const User = require("../models/userModel");
const Exam = require("../models/examModel");
const Result = require("../models/resultModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  sendWelcomeEmail,
  sendOtpEmail,
  sendForgotPasswordOtpEmail,
  sendPasswordChangedEmail,
  sendEmailChangedConfirmationEmail,
} = require("../utils/emailService");

// @desc    Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, role, googleId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // ✅ STRONG PASSWORD CHECK (Only if not Google Login)
    if (!googleId && password) {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be 8+ chars with Uppercase, Lowercase, Number & Special Char (@$!%*?&)",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password: password || undefined,
      role: role || "student",
      googleId: googleId || undefined,
    });

    if (user) {
      // FIX: Safety check to prevent crash if email service fails
      if (typeof sendWelcomeEmail === "function") {
        sendWelcomeEmail(user.email, user.name).catch((err) =>
          console.error("Email Error:", err.message)
        );
      }
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        message: "Registration Sucessful! Please Login.",
      });
    } else {
      res.status(400);
      throw new Error({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      // 🔐 STEP 1: If email NOT verified → send OTP
      if (!user.isEmailVerified) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000);

        user.otp = { code: otpCode, type: "email", expiresAt };
        await user.save();

        if (typeof sendOtpEmail === "function") {
          sendOtpEmail(user.email, user.name, otpCode).catch((err) =>
            console.error("Login OTP Email failed:", err.message)
          );
        }

        return res.status(403).json({
          message: "Email not verified. OTP sent to your email.",
          requiresVerification: true,
        });
      }

      // ✅ STEP 2: Normal login (email verified)
      return res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleId: user.googleId,
        profilePic: user.profilePic,
        gender: user.gender,
        birthday: user.birthday,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Get user data
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      ...user._doc,
      googleId: user.googleId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

// --- Delete User Account (With OTP Verification) ---
const deleteUserProfile = async (req, res) => {
  try {
    const { otp } = req.body; // Get OTP from request
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ VERIFY OTP
    if (
      !user.otp ||
      user.otp.code !== otp ||
      user.otp.type !== "delete_account" ||
      new Date() > user.otp.expiresAt
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired OTP. Please try again." });
    }

    // Proceed with Deletion logic
    if (user.role === "admin") {
      const myExams = await Exam.find({ createdBy: user._id });
      for (const exam of myExams) {
        await Result.deleteMany({ exam: exam._id });
      }
      await Exam.deleteMany({ createdBy: user._id });
    }

    if (user.role === "student") {
      await Result.deleteMany({ user: user._id });
    }

    await user.deleteOne();
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Upload Profile Picture ---
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Please upload a file" });
    const profilePicUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicUrl },
      { new: true }
    );
    res.status(200).json({
      profilePic: user.profilePic,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Image upload failed" });
  }
};

// --- Delete Profile Picture ---
const deleteProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.profilePic = "";
    await user.save();
    res
      .status(200)
      .json({ profilePic: "", message: "Profile picture removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete image" });
  }
};

// --- Update Personal Info ---
const updateProfileInfo = async (req, res) => {
  try {
    const { name, gender, birthday, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.gender = gender || user.gender;
      user.birthday = birthday || user.birthday;
      if (phone) user.phone = phone;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        googleId: updatedUser.googleId,
        profilePic: updatedUser.profilePic,
        gender: updatedUser.gender,
        birthday: updatedUser.birthday,
        phone: updatedUser.phone,
        isEmailVerified: updatedUser.isEmailVerified,
        token: req.headers.authorization.split(" ")[1],
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Generate & Send OTP ---
const sendOtp = async (req, res) => {
  const { type } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (type !== "email")
    return res
      .status(400)
      .json({ message: "Only email verification is supported." });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000);

  user.otp = { code: otpCode, type: "email", expiresAt };
  await user.save();

  // FIX: Safety check for email function
  if (typeof sendOtpEmail === "function") {
    sendOtpEmail(user.email, user.name, otpCode).catch((err) =>
      console.error("OTP Email failed:", err.message)
    );
  }

  res.json({ message: `OTP sent to ${user.email}` });
};

// --- Verify OTP ---
const verifyOtp = async (req, res) => {
  const { otp, type } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (
    !user.otp ||
    user.otp.code !== otp ||
    user.otp.type !== "email" ||
    new Date() > user.otp.expiresAt
  ) {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  if (type === "email") user.isEmailVerified = true;
  user.otp = null;
  const updatedUser = await user.save();

  res.json({
    message: "Email Verified Successfully!",
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    googleId: updatedUser.googleId,
    profilePic: updatedUser.profilePic,
    gender: updatedUser.gender,
    birthday: updatedUser.birthday,
    phone: updatedUser.phone,
    isEmailVerified: updatedUser.isEmailVerified,
    createdAt: updatedUser.createdAt,
  });
};

// --- Change Password Logic ---
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.googleId) {
      return res
        .status(400)
        .json({ message: "Google accounts cannot change password here." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }
    // ✅ NEW: STRONG PASSWORD CHECK
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars with Uppercase, Lowercase, Number & Special Char (@$!%*?&)",
      });
    }

    user.password = newPassword; // hashed by model
    await user.save();

    if (typeof sendPasswordChangedEmail === "function") {
      sendPasswordChangedEmail(user.email, user.name).catch((err) => {});
    }

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- NEW: Change Email Logic ---
const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.googleId)
      return res
        .status(400)
        .json({ message: "Google users cannot change email here." });

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists)
      return res.status(400).json({ message: "Email already in use." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    user.pendingEmail = newEmail;
    user.emailChangeOtp = { code: otpCode, expiresAt };
    await user.save();

    // FIX: Safety check to prevent 500 error if email service fails
    if (typeof sendOtpEmail === "function") {
      sendOtpEmail(newEmail, user.name, otpCode).catch((err) =>
        console.error("Email Error:", err.message)
      );
    } else {
      console.warn("sendOtpEmail is not a function. Check emailService.js");
    }

    res.json({ message: "OTP sent to new email address" });
  } catch (error) {
    console.error(error); // Log the actual error
    res.status(500).json({ message: "Server error" });
  }
};

// 🔐 SECURE EMAIL CHANGE – STEP 2 (VERIFY OTP)
// --------------------------------------------------
const verifyChangeEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (
      !user ||
      !user.emailChangeOtp ||
      user.emailChangeOtp.code !== otp ||
      new Date() > user.emailChangeOtp.expiresAt
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    user.email = newEmail;
    user.pendingEmail = null;
    user.emailChangeOtp = null;
    user.isEmailVerified = true;
    await user.save();

    if (typeof sendEmailChangedConfirmationEmail === "function") {
      // Send to OLD email so they know it changed
      sendEmailChangedConfirmationEmail(
        oldEmail,
        user.name,
        oldEmail,
        newEmail
      ).catch(() => {});
      // Send to NEW email for confirmation
      sendEmailChangedConfirmationEmail(
        newEmail,
        user.name,
        oldEmail,
        newEmail
      ).catch(() => {});
    }

    res.json({
      message: "Email updated successfully!",
      email: newEmail,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------
// ✅ FORGOT PASSWORD (PUBLIC)
// -----------------------------
const forgotPasswordSendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res
      .status(404)
      .json({ message: "No account found with this email" });

  if (user.googleId) {
    return res
      .status(400)
      .json({ message: "Google users cannot reset password here." });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000);

  user.otp = { code: otpCode, type: "email", expiresAt };
  await user.save();

  if (typeof sendForgotPasswordOtpEmail === "function") {
    sendForgotPasswordOtpEmail(user.email, user.name, otpCode).catch(
      (err) => {}
    );
  }
  res.json({ message: "OTP sent to your email" });
};

const forgotPasswordVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp)
    return res.status(400).json({ message: "Invalid request" });

  if (
    user.otp.code !== otp ||
    user.otp.type !== "email" ||
    new Date() > user.otp.expiresAt
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  res.json({ message: "OTP verified successfully" });
};

const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp)
    return res.status(400).json({ message: "Invalid request" });

  if (
    user.otp.code !== otp ||
    user.otp.type !== "email" ||
    new Date() > user.otp.expiresAt
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  // ✅ NEW: STRONG PASSWORD CHECK
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be 8+ chars with Uppercase, Lowercase, Number & Special Char (@$!%*?&)",
    });
  }

  user.password = newPassword; // hashed by model
  user.otp = null;
  await user.save();

  if (typeof sendPasswordChangedEmail === "function") {
    sendPasswordChangedEmail(user.email, user.name).catch((err) => {});
  }

  res.json({ message: "Password reset successfully" });
};

// --- Send OTP for Account Deletion ---
const sendDeleteOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user document (expires in 10 mins)
    // We reuse the 'otp' field structure or create a specific one
    user.otp = {
      code: otp,
      type: "delete_account",
      expiresAt: new Date(Date.now() + 10 * 60000),
    };
    await user.save();

    // Send Email
    // Note: Ensure you import sendOtpEmail or use a generic sendEmail function
    // For now, we use the existing sendOtpEmail helper
    if (typeof sendOtpEmail === "function") {
      await sendOtpEmail(
        user.email,
        user.name,
        otp,
        "Security Alert: Account Deletion OTP" // Subject line
      );
    }

    res.status(200).json({ message: `OTP sent to ${user.email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  sendDeleteOtp,
  deleteUserProfile,
  uploadProfilePic,
  deleteProfilePic,
  updateProfileInfo,
  sendOtp,
  verifyOtp,
  changePassword,
  changeEmail,
  verifyChangeEmailOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPasswordWithOtp,
};
