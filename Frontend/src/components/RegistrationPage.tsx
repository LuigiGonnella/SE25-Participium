import { Form, FormGroup, Row, Col, Button, Alert } from 'react-bootstrap';
import {type ChangeEvent, type FocusEvent, type FormEvent, useState} from 'react';
import { useNavigate } from 'react-router';
import type { Citizen, Staff, NewCitizen, NewStaff } from "../models/Models.ts";
import { StaffRole } from '../models/Models.ts';
import {APIError} from "../services/ErrorHandler.ts";

interface RegistrationFormProps {
    handleRegistration?: (newCitizen: NewCitizen) => Promise<Citizen>;
    handleStaffRegistration?: (newStaff: NewStaff) => Promise<Staff>;
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
                return !value || (typeof value === 'string' && value.trim() === '');
            case 'surname':
                return !value || (typeof value === 'string' && value.trim() === '');
            case 'username':
                return !value || (typeof value === 'string' && value.trim() === '');
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
            password: formData.password,
        };

        setIsPending(true);
        try {
            await handleRegistration?.(newCitizen);
            navigate('/');
        } catch (err) {
            setErrorMessage('Error: ' + (err instanceof APIError ? err.details : err));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
        {isPending && <Alert variant="warning">Wait...</Alert>}
        <div className="d-flex flex-column gap-2 justify-content-center align-items-center flex-grow-1">
            <Form onSubmit={handleSubmit} id="registrationForm" name="registrationForm">
                <h2 className="text-center mb-3">Registration</h2>
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
                            <Form.Label>Confirm Password</Form.Label>
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
            </Form>
            {errorMessage && <Alert variant='danger'>{errorMessage}</Alert>}
            <Button form="registrationForm" color='primary' type='submit' disabled={isPending}>
                Submit
            </Button>
        </div>
        </>
    );
}

function MunicipalityRegistrationForm({ handleStaffRegistration }: RegistrationFormProps) {

    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [isHidden, setIsHidden] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        surname: '',
        username: '',
        password: '',
        confirmPassword: '', 
        role: '',
        officeId: ''
    });

    interface RegistrationFormProps {
        handleRegistration: (newCitizen: NewCitizen) => Promise<Citizen>;
    }

    interface FormData {
        name: string;
        surname: string;
        username: string;
        password: string;
        confirmPassword: string;
        role: string;
        officeId: string;
    }

    interface FormErrors {
        name: boolean;
        surname: boolean;
        username: boolean;
        password: boolean;
        confirmPassword: boolean;
        role: boolean;
        officeId: boolean;
    }

    const validateField = (name: keyof FormData, value: string): boolean => {
        switch (name) {
            case 'name':
                return !value || value.trim() === "";
            case 'surname':
                return !value || value.trim() === "";
            case 'username':
                return !value || value.trim() === "";
            case 'password':
                return typeof value === 'string' && value.length < 8;
            case 'confirmPassword':
                return value !== formData.password;
            case 'role':
                return value === '';
            case 'officeId':
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
        officeId: validateField('officeId', formData.officeId)
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
            officeId: true
        });

        if (Object.values(errors).some(error => error)) {
            return;
        }

        const newStaff: NewStaff = {
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            password: formData.password,
            role: formData.role,
            officeId: Number(formData.officeId)
        };

        setIsPending(true);
        try {
            await handleStaffRegistration?.(newStaff);
            setIsHidden(false);
            setInterval(() => {
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
        {isPending && <Alert variant="warning">Wait...</Alert>}
        <div className="d-flex flex-column gap-2 justify-content-center align-items-center flex-grow-1">
            <Form onSubmit={handleSubmit} id="registrationForm" name="registrationForm">
                <h2 className="text-center mb-3">Registration</h2>
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
                            <Form.Label>Confirm Password</Form.Label>
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
                        <Form.Group className="mb-3" controlId="formName">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                name="role"
                                value={formData.role}
                                onChange={handleSelectChange}
                                onBlur={handleSelectBlur}
                                isInvalid={touched.role && errors.role}
                                required
                            >
                                <option value="">Select a role...</option>
                                {
                                    Object.entries(StaffRole).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))
                                }
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                {/* <Row>
                    <Col>
                        <Form.Group className="mb-3" controlId="formName">
                            <Form.Label>Office</Form.Label>
                            <Form.Select
                                name="officeId"
                                value={formData.officeId}
                                onChange={handleSelectChange}
                                onBlur={handleSelectBlur}
                                isInvalid={touched.officeId && errors.officeId}
                                required
                            >
                                <option value="">Select an office...</option>
                                {
                                    Object.entries(offices).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))
                                }
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row> */}
            </Form>
            {errorMessage && <Alert variant='danger'>{errorMessage}</Alert>}
            <Alert variant='success' hidden={isHidden}>Registration successful!</Alert>
            <Button form="registrationForm" color='primary' type='submit' disabled={isPending}>
                Submit
            </Button>
        </div>
        </>
    )
}


export { RegistrationForm, MunicipalityRegistrationForm};