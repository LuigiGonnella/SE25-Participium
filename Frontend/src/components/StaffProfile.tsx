import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spinner, Card, Row, Col } from "react-bootstrap";
import API from "../API/API.mts";
import type { Report, Staff } from "../models/Models.ts";

interface StaffProfileProps {
    user: Staff;
}

export default function StaffProfile({ user }: StaffProfileProps) {
    const [myReports, setMyReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        const loadMyReports = async () => {
            setLoading(true);
            try {
                const filters = { 
                    staff_username: user.username,
                    status: "ASSIGNED"
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

            {/* MY REPORTS SECTION */}
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

            {!loading && myReports.length === 0 && (
                <Alert variant="info">You have no reports assigned to you.</Alert>
            )}
        </div>
    );
}
