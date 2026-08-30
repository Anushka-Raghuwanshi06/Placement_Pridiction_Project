import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Users, 
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Building,
  GraduationCap
} from "lucide-react";
import { api } from "../api/client";
import { BranchAnalyticsChart } from "../components/charts/BranchAnalyticsChart";
import { CGPADistributionChart } from "../components/charts/CGPADistributionChart";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const AdminDashboard = () => {
  const [reports, setReports] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Filters for prediction history
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedReadiness, setSelectedReadiness] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repData, predData] = await Promise.all([
        api.getAggregateReports(),
        api.getAllPredictions({
          search: search || undefined,
          branch: selectedBranch || undefined,
          readiness: selectedReadiness || undefined,
        }),
      ]);
      setReports(repData);
      setPredictions(predData);
    } catch (err) {
      console.error("Failed to load admin reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedReadiness]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const blob = await api.exportCsvReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placement_predictions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("CSV Export failed:", err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const blob = await api.exportPdfReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placement_readiness_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      {/* Header with Export buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Institutional Placement Command Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Aggregate cohort analytics, predictive history, and executive reports
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="btn-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            <FileSpreadsheet size={16} style={{ color: "#34d399" }} />
            {exportingCsv ? "Exporting CSV..." : "Export CSV Report"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="btn-primary"
            style={{ fontSize: "0.85rem" }}
          >
            <FileText size={16} />
            {exportingPdf ? "Generating PDF..." : "Export Official PDF"}
          </button>
        </div>
      </div>

      {/* System Metric Cards */}
      {reports && reports.system_stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Students</span>
              <GraduationCap size={18} style={{ color: "var(--primary-light)" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", marginTop: "0.4rem" }}>
              {reports.system_stats.total_students}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Enrolled candidates
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg Likelihood</span>
              <TrendingUp size={18} style={{ color: "#34d399" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#34d399", marginTop: "0.4rem" }}>
              {reports.system_stats.avg_placement_probability}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Institutional placement index
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Predictions</span>
              <Activity size={18} style={{ color: "#38bdf8" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#38bdf8", marginTop: "0.4rem" }}>
              {reports.system_stats.total_predictions}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Evaluations generated
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Active Model</span>
              <Cpu size={18} style={{ color: "#a78bfa" }} />
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", marginTop: "0.5rem" }}>
              {reports.system_stats.active_model}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Accuracy: {(reports.system_stats.active_model_accuracy * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Charts Section */}
      {reports && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
          <BranchAnalyticsChart branchData={reports.branch_stats} />
          <CGPADistributionChart cgpaDistribution={reports.cgpa_distribution} />
        </div>
      )}

      {/* Cohort Skill Demand Heatmap */}
      {reports && reports.top_skills && (
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Student Cohort Skill Frequency
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Distribution of validated technical proficiencies across candidates
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {reports.top_skills.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-glass)",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.825rem"
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.skill}</span>
                <span className="badge badge-role" style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem" }}>
                  {item.count} Students
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filterable Prediction History Viewer */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Prediction History Viewer</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Filterable and auditable log of individual candidate predictions
            </div>
          </div>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search candidate name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: "200px", padding: "0.45rem 0.75rem", fontSize: "0.825rem" }}
            />
            <select
              value={selectedReadiness}
              onChange={(e) => setSelectedReadiness(e.target.value)}
              className="form-select"
              style={{ width: "160px", padding: "0.45rem 0.75rem", fontSize: "0.825rem" }}
            >
              <option value="">All Readiness</option>
              <option value="High Readiness">High Readiness</option>
              <option value="Moderate Readiness">Moderate Readiness</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: "0.45rem 0.85rem", fontSize: "0.825rem" }}>
              Filter
            </button>
          </form>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.7rem 0.85rem" }}>Candidate</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Branch</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Probability</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Readiness Level</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Recommended Role</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Model</th>
                <th style={{ padding: "0.7rem 0.85rem" }}>Evaluated Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No predictions found for selected filters.
                  </td>
                </tr>
              ) : (
                predictions.map((p) => (
                  <tr
                    key={p.prediction_id}
                    style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
                  >
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.student_name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.student_email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-secondary)" }}>{p.branch}</td>
                    <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: p.probability >= 75 ? "#34d399" : p.probability >= 50 ? "#fbbf24" : "#fb7185" }}>
                      {p.probability}%
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <span className={p.readiness_level === "High Readiness" ? "badge badge-high" : p.readiness_level === "Moderate Readiness" ? "badge badge-moderate" : "badge badge-low"} style={{ fontSize: "0.68rem" }}>
                        {p.readiness_level}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-secondary)" }}>{p.job_role}</td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-muted)", fontSize: "0.72rem" }}>{p.model_version}</td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-muted)", fontSize: "0.72rem" }}>{p.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
