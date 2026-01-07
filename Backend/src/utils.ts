import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import {StaffDAO, StaffRole} from "@dao/staffDAO";
import {ReportDAO, Status} from "@dao/reportDAO";
import {BadRequestError} from "@errors/BadRequestError";
import {OfficeCategory} from "@dao/officeDAO";
import turinBoundary from './data/turinBoundary.json';
import * as turf from '@turf/turf';
import {Between, FindOperator, FindOptionsWhere, In, Like} from "typeorm";
import {ReportFilters} from "@repositories/reportRepository";

export function findOrThrowNotFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): T {
  const item = array.find(predicate);
  if (!item) {
    throw new NotFoundError(errorMessage);
  }
  return item;
}

export function throwConflictIfFound<T>(
  array: T[],
  predicate: (item: T) => boolean,
  errorMessage: string
): void {
  if (array.some(predicate)) {
    throw new ConflictError(errorMessage);
  }
}

export function validateStatus(status: string): Status {
    const statusValue = String(status).toUpperCase();
    if (!(statusValue in Status)) {
        throw new BadRequestError("Invalid status.");
    }
    return Status[statusValue as keyof typeof Status];
}

export function validateStatusByRole(
    status: string | undefined,
    role: StaffRole,
    comment?: string,
): Status {

  if(!status) {
      throw new BadRequestError("Status is required.");
  }

  const updatedStatus = validateStatus(status);

  const validStatusForRole: Record<StaffRole, Status[]> = {
    [StaffRole.MPRO]: [Status.PENDING, Status.ASSIGNED, Status.REJECTED],
    [StaffRole.TOSM]: [Status.IN_PROGRESS, Status.SUSPENDED, Status.RESOLVED],
    [StaffRole.ADMIN]: [],
    [StaffRole.MA]: [],
    [StaffRole.EM]: [Status.IN_PROGRESS, Status.SUSPENDED, Status.RESOLVED],
  };

  if (!validStatusForRole[role].includes(updatedStatus)) {
    throw new BadRequestError(`Invalid status for ${role}.`);
  }

  if (role === StaffRole.MPRO) {
    if((updatedStatus === Status.PENDING || updatedStatus === Status.ASSIGNED) && comment)
      throw new BadRequestError("Comments can only be added when report is rejected.");

    if (updatedStatus === Status.REJECTED && !comment)
      throw new BadRequestError("A comment is required when rejecting a report.");
  }

  if (role === StaffRole.TOSM || role === StaffRole.EM) {
    if (updatedStatus !== Status.RESOLVED && comment) {
      throw new BadRequestError("Comments can only be added when resolving a report.");
    }
  }

  return updatedStatus;
}

export function validateOfficeCategory(category: string): OfficeCategory {
    const categoryValue = String(category).toUpperCase();
    if (!(categoryValue in OfficeCategory)) {
        throw new BadRequestError("Invalid office category.");
    }
    return OfficeCategory[categoryValue as keyof typeof OfficeCategory];
}

export function validateIsExternal(isExternalParam: string | undefined): boolean | undefined {
    if (isExternalParam === "true") {
        return true;
    } else if (isExternalParam === "false") {
        return false;
    } else {
        return undefined;
    }
}

export function validateReportId(reportId: unknown): number {
    const id = Number(reportId);
    if (Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
        throw new BadRequestError("Invalid reportId.");
    }
    return id;
}

export function validateDate(dateStr: unknown, fieldName: string): Date {
    const date = new Date(String(dateStr));
    if (Number.isNaN(date.getTime())) {
        throw new BadRequestError(`Invalid ${fieldName} format.`);
    }
    return date;
}

export function isWithinTurin(lat: number, lon: number): boolean {
    try {
        const turinPolygon = turf.multiPolygon(turinBoundary.coordinates).geometry;
        const point = turf.point([lon, lat]);

        return turf.booleanPointInPolygon(point, turinPolygon);
    } catch (error) {
        console.error("Error checking Turin boundaries:", error);
        return false;
    }
}

export const validateReportsFilters = (staffUser: StaffDAO, filters?: ReportFilters): FindOptionsWhere<ReportDAO> | [] => {
    const where: FindOptionsWhere<ReportDAO> = {};

    if (filters?.citizen_username) {
        where.citizen = { username: filters.citizen_username };
    }

    if (filters?.status){
        where.status = filters.status;
    }

    if (filters?.title) {
        where.title = Like(`%${filters.title}%`);
    }

    if (filters?.category) {
        where.category = filters.category;
    }

    if (filters?.staff_username) {
        where.assignedStaff = { username: filters.staff_username };
    }

    where.timestamp = validateReportDateFilters(filters);

    return validateReportStaffFilters(staffUser, where);
}

const validateReportStaffFilters = (staffUser: StaffDAO, where: FindOptionsWhere<ReportDAO>): FindOptionsWhere<ReportDAO> | [] => {
    if ([StaffRole.TOSM, StaffRole.EM].includes(staffUser.role)) {
        const staffCategories = staffUser.offices.map(o => o.category);
        if (where.category && !staffCategories.includes(where.category as OfficeCategory))
            return [];
        else if (!where.category)
            where.category = In(staffCategories);

        const allowedStatuses = [Status.ASSIGNED, Status.IN_PROGRESS, Status.SUSPENDED, Status.RESOLVED];
        if (where.status && !allowedStatuses.includes(where.status as Status))
            return [];
        else if (!where.status)
            where.status = In(allowedStatuses);
    } else if ([StaffRole.MPRO].includes(staffUser.role)) {
        const allowedStatuses = [Status.PENDING, Status.ASSIGNED, Status.REJECTED];
        if (where.status && !allowedStatuses.includes(where.status as Status))
            return [];
        else if (!where.status)
            where.status = In(allowedStatuses);
    }
    return where;
}

const validateReportDateFilters = (filters?: ReportFilters): FindOperator<Date> | undefined => {
    if (filters?.fromDate && filters?.toDate) {
        const endDate = filters.toDate;
        endDate.setDate(endDate.getDate() + 1);
        return Between(filters.fromDate, endDate);
    } else if (filters?.fromDate) {
        return Between(filters.fromDate, new Date());
    } else if (filters?.toDate) {
        const endDate = filters.toDate;
        endDate.setDate(endDate.getDate() + 1);
        return Between(new Date(0), endDate);
    }
    return undefined;
}