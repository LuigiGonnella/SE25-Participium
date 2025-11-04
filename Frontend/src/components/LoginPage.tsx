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
                navigate('/home');
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

           <Form action={formAction}>
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
        </>
    )
}

function LogoutButton({ logout }: LogoutButtonProps) {
    return (
        <Link to="/home" onClick={logout}>
            Logout
        </Link>
    )
}

export { LoginForm, LogoutButton };