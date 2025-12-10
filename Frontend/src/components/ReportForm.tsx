import {useEffect, useState} from 'react';
import {Alert, Button, Card, Col, Container, Form, Row} from 'react-bootstrap';
import {type NewReport, OfficeCategory} from '../models/Models';
import API from '../API/API.mts';
import {APIError} from "../services/ErrorHandler.ts";
import type {LatLng} from "leaflet";

interface ReportFormProps {
    coordinates: LatLng | null;
    street: string;
    toggleReportView: () => void;
}

const ReportForm = ({ coordinates, street, toggleReportView }: ReportFormProps) => {
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        category: OfficeCategory | '';
        latitude: string;
        longitude: string;
        anonymous: boolean;
        photos: File[];
    }>({
        title: '',
        description: '',
        category: '',
        latitude: '',
        longitude: '',
        anonymous: false,
        photos: []
    });

    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

    useEffect(() => {
        console.log(coordinates);
        console.log(formData);
        console.log(validated && (!formData.latitude || !formData.longitude || isNaN(parseFloat(formData.latitude)) || isNaN(parseFloat(formData.longitude))))
        if (coordinates) {
            setFormData(prev => ({
                ...prev,
                latitude: coordinates.lat.toString(),
                longitude: coordinates.lng.toString()
            }));
            setValidated(false);
        } else {
            setFormData(prev => ({
                ...prev,
                latitude: '',
                longitude: ''
            }));
        }
    }, [coordinates]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);

            if (fileArray.length > 3) {
                setError('You can upload a maximum of 3 images');
                return;
            }

            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
            if (invalidFiles.length > 0) {
                setError('Images must be in PNG, JPG, or JPEG format');
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            const oversizedFiles = fileArray.filter(file => file.size > maxSize);
            if (oversizedFiles.length > 0) {
                setError('Each image must be less than 5MB in size');
                return;
            }

            const urls = fileArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
            setFormData(prev => ({ ...prev, photos: fileArray }));
            setError('');
        }
    };

    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;

        setError('');
        setSuccess('');


        const latitude = parseFloat(formData.latitude);
        const longitude = parseFloat(formData.longitude);
        const hasValidCoordinates = formData.latitude && formData.longitude && !isNaN(latitude) && !isNaN(longitude);

        if (!form.checkValidity() || !hasValidCoordinates) {
            setValidated(true);
            return;
        }

        setValidated(true);
        setIsSubmitting(true);

        try {

            const newReport: NewReport = {
                title: formData.title,
                description: formData.description,
                category: formData.category as OfficeCategory,
                latitude: latitude,
                longitude: longitude,
                anonymous: formData.anonymous,
                photos: formData.photos
            };

            const createdReport = await API.createReport(newReport);

            setSuccess(`Report created successfully! ID: ${createdReport.id}`);

            setFormData({
                title: '',
                description: '',
                category: '',
                latitude: '',
                longitude: '',
                anonymous: false,
                photos: []
            });

            setValidated(false);

            const fileInput = document.getElementById('photos') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            setPreviewUrls([]);

        } catch (err) {
            setError(err instanceof APIError ? err.details : 'Error creating report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const removePhoto = (indexToRemove: number) => {
        URL.revokeObjectURL(previewUrls[indexToRemove]);
        setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, index) => index !== indexToRemove)
        }));

        if (formData.photos.length === 1) {
            const fileInput = document.getElementById('photos') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    return (
        <Container className="h-100 d-flex flex-column p-0">
            <Card className="h-100 d-flex flex-column">
                <Card.Header as="h3">Create New Report <i role="button" onClick={toggleReportView} className="bi bi-x float-end"></i></Card.Header>
                <Card.Body className="flex-grow-1 overflow-auto">
                    {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                    {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter a brief title for the report"
                                        required
                                        isInvalid={validated && !formData.title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        This field is required.
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe the issue in detail"
                                        required
                                        isInvalid={validated && !formData.description}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        This field is required.
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={7}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Coordinates&nbsp;{coordinates && <span>({convertToDMS(coordinates.lat, true)} - {convertToDMS(coordinates.lng,false)})</span>}</Form.Label>
                                    <div className="position-relative justify-content-center" style={{cursor: 'not-allowed'}}>
                                        <i title="Auto-generated" className="bi bi-lock-fill position-absolute end-0 me-2 mt-2"/>
                                        <Form.Control
                                            readOnly
                                            type="text"
                                            name="street"
                                            value={street}
                                            placeholder="Street Name"
                                            required
                                            disabled
                                        />
                                    </div>
                                    {validated && (!formData.latitude || !formData.longitude || isNaN(parseFloat(formData.latitude)) || isNaN(parseFloat(formData.longitude))) &&
                                        <Form.Control.Feedback type="invalid" className="d-block">
                                        Please select a point on the map.
                                    </Form.Control.Feedback>}
                                </Form.Group>
                            </Col>

                            <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        isInvalid={validated && !formData.category}
                                    >
                                        <option value={''} disabled>Select category</option>
                                        <option value={OfficeCategory.WSO}>Water Supply</option>
                                        <option value={OfficeCategory.ABO}>Architectural Barriers</option>
                                        <option value={OfficeCategory.SSO}>Sewer System</option>
                                        <option value={OfficeCategory.PLO}>Public Lighting</option>
                                        <option value={OfficeCategory.WO}>Waste</option>
                                        <option value={OfficeCategory.RSTLO}>Road Signs and Traffic Lights</option>
                                        <option value={OfficeCategory.RUFO}>Roads and Urban Furnishings</option>
                                        <option value={OfficeCategory.PGAPO}>Public Green Areas and Playgrounds</option>
                                        <option value={OfficeCategory.MOO}>Other</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        Please select a category.
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Pictures (min 1, max 3)</Form.Label>
                                    <Row>
                                        <Col md={formData.photos.length > 0 ? 6 : 12}>
                                            <Form.Control
                                                type="file"
                                                id="photos"
                                                name="photos"
                                                multiple
                                                accept="image/png,image/jpeg,image/jpg"
                                                onChange={handleFileChange}
                                                required
                                                isInvalid={validated && formData.photos.length === 0}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Please upload at least one photo (max 3).
                                            </Form.Control.Feedback>
                                            <Form.Text className="text-muted">
                                                Accepted formats: PNG, JPG, JPEG.<br/>Maximum size per file: 5MB
                                            </Form.Text>
                                        </Col>
                                        {formData.photos.length > 0 && (
                                            <Col md={6}>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {previewUrls.map((url, index) => (
                                                        <div
                                                            key={url}
                                                            className="position-relative"
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                cursor: 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                                                                if (overlay) overlay.style.display = 'block';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
                                                                if (overlay) overlay.style.display = 'none';
                                                            }}
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Preview ${index + 1}`}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #dee2e6'
                                                                }}
                                                            />
                                                            <div
                                                                className="hover-overlay position-absolute top-0 start-0 w-100 h-100 align-items-center justify-content-center"
                                                                style={{
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                                    borderRadius: '4px',
                                                                    display: 'none'
                                                                }}
                                                                onClick={() => removePhoto(index)}
                                                            >
                                                                <i className="bi bi-trash text-white" style={{ fontSize: '1.5rem' }}></i>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </Form.Group>
                            </Col>

                            {/*<Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        id="terms"
                                        type="checkbox"
                                        name="anonymous"
                                        label="Submit report anonymously"
                                        checked={formData.anonymous}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>*/}
                        </Row>

                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending report...' : 'Submit Report'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReportForm;

