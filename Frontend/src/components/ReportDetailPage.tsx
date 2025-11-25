import { useEffect, useState } from "react";
import { useParams } from "react-router";
import API from "../API/API.mts";
import type { Report, User } from "../models/Models.ts";
import {
  ReportStatus,
  OfficeCategory,
  isMPRO,
} from "../models/Models.ts";
import {STATIC_URL} from "../API/API.mts"

interface ReportDetailPageProps {
  user?: User;
}

export default function ReportDetailPage({ user }: ReportDetailPageProps) {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [streetName, setStreetName] = useState<string>("");

  // Form state for update actions
  const [statusInput, setStatusInput] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const categoryOptions = Object.entries(OfficeCategory) as [string, string][];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await API.getReportById(Number(id));
        setReport(data);

        if (data.coordinates && data.coordinates.length === 2) {
          const [lat, lng] = data.coordinates;
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
            const res = await fetch(url);
            const geoData = await res.json();

            const street =
              (geoData.address?.road + (geoData.address?.house_number ? " " + geoData.address.house_number : "")) ||
              geoData.address?.pedestrian ||
              geoData.address?.footway ||
              geoData.display_name ||
              "Unknown location";

            setStreetName(street);
          } catch (err) {
            console.error("Reverse geocoding failed:", err);
            setStreetName("Unknown location");
          }
        }
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
      const payload: any = {};
      if (statusInput === ReportStatus.REJECTED) {
        if (!commentInput.trim()) {
          setError("Comment is required when rejecting a report");
          setSaving(false);
          return;
        }
        payload.status = ReportStatus.REJECTED;
        payload.comment = commentInput.trim();
      } else if (statusInput === ReportStatus.ASSIGNED) {
        payload.status = ReportStatus.ASSIGNED;
      
        if (categoryInput) {
          payload.category = OfficeCategory[categoryInput as keyof typeof OfficeCategory];
        }
      }

      const updated = await API.updateReport(report.id, payload, user.role);
      setReport(updated);
      setSuccess("Report updated successfully.");
      // keep current values in the form
      setStatusInput("");
      setCategoryInput("");
      setCommentInput("");
    } catch (err: any) {
      setError(err?.details || err?.message || "Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-5 text-center">Loading...</p>;
  if (error && !report) return <p className="p-5 text-danger text-center">{error}</p>;
  if (!report) return <p className="p-5 text-center">Report not found</p>;

return (
  <div className="container py-4">

    <div className="row">
      {/* LEFT COLUMN — REPORT DETAILS */}
      <div className="col-md-8">

        <h2>{report.title}</h2>
        <p className="text-muted">{new Date(report.timestamp).toLocaleString()}</p>

        <h5>Status</h5>
        <p>
          <span className={`badge ${
          report.status === ReportStatus.PENDING ? 'bg-primary' :
          report.status === ReportStatus.ASSIGNED ? 'bg-success' :
          report.status === ReportStatus.REJECTED ? 'bg-danger' :
          'bg-secondary'
        }`}>
        {report.status}
        </span>

        </p>

                {report.comment && (
          <>
            <p>{report.comment}</p>
          </>
        )}

        <h5>Category</h5>
        <p>{report.category}</p>

        <h5>Description</h5>
        <p>{report.description}</p>

        <h5>Location</h5>
        <p>
            {streetName || "Loading address..."}
            <br />
            <small className="text-muted">
              ({report.coordinates[0].toFixed(6)}, {report.coordinates[1].toFixed(6)})
            </small>
        </p>

        <h5>Citizen</h5>
        <p>
        {report.citizenUsername ? (
        <>{report.citizenUsername}</>
        ) : (
        <i>Unknown</i>
        )}
        </p>

        {/*}
          Lat: {report.coordinates?.[0] ?? 'N/A'}, Lng: {report.coordinates?.[1] ?? 'N/A'}
        </p>*/}

         <div className="d-block mb-3">
            {report.photos[0] && (
              <img
                src={`${STATIC_URL}${report.photos[0]}`}
                width={400}
                alt="Photo 1"
                className="mb-3 d-block"
                onError={(e) => {
                  console.error('Failed to load photo 1');
                  e.currentTarget.style.display = 'none';
                }}/>
              )}
            {report.photos[1] && (
              <img
                src={`${STATIC_URL}${report.photos[1]}`}
                width={400}
                alt="Photo 2"
                className="mb-3 d-block"
                onError={(e) => {
                  console.error('Failed to load photo 2');
                  e.currentTarget.style.display = 'none';
                }}/>
              )}
            {report.photos[2] && (
              <img
                src={`${STATIC_URL}${report.photos[2]}`}
                width={400}
                alt="Photo 3"
                className="mb-3 d-block"
                onError={(e) => {
                  console.error('Failed to load photo 3');
                  e.currentTarget.style.display = 'none';
                }}/>
              )}
        </div>

      </div>

      {/* RIGHT COLUMN — MANAGE REPORT */}
      { user && isMPRO(user) && report.status === ReportStatus.PENDING && (
        <div className="col-md-4">
          <div className="card shadow-sm p-3">

            <h4 className="mb-3">Manage Report</h4>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

              {/* STATUS 
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
              </div>*/}

              {
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn btn-success btn-lg flex-fill ${
                      statusInput === ReportStatus.ASSIGNED 
                      ? 'btn-success'
                      : 'btn-success opacity-50'
                    }`}
                    onClick={() => {
                      if (statusInput === ReportStatus.ASSIGNED) {
                        setStatusInput("");
                        setCategoryInput("");
                      } else {
                        setStatusInput(ReportStatus.ASSIGNED);
                        setCommentInput(""); // Reset comment se era in Reject
                      }
                    }}
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    className={`btn btn-lg flex-fill ${
                      statusInput === ReportStatus.REJECTED 
                      ? 'btn-danger'
                      : 'btn-danger opacity-50'
                    }`}
                    onClick={() => {
                      if (statusInput === ReportStatus.REJECTED) {
                        setStatusInput("");
                        setCommentInput("");
                      } else {
                        setStatusInput(ReportStatus.REJECTED);
                        setCategoryInput("");
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              }

              {statusInput === ReportStatus.ASSIGNED && (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Category
                    </label>
                    <select
                      className="form-select"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                    >
                      <option value="">Keep current: {report.category}</option>
                      {categoryOptions
                          .filter(([key]) => OfficeCategory[key as keyof typeof OfficeCategory] !== report.category)
                          .map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                    </select>
                    <small className="text-muted">
                      Change category if needed before assignment.
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Confirm"}
                    </button>
                  </div>
                </form>
              )}

              {/* COMMENT - only on REJECTED status 
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
              )}*/}

              {/* REJECT FORM */}
              {statusInput === ReportStatus.REJECTED && (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      required
                      placeholder="Explain why this report is being rejected."
                    />
                    <small className="text-muted">
                      This comment will be visible to the citizen who submitted the report.
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Confirm"}
                    </button>
                  </div>
                </form>
              )}
          </div>
        </div>
     )}
    </div>

  </div>
  );
}