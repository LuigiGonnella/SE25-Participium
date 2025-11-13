import type { Citizen as CitizenDTO } from "@models/dto/Citizen"
import { CitizenRepository } from "@repositories/citizenRepository"
import { mapCitizenDAOToDTO } from "@services/mapperService"


export const citizenRepository = new CitizenRepository();

export async function getAllCitizens(): Promise<CitizenDTO[]> {
    const citizenDAOs = await citizenRepository.getAllCitizens();
    return citizenDAOs.map(mapCitizenDAOToDTO);
}

export async function getCitizenById(id: number): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenById(id);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}

export async function getCitizenByEmail(email: string): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenByEmail(email);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}

export async function getCitizenByUsername(username: string): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenByUsername(username);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}