/**
 * 
 * @export
 * @interface Notification
 */
export interface Notification {
    /**
     *
     * @type {number}
     * @memberof Notification
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    timestamp: string;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    message: string;
    /**
     * 
     * @type {boolean}
     * @memberof Notification
     */
    isRead: boolean;
    /**
     *
     * @type {number}
     * @memberof Notification
     */
    reportId?: number;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    citizenUsername?: string;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    staffUsername?: string;
}

export function NotificationToJSON(n: Notification) {
    return n;
}