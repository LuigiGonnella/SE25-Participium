import {Navbar, Nav, Container} from 'react-bootstrap';

function NavComponent() {
    return(
        <>
          <Navbar bg="dark" data-bs-theme="dark">
            <Container>
              <Navbar.Brand href="home">Participium</Navbar.Brand>
              <Nav className="me-auto">
              <Nav.Link href="login">Login</Nav.Link>
              </Nav>
            </Container>
          </Navbar>
        </>
    )
}

export default NavComponent;