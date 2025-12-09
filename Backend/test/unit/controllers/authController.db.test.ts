import { DataSource } from 'typeorm';
import { Response, NextFunction } from 'express';
import { login } from '@controllers/authController';
import { register } from '@controllers/authController';
import { CitizenDAO } from '@dao/citizenDAO';
import { StaffDAO, StaffRole } from '@dao/staffDAO';
import { OfficeDAO } from '@dao/officeDAO';
import { ReportDAO } from '@dao/reportDAO';
import { NotificationDAO } from '@dao/notificationDAO';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { configurePassport } from '@config/passport';
import { AppDataSource } from "@database";
import { MessageDAO } from '@models/dao/messageDAO';
import { PendingVerificationDAO } from '@dao/pendingVerificationDAO';


let localDataSource: DataSource;

beforeAll(async () => {
    localDataSource = new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: [CitizenDAO, StaffDAO, OfficeDAO, ReportDAO, NotificationDAO, MessageDAO, PendingVerificationDAO],
        synchronize: true,
        logging: false
    });
    await localDataSource.initialize();

    Object.assign(AppDataSource, localDataSource);


    // Configure passport
    configurePassport();

    // Create test citizen
    const citizenRepo = localDataSource.getRepository(CitizenDAO);
    await citizenRepo.save({
        email: 'test@test.com',
        username: 'testuser',
        name: 'Test',
        surname: 'User',
        password: await bcrypt.hash('password123', 10),
        receive_emails: false
    });

    // Create test staff
    const staffRepo = localDataSource.getRepository(StaffDAO);
    await staffRepo.save({
        username: 'admin',
        name: 'Admin',
        surname: 'User',
        password: await bcrypt.hash('admin123', 10),
        role: StaffRole.ADMIN
    });
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

    it('should handle authentication errors from passport', (done) => {
        const req = { query: { type: 'CITIZEN' }, body: {} } as any;
        const res = {} as any;
        const next = jest.fn((error) => {
            expect(error).toBeDefined();
            expect(error.message).toBe('Database error');
            done();
        });

        const mockError = new Error('Database error');
        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(mockError, null, null);
            };
        });

        login(req, res, next);
    });

    it('should return 401 when user not found', (done) => {
        const req = { query: { type: 'CITIZEN' }, body: {} } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(res.status).toHaveBeenCalledWith(401);
                expect(data.error).toBe('Invalid credentials');
                done();
            })
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, false, { message: 'User not found' });
            };
        });

        login(req, res, next);
    });

    it('should handle req.login errors', (done) => {
        const req = {
            query: { type: 'CITIZEN' },
            body: {},
            login: jest.fn((user, callback) => callback(new Error('Session error')))
        } as any;
        const res = {} as any;
        const next = jest.fn((error) => {
            expect(error).toBeDefined();
            expect(error.message).toBe('Session error');
            done();
        });

        const mockUser = { id: 1, username: 'test', type: 'CITIZEN' };
        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, mockUser, null);
            };
        });

        login(req, res, next);
    });

    it('should successfully login and return user data', (done) => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', type: 'CITIZEN' };
        const req = {
            query: { type: 'CITIZEN' },
            body: {},
            login: jest.fn((user, callback) => callback(null))
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(res.status).toHaveBeenCalledWith(200);
                expect(data).toEqual(mockUser);
                expect(req.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
                done();
            })
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, mockUser, null);
            };
        });

        login(req, res, next);
    });

    it('should return 401 with custom message from info when authentication fails', (done) => {
        const req = { query: { type: 'CITIZEN' }, body: {} } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(res.status).toHaveBeenCalledWith(401);
                expect(data.message).toBe('Wrong password');
                expect(data.error).toBe('Invalid credentials');
                done();
            })
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, false, { message: 'Wrong password' });
            };
        });

        login(req, res, next);
    });

    it('should return 401 with default message when info is undefined', (done) => {
        const req = { query: { type: 'STAFF' }, body: {} } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(res.status).toHaveBeenCalledWith(401);
                expect(data.message).toBe('Authentication failed');
                expect(data.error).toBe('Invalid credentials');
                done();
            })
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, false, undefined);
            };
        });

        login(req, res, next);
    });

    it('should use staff-local strategy when type is STAFF', (done) => {
        const mockUser = { id: 2, username: 'staffuser', type: 'STAFF' };
        const req = {
            query: { type: 'STAFF' },
            body: {},
            login: jest.fn((user, callback) => callback(null))
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(data).toEqual(mockUser);
                done();
            })
        } as any;
        const next = jest.fn();

        const authenticateSpy = jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            expect(strategy).toBe('staff-local');
            return (req: any, res: any, next: any) => {
                callback(null, mockUser, null);
            };
        });

        login(req, res, next);
    });

    it('should reject when type is lowercase citizen', async () => {
        const req = { query: { type: 'citizen' } } as any;
        const res = {} as Response;
        const next = (() => {}) as NextFunction;

        await expect(login(req, res, next)).rejects.toThrow('Invalid or missing query parameter');
    });

    it('should reject when type is empty string', async () => {
        const req = { query: { type: '' } } as any;
        const res = {} as Response;
        const next = (() => {}) as NextFunction;

        await expect(login(req, res, next)).rejects.toThrow('Invalid or missing query parameter');
    });

    it('should use citizen-local strategy when type is exactly CITIZEN', (done) => {
        const mockUser = { id: 3, username: 'citizen123', type: 'CITIZEN' };
        const req = {
            query: { type: 'CITIZEN' },
            body: {},
            login: jest.fn((user, callback) => callback(null))
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(data).toEqual(mockUser);
                done();
            })
        } as any;
        const next = jest.fn();

        const authenticateSpy = jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            expect(strategy).toBe('citizen-local');
            return (req: any, res: any, next: any) => {
                callback(null, mockUser, null);
            };
        });

        login(req, res, next);
    });

    it('should handle null info object when user not found', (done) => {
        const req = { query: { type: 'CITIZEN' }, body: {} } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn((data) => {
                expect(res.status).toHaveBeenCalledWith(401);
                expect(data.message).toBe('Authentication failed');
                done();
            })
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            return (req: any, res: any, next: any) => {
                callback(null, null, null);
            };
        });

        login(req, res, next);
    });

    it('should call passport callback with all three parameters', (done) => {
        const req = { query: { type: 'STAFF' }, body: {} } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(() => done())
        } as any;
        const next = jest.fn();

        jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback: any) => {
            expect(callback).toBeInstanceOf(Function);
            return (req: any, res: any, next: any) => {
                callback(null, false, { message: 'Test' });
            };
        });

        login(req, res, next);
    });
});

