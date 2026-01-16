import Navbar from "../components/Navbar";

function ContactSupport() {
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Contact Support</h1>
          <p style={styles.subtext}>
            Have a question or facing an issue? We're here to help!
          </p>

          <div style={styles.infoBox}>
            <h3>📧 Email Us</h3>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#4c2a85",
                fontWeight: "bold",
              }}
            >
              scorevedaofficial@gmail.com
            </p>
            <p style={{ marginTop: "10px", color: "#666" }}>
              We typically respond within 24 hours.
            </p>
          </div>

          <div style={styles.faqSection}>
            <h2>Common Questions</h2>
            <details style={styles.details}>
              <summary style={styles.summary}>I forgot my password.</summary>
              <p style={styles.answer}>
                Use the "Forgot Password" link on the login page to reset it via
                email OTP.
              </p>
            </details>
            <details style={styles.details}>
              <summary style={styles.summary}>
                My exam terminated unexpectedly.
              </summary>
              <p style={styles.answer}>
                This usually happens if you switch tabs or exit full screen.
                Please contact your teacher/admin.
              </p>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: "100px 20px 40px",
    background: "#f4f6f9",
    minHeight: "100vh",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    textAlign: "center",
  },
  heading: { color: "#4c2a85", marginBottom: "10px" },
  subtext: { color: "#666", marginBottom: "30px" },
  infoBox: {
    background: "#eafaf1",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "30px",
    border: "1px solid #2ecc71",
  },
  faqSection: { textAlign: "left", marginTop: "30px" },
  details: {
    marginBottom: "15px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  summary: { cursor: "pointer", fontWeight: "bold", color: "#333" },
  answer: { marginTop: "10px", color: "#555", fontSize: "0.95rem" },
};

export default ContactSupport;
