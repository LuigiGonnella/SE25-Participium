import { Outlet } from "react-router";
import NavComponent from "./Navbar";

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
            <NavComponent loggedIn={loggedIn} user={user} handleLogout={handleLogout} />
            <Outlet />
        </>
    );
}

export default DefaultLayout;