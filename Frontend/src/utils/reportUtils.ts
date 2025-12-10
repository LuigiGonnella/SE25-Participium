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
