import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  Building, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Award, 
  ArrowRight, 
  Layers,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { api } from "../api/client";
import { ProbabilityGauge } from "../components/charts/ProbabilityGauge";
import { FactorImpactChart } from "../components/charts/FactorImpactChart";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const StudentDashboard = ({ onNavigateToProfile }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLatestOrPredict = async () => {
    try {
      setInitialLoading(true);
      // Run fresh prediction or fetch latest
      const res = await api.predict();
      setPredictionData(res);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestOrPredict();
  }, []);

  const handleRecompute = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.predict();
      setPredictionData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: "var(--primary-light)", margin: "0 auto 1rem" }} />
          <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Evaluating your academic profile & running ML inference...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Advisory Banner */}
      <AdvisoryBanner />

      {/* Hero Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Student Placement Assessment
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            AI-driven readiness diagnostic and multi-factor campus recruiter matching
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onNavigateToProfile}
            className="btn-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            Update Academic Profile
          </button>
          <button
            onClick={handleRecompute}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: "0.85rem" }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Calculating..." : "Recompute Readiness"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#fb7185", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {predictionData && (
        <>
          {/* Main Visuals Grid: Gauge + Contributing Factors */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
            {/* Probability Gauge */}
            <ProbabilityGauge
              probability={predictionData.probability}
              readinessLevel={predictionData.readiness_level}
              latencyMs={predictionData.latency_ms}
              modelVersion={predictionData.model_version}
            />

            {/* Contributing Factors Breakdown */}
            <FactorImpactChart factors={predictionData.contributing_factors} />
          </div>

          {/* Target Role & Recommendations */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {/* Recommended Target Role */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
                <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
                  <Briefcase size={20} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Recommended Job Profile</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target industry alignment</div>
                </div>
              </div>

              <div style={{
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                marginBottom: "1rem"
              }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#a5b4fc" }}>
                  {predictionData.job_role}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Based on your skill vectors, academic track record, and problem-solving aptitude.
                </div>
              </div>

              {/* Matched Skills */}
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Your Current Verified Skill Repertoire:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {predictionData.matched_skills?.map((skill, idx) => (
                    <span key={idx} className="badge badge-high" style={{ fontSize: "0.75rem" }}>
                      <CheckCircle2 size={12} /> {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Personalized Recommendations */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
                  <Lightbulb size={20} style={{ color: "#34d399" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Personalized Action Plan</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Actionable steps to elevate placement odds</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {predictionData.recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "0.65rem",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-glass)",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.825rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.35
                    }}
                  >
                    <div style={{ color: "var(--primary-light)", fontWeight: 700, fontSize: "0.85rem" }}>
                      {idx + 1}.
                    </div>
                    <div>{rec}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dream Companies Eligibility Matrix */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div style={{ background: "rgba(6, 182, 212, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
                  <Building size={20} style={{ color: "#22d3ee" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Campus Recruiter Eligibility Matrix</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Real-time cutoff evaluation against top recruiting companies
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
              {predictionData.company_eligibility?.map((comp, idx) => (
                <div
                  key={idx}
                  style={{
                    background: comp.eligible ? "rgba(16, 185, 129, 0.05)" : "rgba(244, 63, 94, 0.04)",
                    border: `1px solid ${comp.eligible ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {comp.company_name}
                        </h4>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {comp.tier}
                        </span>
                      </div>
                      <span className={comp.eligible ? "badge badge-high" : "badge badge-low"}>
                        {comp.eligible ? "Eligible" : "Needs Criteria"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600, marginTop: "0.4rem" }}>
                      {comp.job_role} • ₹{comp.package_lpa} LPA
                    </div>

                    <div style={{ marginTop: "0.65rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {comp.reasons.map((r, rIdx) => (
                        <div key={rIdx} style={{ fontSize: "0.75rem", color: comp.eligible ? "var(--text-secondary)" : "#fb7185", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {comp.eligible ? <CheckCircle2 size={13} style={{ color: "#34d399", flexShrink: 0 }} /> : <XCircle size={13} style={{ color: "#f43f5e", flexShrink: 0 }} />}
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {comp.missing_skills?.length > 0 && (
                    <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                        Recommended Skills to Add:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {comp.missing_skills.map((ms, mIdx) => (
                          <span key={mIdx} className="badge badge-moderate" style={{ fontSize: "0.68rem" }}>
                            {ms}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
