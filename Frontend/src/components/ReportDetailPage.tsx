import {useEffect, useState} from "react";
import {useParams} from "react-router";
import API, {STATIC_URL} from "../API/API.mts";
import {
    isMPRO,
    isStaff,
    isTOSM,
    isEM,
    type Message,
    OfficeCategory,
    type Report,
    ReportStatus,
    type User
} from "../models/Models.ts";
import {Card, Carousel, CarouselSlide} from "design-react-kit";
import {Alert, Button, Col, Form, Row } from "react-bootstrap";
import {getReportStatusColor} from "../utils/reportUtils.ts";

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

  // Message state
  const [messageLoading, setMessageLoading] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [publicMessage, setPublicMessage] = useState<string>("");
  const [privateMessage, setPrivateMessage] = useState<string>("");

  const [statusUpdate, setStatusUpdate] = useState("");

  const categoryOptions = Object.entries(OfficeCategory) as [string, string][];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await API.getReportById(Number(id));
        setReport(data);

        // Load messages
        setLoadingMessages(true);
        try {
          const msgs = await API.getAllMessages(Number(id));
          setMessages(msgs);
        } catch (err) {
          console.error("Failed to load messages:", err);
        } finally {
          setLoadingMessages(false);
        }

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
          payload.category = categoryInput;
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

  const handleMessage = async (e: React.FormEvent, isPrivate: boolean) => {
    e.preventDefault();
    if (!report || !user || !(isTOSM(user)||isEM(user)) ) return;
    setMessageLoading(true);
    setMessageError("");

    try {
    const message = isPrivate ? privateMessage : publicMessage;
      await API.createMessage(report.id, message, isPrivate);

      if (isPrivate) {
        setPrivateMessage("");
      } else {
        setPublicMessage("");
      }

      // Reload messages
      const msgs = await API.getAllMessages(report.id);
      setMessages(msgs);

      const updateReport = await API.getReportById(report.id);
      setReport(updateReport);
      } catch (err: any) {
      setMessageError(err?.details || "Failed to send message");
      } finally {
      setMessageLoading(false);
      }
    };

    const handleStatusUpdate = async () => {
        setError("");
        if (!statusUpdate || !report || !isStaff(user)) return;

        try {
            const data: any = { status: statusUpdate };
            if (statusUpdate === "RESOLVED" && commentInput) {
                data.comment = commentInput;
            }

            const updatedReport = await API.updateReport(report?.id, data, user.role);

            setReport(updatedReport);

            // Clear the status update and comment for this report
            setStatusUpdate("");
            setCommentInput("");
        } catch (err: any) {
            setError(err.details || "Failed to update report");
        }
    };

  if (loading) return <p className="p-5 text-center">Loading...</p>;
  if (error && !report) return <p className="p-5 text-danger text-center">{error}</p>;
  if (!report) return <p className="p-5 text-center">Report not found</p>;

