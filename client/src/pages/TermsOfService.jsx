import Navbar from "../components/Navbar";

function TermsOfService() {
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Terms of Service</h1>
          <p style={styles.date}>
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section style={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using ScoreVeda, you agree to be bound by these
              Terms of Service. If you do not agree, you may not use our
              services.
            </p>
          </section>

          <section style={styles.section}>
            <h2>2. User Conduct</h2>
            <p>
              You agree not to engage in any of the following prohibited
              activities:
            </p>
            <ul>
              <li>
                Cheating or attempting to bypass security measures during exams.
              </li>
              <li>Sharing your account credentials with others.</li>
              <li>Using the platform for any illegal purpose.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2>3. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our
              sole discretion, without notice, for conduct that we believe
              violates these Terms or is harmful to other users.
            </p>
          </section>

          <section style={styles.section}>
            <h2>4. Limitation of Liability</h2>
            <p>
              ScoreVeda shall not be liable for any indirect, incidental,
              special, or consequential damages resulting from the use or
              inability to use the service.
            </p>
          </section>
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
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },
  heading: {
    color: "#4c2a85",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
    marginBottom: "20px",
  },
  date: { color: "#777", fontStyle: "italic", marginBottom: "30px" },
  section: { marginBottom: "30px", lineHeight: "1.6", color: "#333" },
};

export default TermsOfService;
