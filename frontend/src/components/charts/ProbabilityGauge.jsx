import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Zap, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

export const ProbabilityGauge = ({ probability = 0, readinessLevel = "Not Evaluated", latencyMs = 0, modelVersion = "v1.0" }) => {
  const prob = Math.min(100, Math.max(0, Number(probability) || 0));

  // Determine colors and badges
  let fillColor = "#10b981"; // Emerald
  let bgTrackColor = "rgba(16, 185, 129, 0.12)";
  let badgeClass = "badge-high";
  let statusIcon = <TrendingUp size={16} />;

  if (prob < 50.0) {
    fillColor = "#f43f5e"; // Rose
    bgTrackColor = "rgba(244, 63, 94, 0.12)";
    badgeClass = "badge-low";
    statusIcon = <AlertTriangle size={16} />;
  } else if (prob < 75.0) {
    fillColor = "#f59e0b"; // Amber
    bgTrackColor = "rgba(245, 158, 11, 0.12)";
    badgeClass = "badge-moderate";
    statusIcon = <TrendingUp size={16} />;
  }

  // Semi-circle gauge data
  const data = [
    { name: "Score", value: prob },
    { name: "Remaining", value: 100 - prob },
  ];

  return (
    <div className="glass-card" style={{ padding: "1.5rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Top Header */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Placement Likelihood
          </h3>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            ML Model: {modelVersion}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.04)", padding: "0.3rem 0.6rem", borderRadius: "999px" }}>
          <Zap size={13} style={{ color: "#38bdf8" }} />
          <span>Inference: {latencyMs > 0 ? `${latencyMs}ms` : "< 50ms"}</span>
        </div>
      </div>

      {/* Gauge Visual */}
      <div style={{ width: "100%", height: "180px", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              <Cell key="cell-0" fill={fillColor} />
              <Cell key="cell-1" fill={bgTrackColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Probability Text */}
        <div style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          transform: "translate(-50%, -10%)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: fillColor,
            lineHeight: 1,
            textShadow: `0 0 20px ${fillColor}40`,
            fontFamily: "Outfit, sans-serif"
          }}>
            {prob.toFixed(1)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>
            Likelihood Index
          </div>
        </div>
      </div>

      {/* Readiness Badge */}
      <div style={{ marginTop: "-0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
        <div className={`badge ${badgeClass}`} style={{ fontSize: "0.85rem", padding: "0.35rem 0.9rem" }}>
          {statusIcon}
          <span>{readinessLevel}</span>
        </div>
        <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", textAlign: "center" }}>
          Evaluated across CGPA, active backlogs, aptitude test, and technical skills
        </div>
      </div>
    </div>
  );
};
