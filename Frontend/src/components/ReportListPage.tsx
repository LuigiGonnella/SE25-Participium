import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Alert, Spinner, Button } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, User, Staff } from "../models/Models.ts";
import { ReportStatus, isMPRO, isTOSM, isEM } from "../models/Models.ts";
import {getReportStatusBorderColor} from "../utils/reportUtils.ts";


interface ReportListProps {
    user: User;
}

export default function ReportListPage({ user }: ReportListProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [assigningId, setAssigningId] = useState<number | null>(null);
    const [assigningToMaintainer, setAssigningToMaintainer] = useState<number | null>(null);

    const [assignedToMe, setAssignedToMe] = useState<boolean>(false);

    const [EMlist, setEMlist] = useState<Staff[]>([]);
    const [username, setUsername] = useState<string>("");

    // FILTER STATE
    const [statusFilter, setStatusFilter] = useState("");

    const getStatusOptions = () => {
        if (isTOSM(user) || isEM(user)) {
            return [
                { value: "ASSIGNED", label: ReportStatus.ASSIGNED },
                { value: "IN_PROGRESS", label: ReportStatus.IN_PROGRESS },
                { value: "SUSPENDED", label: ReportStatus.SUSPENDED },
                { value: "RESOLVED", label: ReportStatus.RESOLVED },
            ];
        }
        return [
            { value: "PENDING", label: ReportStatus.PENDING },
            { value: "ASSIGNED", label: ReportStatus.ASSIGNED },
            { value: "REJECTED", label: ReportStatus.REJECTED },
        ];
    };

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            const filters: Record<string, string> = {};
            if (statusFilter) filters.status = statusFilter;

            const data = await API.getReports(filters);
            setReports(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load reports";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const selectExternalCategory = async (report: Report): Promise<void> => {
        const state = await API.getEMStaffByCategory(report.category);
        setEMlist(state);
        setAssigningToMaintainer(report.id);
    }

    const handleAssign = async (reportId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setAssigningId(reportId);
        try {
            const updatedReport = await API.assignReportToSelf(reportId);
            setReports(prevReports =>
                prevReports.map(r => r.id === reportId ? updatedReport : r)
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to assign report";
            setError(errorMessage);
        } finally {
            setAssigningId(null);
        }
    };

    const handleAssignToMaintainer = async (report: Report, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const updatedReport = await API.assignReportToMaintainer(report, username);
            setReports(prevReports =>
                prevReports.map(r => r.id === report.id ? updatedReport : r)
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to assign report to maintainer";
            setError(errorMessage);
        } finally {
            setAssigningToMaintainer(null);
        }
    };

    const canAssignToSelf = (report: Report) =>
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && !report.assignedStaff;

    const canAssignToEM = (report: Report) =>
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && report.assignedStaff === user.username && !report.assignedEM && !report.isExternal;

    const filteredReports = reports.filter(r => {
        if (isMPRO(user)) {
            return true;
        }

        if (!assignedToMe) {
            return true;
        }

        return r.assignedStaff === user.username || r.assignedEM === user.username;
    });

    return (
        <div className="d-flex flex-column">
            <div className="container px-3 px-md-4 py-2 py-md-3" style={{ maxWidth: "1000px" }}>
                <h2 className="mb-2 mb-md-3 fs-3 fs-md-2">Reports</h2>

                {/* FILTER SECTION */}
                <div className="mb-2 d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
                    <select
                        className="form-select form-select-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "auto", minWidth: "150px" }}
                    >
                        <option value="">All statuses</option>
                        {getStatusOptions().map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    {(isTOSM(user) || isEM(user)) &&
                        <div className="d-flex align-items-center gap-2">
                            <input type="checkbox" onChange={(v) => setAssignedToMe(v.target.checked)} id="assignedToMeCheckbox" />
                            <label htmlFor="assignedToMeCheckbox" className="mb-0 small">Assigned to me</label>
                        </div>}
                </div>
            </div>

            {/* LOADING */}
            {loading && (
                <div className="text-center mt-4">
                    <Spinner animation="border" />
                </div>
            )}

            {/* ERROR */}
            {!loading && error && (
                <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "1400px" }}>
                    <Alert variant="danger" className="mb-2">{error}</Alert>
                </div>
            )}

            {/* REPORT LIST */}
            {!loading && filteredReports.length > 0 && (
                <div className="container-fluid px-3 px-md-4 pb-3" style={{ maxWidth: "1000px" }}>
                    <div className="list-group gap-2">
                        {filteredReports.map((r) => (
                            <div key={r.id}>
                                {isMPRO(user) && (
                                    <div
                                        className="list-group-item"
                                        style={{
                                            padding: "1rem",
                                            borderLeft: "4px solid " + getReportStatusBorderColor(r.status),
                                        }}
                                    >
                                        <div className="d-flex flex-column flex-lg-row gap-3">
                                            <Link
                                                to={`/reports/${r.id}`}
                                                className="text-decoration-none text-dark flex-grow-1"
                                            >
                                                <h5 className="mb-2 fw-semibold">{r.title}</h5>
                                                <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 flex-wrap small text-muted">
                                                    <span>Status: <strong className="text-dark">{r.status}</strong></span>
                                                    <span className="d-none d-md-inline">•</span>
                                                    <span>Category: <strong className="text-dark">{r.category}</strong></span>
                                                    {(r.assignedStaff || r.assignedEM) && (
                                                        <>
                                                            <span className="d-none d-md-inline">•</span>
                                                            <span>Assigned to: <strong className="text-dark">
                                                                {r.assignedStaff && r.assignedEM
                                                                    ? `${r.assignedStaff}, ${r.assignedEM}`
                                                                    : r.assignedStaff || r.assignedEM}
                                                            </strong></span>
                                                        </>
                                                    )}
                                                    </div>
                                            </Link>

                                            <div className="d-flex flex-column gap-1 align-self-start text-end" style={{ minWidth: "100px" }}>
                                                <span className="text-muted small">
                                                    {new Date(r.timestamp).toLocaleDateString('it-IT', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })} {new Date(r.timestamp).toLocaleTimeString('it-IT', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                </span>
                                                {r.isExternal && (
                                                    <span className="badge bg-info text-dark" style={{ fontSize: "0.7rem" }}>
                                                        External
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}


                                    {(isTOSM(user) || isEM(user)) && (
                                        <div
                                            className="list-group-item"
                                            style={{
                                                padding: "1rem",
                                                borderLeft: "4px solid " + getReportStatusBorderColor(r.status),
                                            }}
                                        >
                                            <div className="d-flex flex-column flex-lg-row gap-3">
                                                <Link
                                                    to={`/reports/${r.id}`}
                                                    className="text-decoration-none text-dark flex-grow-1"
                                                >
                                                    <h5 className="mb-2 fw-semibold">{r.title}</h5>
                                                    <div className="d-flex flex-column flex-md-row gap-2 gap-md-3 flex-wrap small text-muted">
                                                        <span>Status: <strong className="text-dark">{r.status}</strong></span>
                                                        <span className="d-none d-md-inline">•</span>
                                                        <span>Category: <strong className="text-dark">{r.category}</strong></span>
                                                        {(r.assignedStaff) && (
                                                            <>
                                                                <span className="d-none d-md-inline">•</span>
                                                                <span>Assigned: <strong className="text-dark">{r.assignedStaff}</strong></span>
                                                            </>
                                                        )}
                                                        {(r.isExternal) && (
                                                            <>
                                                                <span className="d-none d-md-inline">•</span>
                                                                <span>External: <strong className="text-dark">
                                                                    {r.assignedEM ? r.assignedEM : "Unregistered EM"}
                                                                </strong></span>
                                                            </>
                                                        )}
                                                        <span className="d-none d-md-inline">•</span>
                                                        <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                </Link>

                                                <div className="d-flex flex-column gap-2 align-self-start" style={{ minWidth: "200px" }}>
                                                    {canAssignToSelf(r) && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={(e) => handleAssign(r.id, e)}
                                                            disabled={assigningId === r.id}
                                                            className="w-100"
                                                        >
                                                            {assigningId === r.id ? "Assigning..." : "Assign To Me"}
                                                        </Button>
                                                    )}
                                                    {canAssignToEM(r) && (
                                                        <>
                                                            {(assigningToMaintainer !== r.id) ? (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => selectExternalCategory(r)}
                                                                    disabled={assigningToMaintainer === r.id}
                                                                    className="w-100"
                                                                >Assign to External Maintainer
                                                                </Button>
                                                            ) : (
                                                                <div className="d-flex flex-column gap-2">
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={username}
                                                                        onChange={(e) => setUsername(e.target.value)}
                                                                    >
                                                                        <option value="">Unregistered EM</option>
                                                                        {EMlist.map((em) => (
                                                                            <option key={em.username} value={em.username}>{em.name} ({em.username})</option>
                                                                        ))}
                                                                    </select>
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={(e) => handleAssignToMaintainer(r, e)}
                                                                        className="w-100"
                                                                    >Assign
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && filteredReports.length === 0 && (
                <div className="container-fluid px-3 px-md-4 text-center mt-4" style={{ maxWidth: "1400px" }}>
                    <p className="text-muted">No reports found.</p>
                </div>
            )}
        </div>
    );
}
