import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Alert, Spinner, Button } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, User, Staff } from "../models/Models.ts";
import { ReportStatus, isMPRO, isTOSM, isEM, isStaff } from "../models/Models.ts";

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
    const [assigningToMaintainer, setAssigningToMaintainer] = useState<number | null>(null);

    const [assignedToMe, setAssignedToMe] = useState<boolean>(false);

    // FILTER STATE
    const [statusFilter, setStatusFilter] = useState("");
    
    // Use stable user properties to avoid infinite loops
    const userRole = isStaff(user) ? user.role : 'CITIZEN';
    const userOfficeName = isStaff(user) ? user.officeName : undefined;

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
            if (isMPRO(user)) { //can see all reports
                const filters: any = {};
                if (statusFilter) filters.status = statusFilter;

                const data = await API.getReports(filters);
                setReports(data);
            }
            else if (isTOSM(user) || isEM(user)) { //TOSM and EM can see only their office reports
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
    }, [userRole, userOfficeName, statusFilter]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const getExternalCompanyName = (category: string): string => {
        const categoryMap: Record<string, string> = {
            "Water Supply": "External Company - Water Supply",
            "Architectural Barriers": "External Company - Architectural Barriers",
            "Sewer System": "External Company - Sewer System",
            "Public Lighting": "External Company - Public Lighting",
            "Waste": "External Company - Waste",
            "Road Signs and Traffic Lights": "External Company - Road Signs and Traffic Lights",
            "Roads and Urban Furnishings": "External Company - Roads and Urban Furnishings",
            "Public Green Areas and Playgrounds": "External Company - Public Green Areas and Playgrounds",
        };
        return categoryMap[category] || `External Company - ${category}`;
    };

    const handleAssign = async (reportId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setAssigningId(reportId);
        try {
            const updatedReport = await API.assignReportToSelf(reportId);
            // Immediately update the local report state
            setReports(prevReports => 
                prevReports.map(r => r.id === reportId ? updatedReport : r)
            );
        } catch (err: any) {
            setError(err.details || "Failed to assign report");
        } finally {
            setAssigningId(null);
        }
    };

    const handleAssignToMaintainer = async (reportId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setAssigningToMaintainer(reportId);
        try {
            const updatedReport = await API.assignReportToMaintainer(reportId);
            // Immediately update the local report state
            setReports(prevReports => 
                prevReports.map(r => r.id === reportId ? updatedReport : r)
            );
        } catch (err: any) {
            setError(err.details || "Failed to assign report to maintainer");
        } finally {
            setAssigningToMaintainer(null);
        }
    };

    const canAssignToSelf = (report: Report) => 
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && !report.assignedStaff;
    
    const canAssignToEM = (report: Report) => 
        isTOSM(user) && report.status === ReportStatus.ASSIGNED && report.assignedStaff === user.username && !report.assignedEM;

    const filteredReports = reports.filter(r => {
        // MPRO sees all reports
        if (isMPRO(user)) {
            return true;
        }
        
        // TOSM/EM see all reports from their office, optionally filtered by "assigned to me"
        if (!assignedToMe) {
            return true;
        }
        
        // Check both assignedStaff and assignedEM for "assigned to me" filter
        return r.assignedStaff === user.username || r.assignedEM === user.username;
    });

    return (
        <div className="d-flex flex-column">
            <div className="container-fluid px-4 py-3" style={{ maxWidth: "1400px" }}>
                <h2 className="mb-3">Reports</h2>

                {/* FILTER SECTION */}
                <div className="mb-3 d-flex align-items-center" style={{ gap: "1rem" }}>
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
                    { (isTOSM(user) || isEM(user)) &&
                    <div className="d-flex align-items-center gap-2">
                        <input type="checkbox" onChange={(v) => setAssignedToMe(v.target.checked)} id="assignedToMeCheckbox"/>
                        <label htmlFor="assignedToMeCheckbox" className="mb-0">Assigned to me</label>
                    </div>}
                </div>
            </div>

            {/* LOADING */}
            {loading && (
                <div className="text-center mt-5">
                    <Spinner animation="border" />
                </div>
            )}

            {/* ERROR */}
            {!loading && error && (
                <div className="container-fluid px-4" style={{ maxWidth: "1400px" }}>
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            {/* REPORT LIST */}
            {!loading && filteredReports.length > 0 && (
                <div className="container-fluid px-4" style={{ maxWidth: "1400px" }}>
                    <div className="list-group">
                        {filteredReports.map((r, index) => (
                            <div
                                key={r.id}
                                className="list-group-item d-flex align-items-center"
                                style={{ 
                                    gap: "1.5rem",
                                    padding: filteredReports.length <= 3 ? "3rem 2rem" : filteredReports.length <= 6 ? "2.5rem 1.75rem" : filteredReports.length <= 10 ? "1.75rem 1.5rem" : "1.25rem",
                                    minHeight: filteredReports.length <= 3 ? "180px" : filteredReports.length <= 6 ? "140px" : filteredReports.length <= 10 ? "100px" : "80px",
                                    borderLeft: "5px solid #0d6efd",
                                    marginBottom: filteredReports.length <= 3 ? "1.5rem" : filteredReports.length <= 6 ? "1.25rem" : filteredReports.length <= 10 ? "1rem" : "0.75rem"
                                }}
                            >
                                {isMPRO(user) &&  <Link
                                    to={`/reports/${r.id}`}
                                    className="flex-grow-1 text-decoration-none text-dark"
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="flex-grow-1">
                                            <h4 
                                                className="mb-2" 
                                                style={{ 
                                                    fontSize: filteredReports.length <= 3 ? "2rem" : filteredReports.length <= 6 ? "1.65rem" : filteredReports.length <= 10 ? "1.35rem" : "1.15rem",
                                                    fontWeight: "600"
                                                }}
                                            >
                                                {r.title}
                                            </h4>
                                            <div className="d-flex gap-3 flex-wrap" style={{ fontSize: filteredReports.length <= 3 ? "1.15rem" : filteredReports.length <= 6 ? "1.05rem" : "1rem" }}>
                                                <span className="text-muted">
                                                    Status: <strong className="text-dark">{r.status}</strong>
                                                </span>
                                                <span className="text-muted">•</span>
                                                <span className="text-muted">
                                                    Category: <strong className="text-dark">{r.category}</strong>
                                                </span>
                                                {(r.assignedStaff || r.assignedEM) && (
                                                    <>
                                                        <span className="text-muted">•</span>
                                                        <span className="text-muted">
                                                            Assigned to: <strong className="text-dark">
                                                                {r.assignedStaff && r.assignedEM 
                                                                    ? `${r.assignedStaff}, ${r.assignedEM}`
                                                                    : r.assignedStaff || r.assignedEM}
                                                            </strong>
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end ms-3">
                                            <span className="text-muted" style={{ fontSize: filteredReports.length <= 3 ? "1.1rem" : filteredReports.length <= 6 ? "1rem" : "0.9rem" }}>
                                                {new Date(r.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>}

                                {(isTOSM(user) || isEM(user)) && (
                                    <>
                                        <Link
                                            to={`/reports/${r.id}`}
                                            className="flex-grow-1 text-decoration-none text-dark"
                                        >
                                            <div>
                                                <h4 
                                                    className="mb-2" 
                                                    style={{ 
                                                        fontSize: filteredReports.length <= 3 ? "2rem" : filteredReports.length <= 6 ? "1.65rem" : filteredReports.length <= 10 ? "1.35rem" : "1.15rem",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    {r.title}
                                                </h4>
                                                <div className="d-flex gap-3 flex-wrap" style={{ fontSize: filteredReports.length <= 3 ? "1.15rem" : filteredReports.length <= 6 ? "1.05rem" : "1rem" }}>
                                                    <span className="text-muted">
                                                        Status: <strong className="text-dark">{r.status}</strong>
                                                    </span>
                                                    <span className="text-muted">•</span>
                                                    <span className="text-muted">
                                                        Category: <strong className="text-dark">{r.category}</strong>
                                                    </span>
                                                    {(r.assignedStaff || r.assignedEM) && (
                                                        <>
                                                            <span className="text-muted">•</span>
                                                            <span className="text-muted">
                                                                Assigned: <strong className="text-dark">
                                                                    {r.assignedStaff && r.assignedEM 
                                                                        ? `${r.assignedStaff}, ${r.assignedEM}`
                                                                        : r.assignedStaff || r.assignedEM}
                                                                </strong>
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-muted">•</span>
                                                    <span className="text-muted">{new Date(r.timestamp).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        {canAssignToSelf(r) && (
                                            <div className="d-flex gap-2 align-items-center ms-auto" style={{ minWidth: "fit-content" }}>
                                                <Button
                                                    variant="primary"
                                                    size={filteredReports.length <= 3 ? "lg" : filteredReports.length <= 6 ? "md" : "sm"}
                                                    onClick={(e) => handleAssign(r.id, e)}
                                                    disabled={assigningId === r.id}
                                                    className="text-nowrap"
                                                    style={{ 
                                                        fontSize: filteredReports.length <= 3 ? "1.15rem" : filteredReports.length <= 6 ? "1rem" : "0.9rem",
                                                        padding: filteredReports.length <= 3 ? "0.75rem 1.5rem" : filteredReports.length <= 6 ? "0.5rem 1rem" : "0.375rem 0.75rem"
                                                    }}
                                                >
                                                    {assigningId === r.id ? "Assigning..." : "Assign To Me"}
                                                </Button>
                                            </div>
                                        )}
                                        {canAssignToEM(r) && (
                                            <div className="d-flex gap-2 align-items-center ms-auto" style={{ minWidth: "fit-content" }}>
                                                <Button
                                                    variant="secondary"
                                                    size={filteredReports.length <= 3 ? "lg" : filteredReports.length <= 6 ? "md" : "sm"}
                                                    onClick={(e) => handleAssignToMaintainer(r.id, e)}
                                                    disabled={assigningToMaintainer === r.id}
                                                    className="text-nowrap"
                                                    style={{ 
                                                        fontSize: filteredReports.length <= 3 ? "1.15rem" : filteredReports.length <= 6 ? "1rem" : "0.9rem",
                                                        padding: filteredReports.length <= 3 ? "0.75rem 1.5rem" : filteredReports.length <= 6 ? "0.5rem 1rem" : "0.375rem 0.75rem"
                                                    }}
                                                >
                                                    {assigningToMaintainer === r.id ? "Assigning..." : `Assign to ${getExternalCompanyName(r.category)}`}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && filteredReports.length === 0 && (
                <div className="container-fluid px-4 text-center mt-5" style={{ maxWidth: "1400px" }}>
                    <p className="text-muted fs-5">No reports found.</p>
                </div>
            )}
        </div>
    );
}

