export class APIError extends Error {
    public status?: number;
    public details?: any;

    constructor(message: string, status?: number, details?: any) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

export const handleAPIError = (response: Response, operation: string): never => {
    throw new APIError(
        `${operation} failed with status ${response.status}`,
        response.status
    );
};