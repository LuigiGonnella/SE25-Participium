import { NotificationRepository } from "@repositories/notificationRepository";
import { mapNotificationDAOToDTO } from "@services/mapperService";

const repo = new NotificationRepository();

export async function getNotificationsOfUser(user: any) {
    if (!user) return [];

    let daoList;
    if (user.role === "CITIZEN") {
        daoList = await repo.getNotificationsForCitizen(user.username);
    } else {
        daoList = await repo.getNotificationsForStaff(user.username);
    }

    return daoList.map(mapNotificationDAOToDTO);
}

export async function markNotificationAsRead(id: number): Promise<void> {
    await repo.markAsRead(id);
}