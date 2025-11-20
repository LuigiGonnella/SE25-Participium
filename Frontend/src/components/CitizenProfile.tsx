import { Card, Row, Col } from "react-bootstrap";
import type { Citizen } from "../models/Models.ts";

interface CitizenProfileProps {
    user: Citizen;
}

export default function CitizenProfile({ user }: CitizenProfileProps) {
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
                            <p><strong>Email:</strong> {user.email}</p>
                        </Col>
                        <Col md={6}>
                            {user.telegram_username && (
                                <p><strong>Telegram:</strong> @{user.telegram_username}</p>
                            )}
                            <p><strong>Email Notifications:</strong> {user.receive_emails ? 'Enabled' : 'Disabled'}</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
}
