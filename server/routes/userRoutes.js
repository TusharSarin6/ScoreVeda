const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  registerUser,
  loginUser,
  getMe,
  deleteUserProfile,
  uploadProfilePic,
  deleteProfilePic,
  updateProfileInfo,
  sendOtp,
  verifyOtp,
  changePassword,
  changeEmail,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPasswordWithOtp,
  verifyChangeEmailOtp,
  sendDeleteOtp, 
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// --- Multer Configuration (For File Uploads) ---
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/"); // Files will be saved in 'uploads' folder
  },
  filename(req, file, cb) {
  
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check File Type (Images Only)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images only!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Public Routes
router.post("/", registerUser);
router.post("/login", loginUser);

// Private Routes
router.get("/me", protect, getMe);
router.delete("/profile", protect, deleteUserProfile);
router.post(
  "/upload-photo",
  protect,
  upload.single("profilePic"),
  uploadProfilePic
);
router.delete("/delete-photo", protect, deleteProfilePic);

router.put("/profile-info", protect, updateProfileInfo); // Update Name, Gender, etc.
router.post("/send-otp", protect, sendOtp); // Request OTP
router.post("/verify-otp", protect, verifyOtp); // Check OTP

//  Route to send OTP specifically for account deletion
router.post("/send-delete-otp", protect, sendDeleteOtp);

router.post("/change-password", protect, changePassword); // CHANGE PASSWORD
router.post("/change-email", protect, changeEmail); //  CHANGE EMAIL ROUTE
router.post("/change-email/verify-otp", protect, verifyChangeEmailOtp); // Verify OTP & finalize email change

//  FORGOT PASSWORD (PUBLIC ROUTES)
// ONLY FOR MANUAL USERS (NON-GOOGLE)
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

module.exports = router;
