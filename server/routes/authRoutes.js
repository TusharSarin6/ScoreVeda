const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const router = express.Router();

// Helper to generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 1. Trigger Google Login
router.get("/google", (req, res, next) => {
  const intent = req.query.intent || "login";
  const state = JSON.stringify({ intent });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: state,
  })(req, res, next);
});

// 2. Google Callback
router.get("/google/callback", (req, res, next) => {
  // ✅ UPDATED: Use dynamic Client URL for production redirect
  // We use a fallback to localhost ONLY if the Env Var is missing
  // We also strip any trailing slash to avoid double slashes (e.g. .com//login)
  const CLIENT_URL = (
    process.env.CLIENT_URL || "https://score-veda.vercel.app"
  ).replace(/\/$/, "");

  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      if (err) {
        console.error("Google Auth Error:", err);
        return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
      }

      // ✅ SAFETY: Wrap JSON.parse in try-catch to prevent server crashes on invalid state
      let intent = "login";
      try {
        if (req.query.state) {
          const parsedState = JSON.parse(req.query.state);
          intent = parsedState.intent || "login";
        }
      } catch (parseError) {
        console.error("State parsing error:", parseError);
      }

      try {
        // --- CASE 1: USER DOES NOT EXIST ---
        if (!user) {
          if (intent === "login") {
            return res.redirect(
              `${CLIENT_URL}/register?error=account_not_found`
            );
          }

          if (intent === "signup") {
            // --- CHANGE: DO NOT CREATE ACCOUNT YET ---
            // Instead, redirect to Frontend Register form with their info
            const email = info.profile.emails[0].value;
            const name = info.profile.displayName;
            const googleId = info.profile.id;

            // We encodeURI to handle spaces in names
            return res.redirect(
              `${CLIENT_URL}/register?name=${encodeURIComponent(
                name
              )}&email=${email}&googleId=${googleId}`
            );
          }
        }

        // --- CASE 2: USER ALREADY EXISTS ---
        else {
          if (intent === "signup") {
            return res.redirect(`${CLIENT_URL}/login?error=account_exists`);
          }
          // If intent is login, proceed to login
          const token = generateToken(user._id);

          // FIX: Include ALL profile fields so they don't get reset on login
          const userData = JSON.stringify({
            _id: user._id,
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
            token: token,
          });

          return res.redirect(
            `${CLIENT_URL}/login-success?data=${encodeURIComponent(userData)}`
          );
        }
      } catch (error) {
        console.error("Auth Logic Error:", error);
        res.redirect(`${CLIENT_URL}/login?error=server_error`);
      }
    }
  )(req, res, next);
});

module.exports = router;
