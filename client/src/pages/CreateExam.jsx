import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; 
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";
import "./CreateExam.css";

function CreateExam() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // --- PROFILE COMPLETION CHECK (ADMIN ONLY) ---
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const profileCompletion =
      (user.isEmailVerified ? 25 : 0) +
      (user.gender ? 25 : 0) +
      (user.birthday ? 25 : 0) +
      (user.phone ? 25 : 0);

    if (profileCompletion < 100) {
      toast.warning("⚠ Complete your profile before creating exams.", {
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    }
  }, [user, navigate]);

  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(0);
  const [passingMarks, setPassingMarks] = useState(30);
  const [type, setType] = useState("mcq");

  // ---  INSTRUCTION PAGE SETTINGS ---
  const [instituteName, setInstituteName] = useState("ScoreVeda Institute");
  const [examRules, setExamRules] = useState([
    "Do not switch browser tabs. (Warning will be issued).",
    "Do not refresh the page during the exam.",
    "Ensure you have a stable internet connection.",
    "Do not go BACK while on exam page(cannot re-enter).",
  ]);

  // ---  Certificate State ---
  const [hasCertificate, setHasCertificate] = useState(false); // Checkbox state

  const [certSettings, setCertSettings] = useState({
    instituteName: "ScoreVeda Institute",
    certificateTitle: "CERTIFICATE OF ACHIEVEMENT",
    subtitle: "This is to certify that",
    signatureName: "Authorized Signature",
    themeColor: "#D4AF37",
    instituteLogo: "",
  });

  // Questions State
  const [questions, setQuestions] = useState([
    {
      type: "mcq",
      questionText: "",
      options: ["", "", "", ""],
      correctOption: 0,
      marks: 5,
    },
  ]);

  //----- AUTO-CALCULATE TOTAL MARKS ------
  useEffect(() => {
    const calculatedTotal = questions.reduce((sum, question) => {
      return sum + (Number(question.marks) || 0);
    }, 0);
    setTotalMarks(calculatedTotal);
  }, [questions]);

  // --- EXCEL FILE UPLOAD HANDLER ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        // TRANSFORM EXCEL DATA TO YOUR QUESTION FORMAT
        const newQuestions = parsedData.map((row) => {
          // Excel columns: Type, Question, OptionA, OptionB, OptionC, OptionD, CorrectAns(1-4), Marks
          const qType = row.Type || row.type || "mcq";
          const isMcq = qType.toLowerCase() === "mcq";

          return {
            type: isMcq ? "mcq" : "theory",
            questionText: row.Question || row.question || "Untitled Question",
            options: isMcq
              ? [
                  row["Option A"] || row["Option a"] || "",
                  row["Option B"] || row["Option b"] || "",
                  row["Option C"] || row["Option c"] || "",
                  row["Option D"] || row["Option d"] || "",
                ]
              : [],
            // Convert "1" to index 0, "2" to index 1, etc.
            correctOption: row["Correct Answer"]
              ? parseInt(row["Correct Answer"]) - 1
              : 0,
            marks: parseInt(row.Marks) || parseInt(row.marks) || 5,
          };
        });

        if (newQuestions.length === 0) {
          return toast.error("File is empty or format is incorrect.");
        }

        setQuestions((prev) => [...prev, ...newQuestions]);
        toast.success(`Loaded ${newQuestions.length} questions from Excel! 🚀`);
        e.target.value = null; //Reset input
      } catch (error) {
        console.error(error);
        toast.error("Error reading Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- DOWNLOAD CSV TEMPLATE ---
  const downloadSampleTemplate = () => {
    // We create a real Excel file using the library
    const headers = [
      {
        Type: "mcq",
        Question: "What is the capital of France?",
        "Option A": "Berlin",
        "Option B": "Madrid",
        "Option C": "Paris",
        "Option D": "Rome",
        "Correct Answer": 3,
        Marks: 5,
      },
      {
        Type: "mcq",
        Question: "Which planet is the Red Planet?",
        "Option A": "Earth",
        "Option B": "Mars",
        "Option C": "Jupiter",
        "Option D": "Venus",
        "Correct Answer": 2,
        Marks: 5,
      },
      {
        Type: "theory",
        Question: "Explain React Hooks.",
        "Option A": "",
        "Option B": "",
        "Option C": "",
        "Option D": "",
        "Correct Answer": "",
        Marks: 10,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Exam_Questions_Template.xlsx");
  };

  // ---  LOGO UPLOAD HANDLER ---
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (e.g. 2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("File is too large. Max 2MB allowed.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCertSettings({ ...certSettings, instituteLogo: reader.result });
    };
    reader.readAsDataURL(file);
  };
  // --------------------------------

  // --- HANDLERS ---
  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctOption = parseInt(value);
    setQuestions(newQuestions);
  };

  const handleTypeChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].type = value;
    setQuestions(newQuestions);
  };

  const handleCertChange = (e) => {
    setCertSettings({ ...certSettings, [e.target.name]: e.target.value });
  };

  // --- RULES HANDLERS ---
  const handleRuleChange = (index, value) => {
    const newRules = [...examRules];
    newRules[index] = value;
    setExamRules(newRules);
  };

  const addRule = () => {
    setExamRules([...examRules, ""]);
  };

  const removeRule = (index) => {
    const newRules = examRules.filter((_, i) => i !== index);
    setExamRules(newRules);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
        marks: 5,
      },
    ]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // --- SUBMIT HANDLER  ---
  const handleSubmit = async (e, status) => {
    e.preventDefault();

    console.log("Submitting as:", status);

    // 1. Basic Validation (Empty Fields)
    if (status === "published") {
      if (!title || !accessCode || !description) {
        return toast.error("Please fill all required fields to Publish.");
      }
    } else {
      if (!title) return toast.error("Draft needs at least a Title.");
    }

    // 2. --- NUMERIC VALIDATION (Prevent Negative/Invalid Logic) ---
    if (duration <= 0)
      return toast.error("Duration must be greater than 0 minutes.");
    if (totalMarks <= 0)
      return toast.error("Total Marks must be greater than 0.");
    if (passingMarks < 0)
      return toast.error("Passing marks cannot be negative.");

    if (parseInt(passingMarks) > parseInt(totalMarks)) {
      return toast.error("Passing Marks cannot be higher than Total Marks!");
    }

    // ---  QUESTION VALIDATION (Fixes "Path required" error) ---
    for (let i = 0; i < questions.length; i++) {
      if (
        !questions[i].questionText ||
        questions[i].questionText.trim() === ""
      ) {
        return toast.error(
          `Question ${i + 1} is empty! Please fill it or remove it.`
        );
      }
      if (questions[i].type === "mcq") {
        // Optional: Check if options are filled for MCQs
        if (questions[i].options.some((opt) => !opt.trim())) {
          return toast.error(`Please fill all options for Question ${i + 1}`);
        }
      }
    }

    // Filter out empty rules
    const filteredRules = examRules.filter((rule) => rule.trim() !== "");

    const examData = {
      title,
      description,
      type,
      duration,
      totalMarks,
      passingMarks,
      questions,
      accessCode,
      isPublished: status === "published",
      hasCertificate, // <--- Send the toggle
      certificateSettings: hasCertificate ? certSettings : null, // Only send settings if enabled
      instituteName, // <--- NEW FIELD
      examRules: filteredRules, // <--- NEW FIELD
    };

    try {
      //  Use api helper (Token is auto-injected)
      await api.post("/api/exams", examData);

      if (status === "published") {
        toast.success("Exam Published Live! 🚀");
      } else {
        toast.info("Exam Saved to Drafts 📝");
      }

      setTimeout(() => navigate("/profile"), 2000);
    } catch (error) {
      console.log(error);
      const errorMsg = error.response?.data?.message || "Error creating exam";

      // Better Error Handling for Payload too large (Image issue)
      if (error.response?.status === 413) {
        toast.error("Image too large! Please use a smaller logo.");
      } else {
        toast.error(errorMsg);
      }
    }
  };

  // Prevent rendering if admin profile is incomplete
  if (user?.role === "admin") {
    const profileCompletion =
      (user.isEmailVerified ? 25 : 0) +
      (user.gender ? 25 : 0) +
      (user.birthday ? 25 : 0) +
      (user.phone ? 25 : 0);

    if (profileCompletion < 100) {
      return null;
    }
  }

  return (
    <>
      <Navbar />
      <div className="create-container">
        <ToastContainer theme="dark" />
        <div className="form-wrapper">
          <h1 className="page-title">Create New Exam</h1>

          <form>
            {/* Section 1: Exam Info */}
            <div className="section-card">
              <h2>1. Exam Details</h2>
              <div className="grid-2">
                <div className="input-group">
                  <label>Exam Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Java Finals"
                  />
                </div>

                <div className="input-group">
                  <label>Exam Access Code (Unique)</label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) =>
                      //  Replace spaces with empty string
                      setAccessCode(
                        e.target.value.toUpperCase().replace(/\s/g, "")
                      )
                    }
                    required
                    placeholder="e.g. MATH101"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontWeight: "bold",
                      color: "#4c2a85",
                    }}
                  />
                  <small style={{ color: "#666", marginTop: "5px" }}>
                    Students must type this EXACT code to join (No Spaces).
                  </small>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows="3"
                ></textarea>
              </div>

              {/* ---  INSTITUTE NAME --- */}
              <div className="input-group">
                <label>Institute / University Name</label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. ScoreVeda University"
                />
              </div>

              <div className="grid-3">
                <div className="input-group">
                  <label>Duration (mins)</label>
                  <input
                    type="number"
                    min="1" // HTML Constraint
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    readOnly
                    style={{
                      backgroundColor: "#e9ecef",
                      cursor: "not-allowed",
                      color: "#555",
                      fontWeight: "bold",
                    }}
                    title="Total marks are calculated automatically based on questions."
                  />
                </div>
                <div className="input-group">
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    min="0"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ---  EXAM RULES --- */}
            <div className="section-card">
              <h2>2. Instructions & Rules</h2>
              <p
                style={{
                  color: "#666",
                  fontSize: "0.9rem",
                  marginBottom: "15px",
                }}
              >
                Add rules that students must agree to before starting the exam.
              </p>

              {examRules.map((rule, index) => (
                <div
                  key={index}
                  style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
                >
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    placeholder={`Rule ${index + 1}`}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    style={{
                      background: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "0 15px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    X
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addRule}
                style={{
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginTop: "10px",
                }}
              >
                + Add Rule
              </button>
            </div>

            {/* Section 3: Questions */}
            <div className="section-card">
              <div className="flex-between">
                <h2>3. Questions ({questions.length})</h2>
                {/* --- IMPORT BUTTONS AREA (Top Right) --- */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv" // Accept Excel formats
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    title="Download Excel Template"
                    style={{
                      background: "transparent",
                      border: "1px solid #2ecc71",
                      color: "#2ecc71",
                      padding: "8px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    📄 Download Template
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      background: "#27ae60",
                      border: "none",
                      color: "white",
                      padding: "8px 15px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    📊 Upload Excel
                  </button>
                </div>
              </div>

              {/* LIST OF QUESTIONS */}
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="question-card">
                  <div className="flex-between">
                    <h3>Question {qIndex + 1}</h3>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={q.type}
                        onChange={(e) =>
                          handleTypeChange(qIndex, e.target.value)
                        }
                        style={{ padding: "5px", borderRadius: "5px" }}
                      >
                        <option value="mcq">MCQ</option>
                        <option value="theory">Theory</option>
                      </select>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="remove-btn"
                        >
                          X
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    className="q-input"
                    placeholder="Type question here..."
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, e.target.value)
                    }
                    required
                  />

                  {q.type === "mcq" ? (
                    <div className="options-grid">
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="option-row">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctOption === oIndex}
                            onChange={() =>
                              handleCorrectOptionChange(qIndex, oIndex)
                            }
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(qIndex, oIndex, e.target.value)
                            }
                            required
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "15px",
                        background: "#eee",
                        borderRadius: "5px",
                        color: "#666",
                        fontStyle: "italic",
                      }}
                    >
                      Students will see a text area to write their answer here.
                    </div>
                  )}

                  <div style={{ marginTop: "15px" }}>
                    <label
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        marginRight: "10px",
                      }}
                    >
                      Marks:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={q.marks}
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[qIndex].marks = Number(e.target.value);
                        setQuestions(newQ);
                      }}
                      style={{ width: "60px", padding: "5px" }}
                    />
                  </div>
                </div>
              ))}

              {/* ---  ADD BUTTON AT BOTTOM --- */}
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={addQuestion}
                  className="add-btn"
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "#4c2a85", // Matching theme color
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#3b2166")}
                  onMouseOut={(e) => (e.target.style.background = "#4c2a85")}
                >
                  + Add New Question
                </button>
              </div>
            </div>

            {/* Section 4: Certificate Customization */}
            <div className="section-card">
              <div className="flex-between" style={{ marginBottom: "15px" }}>
                <h2>4. Certificate Customization</h2>
                {/* TOGGLE SWITCH */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasCertificate}
                    onChange={(e) => setHasCertificate(e.target.checked)}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span
                    style={{
                      fontWeight: "bold",
                      color: hasCertificate ? "#2ecc71" : "#666",
                    }}
                  >
                    {hasCertificate ? "Enabled" : "Disabled (No Certificate)"}
                  </span>
                </label>
              </div>

              {/* CONDITIONAL RENDER: Only show settings if checkbox is checked */}
              {hasCertificate && (
                <div className="grid-2" style={{ animation: "fadeIn 0.5s" }}>
                  <div className="input-group">
                    <label>Institute Name</label>
                    <input
                      type="text"
                      name="instituteName"
                      value={certSettings.instituteName}
                      onChange={handleCertChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Certificate Title</label>
                    <input
                      type="text"
                      name="certificateTitle"
                      value={certSettings.certificateTitle}
                      onChange={handleCertChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Signature Name</label>
                    <input
                      type="text"
                      name="signatureName"
                      value={certSettings.signatureName}
                      onChange={handleCertChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Theme Color (Hex Code)</label>
                    <input
                      type="color"
                      name="themeColor"
                      value={certSettings.themeColor}
                      onChange={handleCertChange}
                      style={{ width: "100%", height: "40px" }}
                    />
                  </div>

                  {/* ---  LOGO UPLOAD --- */}
                  <div className="input-group">
                    <label>Institute Logo</label>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      {certSettings.instituteLogo && (
                        <img
                          src={certSettings.instituteLogo}
                          alt="Logo Preview"
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "contain",
                            border: "1px solid #ddd",
                          }}
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ border: "1px solid #ddd", padding: "5px" }}
                      />
                    </div>
                    <small style={{ color: "#666" }}>
                      Upload an image (Max 2MB)
                    </small>
                  </div>
                  {/* --------------------------- */}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "20px",
                marginBottom: "50px",
              }}
            >
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                style={{
                  flex: 1,
                  padding: "15px",
                  background: "#95a5a6",
                  color: "white",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, "published")}
                className="submit-exam-btn"
                style={{ flex: 2 }}
              >
                🚀 Publish Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateExam;
