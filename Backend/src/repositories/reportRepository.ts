import {Repository} from "typeorm";
import {AppDataSource} from "@database";
import {ReportDAO} from "@dao/reportDAO";
import {CitizenDAO} from "@dao/citizenDAO";
import {OfficeCategory} from "@dao/officeDAO";

export class ReportRepository {
    private repo: Repository<ReportDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
    }

    async create(
        citizen: CitizenDAO,
        title: string,
        description: string,
        category: OfficeCategory,
        latitude: number,
        longitude: number,
        anonymous: boolean,
        photo1: string,
        photo2?: string,
        photo3?: string
    ): Promise<ReportDAO> {
        return this.repo.save({
            citizen: citizen,
            title: title,
            description: description,
            category: category,
            latitude: latitude,
            longitude: longitude,
            anonymous: anonymous,
            photo1: photo1,
            photo2: photo2,
            photo3: photo3
        });
    }
}