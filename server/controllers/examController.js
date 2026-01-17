const Exam = require("../models/examModel");
const User = require("../models/userModel");
const Result = require("../models/resultModel");
const {
  sendExamSubmissionEmail,
  sendResultUpdateEmail,
} = require("../utils/emailService"); // <--- Import Email Service

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Admins only)
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      duration,
      totalMarks,
      passingMarks,
      questions,
      accessCode,
      isPublished,
      hasCertificate, // <--- New Field
      certificateSettings, // <--- New Field
      instituteName, // <--- Extract Custom Institute Name
      examRules, // <--- Extract Custom Rules Array
    } = req.body;

    // Validation: Ensure questions array is not empty
    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Please add at least one question" });
    }

    const exam = await Exam.create({
      title,
      description,
      type,
      duration,
      totalMarks,
      passingMarks,
      questions,
      accessCode,
      isPublished,

      // --- SAVE INSTRUCTION FIELDS ---
      instituteName: instituteName || "ScoreVeda Institute",
      examRules,
      // -------------------------------

      hasCertificate, // <--- Save boolean
      certificateSettings: hasCertificate ? certificateSettings : null,
      createdBy: req.user.id,
    });

    res.status(201).json(exam);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Exam Code already exists. Try a different one." });
    }
    res.status(500).json({ message: error.message });
  }
};

