import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  Layers, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Zap,
  Sparkles,
  Check
} from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";

export const ModelRegistryPage = () => {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [retrainForm, setRetrainForm] = useState({
    algorithm: "RandomForest",
    dataset_id: "",
    version_label: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsData, datasetsData] = await Promise.all([
        api.getModelVersions(),
        api.getDatasets(),
      ]);
      setModels(modelsData || []);
      setDatasets(datasetsData?.filter((d) => d.status === "validated") || []);
    } catch (err) {
      console.error("Failed to load model registry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetrain = async (e) => {
    e.preventDefault();
    try {
      setRetraining(true);
      setErrorMsg("");
      setFeedbackMsg("");

      const payload = {
        algorithm: retrainForm.algorithm,
        dataset_id: retrainForm.dataset_id ? parseInt(retrainForm.dataset_id) : undefined,
        version_label: retrainForm.version_label || undefined,
      };

      const res = await api.retrainModel(payload);
      setFeedbackMsg(res.message);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || "Model retraining failed.");
    } finally {
      setRetraining(false);
    }
  };

  const handleActivate = async (modelId) => {
    try {
      setActivatingId(modelId);
      await api.activateModel(modelId);
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          is_active: m.model_id === modelId,
        }))
      );
      setFeedbackMsg("Active model version switched with zero downtime!");
      setTimeout(() => setFeedbackMsg(""), 3000);
    } catch (err) {
      console.error("Failed to activate model:", err);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>ML Model Version Registry & Retraining</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Zero-downtime model orchestration, hyperparameter evaluation, and versioning
          </p>
        </div>

        <button onClick={fetchData} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={16} /> {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#fb7185", fontSize: "0.85rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Retrain Workflow Panel */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "8px" }}>
            <Zap size={20} style={{ color: "var(--primary-light)" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Trigger Zero-Downtime Retraining</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Train a new artifact and register metrics with seamless hot-swapping
            </div>
          </div>
        </div>

        <form onSubmit={handleRetrain} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Algorithm Architecture</label>
            <select
              value={retrainForm.algorithm}
              onChange={(e) => setRetrainForm({ ...retrainForm, algorithm: e.target.value })}
              className="form-select"
            >
              <option value="RandomForest">Random Forest Classifier (Ensemble)</option>
              <option value="GradientBoosting">Gradient Boosting Classifier</option>
              <option value="LogisticRegression">Logistic Regression (L2 Regularized)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Training Dataset</label>
            <select
              value={retrainForm.dataset_id}
              onChange={(e) => setRetrainForm({ ...retrainForm, dataset_id: e.target.value })}
              className="form-select"
            >
              <option value="">Latest Master Dataset</option>
              {datasets.map((ds) => (
                <option key={ds.dataset_id} value={ds.dataset_id}>
                  {ds.file_name} ({ds.row_count} rows)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Custom Version Tag (Optional)</label>
            <input
              type="text"
              placeholder="e.g. v2.0-Production-RF"
              value={retrainForm.version_label}
              onChange={(e) => setRetrainForm({ ...retrainForm, version_label: e.target.value })}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={retraining}
            className="btn-primary"
            style={{ height: "42px", justifyContent: "center" }}
          >
            <Play size={16} className={retraining ? "animate-spin" : ""} />
            {retraining ? "Training Pipeline..." : "Train & Register Model"}
          </button>
        </form>
      </div>

      {/* Model Versions Registry Table */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Model Registry & Active Inference Config
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Version Tag</th>
                <th style={{ padding: "0.75rem 1rem" }}>Algorithm</th>
                <th style={{ padding: "0.75rem 1rem" }}>Accuracy</th>
                <th style={{ padding: "0.75rem 1rem" }}>Precision</th>
                <th style={{ padding: "0.75rem 1rem" }}>Recall</th>
                <th style={{ padding: "0.75rem 1rem" }}>F1-Score</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr
                  key={m.model_id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    background: m.is_active ? "rgba(99, 102, 241, 0.06)" : "transparent"
                  }}
                >
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Cpu size={16} style={{ color: m.is_active ? "#818cf8" : "#94a3b8" }} />
                      <span>{m.version_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "var(--text-secondary)" }}>{m.algorithm}</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#34d399" }}>
                    {(m.accuracy * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>{(m.precision * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.85rem 1rem" }}>{(m.recall * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{(m.f1_score * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    {m.is_active ? (
                      <span className="badge badge-high" style={{ fontSize: "0.68rem" }}>
                        <Check size={12} /> Active In-Prod
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)", fontSize: "0.68rem" }}>
                        Standby
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    {m.is_active ? (
                      <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Serving Live</span>
                    ) : (
                      <button
                        onClick={() => handleActivate(m.model_id)}
                        disabled={activatingId === m.model_id}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        {activatingId === m.model_id ? "Activating..." : "Set as Active"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
