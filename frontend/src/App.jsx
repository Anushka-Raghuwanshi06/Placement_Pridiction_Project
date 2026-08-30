import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/common/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DatasetManagerPage } from "./pages/DatasetManagerPage";
import { ModelRegistryPage } from "./pages/ModelRegistryPage";
import { CompanyManagerPage } from "./pages/CompanyManagerPage";
import { AuditLogPage } from "./pages/AuditLogPage";

function MainLayout() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("main");

  // Sync default tab when user logs in or role changes
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        setActiveTab("admin_dashboard");
      } else if (user.role === "faculty") {
        setActiveTab("faculty_dashboard");
      } else {
        setActiveTab("student_dashboard");
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", color: "var(--text-secondary)" }}>
        Loading Placement Prediction System...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      // Student Views
      case "student_dashboard":
        return <StudentDashboard onNavigateToProfile={() => setActiveTab("student_profile")} />;
      case "student_profile":
        return <StudentProfilePage onAssessmentComplete={() => setActiveTab("student_dashboard")} />;

      // Faculty Views
      case "faculty_dashboard":
        return <FacultyDashboard />;

      // Admin Views
      case "admin_dashboard":
        return <AdminDashboard />;
      case "admin_datasets":
        return <DatasetManagerPage />;
      case "admin_models":
        return <ModelRegistryPage />;
      case "admin_companies":
        return <CompanyManagerPage />;
      case "admin_audit":
        return <AuditLogPage />;

      default:
        if (user.role === "admin") return <AdminDashboard />;
        if (user.role === "faculty") return <FacultyDashboard />;
        return <StudentDashboard onNavigateToProfile={() => setActiveTab("student_profile")} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-main)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, paddingBottom: "3rem" }}>
        {renderContent()}
      </main>
      <footer style={{
        textAlign: "center",
        padding: "1.5rem",
        color: "var(--text-muted)",
        fontSize: "0.75rem",
        borderTop: "1px solid var(--border-glass)",
        background: "rgba(15, 23, 42, 0.5)"
      }}>
        <div>
          EduPredict AI © 2026 — Institutional Campus Placement Intelligence System
        </div>
        <div style={{ marginTop: "4px", color: "rgba(245, 158, 11, 0.7)" }}>
          Notice: Predictions are advisory only and must not be presented as a placement guarantee anywhere in the UI or messaging.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
