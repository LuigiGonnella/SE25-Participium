import { Card, Row, Col } from "react-bootstrap";
import type { Staff } from "../models/Models.ts";


interface StaffProfileProps {
    user: Staff;
}

export default function StaffProfile({ user }: StaffProfileProps) {

    return (
        <div className="container py-4">
            <Card className="mb-4 shadow-sm" >
                <Card.Header>
                    <h2 className="mb-4">Profile</h2>
                </Card.Header>
                <Card.Body>
                    <h4 className="mb-3">Personal Information</h4>
                    <Row>
                        <Col md={6}>
                            <p><strong>Name:</strong> {user.name} {user.surname}</p>
                            <p><strong>Username:</strong> {user.username}</p>
                        </Col>
                        <Col md={6}>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Offices:</strong> {user.officeNames.map((o) => (
                                    <span key={o} className="badge text-black me-1 border">
                                        {o}
                                    </span>
                                ))}</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
        
    );
    
}
