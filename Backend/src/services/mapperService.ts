import { ErrorDTO } from "@models/dto/ErrorDTO";
import type { Citizen as CitizenDTO } from "@models/dto/Citizen";
import { Staff as StaffDTO, StaffRole as StaffRoleDTO } from "@models/dto/Staff";
import type { Office as OfficeDTO } from "@models/dto/Office";
import { CitizenDAO } from "@models/dao/citizenDAO";
import { StaffDAO, StaffRole as StaffRoleDAO } from "@dao/staffDAO";
import {OfficeDAO} from "@dao/officeDAO";

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
  const roleMap: Record<StaffRoleDAO, StaffRoleDTO> = {
    [StaffRoleDAO.ADMIN]: StaffRoleDTO.ADMIN,
    [StaffRoleDAO.MPRO]: StaffRoleDTO.MPRO,
    [StaffRoleDAO.MA]: StaffRoleDTO.MA,
    [StaffRoleDAO.TOSM]: StaffRoleDTO.TOSM,
  };

  return removeNullAttributes({
    id: staffDAO.id,
    username: staffDAO.username,
    name: staffDAO.name,
    surname: staffDAO.surname,
    role: roleMap[staffDAO.role],
    officeName: staffDAO.office?.name,
  }) as StaffDTO;
}

export function mapOfficeDAOToDTO(officeDAO: OfficeDAO): OfficeDTO {
  return removeNullAttributes({
    name: officeDAO.name,
    description: officeDAO.description,
    category: officeDAO.category,
    members: officeDAO.members?.map(member => mapStaffDAOToDTO(member))
  }) as OfficeDTO;
}