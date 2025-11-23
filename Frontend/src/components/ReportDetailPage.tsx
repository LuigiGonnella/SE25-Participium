import { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../API/API.mts";
import type { Report, User } from "../models/Models.ts";
import {
  ReportStatus,
  isMPRO,
} from "../models/Models.ts";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api/v1', '') || "http://localhost:8080";

interface ReportDetailPageProps {
  user?: User;
}

export default function ReportDetailPage({ user }: ReportDetailPageProps) {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state for update actions
  const [statusInput, setStatusInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await API.getReportById(Number(id));
        setReport(data);
        // pre-fill status with current one
        setStatusInput(data.status);
      } catch (err: any) {
        setError(err?.details || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !user || !isMPRO(user)) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        status: statusInput || report.status,
      };

      if (statusInput === ReportStatus.REJECTED) {
        if (!commentInput.trim()) {
          setError("Comment is required when rejecting a report");
          setSaving(false);
          return;
        }
        payload.comment = commentInput.trim();
      }

      const updated = await API.updateReport(report.id, payload, user.role);
      setReport(updated);
      setSuccess("Report updated successfully.");
      // keep current values in the form
      setStatusInput(updated.status);
      setCommentInput("");
    } catch (err: any) {
      setError(err?.details || err?.message || "Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-5 text-center">Loading...</p>;
  if (error) return <p className="p-5 text-danger text-center">{error}</p>;
  if (!report) return <p className="p-5 text-center">Report not found</p>;

  const MPROStatusOptions = [
    ReportStatus.PENDING,
    ReportStatus.ASSIGNED,
    ReportStatus.REJECTED,
  ];

return (
  <div className="container py-4">

    <div className="row">
      {/* LEFT COLUMN — REPORT DETAILS */}
      <div className="col-md-8">

        <h2>{report.title}</h2>
        <p className="text-muted">{new Date(report.timestamp).toLocaleString()}</p>

        <h5>Description</h5>
        <p>{report.description}</p>

        <h5>Category</h5>
        <p>{report.category}</p>

        <h5>Status</h5>
        <p>{report.status}</p>

        <h5>Location</h5>
        <p>
          Lat: {report.coordinates?.[0] ?? 'N/A'}, Lng: {report.coordinates?.[1] ?? 'N/A'}
        </p>

        <h5>Photos</h5>
        <div className="d-flex gap-3 flex-wrap mb-3">
          {report.photos?.[0] && <img src={`${BACKEND_BASE_URL}${report.photos[0]}`} width={150} alt="Photo 1" />}
          {report.photos?.[1] && <img src={`${BACKEND_BASE_URL}${report.photos[1]}`} width={150} alt="Photo 2" />}
          {report.photos?.[2] && <img src={`${BACKEND_BASE_URL}${report.photos[2]}`} width={150} alt="Photo 3" />}
        </div>

        <h5>Citizen</h5>
        <p>{report.citizenUsername ?? 'Anonymous'}</p>
        {/*  
        {report.anonymous ? (
          <p><i>Anonymous report</i></p>
        ) : (
          <p>{report.citizen?.name} {report.citizen?.surname}</p>
        )}
        */}
        {report.comment && (
          <>
            <h5 className="mt-4">Comment</h5>
            <p>{report.comment}</p>
          </>
        )}

      </div>

      {/* RIGHT COLUMN — MANAGE REPORT */}
      {
        <div className="col-md-4">
          <div className="card shadow-sm p-3">

            <h4 className="mb-3">Manage Report</h4>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleUpdate}>

              {/* STATUS */}
              <div className="mb-3">
                <label className="form-label fw-bold">Status</label>
                <select
                  className="form-select"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  required
                >
                  <option value="" disabled>Select status</option>
                  {(MPROStatusOptions).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* COMMENT - only on REJECTED status */}
              {statusInput === ReportStatus.REJECTED && (
              <div className="mb-3">
                <label className="form-label fw-bold">
                 Comment <span className="text-danger">*</span>
                 </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  required={statusInput === ReportStatus.REJECTED}
                  placeholder = "Explain rejection's motivation"
                />
              </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={saving}
              >
                {saving ? "Saving..." : "Update"}
              </button>

            </form>
          </div>
        </div>
      }
    </div>

  </div>
);

}
