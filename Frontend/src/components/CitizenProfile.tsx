import { useState } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import type { Citizen } from "../models/Models.ts";
import defaultProfile from "../../assets/default-profile.png";

interface CitizenProfileProps {
    user: Citizen;
}

export default function CitizenProfile({ user }: CitizenProfileProps) {
    const [telegramUsername, setTelegramUsername] = useState(user.telegram_username || "");
    const [receiveEmails, setReceiveEmails] = useState(user.receive_emails);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setProfilePic(preview);
        setProfilePicFile(file);
    };

    const handleTelegramChange = (value: string) => {
        if (value === "") {
            setTelegramUsername("");
            return;
        }
        if (!value.startsWith("@")) {
            setTelegramUsername("@" + value);
        } else {
            setTelegramUsername(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

    };

    return (
        <div className="container py-4 d-flex flex-column align-items-center" >
            <h2 className="mb-1">Profile</h2>
                            
            {/* PERSONAL INFO SECTION */}
            <Card style={{ width: "100%", maxWidth: "700px"}} className="shadow-sm">
                <Card.Body className="px-4">
                    <h4 className="text-center mb-4">Personal Information</h4>

                    <div className="d-flex flex-column align-items-center mb-3" style={{ marginTop: "-10px" }}>
                        <img
                            src={profilePic || user.profilePicture || defaultProfile}
                            alt="Profile"
                            className="rounded-circle shadow-sm"
                            style={{ width: "130px", height: "130px", objectFit: "cover" }}
                        />
                        <Form.Label
                            htmlFor="profilePicInput"
                            className="mt-2 text-primary"
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                        >
                            Change Profile Picture
                        </Form.Label>
                        <Form.Control
                            id="profilePicInput"
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={handleProfilePicChange}
                        />
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-1">
                            <Col>
                                <p className="mb-3"><strong>Name:</strong> {user.name} {user.surname}</p>
                                <p className="mb-3"><strong>Username:</strong> {user.username}</p>
                                <p className="mb-3"><strong>Email:</strong> {user.email}</p>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4" style={{ maxWidth: "250px" }}>
                            <Form.Label className="fw-bold" style={{ fontSize: '1.1rem' }}>Telegram Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={telegramUsername}
                                onChange={(e) => handleTelegramChange(e.target.value)}
                                placeholder="@username"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3 mt-2">
                            <Form.Check
                                type="checkbox"
                                label="Receive email notifications"
                                checked={receiveEmails}
                                onChange={(e) => setReceiveEmails(e.target.checked)}
                                id="receiveEmailsCheckbox"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-center">
                            <Button variant="primary" type="submit" className="px-4">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}