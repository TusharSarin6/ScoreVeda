import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactSupport from "./pages/ContactSupport";
import CreateExam from "./pages/CreateExam";
import TakeExam from "./pages/TakeExam";
import ResultPage from "./pages/ResultPage";
import AdminResults from "./pages/AdminResults";
import ProfileManager from "./pages/ProfileManager";
import ReviewExam from "./pages/ReviewExam";
import ExamAnalytics from "./pages/ExamAnalytics";
import LoginSuccess from "./pages/LoginSuccess";
import ExamInstructions from "./pages/ExamInstructions";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <>
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactSupport />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/take-exam/:id" element={<TakeExam />} />

          {/*  Added route to handle direct link from email */}
          <Route path="/result" element={<ResultPage />} />
          <Route path="/result/:id" element={<ResultPage />} />

          <Route path="/exam-results/:id" element={<AdminResults />} />

          <Route path="/profile" element={<ProfileManager />} />

          <Route path="/review/:id" element={<ReviewExam />} />
          <Route path="/analytics/:id" element={<ExamAnalytics />} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route path="/instructions/:id" element={<ExamInstructions />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
