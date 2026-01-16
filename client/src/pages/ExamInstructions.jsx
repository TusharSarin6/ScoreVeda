import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import "./ExamInstructions.css";

function ExamInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [exam, setExam] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        // ✅ CHANGED: Use api helper (Token is auto-injected)
        const { data } = await api.get(`/api/exams/${id}`);
        setExam(data);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load instructions.");
        setLoading(false);
      }
    };
    fetchExamDetails();
  }, [id, user.token]);

  const handleStartExam = () => {
    if (!isChecked) {
      toast.warning("Please accept the rules to proceed.");
      return;
    }
    // Navigate to the actual exam page
    navigate(`/take-exam/${id}`);
  };

  if (loading)
    return <div className="loader-text">Loading Instructions...</div>;

  if (!exam) return <div className="loader-text">Exam Not Found</div>;

  return (
    <>
      <Navbar />
      <div className="instructions-container">
        <ToastContainer theme="colored" />

        <div className="instructions-card">
          {/* HEADER SECTION */}
          <div className="inst-header">
            <h1 className="institute-name">
              {exam.instituteName || "ScoreVeda Institute"}
            </h1>
            <h2 className="exam-title">{exam.title}</h2>
            <div className="exam-meta">
              <span className="badge">⏱ {exam.duration} Minutes</span>
              <span className="badge">📝 {exam.totalMarks} Marks</span>
              <span className="badge">
                🎯 Passing Marks: {exam.passingMarks}
              </span>
            </div>
          </div>

          <hr className="divider" />

          {/* RULES SECTION (FETCHED DYNAMICALLY) */}
          <div className="rules-section">
            <h3>⚠️ Important Instructions</h3>
            <ul className="rules-list">
              {/* Only show rules fetched from the database */}
              {exam.examRules && exam.examRules.length > 0 ? (
                exam.examRules.map((rule, index) => <li key={index}>{rule}</li>)
              ) : (
                <li style={{ fontStyle: "italic", color: "#777" }}>
                  No specific rules provided for this exam.
                </li>
              )}
            </ul>
          </div>

          {/* CHECKBOX & ACTION */}
          <div className="confirmation-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <span>
                I have read and understood the instructions. I am ready to
                begin.
              </span>
            </label>

            <button
              onClick={handleStartExam}
              disabled={!isChecked}
              className={`start-btn ${isChecked ? "active" : "disabled"}`}
            >
              Start Exam 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ExamInstructions;
