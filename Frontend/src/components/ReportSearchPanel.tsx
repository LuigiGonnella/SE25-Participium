import { use, useEffect, useState } from "react";
import API, {STATIC_URL} from "../API/API.mts";
import { Card, Container } from "react-bootstrap";
import {type Report} from "../models/Models.ts";
import { useMap } from "react-leaflet/hooks";

interface ReportSearchPanelProps {
    reports: Report[];
    closeSearchMode: () => void;
}

export default function ReportSearchPanel({ reports, closeSearchMode }: Readonly<ReportSearchPanelProps>) {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number, name: string} | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([45.0703, 7.6869]);

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
        // Query Nominatim con limitazione a Torino
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
            
            map.setView([lat, lon], 15);
        }
        } catch (error) {
        console.error('Search error:', error);
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
                        className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 h-100 w-100"
                    />
                    <i role="button" onClick={searchLocation} className="bi bi bi-search float-end h6"></i>
                    &nbsp;
                    <i role="button"  onClick={closeSearchModeHandler} className="bi bi-x float-end h3"></i>
                    
                </Card.Header >

                <Card.Body className="flex-grow-1 overflow-auto">
                </Card.Body>
            </Card>
        </Container>
    )
}