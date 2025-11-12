/**
 * Staff role enumeration
 * @export
 * @enum {string}
 */
export enum StaffRole {
    ADMIN = "admin",
    MPRO = "municipal public relations officer",
    MA = "municipal administrator",
    TOSM = "technical office staff member"
}

/**
 * 
 * @export
 * @interface Staff
 */
export interface Staff {
    /**
     * 
     * @type {number}
     * @memberof Staff
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof Staff
     */
    username: string;
    /**
     * 
     * @type {string}
     * @memberof Staff
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof Staff
     */
    surname: string;
    /**
     * Staff role in the system
     * @type {StaffRole}
     * @memberof Staff
     */
    role: StaffRole;
    /**
     * Office ID this staff member belongs to
     * @type {string}
     * @memberof Staff
     */
    officeName?: string;
}

/**
 * Check if a given object implements the Staff interface.
 */
export function instanceOfStaff(value: object): value is Staff {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('username' in value) || value['username'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('surname' in value) || value['surname'] === undefined) return false;
    return true;
}

export function StaffFromJSON(json: any): Staff {
    return StaffFromJSONTyped(json, false);
}

export function StaffFromJSONTyped(json: any, ignoreDiscriminator: boolean): Staff {
    if (json == null) {
        return json;
    }
    return {
        'id': json['id'],
        'username': json['username'],
        'name': json['name'],
        'surname': json['surname'],
        'role': json['role'] == null ? undefined : json['role'],
        'officeName': json['officeName'] == null ? undefined : json['officeName'],
    };
}

export function StaffToJSON(json: any): Staff {
    return StaffToJSONTyped(json, false);
}

export function StaffToJSONTyped(value?: Staff | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        'id': value['id'],
        'username': value['username'],
        'name': value['name'],
        'surname': value['surname'],
        'role': value['role'],
        'officeName': value['officeName'],
    };
}
