import { useActionState } from 'react';
import { Link } from 'react-router';
import { Form, Button, Alert } from 'react-bootstrap';
import {Icon} from "design-react-kit";

interface LoginFormProps {
    handleLogin: (credentials: { 
        username: string, 
        password: string 
    }) => Promise<{ username: string }>;
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

    const [, formAction, isPending] = useActionState<LoginState, FormData>(
        async (state: LoginState, formData: FormData) => {
            const credentials = {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
            };

            try {
                await handleLogin(credentials);
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
           <div className="d-flex justify-content-center align-items-center flex-grow-1">
               <Form action={formAction}>
                   <h2 className="text-center mb-3">Insert your credentials</h2>
                   <p className="text-center text-muted mb-4">Don't have an account? <Link to="/registration">Register now</Link>
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
        <span role="button" onClick={logout}>
            <Icon
                size="sm"
                color="danger"
                icon="it-logout"
            />
        </span>
    )
}

export { LoginForm, LogoutButton };