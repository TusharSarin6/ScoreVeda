import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api"; 
import Navbar from "../components/Navbar";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ExamAnalytics() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        //  Use api helper (Token is auto-injected)
        const { data } = await api.get(`/api/exams/analytics/${id}`);
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats");
      }
    };
    fetchStats();
  }, [id]);

  if (!stats)
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading Analytics...
      </div>
    );

  // Data for Pie Chart
  const pieData = [
    { name: "Passed", value: stats.passedCount },
    { name: "Failed", value: stats.failedCount },
  ];
  const COLORS = ["#2ecc71", "#e74c3c"]; 

  return (
    <>
      <Navbar />
      <div
        className="container"
        style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}
      >
        <h1
          style={{
            color: "#a575ff",
            textAlign: "center",
            marginBottom: "30px",
            marginTop: "65px",
          }}
        >
          Analytics: {stats.examTitle}
        </h1>

        {/* 1. KEY METRICS CARDS */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <StatCard
            label="Total Students"
            value={stats.totalAttempts}
            color="#3498db"
          />
          <StatCard
            label="Pass Percentage"
            value={`${stats.passPercentage}%`}
            color="#9b59b6"
          />
          <StatCard label="Passed" value={stats.passedCount} color="#2ecc71" />
          <StatCard label="Failed" value={stats.failedCount} color="#e74c3c" />
          <StatCard
            label="Avg Score"
            value={stats.averageScore}
            color="#f1c40f"
          />
        </div>

        {/* 2. CHARTS SECTION */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* PIE CHART: PASS vs FAIL */}
          <div className="chart-box" style={chartBoxStyle}>
            <h3>Pass / Fail Ratio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR CHART: SCORE DISTRIBUTION */}
          <div className="chart-box" style={chartBoxStyle}>
            <h3>Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.distribution}>
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f0f0f0" }} />
                <Bar dataKey="count" fill="#8884d8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple Helper Components for styling
const StatCard = ({ label, value, color }) => (
  <div
    style={{
      background: "white",
      padding: "20px",
      borderRadius: "10px",
      minWidth: "150px",
      textAlign: "center",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      borderTop: `5px solid ${color}`,
    }}
  >
    <h2 style={{ margin: 0, fontSize: "2rem", color: "#333" }}>{value}</h2>
    <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>{label}</p>
  </div>
);

const chartBoxStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  width: "45%",
  minWidth: "300px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  textAlign: "center",
};

export default ExamAnalytics;
