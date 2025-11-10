import { Header, HeaderContent, HeaderBrand, HeaderRightZone, Button, Icon } from 'design-react-kit';
import { LogoutButton } from './LoginPage';

interface NavComponentProps {
    loggedIn: boolean;
    user: {
        username?: string;
        [key: string]: any;
    };
    handleLogout: () => Promise<void>;
}

function NavComponent({ loggedIn, user, handleLogout }: NavComponentProps) {
    return(
        <>
          <Header type="slim" style={{position: 'sticky', top: 0, zIndex: 1000}}>
          <HeaderContent>
            <HeaderBrand href='/' responsive>
              Participium
            </HeaderBrand>
            <HeaderRightZone>
              {loggedIn ? (
                <>
                  <span className="d-none d-lg-block text-white me-3">
                    {user.username}
                  </span>
                  <LogoutButton logout={handleLogout} />
                </>
              ) : (
                <Button
                  className="btn-icon btn-full"
                  color="primary"
                  href="/login"
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
            )}
            </HeaderRightZone>
          </HeaderContent>
        </Header>
      </>
    )
}

export default NavComponent;