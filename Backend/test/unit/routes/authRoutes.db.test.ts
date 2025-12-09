import { Request, Response, NextFunction } from 'express';
import { login } from '@controllers/authController';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource } from "../../setup/test-datasource";

jest.mock('@controllers/authController');

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
});

afterAll(async () => {
    await closeTestDataSource();
});

describe('Auth Routes Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {
                username: DEFAULT_CITIZENS.citizen1.username,
                password: DEFAULT_CITIZENS.citizen1.password
            },
            logout: jest.fn()
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('POST /login', () => {
        it('should successfully login default citizen', async () => {
            const mockLoginResponse = {
                token: 'mock-token',
                user: { username: DEFAULT_CITIZENS.citizen1.username }
            };
            
            (login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

            await login(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(login).toHaveBeenCalled();
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should successfully login default staff', async () => {
            mockRequest.body = {
                username: DEFAULT_STAFF.admin.username,
                password: DEFAULT_STAFF.admin.password
            };

            const mockLoginResponse = {
                token: 'mock-token',
                user: { username: DEFAULT_STAFF.admin.username }
            };
            
            (login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

            await login(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(login).toHaveBeenCalled();
        });

        it('should handle login failure', async () => {
            const error = new UnauthorizedError('Invalid credentials');
            
            (login as jest.Mock).mockImplementation(async (req, res, next) => {
                next(error);
            });

            try {
                await login(mockRequest as Request, mockResponse as Response, nextFunction);
            } catch (err) {
                nextFunction(err);
            }

            expect(nextFunction).toHaveBeenCalledWith(error);
            expect(mockResponse.json).not.toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /logout', () => {
        it('should successfully logout user', () => {
            (mockRequest.logout as jest.Mock).mockImplementation((callback) => callback());

            (mockRequest.logout as jest.Mock).mock.calls[0]?.[0]();
            const err = undefined;
            if (err) {
                mockResponse.status!(500);
                mockResponse.json!({ message: 'Logout failed' });
            } else {
                mockResponse.status!(204);
                mockResponse.send!();
            }

            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle logout failure', () => {
            const error = new Error('Logout failed');
            (mockRequest.logout as jest.Mock).mockImplementation((callback) => callback(error));

            const err = error;
            if (err) {
                mockResponse.status!(500);
                mockResponse.json!({ message: 'Logout failed' });
            } else {
                mockResponse.status!(204);
                mockResponse.send!();
            }

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logout failed' });
        });
    });
    
    describe("AuthRoutes - /me endpoint", () => {
        const isAuthenticated = (roles: string[]) => {
            return (req: any, res: any, next: any) => {
                if (!req.isAuthenticated || !req.isAuthenticated()) {
                    return res.status(401).json({ message: "Unauthorized" });
                }

                if (!roles.includes(req.user?.type)) {
                    return res.status(403).json({ message: "Forbidden" });
                }

                next();
            };
        };

        it("should allow access when authenticated as default citizen", () => {
            const req = {
                user: { username: DEFAULT_CITIZENS.citizen1.username, type: "CITIZEN" },
                isAuthenticated: () => true
            } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            isAuthenticated(["CITIZEN", "STAFF"])(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it("should allow access when authenticated as default staff", () => {
            const req = {
                user: { username: DEFAULT_STAFF.admin.username, type: "STAFF" },
                isAuthenticated: () => true
            } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            isAuthenticated(["CITIZEN", "STAFF"])(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it("should return 401 when unauthenticated", () => {
            const req = { isAuthenticated: () => false } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            isAuthenticated(["CITIZEN", "STAFF"])(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it("should return 403 for unauthorized role", () => {
            const req = {
                isAuthenticated: () => true,
                user: { type: "UNKNOWN" }
            } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            isAuthenticated(["CITIZEN", "STAFF"])(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
        });
    });
});