import { AppDataSource } from "@database";
import { OfficeCategory, OfficeDAO } from "@models/dao/officeDAO";
import { Repository } from "typeorm";


export class OfficeRepository {
    private readonly repo: Repository<OfficeDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(OfficeDAO);
    }

    // Create default offices if they don't exist
    async createDefaultOfficesIfNotExist() {
        const defaultOffices = [
            {
                name: "Municipal Organization Office",
                description: "Office responsible for municipal administration and management",
                category: OfficeCategory.MOO
            },
            {
                name: "Water Supply Office",
                description: "Technical office responsible for water supply and management",
                category: OfficeCategory.WSO
            },
            {
                name: "Architectural Barriers Office",
                description: "Technical office responsible for removing architectural barriers in public spaces",
                category: OfficeCategory.ABO
            },
            {
                name: "Sewer System Office",
                description: "Technical office responsible for sewer system maintenance and management",
                category: OfficeCategory.SSO
            },
            {
                name: "Public Lighting Office",
                description: "Technical office responsible for public lighting systems",
                category: OfficeCategory.PLO
            },
            {
                name: "Waste Office",
                description: "Technical office responsible for waste management and disposal",
                category: OfficeCategory.WO
            },
            {
                name: "Road Signs and Traffic Lights Office",
                description: "Technical office responsible for road signs and traffic lights maintenance",
                category: OfficeCategory.RSTLO
            },
            {
                name: "Roads and Urban Furnishings Office",
                description: "Technical office responsible for road maintenance and urban furnishings",
                category: OfficeCategory.RUFO
            },
            {
                name: "Public Green Areas and Playgrounds Office",
                description: "Technical office responsible for maintenance of public green areas and playgrounds",
                category: OfficeCategory.PGAPO
            },

            /*EXTERNAL COMPANY*/ 

            {
                name: "External Company - Water Supply",
                description: "External company responsible for water supply and management",
                category: OfficeCategory.WSO,
                isExternal: true
            },
            {
                name: "External Company - Architectural Barriers",
                description: "External company responsible for removing architectural barriers in public spaces",
                category: OfficeCategory.ABO,
                isExternal: true
            },
            {
                name: "External Company - Sewer System",
                description: "External company responsible for sewer system maintenance and management",
                category: OfficeCategory.SSO,
                isExternal: true
            },
            {
                name: "External Company - Public Lighting",
                description: "External company responsible for public lighting systems",
                category: OfficeCategory.PLO,
                isExternal: true
            },
            {
                name: "External Company - Waste",
                description: "External company responsible for waste management and disposal",
                category: OfficeCategory.WO,
                isExternal: true
            },
            {
                name: "External Company - Road Signs and Traffic Lights",
                description: "External company responsible for road signs and traffic lights maintenance",
                category: OfficeCategory.RSTLO,
                isExternal: true
            },
            {
                name: "External Company - Roads and Urban Furnishings",
                description: "External company responsible for road maintenance and urban furnishings",
                category: OfficeCategory.RUFO,
                isExternal: true
            },
            {
                name: "External Company - Public Green Areas and Playgrounds",
                description: "External company responsible for maintenance of public green areas and playgrounds",
                category: OfficeCategory.PGAPO,
                isExternal: true
            },
        ];

        for (const officeData of defaultOffices) {
            const isNewExternal = officeData.isExternal;
            const officeExists = await this.repo.exists({ where: { category: officeData.category, isExternal: isNewExternal } });
            
            if (!officeExists) {
                const office = this.repo.create(officeData);
                await this.repo.save(office);
                console.log(`Default office created: ${officeData.name} (${officeData.category})`);
            }
        }
    }

    // get all offices
    async getAllOffices(isExternal?: boolean): Promise<OfficeDAO[]> {
        if (isExternal !== undefined) {
            return await this.repo.find({ where: { isExternal }, relations: ["members"] });
        }
        return await this.repo.find({ relations: ["members"] });
    }

    // get office by ID
    async getOfficeById(id: number): Promise<OfficeDAO | null> {
        return await this.repo.findOne({ where: { id }, relations: ["members"] });
    }

    // get office by name
    async getOfficeByName(name: string): Promise<OfficeDAO | null> {
        return await this.repo.findOne({ where: { name }, relations: ["members"] });
    }

    // get office by category
    async getOfficeByCategory(category: OfficeCategory): Promise<OfficeDAO | null> {
        return await this.repo.findOne({ where: { category }, relations: ["members"] });
    }
}
