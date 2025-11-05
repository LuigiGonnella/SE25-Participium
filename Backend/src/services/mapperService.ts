import { ErrorDTO } from "@models/dto/ErrorDTO";
import { Token as TokenDTO } from "@models/dto/Token";
import type { Citizen as CitizenDTO } from "@models/dto/Citizen";
import type { Staff as StaffDTO } from "@models/dto/Staff";
import type { Office as OfficeDTO } from "@models/dto/Office";
import { CitizenDAO } from "@models/dao/citizenDAO";
import {StaffDAO} from "@dao/staffDAO";
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

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
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
    id: citizenDAO.id,
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
    id: staffDAO.id,
    username: staffDAO.username,
    name: staffDAO.name,
    surname: staffDAO.surname,
    role: staffDAO.role,
    officeId: staffDAO.office?.id
  }) as StaffDTO;
}

export function mapOfficeDAOToDTO(officeDAO: OfficeDAO): OfficeDTO {
  return removeNullAttributes({
    id: officeDAO.id,
    name: officeDAO.name,
    description: officeDAO.description,
    category: officeDAO.category,
    members: officeDAO.members?.map(member => mapStaffDAOToDTO(member))
  }) as OfficeDTO;
}