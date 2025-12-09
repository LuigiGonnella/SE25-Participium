import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import {StaffRole} from "@dao/staffDAO";
import {Status} from "@dao/reportDAO";
import {BadRequestError} from "@errors/BadRequestError";
import {OfficeCategory} from "@dao/officeDAO";
import turinBoundary from './data/turinBoundary.json';
import * as turf from '@turf/turf';

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
  if (array.find(predicate)) {
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

  return updatedStatus;
}

export function validateOfficeCategory(category: string): OfficeCategory {
    const categoryValue = String(category).toUpperCase();
    if (!(categoryValue in OfficeCategory)) {
        throw new BadRequestError("Invalid office category.");
    }
    return OfficeCategory[categoryValue as keyof typeof OfficeCategory];
}

export function validateReportId(reportId: unknown): number {
    const id = Number(reportId);
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
        throw new BadRequestError("Invalid reportId.");
    }
    return id;
}

export function validateDate(dateStr: unknown, fieldName: string): Date {
    const date = new Date(String(dateStr));
    if (isNaN(date.getTime())) {
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