const {
  createExam,
  getExams,
  getExamById,
  submitExam,
  getExamResults,
  getMyResults,
  getResultById,
  updateResultScore,
  joinExamByCode,
  deleteExam,
  togglePublish,
  getExamAnalytics,
} = require("../controllers/examController");

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ---  FULL PROFILE COMPLETION MIDDLEWARE ---
const ensureProfileComplete = (req, res, next) => {
  const user = req.user;

  const missingFields = [];

  // Email verification 
  if (!user.isEmailVerified && !user.isVerified)
    missingFields.push("Email verification");

  if (!user.gender) missingFields.push("Gender");
  if (!user.birthday) missingFields.push("Date of Birth");
  if (!user.phone) missingFields.push("Phone number");

  if (missingFields.length > 0) {
    return res.status(403).json({
      message: "Profile incomplete. Complete your profile to continue.",
      missing: missingFields,
      profileCompletionRequired: true,
    });
  }

  next();
};

// Route to Get All Exams
router.get("/", protect, getExams);

//  Admin must complete profile before creating exam
router.post("/", protect, adminOnly, ensureProfileComplete, createExam);

router.get("/my-results", protect, getMyResults);
router.get("/:id/results", protect, adminOnly, getExamResults);

router.get("/result/:id", protect, getResultById);

router.get("/analytics/:id", protect, getExamAnalytics);
router.put("/result/:id", protect, adminOnly, updateResultScore);

//  Student must complete profile before submitting exam
router.post("/submit", protect, ensureProfileComplete, submitExam);

//  Student must complete profile before joining exam
router.post("/join", protect, ensureProfileComplete, joinExamByCode);

//  Admin must complete profile before publishing exam
router.put(
  "/:id/publish",
  protect,
  adminOnly,
  ensureProfileComplete,
  togglePublish
);

//  DELETE EXAM (Admin only)
router.delete("/:id", protect, adminOnly, ensureProfileComplete, deleteExam);
router.get("/:id", protect, getExamById);

module.exports = router;
