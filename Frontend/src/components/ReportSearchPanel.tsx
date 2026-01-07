import {useState, type KeyboardEvent, type ReactNode, useEffect} from "react";
import { Card, Container } from "react-bootstrap";
import {type Report, type User} from "../models/Models.ts";
import {checkPostalCode, getReportStatusColor, sortReportsByDistance} from "../utils/reportUtils.ts";
import {Col, Row} from "design-react-kit";

interface ReportSearchPanelProps {
    reports: Report[];
    closeSearchMode: () => void;
    setCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    setSelectedReport: (report: Report) => void;
    user?: User;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    address: {
        postcode: string;
    };
}

export default function ReportSearchPanel({ reports, closeSearchMode, setCenter, setZoom, setSelectedReport, user }: Readonly<ReportSearchPanelProps>) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number, name: string} | null>(null);

    const [showFilters, setShowFilters] = useState<boolean>(true);
    const [kmRadius, setKmRadius] = useState<number>(1);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [filteredReports, setFilteredReports] = useState<(Report & {distance: number, distanceFormatted: string})[]>([]);

    useEffect(() => {
        if (!selectedLocation) {
            setFilteredReports([]);
            return;
        }
        
        let filteredReports = reports;

        if (statusFilter !== "")
            filteredReports = filteredReports.filter(r => r.status === statusFilter);

        if (categoryFilter !== "")
            filteredReports = filteredReports.filter(r => categoryFilter.includes(r.category));

        setFilteredReports(sortReportsByDistance(filteredReports, [selectedLocation.lat, selectedLocation.lon]).filter((r) => r.distance <= kmRadius*1000));
        
    }, [categoryFilter, kmRadius, reports, selectedLocation, statusFilter]);

    const torinoBBox = {
        minLat: 45,
        maxLat: 45.15,
        minLon: 7.6,
        maxLon: 7.78
    };

    const closeSearchModeHandler = () => {
        if(searchQuery === "") {
            closeSearchMode();
        } else {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedLocation(null);
        }
    }
    const searchLocation = async () => {
        if (!searchQuery.trim()) return;
    
        setIsSearching(true);
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(searchQuery)}, Torino&` +
                //`street=${encodeURIComponent(searchQuery)}&city=Torino&` +
                `format=json&` +
                `limit=5&` +
                `viewbox=${torinoBBox.minLon},${torinoBBox.maxLat},${torinoBBox.maxLon},${torinoBBox.minLat}&` +
                `bounded=1&` +
                `addressdetails=1`,
            );
            
            const data = await response.json();
            setSearchResults(data.filter((r: NominatimResult) => checkPostalCode(Number.parseInt(r.address.postcode))));
            
            if (data.length > 0) {
                const firstResult = data[0];
                const lat = Number.parseFloat(firstResult.lat);
                const lon = Number.parseFloat(firstResult.lon);
                
                setSelectedLocation({
                    lat,
                    lon,
                    name: firstResult.display_name
                });

            }
        } catch (error) {
            console.error('Search error: ', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (selectedLocation) {
            setCenter([selectedLocation.lat, selectedLocation.lon]);
            setZoom(16 - Math.log2(kmRadius));
        }
    }, [selectedLocation, kmRadius, setCenter, setZoom]);

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    };  
    
    const getUsername = (report: Report): ReactNode => {
        if (!report.citizenUsername) {
            return <strong>Anonymous Citizen</strong>;
        }
        
        if (user && user.username === report.citizenUsername) {
            return <strong>me</strong>;
        }

        return report.citizenUsername;
    };


    return(
        <Container className="h-100 d-flex flex-column p-0">
            <Card className="h-100 d-flex flex-column">
                <Card.Header className="d-flex align-items-center justify-content-between">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyUp={handleKeyPress}
                        placeholder="Search an address in Turin."
                        className="flex-1 py-2 ps-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 h-100 w-100"
                    />
                    <button
                        type="button"
                        onClick={searchLocation}
                        className="p-0 bg-transparent border-0 float-end h6 mb-0"
                        aria-label="Search"
                    >
                        <i className="bi bi-search"></i>
                    </button>
                    {' '}
                    <button
                        type="button"
                        onClick={closeSearchModeHandler}
                        className="p-0 bg-transparent border-0 float-end h3 mb-0"
                        aria-label="Close search"
                    >
                        <i className="bi bi-x"></i>
                    </button>      
                </Card.Header >

                <Card.Body className="flex-grow-1 overflow-auto">
                    {isSearching && <p>Searching...</p>}
                    {!isSearching && !selectedLocation && <p>Enter an address to search.</p>}
                    {!isSearching && selectedLocation && searchResults.length === 0 && <p>Address not found.</p>}
                    {!isSearching && searchResults.length > 0 && (
                        <>
                            <Row className="p-0">
                                <Row className="w-100 d-flex align-items-center py-0">
                                    <Col role="button" className="col-8" onClick={() => setShowFilters(prev => !prev)}>
                                        <h6>Filters&nbsp;<i className={"bi bi-chevron-"+(showFilters ? "up" : "down")}></i></h6>
                                    </Col>
                                    <Col>
                                        <button disabled={kmRadius === 1 && statusFilter === "" && categoryFilter === ""} className="btn btn-sm bg-transparent text-danger float-end p-0" onClick={() => {setCategoryFilter(""); setStatusFilter(""); setKmRadius(1)}}>Reset</button>
                                    </Col>
                                </Row>
                                <div className={"d-flex align-items-center gap-3 mb-3 overflow-x-scroll " + (showFilters ? "" : "visually-hidden")}>
                                    <label htmlFor="radiusRange" className="m-0">Radius: {kmRadius} km<br/>
                                    <input
                                        type="range"
                                        id="radiusRange"
                                        min={1}
                                        max={10}
                                        value={kmRadius}
                                        onChange={(e) => setKmRadius(Number(e.target.value))}
                                        className="form-range pt-2"
                                    /></label>&nbsp;
                                    <div>
                                        <label className="m-0 d-block">
                                            Status:<select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="form-select"
                                            >
                                                <option value={""}>Any</option>
                                                {Array.from(new Set(filteredReports.map(r => r.status))).map((status) => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="m-0 d-block">
                                            Category:<select
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                                className="form-select"
                                            >
                                                <option value={""}>Any</option>
                                                {Array.from(new Set(filteredReports.map(r => r.category))).map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </Row>
                            <hr />
                            <h6>Search Results ({filteredReports.length}):</h6>
                            { filteredReports.length <= 0 ? (<div className="w-100 h-50 text-center align-content-center"><p>No reports found with the selected filters.</p></div>) : (
                            <ul className="list-group gap-3">
                                {selectedLocation && filteredReports.map((result) => (
                                    <li
                                        key={result.id}
                                        className="list-group-item list-group-item-action border-1 rounded-2 p-0"
                                    >
                                        <button
                                            type="button"
                                            className="w-100 bg-transparent border-0 text-start p-3"
                                            onClick={() => {
                                                setCenter([result.coordinates[0], result.coordinates[1]]);
                                                setZoom(18);
                                                setSelectedReport(result);
                                            }}
                                        >
                                            {result.title}{' '}
                                            <span className={`badge ${getReportStatusColor(result.status)}`}>
                                                {result.status}
                                            </span>
                                            <br />
                                            <small className="text-muted">
                                                <span>{result.distanceFormatted}</span>&nbsp;•&nbsp;
                                                {result.category}
                                                <br />
                                                by {getUsername(result)}
                                            </small>
                                        </button>
                                    </li>

                                ))}
                            </ul>)}
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    )
}