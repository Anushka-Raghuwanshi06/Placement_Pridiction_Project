import React, { useState, useEffect } from "react";
import { Building, Plus, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";
import { Modal } from "../components/common/Modal";

export const CompanyManagerPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    minimum_cgpa: 7.0,
    backlog_allowed: 0,
    required_skills: "Python, SQL, DSA",
    tier: "Tier 1 (Product)",
    package_lpa: 12.0,
    job_role: "Software Development Engineer",
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newComp = await api.createCompany(form);
      setCompanies((prev) => [...prev, newComp]);
      setIsModalOpen(false);
      setForm({
        name: "",
        minimum_cgpa: 7.0,
        backlog_allowed: 0,
        required_skills: "Python, SQL, DSA",
        tier: "Tier 1 (Product)",
        package_lpa: 12.0,
        job_role: "Software Development Engineer",
      });
    } catch (err) {
      console.error("Failed to add company:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this recruiting company?")) return;
    try {
      await api.deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.company_id !== id));
    } catch (err) {
      console.error("Failed to delete company:", err);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Campus Recruiting Companies</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Configure corporate eligibility criteria, cutoff CGPA, allowed backlogs, and skill requirements
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ fontSize: "0.85rem" }}
        >
          <Plus size={16} /> Add New Recruiter
        </button>
      </div>

      {/* Grid of Companies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {companies.map((comp) => (
          <div key={comp.company_id} className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>{comp.name}</h3>
                  <span className="badge badge-role" style={{ fontSize: "0.68rem", marginTop: "4px" }}>{comp.tier}</span>
                </div>
                <button
                  onClick={() => handleDelete(comp.company_id)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                <div style={{ color: "#38bdf8", fontWeight: 600 }}>
                  {comp.job_role} • ₹{comp.package_lpa} LPA
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  Min CGPA: <strong>{comp.minimum_cgpa}</strong> | Max Backlogs: <strong>{comp.backlog_allowed}</strong>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Required Skills:</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{comp.required_skills}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Recruiter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Campus Recruiting Company"
      >
        <form onSubmit={handleCreateCompany} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label">Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Adobe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label">Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.minimum_cgpa}
                onChange={(e) => setForm({ ...form, minimum_cgpa: parseFloat(e.target.value) || 7.0 })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Max Backlogs Allowed</label>
              <input
                type="number"
                min="0"
                value={form.backlog_allowed}
                onChange={(e) => setForm({ ...form, backlog_allowed: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label">Recruiter Tier</label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="form-select"
              >
                <option value="Tier 1 (Product)">Tier 1 (Product)</option>
                <option value="Tier 2 (Consulting)">Tier 2 (Consulting)</option>
                <option value="Tier 2 (Service/Specialist)">Tier 2 (Service/Specialist)</option>
                <option value="Tier 3 (Service)">Tier 3 (Service)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Package (LPA)</label>
              <input
                type="number"
                step="0.5"
                value={form.package_lpa}
                onChange={(e) => setForm({ ...form, package_lpa: parseFloat(e.target.value) || 10.0 })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Job Role Title</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer"
              value={form.job_role}
              onChange={(e) => setForm({ ...form, job_role: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Required Skills (Comma-separated)</label>
            <textarea
              rows={2}
              placeholder="Python, Java, DSA, System Design, SQL"
              value={form.required_skills}
              onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Saving..." : "Add Recruiter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
