import { useState } from "react";
import { Card, Row, Col, Form, Button, Alert, Modal } from "react-bootstrap";
import type { Citizen } from "../models/Models.ts";
import defaultProfile from "/default-profile.png";
import API, { STATIC_URL } from "../API/API.mts";

interface CitizenProfileProps {
    user: Citizen;
    refresh: () => void;
}

export default function CitizenProfile({ user, refresh }: Readonly<CitizenProfileProps>) {
    const [telegramUsername, setTelegramUsername] = useState(user.telegram_username ? "@" + user.telegram_username : "");
    const [receiveEmails, setReceiveEmails] = useState(user.receive_emails);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setProfilePic(preview);
        setProfilePicFile(file);
    };

    const handleTelegramChange = (value: string) => {
        if (!value) {
            setTelegramUsername("");
            return;
        }
        if (!value.startsWith("@")) value = "@" + value;
        setTelegramUsername(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const updates: {
                receive_emails?: boolean;
                profilePicture?: File;
            } = {};

            if (receiveEmails !== user.receive_emails) {
                updates.receive_emails = receiveEmails;
            }
            if (profilePicFile) {
                updates.profilePicture = profilePicFile;
            }

            if (Object.keys(updates).length === 0) {
                setErrorMessage("No changes to save");
                setIsSubmitting(false);
                return;
            }

            await API.updateCitizenProfile(user.username, updates);
            setSuccessMessage("Profile updated successfully!");
            setProfilePicFile(null);
        } catch (error: any) {
            setErrorMessage(error.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const startTelegramVerification = async () => {
        try {
            setIsVerifying(true);
            const result = await API.verifyTelegram(telegramUsername); // backend returns {code}
            setVerificationCode(result.code);
            setShowVerifyModal(true);
        } catch (err: any) {
            setErrorMessage(err.details || "Failed to generate verification code");
        } finally {
            setIsVerifying(false);
        }
    };

    const finishVerification = async () => {
        setShowVerifyModal(false);
        refresh();
    };

    return (
        <div className="container py-4 d-flex flex-column align-items-center" >
            <h2 className="mb-1">Profile</h2>

            <Card style={{ width: "100%", maxWidth: "700px" }} className="shadow-sm">
                <Card.Body className="px-4">
                    <h4 className="text-center mb-4">Personal Information</h4>

                    <div className="d-flex flex-column align-items-center mb-3" style={{ marginTop: "-10px" }}>
                        <img
                            src={profilePic || (user.profilePicture ? `${STATIC_URL}${user.profilePicture}` : defaultProfile)}
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

                    {successMessage && (
                        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
                            {successMessage}
                        </Alert>
                    )}
                    {errorMessage && (
                        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-1">
                            <Col>
                                <p><strong>Name:</strong> {user.name} {user.surname}</p>
                                <p><strong>Username:</strong> {user.username}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" style={{ maxWidth: "250px" }}>
                            <Form.Label className="fw-bold">Telegram Username</Form.Label>
                            <div className="input-group align-items-center">
                            {telegramUsername &&
                                telegramUsername === ("@" + user.telegram_username || "") &&
                                        <span title="Verified"> <i className="bi bi-patch-check-fill text-success"></i></span>
                                }
                                <Form.Control
                                    type="text"
                                    value={telegramUsername}
                                    onChange={(e) => handleTelegramChange(e.target.value)}
                                    placeholder="@username"
                                />

                            </div>


                        </Form.Group>

                        {telegramUsername &&
                            telegramUsername !== ("@" + user.telegram_username || "") && (
                                <Button
                                    variant="secondary"
                                    disabled={isVerifying}
                                    className="mb-3"
                                    onClick={startTelegramVerification}
                                >
                                    {isVerifying ? "Generating..." : "Verify Telegram"}
                                </Button>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Receive email notifications"
                                checked={receiveEmails}
                                onChange={(e) => setReceiveEmails(e.target.checked)}
                                id="receiveEmailsCheckbox"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-center">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Telegram Verification</Modal.Title>
                </Modal.Header>

                <Modal.Body className="text-center">
                    <p>Send this code to our <a href="https://t.me/ParticipiumBot" target="_blank">Telegram Bot</a> using <strong>/verify</strong>:</p>
                    <h3 className="fw-bold py-2">{verificationCode}</h3>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="primary" onClick={finishVerification}>
                        Done
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}