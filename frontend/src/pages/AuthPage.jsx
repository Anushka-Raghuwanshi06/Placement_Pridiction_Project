import React, { useState } from "react";
import { Sparkles, Lock, Mail, User, GraduationCap, Users, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const AuthPage = () => {
  const { login, register, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      setFormError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setLoading(true);
    setFormError("");
    try {
      await login(email, password);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      position: "relative"
    }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
            marginBottom: "1rem"
          }}>
            <Sparkles size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
            Campus Placement Intelligence
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Predictive ML modeling, skill gap diagnostics, and institutional analytics
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            marginBottom: "1.5rem"
          }}>
            <button
              onClick={() => { setIsLogin(true); setFormError(""); }}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: isLogin ? "var(--primary)" : "transparent",
                color: isLogin ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setFormError(""); }}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: !isLogin ? "var(--primary)" : "transparent",
                color: !isLogin ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Register
            </button>
          </div>

          {(formError || error) && (
            <div style={{
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fb7185",
              padding: "0.65rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.825rem",
              marginBottom: "1.25rem"
            }}>
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {!isLogin && (
              <>
                <div>
                  <label className="form-label">Full Name</label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Anushka Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      style={{ paddingLeft: "2.4rem" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty / Placement Mentor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft: "2.4rem" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft: "2.4rem" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", padding: "0.8rem" }}
            >
              {loading ? "Processing..." : isLogin ? "Sign In to Portal" : "Create Account"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Sign-ins */}
          <div style={{ marginTop: "1.75rem", borderTop: "1px solid var(--border-glass)", paddingTop: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", marginBottom: "0.85rem" }}>
              Quick 1-Click Demo Accounts
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => handleQuickLogin("student@college.edu", "Student@123")}
                className="btn-secondary"
                style={{ justifyContent: "flex-start", fontSize: "0.825rem", padding: "0.55rem 0.85rem" }}
              >
                <GraduationCap size={16} style={{ color: "#818cf8" }} />
                <div style={{ textAlign: "left", flex: 1 }}>
                  <strong>Student:</strong> Anushka Sharma (CGPA 8.85)
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("faculty@college.edu", "Faculty@123")}
                className="btn-secondary"
                style={{ justifyContent: "flex-start", fontSize: "0.825rem", padding: "0.55rem 0.85rem" }}
              >
                <Users size={16} style={{ color: "#22d3ee" }} />
                <div style={{ textAlign: "left", flex: 1 }}>
                  <strong>Faculty:</strong> Dr. Arvind Sharma (Dean)
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@college.edu", "Admin@123")}
                className="btn-secondary"
                style={{ justifyContent: "flex-start", fontSize: "0.825rem", padding: "0.55rem 0.85rem" }}
              >
                <ShieldCheck size={16} style={{ color: "#fb7185" }} />
                <div style={{ textAlign: "left", flex: 1 }}>
                  <strong>Admin:</strong> System Administrator
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Advisory Disclaimer */}
        <div style={{ marginTop: "1.25rem" }}>
          <AdvisoryBanner compact={true} />
        </div>
      </div>
    </div>
  );
};
