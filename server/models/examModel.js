const mongoose = require("mongoose");

const examSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add an exam title"],
    },
    description: {
      type: String,
      required: [true, "Please add instructions or description"],
    },
    // The Secret Code
    accessCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Draft vs Published
    isPublished: {
      type: Boolean,
      default: true,
    },
    // Link this exam to the Admin/Teacher who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 'mcq' or 'theory'
    type: {
      type: String,
      enum: ["mcq", "theory"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      required: true,
    },

    // ---  Certificate Toggle & Settings ---
    hasCertificate: {
      type: Boolean,
      default: false,
    },

    certificateSettings: {
      instituteName: { type: String, default: "ScoreVeda Institute" },
      certificateTitle: { type: String, default: "CERTIFICATE OF ACHIEVEMENT" },
      subtitle: { type: String, default: "This is to certify that" },
      signatureName: { type: String, default: "Authorized Signature" },
      themeColor: { type: String, default: "#4c2a85" },
      instituteLogo: { type: String, default: "" }, // Fixed: Was 'subtitle' before
    },

    // --- NEW FIELDS FOR INSTRUCTION PAGE ---
    instituteName: {
      type: String,
      default: "ScoreVeda Institute", // Default value if admin leaves blank
    },

    examRules: {
      type: [String],
      default: [],
    },

    // The Array of Questions
    questions: [
      {
        type: {
          type: String,
          enum: ["mcq", "theory"],
          required: true,
          default: "mcq",
        },
        questionText: { type: String, required: true },
        options: [{ type: String }],
        correctOption: { type: Number },
        marks: { type: Number, required: true },
      },
    ],
    // Is the exam active for students to see?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
