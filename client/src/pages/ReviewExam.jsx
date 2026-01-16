import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import "./ReviewExam.css";

function ReviewExam() {
  const { id } = useParams(); // This is the RESULT ID
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);

  // Stores the marks given by admin for theory questions: { "0": 3, "2": 4 }
  const [theoryMarks, setTheoryMarks] = useState({});

  // ---  Feedback State ---
  const [questionRemarks, setQuestionRemarks] = useState({}); // Per-question feedback
  const [globalRemark, setGlobalRemark] = useState(""); // Overall feedback
  // ---------------------------

  const [totalScore, setTotalScore] = useState(0);

  // 1. Fetch Result & Exam Data
  useEffect(() => {
    const fetchData = async () => {
      // ✅ CHANGED: Use api helper
      if (!user || !user.token) return;
      try {
        // A. Get the Result (Populated with User info)
        const { data: resultData } = await api.get(`/api/exams/result/${id}`);
        setResult(resultData);

        // --- Load existing marks & remarks if they exist ---
        if (resultData.marksPerQuestion) {
          setTheoryMarks(resultData.marksPerQuestion);
        }
        if (resultData.questionRemarks) {
          setQuestionRemarks(resultData.questionRemarks);
        }
        if (resultData.remarks) {
          setGlobalRemark(resultData.remarks);
        }
        // --------------------------------------------------

        // B. Get the Full Exam (Questions, Max Marks, etc.)
        const examId = resultData.exam._id || resultData.exam;
        const { data: examData } = await api.get(`/api/exams/${examId}`);
        setExam(examData);
      } catch (error) {
        toast.error("Failed to load exam data");
      }
    };
    fetchData();
  }, [id, user?.token]);

  // 2. Auto-Calculate Total Score in Real-Time
  useEffect(() => {
    if (!exam || !result) return;
    let calculatedScore = 0;
    exam.questions.forEach((q, index) => {
      const answers = result.userAnswers || [];
      const studentAns = answers[index];
      if (q.type === "mcq") {
        // AUTO-GRADING FOR MCQ
        if (
          studentAns !== undefined &&
          studentAns !== null &&
          parseInt(studentAns) === q.correctOption
        ) {
          calculatedScore += q.marks;
        }
      } else {
        // MANUAL GRADING FOR THEORY
        // Add the marks the admin typed. If nothing typed, add 0.
        const marksGiven =
          theoryMarks[index] !== undefined ? theoryMarks[index] : 0;
        calculatedScore += marksGiven;
      }
    });

    setTotalScore(calculatedScore);
  }, [exam, result, theoryMarks]);

  // 3. Handle Input Change (The Grading Box)
  const handleGradeChange = (questionIndex, value, maxMarks) => {
    let marks = parseInt(value);

    // Validation: Prevent negative or over-marking
    if (isNaN(marks)) marks = 0;
    if (marks < 0) marks = 0;
    if (marks > maxMarks) {
      toast.warning(
        `Cannot give more than ${maxMarks} marks for this question!`
      );
      marks = maxMarks; // Cap it at max
    }
    setTheoryMarks((prev) => ({
      ...prev,
      [questionIndex]: marks,
    }));
  };

  // ---  Remark Change Handler ---
  const handleRemarkChange = (index, text) => {
    setQuestionRemarks((prev) => ({ ...prev, [index]: text }));
  };
  // ----------------------------------

  // 4. Save Final Grades to Backend
  const handleSaveGrades = async () => {
    try {
      const passingMarks = exam.passingMarks;
      const isPassed = totalScore >= passingMarks;

      // --- Construct Full Marks Breakdown ---
      const finalMarksBreakdown = {};

      exam.questions.forEach((q, index) => {
        if (q.type === "mcq") {
          // Re-calculate MCQ mark to be safe
          const ans = result.userAnswers?.[index];
          if (ans !== undefined && parseInt(ans) === q.correctOption) {
            finalMarksBreakdown[index] = q.marks;
          } else {
            finalMarksBreakdown[index] = 0;
          }
        } else {
          // Use the manual mark from state
          finalMarksBreakdown[index] = theoryMarks[index] || 0;
        }
      });

      const payload = {
        score: totalScore,
        isPassed,
        userAnswers: result.userAnswers || [],
        marksPerQuestion: finalMarksBreakdown, // <--- Sending the breakdown
        questionRemarks, // <--- Send per-question remarks
        remarks: globalRemark, // <--- Send global remark
      };

      // ✅ CHANGED: Use api helper
      await api.put(`/api/exams/result/${id}`, payload);

      toast.success("Grades & Remarks Published Successfully!");
      setTimeout(() => navigate(`/exam-results/${result.exam._id}`), 1500);
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg && msg.includes("userAnswers")) {
        toast.error("Database Error: Student answers are missing.");
      } else {
        toast.error(msg || "Failed to update grades");
      }
    }
  };

  // --- FIX: Safety check for user login ---
  if (!user) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px", color: "white" }}>
        Please Login to view this page.
      </h2>
    );
  }

  if (!result || !exam)
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px", color: "white" }}>
        Loading Answer Sheet...
      </h2>
    );

  return (
    <>
      <Navbar />
      <div className="take-exam-container">
        <ToastContainer theme="dark" />
        <div className="exam-paper">
          {/* HEADER SECTION */}
          <header
            className="paper-header"
            style={{
              borderBottom: "4px solid #a575ff",
              marginTop: "20px",
            }}
          >
            <h1 style={{ wordBreak: "break-word" }}>
              Reviewing: {result.user?.name || "Unknown Student"}
            </h1>
            <p
              style={{
                fontSize: "1.3rem",
                marginBottom: "10px",
                fontWeight: "bolder",
                fontFamily: "sans-serif",
              }}
              className="subtitle"
            >
              Exam: {exam.title}
            </p>

            {/* ✅ NEW: Created & Attempted Dates */}
            <div
              style={{
                fontSize: "1.3rem",
                color: "#666",
                marginBottom: "15px",
              }}
            >
              <span style={{ marginRight: "15px" }}>
                📅 Created: {new Date(exam.createdAt).toLocaleDateString()}
              </span>
              <span>
                ✍ Attempted: {new Date(result.createdAt).toLocaleString()}
              </span>
            </div>

            <div
              className="exam-meta"
              style={{
                marginTop: "15px",
                padding: "10px",
                background: "#f0f2f5",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap", // ALLOW WRAPPING
                  gap: "10px",
                  width: "100%",
                }}
              >
                <span>
                  🎯 Target: <strong>{exam.totalMarks} Marks</strong>
                </span>
                <span>
                  🛑 Passing: <strong>{exam.passingMarks} Marks</strong>
                </span>
                <span
                  style={{
                    color:
                      totalScore >= exam.passingMarks ? "#2ecc71" : "#e74c3c",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  📝 Total Score: {totalScore} / {exam.totalMarks}
                </span>
              </div>
            </div>
          </header>

          {/* QUESTIONS LIST */}
          <div className="questions-list">
            {exam.questions.map((q, index) => {
              const answers = result.userAnswers || [];
              const studentAnswer = answers[index];

              const isMcq = q.type === "mcq";
              const isCorrect =
                isMcq &&
                studentAnswer !== undefined &&
                studentAnswer !== null &&
                parseInt(studentAnswer) === q.correctOption;

              return (
                <div
                  key={index}
                  className="question-block"
                  style={{
                    borderLeft: isMcq
                      ? "5px solid #2ecc71"
                      : "5px solid #f39c12",
                  }}
                >
                  {/* Question Text */}
                  <h3>
                    Q{index + 1}. {q.questionText}
                    <span className="marks-badge">({q.marks} Marks)</span>
                  </h3>

                  {/* Student Answer Display */}
                  <div
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "8px",
                      marginTop: "10px",
                      border: "1px solid #eee",
                      overflowX: "auto", // Prevent code blocks from breaking layout
                    }}
                  >
                    <strong style={{ color: "#666", fontSize: "0.9rem" }}>
                      Student's Answer:
                    </strong>

                    {isMcq ? (
                      <p
                        style={{
                          color: isCorrect ? "green" : "red",
                          fontWeight: "bold",
                          marginTop: "5px",
                        }}
                      >
                        {q.options?.[studentAnswer] || "Not Answered"}
                        {isCorrect ? " ✅" : " ❌"}
                      </p>
                    ) : (
                      <p
                        style={{
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          color: "#333",
                          marginTop: "5px",
                          wordBreak: "break-word", // FIX TEXT OVERFLOW
                        }}
                      >
                        {studentAnswer || "No Answer Provided"}
                      </p>
                    )}
                  </div>

                  {/* Correct Answer (For Context) */}
                  {isMcq && !isCorrect && (
                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "0.9rem",
                        color: "#555",
                      }}
                    >
                      Correct was:{" "}
                      <b>{q.options?.[q.correctOption] || "N/A"}</b>
                    </div>
                  )}

                  {/* --- GRADING INTERFACE --- */}

                  {/* 1. MCQ: Auto-Graded Display */}
                  {isMcq && (
                    <div
                      style={{
                        marginTop: "15px",
                        textAlign: "right",
                        color: "#666",
                      }}
                    >
                      Marks Awarded:{" "}
                      <strong>
                        {isCorrect ? q.marks : 0} / {q.marks}
                      </strong>
                    </div>
                  )}

                  {/* 2. Theory: Manual Grading Box */}
                  {!isMcq && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "15px",
                        background: "#fff8e1",
                        borderRadius: "5px",
                      }}
                    >
                      {/* Score Input Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <label style={{ color: "#d35400", fontWeight: "bold" }}>
                          Grade this Answer:
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max={q.marks}
                            value={
                              theoryMarks[index] !== undefined
                                ? theoryMarks[index]
                                : ""
                            }
                            onChange={(e) =>
                              handleGradeChange(index, e.target.value, q.marks)
                            }
                            placeholder="0"
                            style={{
                              width: "60px",
                              padding: "8px",
                              borderRadius: "5px",
                              border: "2px solid #d35400",
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                            }}
                          />
                          <span style={{ fontWeight: "bold", color: "#555" }}>
                            / {q.marks}
                          </span>
                        </div>
                      </div>

                      {/* ---  Per-Question Remark Input --- */}
                      <textarea
                        placeholder="Write specific feedback for this answer (e.g. Missing keywords)..."
                        value={questionRemarks[index] || ""}
                        onChange={(e) =>
                          handleRemarkChange(index, e.target.value)
                        }
                        style={{
                          width: "97%",
                          padding: "10px",
                          borderRadius: "5px",
                          border: "1px solid #d35400",
                          fontSize: "0.8rem",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                        rows="2"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FOOTER ACTIONS: Global Remarks & Save */}
          <div
            className="grading-box"
            style={{
              background: "#34495e",
              padding: "20px",
              borderRadius: "10px",
              marginTop: "30px",
              color: "white",
            }}
          >
            {/* ---  Global Remark Input --- */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Overall Performance Feedback / Remarks:
              </label>
              <textarea
                value={globalRemark}
                onChange={(e) => setGlobalRemark(e.target.value)}
                placeholder="e.g. Excellent work, but try to improve on Java concepts..."
                style={{
                  width: "97%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  fontFamily: "inherit",
                  minHeight: "80px",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "1.5rem",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              Final Score:{" "}
              <span style={{ color: "#f1c40f", fontWeight: "bold" }}>
                {totalScore}
              </span>{" "}
              / {exam.totalMarks}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                className="submit-final-btn"
                onClick={handleSaveGrades}
                style={{
                  background: "#2ecc71",
                  width: "100%",
                  maxWidth: "300px",
                  marginTop: "0px",
                }}
              >
                Save & Publish Grade
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReviewExam;
