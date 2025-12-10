import '../../setup/mockEmailService';
import { Response, NextFunction } from 'express';
import { login, register } from '@controllers/authController';
import { CitizenDAO } from '@dao/citizenDAO';
import { StaffDAO } from '@dao/staffDAO';
import { OfficeDAO, OfficeCategory } from '@dao/officeDAO';
import { ReportDAO } from '@dao/reportDAO';
import { NotificationDAO } from '@dao/notificationDAO';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { configurePassport } from '@config/passport';
import { MessageDAO } from '@models/dao/messageDAO';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF } from "../../e2e/lifecycle";
import { PendingVerificationDAO } from '@dao/pendingVerificationDAO';
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";


beforeAll(async () => {
    await initializeTestDataSource();

    // Initialize default entities
    await beforeAllE2e();

    // Configure passport
    configurePassport();
});

afterAll(async () => {
    await closeTestDataSource();
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

// NOTE: The following register tests are commented out because the register function
// signature has changed to accept individual parameters instead of req/res
// These tests need to be rewritten for the new signature
/*
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
*/

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
    const citizenRepo = TestDataSource.getRepository(CitizenDAO);
    await citizenRepo.clear();
  });

  it("should register a new citizen successfully", async () => {
    const result = await register(
      newCitizen.email,
      newCitizen.username,
      newCitizen.name,
      newCitizen.surname,
      newCitizen.password,
      newCitizen.receive_emails,
      fakeMulterFile,
      newCitizen.telegram_username
    );

    const citizenRepo = TestDataSource.getRepository(CitizenDAO);
    const saved = await citizenRepo.findOneBy({ username: newCitizen.username });

    expect(result).toBeDefined();
    expect(saved).not.toBeNull();
    expect(saved?.username).toBe(newCitizen.username);
    expect(saved?.email).toBeNull(); // Email is null until verified
    expect(saved?.password).not.toBe(newCitizen.password);
  });

  it("should throw an error if username already exists", async () => {
    const citizenRepo = TestDataSource.getRepository(CitizenDAO);
    const existing = await citizenRepo.save({
      email: "existing@example.com",
      username: "duplicateuser",
      name: "Existing",
      surname: "User",
      password: await bcrypt.hash("password123", 10),
      receive_emails: true,
    });

    // Verify the citizen was actually saved
    const found = await citizenRepo.findOne({ where: { username: "duplicateuser" }});
    expect(found).not.toBeNull();

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

describe('AuthController - updateStaffOffices', () => {
  const { updateStaffOffices } = require('@controllers/authController');
  const { TestDataManager } = require('../../e2e/lifecycle');

  it('should update staff offices with array of office names', async () => {
    const office1 = await TestDataManager.getOffice(OfficeCategory.PLO);
    const office2 = await TestDataManager.getOffice(OfficeCategory.WO);

    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: [office1.name, office2.name] }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        username: DEFAULT_STAFF.tosm_WSO.username,
        officeNames: expect.arrayContaining([office1.name, office2.name])
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should add office to staff with add property', async () => {
    const office = await TestDataManager.getOffice(OfficeCategory.SSO);

    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { add: office!.name }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        username: DEFAULT_STAFF.tosm_WSO.username,
        officeNames: expect.arrayContaining([office.name])
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should remove office from staff with remove property', async () => {
    // First ensure staff has multiple offices
    const office1 = await TestDataManager.getOffice(OfficeCategory.PLO);
    const office2 = await TestDataManager.getOffice(OfficeCategory.WO);

    const setupReq = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: [office1.name, office2.name] }
    } as any;
    const setupRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    await updateStaffOffices(setupReq, setupRes, jest.fn());

    // Now remove one office
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { remove: office2.name }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        username: DEFAULT_STAFF.tosm_WSO.username,
        officeNames: expect.not.arrayContaining([office2.name])
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when body has no valid property', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { invalidProperty: 'test' }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("PATCH must contain")
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when offices is not an array', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: 'not-an-array' }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("PATCH must contain")
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when add is not a string', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { add: 123 }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("PATCH must contain")
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when remove is not a string', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { remove: ['array'] }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("PATCH must contain")
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error when staff not found', async () => {
    const office = await TestDataManager.getOffice(OfficeCategory.WO);

    const req = {
      params: { username: 'nonexistent_user' },
      body: { offices: [office.name] }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next with error when office not found', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: ['NonExistentOffice'] }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next with error when adding duplicate office', async () => {
    const office = await TestDataManager.getOffice(OfficeCategory.PLO);

    // First set the office
    const setupReq = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: [office.name] }
    } as any;
    const setupRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    await updateStaffOffices(setupReq, setupRes, jest.fn());

    // Try to add the same office again
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { add: office.name }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should handle empty offices array correctly', async () => {
    const req = {
      params: { username: DEFAULT_STAFF.tosm_WSO.username },
      body: { offices: [] }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;
    const next = jest.fn();

    await updateStaffOffices(req, res, next);

    // Empty array is valid - it removes all offices
    // Note: removeNullAttributes filters out empty arrays, so offices won't be in response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        username: DEFAULT_STAFF.tosm_WSO.username
      })
    );
    // Verify offices is either undefined or empty array
    const response = res.json.mock.calls[0][0];
    expect(response.offices === undefined || response.offices.length === 0).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });
});



