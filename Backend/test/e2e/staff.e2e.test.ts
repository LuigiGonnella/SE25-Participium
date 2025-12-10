import request from "supertest";
import { app } from "@app";
import { 
    beforeAllE2e, 
    afterAllE2e, 
    beforeEachE2e, 
    DEFAULT_STAFF,
    TestDataManager 
} from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { StaffDAO } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";

describe("Staff Role Management E2E Tests", () => {
    let adminCookie: string;
    let tosmCookie: string;
    let mproCookie: string;

    beforeAll(async () => {
        await beforeAllE2e();

        // Login as admin
        const adminLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.admin.username,
                password: DEFAULT_STAFF.admin.password,
            })
            .expect(200);
        adminCookie = adminLogin.headers['set-cookie'][0];

        // Login as TOSM
        const tosmLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.tosm_WSO.username,
                password: DEFAULT_STAFF.tosm_WSO.password,
            })
            .expect(200);
        tosmCookie = tosmLogin.headers['set-cookie'][0];

        // Login as MPRO
        const mproLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.mpro.username,
                password: DEFAULT_STAFF.mpro.password,
            })
            .expect(200);
        mproCookie = mproLogin.headers['set-cookie'][0];
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        await beforeEachE2e();
    });

    describe("PATCH /api/v1/staffs/:username/offices - Update Staff Offices (Multiple Roles)", () => {
        describe("Authentication and Authorization", () => {
            it("should deny access to non-authenticated users", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(401);

                expect(res.body).toHaveProperty("message");
            });

            it("should deny access to non-admin staff members", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', tosmCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(403);

                expect(res.body).toHaveProperty("message");
            });

            it("should deny access to MPRO staff members", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', mproCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(403);

                expect(res.body).toHaveProperty("message");
            });

            it("should allow access to admin users", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
            });
        });

        describe("Complete Office Replacement (offices parameter)", () => {
            it("should replace all offices for a staff member with a single office", async () => {
                // Get the initial state
                const staffBefore = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffBefore).toBeTruthy();
                
                // Update to a single office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Architectural Barriers Office"] })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Architectural Barriers Office");

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(1);
                expect(staffAfter?.offices[0].name).toBe("Architectural Barriers Office");
            });

            it("should assign multiple offices to a staff member (serving multiple technical offices)", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office", 
                            "Sewer System Office",
                            "Public Lighting Office"
                        ] 
                    })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                expect(res.body.officeNames).toHaveLength(3);
                expect(res.body.officeNames).toContain("Water Supply Office");
                expect(res.body.officeNames).toContain("Sewer System Office");
                expect(res.body.officeNames).toContain("Public Lighting Office");

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(3);
            });

            it("should clear all offices when provided with an empty array", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: [] })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                // Empty array is removed by mapper, so officeNames should not exist or be empty
                expect(res.body.officeNames || []).toHaveLength(0);

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(0);
            });

            it("should fail when office names do not exist", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Non-Existent Office", "Another Fake Office"] })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("Offices not found");
            });

            it("should fail when some offices exist and some do not", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office", 
                            "Non-Existent Office"
                        ] 
                    })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("Offices not found");
            });

            it("should fail when staff member does not exist", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/nonexistent_user/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("Staff not found");
            });
        });

        describe("Adding Single Office (add parameter)", () => {
            it("should add a new office to staff member's existing offices", async () => {
                // First, set initial state with one office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Add another office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Sewer System Office" })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                expect(res.body.officeNames).toHaveLength(2);
                expect(res.body.officeNames).toContain("Water Supply Office");
                expect(res.body.officeNames).toContain("Sewer System Office");

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(2);
            });

            it("should add multiple offices sequentially", async () => {
                // Start with one office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Add second office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Sewer System Office" })
                    .expect(200);

                // Add third office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Public Lighting Office" })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(3);
                expect(res.body.officeNames).toContain("Water Supply Office");
                expect(res.body.officeNames).toContain("Sewer System Office");
                expect(res.body.officeNames).toContain("Public Lighting Office");
            });

            it("should fail when adding an office that staff already has", async () => {
                // Set initial office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Try to add the same office again
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Water Supply Office" })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("already has office");
            });

            it("should fail when adding a non-existent office", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Non-Existent Office" })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("Office not found");
            });

            it("should add office to staff with no previous offices", async () => {
                // Clear all offices first
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: [] })
                    .expect(200);

                // Add an office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Water Supply Office" })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Water Supply Office");
            });
        });

        describe("Removing Single Office (remove parameter - Role Cancellation)", () => {
            it("should remove an office from staff member's offices", async () => {
                // Set up with multiple offices
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office", 
                            "Sewer System Office",
                            "Public Lighting Office"
                        ] 
                    })
                    .expect(200);

                // Remove one office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Sewer System Office" })
                    .expect(200);

                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                expect(res.body.officeNames).toHaveLength(2);
                expect(res.body.officeNames).toContain("Water Supply Office");
                expect(res.body.officeNames).toContain("Public Lighting Office");
                expect(res.body.officeNames).not.toContain("Sewer System Office");

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(2);
            });

            it("should remove the last office leaving staff with no offices", async () => {
                // Set up with one office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Remove the office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Water Supply Office" })
                    .expect(200);

                // Empty array is removed by mapper, so officeNames should not exist or be empty
                expect(res.body.officeNames || []).toHaveLength(0);

                // Verify in database
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(0);
            });

            it("should allow removing multiple offices sequentially", async () => {
                // Set up with three offices
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office", 
                            "Sewer System Office",
                            "Public Lighting Office"
                        ] 
                    })
                    .expect(200);

                // Remove first office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Water Supply Office" })
                    .expect(200);

                // Remove second office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Sewer System Office" })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Public Lighting Office");
            });

            it("should succeed when removing an office that staff does not have", async () => {
                // Set up with one office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Try to remove a different office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Sewer System Office" })
                    .expect(200);

                // Should still have the original office
                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Water Supply Office");
            });

            it("should fail when removing a non-existent office", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Non-Existent Office" })
                    .expect(400);

                expect(res.body).toHaveProperty("message");
                expect(res.body.message).toContain("Office not found");
            });

            it("should handle removing from staff with no offices", async () => {
                // Clear all offices
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: [] })
                    .expect(200);

                // Try to remove an office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Water Supply Office" })
                    .expect(200);

                // Empty array is removed by mapper, so officeNames should not exist or be empty
                expect(res.body.officeNames || []).toHaveLength(0);
            });
        });

        describe("Mixed Operations and Edge Cases", () => {
            it("should work across different staff members independently", async () => {
                // Modify TOSM_WSO
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office", "Sewer System Office"] })
                    .expect(200);

                // Modify TOSM_ABO
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_ABO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Architectural Barriers Office", "Public Lighting Office"] })
                    .expect(200);

                // Verify both are independent
                const staff1 = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                const staff2 = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_ABO.username },
                    relations: ['offices']
                });

                expect(staff1?.offices).toHaveLength(2);
                expect(staff2?.offices).toHaveLength(2);
                expect(staff1?.offices[0].id).not.toBe(staff2?.offices[0].id);
            });

            it("should fail when no action is specified (no offices, add, or remove)", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({})
                    .expect(400);

                expect(res.body).toHaveProperty("message");
            });

            it("should work with external offices (EM staff)", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.em_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "External Company - Water Supply",
                            "External Company - Sewer System"
                        ] 
                    })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(2);
                expect(res.body.officeNames).toContain("External Company - Water Supply");
                expect(res.body.officeNames).toContain("External Company - Sewer System");
            });

            it("should allow mixing internal and external offices", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office",
                            "External Company - Sewer System"
                        ] 
                    })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(2);
                expect(res.body.officeNames).toContain("Water Supply Office");
                expect(res.body.officeNames).toContain("External Company - Sewer System");
            });

            it("should preserve staff member's other properties when updating offices", async () => {
                const staffBefore = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username }
                });

                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username }
                });

                expect(staffAfter?.username).toBe(staffBefore?.username);
                expect(staffAfter?.name).toBe(staffBefore?.name);
                expect(staffAfter?.surname).toBe(staffBefore?.surname);
                expect(staffAfter?.role).toBe(staffBefore?.role);
                expect(staffAfter?.password).toBe(staffBefore?.password);
            });
        });

        describe("Real-world Scenarios", () => {
            it("should handle staff member transitioning between offices (role change)", async () => {
                // Start with Water Supply Office
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Transition to Sewer System Office
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Sewer System Office"] })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Sewer System Office");
            });

            it("should handle staff member covering for another (temporary additional role)", async () => {
                // Initial role
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: ["Water Supply Office"] })
                    .expect(200);

                // Add temporary coverage
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ add: "Sewer System Office" })
                    .expect(200);

                // Remove temporary coverage
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ remove: "Sewer System Office" })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(1);
                expect(res.body.officeNames[0]).toBe("Water Supply Office");
            });

            it("should handle staff member serving multiple offices permanently", async () => {
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office",
                            "Sewer System Office",
                            "Public Lighting Office",
                            "Waste Office"
                        ] 
                    })
                    .expect(200);

                expect(res.body.officeNames).toHaveLength(4);
                
                // Verify staff can serve all these offices
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter?.offices).toHaveLength(4);
            });

            it("should handle complete role cancellation (removing all offices)", async () => {
                // Set up with multiple offices
                await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ 
                        offices: [
                            "Water Supply Office",
                            "Sewer System Office"
                        ] 
                    })
                    .expect(200);

                // Cancel all roles
                const res = await request(app)
                    .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_WSO.username}/offices`)
                    .set('Cookie', adminCookie)
                    .send({ offices: [] })
                    .expect(200);

                // Empty array is removed by mapper, so officeNames should not exist or be empty
                expect(res.body.officeNames || []).toHaveLength(0);
                expect(res.body).toHaveProperty("username", DEFAULT_STAFF.tosm_WSO.username);
                
                // Staff member still exists, just has no offices
                const staffAfter = await TestDataSource.getRepository(StaffDAO).findOne({
                    where: { username: DEFAULT_STAFF.tosm_WSO.username },
                    relations: ['offices']
                });
                expect(staffAfter).toBeTruthy();
                expect(staffAfter?.offices).toHaveLength(0);
            });
        });
    });
});
