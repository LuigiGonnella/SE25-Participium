import { Card, Row, Col } from "react-bootstrap";
import type { Staff } from "../models/Models.ts";


interface StaffProfileProps {
    user: Staff;
}

export default function StaffProfile({ user }: Readonly<StaffProfileProps>) {

    return (
        <div className="container py-4 d-flex flex-column align-items-center">
            <h2 className="mb-1">Profile</h2>

            <Card style={{ width: "100%", maxWidth: "700px" }} className="shadow-sm">
                <Card.Body className="px-4">
                <h4 className="text-center mb-4">Personal Information</h4>

                <Row className="">
                    <Col md={6} className="mb-2 mb-md-0">
                    <div className="mb-2">
                        <span className="text-muted">Name</span>
                        <div className="fw-semibold">
                        {user.name} {user.surname}
                        </div>
                    </div>

                    <div className="mb-2">
                        <span className="text-muted">Username</span>
                        <div className="fw-semibold">{user.username}</div>
                    </div>
                    </Col>

                    <Col md={6}>
                    <div className="mb-2">
                        <span className="text-muted">Role</span>
                        <div className="fw-semibold">{user.role}</div>
                    </div>

                    <div>
                        <span className="text-muted">Offices</span>
                        <div className="mt-2 d-flex flex-wrap gap-2">
                        {user.officeNames.map((o) => (
                            <span key={o} className="badge text-black me-1 border">
                            {o}
                            </span>
                        ))}
                        </div>
                    </div>
                    </Col>
                </Row>
                </Card.Body>
            </Card>
        </div>
    );
}
