import React from "react";
import Profile from "./Profile";

function ProfileManager() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return (
      <h2 style={{ marginTop: "100px", textAlign: "center", color: "white" }}>
        Please Login First
      </h2>
    );
  }

  return <Profile />;
}

export default ProfileManager;
