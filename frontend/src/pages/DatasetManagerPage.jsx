import React, { useState, useEffect } from "react";
import { 
  Database, 
  UploadCloud, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { api } from "../api/client";
import { AdvisoryBanner } from "../components/common/AdvisoryBanner";
import { Modal } from "../components/common/Modal";

export const DatasetManagerPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Preview Modal
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await api.getDatasets();
      setDatasets(data || []);
    } catch (err) {
      console.error("Failed to load datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setErrorMsg("");
      setValidationResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.uploadDataset(formData);
      setValidationResult(res);
      fetchDatasets();
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (datasetId) => {
    try {
      setLoadingPreview(true);
      setIsPreviewOpen(true);
      const data = await api.previewDataset(datasetId);
      setPreviewData(data);
    } catch (err) {
      console.error("Failed to preview dataset:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (datasetId) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;
    try {
      await api.deleteDataset(datasetId);
      setDatasets((prev) => prev.filter((d) => d.dataset_id !== datasetId));
    } catch (err) {
      console.error("Failed to delete dataset:", err);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AdvisoryBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Dataset Management & Ingestion</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Upload, validate, and manage institutional training datasets for ML pipelines
          </p>
        </div>

        <button onClick={fetchDatasets} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Upload Drag/Drop Card */}
      <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{
          border: "2px dashed var(--border-glass-hover)",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem 1.5rem",
          background: "rgba(15, 23, 42, 0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "rgba(99, 102, 241, 0.15)",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <UploadCloud size={28} style={{ color: "var(--primary-light)" }} />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Upload Placement Training Dataset
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "480px", margin: "0.5rem auto 1.5rem" }}>
            Supports <code>.CSV</code> and <code>.XLSX</code> files. Schema must contain columns: 
            <code>cgpa</code>, <code>percentage</code>, <code>backlogs</code>, <code>aptitude_score</code>, <code>technical_skills</code>, <code>placed</code>.
          </p>

          <label className="btn-primary" style={{ cursor: "pointer", padding: "0.75rem 1.75rem" }}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            {uploading ? "Validating & Ingesting..." : "Choose File to Upload"}
          </label>
        </div>
      </div>

      {/* Validation Feedback */}
      {validationResult && (
        <div
          className="glass-card"
          style={{
            padding: "1.25rem 1.5rem",
            background: validationResult.is_valid ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
            border: `1px solid ${validationResult.is_valid ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
            {validationResult.is_valid ? (
              <CheckCircle size={20} style={{ color: "#34d399" }} />
            ) : (
              <XCircle size={20} style={{ color: "#f43f5e" }} />
            )}
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: validationResult.is_valid ? "#34d399" : "#fb7185" }}>
              {validationResult.message}
            </h4>
          </div>

          <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <div>Total Rows: <strong>{validationResult.total_rows}</strong></div>
            <div>Valid Rows: <strong style={{ color: "#34d399" }}>{validationResult.valid_rows}</strong></div>
            <div>Invalid Rows: <strong style={{ color: "#fb7185" }}>{validationResult.invalid_rows}</strong></div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", color: "#fb7185", fontSize: "0.85rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Datasets List */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Ingested Datasets Registry
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem 1rem" }}>File Name</th>
                <th style={{ padding: "0.75rem 1rem" }}>Row Count</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem" }}>Validation Notes</th>
                <th style={{ padding: "0.75rem 1rem" }}>Upload Date</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No datasets uploaded yet.
                  </td>
                </tr>
              ) : (
                datasets.map((ds) => (
                  <tr key={ds.dataset_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileSpreadsheet size={16} style={{ color: "#38bdf8" }} />
                      <span>{ds.file_name}</span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>{ds.row_count} rows</td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span className={ds.status === "validated" ? "badge badge-high" : "badge badge-low"} style={{ fontSize: "0.68rem" }}>
                        {ds.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {ds.validation_notes}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {new Date(ds.upload_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handlePreview(ds.dataset_id)}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", marginRight: "0.4rem" }}
                      >
                        <Eye size={13} /> Preview
                      </button>
                      <button
                        onClick={() => handleDelete(ds.dataset_id)}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", color: "#fb7185" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewData ? `Dataset Preview: ${previewData.file_name}` : "Dataset Preview"}
        maxWidth="900px"
      >
        {loadingPreview ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading preview...</div>
        ) : previewData ? (
          <div>
            <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Displaying first 10 rows of {previewData.total_rows} total records.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.775rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                    {previewData.columns?.map((col, idx) => (
                      <th key={idx} style={{ padding: "0.5rem 0.75rem" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview?.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                      {previewData.columns?.map((col, cIdx) => (
                        <td key={cIdx} style={{ padding: "0.5rem 0.75rem" }}>
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