const getExams = async (req, res) => {
  try {
    let exams;

    if (req.user.role === "admin") {
      exams = await Exam.find({ createdBy: req.user.id }).populate(
        "createdBy",
        "name email"
      );
    } else {
      exams = await Exam.find({ isPublished: true }).populate(
        "createdBy",
        "name email"
      );
    }

    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      res.json(exam);
    } else {
      res.status(400).json({ message: "Exam not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitExam = async (req, res) => {
  try {
    const { examId, userAnswers } = req.body;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const existingResult = await Result.findOne({ user: userId, exam: examId });

    if (existingResult) {
      res.status(200).json(existingResult);
      return;
    }

    let obtainedMarks = 0;
    let marksPerQuestion = {};

    const hasTheory = exam.questions.some((q) => q.type === "theory");

    exam.questions.forEach((question, index) => {
      const studentAnswer = userAnswers[index];

      if (question.type === "mcq") {
        const correctAnswerIndex = question.correctOption;
        if (
          studentAnswer !== undefined &&
          parseInt(studentAnswer) === correctAnswerIndex
        ) {
          obtainedMarks += question.marks;
          marksPerQuestion[index] = question.marks;
        } else {
          marksPerQuestion[index] = 0;
        }
      } else {
        marksPerQuestion[index] = 0;
      }
    });

    const resultStatus = hasTheory ? "pending" : "published";
    const isPassed = obtainedMarks >= exam.passingMarks;

    const result = await Result.create({
      user: userId,
      exam: examId,
      score: obtainedMarks,
      totalMarks: exam.totalMarks,
      userAnswers,
      marksPerQuestion,
      isPassed,
      status: resultStatus,
    });

    // ✅ POPULATE FULL DATA BEFORE SENDING TO FRONTEND
    const populatedResult = await Result.findById(result._id)
      .populate("user", "name email")
      .populate({
        path: "exam",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      });

    res.status(201).json(populatedResult);

    // --- EMAIL NOTIFICATIONS ---
    if (req.user && req.user.email) {
      if (resultStatus === "pending") {
        // CASE A: Theory Questions (Needs Grading) -> Send "Submission Received"
      sendExamSubmissionEmail(req.user.email, req.user.name, exam.title).catch(
        (err) => console.error("Failed to send submission email:", err.message)
      );
    } else {
      // CASE B: All MCQs (Auto-Graded) -> Send "Result Declared" ONLY
        sendResultUpdateEmail(
          req.user.email,
          req.user.name,
          exam.title,
          obtainedMarks,
          exam.totalMarks,
          exam.hasCertificate && isPassed, // Check certificate eligibility
          result._id // Needed for View Result Link
        ).catch((err) =>
          console.error("Failed to send immediate result email:", err.message)
        );
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getExamResults = async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.id })
      .populate("user", "name email gender phone")
      .sort({ score: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate({
        path: "exam",
        select:
          "title totalMarks hasCertificate certificateSettings questions instituteName createdAt accessCode",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATED: Populate exam creator + institute + dates
const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "exam",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      });

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ message: "Result not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResultScore = async (req, res) => {
  try {
    const {
      score,
      isPassed,
      userAnswers,
      marksPerQuestion,
      remarks,
      questionRemarks,
    } = req.body;

    const result = await Result.findById(req.params.id)
      .populate("exam")
      .populate("user");

    if (!result) return res.status(404).json({ message: "Result not found" });

    if (score > result.exam.totalMarks) {
      return res.status(400).json({
        message: `Score cannot exceed exam total of ${result.exam.totalMarks}`,
      });
    }

    result.score = score;
    result.isPassed = isPassed;
    result.status = "published";

    if (userAnswers) result.userAnswers = userAnswers;
    if (!result.userAnswers) result.userAnswers = [];
    if (marksPerQuestion) result.marksPerQuestion = marksPerQuestion;
    if (remarks !== undefined) result.remarks = remarks;
    if (questionRemarks !== undefined) result.questionRemarks = questionRemarks;

    const updatedResult = await result.save();

    if (result.status === "published") {
      const student = result.user;
      if (student && student.email) {
        sendResultUpdateEmail(
          student.email,
          student.name,
          result.exam.title,
          result.score,
          result.exam.totalMarks,
          result.exam.hasCertificate && result.isPassed,
          result._id 
        ).catch((err) =>
          console.error("Failed to send result email:", err.message)
        );
      }
    }

    res.json(updatedResult);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const joinExamByCode = async (req, res) => {
  try {
    // --- SECURITY CHECK: VERIFY EMAIL FIRST ---
    const isVerified = req.user.isEmailVerified || req.user.isVerified;

    if (!isVerified) {
      return res.status(403).json({
        message:
          "Go to Profile and verify your Email under Contact info to enter any exam",
      });
    }

    const { accessCode } = req.body;

    const exam = await Exam.findOne({ accessCode });

    if (!exam) {
      return res.status(400).json({ message: "Invalid Exam Code" });
    }

    if (!exam.isPublished) {
      return res
        .status(403)
        .json({ message: "This exam is not yet published." });
    }

    res.json({
      examId: exam._id,
      title: exam.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.createdBy.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this exam" });
    }

    await Result.deleteMany({ exam: exam._id });
    await exam.deleteOne();

    res.json({ message: "Exam removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePublish = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.isPublished) {
      return res
        .status(400)
        .json({ message: "Cannot revert a published exam to draft." });
    }

    exam.isPublished = true;
    await exam.save();

    res.json({ message: "Exam Published Live!", isPublished: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamAnalytics = async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId);

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const results = await Result.find({ exam: examId });

    const totalAttempts = results.length;
    const passedCount = results.filter((r) => r.isPassed).length;
    const failedCount = totalAttempts - passedCount;
    const passPercentage =
      totalAttempts === 0
        ? 0
        : ((passedCount / totalAttempts) * 100).toFixed(1);

    const distribution = [
      { name: "0-20%", count: 0 },
      { name: "21-40%", count: 0 },
      { name: "41-60%", count: 0 },
      { name: "61-80%", count: 0 },
      { name: "81-100%", count: 0 },
    ];

    results.forEach((r) => {
      const percentage = (r.score / exam.totalMarks) * 100;
      if (percentage <= 20) distribution[0].count++;
      else if (percentage <= 40) distribution[1].count++;
      else if (percentage <= 60) distribution[2].count++;
      else if (percentage <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    res.json({
      examTitle: exam.title,
      totalAttempts,
      passedCount,
      failedCount,
      passPercentage,
      averageScore:
        totalAttempts === 0
          ? 0
          : (
              results.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts
            ).toFixed(1),
      distribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
