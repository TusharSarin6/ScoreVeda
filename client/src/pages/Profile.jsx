import { useEffect, useState, useRef } from "react";
import api from "../utils/api"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import { useNavigate, useLocation } from "react-router-dom";
import { signatureFontBase64 } from "../utils/signatureFont";
import "./Profile.css";

function Profile() {
  const [results, setResults] = useState([]);
  const [adminExams, setAdminExams] = useState([]);
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  // --- DELETE ACCOUNT OTP STATE ---
  const [showDeleteOtpModal, setShowDeleteOtpModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteOtpTimer, setDeleteOtpTimer] = useState(0);

  // --- TABS STATE ('personal' | 'security' | 'exams') ---
  const [activeTab, setActiveTab] = useState("personal");

  // --- EDIT MODE STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userData.name || "",
    gender: userData.gender || "",
    birthday: userData.birthday ? userData.birthday.split("T")[0] : "",
    phone: userData.phone || "",
    email: userData.email || "",
  });

  // --- PROFILE COMPLETION CALCULATION ---
  const calculateProfileCompletion = () => {
    let completed = 0;
    if (userData.isEmailVerified) completed += 25;
    if (userData.gender) completed += 25;
    if (userData.birthday) completed += 25;
    if (userData.phone) completed += 25;
    return completed;
  };
  const profileCompletion = calculateProfileCompletion();

  // --- OTP MODAL STATE (Email Only) ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // ---  RESEND OTP TIMER STATE ---
  const [resendTimer, setResendTimer] = useState(0);

  // --- PHOTO MODAL STATE ---
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [isFullScreenImg, setIsFullScreenImg] = useState(false);

  // --- PASSWORD CHANGE MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- PASSWORD VISIBILITY TOGGLES ---
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // ---  EMAIL CHANGE MODAL STATE ---
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });

  // --- EMAIL CHANGE OTP STATE ---
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // --- HANDLE TAB REDIRECTION FROM DASHBOARD / TAKE EXAM ---
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(
        location.state.activeTab === "contact"
          ? "personal"
          : location.state.activeTab
      );
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- DELETE OTP TIMER ---
  useEffect(() => {
    if (deleteOtpTimer === 0) return;
    const interval = setInterval(() => {
      setDeleteOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [deleteOtpTimer]);

  // --- STUDENT: FETCH EXAM HISTORY ---
  useEffect(() => {
    if (userData.role !== "student") return;
    const fetchMyHistory = async () => {
      try {
        // ✅ CHANGED: Used api helper (no need for manual headers)
        const { data } = await api.get("/api/exams/my-results");
        setResults(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchMyHistory();
  }, [userData.role]);

  // --- ADMIN: FETCH PUBLISHED EXAMS ---
  useEffect(() => {
    if (userData.role !== "admin") return;

    const fetchPublishedExams = async () => {
      try {
        // ✅ CHANGED: Used api helper
        const { data } = await api.get("/api/exams");
        setAdminExams(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPublishedExams();
  }, [userData]);

  // ---  RESEND OTP COUNTDOWN EFFECT ---
  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // --- EMAIL CHANGE OTP TIMER ---
  useEffect(() => {
    if (emailOtpTimer === 0) return;
    const interval = setInterval(() => {
      setEmailOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  // ---  Update User Globally ---
  const updateUserState = (newUser) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUserData(newUser);
    window.dispatchEvent(new Event("userUpdated"));
  };

  // --- HELPER TO CLOSE PASSWORD MODAL & CLEAR DATA ---
  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // ---  HELPER TO CLOSE EMAIL MODAL & CLEAR DATA ---
  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailForm({ newEmail: "", password: "" });
    setShowEmailPassword(false);
  };

  // --- HANDLE PROFILE UPDATE ---
  const handleUpdateProfile = async () => {
    // 1. AGE VALIDATION CHECK
    if (editForm.birthday) {
      const today = new Date();
      const birthDate = new Date(editForm.birthday);

      // Calculate Age
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Check if future date
      if (birthDate > today) {
        toast.error("Date of Birth cannot be in the future!");
        return;
      }

      // Check minimum age (e.g., 5 years)
      if (age < 5) {
        toast.error("You must be at least 5 years old to register.");
        return;
      }
    }
    try {
      // ✅ CHANGED: Used api helper & Removed explicit token header
      const { data } = await api.put("/api/users/profile-info", editForm);

      const newUser = { ...userData, ...data };
      updateUserState(newUser);

      setIsEditing(false);
      toast.success("Profile Updated! ✅");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  // --- SEND OTP (Email Only) ---
  const handleSendOtp = async (type) => {
    if (type !== "email") return;

    try {
      // ✅ CHANGED
      const { data } = await api.post("/api/users/send-otp", { type });
      toast.info(data.message);
      setOtpType(type);
      setShowOtpModal(true);
      setResendTimer(30); // ⏳ start cooldown
    } catch (error) {
      toast.error("Failed to send OTP");
    }
  };

  // --- RESEND OTP HANDLER ---
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    handleSendOtp("email");
  };

  // --- VERIFY OTP (Email Only) ---
  const handleVerifyOtp = async () => {
    try {
      // ✅ CHANGED
      const { data } = await api.post("/api/users/verify-otp", {
        type: otpType,
        otp: otpInput,
      });

      // ---  Update the correct field name 'isEmailVerified' ---
      const newUser = { ...userData };
      if (otpType === "email") {
        newUser.isEmailVerified = true;
      }

      updateUserState(newUser); // Save to LocalStorage
      toast.success(data.message);
      setShowOtpModal(false);
      setOtpInput("");
      setResendTimer(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    }
  };

  // --- HANDLE CHANGE PASSWORD ---
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      // ✅ CHANGED
      const { data } = await api.post("/api/users/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success(data.message);
      handleClosePasswordModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    }
  };

  // --- NEW: HANDLE CHANGE EMAIL ---
  const handleChangeEmail = async () => {
    const { newEmail, password } = emailForm;

    if (!newEmail || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // ✅ CHANGED
      // STEP 1: SEND OTP TO NEW EMAIL
      const { data } = await api.post("/api/users/change-email", {
        newEmail,
        password,
      });

      toast.info(data.message);
      setShowEmailOtpInput(true);
      setEmailOtpTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyNewEmailOtp = async () => {
    if (!emailOtp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      // ✅ CHANGED
      const { data } = await api.post("/api/users/change-email/verify-otp", {
        otp: emailOtp,
      });

      const newUser = {
        ...userData,
        email: data.email,
        isEmailVerified: true,
      };

      updateUserState(newUser);
      setEditForm({ ...editForm, email: data.email });

      toast.success("Email updated successfully!");
      handleCloseEmailModal();

      // reset otp state
      setEmailOtp("");
      setShowEmailOtpInput(false);
      setEmailOtpTimer(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
  };

  // --- PROFILE PICTURE UPLOAD ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      // ✅ CHANGED: Note we need to manually set content-type for files, but auth header is auto-handled
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const res = await api.post("/api/users/upload-photo", formData, config);

      const updatedUser = { ...userData, profilePic: res.data.profilePic };
      updateUserState(updatedUser);

      toast.success("Profile picture updated! 📸");
      setIsPicModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  // --- DELETE PHOTO ---
  const handleDeletePhoto = async () => {
    if (!window.confirm("Remove profile photo?")) return;
    try {
      // ✅ CHANGED
      await api.delete("/api/users/delete-photo");

      const updatedUser = { ...userData, profilePic: "" };
      updateUserState(updatedUser);
      toast.info("Photo Removed");
      setIsPicModalOpen(false);
    } catch (e) {
      toast.error("Failed to delete photo");
    }
  };

  // --- DOWNLOAD PHOTO ---
  const handleDownloadPhoto = async () => {
    if (!userData.profilePic) return;
    try {
      // ✅ Note: For downloading files via `fetch`, we still use the full URL logic if needed,
      // but usually the profilePic string is a relative path.
      // We can use api.defaults.baseURL to construct it properly.
      const baseURL = api.defaults.baseURL;
      const response = await fetch(`${baseURL}${userData.profilePic}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Profile_${userData.name}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Download failed");
    }
  };

  // --- ADMIN: DELETE EXAM ---
  const handleDeleteExam = async (examId) => {
    const confirmDelete = window.confirm(
      "⚠ Are you sure?\n\nThis will permanently delete the exam and all its results."
    );

    if (!confirmDelete) return;

    try {
      // ✅ CHANGED
      await api.delete(`/api/exams/${examId}`);

      toast.success("Exam deleted successfully");

      // Refresh UI immediately
      setAdminExams((prev) => prev.filter((exam) => exam._id !== examId));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete exam");
    }
  };

  // --- TOGGLE EXAM PUBLISH STATUS ---
  const handleTogglePublish = async (exam) => {
    try {
      const { data } = await api.put(`/api/exams/${exam._id}/publish`, {});

      toast.success(
        data.message ||
          (exam.isPublished ? "Exam Unpublished" : "Exam Published Live")
      );

      // ✅ IMMEDIATE STATE UPDATE (Fixes the UI issue)
      setAdminExams((prevExams) =>
        prevExams.map((e) =>
          e._id === exam._id ? { ...e, isPublished: !e.isPublished } : e
        )
      );
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // --- View Report Function ---
  const handleViewReport = (resultItem) => {
    navigate("/result", { state: { result: resultItem } });
  };

  const loadImageAsBase64 = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  // --- CERTIFICATE GENERATOR ---
  const handleDownloadCert = async (result) => {
    if (!result.isPassed) {
      toast.error(
        "🔒 Certificate Locked: You must pass the exam to download this."
      );
      return;
    }

    if (result.status === "pending") {
      toast.info("⏳ Please wait for evaluation.");
      return;
    }

    const settings = result.exam?.certificateSettings || {};
    const institute = settings.instituteName || "ScoreVeda Institute";
    const title = settings.certificateTitle || "CERTIFICATE OF ACHIEVEMENT";
    const sigName = settings.signatureName || "Authorized Signature"; // Used as Teacher Name
    const themeColor = settings.themeColor || "#D4AF37";
    const logoPath = settings.instituteLogo;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [900, 650],
    });

    // Register handwritten font (Assuming signatureFontBase64 is available in scope)
    doc.addFileToVFS("Signature.ttf", signatureFontBase64);
    doc.addFont("Signature.ttf", "Signature", "normal");

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 900, 650, "F");

    // Soft background watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(120);
    doc.setFont("times", "bold");
    doc.text("ScoreVeda", 450, 380, {
      align: "center",
      angle: 25,
    });

    // --- GOLD FOIL EFFECT BORDER ---

    // Outer dark gold border
    doc.setDrawColor(173, 138, 86); // Dark gold
    doc.setLineWidth(6);
    doc.rect(20, 20, 860, 610);

    // Middle metallic gold border
    doc.setDrawColor(212, 175, 55); // Classic gold
    doc.setLineWidth(3);
    doc.rect(30, 30, 840, 590);

    // Inner light gold shine
    doc.setDrawColor(240, 217, 138); // Light gold shine
    doc.setLineWidth(1.5);
    doc.rect(38, 38, 824, 574);

    // --- CORNER ACCENTS ---
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);

    // Top-left
    doc.line(20, 80, 80, 20);
    doc.line(20, 20, 80, 20);

    // Top-right
    doc.line(820, 20, 880, 20);
    doc.line(880, 20, 880, 80);

    // Bottom-left
    doc.line(20, 560, 20, 620);
    doc.line(20, 620, 80, 620);

    // Bottom-right
    doc.line(880, 560, 880, 620);
    doc.line(820, 620, 880, 620);

    // Institute Logo (Top Left)
    if (logoPath) {
      const isPng = logoPath.startsWith("data:image/png");
      const format = isPng ? "PNG" : "JPEG";

      const cleanBase64 = logoPath.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
      );

      doc.addImage(cleanBase64, format, 405, 40, 130, 90);
    }

    // Institute Name (Static Title, keep Bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(60);
    doc.text(institute, 450, 160, { align: "center" });

    // Certificate Title
    doc.setFontSize(38);
    doc.setTextColor(themeColor);
    doc.text(title, 450, 210, { align: "center" });

    // --- NEW BODY TEXT LAYOUT (With Bold Variables) ---

    // 1. "This is to certify that"
    doc.setFontSize(18);
    doc.setFont("times", "italic");
    doc.setTextColor(80);
    doc.text("This is to certify that", 450, 250, { align: "center" });

    // 2. Candidate Name (Already Bold)
    doc.setFont("times", "bolditalic");
    doc.setFontSize(42);
    doc.setTextColor(0);
    doc.text(userData.name, 450, 290, { align: "center" });

    // Underline Name
    doc.setLineWidth(1);
    doc.setDrawColor(100);
    doc.line(250, 300, 650, 300);

    // 3. Body Text Construction
    const examDate = new Date(result.createdAt).toLocaleDateString();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(60);

    // Line A: "has successfully completed and passed the"
    doc.text("has successfully completed and passed the", 450, 330, {
      align: "center",
    });

    // Line B: [Exam Name] - BOLD
    doc.setFont("helvetica", "bold");
    doc.text(result.exam.title, 450, 350, { align: "center" });

    // Line C: "conducted by"
    doc.setFont("helvetica", "normal");
    doc.text("conducted by", 450, 370, { align: "center" });

    // Line D: [Institute Name] on [Date] - BOLD
    const lineDText = `${institute} on ${examDate}`;
    doc.setFont("helvetica", "bold");
    doc.text(lineDText, 450, 390, { align: "center" });

    // Line E: Dedication message
    doc.setFont("helvetica", "normal");
    const dedicationText = `This certificate is awarded in recognition of their dedication and the knowledge demonstrated throughout the examination.`;
    const splitDedication = doc.splitTextToSize(dedicationText, 700);
    doc.text(splitDedication, 450, 420, { align: "center" });

    // 4. Score Display
    // "Score:" Normal, Value Bold
    const scoreLabel = "Score: ";
    const scoreValue = `${result.score} / ${result.totalMarks}`;

    doc.setFontSize(18);
    doc.setTextColor(themeColor);

    // Calculate total width to center the combined string
    doc.setFont("helvetica", "bold"); // measure bold width
    const valWidth = doc.getTextWidth(scoreValue);
    doc.setFont("helvetica", "normal"); // measure normal width
    const lblWidth = doc.getTextWidth(scoreLabel);

    const totalScoreWidth = lblWidth + valWidth;
    const scoreStartX = 450 - totalScoreWidth / 2; // Center X

    // Draw Label (Normal)
    doc.text(scoreLabel, scoreStartX, 460);
    // Draw Value (Bold)
    doc.setFont("helvetica", "bold");
    doc.text(scoreValue, scoreStartX + lblWidth, 460);

    // --- BOTTOM SECTION ---

    const issueDate = new Date().toLocaleDateString();
    const certId = `SV-${result._id.slice(-6).toUpperCase()}`;

    // 1. Bottom Left: Certificate Issue Date & ID
    doc.setFontSize(12);
    doc.setTextColor(80);

    // Issue Date (No Gap Logic)
    const dateLabel = "Certificate Issue Date: ";
    doc.setFont("helvetica", "normal");
    doc.text(dateLabel, 60, 570);

    const dateLabelWidth = doc.getTextWidth(dateLabel); // Measure exact width
    doc.setFont("helvetica", "bold"); // Switch to bold
    doc.text(issueDate, 60 + dateLabelWidth, 570); // Place value immediately after

    // Certificate ID (No Gap Logic)
    const idLabel = "Certificate ID: ";
    doc.setFont("helvetica", "normal");
    doc.text(idLabel, 60, 585);

    const idLabelWidth = doc.getTextWidth(idLabel); // Measure exact width
    doc.setFont("helvetica", "bold"); // Switch to bold
    doc.text(certId, 60 + idLabelWidth, 585); // Place value immediately after

    // 2. Bottom Right: Teacher Name & Authorized Signatory
    const sigCenterX = 750;
    const lineY = 560;

    // [Teacher Name] (Signature Style - inherently bold/distinct)
    doc.setFont("Signature", "normal");
    doc.setFontSize(28);
    doc.setTextColor(40);
    doc.text(sigName, sigCenterX, lineY - 10, { align: "center" });

    // Line
    doc.setLineWidth(1);
    doc.setDrawColor(100);
    doc.line(650, lineY, 850, lineY);

    // "Authorized Signatory" (Static - Normal)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Authorized Signatory", sigCenterX, lineY + 15, {
      align: "center",
    });

    // --- PROFESSIONAL SCOREVEDA STAMP (Bottom Left) ---
    try {
      const stampBase64 = await loadImageAsBase64("/scoreveda-certified.png");

      const cleanStamp = stampBase64.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        ""
      );
      doc.addImage(cleanStamp, "PNG", 60, 460, 150, 100);
    } catch (err) {
      console.warn("Stamp image failed to load:", err);
    }

    doc.save(`${userData.name}_Certificate.pdf`);
    toast.success("🎓 Certificate Downloaded!");
  };

  // --- INITIATE DELETE (Send OTP) ---
  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;

    try {
      // ✅ CHANGED
      // 1. Send OTP specifically for deletion
      const { data } = await api.post("/api/users/send-delete-otp", {});

      toast.info(data.message);
      setShowDeleteOtpModal(true); // Open the Modal
      setDeleteOtpTimer(30); // Start cooldown
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to initiate delete process"
      );
    }
  };

  // --- CONFIRM DELETE (Verify OTP) ---
  const handleConfirmDelete = async () => {
    if (!deleteOtp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      
      // 2. Verify OTP and Delete
      await api.delete("/api/users/profile", {
        data: { otp: deleteOtp }, // Send OTP in body
      });

      toast.success("Account Deleted. Goodbye!");
      localStorage.removeItem("user");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Invalid OTP or Delete Failed"
      );
    }
  };

  // --- RENDER HELPERS ---
  const renderRow = (label, value, fieldKey, type = "text") => (
    <div className="info-row-google">
      <div className="row-label">{label}</div>
      <div className="row-value">
        {isEditing ? (
          fieldKey === "gender" ? (
            <select
              className="edit-input"
              value={editForm[fieldKey]}
              onChange={(e) =>
                setEditForm({ ...editForm, [fieldKey]: e.target.value })
              }
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <input
              type={type}
              className="edit-input"
              value={editForm[fieldKey]}
              onChange={(e) =>
                setEditForm({ ...editForm, [fieldKey]: e.target.value })
              }
            />
          )
        ) : (
          <span>{value || "Not Set"}</span>
        )}
      </div>
    </div>
  );

  const renderVerifyRow = (label, value, isVerified, type) => (
    <div className="info-row-google">
      <div className="row-label">{label}</div>
      <div
        className="row-value"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {isEditing ? (
          type === "phone" ? (
            <div className="phone-input-group">
              <span className="country-code">🇮🇳 +91</span>
              <input
                type="tel"
                className="edit-input-phone"
                placeholder="00000 00000"
                maxLength="10"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>
          ) : (
            <input
              type="text"
              className="edit-input"
              value={editForm.email}
              readOnly={true}
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
          )
        ) : (
          <span>
            {type === "phone" && value ? `+91 ${value}` : value || "Not Set"}
          </span>
        )}

        {!isEditing &&
          value &&
          type === "email" &&
          (isVerified ? (
            <span className="badge-verified">Verified ✅</span>
          ) : (
            <button className="btn-verify" onClick={() => handleSendOtp(type)}>
              Verify Now
            </button>
          ))}
      </div>
    </div>
  );

  /* ================= UI RENDER ================= */
  return (
    <>
      <Navbar />
      <ToastContainer theme="colored" style={{ zIndex: 99999 }} />

      {/* --- CHANGE EMAIL MODAL --- */}
      {isEmailModalOpen && (
        <div className="modal-overlay">
          <div className="otp-card" style={{ maxWidth: "350px" }}>
            <h3>Change Email</h3>
            <p>Enter your new email and verify password.</p>

            <input
              type="email"
              placeholder="New Email Address"
              className="edit-input"
              style={{ marginBottom: "10px" }}
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
            />
            <div style={{ position: "relative" }}>
              <input
                type={showEmailPassword ? "text" : "password"}
                placeholder="Current Password"
                className="edit-input"
                style={{ marginBottom: "20px" }}
                value={emailForm.password}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, password: e.target.value })
                }
              />
              <span
                onClick={() => setShowEmailPassword(!showEmailPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "37%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#a575ff",
                }}
              >
                {showEmailPassword ? "⌣" : "👁"}
              </span>
            </div>

            {showEmailOtpInput && (
              <>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter OTP"
                  className="edit-input"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  style={{ marginBottom: "10px" }}
                />

                <button
                  disabled={emailOtpTimer > 0}
                  onClick={handleChangeEmail}
                  style={{
                    background: "none",
                    border: "none",
                    color: emailOtpTimer > 0 ? "#999" : "#4c2a85",
                    cursor: emailOtpTimer > 0 ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    marginBottom: "10px",
                  }}
                >
                  {emailOtpTimer > 0
                    ? `Resend OTP in ${emailOtpTimer}s`
                    : "Resend OTP"}
                </button>
              </>
            )}

            <div className="modal-actions">
              {!showEmailOtpInput ? (
                <button onClick={handleChangeEmail} className="btn-confirm">
                  Send OTP
                </button>
              ) : (
                <button
                  onClick={handleVerifyNewEmailOtp}
                  className="btn-confirm"
                >
                  Verify & Update
                </button>
              )}
              <button onClick={handleCloseEmailModal} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PASSWORD CHANGE MODAL --- */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="otp-card" style={{ maxWidth: "350px" }}>
            <h3>Change Password</h3>
            <p>Verify your identity to set a new password.</p>

            <div style={{ position: "relative" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Current Password"
                className="edit-input"
                style={{ marginBottom: "10px" }}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
              />
              <span
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "45%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#a575ff",
                }}
              >
                {showCurrentPassword ? "⌣" : "👁"}
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                className="edit-input"
                style={{ marginBottom: "10px" }}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "44%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#a575ff",
                }}
              >
                {showNewPassword ? "⌣" : "👁"}
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className="edit-input"
                style={{ marginBottom: "20px" }}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "37%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#a575ff",
                }}
              >
                {showConfirmPassword ? "⌣" : "👁"}
              </span>
            </div>

            <div className="modal-actions">
              <button onClick={handleChangePassword} className="btn-confirm">
                Update
              </button>
              {/* FIX: Call handleClosePasswordModal to clear data on cancel */}
              <button onClick={handleClosePasswordModal} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OTP MODAL --- */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="otp-card">
            <h3>Verify Email</h3>
            <p>Enter the 6-digit code sent to your Email.</p>
            <input
              type="text"
              maxLength="6"
              placeholder="123456"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="otp-input"
            />
            <div className="modal-actions">
              <button onClick={handleVerifyOtp} className="btn-confirm">
                Verify
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
            {/* --- RESEND OTP BUTTON --- */}
            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0}
                style={{
                  background: "none",
                  border: "none",
                  color: resendTimer > 0 ? "#999" : "#4c2a85",
                  cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : "Resend OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE ACCOUNT OTP MODAL --- */}
      {showDeleteOtpModal && (
        <div className="modal-overlay">
          <div
            className="otp-card"
            style={{ maxWidth: "350px", borderTop: "4px solid #e74c3c" }}
          >
            <h3 style={{ color: "#c0392b" }}>Confirm Deletion</h3>
            <p>
              Enter the OTP sent to <strong>{userData.email}</strong> to
              permanently delete your account.
            </p>

            <input
              type="text"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              className="edit-input"
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              style={{
                marginBottom: "10px",
                textAlign: "center",
                letterSpacing: "2px",
                fontSize: "1.2rem",
              }}
            />

            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <button
                onClick={handleDeleteAccount} // Re-triggers send-delete-otp
                disabled={deleteOtpTimer > 0}
                style={{
                  background: "none",
                  border: "none",
                  color: deleteOtpTimer > 0 ? "#999" : "#3498db",
                  cursor: deleteOtpTimer > 0 ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {deleteOtpTimer > 0
                  ? `Resend OTP in ${deleteOtpTimer}s`
                  : "Resend OTP"}
              </button>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleConfirmDelete}
                className="btn-confirm"
                style={{ background: "#e74c3c" }} // Red button for danger
              >
                Confirm Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteOtpModal(false);
                  setDeleteOtp("");
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL SCREEN IMAGE --- */}
      {isFullScreenImg && userData.profilePic && (
        <div
          className="modal-overlay"
          onClick={() => setIsFullScreenImg(false)}
        >
          <div
            style={{ position: "relative", maxHeight: "90%", maxWidth: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✅ CHANGED: Use api.defaults.baseURL for dynamic image URL */}
            <img
              src={`${api.defaults.baseURL}${userData.profilePic}`}
              alt="Full View"
              style={{
                maxHeight: "85vh",
                maxWidth: "90vw",
                borderRadius: "8px",
                boxShadow: "0 5px 30px rgba(0,0,0,0.5)",
              }}
            />
            <button
              onClick={() => setIsFullScreenImg(false)}
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "2rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- PHOTO MODAL --- */}
      {isPicModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPicModalOpen(false)}>
          <div
            className="photo-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <button
              onClick={() => setIsPicModalOpen(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#666",
              }}
              title="Close"
            >
              ✕
            </button>

            <h3>Profile picture</h3>
            <p>A picture helps people recognize you.</p>
            <div
              className="big-avatar"
              onClick={() => {
                if (userData.profilePic) setIsFullScreenImg(true);
              }}
            >
              {userData.profilePic ? (
                // ✅ CHANGED: Dynamic Image URL
                <img
                  src={`${api.defaults.baseURL}${userData.profilePic}`}
                  alt="Profile"
                />
              ) : (
                <span className="big-initial">
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="photo-actions-row">
              <button
                className="btn-icon-label"
                onClick={() => fileInputRef.current.click()}
              >
                <span>✏️ Change</span>
              </button>
              {userData.profilePic && (
                <>
                  <button
                    className="btn-icon-label"
                    onClick={handleDownloadPhoto}
                  >
                    <span>⬇ Download</span>
                  </button>
                  <button
                    className="btn-icon-label delete"
                    onClick={handleDeletePhoto}
                  >
                    <span>🗑 Remove</span>
                  </button>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      <div className="profile-container-new">
        <div className="profile-summary-card">
          <div
            className="avatar-section"
            onClick={() => setIsPicModalOpen(true)}
          >
            <div
              className="avatar-lg"
              style={{
                // ✅ CHANGED: Dynamic Background Image
                backgroundImage: userData.profilePic
                  ? `url(${api.defaults.baseURL}${userData.profilePic})`
                  : "none",
              }}
            >
              {!userData.profilePic && userData.name.charAt(0).toUpperCase()}
              <div className="cam-icon">📷</div>
            </div>
          </div>
          <div className="summary-text">
            <h1>Welcome, {userData.name}</h1>
            <p>
              {userData.email} • {userData.role.toUpperCase()}
            </p>
            {/* ---  DATE JOINED --- */}
            <p
              style={{ fontSize: "0.9rem", color: "#7f8c8d", marginTop: "5px" }}
            >
              Joined:{" "}
              {userData.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="profile-content-wrapper">
          <div className="profile-sidebar">
            <div
              className={`tab-item ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              👤 Personal Info
            </div>
            <div
              className={`tab-item ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              🛡 Security
            </div>
            <div
              className={`tab-item ${activeTab === "exams" ? "active" : ""}`}
              onClick={() => setActiveTab("exams")}
            >
              {userData.role === "admin"
                ? "📢 Published Exams"
                : "📝 Exam History"}
            </div>
          </div>

          <div className="profile-details-panel">
            {activeTab === "personal" && (
              <div className="tab-content fade-in">
                {/* === PROFILE COMPLETION BAR UI === */}
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#f4f6f8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    <span>Profile Completion</span>
                    <span>{profileCompletion}%</span>
                  </div>

                  <div
                    style={{
                      height: "8px",
                      background: "#ddd",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${profileCompletion}%`,
                        height: "100%",
                        background:
                          profileCompletion === 100 ? "#2ecc71" : "#f39c12",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  {profileCompletion < 100 && (
                    <p
                      style={{
                        marginTop: "8px",
                        fontSize: "0.8rem",
                        color: "#c0392b",
                      }}
                    >
                      ⚠ Complete your profile to become eligible for exams.
                    </p>
                  )}
                </div>
                {/* === END PROFILE COMPLETION BAR === */}

                <div className="tab-header">
                  <h2>Personal Info</h2>
                  <p>Manage your personal details and verification.</p>
                  {!isEditing ? (
                    <button
                      className="btn-edit"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Details
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        className="btn-save"
                        onClick={handleUpdateProfile}
                      >
                        Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="google-rows-container">
                  <div
                    className="info-row-google clickable"
                    onClick={() => setIsPicModalOpen(true)}
                  >
                    <div className="row-label">Profile Picture</div>
                    <div className="row-value">
                      <span style={{ fontSize: "0.8rem", color: "#666" }}>
                        A photo helps personalize your account
                      </span>
                    </div>
                    <div className="row-action">
                      <div
                        className="mini-avatar"
                        style={{
                          // ✅ CHANGED: Dynamic Mini Avatar
                          backgroundImage: userData.profilePic
                            ? `url(${api.defaults.baseURL}${userData.profilePic})`
                            : "none",
                        }}
                      />
                    </div>
                  </div>

                  {renderRow("Full Name", userData.name, "name")}
                  {renderRow("Gender", userData.gender, "gender")}
                  {renderRow(
                    "Date of Birth",
                    userData.birthday
                      ? new Date(userData.birthday).toLocaleDateString()
                      : "",
                    "birthday",
                    "date"
                  )}
                </div>

                <div className="tab-header">
                  <h2 style={{ marginTop: "20px" }}>Contact Info</h2>
                </div>

                <div className="google-rows-container">
                  {renderVerifyRow(
                    "Email",
                    userData.email,
                    userData.isEmailVerified,
                    "email"
                  )}
                  {renderVerifyRow("Phone", userData.phone, null, "phone")}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="tab-content fade-in">
                <h2>Security</h2>
                <p>Settings to keep your account safe.</p>

                <div className="security-box">
                  {/* --- CHANGE EMAIL --- */}
                  <div className="sec-row">
                    <div>
                      <strong>Email Address</strong>
                      <p>{userData.email}</p>
                    </div>

                    {userData.googleId ? (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#999",
                          fontStyle: "italic",
                          marginLeft: "15%",
                        }}
                      >
                        Managed by Google
                      </span>
                    ) : (
                      <button
                        className="btn-arrow"
                        onClick={() => setIsEmailModalOpen(true)}
                      >
                        Change ➔
                      </button>
                    )}
                  </div>

                  {/* --- CHANGE PASSWORD --- */}
                  <div className="sec-row">
                    <div>
                      <strong>Password</strong>
                      <p>Change Password</p>
                    </div>

                    {userData.googleId ? (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#999",
                          fontStyle: "italic",
                        }}
                      >
                        Managed by Google
                      </span>
                    ) : (
                      <button
                        className="btn-arrow"
                        onClick={() => setIsPasswordModalOpen(true)}
                      >
                        Change ➔
                      </button>
                    )}
                  </div>

                  {/* --- DELETE ACCOUNT --- */}
                  <div className="sec-row">
                    <div>
                      <strong>Delete Account</strong>
                      <p>Permanently remove your data</p>
                    </div>
                    <button
                      className="btn-danger-outline"
                      onClick={handleDeleteAccount}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== EXAMS TAB ===================== */}
            {activeTab === "exams" && (
              <div className="tab-content fade-in">
                {/* ===== STUDENT VIEW (UNCHANGED CODE) ===== */}
                {userData.role !== "admin" && (
                  <>
                    <h2>Exam History</h2>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.length > 0 ? (
                            results.map((item) => {
                              const hasCert = item.exam?.hasCertificate;
                              return (
                                <tr key={item._id}>
                                  <td>
                                    {item.exam?.title || "Deleted Exam"}
                                  </td>
                                  <td>
                                    {new Date(
                                      item.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="score-text">
                                    {item.status === "pending" ? (
                                      <span
                                        style={{
                                          color: "#999",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        Waiting...
                                      </span>
                                    ) : (
                                      <span>
                                        {item.score} / {item.totalMarks}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {item.status === "pending" ? (
                                      <span
                                        className="status-tag"
                                        style={{
                                          background: "#fff3cd",
                                          color: "#856404",
                                        }}
                                      >
                                        Result Pending ⏳
                                      </span>
                                    ) : (
                                      <span
                                        className={`status-tag ${
                                          item.isPassed ? "pass" : "fail"
                                        }`}
                                      >
                                        {item.isPassed ? "Passed" : "Failed"}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "10px",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <button
                                        onClick={() =>
                                          handleViewReport(item)
                                        }
                                        style={{
                                          padding: "5px 10px",
                                          cursor: "pointer",
                                          background: "#3498db",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          fontWeight: "bold",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        📄 Report
                                      </button>
                                      {hasCert ? (
                                        <button
                                          onClick={() =>
                                            handleDownloadCert(item)
                                          }
                                          style={{
                                            padding: "5px 10px",
                                            cursor:
                                              item.status === "pending"
                                                ? "wait"
                                                : "pointer",
                                            background:
                                              item.status === "pending"
                                                ? "#f39c12"
                                                : item.isPassed
                                                ? "#2ecc71"
                                                : "#bdc3c7",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontWeight: "bold",
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          {item.status === "pending"
                                            ? "⏳ Wait"
                                            : item.isPassed
                                            ? "⬇ Cert"
                                            : "🔒 Locked"}
                                        </button>
                                      ) : (
                                        <span
                                          style={{
                                            color: "#999",
                                            fontSize: "0.8rem",
                                          }}
                                        >
                                          --
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: "center",
                                  padding: "20px",
                                }}
                              >
                                You haven't taken any exams yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ===== ADMIN VIEW (NEW, UI ONLY) ===== */}
                {userData.role === "admin" && (
                  <>
                    <h2>My Published Exams</h2>
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Exam Title</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Marks</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminExams && adminExams.length > 0 ? (
                            adminExams.map((exam) => (
                              <tr key={exam._id}>
                                <td>{exam.title}</td>
                                <td>
                                  <span
                                    onClick={() => handleTogglePublish(exam)}
                                    style={{ cursor: "pointer" }}
                                    title="Click to Toggle Status"
                                    className={
                                      exam.isPublished
                                        ? "status-live"
                                        : "status-draft"
                                    }
                                  >
                                    {exam.isPublished ? "Live" : "Draft"}
                                  </span>
                                </td>
                                <td>{exam.type}</td>
                                <td>{exam.totalMarks}</td>
                                <td>
                                  <div className="exam-actions">
                                    <button
                                      className="exam-action-btn results"
                                      onClick={() =>
                                        navigate(`/exam-results/${exam._id}`)
                                      }
                                    >
                                      Results
                                    </button>
                                    <button
                                      className="exam-action-btn stats"
                                      onClick={() =>
                                        navigate(`/analytics/${exam._id}`)
                                      }
                                    >
                                      Stats
                                    </button>
                                    <button
                                      className="exam-action-btn delete"
                                      key={exam._id}
                                      onClick={() =>
                                        handleDeleteExam(exam._id)
                                      }
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  textAlign: "center",
                                  padding: "20px",
                                }}
                              >
                                You haven’t published any exams yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;