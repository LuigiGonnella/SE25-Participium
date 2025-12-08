import { Form, FormGroup, Row, Col, Button, Alert } from 'react-bootstrap';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { NewCitizen, NewStaff, Office } from '../models/Models.ts';
import { ROLE_OFFICE_MAP, StaffRole } from '../models/Models.ts';
import { APIError } from '../services/ErrorHandler.ts';
import API from '../API/API.mts';
import { Spinner, Container } from 'design-react-kit';

interface RegistrationFormProps {
    handleRegistration?: (newCitizen: NewCitizen) => Promise<void>;
    handleStaffRegistration?: (newStaff: NewStaff) => Promise<void>;
}

function RegistrationForm({ handleRegistration }: RegistrationFormProps) {
    interface FormData {
        name: string;
        surname: string;
        username: string;
        email: string;
        receive_emails: boolean;
        password: string;
        confirmPassword: string;
    }

    interface FormErrors {
        name: boolean;
        surname: boolean;
        username: boolean;
        email: boolean;
        password: boolean;
        confirmPassword: boolean;
    }

    const navigate = useNavigate();
    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [isHidden, setIsHidden] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        surname: '',
        username: '',
        email: '',
        receive_emails: false,
        password: '',
        confirmPassword: ''
    });

    const validateField = (name: keyof FormData, value: string | boolean): boolean => {
        switch (name) {
            case 'name':
            case 'surname':
            case 'username':
            case 'email':
                return !value || (typeof value === 'string' && value.trim() === '');
            case 'password':
                return typeof value === 'string' && value.length < 8;
            case 'confirmPassword':
                return value !== formData.password;
            default:
                return false;
        }
    };

    const errors: FormErrors = {
        name: validateField('name', formData.name),
        surname: validateField('surname', formData.surname),
        username: validateField('username', formData.username),
        email: validateField('email', formData.email),
        password: validateField('password', formData.password),
        confirmPassword: validateField('confirmPassword', formData.confirmPassword)
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        setTouched({
            name: true,
            surname: true,
            username: true,
            email: true,
            password: true,
            confirmPassword: true
        });

        if (Object.values(errors).some(error => error)) {
            return;
        }

        const newCitizen: NewCitizen = {
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            email: formData.email,
            receive_emails: formData.receive_emails,
            password: formData.password
        };

        setIsPending(true);
        try {
            await handleRegistration?.(newCitizen);
            setIsHidden(false);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setErrorMessage('Error: ' + (err instanceof APIError ? err.details : err));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            {isPending && <Alert variant="warning">Please wait...</Alert>}
            <Container
                fluid
                className="d-flex flex-column justify-content-center align-items-center flex-grow-1 py-4"
            >
                <Row className="w-100 justify-content-center">
                    <Col
                        xs={12}
                        sm={10}
                        md={8}
                        lg={5}
                        className="d-flex flex-column"
                        style={{ maxWidth: '500px' }}
                    >
                        <Form
                            onSubmit={handleSubmit}
                            id="registrationForm"
                            name="registrationForm"
                            className="w-100"
                        >
                            <h2 className="text-center mb-3">Citizen registration</h2>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3" controlId="formName">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.name && errors.name}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            This field is required.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <FormGroup className="mb-3" controlId="formSurname">
                                        <Form.Label>Surname</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="surname"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.surname && errors.surname}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            This field is required.
                                        </Form.Control.Feedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <FormGroup className="mb-3" controlId="formUsername">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.username && errors.username}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            This field is required.
                                        </Form.Control.Feedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <FormGroup className="mb-3" controlId="formEmail">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.email && errors.email}
                                            required
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            This field is required.
                                        </Form.Control.Feedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <FormGroup className="mb-3" controlId="formPassword">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.password && errors.password}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Your password must contain at least 8 characters.
                                        </Form.Control.Feedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3" controlId="formConfirmPassword">
                                        <Form.Label>Confirm password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            isInvalid={touched.confirmPassword && errors.confirmPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            Password does not match.
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="terms"
                                            label="Receive notifications via email"
                                            name="receive_emails"
                                            checked={formData.receive_emails}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button
                                form="registrationForm"
                                color="primary"
                                type="submit"
                                disabled={isPending}
                                className="w-100 mt-2"
                            >
                                Submit
                            </Button>
                        </Form>

                        {errorMessage && (
                            <Alert variant="danger" className="mt-3">
                                {errorMessage}
                            </Alert>
                        )}
                        <Alert variant="success" hidden={isHidden} className="mt-2">
                            <Row className="align-items-center">
                                <Col className="col-auto">
                                    Registration successful! You will be redirected to the login page.
                                </Col>
                                <Col>
                                    <Spinner active small />
                                </Col>
                            </Row>
                        </Alert>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

function MunicipalityRegistrationForm({ handleStaffRegistration }: RegistrationFormProps) {
    interface FormData {
        name: string;
        surname: string;
        username: string;
        password: string;
        confirmPassword: string;
        role: string;
        officeNames: string[];
    }

    interface FormErrors {
        name: boolean;
        surname: boolean;
        username: boolean;
        password: boolean;
        confirmPassword: boolean;
        role: boolean;
        officeNames: boolean;
    }

    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [isHidden, setIsHidden] = useState(true);
    const [showOfficeSelect, setShowOfficeSelect] = useState(false);

    const [offices, setOffices] = useState<Office[]>([]);
    const [filteredOffices, setFilteredOffices] = useState<Office[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        surname: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        officeNames: []
    });

    useEffect(() => {
        API.getOffices()
            .then(setOffices)
            .catch(err => {
                console.error('Failed to fetch offices:', err);
            });
    }, []);

    useEffect(() => {
        if (formData.role in StaffRole) {
            setShowOfficeSelect(true);
            setTouched(prev => ({ ...prev, officeNames: false }));

            const allowed = ROLE_OFFICE_MAP[formData.role as keyof typeof ROLE_OFFICE_MAP];
            if (allowed && offices.length > 0) {
                const filtered = offices.filter(office =>
                    allowed.some((abbr: string) =>
                        office.name.toLowerCase().includes(abbr.toLowerCase())
                    )
                );
                setFilteredOffices(filtered);
                setFormData(prev => ({
                    ...prev,
                    officeNames: [""]
                }));
            } else {
                setFilteredOffices([]);
            }
        } else {
            setShowOfficeSelect(false);
            setFilteredOffices([]);
            setFormData(prev => ({ ...prev, officeNames: [] }));
        }
    }, [formData.role, offices]);

    const validateField = (name: keyof FormData, value: string): boolean => {
        switch (name) {
            case 'name':
            case 'surname':
            case 'username':
                return !value || value.trim() === '';
            case 'password':
                return value.length < 8;
            case 'confirmPassword':
                return value !== formData.password;
            case 'role':
                return value === '';
            case 'officeNames':
                return value === '' && filteredOffices.length > 0;
            default:
                return false;
        }
    };

    const errors: FormErrors = {
        name: validateField('name', formData.name),
        surname: validateField('surname', formData.surname),
        username: validateField('username', formData.username),
        password: validateField('password', formData.password),
        confirmPassword: validateField('confirmPassword', formData.confirmPassword),
        role: validateField('role', formData.role),
        officeNames: formData.officeNames.length === 0
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = {
                ...prev,
                [name]: value
            };
            if (name === 'role') {
                next.officeNames = [];
            }
            return next;
        });
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleSelectBlur = (e: FocusEvent<HTMLSelectElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        setTouched({
            name: true,
            surname: true,
            username: true,
            password: true,
            confirmPassword: true,
            role: true,
            officeNames: true
        });

        if (Object.values(errors).some(error => error)) return;

        const newStaff: NewStaff = {
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            password: formData.password,
            role: formData.role,
            officeNames: formData.officeNames
        };

        setIsPending(true);
        try {
            await handleStaffRegistration?.(newStaff);
            setIsHidden(false);
            setFormData({
                name: '',
                surname: '',
                username: '',
                password: '',
                confirmPassword: '',
                role: '',
                officeNames: []
            });
            setTouched({
                name: false,
                surname: false,
                username: false,
                password: false,
                confirmPassword: false,
                role: false,
                officeNames: false
            });
            setTimeout(() => {
                setIsHidden(true);
            }, 5000);
        } catch (err) {
            setErrorMessage('Error: ' + (err instanceof APIError ? err.details : err));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            {isPending && <Alert variant="warning">Please wait...</Alert>}
                <Container
                    fluid
                    className="d-flex flex-column justify-content-center align-items-center flex-grow-1 py-4"
                >
                    <Row className="w-100 justify-content-center">
                        <Col
                            xs={12}
                            sm={10}
                            md={8}
                            lg={5}
                            className="d-flex flex-column"
                            style={{ maxWidth: '500px' }}
                        >
                            <Form
                                onSubmit={handleSubmit}
                                id="registrationForm"
                                name="registrationForm"
                                className="w-100"
                            >
                                <h2 className="text-center mb-3">Municipality staff registration</h2>

                                {(['name', 'surname', 'username'] as (keyof FormData)[]).map(field => (
                                    <Row key={field}>
                                        <Col>
                                            <Form.Group className="mb-3" controlId={`form${field}`}>
                                                <Form.Label>
                                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name={field}
                                                    value={formData[field]}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    isInvalid={touched[field] && errors[field]}
                                                    required
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    This field is required.
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                ))}

                                <Row>
                                    <Col>
                                        <Form.Group className="mb-3" controlId="formPassword">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                isInvalid={touched.password && errors.password}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Must contain at least 8 characters.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col>
                                        <Form.Group className="mb-3" controlId="formConfirmPassword">
                                            <Form.Label>Confirm password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                isInvalid={touched.confirmPassword && errors.confirmPassword}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                Password does not match.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col>
                                        <Form.Group className="mb-3" controlId="formRole">
                                            <Form.Label>Role</Form.Label>
                                            <Form.Select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleSelectChange}
                                                onBlur={handleSelectBlur}
                                                isInvalid={touched.role && errors.role}
                                                required
                                            >
                                                <option disabled value="">
                                                    Select a role...
                                                </option>
                                                {Object.entries(StaffRole)
                                                    .filter(([, value]) => value !== StaffRole.ADMIN)
                                                    .map(([key, value]) => (
                                                        <option key={key} value={key}>
                                                            {value}
                                                        </option>
                                                    ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">
                                                This field is required.
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {showOfficeSelect && (
                                    <>
                                        {formData.officeNames.map((selected, index) => {
                                            // Filter out already selected offices except the current one
                                            const availableOffices = filteredOffices.filter(
                                                (office) =>
                                                    !formData.officeNames.includes(office.name) ||
                                                    office.name === selected
                                            );

                                            return (
                                                <Row key={index} className="align-items-center">
                                                    <Col xs={10}>
                                                        <Form.Group className="mb-3" controlId={`formOffice${index}`}>
                                                            <Form.Label>
                                                                { 
                                                                    formData.role !== "TOSM"
                                                                    ? "Office"
                                                                    : `Office ${index + 1}`
                                                                }
                                                            </Form.Label>

                                                            <Form.Select
                                                                name="officeNames"
                                                                value={selected}
                                                                onChange={(e) => {
                                                                    const updated = [...formData.officeNames];
                                                                    updated[index] = e.target.value;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        officeNames: updated
                                                                    }));
                                                                    setTouched(prev => ({ ...prev, officeNames: true }));
                                                                }}
                                                                isInvalid={touched.officeNames && errors.officeNames}
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

                                                            <Form.Control.Feedback type="invalid">
                                                                This field is required.
                                                            </Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Col>

                                                    {/* Remove button for extra dropdowns */}
                                                    {index > 0 && (
                                                        <Col xs={2} className="mt-4">
                                                            <Button
                                                                variant="danger"
                                                                onClick={() => {
                                                                    const updated = [...formData.officeNames];
                                                                    updated.splice(index, 1);
                                                                    setFormData(prev => ({ ...prev, officeNames: updated }));
                                                                }}
                                                            >
                                                                –
                                                            </Button>
                                                        </Col>
                                                    )}
                                                </Row>
                                            );
                                        })}

                                        {/* Add another office — only for TOSM */}
                                        {formData.role === "TOSM" && filteredOffices.length > formData.officeNames.length && (
                                            <Button
                                                className="mb-3"
                                                variant="secondary"
                                                disabled={
                                                    formData.officeNames.length === 0 ||
                                                    formData.officeNames[formData.officeNames.length - 1] === ""
                                                }
                                                onClick={() => {
                                                    // Add empty dropdown only if previous is filled
                                                    if (formData.officeNames[formData.officeNames.length - 1] !== "") {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            officeNames: [...prev.officeNames, ""]
                                                        }));
                                                    }
                                                }}
                                            >
                                                Add another office
                                            </Button>
                                        )}
                                    </>
                                )}

                                <Button
                                    form="registrationForm"
                                    color="primary"
                                    type="submit"
                                    disabled={isPending}
                                    className="w-100 mt-2"
                                >
                                    Submit
                                </Button>
                            </Form>

                            {errorMessage && (
                                <Alert variant="danger" className="mt-3">
                                    {errorMessage}
                                </Alert>
                            )}
                            <Alert variant="success" hidden={isHidden} className="mt-2">
                                Registration successful!
                            </Alert>
                        </Col>
                    </Row>
                </Container>
        </>
    );
}

export { RegistrationForm, MunicipalityRegistrationForm };