return (
  <div className="container-fluid py-4">

            <div className="row">
                {/* LEFT COLUMN — REPORT DETAILS */}
                <div className={(
                    (isTOSM(user) && report.assignedStaff === user.username) ||
                    report.status === ReportStatus.PENDING) ||
                    (isEM(user) && report.assignedEM === user.username)
                    ? "col-md-8" : "col-12"}>
                    <div className="card shadow-sm h-100 d-flex flex-column">
                        <div className="card-header">
                            <h2>{report.title}</h2>
                            <p className="text-muted">{new Date(report.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="row p-4">
                            <div className="col col-md-6 ps-3">

                                <h5>Status</h5>
                                <p>
                                  <span className={`badge ${getReportStatusColor(report.status)}`}>
                                    {report.status}
                                  </span>
                                </p>

                                {report.comment && (
                                    <>
                                        {report.status === ReportStatus.REJECTED ? (
                                            <h5>Rejection Reason</h5>
                                        ) : (
                                            <h5>Staff Comment</h5>
                                        )}
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
                                    <br/>
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

                                {isTOSM(user) && report.assignedEM && (
                                    <>
                                        <h5>External Maintainer</h5>
                                        <p>{report.assignedEM}</p>
                                    </>
                                )}
                            </div>

                            <div className="col-md-6">
                                <h5>Photos</h5>
                                <Carousel type="landscape">
                                    {report.photos.map((photo, index) => (
                                        <CarouselSlide key={index}>
                                            <Card className="pb-0" rounded shadow="sm">
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        width: "100%",
                                                        maxHeight: "400px",      // altezza massima del riquadro
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <img
                                                        src={`${STATIC_URL}${photo}`}
                                                        alt={`img_${index}`}
                                                        style={{
                                                            width: "100%",          // piena larghezza
                                                            height: "100%",
                                                            objectFit: "contain",   // mostra tutta la foto (orizzontale/verticale)
                                                            display: "block",
                                                        }}
                                                    />
                                                </div>
                                            </Card>
                                        </CarouselSlide>
                                    ))}
                                </Carousel>
                            </div>
                        </div>
                        { ((isTOSM(user) || isEM(user)) && (report.assignedStaff === user.username || report.assignedEM === user.username)) &&
                        <div className="row px-4">
                            {!loading && error && <Alert variant="danger">{error}</Alert>}
                            <div className="ms-4 pt-3">
                                <Row>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label><strong>Update Status</strong></Form.Label>
                                            <Form.Select
                                                value={statusUpdate}
                                                onChange={(e) => setStatusUpdate(e.target.value)}
                                            >
                                                <option value="">Select new status...</option>
                                                {Object.entries(ReportStatus).filter(s => s[1] !== report.status && ["IN_PROGRESS", "SUSPENDED", "RESOLVED"].includes(s[0])).map(([key, value]) => (
                                                    <option value={key}>{value}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {statusUpdate === "RESOLVED" && (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Comment (Optional)</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={commentInput}
                                                    onChange={(e) => setCommentInput(e.target.value)}
                                                    placeholder="Add a comment..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>
                                {statusUpdate && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => handleStatusUpdate()}
                                        disabled={saving}
                                    >
                                        {saving ? "Updating..." : "Update Status"}
                                    </Button>
                                )}
                            </div>
                        </div>}
                    </div>
                </div>

                <div className="col-md-4">
                    {/* RIGHT COLUMN — MESSAGES CHAT (for TOSM) */}
    {user && ((isTOSM(user) && report.assignedStaff === user.username)
        || (isEM(user) && report.assignedEM === user.username)) && (
        <div className="card shadow-sm h-100 d-flex flex-column">
            <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Communications</h5>
                </div>
            </div>
            
            <div className="card-body p-0 flex-grow-1">
                
                {/* CITIZEN CHAT SECTION */}
                {isTOSM(user) && (<div className="border-bottom">
                    <div 
                        className="d-flex justify-content-between align-items-center p-3 bg-primary bg-opacity-10 cursor-pointer"
                        data-bs-toggle="collapse" 
                        data-bs-target="#citizenChat"
                        aria-expanded="true"
                        style={{cursor: "pointer"}}
                    >
                        <div className="d-flex align-items-center">
                            <i className="bi bi-broadcast-pin me-2 text-primary"></i>
                            <span className="fw-semibold">Public Messages</span>
                        </div>
                        <i className="bi bi-chevron-down"></i>
                    </div>

                    <div className="collapse show" id="citizenChat">
                        <div className="flex-grow-1 d-flex flex-column">
                            {/* Messages Display */}
                            <div className="flex-grow-1 overflow-auto mb-3 border-bottom p-3" style={{maxHeight: "calc(70vh - 250px)", backgroundColor: "#f0f8ff"}}>
                                {(() => {
                                    if (loadingMessages) {
                                        return <div className="text-center text-muted">Loading messages...</div>;
                                    }
                                    const publicMessages = messages.filter(msg => !msg.isPrivate);
                                    if (publicMessages.length === 0) {
                                        return <div className="text-center text-muted">No public messages yet.</div>;
                                    }
                                    return (
                                        <div className="d-flex flex-column-reverse gap-2">
                                            {publicMessages.map((msg, index) => (
                                                <div key={`${msg.timestamp}-${index}`} className="d-flex flex-column p-3 rounded shadow-sm"
                                                     style={{backgroundColor: "#cde6ff"}}>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="fw-bold text-primary">
                                                            <i className="bi bi-person-circle me-2"></i>You
                                                        </span>
                                                        <span className="text-muted" style={{fontSize: "0.85rem"}}>
                                                            {new Date(msg.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="ps-4" style={{ whiteSpace: "pre-line" }}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Message Input */}
                                <div className="mt-auto mb-3">
                                    <form onSubmit={(e) => handleMessage(e, false)}>
                                    <div className="mb-2">
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={publicMessage}
                                            onChange={(e) => setPublicMessage(e.target.value)}
                                            required
                                                placeholder="Type your message here."
                                            disabled={messageLoading}
                                        />
                                    </div>
                                    {messageError && <div className="alert alert-danger py-2 mb-2">{messageError}</div>}
                                    <button type="submit" className="btn btn-primary w-100"
                                            disabled={messageLoading || !publicMessage.trim()}>
                                        <i className="bi bi-send me-2"></i>{messageLoading ? "Sending..." : "Send Message"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>)}

                {/* INTERNAL MESSAGES SECTION */}
                {((isTOSM(user) && report.assignedEM) || isEM(user)) && (<div>
                    <div 
                        className="d-flex justify-content-between align-items-center p-3 bg-warning bg-opacity-10 cursor-pointer"
                        data-bs-toggle="collapse" 
                        data-bs-target="#staffChat"
                        aria-expanded="true"
                        style={{cursor: "pointer"}}
                    >
                        <div className="d-flex align-items-center">
                            <i className="bi bi-lock me-2 text-warning"></i>
                            <span className="fw-semibold">Internal Notes</span>
                        </div>
                        <i className="bi bi-chevron-down"></i>
                    </div>
                    
                    <div className="collapse show" id="staffChat">
                        <div className="flex-grow-1 d-flex flex-column">
                            {/* Messages Display */}
                            <div className="flex-grow-1 overflow-auto mb-3 border-bottom p-3" style={{maxHeight: "calc(70vh - 250px)", backgroundColor: "#fffbf0"}}>
                                {(() => {
                                    if (loadingMessages) {
                                        return <div className="text-center text-muted">Loading notes...</div>;
                                    }
                                    const privateMessages = messages.filter(msg => msg.isPrivate);
                                    if (privateMessages.length === 0) {
                                        return <div className="text-center text-muted">No internal notes yet.</div>;
                                    }
                                    return (
                                        <div className="d-flex flex-column-reverse gap-2">
                                            {privateMessages.map((msg, index) => (
                                                <div key={`${msg.timestamp}-${index}`} className="d-flex flex-column p-3 rounded shadow-sm"
                                                     style={{backgroundColor: "#fff3cd"}}>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="fw-bold text-warning">
                                                            <i className="bi bi-person-circle me-2"></i>
                                                            {(isTOSM(user) && msg.staffUsername === user.username)
                                                                || (isEM(user) && msg.staffUsername === user.username) ? (
                                                                "You"
                                                            ) : (
                                                                `${msg.staffUsername}`
                                                            )}
                                                        </span>
                                                        <span className="text-muted" style={{fontSize: "0.85rem"}}>
                                                            {new Date(msg.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="ps-4" style={{ whiteSpace: "pre-line" }}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Message Input */}
                            <div className="mt-auto">
                                    <form onSubmit={(e) => handleMessage(e, true)}>
                                    <div className="mb-2">
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={privateMessage}
                                            onChange={(e) => setPrivateMessage(e.target.value)}
                                            required
                                            placeholder="Type your message here."
                                            disabled={messageLoading}
                                        />
                                    </div>
                                    {messageError && <div className="alert alert-danger py-2 mb-2">{messageError}</div>}
                                    <button type="submit" className="btn btn-warning w-100"
                                            disabled={messageLoading || !privateMessage.trim()}>
                                        <i className="bi bi-send me-2"></i>{messageLoading ? "Sending..." : "Send Message"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    )}

                    {/* RIGHT COLUMN — MANAGE REPORT (for MPRO) */}
                    {user && isMPRO(user) && report.status === ReportStatus.PENDING && (
                        <div className="card shadow-sm p-3">

                            <h4 className="mb-3">Manage Report</h4>

                            {success && <div className="alert alert-success">{success}</div>}
                            {error && <div className="alert alert-danger">{error}</div>}

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
                                                .filter(([key]) => ![report.category, OfficeCategory.MOO].includes(OfficeCategory[key as keyof typeof OfficeCategory]))
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
                    )}
                </div>
            </div>

        </div>
    );
}