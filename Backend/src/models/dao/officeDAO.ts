import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {StaffDAO} from "./staffDAO";

export enum OfficeCategory {
    MOO = "Municipal Organization Office",
    WSO = "Water Supply Office",
    ABO = "Architectural Barriers Office",
    SSO = "Sewer System Office",
    PLO = "Public Lighting Office",
    WO = "Waste Office",
    RSTLO = "Road Signs and Traffic Lights Office",
    RUFO = "Roads and Urban Furnishings Office",
    PGAPO = "Public Green Areas and Playgrounds Office",
}
// "Other" report category must be assigned to the right office based on the type of issue reported.

@Entity("office")
export class OfficeDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column()
    description: string;

    @Column({ unique: true, nullable: false })
    category: OfficeCategory;

    @OneToMany(() => StaffDAO, (staff) => staff.office)
    members: StaffDAO[];
}