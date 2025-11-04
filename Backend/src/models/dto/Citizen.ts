/**
 * 
 * @export
 * @interface Citizen
 */
export interface Citizen {
    /**
     * 
     * @type {number}
     * @memberof Citizen
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof Citizen
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof Citizen
     */
    username: string;
    /**
     * 
     * @type {string}
     * @memberof Citizen
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof Citizen
     */
    surname: string;
    /**
     * URL or path to profile picture
     * @type {string}
     * @memberof Citizen
     */
    profilePicture?: string;
    /**
     * Telegram username
     * @type {string}
     * @memberof Citizen
     */
    telegram_username?: string;
    /**
     * Whether the citizen receives emails
     * @type {boolean}
     * @memberof Citizen
     */
    receive_emails: boolean;
}

/**
 * Check if a given object implements the Citizen interface.
 */
export function instanceOfCitizen(value: object): value is Citizen {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('email' in value) || value['email'] === undefined) return false;
    if (!('username' in value) || value['username'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('surname' in value) || value['surname'] === undefined) return false;
    if (!('receive_emails' in value) || value['receive_emails'] === undefined) return false;
    return true;
}

export function CitizenFromJSON(json: any): Citizen {
    return CitizenFromJSONTyped(json, false);
}

export function CitizenFromJSONTyped(json: any, ignoreDiscriminator: boolean): Citizen {
    if (json == null) {
        return json;
    }
    return {
        'id': json['id'],
        'email': json['email'],
        'username': json['username'],
        'name': json['name'],
        'surname': json['surname'],
        'profilePicture': json['profilePicture'] == null ? undefined : json['profilePicture'],
        'telegram_username': json['telegram_username'] == null ? undefined : json['telegram_username'],
        'receive_emails': json['receive_emails'],
    };
}

export function CitizenToJSON(json: any): Citizen {
    return CitizenToJSONTyped(json, false);
}

export function CitizenToJSONTyped(value?: Citizen | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        'id': value['id'],
        'email': value['email'],
        'username': value['username'],
        'name': value['name'],
        'surname': value['surname'],
        'profilePicture': value['profilePicture'],
        'telegram_username': value['telegram_username'],
        'receive_emails': value['receive_emails'],
    };
}
