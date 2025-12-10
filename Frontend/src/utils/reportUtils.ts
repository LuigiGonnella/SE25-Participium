import { ReportStatus } from "../models/Models.ts";

export const getReportStatusColor = (status: string): string => {
    switch (status) {
        case ReportStatus.PENDING:
            return 'bg-info';
        case ReportStatus.ASSIGNED:
        case ReportStatus.IN_PROGRESS:
            return 'bg-primary';
        case ReportStatus.REJECTED:
            return 'bg-danger';
        case ReportStatus.SUSPENDED:
            return 'bg-warning';
        case ReportStatus.RESOLVED:
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
};

export const getReportStatusBorderColor = (status: string): string => {
    switch (status) {
        case ReportStatus.PENDING:
            return 'var(--bs-info)';
        case ReportStatus.ASSIGNED:
        case ReportStatus.IN_PROGRESS:
            return 'var(--bs-primary)';
        case ReportStatus.REJECTED:
            return 'var(--bs-danger)';
        case ReportStatus.SUSPENDED:
            return 'var(--bs-warning)';
        case ReportStatus.RESOLVED:
            return 'var(--bs-success)';
        default:
            return 'var(--bs-secondary)';
    }
};

export const convertToDMS = (decimal: number, isLatitude: boolean): string => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = Math.round((minutesDecimal - minutes) * 60 * 10) / 10;

    let direction: string;
    if (isLatitude) {
        direction = decimal >= 0 ? 'N' : 'S';
    } else {
        direction = decimal >= 0 ? 'E' : 'W';
    }

    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toFixed(1)}" ${direction}`;
};