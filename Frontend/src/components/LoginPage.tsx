import {Row, Form, Button} from 'react-bootstrap';

function LoginForm() {

    return(
        <>
        
        <Row className="justify-content-md-center mt-5">
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" placeholder="Enter username" />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter password" />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Login
                </Button>
            </Form>
        </Row>
         
        </>
    )
}

export default LoginForm;