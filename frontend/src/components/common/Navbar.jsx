import React from "react";
import { 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  GraduationCap, 
  Users, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Building, 
  FileText,
  Activity,
  History
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificationDropdown } from "./NotificationDropdown";

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role?.toLowerCase();

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return <span className="badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.3)" }}>Admin</span>;
      case "faculty":
        return <span className="badge" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.3)" }}>Faculty</span>;
      default:
        return <span className="badge badge-role">Student</span>;
    }
  };

  return (
    <header style={{
      background: "rgba(15, 23, 42, 0.8)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border-glass)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      width: "100%"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setActiveTab("main")}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>EduPredict</span>
              <span style={{ fontSize: "0.75rem", color: "var(--secondary)", fontWeight: 600 }}>AI</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
              Placement Likelihood Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Tabs based on Role */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflowX: "auto" }}>
          {role === "student" && (
            <>
              <button
                className={activeTab === "student_dashboard" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("student_dashboard")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Activity size={16} /> Placement Assessment
              </button>
              <button
                className={activeTab === "student_profile" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("student_profile")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <GraduationCap size={16} /> Academic & Resume
              </button>
            </>
          )}

          {role === "faculty" && (
            <>
              <button
                className={activeTab === "faculty_dashboard" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("faculty_dashboard")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Users size={16} /> Assigned Students Roster
              </button>
            </>
          )}

          {role === "admin" && (
            <>
              <button
                className={activeTab === "admin_dashboard" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("admin_dashboard")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Activity size={16} /> Analytics & Reports
              </button>
              <button
                className={activeTab === "admin_datasets" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("admin_datasets")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Database size={16} /> Datasets
              </button>
              <button
                className={activeTab === "admin_models" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("admin_models")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Cpu size={16} /> Model Registry & Retrain
              </button>
              <button
                className={activeTab === "admin_companies" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("admin_companies")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <Building size={16} /> Companies
              </button>
              <button
                className={activeTab === "admin_audit" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("admin_audit")}
                style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
              >
                <ShieldAlert size={16} /> Audit Trail
              </button>
            </>
          )}
        </nav>

        {/* Right Section: Notifications & User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <NotificationDropdown />

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.35rem 0.65rem 0.35rem 0.45rem",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {user.name}
              </div>
              <div style={{ marginTop: "2px" }}>
                {getRoleBadge()}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary"
            title="Logout"
            style={{ padding: "0.5rem", borderRadius: "50%", width: "38px", height: "38px", justifyContent: "center" }}
          >
            <LogOut size={16} style={{ color: "#f43f5e" }} />
          </button>
        </div>
      </div>
    </header>
  );
};
