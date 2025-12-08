import { useEffect, useState } from "react";
import API from "../API/API.mts";
import type { Staff, Office } from "../models/Models";
import { ROLE_OFFICE_MAP } from "../models/Models";
import { Button, Container, Table, Alert, Form, Row, Col } from "react-bootstrap";

function AdminTOSMPage() {
    const [tosms, setTosms] = useState<Staff[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selected, setSelected] = useState<Staff | null>(null);
    const [officeNames, setOfficeNames] = useState<string[]>([]);

    const [offices, setOffices] = useState<Office[]>([]);
    const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);

    useEffect(() => {
        API.getAllTOSM()
            .then(setTosms)
            .catch(() => setError("Failed to load TOSM list"));
    }, []);

    useEffect(() => {
        API.getOffices()
            .then(setOffices)
            .catch(err => {
                console.error("Failed to fetch offices:", err);
                setError("Failed to load offices");
            });
    }, []);

    useEffect(() => {
        if (offices.length === 0) {
            setFilteredOffices([]);
            return;
        }

        const allowedNames = ROLE_OFFICE_MAP.TOSM;
        const filtered = offices.filter(office =>
            allowedNames.some(name => office.name.toLowerCase() === name.toLowerCase())
        );
        setFilteredOffices(filtered);
    }, [offices]);

    const handleEdit = (staff: Staff) => {
        setSelected(staff);

        if (staff.officeNames && staff.officeNames.length > 0) {
            setOfficeNames([...staff.officeNames]);
        } else {
            setOfficeNames([""]);
        }

        setError("");
        setSuccess("");
    };

    const handleSave = async () => {
        if (!selected) return;

        const cleaned = officeNames.filter(name => name && name.trim() !== "");
        if (cleaned.length === 0) {
            setError("At least one office must be selected.");
            return;
        }

        try {
            const updated = await API.updateTOSMOffices(selected.username, cleaned);

            setTosms(prev =>
                prev.map(s => s.username === updated.username ? updated : s)
            );

            setSelected(null);
            setOfficeNames([]);
            setSuccess("Offices updated successfully.");
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to update offices");
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Technical Office Staff Members</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Table bordered hover>
                <thead>
                    <tr className="text-center">
                        <th>Username</th>
                        <th>Name</th>
                        <th>Surname</th>
                        <th>Offices</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {tosms.map((s) => (
                        <tr key={s.username}>
                            <td className="text-center">{s.username}</td>
                            <td className="text-center">{s.name}</td>
                            <td className="text-center">{s.surname}</td>
                            <td>
                                {s.officeNames.map((o) => (
                                    <span key={o} className="badge text-black me-1 border">
                                        {o}
                                    </span>
                                ))}
                            </td>
                            <td className="text-center">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleEdit(s)}
                                >
                                    Edit
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {selected && (
                <div className="p-3 border rounded mt-4">
                    <h4>Edit Offices for {selected.username}</h4>

                    {officeNames.map((selectedName, index) => {
                        const availableOffices = filteredOffices.filter(
                            (office) =>
                                !officeNames.includes(office.name) ||
                                office.name === selectedName
                        );

                        return (
                            <Row key={index} className="align-items-center">
                                <Col xs={10}>
                                    <Form.Group className="mb-3" controlId={`editOffice${index}`}>
                                        <Form.Label>{`Office ${index + 1}`}</Form.Label>

                                        <Form.Select
                                            value={selectedName}
                                            onChange={(e) => {
                                                const updated = [...officeNames];
                                                updated[index] = e.target.value;
                                                setOfficeNames(updated);
                                            }}
                                            required
                                        >
                                            {availableOffices.length > 1 && (
                                                <option value="">Select an office...</option>
                                            )}

                                            {availableOffices.map((office) => (
                                                <option key={office.id} value={office.name}>
                                                    {office.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {index > 0 && (
                                    <Col xs={2} className="mt-4">
                                        <Button
                                            variant="danger"
                                            onClick={() => {
                                                const updated = [...officeNames];
                                                updated.splice(index, 1);
                                                setOfficeNames(updated);
                                            }}
                                        >
                                            –
                                        </Button>
                                    </Col>
                                )}
                            </Row>
                        );
                    })}

                    {filteredOffices.length > officeNames.length && (
                        <Button
                            className="mb-3"
                            variant="secondary"
                            disabled={
                                officeNames.length === 0 ||
                                officeNames[officeNames.length - 1] === ""
                            }
                            onClick={() => {
                                if (
                                    officeNames.length === 0 ||
                                    officeNames[officeNames.length - 1] === ""
                                ) return;

                                setOfficeNames(prev => [...prev, ""]);
                            }}
                        >
                            Add another office
                        </Button>
                    )}

                    <div className="mt-3">
                        <Button variant="success" onClick={handleSave} className="me-2">
                            Save
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSelected(null);
                                setOfficeNames([]);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </Container>
    );
}

export default AdminTOSMPage;