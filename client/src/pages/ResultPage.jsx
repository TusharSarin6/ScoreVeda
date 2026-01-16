import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import { toast } from "react-toastify"; // Added for notifications
import { signatureFontBase64 } from "../utils/signatureFont";
import "./ResultPage.css";

function ResultPage() {
  const location = useLocation();
  const { id } = useParams(); // Get ID from URL params
  const navigate = useNavigate();
  const [fetchedResult, setFetchedResult] = useState(null);
  const [loading, setLoading] = useState(!!id && !location.state?.result);

  // FETCH RESULT IF URL HAS ID BUT STATE IS EMPTY (Direct Link)
  useEffect(() => {
    if (!location.state?.result && id) {
      // --- AUTH CHECK: Redirect to Login if no user found ---
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        toast.error("Please login to view your result.");
        sessionStorage.setItem("redirectAfterLogin", location.pathname);
        navigate("/login");
        return;
      }

      const fetchResult = async () => {
        try {
          // ✅ CHANGED: Use api helper
          const { data } = await api.get(`/api/exams/result/${id}`);
          setFetchedResult(data);
        } catch (error) {
          console.error("Error fetching result:", error);
          if (error.response && error.response.status === 401) {
            toast.error("Session expired. Please login again.");
            sessionStorage.setItem("redirectAfterLogin", location.pathname);
            navigate("/login");
          } else {
            toast.error("Failed to load result details.");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [id, location.state, navigate]);

  // Use state data OR fetched data
  const result = location.state?.result || fetchedResult;

  if (loading) {
    return (
      <h2 style={{ textAlign: "center", color: "white", marginTop: "50px" }}>
        Loading Result... ⏳
      </h2>
    );
  }

  if (!result) {
    return (
      <h2 style={{ textAlign: "center", color: "white", marginTop: "50px" }}>
        No result found. Please take an exam first.
      </h2>
    );
  }

  const isPending = result.status === "pending";
  // CHECK IF CERTIFICATE IS ENABLED
  const hasCert = result.exam?.hasCertificate;
  const questions = result.exam?.questions || [];

  // ---  HEADER INFO DATA ---
  const instituteName =
    result.exam?.instituteName || "Institute Name Not Provided";

  const adminName = result.exam?.createdBy?.name || "Admin";
  const adminEmail = result.exam?.createdBy?.email || "N/A";

  const createdOn = result.exam?.createdAt
    ? new Date(result.exam.createdAt).toLocaleString()
    : "N/A";

  const attemptedOn = result.createdAt
    ? new Date(result.createdAt).toLocaleString()
    : "N/A";

  // --- HELPER TO LOAD IMAGE (Needed for the Stamp) ---
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (e) => reject(e);
    });
  };

  const downloadCertificate = async () => {
    const settings = result.exam?.certificateSettings || {};
    const institute = settings.instituteName || "ScoreVeda Institute";
    const title = settings.certificateTitle || "CERTIFICATE OF ACHIEVEMENT";
    const sigName = settings.signatureName || "Authorized Signature";
    // FORCE GOLD THEME
    const themeColor = settings.themeColor || "#D4AF37";
    const logoPath = settings.instituteLogo;

    // Determine Student Name
    const studentName =
      result.user?.name ||
      JSON.parse(localStorage.getItem("user"))?.name ||
      "Student";

    // Create User Data Object for compatibility
    const userData = { name: studentName };

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [900, 650],
    });

    // Register handwritten font
    if (typeof signatureFontBase64 !== "undefined") {
      doc.addFileToVFS("Signature.ttf", signatureFontBase64);
      doc.addFont("Signature.ttf", "Signature", "normal");
    }

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 900, 650, "F");

    // Soft background watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(120);
    doc.setFont("times", "bold");
    doc.text("ScoreVeda", 450, 380, {
      align: "center",
      angle: 25,
    });

    // --- GOLD FOIL EFFECT BORDER ---
    // Outer dark gold border
    doc.setDrawColor(173, 138, 86);
    doc.setLineWidth(6);
    doc.rect(20, 20, 860, 610);

    // Middle metallic gold border
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(3);
    doc.rect(30, 30, 840, 590);

    // Inner light gold shine
    doc.setDrawColor(240, 217, 138);
    doc.setLineWidth(1.5);
    doc.rect(38, 38, 824, 574);

    // --- CORNER ACCENTS ---
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);

    // Top-left
    doc.line(20, 80, 80, 20);
    doc.line(20, 20, 80, 20);

    // Top-right
    doc.line(820, 20, 880, 20);
    doc.line(880, 20, 880, 80);

    // Bottom-left
    doc.line(20, 560, 20, 620);
    doc.line(20, 620, 80, 620);

    // Bottom-right
    doc.line(880, 560, 880, 620);
    doc.line(820, 620, 880, 620);

    // Institute Logo (Top Left)
    if (logoPath) {
      const isPng = logoPath.startsWith("data:image/png");
      const format = isPng ? "PNG" : "JPEG";
      const cleanBase64 = logoPath.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
      );
      doc.addImage(cleanBase64, format, 405, 40, 130, 90);
    }

    // Institute Name (Bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(60);
    doc.text(institute, 450, 160, { align: "center" });

    // Certificate Title
    doc.setFontSize(38);
    doc.setTextColor(themeColor);
    doc.text(title, 450, 210, { align: "center" });

    // --- NEW BODY TEXT LAYOUT ---

    // 1. "This is to certify that"
    doc.setFontSize(18);
    doc.setFont("times", "italic");
    doc.setTextColor(80);
    doc.text("This is to certify that", 450, 250, { align: "center" });

    // 2. Candidate Name (Bold)
    doc.setFont("times", "bolditalic");
    doc.setFontSize(42);
    doc.setTextColor(0);
    doc.text(userData.name, 450, 290, { align: "center" });

    // Underline Name
    doc.setLineWidth(1);
    doc.setDrawColor(100);
    doc.line(250, 300, 650, 300);

    // 3. Body Text Construction
    const examDate = new Date(result.createdAt).toLocaleDateString();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(60);

    // Line A
    doc.text("has successfully completed and passed the", 450, 330, {
      align: "center",
    });

    // Line B: Exam Name (Bold)
    doc.setFont("helvetica", "bold");
    doc.text(result.exam.title, 450, 350, { align: "center" });

    // Line C
    doc.setFont("helvetica", "normal");
    doc.text("conducted by", 450, 370, { align: "center" });

    // Line D: Institute & Date (Bold)
    const lineDText = `${institute} on ${examDate}`;
    doc.setFont("helvetica", "bold");
    doc.text(lineDText, 450, 390, { align: "center" });

    // Line E: Dedication
    doc.setFont("helvetica", "normal");
    const dedicationText = `This certificate is awarded in recognition of their dedication and the knowledge demonstrated throughout the examination.`;
    const splitDedication = doc.splitTextToSize(dedicationText, 700);
    doc.text(splitDedication, 450, 420, { align: "center" });

    // 4. Score Display
    const scoreLabel = "Score: ";
    const scoreValue = `${result.score} / ${result.totalMarks}`;

    doc.setFontSize(18);
    doc.setTextColor(themeColor);

    // Center calculation
    doc.setFont("helvetica", "bold");
    const valWidth = doc.getTextWidth(scoreValue);
    doc.setFont("helvetica", "normal");
    const lblWidth = doc.getTextWidth(scoreLabel);
    const totalScoreWidth = lblWidth + valWidth;
    const scoreStartX = 450 - totalScoreWidth / 2;

    doc.text(scoreLabel, scoreStartX, 460);
    doc.setFont("helvetica", "bold");
    doc.text(scoreValue, scoreStartX + lblWidth, 460);

    // --- BOTTOM SECTION ---
    const issueDate = new Date().toLocaleDateString();
    const certId = `SV-${result._id.slice(-6).toUpperCase()}`;

    doc.setFontSize(12);
    doc.setTextColor(80);

    // Issue Date (No Gap Logic)
    const dateLabel = "Certificate Issue Date: ";
    doc.setFont("helvetica", "normal");
    doc.text(dateLabel, 60, 570);

    const dateLabelWidth = doc.getTextWidth(dateLabel); // Measure exact width
    doc.setFont("helvetica", "bold"); // Switch to bold
    doc.text(issueDate, 60 + dateLabelWidth, 570); // Place value immediately after

    // Certificate ID (No Gap Logic)
    const idLabel = "Certificate ID: ";
    doc.setFont("helvetica", "normal");
    doc.text(idLabel, 60, 585);

    const idLabelWidth = doc.getTextWidth(idLabel); // Measure exact width
    doc.setFont("helvetica", "bold"); // Switch to bold
    doc.text(certId, 60 + idLabelWidth, 585); // Place value immediately after

    // Signature Section
    const sigCenterX = 750;
    const lineY = 560;

    // [Teacher Name] (Signature Style - inherently bold/distinct)
    doc.setFont("Signature", "normal");
    doc.setFontSize(28);
    doc.setTextColor(40);
    doc.text(sigName, sigCenterX, lineY - 10, { align: "center" });

    // Line
    doc.setLineWidth(1);
    doc.setDrawColor(100);
    doc.line(650, lineY, 850, lineY);

    // "Authorized Signatory"
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Authorized Signatory", sigCenterX, lineY + 15, {
      align: "center",
    });

    // --- STAMP ---
    try {
      const stampBase64 = await loadImageAsBase64("/scoreveda-certified.png");
      const cleanStamp = stampBase64.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
      );
      // Corrected Position: X=120, Y=435, Size=120x120
      doc.addImage(cleanStamp, "PNG", 60, 460, 150, 100);
    } catch (err) {
      console.warn("Stamp image failed to load:", err);
    }

    doc.save(`${userData.name}_Certificate.pdf`);
    toast.success("🎓 Certificate Downloaded!");
  };

  return (
    <>
      <Navbar />
      <div className="result-container">
        {/* ---  EXAM HEADER INFO CARD --- */}
        <div
          className="result-card"
          style={{
            marginBottom: "25px",
            textAlign: "center",
            background: "#f9f9ff",
          }}
        >
          <h2 style={{ marginBottom: "8px", color: "#4c2a85" }}>
            {instituteName}
          </h2>

          <p style={{ margin: "5px 0", color: "#555", fontSize: "0.95rem" }}>
            <strong>Created By:</strong> {adminName} | <strong>Email:</strong>{" "}
            {adminEmail}
          </p>

          <p style={{ margin: "5px 0", color: "#777", fontSize: "0.9rem" }}>
            <strong>Created On:</strong> {createdOn} &nbsp; | &nbsp;
            <strong>Attempted On:</strong> {attemptedOn}
          </p>
        </div>

        {/* --- MAIN SCORE CARD --- */}
        <div className="result-card">
          {/* ✅ NEW: Exam Title & Code Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: "1px solid #eee",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0, color: "#333", fontSize: "1.2rem" }}>
              {result.exam?.title || "Exam Name"}
            </h3>
            <span
              style={{
                background: "#f0f2f5",
                padding: "5px 10px",
                borderRadius: "5px",
                fontSize: "0.9rem",
                color: "#555",
                fontWeight: "600",
                border: "1px solid #ddd",
                fontFamily: "monospace",
              }}
            >
              Code: {result.exam?.accessCode || "N/A"}
            </span>
          </div>

          <div
            className={`status-icon ${
              isPending ? "pending" : result.isPassed ? "pass" : "fail"
            }`}
          >
            {isPending ? "⏳" : result.isPassed ? "🎉" : "😔"}
          </div>

          <h1>
            {isPending
              ? "Submission Successful!"
              : result.isPassed
              ? "Congratulations!"
              : "Better Luck Next Time"}
          </h1>
          <p className="subtitle">
            {isPending
              ? "Your exam contains theory questions. The result will be declared after the teacher reviews your answers."
              : `You have ${result.isPassed ? "passed" : "failed"} the exam.`}
          </p>

          <div className="score-box">
            <span className="score-label">
              {isPending ? "Objective Score (So far)" : "Final Score"}
            </span>
            <span className="score-value">
              {result.score} / {result.totalMarks}
            </span>
            {isPending && (
              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#e67e22",
                  fontWeight: "bold",
                }}
              >
                *Theory marks pending
              </small>
            )}
          </div>

          {/* --- DISPLAY GLOBAL TEACHER REMARKS --- */}
          {result.remarks && (
            <div
              style={{
                background: "#eafaf1",
                borderLeft: "5px solid #2ecc71",
                padding: "15px",
                borderRadius: "5px",
                margin: "20px 0",
                textAlign: "left",
                color: "#27ae60",
              }}
            >
              <strong>👨‍🏫 Teacher's Feedback:</strong>
              <p style={{ margin: "5px 0 0 0", color: "#333" }}>
                "{result.remarks}"
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/* ONLY SHOW BUTTON IF CERTIFICATE ENABLED */}
            {hasCert && !isPending && result.isPassed && (
              <button
                onClick={downloadCertificate}
                className="home-btn"
                style={{
                  background: "#2ecc71",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🎓 Download Certificate
              </button>
            )}

            {/* SHOW LOCKED BUTTON ONLY IF CERTIFICATE ENABLED & FAILED */}
            {hasCert && !isPending && !result.isPassed && (
              <button
                disabled
                style={{
                  background: "#ccc",
                  cursor: "not-allowed",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "5px",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                🔒 Certificate Locked
              </button>
            )}
          </div>
        </div>

        {/* --- DETAILED ANALYSIS SECTION (Only if Published) --- */}
        {!isPending && (
          <div
            className="result-card"
            style={{ marginTop: "30px", textAlign: "left" }}
          >
            <h2
              style={{
                borderBottom: "2px solid #eee",
                paddingBottom: "10px",
                marginBottom: "20px",
                color: "#4c2a85",
              }}
            >
              📝 Detailed Performance Analysis
            </h2>

            {questions.map((q, index) => {
              const studentAns = result.userAnswers?.[index];
              const marksGiven = result.marksPerQuestion?.[index] || 0;
              const teacherRemark = result.questionRemarks?.[index];

              const isMcq = q.type === "mcq";
              let isCorrect = false;

              // Determine correctness
              if (isMcq) {
                isCorrect = parseInt(studentAns) === q.correctOption;
              } else {
                // For theory, we consider it "correct" if marks > 0, basically passed the question
                isCorrect = marksGiven > 0;
              }

              return (
                <div
                  key={index}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "20px",
                    background: "#fff",
                    borderLeft: isCorrect
                      ? "5px solid #2ecc71"
                      : "5px solid #e74c3c",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <h3
                      style={{ margin: "0", color: "#333", fontSize: "1.1rem" }}
                    >
                      Q{index + 1}. {q.questionText}
                    </h3>
                    <span
                      style={{
                        background: "#eee",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Score: {marksGiven} / {q.marks}
                    </span>
                  </div>

                  {/* STUDENT ANSWER */}
                  <div
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "5px",
                      marginTop: "15px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "#777",
                        fontWeight: "bold",
                      }}
                    >
                      Your Answer:
                    </p>
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        color: isCorrect ? "#27ae60" : "#c0392b",
                        fontWeight: "500",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {isMcq
                        ? q.options[studentAns] !== undefined
                          ? q.options[studentAns]
                          : "Skipped / Not Answered"
                        : studentAns || "No Answer Provided"}
                    </p>
                  </div>

                  {/* MCQ: SHOW CORRECT ANSWER IF WRONG */}
                  {isMcq && !isCorrect && (
                    <div
                      style={{
                        marginTop: "10px",
                        color: "#27ae60",
                        fontSize: "0.95rem",
                      }}
                    >
                      ✅ Correct Answer:{" "}
                      <strong>{q.options[q.correctOption]}</strong>
                    </div>
                  )}

                  {/* THEORY: SHOW TEACHER REMARKS */}
                  {teacherRemark && (
                    <div
                      style={{
                        marginTop: "15px",
                        background: "#fff8e1",
                        padding: "10px 15px",
                        borderRadius: "5px",
                        borderLeft: "3px solid #f1c40f",
                        fontSize: "0.95rem",
                      }}
                    >
                      <strong style={{ color: "#d35400" }}>👨‍🏫 Remark:</strong>{" "}
                      {teacherRemark}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- GO TO PROFILE BUTTON (Bottom) --- */}
        <div style={{ marginTop: "20px", marginBottom: "40px" }}>
          <Link
            to="/profile"
            className="home-btn"
            style={{
              padding: "15px 40px",
              fontSize: "1.1rem",
              background: "#34495e",
            }}
          >
            Go to My Profile
          </Link>
        </div>
      </div>
    </>
  );
}

export default ResultPage;
