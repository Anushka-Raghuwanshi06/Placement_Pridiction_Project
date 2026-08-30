import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  FileText, 
  Upload, 
  CheckCircle, 
  Save, 
  Sparkles, 
  AlertTriangle,
  Code2,
  BookOpen,
  Award
} from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const StudentProfilePage = ({ onAssessmentComplete }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [profile, setProfile] = useState({
    branch: "Computer Science & Engineering",
    semester: 7,
    phone: "",
    date_of_birth: "",
  });

  const [academic, setAcademic] = useState({
    cgpa: 7.5,
    percentage: 75.0,
    backlogs: 0,
    aptitude_score: 70.0,
  });

  const [skills, setSkills] = useState({
    technical_skills: "Python, SQL, React, Data Structures, Git",
    certifications: "AWS Cloud Practitioner",
    resume_path: null,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const fetchBundle = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentBundle();
      if (data.profile) setProfile(data.profile);
      if (data.academic) setAcademic(data.academic);
      if (data.skills) setSkills(data.skills);
    } catch (err) {
      console.error("Failed to load profile bundle:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundle();
  }, []);

  const validate = () => {
    const errs = {};
    if (academic.cgpa < 0 || academic.cgpa > 10) {
      errs.cgpa = "CGPA must be between 0.0 and 10.0";
    }
    if (academic.backlogs < 0) {
      errs.backlogs = "Backlogs cannot be negative";
    }
    if (academic.percentage < 0 || academic.percentage > 100) {
      errs.percentage = "Percentage must be between 0.0 and 100.0";
    }
    if (academic.aptitude_score < 0 || academic.aptitude_score > 100) {
      errs.aptitude_score = "Aptitude score must be between 0 and 100";
    }
    if (!skills.technical_skills?.trim()) {
      errs.technical_skills = "Please specify at least one technical skill";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAll = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await Promise.all([
        api.updateProfile(profile),
        api.updateAcademic(academic),
        api.updateSkills(skills),
      ]);

      setSuccessMsg("Academic records, skills, and profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".pdf", ".docx", ".doc"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMsg("Only .pdf and .docx resume files are supported.");
      return;
    }

    try {
      setUploadingResume(true);
      setErrorMsg("");
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.uploadResume(formData);
      setSkills((prev) => ({ ...prev, resume_path: res.resume_path }));
      setSuccessMsg(`Resume "${file.name}" uploaded successfully!`);
    } catch (err) {
      setErrorMsg(err.message || "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading academic profile...</div>;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Student Profile & Academic Records</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Maintain verified academic data, skills, certifications, and resume for placement algorithms
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-primary"
          style={{ fontSize: "0.9rem" }}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Profile Details"}
        </button>
      </div>

      {successMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#fb7185", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Academic Records Card */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
              <GraduationCap size={20} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Academic Performance</h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Validated academic parameters</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label">Cumulative GPA (0.0 - 10.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={academic.cgpa}
                onChange={(e) => setAcademic({ ...academic, cgpa: parseFloat(e.target.value) || 0 })}
                className="form-input"
              />
              {validationErrors.cgpa && <span style={{ color: "#fb7185", fontSize: "0.75rem" }}>{validationErrors.cgpa}</span>}
            </div>

            <div>
              <label className="form-label">Aggregate Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={academic.percentage}
                onChange={(e) => setAcademic({ ...academic, percentage: parseFloat(e.target.value) || 0 })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Active Backlogs Count</label>
              <input
                type="number"
                min="0"
                value={academic.backlogs}
                onChange={(e) => setAcademic({ ...academic, backlogs: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
              {validationErrors.backlogs && <span style={{ color: "#fb7185", fontSize: "0.75rem" }}>{validationErrors.backlogs}</span>}
            </div>

            <div>
              <label className="form-label">Aptitude Test Score (0 - 100)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={academic.aptitude_score}
                onChange={(e) => setAcademic({ ...academic, aptitude_score: parseFloat(e.target.value) || 0 })}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Student Profile Info */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ background: "rgba(6, 182, 212, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
              <BookOpen size={20} style={{ color: "#22d3ee" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Program & Enrollment</h3>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Institutional credentials</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label">Engineering Discipline / Branch</label>
              <select
                value={profile.branch}
                onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                className="form-select"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
              </select>
            </div>

            <div>
              <label className="form-label">Current Semester</label>
              <select
                value={profile.semester}
                onChange={(e) => setProfile({ ...profile, semester: parseInt(e.target.value) || 7 })}
                className="form-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills, Certifications, and Resume Section */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div style={{ background: "rgba(139, 92, 246, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
            <Code2 size={20} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Technical Skills & Resume Portfolio</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Parsed by ML feature extractor</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label">Technical Skills (Comma-separated)</label>
              <textarea
                rows={3}
                value={skills.technical_skills}
                onChange={(e) => setSkills({ ...skills, technical_skills: e.target.value })}
                className="form-textarea"
                placeholder="Python, Java, React, SQL, DSA, Docker, AWS, Git"
              />
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Add core languages, frameworks, databases, and tooling.
              </div>
            </div>

            <div>
              <label className="form-label">Certifications & Honors</label>
              <input
                type="text"
                value={skills.certifications || ""}
                onChange={(e) => setSkills({ ...skills, certifications: e.target.value })}
                className="form-input"
                placeholder="AWS Certified Practitioner, Meta React Specialization"
              />
            </div>
          </div>

          {/* Resume Upload Box */}
          <div style={{
            border: "2px dashed rgba(99, 102, 241, 0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.4)"
          }}>
            <div style={{
              background: "rgba(99, 102, 241, 0.15)",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem"
            }}>
              <Upload size={22} style={{ color: "var(--primary-light)" }} />
            </div>

            <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Upload Student Resume
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", marginBottom: "1rem" }}>
              Accepted formats: PDF or DOCX (Max 5MB)
            </p>

            <label className="btn-secondary" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleResumeUpload}
                style={{ display: "none" }}
              />
              {uploadingResume ? "Uploading..." : "Select Resume File"}
            </label>

            {skills.resume_path && (
              <div style={{ marginTop: "0.85rem", fontSize: "0.75rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <CheckCircle size={14} /> Resume verified and stored on server
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
