import {useCallback, useEffect, useState} from "react";
import {Link} from "react-router";
import {Alert, Button, Spinner} from "react-bootstrap";
import API from "../API/API.mts";
import {
    isEM,
    isMPRO,
    isTOSM,
    OfficeCategory,
    type Report,
    ReportStatus,
    type Staff,
    type User
} from "../models/Models.ts";
import {getCategoryLabel, getReportStatusBorderColor} from "../utils/reportUtils.ts";
import {APIError} from "../services/ErrorHandler.ts";
import {Col, Row} from "design-react-kit";


interface ReportListProps {
    user: User;
}

export default function ReportListPage({ user }: Readonly<ReportListProps>) {
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
    const [categoryFilter, setCategoryFilter] = useState("");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    const [titleFilter, setTitleFilter] = useState("");

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
        setError(undefined);
        setLoading(true);
        try {
            const filters: Record<string, string> = {};
            if (statusFilter) filters.status = statusFilter;
            if (categoryFilter) filters.category = categoryFilter;
            if (fromDateFilter) filters.fromDate = new Date(fromDateFilter).toISOString().slice(0,10);
            if (toDateFilter) filters.toDate = new Date(toDateFilter).toISOString().slice(0,10);
            if (titleFilter) filters.title = titleFilter;

            const data = await API.getReports(filters);
            setReports(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof APIError ? err.details : "Failed to load reports";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, fromDateFilter, statusFilter, titleFilter, toDateFilter]);

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
            const errorMessage = err instanceof APIError ? err.details : "Failed to assign report";
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
            const errorMessage = err instanceof APIError ? err.details : "Failed to assign report to maintainer";
            setError(errorMessage);
        } finally {
            setAssigningToMaintainer(null);
        }
    };

    const canAssignToSelf = (report: Report) =>
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && !report.assignedStaff;

    const canAssignToEM = (report: Report) =>
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && report.assignedStaff === user.username;

    const filteredReports = reports.filter(r => {
        if (isMPRO(user)) {
            return true;
        }

        if (!assignedToMe) {
            return true;
        }

        return r.assignedStaff === user.username || r.assignedEM === user.username;
    });

    const resetFilters = () => {
        setStatusFilter("");
        setCategoryFilter("");
        setFromDateFilter("");
        setToDateFilter("");
        setTitleFilter("");
    };

    const areFiltersActive = statusFilter || categoryFilter || fromDateFilter || toDateFilter || titleFilter;

    return (
        <div className="d-flex flex-column">
            <div className="container px-3 px-md-4 py-2 py-md-3" style={{ maxWidth: "1050px" }}>
                <Row className="d-flex align-items-center">
                    <Col className="col-8">
                        <h2 className="mb-2 mb-md-3 fs-2">Reports</h2>
                    </Col>
                    {(isTOSM(user) || isEM(user)) &&
                        <Col>
                            <Button className="p-1 float-end fw-normal" title="Only display reports assigned to me" variant={assignedToMe ? "success" : "outline-secondary"} size="sm" type="button" onClick={() => setAssignedToMe(prevState => !prevState)} id="assignedToMeCheckbox">Assigned to me</Button>
                        </Col>
                    }
                </Row>

                {/* FILTER SECTION */}
                <div className="mb-2 d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
                    <label>
                        Status:{' '}
                        <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: "auto", minWidth: "150px" }}
                        >
                            <option value="">Any</option>
                            {getStatusOptions().map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    { (isMPRO(user) || isTOSM(user) && user.officeNames.length > 1) &&
                        <label>
                            Category:{' '}
                            <select
                                className="form-select form-select-sm"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ width: "auto", minWidth: "150px" }}
                            >
                                <option value="">Any</option>

                                {isMPRO(user) && Object.entries(OfficeCategory).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {key === 'MOO' ? 'Other' : value}
                                    </option>
                                ))}
                                {(isTOSM(user) && user.officeNames.length > 1) &&
                                    user.officeNames.map((officeName) => {
                                        const categoryEntry = Object.entries(OfficeCategory).find(([,v]) => v===officeName.replaceAll(" Office", ""));
                                        if (!categoryEntry) return null;
                                        const [key, label] = categoryEntry;
                                        return (
                                            <option key={key} value={key}>
                                                {getCategoryLabel(label)}
                                            </option>
                                        )
                                    })
                                }
                            </select>
                        </label>
                    }
                    <label>
                        From:{' '}
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={fromDateFilter}
                            max={toDateFilter || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setFromDateFilter(e.target.value)}
                            style={{ width: "auto" }}
                            placeholder="From date"
                        />
                    </label>
                    <label>
                        To:{' '}
                        <input
                            type="date"
                            className="form-control form-control-sm me-2"
                            value={toDateFilter}
                            min={fromDateFilter}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setToDateFilter(e.target.value)}
                            style={{ width: "auto" }}
                            placeholder="To date"
                        />
                    </label>
                    <label className="flex-grow-1">
                        Title:{' '}
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                            placeholder="Search by title"
                        />
                    </label>
                    <div>
                        <button disabled={!areFiltersActive} className="btn btn-sm text-danger" onClick={resetFilters}>
                            Reset
                        </button>
                    </div>
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
                <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "1050px" }}>
                    <Alert variant="danger" className="mb-2">{error}</Alert>
                </div>
            )}

            {/* REPORT LIST */}
            {!loading && filteredReports.length > 0 && (
                <div className="container-fluid px-3 px-md-4 pb-3" style={{ maxWidth: "1050px" }}>
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
                                                    <span>Category: <strong className="text-dark">{getCategoryLabel(r.category)}</strong></span>
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
                                                    <span className="badge bg-info text-white" style={{ fontSize: "0.7rem" }}>
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
                                                        <span>Category: <strong className="text-dark">{getCategoryLabel(r.category)}</strong></span>
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
                                                            {(assigningToMaintainer === r.id) ? (
                                                                <div className="d-flex flex-column gap-2">
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={username}
                                                                        onChange={(e) => setUsername(e.target.value)}
                                                                    >
                                                                        <option value="">Unregistered EM</option>
                                                                        {EMlist.map((em) => (
                                                                            <option key={em.username} value={em.username}>{em.name} {em.surname} ({em.username})</option>
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
                                                            ) : (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => selectExternalCategory(r)}
                                                                    disabled={assigningToMaintainer === r.id}
                                                                    className="w-100"
                                                                >{r.isExternal ? "Update" : "Assign"} External Maintainer
                                                                </Button>
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
