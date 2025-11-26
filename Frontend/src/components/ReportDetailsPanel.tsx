import { Card, Container } from "react-bootstrap";
import type { Report, Message } from "../models/Models";
import { useEffect, useState } from "react";
import { STATIC_URL } from "../API/API.mts";
import { ReportStatus } from "../models/Models.ts";
import API from "../API/API.mts";

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

const convertToDMS = (decimal: number, isLatitude: boolean): string => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = Math.round((minutesDecimal - minutes) * 60 * 10) / 10;

    const direction = isLatitude
        ? (decimal >= 0 ? 'N' : 'S')
        : (decimal >= 0 ? 'E' : 'W');

    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toFixed(1)}" ${direction}`;
};

export default function ReportDetailsPanel({ report, onClose }: ReportDetailsPanelProps) {

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
                setMessages(msgs);
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
                    Report Details 
                    <i role="button" onClick={onClose} className="bi bi-x float-end"></i>
                </Card.Header>

                <Card.Body className="flex-grow-1 overflow-auto">

                    <h3 className="mb-3">{report.title}</h3>

                    <p><strong>Description:</strong><br />{report.description}</p>
                    <p><strong>Category:</strong> {report.category}</p>
                    <p><strong>Street:</strong> {streetName}</p>
                    <p><strong>Coordinates:</strong> {convertToDMS(report.coordinates[0], true)}, {convertToDMS(report.coordinates[1], false)}</p>
                    <p><strong>Status: </strong>
                        <span className={`badge ${
                          report.status === ReportStatus.PENDING ? 'bg-primary' :
                          report.status === ReportStatus.ASSIGNED ? 'bg-success' :
                          report.status === ReportStatus.REJECTED ? 'bg-danger' :
                          'bg-secondary'
                        }`}>
                            {report.status}
                        </span>
                    </p>
                    {report.comment && (
                    <p><strong>Staff Comment:</strong><br />{report.comment}</p>)}
                    <p><strong>Citizen: </strong>
                        {report.citizenUsername ? (
                        <>{report.citizenUsername}</>
                        ) : (
                        <i>Unknown</i>
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
                                        key={index} />
                                ))
                            }
                        </div>
                    </div>

                    {/* Messages Section */}
                    {messages.length > 0 && (
                        <div className="mt-4">
                            <strong>Messages</strong>
                            <div className="mt-2 border rounded p-3" style={{ backgroundColor: "#f8f9fa", maxHeight: "300px", overflowY: "auto" }}>
                                {loadingMessages ? (
                                    <div className="text-center text-muted">Loading messages...</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {messages.map((msg, index) => (
                                            <div key={index} className="d-flex flex-column p-2 rounded" style={{ backgroundColor: "white", border: "1px solid #dee2e6" }}>
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
