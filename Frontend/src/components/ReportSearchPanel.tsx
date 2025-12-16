import { useState } from "react";
import { Card, Container } from "react-bootstrap";
import {type Report, type User} from "../models/Models.ts";
import { getReportStatusColor, sortReportsByDistance } from "../utils/reportUtils.ts";

interface ReportSearchPanelProps {
    reports: Report[];
    closeSearchMode: () => void;
    setCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    setSelectedReport: (report: Report) => void;
    user?: User;
}

export default function ReportSearchPanel({ reports, closeSearchMode, setCenter, setZoom, setSelectedReport, user }: Readonly<ReportSearchPanelProps>) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number, name: string} | null>(null);

    const torinoBBox = {
        minLat: 45.0,
        maxLat: 45.15,
        minLon: 7.6,
        maxLon: 7.75
    };

    const closeSearchModeHandler = () => {
        if(searchQuery !== "") {
            setSearchQuery("");
            setSearchResults([]);
            setSelectedLocation(null);
        } else {
            closeSearchMode();
        }
    }
    const searchLocation = async () => {
        if (!searchQuery.trim()) return;
    
        setIsSearching(true);
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(searchQuery)},Torino,Italy&` +
                `format=json&` +
                `limit=5&` +
                `viewbox=${torinoBBox.minLon},${torinoBBox.maxLat},${torinoBBox.maxLon},${torinoBBox.minLat}&` +
                `bounded=1&` +
                `addressdetails=1`,
            );
            
            const data = await response.json();
            setSearchResults(data);
            
            if (data.length > 0) {
                const firstResult = data[0];
                const lat = Number.parseFloat(firstResult.lat);
                const lon = Number.parseFloat(firstResult.lon);
                
                setSelectedLocation({
                    lat,
                    lon,
                    name: firstResult.display_name
                });
                
                setCenter([lat, lon]);
                setZoom(16);
            }
        } catch (error) {
            console.error('Search error: ', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
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
                    <i role="button" onClick={searchLocation} className="bi bi bi-search float-end h6 mb-0"></i>
                    &nbsp;
                    <i role="button"  onClick={closeSearchModeHandler} className="bi bi-x float-end h3 mb-0"></i>
                    
                </Card.Header >

                <Card.Body className="flex-grow-1 overflow-auto">
                    {isSearching && <p>Searching...</p>}
                    {!isSearching && searchResults.length === 0 && <p>No results found.</p>}
                    {!isSearching && searchResults.length > 0 && (
                        <ul className="list-group gap-3">
                            {selectedLocation && sortReportsByDistance(reports, [selectedLocation.lat, selectedLocation.lon]).map((result) => (
                                <li
                                    key={result.id}
                                    className="list-group-item list-group-item-action border-1 rounded-2"
                                    role="button"
                                    onClick={() => {
                                        setCenter([result.coordinates[0], result.coordinates[1]]);
                                        setZoom(18);
                                        setSelectedReport(result);
                                    }}
                                >
                                    {result.title} &nbsp;
                                    <span className={`badge ${getReportStatusColor(result.status)}`}>
                                                        {result.status}
                                    </span>
                                    <br />
                                    <small className="text-muted">
                                        <span>{result.distanceFormatted}</span>&nbsp;•&nbsp;
                                        {result.category}
                                        <br />
                                        by {result.citizenUsername ? (result.citizenUsername === user?.username ? <strong>me</strong> : result.citizenUsername) : "Anonymous Citizen"}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Card>
        </Container>
    )
}