import { ErrorDTO } from "@models/dto/ErrorDTO";
import type { Citizen as CitizenDTO } from "@models/dto/Citizen";
import type { Staff as StaffDTO } from "@models/dto/Staff";
import type { Office as OfficeDTO } from "@models/dto/Office";
import type { Report as ReportDTO } from "@models/dto/Report";
import type { Message as MessageDTO } from "@models/dto/Message";
import { CitizenDAO } from "@models/dao/citizenDAO";
import {StaffDAO} from "@dao/staffDAO";
import {OfficeDAO} from "@dao/officeDAO";
import { ReportDAO } from "@models/dao/reportDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import { Notification } from "@models/dto/Notification";
import {MessageDAO} from "@dao/messageDAO";


export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

function removeNullAttributes<T extends object>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}

//CITIZEN DTO

export function mapCitizenDAOToDTO(citizenDAO: CitizenDAO): CitizenDTO {
  return removeNullAttributes({
    email: citizenDAO.email,
    username: citizenDAO.username,
    name: citizenDAO.name,
    surname: citizenDAO.surname,
    profilePicture: citizenDAO.profilePicture,
    telegram_username: citizenDAO.telegram_username,
    receive_emails: citizenDAO.receive_emails,
  }) as CitizenDTO;
}

export function mapStaffDAOToDTO(staffDAO: StaffDAO): StaffDTO {
  return removeNullAttributes({
    username: staffDAO.username,
    name: staffDAO.name,
    surname: staffDAO.surname,
    role: staffDAO.role,
    officeNames: staffDAO.offices.map(o => o.name),
  }) as StaffDTO;
}

export function mapOfficeDAOToDTO(officeDAO: OfficeDAO): OfficeDTO {
  return removeNullAttributes({
    name: officeDAO.name,
    description: officeDAO.description,
    category: officeDAO.category,
    isExternal: officeDAO.isExternal,
    members: officeDAO.members?.map(member => mapStaffDAOToDTO(member))
  }) as OfficeDTO;
}

//REPORT DTO

export function mapReportDAOToDTO(reportDAO: ReportDAO): ReportDTO {
  return removeNullAttributes({
        id: reportDAO.id,
        citizenUsername: reportDAO.anonymous ? undefined : reportDAO.citizen?.username,
        timestamp: reportDAO.timestamp,
        status: reportDAO.status,
        title: reportDAO.title,
        description: reportDAO.description,
        category: reportDAO.category,
        coordinates: [reportDAO.latitude, reportDAO.longitude],
        photos: [reportDAO.photo1, reportDAO.photo2, reportDAO.photo3].filter(Boolean) as string[],
        comment: reportDAO.comment,
        assignedStaff: reportDAO.assignedStaff?.username,
        isExternal: reportDAO.isExternal,
        assignedEM: reportDAO.assignedEM?.username,
        messages: reportDAO.messages?.map(mapMessageToDTO)
    }) as ReportDTO;
}

//NOTIFICATION DTO

export function mapNotificationDAOToDTO(dao: NotificationDAO): Notification {
    return {
        id: dao.id,
        timestamp: dao.timestamp.toISOString(),
        title: dao.title,
        message: dao.message,
        isRead: dao.isRead,
        reportId: dao.report?.id,
        citizenUsername: dao.citizen?.username,
        staffUsername: dao.staff?.username
    };
}

export function mapMessageToDTO(messageDAO: MessageDAO): MessageDTO {
    return removeNullAttributes({
        timestamp: messageDAO.timestamp.toISOString(),
        message: messageDAO.message,
        staffUsername: messageDAO.staff?.username,
        isPrivate: messageDAO.isPrivate
    }) as MessageDTO;
}