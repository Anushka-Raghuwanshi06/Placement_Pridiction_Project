import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, Filter, RefreshCw, Clock, User, HardDrive } from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        search: search || undefined,
        action_type: actionType || undefined,
      });
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Institutional Security & Audit Trail</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Immutable logging of prediction requests, administrative operations, and security events
          </p>
        </div>

        <button onClick={fetchLogs} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="glass-card" style={{ padding: "1rem 1.25rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search audit details or actor email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.3rem", padding: "0.55rem 0.85rem 0.55rem 2.3rem", fontSize: "0.85rem" }}
            />
          </div>

          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="form-select"
            style={{ width: "auto", flex: "1 1 200px", padding: "0.55rem 0.85rem", fontSize: "0.85rem" }}
          >
            <option value="">All Action Types</option>
            <option value="PREDICTION_REQUEST">Prediction Requests</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="USER_REGISTRATION">Registrations</option>
            <option value="DATASET">Dataset Operations</option>
            <option value="MODEL">Model Operations</option>
            <option value="UPDATE">Profile Updates</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}>
            Filter Logs
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: "1.25rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.7rem 0.85rem" }}>Timestamp</th>
              <th style={{ padding: "0.7rem 0.85rem" }}>Actor</th>
              <th style={{ padding: "0.7rem 0.85rem" }}>Action Type</th>
              <th style={{ padding: "0.7rem 0.85rem" }}>Target Entity</th>
              <th style={{ padding: "0.7rem 0.85rem" }}>Details</th>
              <th style={{ padding: "0.7rem 0.85rem" }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.log_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {l.actor_email || `System (${l.actor_id || "0"})`}
                    </div>
                    {l.actor_role && (
                      <span className="badge badge-role" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", marginTop: "2px" }}>
                        {l.actor_role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", fontWeight: 600, color: "#818cf8" }}>
                    {l.action_type}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-secondary)" }}>
                    {l.target_entity} {l.target_id ? `(#${l.target_id})` : ""}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-secondary)", maxWidth: "340px", wordBreak: "break-word" }}>
                    {l.details}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {l.ip_address || "127.0.0.1"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
