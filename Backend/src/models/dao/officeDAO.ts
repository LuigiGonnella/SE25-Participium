import {Column, Entity, OneToMany, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {StaffDAO} from "./staffDAO";

export enum OfficeCategory {
    MOO = "Municipal Organization",
    WSO = "Water Supply",
    ABO = "Architectural Barriers",
    SSO = "Sewer System",
    PLO = "Public Lighting",
    WO = "Waste",
    RSTLO = "Road Signs and Traffic Lights",
    RUFO = "Roads and Urban Furnishings",
    PGAPO = "Public Green Areas and Playgrounds",
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

    @Column({ type: "simple-enum", enum: OfficeCategory, unique: false, nullable: false })
    category: OfficeCategory;

    @Column({ nullable: false, default: false })
    isExternal: boolean;

    @ManyToMany(() => StaffDAO, (staff) => staff.offices)
    members: StaffDAO[];

}