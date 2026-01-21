import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Get the 'data' param from the URL
    const params = new URLSearchParams(location.search);
    const data = params.get("data");

    if (data) {
      try {
        // 2. Decode and Parse the JSON string
        const parsedData = JSON.parse(decodeURIComponent(data));

        // 3. Save to LocalStorage (This logs the user in!)
        localStorage.setItem("user", JSON.stringify(parsedData));

        //  Notify the Navbar that the user has logged in
        window.dispatchEvent(new Event("userUpdated"));

        // 4. CHECK FOR REDIRECT URL (From Login.jsx)
        const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
        const destination = savedRedirect || "/";

        // Clean up storage so we don't auto-redirect next time
        if (savedRedirect) {
          sessionStorage.removeItem("redirectAfterLogin");
        }

        // 5. Redirect to Dashboard or Saved Page
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 1000);
      } catch (error) {
        console.error("Login parsing error:", error);
        navigate("/login");
      }
    } else {
      // If no data, go back to login
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1a1a2e",
        color: "white",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        className="spinner"
        style={{
          width: "50px",
          height: "50px",
          border: "5px solid #f3f3f3",
          borderTop: "5px solid #4c2a85",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      ></div>
      <h2>Logging you in...</h2>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginSuccess;
