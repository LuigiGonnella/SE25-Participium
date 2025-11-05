import { Label } from 'design-react-kit';
import { useState } from 'react';
import {Form, FormGroup, Row, Col, Button, Alert} from 'react-bootstrap';

function RegistrationForm(){
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [receiveEmails, setReceiveEmails] = useState(false);

    return (
    <>
    <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
            }}>
      <Form >
        <h2 className="text-center mb-3">Registration</h2>
        <Row>
            <Col>
          <Form.Group className="mb-3" controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                isInvalid={name === ''}
              />
              <Form.Control.Feedback type="invalid">
                This field is required
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
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                isInvalid={surname === ''}
              />
              <Form.Control.Feedback type="invalid">
                This field is required
              </Form.Control.Feedback>
          </FormGroup>
          </Col>
          </Row>
          <Row>
            <Col>
          <FormGroup className="mb-3" controlId ="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                isInvalid={username === ''}
              />
              <Form.Control.Feedback type="invalid">
                This field is required
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isInvalid={email === ''}
              />
              <Form.Control.Feedback type="invalid">
                This field is required
              </Form.Control.Feedback>
          </FormGroup>
          </Col>
          </Row>
          <Row>
            <Col>
            <Form.Group className="mb-3">
                <Form.Check
                type="checkbox"
                id="terms"
                label="Receive notifications via email"
                checked={receiveEmails}
                onChange={(e) => setReceiveEmails(e.target.checked)}
                />
                </Form.Group>
            </Col>
            </Row>
        <Row className='align-items-center'>
          <Col
            md='3'
            lg='6'
            className='mt-3 mt-md-0 d-flex justify-content-center justify-content-md-end justify-content-lg-start'
          >
            <Button color='primary' type='submit'>
              Invia
            </Button>
          </Col>
        </Row>
      </Form>
      <Row className='mt-4'>
        <Col>
          <Alert variant='danger'>
            <strong>Attention</strong> Some fields need to be checked.
          </Alert>
        </Col>
      </Row>
                </div>
    </>
  );
}

export default RegistrationForm;