const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    password: {
      type: String,
      // Password is required ONLY if googleId is NOT present
      required: function () {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    // ---  Google ID Field ---
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple users to have null googleId (standard email users)
    },
    // --- Profile Picture Field ---
    profilePic: {
      type: String,
      default: "", // Stores the URL path to the uploaded image
    },
    // --- PERSONAL INFO FIELDS ---
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    birthday: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      default: "",
    },
    // --- VERIFICATION FIELDS ---
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // REMOVED: isPhoneVerified field is no longer needed

    // Temporary storage for OTP
    otp: {
      code: String,
      type: { type: String, enum: ["email", "forgot", "delete_account"] }, // 
      expiresAt: Date,
    },

    // --- EMAIL CHANGE SECURITY FIELDS ---
    pendingEmail: {
      type: String,
      default: null,
    },
    emailChangeOtp: {
      code: String,
      expiresAt: Date,
    },

  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  // If the password wasn't modified or doesn't exist (Google login), return immediately
  if (!this.isModified("password") || !this.password) {
    return;
  }

  // Scramble the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // FIX: Added the actual hashing line
});

module.exports = mongoose.model("User", userSchema);
