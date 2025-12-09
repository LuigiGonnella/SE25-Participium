import { DataSource } from 'typeorm';
import { Response, NextFunction } from 'express';
import { login, register } from '@controllers/authController';
import { CitizenDAO } from '@dao/citizenDAO';
import { StaffDAO } from '@dao/staffDAO';
import { OfficeDAO } from '@dao/officeDAO';
import { ReportDAO } from '@dao/reportDAO';
import { NotificationDAO } from '@dao/notificationDAO';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { configurePassport } from '@config/passport';
import { AppDataSource } from "@database";
import { MessageDAO } from '@models/dao/messageDAO';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF } from "../../e2e/lifecycle";

let localDataSource: DataSource;

beforeAll(async () => {
    localDataSource = new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [CitizenDAO, StaffDAO, OfficeDAO, ReportDAO, NotificationDAO, MessageDAO],
        synchronize: true,
        logging: false
    });
    await localDataSource.initialize();
    Object.assign(AppDataSource, localDataSource);

    // Initialize default entities
    await beforeAllE2e();

    // Configure passport
    configurePassport();
});

afterAll(async () => {
    await localDataSource.destroy();
});

describe('AuthController - login', () => {
    it('should reject invalid type parameter', async () => {
        const req = { query: { type: 'INVALID' } } as any;
        const res = {} as Response;
        const next = (() => {}) as NextFunction;

        await expect(login(req, res, next)).rejects.toThrow('Invalid or missing query parameter');
    });

    it('should reject missing type parameter', async () => {
        const req = { query: {} } as any;
        const res = {} as Response;
        const next = (() => {}) as NextFunction;

        await expect(login(req, res, next)).rejects.toThrow('Invalid or missing query parameter');
    });

    it('should call passport with citizen-local strategy for CITIZEN type', async () => {
        const req = { query: { type: 'CITIZEN' }, body: {} } as any;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
        const next = jest.fn();

        const authenticateSpy = jest.spyOn(passport, 'authenticate');
        
        await login(req, res, next);

        expect(authenticateSpy).toHaveBeenCalledWith('citizen-local', expect.any(Function));
        authenticateSpy.mockRestore();
    });

    it('should call passport with staff-local strategy for STAFF type', async () => {
        const req = { query: { type: 'STAFF' }, body: {} } as any;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
        const next = jest.fn();

        const authenticateSpy = jest.spyOn(passport, 'authenticate');
        
        await login(req, res, next);

        expect(authenticateSpy).toHaveBeenCalledWith('staff-local', expect.any(Function));
        authenticateSpy.mockRestore();
    });
});

describe('AuthController - register', () => {
    it('should register a new citizen successfully', async () => {
        const req = {
            body: {
                email: 'newuser@example.com',
                username: 'newuser',
                name: 'New',
                surname: 'User',
                password: 'password123',
                receive_emails: true,
                telegram_username: '@newuser'
            }
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'newuser@example.com',
                username: 'newuser'
            })
        );
    });

    it('should fail when registering with existing default citizen email', async () => {
        const req = {
            body: {
                email: DEFAULT_CITIZENS.citizen1.email,
                username: 'differentusername',
                name: 'Test',
                surname: 'User',
                password: 'password123'
            }
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(expect.any(Number));
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it('should fail when registering with existing default citizen username', async () => {
        const req = {
            body: {
                email: 'newemail@example.com',
                username: DEFAULT_CITIZENS.citizen1.username,
                name: 'Test',
                surname: 'User',
                password: 'password123'
            }
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(expect.any(Number));
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it('should fail when required fields are missing', async () => {
        const req = {
            body: {
                email: 'test@example.com',
                // missing username, name, surname, password
            }
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should hash password before saving', async () => {
        const req = {
            body: {
                email: 'hashtest@example.com',
                username: 'hashuser',
                name: 'Hash',
                surname: 'Test',
                password: 'plainpassword123',
                receive_emails: false
            }
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await register(req, res);

        const savedCitizen = await localDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ email: 'hashtest@example.com' });

        expect(savedCitizen).toBeDefined();
        expect(savedCitizen?.password).not.toBe('plainpassword123');
        
        const isMatch = await bcrypt.compare('plainpassword123', savedCitizen!.password);
        expect(isMatch).toBe(true);
    });
});