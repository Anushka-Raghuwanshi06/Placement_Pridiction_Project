import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export const BranchAnalyticsChart = ({ branchData = [] }) => {
  if (!branchData || branchData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        No branch statistics available.
      </div>
    );
  }

  // Format data for chart
  const data = branchData.map((b) => ({
    name: b.branch.replace("Engineering", "Eng").replace("Computer Science &", "CSE").replace("Information Technology", "IT").replace("Electronics & Communication", "ECE").replace("Artificial Intelligence & Data Science", "AI & DS"),
    avg_prob: b.avg_probability,
    student_count: b.student_count,
    avg_cgpa: b.avg_cgpa,
  }));

  const colorsList = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Branch-wise Placement Likelihood
          </h3>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Cohort performance across engineering disciplines
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height: "240px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.8rem",
              }}
              formatter={(value) => [`${value}%`, "Avg Probability"]}
            />
            <Bar dataKey="avg_prob" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorsList[index % colorsList.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
