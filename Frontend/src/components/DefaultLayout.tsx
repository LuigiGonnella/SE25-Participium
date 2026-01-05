import { Outlet, useLocation } from "react-router";
import NavComponent from "./Navbar";
import {Container, Spinner} from "design-react-kit";
import type {User} from "../models/Models.ts";
import {CopyrightComponent, CopyrightComponentMap} from "./Copyright";

interface DefaultLayoutProps {
    loggedIn: boolean;
    user?: User;
    handleLogout: () => Promise<void>;
    loading?: boolean;
}

function DefaultLayout({ loggedIn, user, handleLogout, loading = false }: Readonly<DefaultLayoutProps>) {
    const location = useLocation();
    const isMap = location.pathname === '/map' || location.pathname.includes('/map');
    
    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <NavComponent loggedIn={loggedIn} user={user} handleLogout={handleLogout}/>
            <Container
                fluid
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    padding: '0'
                }}
            >
                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1
                    }}>
                        <Spinner active/>
                    </div>
                ) : (
                    <Outlet/>
                )}
            </Container>
            {isMap ? <CopyrightComponentMap /> : <CopyrightComponent />}
        </div>
    );
}

export default DefaultLayout;