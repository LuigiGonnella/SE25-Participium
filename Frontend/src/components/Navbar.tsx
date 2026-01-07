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

function NavComponent({loggedIn, user, handleLogout}: Readonly<NavComponentProps>) {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement | null>(null);

    const unreadNotifications = notifications.filter(n => !n.isRead).length;

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
            // Navigate to reports page for staff, map with report selected for citizens
            if (user && isStaff(user)) {
                navigate("/reports/" + n.reportId);
            } else {
                navigate("/map?reportId=" + n.reportId);
            }
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <Header type="slim" className="pb-0" style={{position: 'sticky', top: 0, zIndex: 1100}}>
            <HeaderContent>
                <HeaderBrand className="fs-5 fw-bold d-none d-lg-block pe-2" href='/' responsive>
                    Participium
                </HeaderBrand>
                <div className="nav-mobile">
                    <nav className="d-flex flex-column justify-content-end">
                        <button className="it-opener d-lg-none btn p-1 border-0 bg-transparent text-white"
                           data-bs-toggle="collapse"
                           data-bs-target="#menu1a"
                           type="button"
                           aria-expanded="false"
                           aria-controls="menu1a">
                            <span className="fs-5 fw-bold">Participium</span>
                            <Icon aria-hidden icon="it-expand" color="white" />
                        </button>
                        <LinkList className="collapse me-0 pe-1" id="menu1a">
                            {!loggedIn && (
                                <LinkListItem inDropdown href="/" active={globalThis.location.pathname === '/'}>
                                    Homepage
                                </LinkListItem>
                            )}
                            {!isStaff(user) && (
                                <LinkListItem inDropdown href="/map" active={globalThis.location.pathname === '/map'}>
                                    Map
                                </LinkListItem>
                            )}
                            {(loggedIn && isStaff(user)) && user.role !== StaffRole.ADMIN && (
                                <LinkListItem inDropdown href="/reports"
                                              active={globalThis.location.pathname === '/reports'}>
                                    Reports
                                </LinkListItem>
                            )}
                            {(loggedIn && isStaff(user) && user.role === StaffRole.ADMIN) && (
                                <>
                                    <LinkListItem inDropdown href="/tosms"
                                                  active={globalThis.location.pathname === '/tosms'}>
                                        Staff Management
                                    </LinkListItem>
                                    <LinkListItem inDropdown href="/municipality-registration"
                                                  active={globalThis.location.pathname === '/municipality-registration'}>
                                        Staff Registration
                                    </LinkListItem>
                                </>
                            )}
                        </LinkList>
                    </nav>
                </div>
                <HeaderRightZone className={loggedIn ? "pt-1" : ""}>
                    {loggedIn && user ? (
                        <>
                            {isCitizen(user) && (<Container ref={notifRef} className={"position-relative pe-0 " + (unreadNotifications > 0 ? "pt-1" : "")}>
                                <button type="button" className={"btn p-0 border-0 bg-transparent bi bi-bell-fill text-white position-relative " + (unreadNotifications > 0 ? "pe-4" : "pe-2")}
                                    aria-label={isNotifOpen ? "Close notifications" : "Open notifications"}
                                    aria-expanded={isNotifOpen}
                                   onClick={() => setIsNotifOpen(prevState => !prevState)}>
                                    {unreadNotifications > 0 &&
                                        <Badge color="danger"
                                               className="text-white fst-normal fw-medium position-absolute top-0 start-50 translate-middle rounded-pill">
                                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                                        </Badge>}
                                </button>
                                {isNotifOpen && (
                                    <div
                                        className="position-absolute bg-white shadow rounded"
                                        style={{
                                            top: "120%",
                                            right: "-100px",
                                            minWidth: "260px",
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                            zIndex: 1100
                                        }}
                                    >
                                        <div className="fw-bold my-1 ps-1">
                                            Notifications
                                        </div>
                                        {notifications.length === 0 && (
                                            <div className="text-muted small">
                                                No notifications
                                            </div>
                                        )}
                                        {notifications.map((n, i) => (
                                            <button
                                                key={n.id}
                                                type="button"
                                                className={`w-100 text-start border-0 small py-1 px-1 mx-0 ${i + 1 === notifications.length ? "" : "border-bottom"} ${n.isRead ? "bg-dark bg-opacity-10" : "bg-transparent"}`}
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
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Container>)}
                            <button id="avatarRef" type="button"
                                 className="d-flex flex-row justify-content-center gap-2 mx-2 border-0 bg-transparent p-0"
                                 aria-label="Open profile"
                                 onClick={() => navigate('/profile')}>
                                <AvatarIcon size="sm">
                                    {isCitizen(user) && user.profilePicture ?
                                        <img src={`${STATIC_URL}${user.profilePicture}`} alt="Avatar"/>
                                        : <span
                                            className="initials">{user.name.charAt(0).toUpperCase()}{user.surname.charAt(0).toUpperCase()}</span>}
                                </AvatarIcon>
                                <span className="text-white">
                                        {user.username}
                                    </span>
                            </button>
                            <UncontrolledTooltip placement="bottom" target={"avatarRef"}>
                                <strong><small>{user.name} {user.surname}</small></strong>
                                {isStaff(user) &&
                                    <>
                                        <br/>
                                        <em><small>{user.role}</small></em>
                                        <br/>
                                        <em>{user.officeNames?.map((o) => (
                                            <span key={o} className="badge text-white border border-white me-1">
                                                    {o}
                                                </span>
                                        ))}
                                        </em>
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
    )
}

export default NavComponent;