import {
    AvatarIcon, Badge,
    Button, Header,
    HeaderBrand,
    HeaderContent,
    HeaderRightZone,
    Icon, LinkList, LinkListItem, UncontrolledTooltip
} from 'design-react-kit';
import {LogoutButton} from './LoginPage';
import {useNavigate} from "react-router";
import {isCitizen, isStaff, type Notification, StaffRole, type User} from "../models/Models.ts";
import {useEffect, useRef, useState} from "react";
import API, { STATIC_URL } from "../API/API.mjs";
import {Container} from "react-bootstrap";

interface NavComponentProps {
    loggedIn: boolean;
    user?: User;
    handleLogout: () => Promise<void>;
}

function NavComponent({loggedIn, user, handleLogout}: NavComponentProps) {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        if (loggedIn && user)
            API.getNotifications().then(setNotifications).catch(console.error);
    }, [user, loggedIn, isNotifOpen]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        if (isNotifOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isNotifOpen]);

    async function handleNotificationClick(n: Notification) {
        try {
            await API.markNotificationAsRead(n.id);
            setIsNotifOpen(false);
            navigate("/reports/" + n.reportId);
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <>
            <Header type="slim" className="pb-0" style={{position: 'sticky', top: 0, zIndex: 1000}}>
                <HeaderContent>
                    <HeaderBrand className="fs-5 fw-bold d-none d-lg-block pe-2" href='/' responsive>
                        Participium
                    </HeaderBrand>
                    <div className="nav-mobile">
                        <nav className="d-flex flex-column justify-content-end">
                            <a className="it-opener d-lg-none" data-bs-toggle="collapse" data-bs-target="#menu1a" role="button"
                               aria-expanded="false" aria-controls="menu1a">
                                <span className="fs-5 fw-bold">Participium</span>
                                <Icon aria-hidden icon="it-expand" />
                            </a>
                            <LinkList className="collapse me-0" id="menu1a">
                                <LinkListItem inDropdown href="/" active={ window.location.pathname === '/' }>
                                    Homepage
                                </LinkListItem>
                                <LinkListItem inDropdown href="/map" active={ window.location.pathname === '/map' }>
                                    Map
                                </LinkListItem>
                            {loggedIn && isStaff(user) && (
                               <LinkListItem inDropdown href="/reports" active={window.location.pathname === '/reports'} >
                                   Reports
                                 </LinkListItem>
                            )}
                            {(loggedIn && isStaff(user) && user.role === StaffRole.ADMIN) && (
                                <LinkListItem inDropdown href="/municipality-registration" active={ window.location.pathname === '/municipality-registration' }>
                                    Staff registration
                                </LinkListItem>
                            )}
                            </LinkList>
                        </nav>
                    </div>
                    <HeaderRightZone className={loggedIn ? "pt-1" : ""}>
                        {loggedIn && user ? (
                            <>
                                <Container ref={notifRef} className="position-relative">
                                    <i role="button" className="bi bi-bell-fill text-white position-relative pe-4" onClick={() => setIsNotifOpen(prevState => !prevState)}>
                                        {notifications.some(n => !n.isRead) &&
                                        <Badge color="danger" className="text-white fst-normal fw-medium position-absolute top-0 start-50 translate-middle rounded-pill">
                                            {notifications.filter(n => !n.isRead).length > 99 ? "99+" : notifications.filter(n => !n.isRead).length}
                                        </Badge>}
                                    </i>
                                    {isNotifOpen && (
                                        <div
                                            className="position-absolute bg-white shadow rounded p-2"
                                            style={{
                                                top: "120%",
                                                right: 0,
                                                minWidth: "260px",
                                                maxHeight: "300px",
                                                overflowY: "auto",
                                                zIndex: 1100
                                            }}
                                        >
                                            <div className="fw-bold mb-2">
                                                Notifications
                                            </div>
                                            {notifications.length === 0 && (
                                                <div className="text-muted small">
                                                    No notifications
                                                </div>
                                            )}
                                            {notifications.map((n, i) => (
                                                <div
                                                    key={i}
                                                    role="button"
                                                    className={`small py-1 px-1 ${i+1===notifications.length ? "" : "border-bottom"} ${n.isRead ? "bg-dark bg-opacity-10" : ""}`}
                                                    onClick={() => handleNotificationClick(n)}
                                                >
                                                    <div className="fw-semibold">
                                                        {n.title ?? "Notifica"}
                                                    </div>
                                                    <div className="text-muted">
                                                        {n.message}
                                                    </div>
                                                    <div className="text-muted fst-italic" style={{fontSize: "0.7rem"}}>
                                                        {new Date(n.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Container>
                                <div id="avatarRef" role="button" className="d-flex flex-row justify-content-center gap-2 me-3" onClick={() => navigate('/profile')}>
                                    <AvatarIcon size="sm">
                                        {isCitizen(user) && user.profilePicture ?
                                            <img src={`${STATIC_URL}${user.profilePicture}`} alt="Avatar"/>
                                        : <span className="initials">{user.name.charAt(0).toUpperCase()}{user.surname.charAt(0).toUpperCase()}</span>}
                                    </AvatarIcon>
                                    <span className="text-white">
                                        {user.username}
                                    </span>
                                </div>
                                <UncontrolledTooltip placement="bottom" target={"avatarRef"}>
                                    <strong><small>{user.name} {user.surname}</small></strong>
                                    {isStaff(user) &&
                                        <>
                                            <br/>
                                            <em><small>{user.role}</small></em>
                                            <br/>
                                            <em>({user.officeName})</em>
                                        </>
                                    }
                                </UncontrolledTooltip>
                                <LogoutButton logout={() => {
                                    handleLogout().then(() => navigate('/login', {replace: true}));
                                }}/>
                            </>
                        ) : (
                            <Button className="btn-icon btn-full" color="primary" href="/login">
                                <span className="rounded-icon">
                                    <Icon color="primary" icon="it-user"/>
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