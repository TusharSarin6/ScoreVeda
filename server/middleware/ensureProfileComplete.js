module.exports = (req, res, next) => {
  try {
    const user = req.user; // injected by protect middleware

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized. User not found.",
      });
    }

    const missingFields = [];

    if (!user.isEmailVerified) missingFields.push("Email verification");
    if (!user.gender) missingFields.push("Gender");
    if (!user.birthday) missingFields.push("Date of Birth");
    if (!user.phone) missingFields.push("Phone number");

    // --- PROFILE COMPLETION CALCULATION (25% EACH) ---
    let profileCompletion = 0;
    if (user.isEmailVerified) profileCompletion += 25;
    if (user.gender) profileCompletion += 25;
    if (user.birthday) profileCompletion += 25;
    if (user.phone) profileCompletion += 25;
    // -----------------------------------------------------

    if (missingFields.length > 0) {
      // ---  ROLE-BASED MESSAGE ---
      const actionText =
        user.role === "admin" ? "creating exams" : "attempting exams";

      return res.status(403).json({
        message: `Profile incomplete. Complete your profile to become eligible for ${actionText}.`,
        missing: missingFields,
        profileCompletion,
        profileCompletionRequired: true,
      });
    }

    //  Profile is fully complete
    next();
  } catch (error) {
    console.error("Profile Completion Middleware Error:", error);
    return res.status(500).json({
      message: "Server error while validating profile completion.",
    });
  }
};
