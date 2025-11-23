import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spinner, Card, Row, Col, Form, Button } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, Staff } from "../models/Models.ts";
import { isTOSM, ReportStatus } from "../models/Models.ts";


interface StaffProfileProps {
    user: Staff;
}

export default function StaffProfile({ user }: StaffProfileProps) {
    const [myReports, setMyReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [statusUpdates, setStatusUpdates] = useState<Record<number, string>>({});
    const [comments, setComments] = useState<Record<number, string>>({});

    useEffect(() => {
        const loadMyReports = async () => {
            setLoading(true);
            try {
                const filters = { 
                    staff_username: user.username,
                    status: "IN_PROGRESS"
                };
                const data = await API.getReports(filters);
                setMyReports(data);
            } catch (err: any) {
                setError(err.details || "Failed to load reports");
            } finally {
                setLoading(false);
            }
        };

        loadMyReports();
    }, [user.username]);

    const handleStatusUpdate = async (reportId: number) => {
        const newStatus = statusUpdates[reportId];
        if (!newStatus) return;

        setUpdatingId(reportId);
        try {
            const data: any = { status: newStatus };
            if (newStatus === ReportStatus.RESOLVED && comments[reportId]) {
                data.comment = comments[reportId];
            }
            
            await API.updateReport(reportId, data, user.role);
            
            // Reload reports
            const filters = { 
                staff_username: user.username,
                status: "IN_PROGRESS"
            };
            const updatedReports = await API.getReports(filters);
            setMyReports(updatedReports);
            
            // Clear the status update and comment for this report
            setStatusUpdates(prev => {
                const updated = { ...prev };
                delete updated[reportId];
                return updated;
            });
            setComments(prev => {
                const updated = { ...prev };
                delete updated[reportId];
                return updated;
            });
        } catch (err: any) {
            setError(err.details || "Failed to update report");
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Profile</h2>

            {/* PERSONAL INFO SECTION */}
            <Card className="mb-4">
                <Card.Body>
                    <h4 className="mb-3">Personal Information</h4>
                    <Row>
                        <Col md={6}>
                            <p><strong>Name:</strong> {user.name} {user.surname}</p>
                            <p><strong>Username:</strong> {user.username}</p>
                        </Col>
                        <Col md={6}>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Office:</strong> {user.officeName}</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* MY REPORTS SECTION - ONLY FOR TOSM */}
            {isTOSM(user) && (
                <>
                    <h4 className="mb-3">My Reports</h4>

                    {loading && (
                        <div className="text-center mt-5">
                            <Spinner animation="border" />
                        </div>
                    )}

                    {!loading && error && <Alert variant="danger">{error}</Alert>}

                    {!loading && myReports.length > 0 && (
                        <div className="list-group">
                            {myReports.map((r) => (
                                <div key={r.id} className="list-group-item p-3">
                                    <div className="d-flex justify-content-between">
                                    <div >
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
                                    <div className="text-muted">
                                        <small>{new Date(r.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                                    
                                    {/* STATUS UPDATE CONTROLS */}
                                    <div className="mt-3 pt-3 border-top">
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label><strong>Update Status</strong></Form.Label>
                                                    <Form.Select
                                                        value={statusUpdates[r.id] || ""}
                                                        onChange={(e) => setStatusUpdates(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                    >
                                                        <option value="">Select new status...</option>
                                                        <option value="SUSPENDED">Suspended</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            {statusUpdates[r.id] === ReportStatus.RESOLVED && (
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Comment (Optional)</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={comments[r.id] || ""}
                                                            onChange={(e) => setComments(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                            placeholder="Add a comment..."
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            )}
                                        </Row>
                                        {statusUpdates[r.id] && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() => handleStatusUpdate(r.id)}
                                                disabled={updatingId === r.id}
                                            >
                                                {updatingId === r.id ? "Updating..." : "Update Status"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && myReports.length === 0 && (
                        <Alert variant="info">You have no reports assigned to you.</Alert>
                    )}
                </>
            )}

            

            
        </div>
        
    );
    
}
