import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  RefreshCw,
  Save,
  Clock
} from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";
import { Modal } from "../components/common/Modal";

export const FacultyDashboard = () => {
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedReadiness, setSelectedReadiness] = useState("");

  // Mentoring Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mentorNotes, setMentorNotes] = useState("");
  const [riskStatus, setRiskStatus] = useState("Normal");
  const [updatingNote, setUpdatingNote] = useState(false);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const [overviewData, studentsData] = await Promise.all([
        api.getFacultyOverview(),
        api.getFacultyStudents({
          search: search || undefined,
          branch: selectedBranch || undefined,
          risk_status: selectedRisk || undefined,
          readiness: selectedReadiness || undefined,
        }),
      ]);
      setOverview(overviewData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load faculty monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, [selectedBranch, selectedRisk, selectedReadiness]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFacultyData();
  };

  const openMentoringModal = (student) => {
    setSelectedStudent(student);
    setMentorNotes(student.mentor_notes || "");
    setRiskStatus(student.risk_status || "Normal");
    setIsModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent) return;
    try {
      setUpdatingNote(true);
      await api.updateFacultyNote(selectedStudent.student_id, {
        mentor_notes: mentorNotes,
        risk_status: riskStatus,
      });

      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === selectedStudent.student_id
            ? { ...s, mentor_notes: mentorNotes, risk_status: riskStatus }
            : s
        )
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to update mentoring notes:", err);
    } finally {
      setUpdatingNote(false);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Faculty Mentoring & Readiness Portal</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Institutional student oversight restricted by role-based assigned cohorts
          </p>
        </div>

        <button
          onClick={fetchFacultyData}
          className="btn-secondary"
          style={{ fontSize: "0.85rem" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Overview Stat Cards */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Assigned Students</span>
              <Users size={18} style={{ color: "var(--primary-light)" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", marginTop: "0.4rem" }}>
              {overview.total_assigned}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Active mentorship group
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Cohort Avg Probability</span>
              <TrendingUp size={18} style={{ color: "#34d399" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#34d399", marginTop: "0.4rem" }}>
              {overview.avg_cohort_probability}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Aggregate readiness benchmark
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Students At Risk</span>
              <AlertTriangle size={18} style={{ color: "#fb7185" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fb7185", marginTop: "0.4rem" }}>
              {overview.at_risk_count}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Backlogs or low aptitude flags
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>High Readiness Tier</span>
              <Award size={18} style={{ color: "#38bdf8" }} />
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#38bdf8", marginTop: "0.4rem" }}>
              {overview.high_readiness_count}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Ready for Tier-1 Product drives
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "1rem 1.25rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.3rem", padding: "0.55rem 0.85rem 0.55rem 2.3rem", fontSize: "0.85rem" }}
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="form-select"
            style={{ width: "auto", flex: "1 1 180px", padding: "0.55rem 0.85rem", fontSize: "0.85rem" }}
          >
            <option value="">All Branches</option>
            <option value="Computer Science & Engineering">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics</option>
            <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="form-select"
            style={{ width: "auto", flex: "1 1 140px", padding: "0.55rem 0.85rem", fontSize: "0.85rem" }}
          >
            <option value="">All Risk Levels</option>
            <option value="Normal">Normal</option>
            <option value="At Risk">At Risk</option>
            <option value="High Attention">High Attention</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}>
            Apply Filter
          </button>
        </form>
      </div>

      {/* Assigned Students Roster Table */}
      <div className="glass-card" style={{ padding: "1.25rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Student</th>
              <th style={{ padding: "0.75rem 1rem" }}>Branch & Sem</th>
              <th style={{ padding: "0.75rem 1rem" }}>CGPA / Backlogs</th>
              <th style={{ padding: "0.75rem 1rem" }}>Aptitude</th>
              <th style={{ padding: "0.75rem 1rem" }}>Readiness Likelihood</th>
              <th style={{ padding: "0.75rem 1rem" }}>Risk Status</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No students found matching current filters.
                </td>
              </tr>
            ) : (
              students.map((stu) => {
                const prob = stu.latest_probability;
                let probColor = "#34d399";
                if (prob === null) probColor = "#94a3b8";
                else if (prob < 50) probColor = "#fb7185";
                else if (prob < 75) probColor = "#fbbf24";

                return (
                  <tr
                    key={stu.assignment_id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.2s ease"
                    }}
                  >
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stu.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stu.email}</div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ color: "var(--text-secondary)" }}>{stu.branch}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Semester {stu.semester}</div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{stu.cgpa.toFixed(2)} CGPA</div>
                      <div style={{ fontSize: "0.75rem", color: stu.backlogs > 0 ? "#fb7185" : "#34d399" }}>
                        {stu.backlogs === 0 ? "0 Backlogs" : `${stu.backlogs} Backlog(s)`}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{ fontWeight: 600 }}>{stu.aptitude_score}%</span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {prob !== null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, color: probColor }}>{prob}%</span>
                          <span className={prob >= 75 ? "badge badge-high" : prob >= 50 ? "badge badge-moderate" : "badge badge-low"} style={{ fontSize: "0.68rem" }}>
                            {stu.readiness_level}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Not Evaluated</span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className={
                          stu.risk_status === "Normal"
                            ? "badge badge-high"
                            : stu.risk_status === "At Risk"
                            ? "badge badge-moderate"
                            : "badge badge-low"
                        }
                        style={{ fontSize: "0.7rem" }}
                      >
                        {stu.risk_status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        onClick={() => openMentoringModal(stu)}
                        className="btn-secondary"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.78rem" }}
                      >
                        <MessageSquare size={14} /> Notes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mentoring & Notes Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? `Mentoring Profile: ${selectedStudent.name}` : "Mentoring"}
      >
        {selectedStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Student Snapshot */}
            <div style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-glass)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              fontSize: "0.825rem"
            }}>
              <div><strong>Branch:</strong> {selectedStudent.branch}</div>
              <div><strong>Semester:</strong> {selectedStudent.semester}</div>
              <div><strong>CGPA:</strong> {selectedStudent.cgpa}</div>
              <div><strong>Backlogs:</strong> {selectedStudent.backlogs}</div>
              <div><strong>Aptitude Score:</strong> {selectedStudent.aptitude_score}%</div>
              <div>
                <strong>Placement Likelihood:</strong>{" "}
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {selectedStudent.latest_probability !== null ? `${selectedStudent.latest_probability}%` : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Technical Skills Verified</label>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.03)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                {selectedStudent.technical_skills}
              </div>
            </div>

            <div>
              <label className="form-label">Intervention & Risk Status</label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value)}
                className="form-select"
              >
                <option value="Normal">Normal - On Track</option>
                <option value="At Risk">At Risk - Backlog/Low Aptitude</option>
                <option value="High Attention">High Attention - Urgent Intervention</option>
              </select>
            </div>

            <div>
              <label className="form-label">Faculty Mentoring Notes & Counseling Record</label>
              <textarea
                rows={4}
                value={mentorNotes}
                onChange={(e) => setMentorNotes(e.target.value)}
                placeholder="Log mock interview feedback, recommended remedial classes, or student progress..."
                className="form-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updatingNote}
                className="btn-primary"
              >
                <Save size={16} />
                {updatingNote ? "Saving..." : "Save Mentoring Notes"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
