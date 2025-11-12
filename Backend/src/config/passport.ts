import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { CitizenRepository } from '@repositories/citizenRepository';
import { StaffRepository } from '@repositories/staffRepository';
import bcrypt from 'bcrypt';
import {mapCitizenDAOToDTO, mapStaffDAOToDTO} from "@services/mapperService";

export const configurePassport = () => {

    passport.serializeUser((user: any, done) => {
        done(null, { username: user.username, type: user.type });
    });

    passport.deserializeUser(async (data: any, done) => {
        try {
            if (data.type === 'CITIZEN') {
                const repo = new CitizenRepository();
                const user = await repo.getCitizenByUsername(data.username);
                if (!user) {
                    return done(new Error('User not found'));
                }
                done(null, { ...mapCitizenDAOToDTO(user), type: 'CITIZEN' });
            } else {
                const repo = new StaffRepository();
                const user = await repo.getStaffByUsername(data.username);
                if (!user) {
                    return done(new Error('User not found'));
                }
                done(null, { ...mapStaffDAOToDTO(user), type: 'STAFF' });
            }
        } catch (error) {
            done(error);
        }
    });

    passport.use('citizen-local', new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        async (username, password, done) => {
            try {
                const repo = new CitizenRepository();
                const user = await repo.getCitizenByUsername(username)
                    || await repo.getCitizenByEmail(username);

                if (!user || !await bcrypt.compare(password, user.password)) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                return done(null, { ...mapCitizenDAOToDTO(user), type: 'CITIZEN' });
            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.use('staff-local', new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        async (username, password, done) => {
            try {
                const repo = new StaffRepository();
                const user = await repo.getStaffByUsername(username);

                if (!user || !await bcrypt.compare(password, user.password)) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                return done(null, { ...mapStaffDAOToDTO(user), type: 'STAFF' });
            } catch (error) {
                return done(error);
            }
        }
    ));
};
