/**
 * 
 * @export
 * @interface ErrorDTO
 */
export interface ErrorDTO {
    /**
     * 
     * @type {number}
     * @memberof ErrorDTO
     */
    code: number;
    /**
     * 
     * @type {string}
     * @memberof ErrorDTO
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof ErrorDTO
     */
    message?: string;
}

/**
 * Check if a given object implements the ErrorDTO interface.
 */
export function instanceOfErrorDTO(value: object): value is ErrorDTO {
    if (!('code' in value) || value['code'] === undefined) return false;
    return true;
}

export function ErrorDTOFromJSON(json: any): ErrorDTO {
    return ErrorDTOFromJSONTyped(json, false);
}

export function ErrorDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): ErrorDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'code': json['code'],
        'name': json['name'] ?? undefined,
        'message': json['message'] ?? undefined,
    };
}

export function ErrorDTOToJSON(json: any): ErrorDTO {
    return ErrorDTOToJSONTyped(json, false);
}

export function ErrorDTOToJSONTyped(value?: ErrorDTO | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'code': value['code'],
        'name': value['name'],
        'message': value['message'],
    };
}

