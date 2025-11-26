import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Alert, Spinner, Button } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, User, Staff } from "../models/Models.ts";
import { ReportStatus, isMPRO, isTOSM } from "../models/Models.ts";

const getOfficeCategoryFromName = (officeName: string): string | undefined => {
    const mapping: Record<string, string> = {
        "Water Supply Office": "WSO",
        "Architectural Barriers Office": "ABO",
        "Sewer System Office": "SSO",
        "Public Lighting Office": "PLO",
        "Waste Office": "WO",
        "Road Signs and Traffic Lights Office": "RSTLO",
        "Roads and Urban Furnishings Office": "RUFO",
        "Public Green Areas and Playgrounds Office": "PGAPO",
    };
    return mapping[officeName];
};

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

    const getStatusOptions = () => {
        if (isTOSM(user)) {
            return [
                { value: "IN_PROGRESS", label: ReportStatus.IN_PROGRESS },
                { value: "SUSPENDED", label: ReportStatus.SUSPENDED },
                { value: "RESOLVED", label: ReportStatus.RESOLVED },
            ];
        }
        return [
            { value: ReportStatus.PENDING, label: "Pending" },
            { value: ReportStatus.ASSIGNED, label: "Assigned" },
            { value: ReportStatus.REJECTED, label: "Rejected" },
        ];
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            if (isMPRO(user)) { //can see all reports
                const filters: any = {};
                if (statusFilter) filters.status = statusFilter;

                const data = await API.getReports(filters);
                setReports(data);
            }
            else if (isTOSM(user)) { //can see only his office reports
                const filters: any = {};
                if (statusFilter) filters.status = statusFilter;
                
                // Filter by office category
                const category = getOfficeCategoryFromName((user as Staff).officeName);
                if (category) filters.category = category;

                const data = await API.getReports(filters);
                setReports(data);
            }
            
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

    const canAssign = (report: Report) => 
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && !report.AssignedStaff;

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
                    {getStatusOptions().map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
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
                            className="list-group-item p-3 d-flex justify-content-between align-items-center"
                        >
                            {isMPRO(user) &&  <Link
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
                                            Category: <strong>{r.category}</strong>
                                        </p>
                                        {r.AssignedStaff && (
                                            <p className="text-muted mb-0">
                                                Assigned to: <strong>{r.AssignedStaff}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-end">
                                        <small>{new Date(r.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                            </Link>}

                            {isTOSM(user) &&
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
                                            Category: <strong>{r.category}</strong>
                                        </p>
                                        {r.AssignedStaff && (
                                            <p className="text-muted mb-0">
                                                Assigned to: <strong>{r.AssignedStaff}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="d-flex flex-column justify-content-between">
                                        <div className="text-end">
                                            <small>{new Date(r.timestamp).toLocaleString()}</small>
                                        </div>
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
                                </div>
                                </Link>
                            }
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

