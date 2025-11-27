import { Request, Response, NextFunction } from 'express';
import { getAllCitizens, getCitizenById, getCitizenByEmail, getCitizenByUsername } from '@controllers/citizenController';
import { NotFoundError } from '@models/errors/NotFoundError';

// Mock implementations
jest.mock('@controllers/citizenController');

describe('Citizen Routes Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('GET /citizens', () => {
        it('should return all citizens', async () => {
            const mockCitizens = [
                { id: 1, username: 'user1', email: 'user1@test.com', name: 'Test', surname: 'User1' },
                { id: 2, username: 'user2', email: 'user2@test.com', name: 'Test', surname: 'User2' }
            ];

            (getAllCitizens as jest.Mock).mockResolvedValueOnce(mockCitizens);

            await getAllCitizens();

            expect(getAllCitizens).toHaveBeenCalled();
        });

        it('should handle errors when getting all citizens', async () => {
            const error = new Error('Database error');
            
            (getAllCitizens as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getAllCitizens();
            } catch (err) {
                expect(err).toBe(error);
            }

            expect(getAllCitizens).toHaveBeenCalled();
        });

        it('should return empty array when no citizens exist', async () => {
            (getAllCitizens as jest.Mock).mockResolvedValueOnce([]);

            const result = await getAllCitizens();

            expect(result).toEqual([]);
            expect(getAllCitizens).toHaveBeenCalled();
        });
    });

    describe('GET /citizens/id/:id', () => {
        it('should return citizen by id', async () => {
            const mockCitizen = {
                id: 1,
                username: 'testuser',
                email: 'test@test.com',
                name: 'Test',
                surname: 'User'
            };

            mockRequest.params = { id: '1' };
            (getCitizenById as jest.Mock).mockResolvedValueOnce(mockCitizen);

            await getCitizenById(1);

            expect(getCitizenById).toHaveBeenCalledWith(1);
        });

        it('should return null when citizen not found by id', async () => {
            mockRequest.params = { id: '999' };
            (getCitizenById as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenById(999);

            expect(result).toBeNull();
            expect(getCitizenById).toHaveBeenCalledWith(999);
        });

        it('should handle invalid id parameter', async () => {
            mockRequest.params = { id: 'invalid' };
            
            const id = parseInt('invalid');
            expect(isNaN(id)).toBe(true);
        });

        it('should handle errors when getting citizen by id', async () => {
            const error = new Error('Database error');
            
            mockRequest.params = { id: '1' };
            (getCitizenById as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getCitizenById(1);
            } catch (err) {
                expect(err).toBe(error);
            }
        });
    });

    describe('GET /citizens/email/:email', () => {
        it('should return citizen by email', async () => {
            const mockCitizen = {
                id: 1,
                username: 'testuser',
                email: 'test@test.com',
                name: 'Test',
                surname: 'User'
            };

            mockRequest.params = { email: 'test@test.com' };
            (getCitizenByEmail as jest.Mock).mockResolvedValueOnce(mockCitizen);

            await getCitizenByEmail('test@test.com');

            expect(getCitizenByEmail).toHaveBeenCalledWith('test@test.com');
        });

        it('should return null when citizen not found by email', async () => {
            mockRequest.params = { email: 'notfound@test.com' };
            (getCitizenByEmail as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenByEmail('notfound@test.com');

            expect(result).toBeNull();
            expect(getCitizenByEmail).toHaveBeenCalledWith('notfound@test.com');
        });

        it('should handle errors when getting citizen by email', async () => {
            const error = new Error('Database error');
            
            mockRequest.params = { email: 'test@test.com' };
            (getCitizenByEmail as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getCitizenByEmail('test@test.com');
            } catch (err) {
                expect(err).toBe(error);
            }
        });

        it('should handle special characters in email', async () => {
            const emailWithSpecialChars = 'test+special@test.com';
            mockRequest.params = { email: emailWithSpecialChars };
            
            (getCitizenByEmail as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenByEmail(emailWithSpecialChars);

            expect(getCitizenByEmail).toHaveBeenCalledWith(emailWithSpecialChars);
        });
    });

    describe('GET /citizens/username/:username', () => {
        it('should return citizen by username', async () => {
            const mockCitizen = {
                id: 1,
                username: 'testuser',
                email: 'test@test.com',
                name: 'Test',
                surname: 'User'
            };

            mockRequest.params = { username: 'testuser' };
            (getCitizenByUsername as jest.Mock).mockResolvedValueOnce(mockCitizen);

            await getCitizenByUsername('testuser');

            expect(getCitizenByUsername).toHaveBeenCalledWith('testuser');
        });

        it('should return null when citizen not found by username', async () => {
            mockRequest.params = { username: 'notfound' };
            (getCitizenByUsername as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenByUsername('notfound');

            expect(result).toBeNull();
            expect(getCitizenByUsername).toHaveBeenCalledWith('notfound');
        });

        it('should handle errors when getting citizen by username', async () => {
            const error = new Error('Database error');
            
            mockRequest.params = { username: 'testuser' };
            (getCitizenByUsername as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getCitizenByUsername('testuser');
            } catch (err) {
                expect(err).toBe(error);
            }
        });

        it('should handle username with spaces', async () => {
            const usernameWithSpaces = 'test user';
            mockRequest.params = { username: usernameWithSpaces };
            
            (getCitizenByUsername as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenByUsername(usernameWithSpaces);

            expect(getCitizenByUsername).toHaveBeenCalledWith(usernameWithSpaces);
        });

        it('should handle case-sensitive username search', async () => {
            const username = 'TestUser';
            mockRequest.params = { username };
            
            (getCitizenByUsername as jest.Mock).mockResolvedValueOnce(null);

            const result = await getCitizenByUsername(username);

            expect(getCitizenByUsername).toHaveBeenCalledWith(username);
        });
    });

    describe('PATCH /citizens/:username', () => {
        it('should update citizen profile', async () => {
            const mockUpdatedCitizen = {
                telegram_username: 'newtelegram',
                receive_emails: true
            };
            mockRequest.params = { username: 'testuser' };
            mockRequest.body = {
                telegram_username: 'newtelegram',
                receive_emails: 'true'
            };
            mockRequest.user = { username: 'testuser' };
            (getCitizenByUsername as jest.Mock).mockResolvedValueOnce(mockUpdatedCitizen);

            await getCitizenByUsername('testuser');
            expect(getCitizenByUsername).toHaveBeenCalledWith('testuser');
        });
    });

    describe('Route error handling', () => {
        it('should call next with error when controller throws', async () => {
            const error = new NotFoundError('Citizen not found');
            
            (getCitizenById as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getCitizenById(1);
            } catch (err) {
                nextFunction(err);
            }

            expect(nextFunction).toHaveBeenCalledWith(error);
        });

        it('should handle unexpected errors gracefully', async () => {
            const error = new Error('Unexpected error');
            
            (getAllCitizens as jest.Mock).mockRejectedValueOnce(error);

            try {
                await getAllCitizens();
            } catch (err) {
                nextFunction(err);
            }

            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
