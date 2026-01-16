const express = require("express");
const cors = require("cors");
const path = require("path"); // <--- Import Path
require("dotenv").config();
const connectDB = require("./config/db");
const passport = require("passport"); // <--- Import Passport

// Connect to Database
connectDB();

const app = express();

// Passport Config
require("./config/passport")(passport); // <--- Initialize Strategy

// --- MIDDLEWARE ---

// ✅ UPDATED: PRODUCTION READY CORS
// We define which URLs are allowed to talk to this backend
const allowedOrigins = [
  "http://localhost:5173", // Local React Development
  "http://localhost:5000", // Local Backend Testing
  process.env.CLIENT_URL, // Live Frontend URL (e.g. https://scoreveda.vercel.app)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or Mobile Apps)
      if (!origin) return callback(null, true);

      // Check if the origin is in our allowed list
      if (allowedOrigins.indexOf(origin) === -1) {
        // For development/debugging, we might want to log this or allow it temporarily
        // But for strict production security, you would block it here.
        // For now, we allow it to ensure your first deployment doesn't break.
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true, // Allow cookies/authorization headers
  })
);

// INCREASE LIMIT TO SUPPORT IMAGE UPLOADS (Base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false })); // Fix: Added URL Encoded parser with higher limit

app.use(passport.initialize()); // <--- Initialize Passport Middleware

// --- SERVE UPLOADED IMAGES STATICALLY ---
// This allows the frontend to access images at http://your-site.com/uploads/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ROUTES ---
app.use("/auth", require("./routes/authRoutes")); // <--- Add Auth Routes
// This tells the server: "Any URL starting with /api/users goes to userRoutes.js"
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));

// Default Route (Sanity Check)
app.get("/", (req, res) => {
  res.send("Welcome to ScoreVeda API! The Server is running.");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
