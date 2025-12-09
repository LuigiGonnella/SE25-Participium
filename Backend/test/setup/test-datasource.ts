import { AppDataSource } from "@database";
import { DataSource } from "typeorm";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { OfficeDAO } from "@dao/officeDAO";
import { ReportDAO } from "@dao/reportDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import { MessageDAO } from "@models/dao/messageDAO";
import { PendingVerificationDAO } from "@models/dao/pendingVerificationDAO";

export const TestDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  entities: [CitizenDAO, StaffDAO, OfficeDAO, ReportDAO, NotificationDAO, MessageDAO, PendingVerificationDAO],
});

export async function initializeTestDataSource(): Promise<void> {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
    Object.assign(AppDataSource, TestDataSource);
  }
}

export async function closeTestDataSource(): Promise<void> {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}
