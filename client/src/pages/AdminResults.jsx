import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ CHANGED: Import the new helper
import Navbar from "../components/Navbar";
import "./AdminResults.css";

function AdminResults() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get Exam ID
  const [results, setResults] = useState([]);

  const [examTitle, setExamTitle] = useState("");
  const [examCode, setExamCode] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // ✅ CHANGED: Use api helper (Token is auto-injected)
        // Fetch the Results List
        const { data } = await api.get(`/api/exams/${id}/results`);
        setResults(data);

        // Fetch Exam details just to get the Title
        const examRes = await api.get(`/api/exams/${id}`);
        setExamTitle(examRes.data.title);
        setExamCode(examRes.data.accessCode);
      } catch (error) {
        console.log(error);
      }
    };
    fetchResults();
  }, [id, user?.token]);

  return (
    <>
      <Navbar />
      <div className="results-container">
        <div className="table-card">
          {/* ✅ UPDATED HEADER: Flexbox for Title (Left) and Paper Code (Right) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "5px", // Adjust spacing to subtitle
            }}
          >
            <h1 className="table-title" style={{ margin: 0 }}>
              Gradebook: {examTitle}
            </h1>
            <div
              style={{
                background: "#f0f2f5",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.9rem",
                color: "#555",
                fontWeight: "600",
                border: "1px solid #e1e4e8",
              }}
            >
              Paper Code:{" "}
              <span
                style={{
                  color: "#333",
                  fontFamily: "monospace",
                  fontSize: "1rem",
                }}
              >
                {examCode}
              </span>
            </div>
          </div>

          <p className="table-subtitle" style={{ marginTop: "5px" }}>
            {results.length} students have attempted this exam
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? (
                  results.map((result, index) => (
                    <tr key={result._id}>
                      <td>#{index + 1}</td>

                      <td style={{ fontWeight: "bold" }}>
                        {result.user?.name || "Unknown"}
                      </td>

                      {/* Gender Column */}
                      <td>{result.user?.gender || "-"}</td>

                      <td>{result.user?.email || "-"}</td>

                      {/* Phone Column */}
                      <td>
                        {result.user?.phone ? `+91 ${result.user.phone}` : "-"}
                      </td>

                      {/* SCORE */}
                      <td className="score-cell">
                        {result.score} / {result.totalMarks}
                      </td>

                      {/* STATUS */}
                      <td>
                        {result.status === "pending" ? (
                          <span
                            className="status-badge"
                            style={{ background: "#fff3cd", color: "#856404" }}
                          >
                            Needs Grading ⚠️
                          </span>
                        ) : (
                          <span
                            className={`status-badge ${
                              result.isPassed ? "pass" : "fail"
                            }`}
                          >
                            {result.isPassed ? "Passed" : "Failed"}
                          </span>
                        )}
                      </td>

                      <td>{new Date(result.createdAt).toLocaleDateString()}</td>

                      {/* ACTION BUTTON */}
                      <td>
                        <button
                          className="check-btn"
                          onClick={() => navigate(`/review/${result._id}`)}
                        >
                          Check Answers
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9" // Increased colSpan to account for new columns
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No results found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminResults;
