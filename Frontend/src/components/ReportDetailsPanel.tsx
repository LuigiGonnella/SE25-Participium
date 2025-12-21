import { Card, Container } from "react-bootstrap";
import type { Report, Message } from "../models/Models";
import { useEffect, useState } from "react";
import API, {STATIC_URL} from "../API/API.mts";
import {convertToDMS, getReportStatusColor} from "../utils/reportUtils.ts";

interface ReportDetailsPanelProps {
    report: Report;
    onClose: () => void;
}

async function getStreetName(selectedCoordinates: number[]): Promise<string> {
    if(!selectedCoordinates) return "";
    // Reverse geocoding
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedCoordinates[0]}&lon=${selectedCoordinates[1]}`;
        const res = await fetch(url);
        const data = await res.json();

        return (data.address?.road + " " + (data.address?.house_number || "")) ||
            data.address?.pedestrian ||
            data.address?.footway ||
            data.display_name ||
            "Unnamed street";
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
    }
    return "Unnamed street";
}

export default function ReportDetailsPanel({ report, onClose }: Readonly<ReportDetailsPanelProps>) {

    const [streetName, setStreetName] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        getStreetName(report.coordinates).then((v) => {
            setStreetName(v);
        }).catch(console.error);
    }, [report.coordinates]);

    useEffect(() => {
        const loadMessages = async () => {
            setLoadingMessages(true);
            try {
                const msgs = await API.getAllMessages(report.id);
                const sortedMessages = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setMessages(sortedMessages);
            } catch (error) {
                console.error("Failed to load messages:", error);
            } finally {
                setLoadingMessages(false);
            }
        };
        loadMessages();
    }, [report.id]);

    return (
        <Container className="h-100 d-flex flex-column p-0">
            <Card className="h-100 d-flex flex-column">

                <Card.Header as="h3">
                    Report Details{' '}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-0 bg-transparent border-0 float-end"
                        aria-label="Close"
                    >
                    <i className="bi bi-x"></i>
                    </button>
                </Card.Header>

                <Card.Body className="flex-grow-1 overflow-auto">

                    <h3 className="mb-3">{report.title}</h3>

                    <p><strong>Description:</strong><br />{report.description}</p>
                    <p><strong>Category:</strong> {report.category}</p>
                    <p><strong>Street:</strong> {streetName}</p>
                    <p><strong>Coordinates:</strong> {convertToDMS(report.coordinates[0], true)}, {convertToDMS(report.coordinates[1], false)}</p>
                    <p><strong>Status: </strong>
                        <span className={`badge ${getReportStatusColor(report.status)}`}>
                            {report.status}
                        </span>
                    </p>
                    {report.comment && (
                    <p><strong>Staff Comment:</strong><br />{report.comment}</p>)}
                    <p><strong>Citizen: </strong>
                        {report.citizenUsername ? (
                        <>{report.citizenUsername}</>
                        ) : (
                        <i>Anonymous</i>
                        )}
                    </p>


                    <div className="mt-4">
                        <strong>Photos:</strong>
                        <div className="d-flex gap-2 flex-wrap mt-2">
                            {
                                report.photos.map((photo, index) => (
                                    <img
                                        alt={"img_"+index}
                                        src={STATIC_URL + photo}
                                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                                        key={`${photo}-${index}`} />
                                ))
                            }
                        </div>
                    </div>

                    {/* Messages Section */}
                    {messages.length > 0 && (
                        <div className="mt-4">
                            <strong>Messages</strong>
                            <div className="mt-2 border rounded p-3" style={{ backgroundColor: "#f0f8ff", maxHeight: "300px", overflowY: "auto" }}>
                                {loadingMessages ? (
                                    <div className="text-center text-muted">Loading messages...</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {messages.filter(msg => !msg.isPrivate).map((msg) => (
                                            <div key={`${msg.timestamp}-${msg.staffUsername || 'citizen'}`} className="d-flex flex-column p-2 rounded" style={{ backgroundColor: "#cde6ff" }}>
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="fw-bold text-primary" style={{ fontSize: "0.9rem" }}>
                                                        <i className="bi bi-person-circle me-1"></i>
                                                        {msg.staffUsername ? <>{msg.staffUsername}&nbsp;<i>(Staff)</i></> : "You"}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "0.9rem" }}>
                                                    {msg.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </Card.Body>
            </Card>
        </Container>
    );
}
