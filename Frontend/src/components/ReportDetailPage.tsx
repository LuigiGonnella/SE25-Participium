import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../API/API.mts";
import type { Report, User } from "../models/Models.ts";
import {
  isStaff,
  StaffRole,
  ReportStatus,
  OfficeCategory,
} from "../models/Models.ts";

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
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [staffInput, setStaffInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const isMpro = isStaff(user) && user.role === StaffRole.MPRO;
  const isTosm = isStaff(user) && user.role === StaffRole.TOSM;

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
    if (!report || !user || !isStaff(user)) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        status: statusInput || report.status,
        comment: commentInput || "",
      };

      // MPRO can also change category and assign staff
      if (isMpro) {
        if (categoryInput) payload.category = categoryInput; // send enum KEY like "WSO"
        if (staffInput) payload.staff = staffInput;
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

  const tosmStatusOptions = [
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.SUSPENDED,
    ReportStatus.RESOLVED,
  ];

  const allStatusOptions = Object.values(ReportStatus);

  const categoryOptions = Object.entries(OfficeCategory) as [string, string][];


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
          Lat: {report.latitude}, Lng: {report.longitude}
        </p>

        <h5>Photos</h5>
        <div className="d-flex gap-3 flex-wrap mb-3">
          <img src={report.photo1} width={150} />
          {report.photo2 && <img src={report.photo2} width={150} />}
          {report.photo3 && <img src={report.photo3} width={150} />}
        </div>

        <h5>Citizen</h5>
        {report.anonymous ? (
          <p><i>Anonymous report</i></p>
        ) : (
          <p>{report.citizen?.name} {report.citizen?.surname}</p>
        )}

        {report.comment && (
          <>
            <h5 className="mt-4">Comment</h5>
            <p>{report.comment}</p>
          </>
        )}

      </div>

      {/* RIGHT COLUMN — MANAGE REPORT (ONLY FOR STAFF) */}
      {(isMpro || isTosm) && (
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
                  {(isMpro ? allStatusOptions : tosmStatusOptions).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* MPRO OPTIONS */}
              {isMpro && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Category</label>
                    <select
                      className="form-select"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                    >
                      <option value="">Keep current</option>
                      {categoryOptions.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Assign Staff</label>
                    <input
                      type="text"
                      className="form-control"
                      value={staffInput}
                      onChange={(e) => setStaffInput(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                </>
              )}

              {/* COMMENT */}
              <div className="mb-3">
                <label className="form-label fw-bold">Comment</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
              </div>

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
      )}
    </div>

  </div>
);

}
