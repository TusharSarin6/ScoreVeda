import { useState, useEffect } from "react";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./Auth.css";

function ForgotPassword() {
  const navigate = useNavigate();

  // STEP CONTROL
  const [step, setStep] = useState(1);

  // FORM DATA
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ✅ NEW: CONFIRM PASSWORD
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI STATE
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ NEW: RESEND OTP TIMER STATE
  const [resendTimer, setResendTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // --- OTP TIMER EFFECT ---
  useEffect(() => {
    let timer;

    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }

    if (resendTimer === 0) {
      setCanResendOtp(true);
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [resendTimer, step]);

  // --- STEP 1: SEND OTP ---
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CHANGED: Use api helper
      await api.post("/api/users/forgot-password/send-otp", { email });
      toast.success("OTP sent to your email");
      setStep(2);

      // ✅ RESET TIMER ON SEND
      setResendTimer(60);
      setCanResendOtp(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND OTP ---
  const resendOtp = async () => {
    if (!canResendOtp) return;

    try {
      setLoading(true);
      // ✅ CHANGED: Use api helper
      await api.post("/api/users/forgot-password/send-otp", { email });
      toast.success("New OTP sent to your email");

      // RESET TIMER
      setResendTimer(60);
      setCanResendOtp(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CHANGED: Use api helper
      await api.post("/api/users/forgot-password/verify-otp", {
        email,
        otp,
      });
      toast.success("OTP verified");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: RESET PASSWORD ---
  const resetPassword = async (e) => {
    e.preventDefault();

    // ✅ FRONTEND VALIDATION
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // ✅ CHANGED: Use api helper
      await api.post("/api/users/forgot-password/reset", {
        email,
        otp,
        newPassword,
      });
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-center" theme="dark" />

      <div className="login-card" style={{ maxWidth: "480px" }}>
        <section className="login-header">
          <h1>
            <span className="score-text">Reset</span>
            <span className="veda-text">Password</span>
          </h1>
          <p>Recover access to your account</p>
        </section>

        {/* 🔔 GOOGLE USER NOTE */}
        <div
          style={{
            background: "#2c2c54",
            padding: "10px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#f1c40f",
            marginBottom: "15px",
          }}
        >
          ⚠️ Note: Only users who created accounts manually can reset passwords.
          Google accounts are managed by Google.
        </div>

        <section className="form">
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={sendOtp} autoComplete="off">
              <div className="input-group">
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ marginTop: "10px" }}
                />
                <label className="floating-label" style={{ marginTop: "10px" }}>
                  Email Address
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={loading}
                style={{ marginTop: "10px" }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={verifyOtp} autoComplete="off">
              <div className="input-group">
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <label className="floating-label">Enter OTP</label>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              {/* ✅ RESEND OTP SECTION */}
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                {!canResendOtp ? (
                  <span style={{ fontSize: "13px", color: "#aaa" }}>
                    Resend OTP in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#a575ff",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={resetPassword} autoComplete="off">
              <div className="input-group" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <label className="floating-label">New Password</label>

                {/* 👁 EYE TOGGLE */}
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    color: "#a575ff",
                  }}
                >
                  {showPassword ? "⌣" : "👁"}
                </span>
              </div>

              {/* ✅ CONFIRM PASSWORD */}
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <label className="floating-label">Confirm Password</label>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* BACK TO LOGIN */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Link
              to="/login"
              style={{
                color: "#a575ff",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ForgotPassword;
