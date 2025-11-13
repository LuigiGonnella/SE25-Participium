import { Container, Row, Col, Card, CardBody, CardTitle, CardText, Button, Icon } from 'design-react-kit';

function HomePage() {
    return (
        <Container className="py-5">
            <Row className="justify-content-center mb-5">
                <Col xs={12} md={10} lg={8} className="text-center">
                    <h1 className="display-4 mb-3">Welcome to Participium</h1>
                    <p className="lead text-muted">
                        Report urban issues and help improve the city of Turin
                    </p>
                </Col>
            </Row>

            <Row className="g-4">
                <Col xs={12} md={6} lg={4}>
                    <Card className="shadow-sm h-100">
                        <CardBody className="ps-2">
                            <div className="my-2">
                                <Icon icon="it-pin" size="lg" color="primary" />
                            </div>
                            <CardTitle tag="h5">Report</CardTitle>
                            <CardText>
                                Identify potholes, abandoned waste, broken streetlights and other issues on the map
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <Card className="shadow-sm h-100">
                        <CardBody className="ps-2">
                            <div className="my-2">
                                <Icon icon="it-map-marker-circle" size="lg" color="primary" />
                            </div>
                            <CardTitle tag="h5">Monitor</CardTitle>
                            <CardText>
                                Track the status of reports and stay updated on Municipality interventions
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <Card className="shadow-sm h-100">
                        <CardBody className="ps-2">
                            <div className="my-2">
                                    <Icon icon="it-settings" size="lg" color="primary" />
                            </div>
                            <CardTitle tag="h5">Collaborate</CardTitle>
                            <CardText>
                                Work together with the administration to make Turin more livable
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row className="justify-content-center mt-5">
                <Col xs={12} md={8} lg={6} className="text-center">
                    <Button color="primary" size="lg" href="/login">
                        Get Started
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default HomePage;
