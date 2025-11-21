import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spinner, Button } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, User } from "../models/Models.ts";
import { ReportStatus, isStaff } from "../models/Models.ts";

interface ReportListProps {
    user: User;
}

export default function ReportListPage({ user }: ReportListProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [assigningId, setAssigningId] = useState<number | null>(null);

    // FILTER STATE
    const [statusFilter, setStatusFilter] = useState("");

    const loadReports = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (statusFilter) filters.status = statusFilter;

            const data = await API.getReports(filters);
            setReports(data);
        } catch (err: any) {
            setError(err.details || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [statusFilter]);

    const handleAssign = async (reportId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setAssigningId(reportId);
        try {
            await API.assignReportToSelf(reportId);
            await loadReports();
        } catch (err: any) {
            setError(err.details || "Failed to assign report");
        } finally {
            setAssigningId(null);
        }
    };

    const isTOSM = isStaff(user) && user.role === "Technical Office Staff Member";
    const canAssign = (report: Report) => 
        isTOSM && report.status === ReportStatus.PENDING && ReportStatus.ASSIGNED && !report.assignedStaff;

    return (
        <div className="container py-4">

            <h2 className="mb-4">Reports</h2>

            {/* FILTER SECTION */}
            <div className="mb-4 d-flex" style={{ gap: "1rem" }}>
                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ maxWidth: "250px" }}
                >
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RESOLVED">Resolved</option>
                </select>
            </div>

            {/* LOADING */}
            {loading && (
                <div className="text-center mt-5">
                    <Spinner animation="border" />
                </div>
            )}

            {/* ERROR */}
            {!loading && error && <Alert variant="danger">{error}</Alert>}

            {/* REPORT LIST */}
            {!loading && reports.length > 0 && (
                <div className="list-group">
                    {reports.map((r) => (
                        <div
                            key={r.id}
                            className="list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center"
                        >
                            <Link
                                to={`/reports/${r.id}`}
                                className="flex-grow-1 text-decoration-none text-dark"
                            >
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h5>{r.title}</h5>
                                        <p className="text-muted mb-1">
                                            Status: <strong>{r.status}</strong>
                                        </p>
                                        <p className="text-muted mb-0">
                                            Category: {r.category}
                                        </p>
                                        {r.assignedStaff && (
                                            <p className="text-muted mb-0">
                                                Assigned to: {r.assignedStaff}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-end">
                                        <small>{new Date(r.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                            </Link>
                            
                            {canAssign(r) && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => handleAssign(r.id, e)}
                                    disabled={assigningId === r.id}
                                    className="ms-3"
                                >
                                    {assigningId === r.id ? "Assigning..." : "Assign To Me"}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && reports.length === 0 && (
                <p className="text-muted">No reports found.</p>
            )}
        </div>
    );
}

