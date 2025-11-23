/**
 * 
 * @export
 * @interface Notification
 */
export interface Notification {
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
     * @type {string}
     * @memberof Report
     */
    citizenUsername?: string;
    /**
     * 
     * @type {string}
     * @memberof Notification
     */
    staffUsername?: string;
}