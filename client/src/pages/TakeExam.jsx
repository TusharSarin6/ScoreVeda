import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import "./TakeExam.css";

function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [exam, setExam] = useState(null);

  // EXAM STATE
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  // UI STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // --- PREVENT RE-ATTEMPTS ---
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // LOGIC LOCKS
  const submitLock = useRef(false);
  const backAttempts = useRef(0);
  const answersRef = useRef(answers);
  const warningsRef = useRef(0);
  const MAX_WARNINGS = 3;

  // STORAGE KEYS
  const STORAGE_KEY_ANSWERS = `exam_${id}_${user._id}_answers`;
  const STORAGE_KEY_REVIEW = `exam_${id}_${user._id}_review`;
  const STORAGE_KEY_TIMER = `exam_${id}_${user._id}_endTime`;

  // --- 1. SYNC ANSWERS FOR BACKGROUND FETCH ---
  useEffect(() => {
    answersRef.current = answers;
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
    }
  }, [answers]);

  // --- 2. INITIAL LOAD & RESTORE ---
  useEffect(() => {
    const fetchExamAndCheckStatus = async () => {
      try {
        // ✅ CHANGED: Use api helper
        // A. Fetch Exam
        const { data: examData } = await api.get(`/api/exams/${id}`);

        // B. Check History (Server Side)
        const { data: history } = await api.get("/api/exams/my-results");
        const hasAttempted = history.some(
          (result) => result.exam._id === id || result.exam === id
        );

        if (hasAttempted) {
          setAlreadyAttempted(true);
          clearLocalStorage();
          return;
        }

        setExam(examData);

        // --- C. RESUME LOGIC ---
        const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

        const savedReview = localStorage.getItem(STORAGE_KEY_REVIEW);
        if (savedReview) setMarkedForReview(JSON.parse(savedReview));

        const savedEndTime = localStorage.getItem(STORAGE_KEY_TIMER);
        const now = Date.now();

        if (savedEndTime) {
          const remaining = Math.floor((parseInt(savedEndTime) - now) / 1000);
          if (remaining <= 0) {
            setTimeLeft(0);
            setTimeout(() => handleSubmit("time"), 1000);
          } else {
            setTimeLeft(remaining);
          }
        } else {
          const durationSec = examData.duration * 60;
          const endTime = now + durationSec * 1000;
          localStorage.setItem(STORAGE_KEY_TIMER, endTime);
          setTimeLeft(durationSec);
        }

        setVisited((prev) => ({ ...prev, 0: true }));
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error("Failed to load exam data");
        }
      }
    };
    fetchExamAndCheckStatus();
  }, [id, user.token]);

  // --- 3. DEAD MAN'S SWITCH (The "Leave Site" Logic) ---
  useEffect(() => {
    const handleUnload = () => {
      // If user is leaving and hasn't submitted manually...
      if (!submitLock.current && !alreadyAttempted) {
        const payload = {
          examId: id,
          userAnswers: answersRef.current,
        };

        // KEEPALIVE FETCH: This runs even if the browser tab closes
        // ✅ CHANGED: Use api.defaults.baseURL for keepalive fetch
        fetch(`${api.defaults.baseURL}/api/exams/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    };

    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [id, user.token, alreadyAttempted]);

  // --- 4. BROWSER BACK BUTTON STRATEGY (1 Warning -> 2 Popup) ---
  useEffect(() => {
    if (!exam || alreadyAttempted || isSubmitting) return;

    // A. INITIAL TRAP: Push one dummy state so Back Button triggers 'popstate'
    //    instead of immediately leaving the page.
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event) => {
      // INCREMENT ATTEMPT COUNTER
      backAttempts.current += 1;

      if (backAttempts.current === 1) {
        // --- STRIKE 1: TRAP USER & WARN ---
        // We push state AGAIN to restore the "buffer".
        // This stops them from hitting the instructions page.
        window.history.pushState(null, document.title, window.location.href);

        toast.warning(
          "⚠️ STOP! Don't go back! Next time will SUBMIT the exam.",
          {
            position: "top-center",
            autoClose: 4000,
            toastId: "back-warning",
          }
        );
      }
    };

    // B. Native "Leave Site?" Popup Handler
    const handleBeforeUnload = (e) => {
      // This shows the standard browser confirmation dialog
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [exam, alreadyAttempted, isSubmitting]);

  // --- 5. STANDARD SUBMIT ---
  const handleSubmit = async (reason = "manual") => {
    if (submitLock.current) return;
    submitLock.current = true;
    setIsSubmitting(true);

    try {
      // ✅ CHANGED: Use api helper
      const payload = { examId: id, userAnswers: answers };

      const toastId = toast.loading("Submitting Exam...");
      const response = await api.post("/api/exams/submit", payload);

      clearLocalStorage();

      toast.update(toastId, {
        render:
          reason === "cheat"
            ? "Terminated due to suspicious activity."
            : "Exam Submitted!",
        type: reason === "cheat" ? "error" : "success",
        isLoading: false,
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/result", { state: { result: response.data } });
      }, 2000);
    } catch (error) {
      console.error("Submission Error:", error);
      toast.dismiss();

      if (
        reason === "cheat" ||
        reason === "time" ||
        error.response?.data?.message?.includes("already")
      ) {
        toast.error("Exam Terminated.");
        clearLocalStorage();
        setTimeout(() => navigate("/profile"), 2000);
        return;
      }

      toast.error("Submission Failed. Check Internet & Try Again.");
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem(STORAGE_KEY_ANSWERS);
    localStorage.removeItem(STORAGE_KEY_REVIEW);
    localStorage.removeItem(STORAGE_KEY_TIMER);
  };

  // --- 6. TIMER ---
  // A. Decrement Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  // B. Handle Time Up (Side Effect)
  useEffect(() => {
    if (timeLeft === 0 && !submitLock.current && !alreadyAttempted) {
      handleSubmit("time");
    }
  }, [timeLeft, alreadyAttempted]);

  // --- 7. SECURITY: FULL SCREEN (Desktop) & TAB SWITCH (All) ---
  useEffect(() => {
    if (!exam || alreadyAttempted || submitLock.current) return;

    // Detect Mobile Device (Simple Regex)
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Helper to request full screen
    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error("Full screen denied:", err);
      }
    };

    // --- DESKTOP LOGIC: Enforce Full Screen ---
    const handleFullScreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullScreen(isFull);

      // Strict Rule: If Desktop user exits full screen
      if (!isFull && !submitLock.current && !alreadyAttempted) {
        // Increment warning counter
        warningsRef.current += 1;
        const count = warningsRef.current;
        setWarnings(count);

        if (count >= 2) {
          handleSubmit("cheat");
        } else {
          toast.warning(
            "⚠️ CRITICAL WARNING! Do not exit Full Screen again. Next time will TERMINATE the exam.",
            {
              position: "top-center",
              autoClose: 5000,
              theme: "colored",
              style: {
                background: "#e74c3c",
                color: "#fff",
                fontWeight: "bold",
              },
            }
          );
        }
      }
    };

    if (isMobile) {
      // ✅ On Mobile: Bypass Full Screen Requirement (Fixes iOS Issue)
      setIsFullScreen(true);
    } else {
      // 💻 On Desktop: Force Full Screen
      enterFullScreen();
      document.addEventListener("fullscreenchange", handleFullScreenChange);
    }

    // --- UNIVERSAL LOGIC: Tab/App Switching ---
    // (Works on Mobile if they switch apps, and Desktop if they Alt+Tab)
    const handleVisibilityChange = () => {
      if (document.hidden && !submitLock.current && !alreadyAttempted) {
        // We count tab switching as a strike too
        warningsRef.current += 1;
        const count = warningsRef.current;
        setWarnings(count);

        if (count >= MAX_WARNINGS) {
          handleSubmit("cheat");
        } else {
          toast.warning(
            `⚠️ Warning ${count}/${MAX_WARNINGS}: Don't switch apps/tabs!`
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (!isMobile) {
        document.removeEventListener(
          "fullscreenchange",
          handleFullScreenChange
        );
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [exam, alreadyAttempted]);

  // --- HELPER HANDLERS ---
  useEffect(() => {
    if (Object.keys(markedForReview).length > 0) {
      localStorage.setItem(STORAGE_KEY_REVIEW, JSON.stringify(markedForReview));
    }
  }, [markedForReview]);

  const handleOptionSelect = (val) => {
    if (!submitLock.current) {
      setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: val }));
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newState = { ...prev };
      if (newState[currentQuestionIndex]) delete newState[currentQuestionIndex];
      else newState[currentQuestionIndex] = true;
      return newState;
    });
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setVisited((prev) => ({ ...prev, [index]: true }));
  };

  const formatTime = (seconds) => {
    if (seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getQuestionStatus = (index) => {
    if (index === currentQuestionIndex) return "active";
    if (markedForReview[index]) return "review";
    if (answers[index] !== undefined && answers[index] !== "")
      return "answered";
    if (visited[index]) return "not-answered";
    return "not-visited";
  };

  if (alreadyAttempted) {
    return (
      <>
        <Navbar />
        <div
          className="take-exam-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="exam-paper"
            style={{ textAlign: "center", padding: "50px" }}
          >
            <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>🚫</h1>
            <h2 style={{ color: "#e74c3c" }}>Access Denied</h2>
            <p style={{ fontSize: "1.2rem", color: "#555", margin: "20px 0" }}>
              You have already attempted this exam.
              <br />
              Re-attempts are not allowed.
            </p>
            <button
              className="submit-final-btn"
              onClick={() =>
                navigate("/profile", { state: { activeTab: "exams" } })
              }
              style={{ background: "#34495e" }}
            >
              Go to My History
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!exam)
    return (
      <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading Exam...
      </h2>
    );

  const currentQ = exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;

  return (
    <>
      {/* ✅ FULL SCREEN ENFORCEMENT OVERLAY */}
      {!isFullScreen && !alreadyAttempted && !isSubmitting && exam && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.95)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</h1>
          <h2>Security Check Required</h2>
          <p
            style={{
              maxWidth: "500px",
              margin: "20px auto",
              lineHeight: "1.6",
            }}
          >
            This exam requires <strong>Full Screen Mode</strong>.
            <br />
            Exiting full screen or switching tabs will{" "}
            <strong>terminate</strong> your exam immediately.
          </p>
          <button
            onClick={() => {
              document.documentElement.requestFullscreen().catch((err) => {
                toast.error(
                  "Could not enable full screen. Please try a different browser."
                );
              });
            }}
            style={{
              padding: "15px 30px",
              fontSize: "1.2rem",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Enter Full Screen to Start
          </button>
        </div>
      )}
      <Navbar />
      <div className="take-exam-container-split">
        <ToastContainer theme="colored" />

        <div className="question-area">
          <header className="paper-header">
            <div className="exam-info-bar">
              {/* --- TITLE --- */}
              <div style={{ flex: 1, marginRight: "20px" }}>
                <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{exam.title}</h1>
              </div>
              {/* ----------------------------------- */}

              <div className="timer-badge">
                ⏱ {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </div>
            </div>

            {warnings > 0 && (
              <div className="warning-banner">
                ⚠️ WARNINGS: {warnings} / {MAX_WARNINGS} (Tab Switching
                Detected)
              </div>
            )}
          </header>
          <header className="paper-header" style={{ marginTop: "5px" }}>
            <div className="exam-info-bar">
              {/* ---  DESCRIPTION --- */}
              <div style={{ flex: 1, marginRight: "20px" }}>
                <h4
                  style={{
                    color: "#4c2a85",
                    fontSize: "1.17em",
                    fontWeight: "bold",
                  }}
                >
                  Exam Description
                </h4>
                {exam.description && (
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#333333",
                      marginTop: "5px",
                      lineHeight: "1.4",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {exam.description}
                  </p>
                )}
              </div>
              {/* ----------------------------------- */}
            </div>
          </header>

          <div className="question-display">
            <div className="q-header">
              <h3>Question {currentQuestionIndex + 1}</h3>
              <div className="q-marks">{currentQ.marks} Marks</div>
            </div>
            <p className="q-text">{currentQ.questionText}</p>
            {currentQ.type === "mcq" ? (
              <div className="options-list">
                {currentQ.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`option-item ${
                      answers[currentQuestionIndex] === optIndex
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleOptionSelect(optIndex)}
                  >
                    <span className="opt-label">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                className="theory-input"
                value={answers[currentQuestionIndex] || ""}
                onChange={(e) => handleOptionSelect(e.target.value)}
                placeholder="Type your answer here..."
              ></textarea>
            )}
          </div>

          <div className="footer-controls">
            <button
              className="review-btn"
              onClick={toggleMarkForReview}
              style={{
                background: markedForReview[currentQuestionIndex]
                  ? "#8e44ad"
                  : "#95a5a6",
              }}
            >
              {markedForReview[currentQuestionIndex]
                ? "★ Unmark Review"
                : "☆ Mark for Review"}
            </button>
            <div className="nav-buttons">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                className="prev-btn"
              >
                Previous
              </button>
              <button
                className="next-btn"
                onClick={() => {
                  if (isLastQuestion) {
                    if (
                      window.confirm(
                        "Are you sure you want to submit the exam?"
                      )
                    ) {
                      handleSubmit("manual");
                    }
                  } else {
                    if (currentQuestionIndex < exam.questions.length - 1) {
                      navigateToQuestion(currentQuestionIndex + 1);
                    }
                  }
                }}
                style={{ background: isLastQuestion ? "#2980b9" : "#2ecc71" }}
              >
                {isLastQuestion ? "Submit Exam" : "Save & Next"}
              </button>
            </div>
          </div>
        </div>

        <div className="navigation-sidebar">
          <div className="nav-header">
            <h3>Question Palette</h3>
          </div>
          <div className="grid-container">
            {exam.questions.map((_, index) => (
              <button
                key={index}
                className={`grid-item ${getQuestionStatus(index)}`}
                onClick={() => navigateToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="dot answered"></span> Answered
            </div>
            <div className="legend-item">
              <span className="dot not-answered"></span> Not Answered
            </div>
            <div className="legend-item">
              <span className="dot review"></span> Marked for Review
            </div>
            <div className="legend-item">
              <span className="dot not-visited"></span> Not Visited
            </div>
          </div>
          <button
            className="submit-final-btn"
            onClick={() => {
              if (window.confirm("Are you sure you want to submit the exam?")) {
                handleSubmit("manual");
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </>
  );
}

export default TakeExam;