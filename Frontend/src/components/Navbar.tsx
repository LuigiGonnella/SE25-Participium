import {
    AvatarIcon,
    Button,
    Header,
    HeaderBrand,
    HeaderContent,
    HeaderRightZone,
    Icon, LinkList, LinkListItem, UncontrolledTooltip
} from 'design-react-kit';
import {LogoutButton} from './LoginPage';
import {useNavigate} from "react-router";
import {isCitizen, isStaff, StaffRole, type User} from "../models/Models.ts";

interface NavComponentProps {
    loggedIn: boolean;
    user?: User;
    handleLogout: () => Promise<void>;
}

function NavComponent({loggedIn, user, handleLogout}: NavComponentProps) {

    const navigate = useNavigate();

    let avatarDetails = user && `<strong>${user.name} ${user.surname}</strong>`;
    if (isStaff(user))
        avatarDetails += `<br/><em>${user.officeName}</em>`

    return (
        <>
            <Header type="slim" style={{position: 'sticky', top: 0, zIndex: 1000}}>
                <HeaderContent>
                    <HeaderBrand className="fs-5 fw-bold d-none d-lg-block" href='/' responsive>
                        Participium
                    </HeaderBrand>
                    <div className="nav-mobile">
                        <nav className="d-flex flex-row justify-content-end">
                            <a className="it-opener d-lg-none" data-bs-toggle="collapse" href="#menu1a" role="button"
                               aria-expanded="false" aria-controls="menu4">
                                <span className="fs-5 fw-bold">Participium</span>
                                <svg className="icon" aria-hidden="true">
                                    <use href="/bootstrap-italia/dist/svg/sprites.svg#it-expand"></use>
                                </svg>
                            </a>
                            <LinkList className="collapse" id="menu1a">
                                <LinkListItem inDropdown href="/map" active={ window.location.pathname === '/map' }>
                                    Map
                                </LinkListItem>

                            {(loggedIn && isStaff(user) && user.role === StaffRole.ADMIN) && (
                                <LinkListItem inDropdown href="/municipality-registration" active={ window.location.pathname === '/municipality-registration' }>
                                    Add staff
                                </LinkListItem>
                            )}
                            </LinkList>
                        </nav>
                    </div>
                    <HeaderRightZone>
                        {loggedIn && user ? (
                            <>
                                <div id="avatarRef" role="button" className="d-flex flex-row justify-content-center gap-2 me-3" onClick={() => navigate('/profile')}>
                                    <AvatarIcon size="sm">
                                        {isCitizen(user) && user.profilePicture ?
                                            <img src={user.profilePicture} alt="Avatar"/>
                                        : <span className="initials">{user.name.charAt(0).toUpperCase()}{user.surname.charAt(0).toUpperCase()}</span>}
                                    </AvatarIcon>
                                    <span className="d-none d-lg-block text-white">
                                        {user.username}
                                    </span>
                                </div>
                                <UncontrolledTooltip placement="bottom" target={"avatarRef"}>
                                    {user.name} {user.surname}
                                    {isStaff(user) &&
                                        <>
                                        <br/>
                                        <i>{user.officeName}</i>
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