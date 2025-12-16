import { ReportStatus, type Report } from "../models/Models.ts";

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

// Calcola la distanza tra due punti in metri usando la formula di Haversine
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raggio della Terra in metri
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distanza in metri
}

// Funzione helper per formattare la distanza in km
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

export function sortReportsByDistance(
    reports: Report[], 
    searchPoint: number[]
): (Report & { distance: number; distanceFormatted: string })[] {
    return reports
        .map(report => {
            const distance = calculateDistance(
                searchPoint[0],
                searchPoint[1],
                report.coordinates[0],
                report.coordinates[1]
            );
            return {
                ...report,
                distance,
                distanceFormatted: formatDistance(distance)
            };
        })
        .sort((a, b) => a.distance - b.distance);
}