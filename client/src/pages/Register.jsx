import { useState, useEffect } from "react";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Auth.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    googleId: null, // Store googleId here
  });

  // ✅ NEW: PASSWORD VISIBILITY STATE
  const [showPassword, setShowPassword] = useState(false);

  const { name, email, password, role, googleId } = formData;
  const navigate = useNavigate();
  const location = useLocation();

  // --- NEW: CHECK FOR GOOGLE DATA OR ERRORS IN URL ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // 1. Check for "Account Not Found" Error
    const error = params.get("error");
    if (error === "account_not_found") {
      toast.error("No account found. Please create an account first.");
    }

    // 2. Check for Google Data
    const googleName = params.get("name");
    const googleEmail = params.get("email");
    const gId = params.get("googleId");

    if (googleName && googleEmail && gId) {
      setFormData((prev) => ({
        ...prev,
        name: googleName,
        email: googleEmail,
        googleId: gId,
        password: "", // Ensure password is empty/hidden
      }));
      toast.info("Verified with Google! Select role to complete.");
    }
  }, [location]);

  // ---  HANDLE GOOGLE SIGNUP ---
  const handleGoogleSignup = () => {
    // ✅ CHANGED: Use dynamic Base URL so it works in Production
    window.location.href = `${api.defaults.baseURL}/auth/google?intent=signup`;
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      //  DEFINE userData HERE
      const userData = {
        name,
        email,
        // If googleId exists, send undefined for password (backend handles it)
        password: googleId ? undefined : password,
        role,
        googleId,
      };

      
      await api.post("/api/users", userData);

      navigate("/login", {
        state: { message: "Account Created! Please Login." },
      });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      className="login-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <ToastContainer position="top-center" theme="dark" />

      {/* ✅ WRAPPER: Centers the card and pushes footer down */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "40px 0",
        }}
      >
        <div className="login-card">
          <section className="login-header">
            <h1>
              <span className="score-text">Join</span>
              <span className="veda-text">ScoreVeda</span>
            </h1>
            <p>Create your account today!!</p>
          </section>

          <section className="form">
            <form onSubmit={onSubmit} autoComplete="off">
              {/* NAME FIELD */}
              <div className="input-group">
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  id="name"
                  value={name}
                  onChange={onChange}
                  required
                  readOnly={!!googleId} // Read-only if from Google
                  style={
                    googleId ? { opacity: 0.7, cursor: "not-allowed" } : {}
                  }
                />
                <label htmlFor="name" className="floating-label">
                  Full Name
                </label>
              </div>

              {/* EMAIL FIELD */}
              <div className="input-group">
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  id="email"
                  value={email}
                  onChange={onChange}
                  required
                  readOnly={!!googleId} // Read-only if from Google
                  style={
                    googleId ? { opacity: 0.7, cursor: "not-allowed" } : {}
                  }
                />
                <label htmlFor="email" className="floating-label">
                  Email Address
                </label>
              </div>

              {/* PASSWORD FIELD - HIDDEN IF GOOGLE USER */}
              {!googleId && (
                <div className="input-group" style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                  />
                  <label htmlFor="password" className="floating-label">
                    Password
                  </label>

                  {/* 👁 PASSWORD TOGGLE */}
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "19%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#ccc",
                      userSelect: "none",
                    }}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? "⌣" : "👁"}
                  </span>
                  {/* PASSWORD RULES */}
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#888",
                      marginTop: "5px",
                      lineHeight: "1.4",
                    }}
                  >
                    Password must contain:
                    <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                      <li>At least 8 characters</li>
                      <li>One Uppercase (A-Z) & One Lowercase (a-z)</li>
                      <li>One Number (0-9) & One Symbol (@$!%*?&)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* SHOW SUCCESS MESSAGE IF GOOGLE USER */}
              {googleId && (
                <div
                  style={{
                    marginBottom: "15px",
                    color: "#4cbb17",
                    fontSize: "0.9rem",
                  }}
                >
                  ✓ Securely verified via Google. No password needed.
                </div>
              )}

              {/* ROLE DROPDOWN */}
              <div className="input-group" style={{ marginBottom: "2rem" }}>
                <select
                  name="role"
                  value={role}
                  onChange={onChange}
                  className="form-input"
                  style={{ color: "white", backgroundColor: "#1a1a2e" }}
                >
                  <option
                    value="student"
                    style={{ backgroundColor: "#231a2eff", color: "white" }}
                  >
                    Student
                  </option>
                  <option
                    value="admin"
                    style={{ backgroundColor: "#231a2eff", color: "white" }}
                  >
                    Teacher/Admin
                  </option>
                </select>
                <label
                  className="floating-label"
                  style={{
                    top: "-20px",
                    left: "0",
                    fontSize: "14px",
                    color: "#a575ff",
                  }}
                >
                  Select Role
                </label>
              </div>

              <div className="form-group">
                <button type="submit" className="btn btn-block">
                  {googleId ? "Complete Registration" : "Register"}
                </button>
              </div>
            </form>
            {/* --- FORM ENDS HERE --- */}

            {/* --- GOOGLE SIGNUP BUTTON (ONLY SHOW IF NOT VERIFIED) --- */}
            {!googleId && (
              <div className="form-group" style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="btn btn-block"
                  style={{
                    background: "#DB4437", // Google Red
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                    G
                  </span>{" "}
                  Sign up with Google
                </button>
              </div>
            )}
            {/* ---------------------------- */}

            {/* Link to Login Page */}
            <div style={{ marginTop: "20px" }}>
              <p style={{ fontSize: "14px" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#a575ff",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Login Here
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ✅ UPDATED FOOTER */}
      <footer
        style={{
          padding: "30px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.85rem",
          background: "transparent",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "25px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/about"
            style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
          >
            About Us
          </Link>
          <Link
            to="/privacy"
            style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
          >
            Terms of Service
          </Link>
          <Link
            to="/contact"
            style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
          >
            Contact Support
          </Link>
        </div>
        <p style={{ opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} ScoreVeda. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Register;
