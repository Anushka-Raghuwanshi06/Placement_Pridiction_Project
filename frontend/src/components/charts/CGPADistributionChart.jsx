import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const CGPADistributionChart = ({ cgpaDistribution = {} }) => {
  const data = Object.entries(cgpaDistribution).map(([band, count]) => ({
    name: `CGPA ${band}`,
    value: count,
  }));

  const COLORS = ["#10b981", "#6366f1", "#06b6d4", "#f59e0b", "#f43f5e"];

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Academic CGPA Distribution
        </h3>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
          Student academic performance bands
        </div>
      </div>

      <div style={{ width: "100%", height: "240px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.8rem",
              }}
              formatter={(value) => [`${value} Students`, "Count"]}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
