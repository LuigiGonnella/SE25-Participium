import { mapNotificationDAOToDTO } from "@services/mapperService";

// Define a placeholder for the mock instance
const mockRepoInstance = {
    getNotificationsForCitizen: jest.fn(),
    getNotificationsForStaff: jest.fn(),
    markAsRead: jest.fn(),
};

// Use doMock to replace the repository BEFORE the controller is imported
jest.doMock("@repositories/notificationRepository", () => {
    return {
        NotificationRepository: jest.fn().mockImplementation(() => {
            return mockRepoInstance;
        }),
    };
});

// Mock the mapper service as before
jest.mock("@services/mapperService");

// Now, import the controller. It will use the mocked repository.
import { getNotificationsOfUser, markNotificationAsRead } from "@controllers/notificationController";

beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();

    // Reset default mock implementations
    mockRepoInstance.getNotificationsForCitizen.mockResolvedValue([]);
    mockRepoInstance.getNotificationsForStaff.mockResolvedValue([]);
    mockRepoInstance.markAsRead.mockResolvedValue(undefined);

    (mapNotificationDAOToDTO as jest.Mock).mockImplementation((dao: any) => ({
        id: dao.id,
        message: dao.message,
        read: dao.read,
    }));
});

describe("notificationController - getNotificationsOfUser", () => {
    it("returns empty array when user is null/undefined", async () => {
        const result1 = await getNotificationsOfUser(null as any);
        const result2 = await getNotificationsOfUser(undefined as any);

        expect(result1).toEqual([]);
        expect(result2).toEqual([]);
        expect(mockRepoInstance.getNotificationsForCitizen).not.toHaveBeenCalled();
        expect(mockRepoInstance.getNotificationsForStaff).not.toHaveBeenCalled();
    });

    it("fetches citizen notifications when user.type = CITIZEN and maps them to DTOs", async () => {
        const fakeUser = { username: "john", type: "CITIZEN" } as any;
        const daoList = [
            { id: 1, message: "Hello", read: false },
            { id: 2, message: "World", read: true },
        ];

        mockRepoInstance.getNotificationsForCitizen.mockResolvedValueOnce(daoList);

        const result = await getNotificationsOfUser(fakeUser);

        expect(mockRepoInstance.getNotificationsForCitizen).toHaveBeenCalledWith("john");
        expect(mockRepoInstance.getNotificationsForStaff).not.toHaveBeenCalled();
        expect(result).toEqual([
            { id: 1, message: "Hello", read: false },
            { id: 2, message: "World", read: true },
        ]);
        expect(mapNotificationDAOToDTO).toHaveBeenCalledTimes(2);
    });

    it("fetches staff notifications when user.type is not CITIZEN and maps them to DTOs", async () => {
        const fakeUser = { username: "staff1", type: "STAFF" } as any;
        const daoList = [{ id: 10, message: "Assigned", read: false }];

        mockRepoInstance.getNotificationsForStaff.mockResolvedValueOnce(daoList);

        const result = await getNotificationsOfUser(fakeUser);

        expect(mockRepoInstance.getNotificationsForCitizen).not.toHaveBeenCalled();
        expect(mockRepoInstance.getNotificationsForStaff).toHaveBeenCalledWith("staff1");
        expect(result).toEqual([{ id: 10, message: "Assigned", read: false }]);
        expect(mapNotificationDAOToDTO).toHaveBeenCalledTimes(1);
    });
});

describe("notificationController - markNotificationAsRead", () => {
    it("delegates to repository markAsRead", async () => {
        await markNotificationAsRead(42);

        expect(mockRepoInstance.markAsRead).toHaveBeenCalledWith(42);
    });
});
