import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Form, Button, Alert } from 'react-bootstrap';

interface LoginFormProps {
    handleLogin: (credentials: { username: string, password: string }) => Promise<{ username: string }>;
}

interface LoginState {
    username: string;
    password: string;
    success?: boolean;
}

interface LogoutButtonProps {
    logout: () => void;
}

function LoginForm({ handleLogin }: LoginFormProps) {
    const navigate = useNavigate();

    const [, formAction, isPending] = useActionState<LoginState>(
        async (state: LoginState) => {
            const credentials = {
                username: state.username,
                password: state.password,
            };

            try {
                await handleLogin(credentials);
                navigate('/');
                return {
                    ...state,
                    success: true
                };
            } catch (err) {
                return err as LoginState;
            }
        },
        {
            username: '',
            password: ''
        }
    );

    return(
        <>
           {isPending && <Alert variant="warning">Wait...</Alert>} 
           <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
            }}>
           <Form action={formAction}>
            <h2 className="text-center mb-3">Insert your credentials</h2>
             <p className="text-center text-muted mb-4">
            Don't have an account? <br /> <Link to="/registration">Register</Link>
            </p>
                <Form.Group className="mb-3" controlId='username'>
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" name="username" placeholder="Enter username" required />
                </Form.Group>

                <Form.Group className="mb-3" controlId='password'>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" name="password" placeholder="Enter password" required />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={isPending}>
                    Login
                </Button>
           </Form>
           </div>
        </>
    )
}

function LogoutButton({ logout }: LogoutButtonProps) {
    return (
        <Link to="/" onClick={logout}>
            Logout
        </Link>
    )
}

export { LoginForm, LogoutButton };