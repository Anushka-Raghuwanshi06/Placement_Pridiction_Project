import React from "react";
import { CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const FactorImpactChart = ({ factors = [] }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Key Contributing Factors
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Run a placement assessment to view ranked factors influencing your score.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Ranked Contributing Factors
          </h3>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Feature importance breakdown explaining the prediction outcome
          </div>
        </div>
        <span className="badge badge-role" style={{ fontSize: "0.7rem" }}>
          {factors.length} Influencers
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {factors.map((factor, index) => {
          const isPositive = factor.impact === "positive";
          const isNegative = factor.impact === "negative";
          const weightAbs = Math.min(100, Math.abs(factor.weight) * 3.5); // Scale for visual bar

          const barColor = isPositive ? "#10b981" : isNegative ? "#f43f5e" : "#fbbf24";
          const icon = isPositive ? (
            <ArrowUpRight size={18} style={{ color: "#34d399" }} />
          ) : isNegative ? (
            <ArrowDownRight size={18} style={{ color: "#fb7185" }} />
          ) : (
            <AlertCircle size={18} style={{ color: "#fbbf24" }} />
          );

          return (
            <div
              key={index}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.2)" : isNegative ? "rgba(244, 63, 94, 0.2)" : "rgba(251, 191, 36, 0.2)"}`,
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                transition: "transform 0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    background: isPositive ? "rgba(16, 185, 129, 0.15)" : isNegative ? "rgba(244, 63, 94, 0.15)" : "rgba(251, 191, 36, 0.15)",
                    padding: "4px",
                    borderRadius: "6px",
                    display: "flex"
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {factor.feature}
                  </span>
                </div>
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: barColor,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem"
                }}>
                  <span>{factor.weight > 0 ? `+${factor.weight}%` : `${factor.weight}%`}</span>
                </div>
              </div>

              {/* Visual Impact Bar */}
              <div style={{ width: "100%", height: "5px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "3px", overflow: "hidden", margin: "0.4rem 0" }}>
                <div
                  style={{
                    width: `${Math.max(10, weightAbs)}%`,
                    height: "100%",
                    background: barColor,
                    borderRadius: "3px",
                    transition: "width 0.6s ease"
                  }}
                />
              </div>

              <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", lineHeight: "1.35", marginTop: "0.3rem" }}>
                {factor.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
