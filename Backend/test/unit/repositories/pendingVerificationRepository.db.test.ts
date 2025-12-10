import { PendingVerificationRepository } from "@repositories/pendingVerificationRepository";
import { PendingVerificationDAO } from "@dao/pendingVerificationDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { ConflictError } from "@errors/ConflictError";
import { InternalServerError } from "@errors/InternalServerError";
import { DEFAULT_CITIZENS, beforeAllE2e, beforeEachE2e, afterAllE2e } from "../../e2e/lifecycle";
import { TestDataSource, initializeTestDataSource, closeTestDataSource } from "../../setup/test-datasource";

jest.mock("node-verification-code", () => ({
  getDigitalCode: jest.fn().mockReturnValue(123456),
}));

describe("PendingVerificationRepository (DB)", () => {
  let repo: PendingVerificationRepository;
  let citizen: CitizenDAO;

  beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();

    const citizenRepo = TestDataSource.getRepository(CitizenDAO);
    citizen = (await citizenRepo.findOneBy({
      username: DEFAULT_CITIZENS.citizen1.username,
    })) as CitizenDAO;

    if (!citizen) {
      throw new Error("Default citizen not found in DB");
    }

    repo = new PendingVerificationRepository();
  });

  afterAll(async () => {
    await afterAllE2e();
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await beforeEachE2e();
    await TestDataSource.getRepository(PendingVerificationDAO).clear();
  });

  describe("createPendingVerification", () => {
    it("creates a new pending verification when none exist", async () => {
      const pv = await repo.createPendingVerification(
        citizen,
        "newemail@example.com",
        "email"
      );

      expect(pv).toBeDefined();
      expect(pv.citizenId).toBe(citizen.id);
      expect(pv.type).toBe("email");
      expect(pv.valueToVerify).toBe("newemail@example.com");
      expect(pv.verificationCode).toBe("123456");
      expect(pv.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("throws ConflictError when a non-expired code already exists", async () => {
      const pvRepo = TestDataSource.getRepository(PendingVerificationDAO);

      await pvRepo.save({
        citizen,
        citizenId: citizen.id,
        type: "email",
        valueToVerify: "existing@example.com",
        verificationCode: "999999",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      await expect(
        repo.createPendingVerification(citizen, "newemail@example.com", "email")
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("deletes expired code and creates a new one", async () => {
        const pvRepo = TestDataSource.getRepository(PendingVerificationDAO);
      
        await pvRepo.save({
          citizen,
          citizenId: citizen.id,
          type: "email",
          valueToVerify: "old@example.com",
          verificationCode: "111111",
          expiresAt: new Date(Date.now() - 60 * 1000),
        });
      
        const fresh = await repo.createPendingVerification(
          citizen,
          "newemail@example.com",
          "email"
        );
      
        const all = await pvRepo.find({
          where: { citizenId: citizen.id, type: "email" },
        });
      
        expect(all.length).toBe(1);
        expect(all[0].verificationCode).toBe("123456");
        expect(all[0].valueToVerify).toBe("newemail@example.com");
      });

    it("throws InternalServerError when more than one pending verification exists", async () => {
    const pvRepo = TestDataSource.getRepository(PendingVerificationDAO);
    
    // Insert 1 valid entry
    await pvRepo.save({
        citizen,
        citizenId: citizen.id,
        type: "email",
        valueToVerify: "a@example.com",
        verificationCode: "111111",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    // Mock repo.find() to simulate a corrupted DB response
    jest.spyOn(pvRepo, "find").mockResolvedValueOnce([
        {
        citizen,
        citizenId: citizen.id,
        type: "email",
        valueToVerify: "a@example.com",
        verificationCode: "111111",
        expiresAt: new Date(),
        },
        {
        citizen,
        citizenId: citizen.id,
        type: "email",
        valueToVerify: "b@example.com",
        verificationCode: "222222",
        expiresAt: new Date(),
        },
    ] as any);
    
    await expect(
        repo.createPendingVerification(citizen, "newemail@example.com", "email")
    ).rejects.toBeInstanceOf(InternalServerError);
    });
  });

  describe("verifyPendingVerification", () => {
    it("updates citizen email and removes pending verification on success", async () => {
      const pvRepo = TestDataSource.getRepository(PendingVerificationDAO);
      const citizenRepo = TestDataSource.getRepository(CitizenDAO);

      const code = "123456";

      await pvRepo.save({
        citizen,
        citizenId: citizen.id,
        type: "email",
        valueToVerify: "verified@example.com",
        verificationCode: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await repo.verifyPendingVerification(citizen.username, code, "email");

      const updatedCitizen = await citizenRepo.findOneBy({ id: citizen.id });
      const remainingPvs = await pvRepo.find({ where: { citizenId: citizen.id, type: "email" } });

      expect(updatedCitizen?.email).toBe("verified@example.com");
      expect(remainingPvs.length).toBe(0);
    });

    it("updates citizen telegram username when type is telegram", async () => {
      const pvRepo = TestDataSource.getRepository(PendingVerificationDAO);
      const citizenRepo = TestDataSource.getRepository(CitizenDAO);

      const code = "123456";

      await pvRepo.save({
        citizen,
        citizenId: citizen.id,
        type: "telegram",
        valueToVerify: "@verified_user",
        verificationCode: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await repo.verifyPendingVerification(citizen.username, code, "telegram");

      const updatedCitizen = await citizenRepo.findOneBy({ id: citizen.id });
      const remainingPvs = await pvRepo.find({ where: { citizenId: citizen.id, type: "telegram" } });

      expect(updatedCitizen?.telegram_username).toBe("@verified_user");
      expect(remainingPvs.length).toBe(0);
    });

    it("throws when code is invalid or expired", async () => {
      const invalidCode = "000000";

      await expect(
        repo.verifyPendingVerification(citizen.username, invalidCode, "email")
      ).rejects.toThrow("The verification code is invalid or has expired");
    });
  });
});