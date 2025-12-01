import { AppDataSource } from "@database";
import { OfficeCategory, OfficeDAO } from "@models/dao/officeDAO";
import { throwConflictIfFound } from "@utils";
import { Repository } from "typeorm";
import AppError from "@models/errors/AppError";

export class OfficeRepository {
    private repo: Repository<OfficeDAO>;

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
            const officeExists = await this.repo.exists({ where: { category: officeData.category } });
            
            if (!officeExists) {
                const office = this.repo.create(officeData);
                await this.repo.save(office);
                console.log(`Default office created: ${officeData.name} (${officeData.category})`);
            }
        }
    }

    // get all offices
    async getAllOffices(): Promise<OfficeDAO[]> {
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

    /* TODO: check if this function down are correct */

    // create new office
    /* async createOffice(
        name: string,
        description: string,
        category: OfficeCategory
    ): Promise<OfficeDAO> {
        if (!name || !category) {
            throw new AppError("Invalid input data: name and category are required", 400);
        }
        
        name = name.trim();
        //category = category.trim();
        if (description) {
            description = description.trim();
        }

        // Check if office with same name exists
        throwConflictIfFound(
            await this.repo.find({ where: { name }}),
            () => true,
            `Office already exists with name ${name}`,
        );

        // Check if office with same category exists
        throwConflictIfFound(
            await this.repo.find({ where: { category }}),
            () => true,
            `Office already exists with category ${category}`,
        );

        return await this.repo.save({
            name,
            description,
            category
        });
    } */

    // update office
    /* async updateOffice(
        id: number,
        name?: string,
        description?: string,
        category?: OfficeCategory
    ): Promise<OfficeDAO> {
        const office = await this.getOfficeById(id);
        
        if (!office) {
            throw new AppError(`Office with id ${id} not found`, 404);
        }

        // Check for conflicts if name is being updated
        if (name && name !== office.name) {
            name = name.trim();
            throwConflictIfFound(
                await this.repo.find({ where: { name }}),
                () => true,
                `Office already exists with name ${name}`,
            );
            office.name = name;
        }

        // Check for conflicts if category is being updated
        if (category && category !== office.category) {
            //category = category.trim();
            throwConflictIfFound(
                await this.repo.find({ where: { category }}),
                () => true,
                `Office already exists with category ${category}`,
            );
            office.category = category;
        }

        if (description !== undefined) {
            office.description = description.trim();
        }

        return await this.repo.save(office);
    } */

    // delete office
    /* async deleteOffice(id: number): Promise<void> {
        const office = await this.getOfficeById(id);
        
        if (!office) {
            throw new AppError(`Office with id ${id} not found`, 404);
        }

        // Check if office has members
        if (office.members && office.members.length > 0) {
            throw new AppError(
                `Cannot delete office with id ${id}: office has ${office.members.length} staff members. Please reassign or remove them first.`,
                400
            );
        }

        await this.repo.remove(office);
    } */
}
