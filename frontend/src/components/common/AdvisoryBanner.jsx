import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const AdvisoryBanner = ({ compact = false }) => {
  if (compact) {
    return (
      <div style={{
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: "var(--radius-sm)",
        padding: "0.5rem 0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        fontSize: "0.8rem",
        color: "#fde68a"
      }}>
        <AlertTriangle size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <span>
          <strong>Advisory Notice:</strong> Predictions are statistical estimates and not a placement guarantee.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      borderRadius: "var(--radius-md)",
      padding: "0.85rem 1.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <div style={{
          background: "rgba(245, 158, 11, 0.2)",
          padding: "0.5rem",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#fef3c7" }}>
            Institutional Advisory & Ethical AI Notice
          </div>
          <div style={{ fontSize: "0.8rem", color: "#fde68a", marginTop: "2px" }}>
            Predictions are advisory only and must not be presented as a placement guarantee anywhere in the UI or messaging.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#d97706", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
        <ShieldCheck size={16} />
        <span>ISO-Compliant Assessment</span>
      </div>
    </div>
  );
};
