import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  //Get user info
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (!storedUser) {
    return null;
  }

  // IMPORTANT: keep user in state so we can update it
  const [user, setUser] = useState(storedUser);

  // State for the Exam Code Input
  const [examCode, setExamCode] = useState("");
  const [loading, setLoading] = useState(false);

  // State for Admins
  const [adminExams, setAdminExams] = useState([]);

  // FETCH DATA (Only if Admin)
  useEffect(() => {
    if (user && user.role === "admin") {
      const fetchAdminData = async () => {
        try {
          // ✅ CHANGED: Use api helper
          const { data } = await api.get("/api/exams");

          // Filter to show only MY exams
          const myExams = data.filter(
            (e) => e.createdBy._id === user._id || e.createdBy === user._id
          );
          setAdminExams(myExams);
        } catch (error) {
          console.error("Failed to load admin data");
        }
      };
      fetchAdminData();
    }
  }, [user]);

  // STUDENT: Handle Join
  const handleJoinExam = async (e) => {
    e.preventDefault();

    // --- NEW: ALWAYS SYNC USER DATA FROM SERVER ---
    try {
      // ✅ CHANGED: Use api helper
      // Fetch fresh user profile
      const { data: freshUser } = await api.get("/api/users/me");

      // Update localStorage + state
      localStorage.setItem("user", JSON.stringify({ ...user, ...freshUser }));
      setUser((prev) => ({ ...prev, ...freshUser }));

      // --- EMAIL VERIFICATION CHECK ---
      const isVerified = freshUser.isEmailVerified || freshUser.isVerified;

      if (!isVerified) {
        toast.warning(
          "🔒 Verification Required! Please verify your email to join exams.",
          { autoClose: 2000 }
        );
        setTimeout(() => {
          navigate("/profile", { state: { activeTab: "contact" } });
        }, 2000);
        return;
      }

      // === NEW: PROFILE COMPLETION CHECK ===
      const isProfileComplete =
        freshUser.gender && freshUser.birthday && freshUser.phone;

      if (!isProfileComplete) {
        toast.warning("⚠ Please complete your profile before joining exams.", {
          autoClose: 2500,
        });
        setTimeout(() => {
          navigate("/profile", { state: { activeTab: "personal" } });
        }, 2000);
        return;
      }
      // === END PROFILE COMPLETION CHECK ===
    } catch (err) {
      toast.error("Unable to verify account status. Please try again.");
      return;
    }
    // ------------------------------------------------------------

    if (!examCode.trim()) return toast.error("Please enter a code");
    setLoading(true);
    try {
      // ✅ CHANGED: Use api helper
      // 1. Verify Code
      const { data } = await api.post("/api/exams/join", {
        accessCode: examCode,
      });

      // 2. Success! Redirect to the INSTRUCTIONS PAGE (not exam)
      if (data && data.examId) {
        toast.success(`Exam Found! Please read instructions.`);
        setTimeout(() => {
          // --- UPDATED: Go to Instructions Page First ---
          navigate(`/instructions/${data.examId}`);
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Code");
      setLoading(false);
    }
  };

  // --- VIEW 1: ADMIN DASHBOARD ---
  if (user.role === "admin") {
    return (
      <>
        <Navbar />

        <div className="dashboard-container admin-mode">
          <ToastContainer theme="dark" />

          <div className="admin-header">
            <h1>Welcome Back, {user.name.split(" ")[0]} 👋</h1>
            <p>Here is what's happening with your exams today.</p>
          </div>

          {/* ACTION CARDS */}
          <div className="admin-actions-grid">
            <div
              className="action-card create-card"
              onClick={() => navigate("/create-exam")}
            >
              <div className="icon">✚</div>
              <h3>Create New Exam</h3>
              <p>Design a new test with MCQs or Theory.</p>
            </div>

            <div
              className="action-card profile-card"
              // ✅ UPDATED: Redirects to 'exams' tab in profile (Published Exams)
              onClick={() =>
                navigate("/profile", { state: { activeTab: "exams" } })
              }
            >
              <div className="icon">📊</div>
              <h3>View Results</h3>
              <p>Check grades and review student answers.</p>
            </div>
          </div>

          {/* RECENT EXAMS LIST */}
          <div className="recent-section">
            <h2>Your Recent Exams</h2>
            <div className="recent-list">
              {adminExams.length > 0 ? (
                adminExams.slice(0, 3).map((exam) => (
                  <div key={exam._id} className="mini-exam-card">
                    <div>
                      <h4>{exam.title}</h4>
                      <span className="code-badge">
                        Code: {exam.accessCode}
                      </span>
                    </div>
                    <Link
                      to={`/exam-results/${exam._id}`}
                      className="mini-link"
                    >
                      Check Grades →
                    </Link>
                  </div>
                ))
              ) : (
                <p style={{ color: "#aaa" }}>
                  You haven't created any exams yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- VIEW 2: STUDENT DASHBOARD  ---
  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <ToastContainer theme="dark" />

        <div className="join-card">
          <h1 className="dash-title">Join an Exam</h1>
          <p className="dash-subtitle">
            Enter the unique code provided by your teacher.
          </p>

          <form onSubmit={handleJoinExam} className="join-form">
            <input
              type="text"
              placeholder="ENTER EXAM CODE"
              value={examCode}
              onChange={(e) =>
                setExamCode(e.target.value.toUpperCase().replace(/\s/g, ""))
              }
              className="code-input"
            />
            <button type="submit" className="join-btn" disabled={loading}>
              {loading ? "Verifying..." : "Enter Exam room →"}
            </button>
          </form>
        </div>

        {/* Optional: Show Recent History Shortcut */}
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p style={{ color: "#aaa" }}>Looking for past results?</p>
          <button
            onClick={() =>
              navigate("/profile", { state: { activeTab: "exams" } })
            }
            className="history-link-btn"
          >
            View My History
          </button>
        </div>
      </div>
    </>
  );
}

export default Dashboard;