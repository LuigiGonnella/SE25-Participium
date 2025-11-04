import {Navbar, Nav, Container} from 'react-bootstrap';
import { Header, HeaderContent, HeaderBrand, HeaderRightZone, Button, Icon } from 'design-react-kit';

function NavComponent() {
    return(
        <>
        {/*
          <Navbar bg="dark" data-bs-theme="dark">
            <Container>
              <Navbar.Brand href="home">Participium</Navbar.Brand>
              <Nav className="me-auto">
              <Nav.Link href="login">Login</Nav.Link>
              </Nav>
            </Container>
          </Navbar>*/}
          <Header type="slim">
          <HeaderContent>
            <HeaderBrand responsive>
              Participium
            </HeaderBrand>
            <HeaderRightZone>
              <Button
                className="btn-icon btn-full"
                color="primary"
                href="\login"
              >
                <span className="rounded-icon">
                  <Icon
                    color="primary"
                    icon="it-user"
                  />
                </span>
                <span className="d-none d-lg-block">
                  Login to personal area
                </span>
              </Button>
            </HeaderRightZone>
          </HeaderContent>
        </Header>
        </>
    )
}

export default NavComponent;