import {useActionState, useState} from 'react';
import {Link} from 'react-router';
import {Alert, Button, Form} from 'react-bootstrap';
import {Col, Container, Icon, Row} from "design-react-kit";
import type {Credentials} from "../models/Models.ts";
import type {APIError} from "../services/ErrorHandler.ts";

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

function LoginForm({handleLogin}: LoginFormProps) {

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
                setError((err as APIError).details)
                return err as LoginState;
            }
        },
        {
            username: '',
            password: ''
        }
    );

    const changeType = () => {
        setType(type === 'CITIZEN' ? 'STAFF' : 'CITIZEN');
    }

    return (
        <>
            {isPending && <Alert variant="warning">Wait...</Alert>}
            <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                <div style={{width: '30%'}}>
                    <Container className="text-center mb-5">
                        <h2>{type === 'CITIZEN' ? 'Citizen' : 'Staff'} Login</h2>
                        {type === 'CITIZEN' &&
                            <p className="text-muted">Don't have an account? <Link to="/registration">Register
                                now</Link>
                            </p>}
                    </Container>
                    <Form action={formAction} id="login-form">
                        <Form.Group className="mb-3" controlId='username'>
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" name="username" placeholder="Enter username" required/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId='password'>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" name="password" placeholder="Enter password" required/>
                        </Form.Group>
                    </Form>
                    {(!isPending && error &&
                        <Alert variant="danger">{error}</Alert>)}
                    <Row>
                        <Col className="col-3">
                            <Button variant="primary" type="submit" form="login-form" disabled={isPending}>
                                Login
                            </Button>
                        </Col>
                        <Col className="col-9 d-flex flex-column justify-content-center">
                            <p className="text-end text-muted m-0">Are you
                                a {type === 'CITIZEN' ? 'Staff Member' : 'Citizen'}?<span> <a role='button' onClick={changeType}
                                                                                              className='text-primary'>Login here</a></span>
                            </p>
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    )
}

function LogoutButton({logout}: LogoutButtonProps) {
    return (
        <span role="button" onClick={logout}>
            <Icon
                size="sm"
                color="danger"
                icon="it-logout"
            />
        </span>
    )
}

export {LoginForm, LogoutButton};