import {NextFunction, Request, Response} from "express";
import {validateOfficeCategory} from "@utils";
import {StaffRepository} from "@repositories/staffRepository";
import {mapStaffDAOToDTO} from "@services/mapperService";

const repo = new StaffRepository();

export async function getAllStaff(req: Request, res: Response) {
    try {
        const isExternalParam = req.query.isExternal?.toString().toLowerCase();
        const categoryParam = req.query.category?.toString().toUpperCase();

        const isExternal = isExternalParam === "true" ? true : (isExternalParam === "false" ? false : undefined);
        const category = categoryParam ? validateOfficeCategory(categoryParam) : undefined;

        const staffs = await (new StaffRepository()).getAllStaffs(isExternal, category);

        res.status(200).json(staffs.map(mapStaffDAOToDTO));
    } catch (error: any) {
        console.error("Error fetching staff members:", error);
        res.status(500).json({ message: "Failed to fetch staff members" });
    }
}

export async function getAllEMStaff(req: Request, res: Response) {
    try {
        const categoryParam = req.query.category?.toString().toUpperCase();

        const category = categoryParam ? validateOfficeCategory(categoryParam) : undefined;

        const staffs = await (new StaffRepository()).getAllStaffs(true, category);

        res.status(200).json(staffs.map(mapStaffDAOToDTO));
    } catch (error: any) {
        console.error("Error fetching staff members:", error);
        res.status(500).json({ message: "Failed to fetch staff members" });
    }
}

export async function getAllTOSM(req: Request, res: Response) {
    try {
        const categoryParam = req.query.category?.toString().toUpperCase();
        const category = categoryParam ? validateOfficeCategory(categoryParam) : undefined;

        const repo = new StaffRepository();
        const staffs = await repo.getAllTOSM(category);

        res.status(200).json(staffs.map(mapStaffDAOToDTO));
    } catch (error: any) {
        console.error("Error fetching TOSM staff:", error);
        res.status(500).json({ message: "Failed to fetch TOSM staff" });
    }
}