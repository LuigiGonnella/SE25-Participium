import { Outlet } from "react-router";
import NavComponent from "./Navbar";
import {Container} from "design-react-kit";

interface DefaultLayoutProps {
    loggedIn: boolean;
    user: {
        username?: string;
        [key: string]: any;
    };
    handleLogout: () => Promise<void>;
}

function DefaultLayout({ loggedIn, user, handleLogout }: DefaultLayoutProps) {
    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <NavComponent loggedIn={loggedIn} user={user} handleLogout={handleLogout} />
                <Container
                    fluid
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        padding: '20px'
                    }}
                >
                    <Outlet />
                </Container>
            </div>
        </>
    );
}

export default DefaultLayout;