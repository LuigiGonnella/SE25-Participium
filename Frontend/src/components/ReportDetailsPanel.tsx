import { Card, Container } from "react-bootstrap";
import type { Report } from "../models/Models";
import { useEffect, useState } from "react";
import type { LatLng } from "leaflet";
import { STATIC_URL } from "../API/API.mts";
import { ReportStatus } from "../models/Models.ts";

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

    useEffect(() => {
        getStreetName(report.coordinates).then((v) => {
            setStreetName(v);
        }).catch(console.error);
    }, [report.coordinates]);

    const [streetName, setStreetName] = useState<string>("");

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
                    <p><strong>Status:</strong>
                            <p>
                              <span className={`badge ${
                              report.status === ReportStatus.PENDING ? 'bg-primary' :
                              report.status === ReportStatus.ASSIGNED ? 'bg-success' :
                              report.status === ReportStatus.REJECTED ? 'bg-danger' :
                              'bg-secondary'
                            }`}>
                            {report.status}
                            </span>
                            </p>
                    </p>
                    <p><strong>Citizen:</strong>
                        <p>
                        {report.citizenUsername ? (
                        <>{report.citizenUsername}</>
                        ) : (
                        <i>Unknown</i>
                        )}
                        </p>
                    </p>


                    <div className="mt-4">
                        <strong>Photos:</strong>
                        <div className="d-flex gap-2 flex-wrap mt-2">
                            {
                                report.photos.map((photo, index) => (
                                    <img src={STATIC_URL + photo}
                                         style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                                         key={index} />
                                ))
                            }
                        </div>
                    </div>

                </Card.Body>
            </Card>
        </Container>
    );
}
