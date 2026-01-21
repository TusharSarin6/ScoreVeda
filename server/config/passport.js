const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${
          process.env.SERVER_URL || "http://localhost:5000"
        }/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Check if user exists by email
          // Google gives us an array of emails, we take the first one
          const userEmail = profile.emails[0].value;
          let user = await User.findOne({ email: userEmail });

          if (user) {
            // 2. User exists!
            // If they don't have a googleId yet (signed up with password before), link it now.
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          } else {
            // 3. User DOES NOT exist.
            // We pass 'false' for user, but send the profile info.
            // This tells the route: "Don't login yet, redirect to register page."
            return done(null, false, {
              message: "No account found",
              profile: profile,
            });
          }
        } catch (err) {
          console.error(err);
          return done(err, null);
        }
      }
    )
  );
};
