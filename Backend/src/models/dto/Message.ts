/**
 * 
 * @export
 * @interface Message
 */
export interface Message {
    /**
     * 
     * @type {string}
     * @memberof Message
     */
    timestamp: string;
    /**
     * 
     * @type {string}
     * @memberof Message
     */
    message: string;
    /**
     * 
     * @type {string}
     * @memberof Message
     */
     staffUsername?: string;  
     /**
     * 
     * @type {boolean}
     * @memberof Message
     */
     isPrivate: boolean;  
} 