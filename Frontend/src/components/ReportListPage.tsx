import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, User } from "../models/Models.ts";

interface ReportListProps {
    user: User;
}

export default function ReportListPage({ user }: ReportListProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

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
                        <Link
                            key={r.id}
                            to={`/reports/${r.id}`}
                            className="list-group-item list-group-item-action p-3"
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
                                </div>
                                <div className="text-end">
                                    <small>{new Date(r.timestamp).toLocaleString()}</small>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && reports.length === 0 && (
                <p className="text-muted">No reports found.</p>
            )}
        </div>
    );
}
