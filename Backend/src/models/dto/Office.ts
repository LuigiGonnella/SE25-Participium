import { Staff, StaffFromJSON, StaffFromJSONTyped, StaffToJSON } from './Staff';

/**
 * 
 * @export
 * @interface Office
 */
export interface Office {
    /**
     * 
     * @type {number}
     * @memberof Office
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof Office
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof Office
     */
    description: string;
    /**
     * Array of staff members belonging to this office.
     * @type {Array<Staff>}
     * @memberof Office
     */
    members: Staff[];
}

/**
 * Check if a given object implements the Office interface.
 */
export function instanceOfOffice(value: object): value is Office {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('description' in value) || value['description'] === undefined) return false;
    return true;
}

export function OfficeFromJSON(json: any): Office {
    return OfficeFromJSONTyped(json, false);
}

export function OfficeFromJSONTyped(json: any, ignoreDiscriminator: boolean): Office {
    if (json == null) {
        return json;
    }
    return {
        'id': json['id'],
        'name': json['name'],
        'description': json['description'],
        'members': (json['members'] as Array<any>).map(StaffFromJSON),
    };
}

export function OfficeToJSON(json: any): Office {
    return OfficeToJSONTyped(json, false);
}

export function OfficeToJSONTyped(value?: Office | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        'id': value['id'],
        'name': value['name'],
        'description': value['description'],
        'members': value['members'] == null ? undefined : (value['members'] as Array<any>).map(StaffToJSON),
    };
}
