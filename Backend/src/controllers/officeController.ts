import { Request, Response } from "express";
import { OfficeRepository } from "@repositories/officeRepository";
import AppError from "@models/errors/AppError";
import {BadRequestError} from "@errors/BadRequestError";

export class OfficeController {
  static async createOffice(req: Request, res: Response) {
    try {
      const { name, description, category } = req.body;

      if (!name || !category) {
        throw new BadRequestError("Name and category are required");
      }

      const officeRepo = new OfficeRepository();
      const newOffice = await officeRepo.createOffice(name, description, category);

      return res.status(201).json({
        message: "Office created successfully",
        office: newOffice,
      });
    } catch (error: any) {
      console.error("Error creating office:", error);

      if (error instanceof AppError) {
        return res.status(error.status || 400).json({ message: error.message });
      }

      return res.status(500).json({
        message: "Internal server error while creating office",
      });
    }
  }

  static async getAllOffices(req: Request, res: Response) {
    try {
      const officeRepo = new OfficeRepository();
      const offices = await officeRepo.getAllOffices();
      return res.status(200).json(offices);
    } catch (error: any) {
      console.error("Error fetching offices:", error);
      return res.status(500).json({ message: "Failed to fetch offices" });
    }
  }
}
