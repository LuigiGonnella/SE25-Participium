import { Outlet } from "react-router";
import NavComponent from "./Navbar";


function DefaultLayout() {
    return (
        <>
            <NavComponent />
            <Outlet />
        </>
    );
}

export default DefaultLayout;