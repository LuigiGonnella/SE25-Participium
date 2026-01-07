import {useActionState, useState} from 'react';
import {Link} from 'react-router';
import {Alert, Button, Form} from 'react-bootstrap';
import {Col, Container, Icon, Row} from 'design-react-kit';
import type {Credentials} from '../models/Models.ts';
import type {APIError} from '../services/ErrorHandler.ts';

interface LoginFormProps {
    handleLogin: (credentials: Credentials, type: 'CITIZEN' | 'STAFF') => Promise<void>;
}

interface LoginState {
    username: string;
    password: string;
    success?: boolean;
}

interface LogoutButtonProps {
    logout: () => void;
}

function LoginForm({handleLogin}: Readonly<LoginFormProps>) {
    const [type, setType] = useState<'CITIZEN' | 'STAFF'>('CITIZEN');
    const [error, setError] = useState<string>();
    const [, formAction, isPending] = useActionState<LoginState, FormData>(
        async (state: LoginState, formData: FormData) => {
            const credentials = {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
            };

            try {
                await handleLogin(credentials, type);
                return {
                    ...state,
                    success: true
                };
            } catch (err) {
                setError((err as APIError).details);
                return {
                    ...state,
                    success: false
                };
            }
        },
        {
            username: '',
            password: ''
        }
    );

    const changeType = () => {
        setType(type === 'CITIZEN' ? 'STAFF' : 'CITIZEN');
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
                        lg={4}
                        className="d-flex flex-column"
                        style={{maxWidth: '420px'}}
                    >
                        <Container className="text-center mb-4">
                            <h2 className="mb-2">
                                {type === 'CITIZEN' ? 'Citizen' : 'Staff'} login
                            </h2>
                            {type === 'CITIZEN' && (
                                <p className="text-muted mb-0">
                                    Don't have an account?&nbsp;
                                    <Link to="/registration">Register now</Link>
                                </p>
                            )}
                        </Container>

                        <Form action={formAction} id="login-form">
                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder="Enter username"
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder="Enter password"
                                    required
                                />
                            </Form.Group>
                        </Form>

                        {!isPending && error && (
                            <Alert variant="danger" className="mt-2">
                                {error}
                            </Alert>
                        )}

                        <Row className="mt-3 align-items-center">
                            <Col xs={12} sm={4} className="mb-2 mb-sm-0">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    form="login-form"
                                    disabled={isPending}
                                    className="w-100"
                                >
                                    Login
                                </Button>
                            </Col>
                            <Col
                                xs={12}
                                sm={8}
                                className="d-flex flex-column justify-content-center"
                            >
                                <p className="text-sm-end text-center text-muted m-0">
                                    Are you a&nbsp;
                                    {type === 'CITIZEN' ? 'staff member' : 'citizen'}?&nbsp;
                                    <button
                                        type="button"
                                        onClick={changeType}
                                        className="btn btn-link text-primary p-0 align-baseline"
                                    >
                                        Login&nbsp;here
                                    </button>
                                </p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

function LogoutButton({logout}: Readonly<LogoutButtonProps>) {
    return (
        <button
            type="button"
            onClick={logout}
            className="p-0 border-0"
            aria-label="Log out"
            style={{ background: 'none', backgroundColor: 'transparent' }}
        >
        <Icon
            size="sm"
            color="danger"
            icon="it-logout"
            style={{ background: 'none' }}
        />
        </button>
    );
}

export {LoginForm, LogoutButton};