describe("AuthController - session persistence", () => {
  it("should save user in session after login", (done) => {
    const mockUser = { id: 1, username: "john", type: "CITIZEN" };
    const req = {
      query: { type: "CITIZEN" },
      body: {},
      session: {},
      login: jest.fn((user, cb) => {
        req.session.user = user;
        cb(null);
      }),
    } as any;

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    jest.spyOn(passport, "authenticate").mockImplementation((_, callback: any) => {
      return (req: any, res: any, next: any) => callback(null, mockUser, null);
    });

    login(req, res, next);
    expect(req.session.user).toEqual(mockUser);
    expect(req.login).toHaveBeenCalledWith(mockUser, expect.any(Function));
    done();
  });
});

describe("AuthController - bcrypt failure", () => {
  it("should handle bcrypt.compare throwing an error", (done) => {
    const req = { query: { type: "CITIZEN" }, body: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn((err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Hash error");
      done();
    });

    jest
      .spyOn(passport, "authenticate")
      .mockImplementation((strategy, callback: any) => {
        return (req: any, res: any, next: any) => {
          callback(new Error("Hash error"), null, null);
        };
      });

    login(req, res, next);
  });
});

//--------------------------------------------------------------
// AuthController - Registration Tests (Story 1)
//--------------------------------------------------------------
describe("AuthController - register", () => {
  const newCitizen = {
    email: "newcitizen@example.com",
    username: "newcitizen",
    name: "New",
    surname: "Citizen",
    password: "mypassword123",
    receive_emails: true,
    profilePicture: "",
    telegram_username: "newcitizen_telegram",
  };

  const fakeMulterFile = {
    fieldname: "profilePicture",
    originalname: "test.png",
    encoding: "7bit",
    mimetype: "image/png",
    size: 1234,
    buffer: Buffer.from("fake image data"),
    destination: "/tmp",
    filename: "test.png",
    path: "/tmp/test.png",
  } as Express.Multer.File;

  beforeEach(async () => {
    const citizenRepo = localDataSource.getRepository(CitizenDAO);
    await citizenRepo.clear();
  });

  it("should register a new citizen successfully", async () => {
    await register(
      newCitizen.email,
      newCitizen.username,
      newCitizen.name,
      newCitizen.surname,
      newCitizen.password,
      newCitizen.receive_emails,
      fakeMulterFile,
      newCitizen.telegram_username
    );

    const citizenRepo = localDataSource.getRepository(CitizenDAO);
    const saved = await citizenRepo.findOneBy({ username: newCitizen.username });

    expect(saved).not.toBeNull();
    expect(saved?.username).toBe(newCitizen.username);
    expect(saved?.email).toBeNull(); // Email is null until verified
    expect(saved?.password).not.toBe(newCitizen.password);
  });

  it("should throw an error if username already exists", async () => {
    const citizenRepo = localDataSource.getRepository(CitizenDAO);
    await citizenRepo.save({
      email: "existing@example.com",
      username: "duplicateuser",
      name: "Existing",
      surname: "User",
      password: await bcrypt.hash("password123", 10),
      receive_emails: true,
    });

    await expect(
      register(
        "another@example.com",
        "duplicateuser",
        "John",
        "Doe",
        "somepassword",
        true,
        fakeMulterFile,
        ""
      )
    ).rejects.toThrow();
  });

  it("should throw an error when email is missing", async () => {
    await expect(
      register(
        "",
        "nousername",
        "No",
        "Email",
        "password",
        false,
        fakeMulterFile,
        ""
      )
    ).rejects.toThrow();
  });
});


