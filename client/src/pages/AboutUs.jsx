import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./AboutUs.css";

function AboutUs() {
  return (
    <>
      <Navbar />
      <div className="about-container">
        {/* --- HERO SECTION --- */}
        <section className="about-hero">
          <div className="hero-content">
            <h1>
              Welcome to <span className="highlight">ScoreVeda</span>
            </h1>
            <p className="tagline">"Redefining Online Assessments"</p>
            <p className="hero-desc">
              ScoreVeda is a robust, secure, and user-friendly online
              examination platform designed to simplify the testing process for
              educational institutes and students alike.
            </p>
          </div>
        </section>

        {/* --- WHY CHOOSE US --- */}
        <section className="section-container">
          <h2 className="section-title">Why Choose ScoreVeda?</h2>
          <div className="grid-3">
            <div className="info-card">
              <div className="icon-box">🚀</div>
              <h3>Seamless Experience</h3>
              <p>
                A clean, intuitive interface that lets you focus on the exam,
                not the technology. Works perfectly on all devices.
              </p>
            </div>
            <div className="info-card">
              <div className="icon-box">📊</div>
              <h3>Instant Analytics</h3>
              <p>
                Get results immediately after submission. Visualize performance
                with detailed graphs and insights.
              </p>
            </div>
            <div className="info-card">
              <div className="icon-box">📜</div>
              <h3>Verified Certificates</h3>
              <p>
                Earn a gold-stamped certificate instantly upon passing an exam.
                Downloadable and shareable.
              </p>
            </div>
          </div>
        </section>

        {/* --- SECURITY SECTION (NEW) --- */}
        <section className="section-container alt-bg">
          <h2 className="section-title">🛡️ Iron-Clad Security</h2>
          <p className="section-subtitle">
            We ensure the integrity of every exam with advanced proctoring
            features.
          </p>

          <div className="security-grid">
            <div className="security-item">
              <h3>🚫 Anti-Cheating Protocol</h3>
              <p>
                Our system actively monitors the exam environment. If a student
                tries to <strong>switch tabs</strong> or open another window,
                the system issues a warning. Repeated attempts result in{" "}
                <strong>immediate exam termination</strong>.
              </p>
            </div>
            <div className="security-item">
              <h3>🖥️ Full-Screen Enforcement</h3>
              <p>
                Exams are conducted in strict full-screen mode. Exiting full
                screen is recorded as a violation, ensuring students stay
                focused on the test.
              </p>
            </div>
            <div className="security-item">
              <h3>🔒 Secure Authentication</h3>
              <p>
                With Role-Based Access Control (RBAC) and encrypted data
                transmission, student data and exam questions remain safe from
                unauthorized access.
              </p>
            </div>
          </div>
        </section>

        {/* --- ROLES SECTION --- */}
        <section className="section-container">
          <h2 className="section-title">Tailored for Everyone</h2>
          <div className="roles-wrapper">
            <div className="role-box admin-role">
              <h3>👨‍🏫 For Educators</h3>
              <ul>
                <li>Create comprehensive exams (MCQ & Theory).</li>
                <li>Manage access via unique exam codes.</li>
                <li>Automated grading for objective questions.</li>
                <li>Review and provide feedback on theory answers.</li>
              </ul>
            </div>
            <div className="role-box student-role">
              <h3>👨‍🎓 For Students</h3>
              <ul>
                <li>Join exams instantly with a code.</li>
                <li>Track progress with a dedicated dashboard.</li>
                <li>View detailed answer keys after results are declared.</li>
                <li>Build a portfolio of achievements.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- PROFESSIONAL FOOTER --- */}
        <footer className="about-footer">
          <div className="footer-content">
            <h3>ScoreVeda</h3>
            <p>Empowering Knowledge, One Exam at a Time.</p>
            <p className="copyright">
              &copy; {new Date().getFullYear()} ScoreVeda Inc. All rights
              reserved.
            </p>
            <div className="footer-links">
              <Link
                to="/privacy"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Contact Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default AboutUs;
