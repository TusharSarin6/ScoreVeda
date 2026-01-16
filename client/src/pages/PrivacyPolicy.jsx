import Navbar from "../components/Navbar";

function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Privacy Policy</h1>
          <p style={styles.date}>
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section style={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as your
              name, email address, and profile details when you create an
              account. We also collect exam performance data to generate results
              and analytics.
            </p>
          </section>

          <section style={styles.section}>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve our services.</li>
              <li>Process exam results and generate certificates.</li>
              <li>Send you technical notices and support messages.</li>
              <li>Detect and prevent fraud or cheating during exams.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2>3. Data Security</h2>
            <p>
              We implement industry-standard security measures, including
              encryption and secure servers, to protect your personal data from
              unauthorized access.
            </p>
          </section>

          <section style={styles.section}>
            <h2>4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
              <strong> scorevedaofficial@gmail.com</strong>
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

export default PrivacyPolicy;
