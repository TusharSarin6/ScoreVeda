const mongoose = require("mongoose");

const resultSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["published", "pending"],
      default: "published",
    },
    // Stores student's answers: { "0": 2, "1": "Theory Answer..." }
    userAnswers: {
      type: Object,
      default: {},
    },
    // Stores marks per question: { "0": 5, "1": 3 }
    marksPerQuestion: {
      type: Object,
      default: {},
    },
    //  Global Remark (e.g. "Great job, but work on Java concepts")
    remarks: {
      type: String,
      default: "",
    },
    //  Per-Question Remarks (e.g. { "1": "Missing definition of Polymorphism" })
    questionRemarks: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Result", resultSchema);
