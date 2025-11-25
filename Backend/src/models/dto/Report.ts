import { Status } from "@models/dao/reportDAO";
import { OfficeCategory } from "@models/dao/officeDAO";

/**
 * 
 * @export
 * @interface Report
 */
export interface Report {
    /**
     * 
     * @type {number}
     * @memberof Report
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof Report
     */
    citizenUsername?: string;
    /**
     * 
     * @type {Date}
     * @memberof Report
     */
    timestamp?: Date;
    /**
     * 
     * @type {string}
     * @memberof Report
     */
    status: Status;
    /**
     * 
     * @type {string}   
     * @memberof Report
     */
    title: string;
    /**
     * 
     * @type {string}   
     * @memberof Report
     */
    description: string;
    /**
     * 
     * @type {string}
     * @memberof Report
     */
    category: OfficeCategory;
    /**
     * 
     * @type {number[]}
     * @memberof Report
     */
    coordinates: number[];
    /**
     * 
     * @type {string[]}
     * @memberof Report
     */
    photos: string[];
    /**
     * 
     * @type {string}
     * @memberof Report
     */
    comment?: string;  
}