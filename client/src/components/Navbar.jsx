import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ NEW: Get API URL dynamically for images
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- NEW: Check if user is taking an exam ---
  const isTakingExam = location.pathname.startsWith("/take-exam");

  // --- NEW: Listen for Profile Updates ---
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleStorageChange);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const onLogout = () => {
    if (isTakingExam) return;
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // ✅ HELPER: Construct Image URL safely
  const getProfileImage = (path) => {
    if (!path) return null;
    // If it's a Google URL (starts with http), use it as is.
    // If it's a local upload (starts with /uploads), prepend the backend URL.
    return path.startsWith("http") ? path : `${API_URL}${path}`;
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        {isTakingExam ? (
          <div style={{ cursor: "default" }}>
            <div className="logo-text">
              <span style={{ color: "#fff" }}>Score</span>
              <span style={{ color: "#a575ff" }}>Veda</span>
            </div>
            <div className="tagline">Your apna exam portal</div>
          </div>
        ) : (
          <Link to="/" style={{ textDecoration: "none" }}>
            <div className="logo-text">
              <span style={{ color: "#fff" }}>Score</span>
              <span style={{ color: "#a575ff" }}>Veda</span>
            </div>
            <div className="tagline">Your Apna Exam Portal</div>
          </Link>
        )}
      </div>

      {/* HAMBURGER ICON */}
      {!isTakingExam && (
        <div
          className="hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </div>
      )}

      <div className={`nav-menu ${isMobileMenuOpen ? "active" : ""}`}>
        {/* About Us Link */}
        {!isTakingExam && (
          <Link to="/about" className="nav-link">
            About Us
          </Link>
        )}

        {user ? (
          <>
            {!isTakingExam && user.role === "admin" && (
              <button
                className="create-btn"
                onClick={() => {
                  const completion =
                    (user.isEmailVerified ? 25 : 0) +
                    (user.gender ? 25 : 0) +
                    (user.birthday ? 25 : 0) +
                    (user.phone ? 25 : 0);

                  if (completion < 100) {
                    toast.error("⚠ Complete your profile first.");
                    navigate("/profile");
                    return;
                  }
                  navigate("/create-exam");
                }}
              >
                + Create Exam
              </button>
            )}

            {isTakingExam ? (
              <div
                className="profile-link"
                style={{ opacity: 0.7, cursor: "default" }}
              >
                <div
                  className="avatar"
                  style={{
                    background: user.profilePic ? "transparent" : "#a575ff",
                  }}
                >
                  {user.profilePic ? (
                    <img
                      src={getProfileImage(user.profilePic)}
                      alt="profile"
                      className="avatar"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span>
                  {user.name.split(" ")[0]} ({user.role})
                </span>
              </div>
            ) : (
              <Link to="/profile" className="profile-link">
                <div
                  className="avatar"
                  style={{
                    background: user.profilePic ? "transparent" : "#a575ff",
                  }}
                >
                  {user.profilePic ? (
                    <img
                      src={getProfileImage(user.profilePic)}
                      alt="profile"
                      className="avatar"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span>
                  {user.name.split(" ")[0]} ({user.role})
                </span>
              </Link>
            )}

            <button
              onClick={onLogout}
              disabled={isTakingExam}
              className="logout-btn"
              style={
                isTakingExam
                  ? { background: "#555", cursor: "not-allowed" }
                  : {}
              }
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-link">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
