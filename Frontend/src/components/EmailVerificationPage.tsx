import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmail } from '../API/API.mts';
import { Alert, Button, Card, CardBody, CardTitle, Container, Input, Row, Col } from 'design-react-kit';

function EmailVerificationPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!code || code.trim().length !== 6) {
            setError('Please enter a valid 6-digit verification code');
            setLoading(false);
            return;
        }

        try {
            await verifyEmail(code.trim());
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check your code and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col lg={6} md={8}>
                    <Card className="shadow">
                        <CardBody>
                            <CardTitle tag="h2" className="text-center mb-4">
                                Email Verification
                            </CardTitle>
                            
                            {success ? (
                                <Alert color="success" className="mb-4">
                                    <strong>Success!</strong> Your email has been verified. Redirecting to login...
                                </Alert>
                            ) : (
                                <>
                                    <p className="text-center text-muted mb-4">
                                        Please enter the 6-digit verification code sent to your email address.
                                        The code is valid for 30 minutes.
                                    </p>

                                    {error && (
                                        <Alert color="danger" className="mb-4">
                                            {error}
                                        </Alert>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <Input
                                                type="text"
                                                id="verificationCode"
                                                label="Verification Code"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                maxLength={6}
                                                placeholder="Enter 6-digit code"
                                                className="text-center"
                                                style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                                                disabled={loading}
                                                required
                                            />
                                        </div>

                                        <Button
                                            color="primary"
                                            type="submit"
                                            className="w-100"
                                            disabled={loading || code.length !== 6}
                                        >
                                            {loading ? 'Verifying...' : 'Verify Email'}
                                        </Button>
                                    </form>

                                    <div className="text-center mt-4">
                                        <p className="text-muted small">
                                            Didn't receive the code? Check your spam folder or contact support.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default EmailVerificationPage;
