import { useState, useEffect } from "react";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ✅ NEW: PASSWORD VISIBILITY STATE
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;
  const location = useLocation();
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    // If there is a message in the "state", show it!
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear state so it doesn't show again on refresh (optional but good)
      window.history.replaceState({}, document.title);
    }

    // Check URL query params for errors (e.g., from Google Auth failure)
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    if (error === "auth_failed")
      toast.error("Google Login Failed. Please try again.");
    if (error === "account_exists")
      toast.info("You already have an account! Please login.");
    if (error === "account_not_found")
      toast.error("No account found. Please Sign Up first.");
  }, [location]);

  // --- NEW: HANDLE GOOGLE LOGIN ---
  const handleGoogleLogin = () => {
    // 1. Check if a redirect URL is already saved in session storage
    let redirectPath = sessionStorage.getItem("redirectAfterLogin");

    // 2. If not, check if React State passed it
    if (!redirectPath && location.state?.from?.pathname) {
      redirectPath = location.state.from.pathname;
      sessionStorage.setItem("redirectAfterLogin", redirectPath);
    }

    // 3. Go to Google
    // ✅ CHANGED: Use dynamic Base URL so it works in Production
    window.location.href = `${api.defaults.baseURL}/auth/google?intent=login`;
  };

  // --- HANDLE EMAIL LOGIN ---
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ CHANGED: Use 'api' helper
      const response = await api.post("/api/users/login", formData);
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        toast.success(`Welcome back, ${response.data.name}!`);

        const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
        const destination = location.state?.from || "/";

        if (savedRedirect) sessionStorage.removeItem("redirectAfterLogin");

        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);

      // ✅ CLEAR EMAIL & PASSWORD ON INVALID LOGIN
      setFormData({
        email: "",
        password: "",
      });

      // ✅ RESET PASSWORD VISIBILITY
      setShowPassword(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <ToastContainer position="top-center" theme="dark" />

      {/* ✅ ADDED WRAPPER: Centers card and pushes footer down using flex: 1 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div className="login-card">
          <section className="login-header">
            <h1>
              <span className="score-text">Score</span>
              <span className="veda-text">Veda</span>
            </h1>
            <p>Your Apna Exam Portal</p>
          </section>

          <section className="form">
            <form onSubmit={onSubmit} autoComplete="off">
              {/* autoComplete off prevents browser clutter */}
              {/* NEW STRUCTURE FOR FLOATING LABELS */}
              <div className="input-group">
                <input
                  type="email"
                  className="form-input"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required // This is crucial for CSS to know when to float the label
                />
                {/* Label MUST come AFTER input for the CSS trick to work */}
                <label htmlFor="email" className="floating-label">
                  Email Address
                </label>
              </div>
              {/* 🔐 PASSWORD WITH EYE TOGGLE */}
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

                {/* 👁 TOGGLE BUTTON */}
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
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
              </div>
              {/* 🔁 FORGOT PASSWORD LINK */}
              <div
                style={{
                  textAlign: "right",
                  marginTop: "-5px",
                  marginBottom: "10px",
                }}
              >
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "0.85rem",
                    color: "#a575ff",
                    textDecoration: "none",
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="form-group">
                <button type="submit" className="btn btn-block">
                  Login Now
                </button>
              </div>
              {/* --- GOOGLE LOGIN BUTTON --- */}
              <div className="form-group" style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
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
                  Login with Google
                </button>
              </div>
              {/* --------------------------- */}
            </form>

            <div style={{ marginTop: "20px" }}>
              <p style={{ fontSize: "14px" }}>
                New here?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#a575ff",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Create an Account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ✅ NEW FOOTER */}
      <footer
        style={{
          padding: "30px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.85rem",
          background: "transparent", // Removed the dark box background
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "25px",
            marginBottom: "10px",
            lexWrap: "wrap",
          }}
        >
          <Link to="/about" style={{ color: "#ccc", textDecoration: "none" }}>
            About Us
          </Link>
          <Link to="/privacy" style={{ color: "#ccc", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <Link to="/terms" style={{ color: "#ccc", textDecoration: "none" }}>
            Terms of Service
          </Link>
          <Link to="/contact" style={{ color: "#ccc", textDecoration: "none" }}>
            Contact Support
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} ScoreVeda. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Login;
