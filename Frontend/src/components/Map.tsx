import {useCallback, useEffect, useRef, useState} from "react";
import {GeoJSON, MapContainer, Marker, Polygon, Popup, TileLayer, useMap, useMapEvents} from "react-leaflet";
import type {LatLng} from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Button, Col, Row, Spinner} from "design-react-kit";
import ReportForm from "./ReportForm.tsx";
import {isCitizen, type Report, type User} from "../models/Models.ts";
import ReportDetailsPanel from "./ReportDetailsPanel.tsx";

// Fix per le icone di default di Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import API from "../API/API.mjs";
import useSupercluster from "use-supercluster";

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapProps {
    isLoggedIn: boolean;
    user?: User;
}

function pointInPolygon(point: L.Point, polygon: L.Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

async function getStreetName(selectedCoordinates: LatLng): Promise<string> {
    if(!selectedCoordinates) return "";
    // Reverse geocoding
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedCoordinates.lat}&lon=${selectedCoordinates.lng}`;
        const res = await fetch(url);
        const data = await res.json();

        return (data.address?.road + " " + (data.address?.house_number || "")) ||
            data.address?.pedestrian ||
            data.address?.footway ||
            data.display_name ||
            "Unnamed street";
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
    }
    return "Unnamed street";
}

function MapClickHandler({ holes, setCoordinates, newReportMode, selectedReport}: {
    holes: L.LatLngExpression[][],
    setCoordinates: (latlng: LatLng | null) => void,
    newReportMode: boolean,
    selectedReport: Report | undefined
}) {
    useMapEvents({
        click: async (e) => {
            const {latlng} = e;

            // Verifica se il punto è dentro Torino
            for (const hole of holes) {
                const reversed = hole.slice().reverse();
                const poly = L.polygon(reversed);

                const bounds = poly.getBounds();
                if (bounds.contains(latlng)) {
                    const point = L.point(latlng.lng, latlng.lat);
                    const polyPoints = reversed.map(ll => {
                        const latLng = Array.isArray(ll) ? L.latLng(ll[0], ll[1]) : ll;
                        return L.point(latLng.lng, latLng.lat);
                    });

                    if (pointInPolygon(point, polyPoints)) {
                        setCoordinates(latlng);
                        return;
                    }
                }
            }
            setCoordinates(null);
        }
    });

    const map = useMap();
    useEffect(() => {
        if (map) {
            // Aggiunge un piccolo ritardo per assicurarsi che il layout sia aggiornato
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }, [newReportMode, map, selectedReport]);

    return null;
}

export default function TurinMaskedMap({isLoggedIn, user}: MapProps) {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [newReportMode, setNewReportMode] = useState<boolean>(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState<LatLng | null>(null);
    const [streetName, setStreetName] = useState<string>("");
    const [turinGeoJSON, setTurinGeoJSON] = useState<any>(null);
    const [holes, setHoles] = useState<L.LatLngExpression[][]>([]);
    const [selectedReport, setSelectedReport] = useState<Report>();
    
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {

        setStreetName("");
        if (!selectedCoordinates) return;
        getStreetName(selectedCoordinates).then((v) => {
            setStreetName(v);
            if(markerRef.current)
                markerRef.current.openPopup()
        }).catch(console.error);

    }, [selectedCoordinates]);

    useEffect(() => {
        const nominatimUrl =
            "https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2";

        fetch(nominatimUrl)
            .then((r) => r.json())
            .then((results) => {
                const feature = results.find(
                    (f: any) =>
                        f.geojson &&
                        (f.geojson.type === "Polygon" || f.geojson.type === "MultiPolygon")
                );
                if (!feature) throw new Error("No polygon found for Turin");

                const gj = feature.geojson;
                setTurinGeoJSON(gj);

                const newHoles: L.LatLngExpression[][] = [];
                if (gj.type === "Polygon") {
                    const outer = gj.coordinates[0].map(
                        ([lng, lat]: [number, number]) => [lat, lng] as L.LatLngExpression
                    );
                    newHoles.push(outer.slice().reverse());
                } else if (gj.type === "MultiPolygon") {
                    gj.coordinates.forEach((poly: [number, number][][]) => {
                        const outer = poly[0].map(
                            ([lng, lat]: [number, number]) => [lat, lng] as L.LatLngExpression
                        );
                        newHoles.push(outer.slice().reverse());
                    });
                }

                setHoles(newHoles);
                setIsLoaded(true);
            })
            .catch((err) => console.error("Failed to load Turin boundary:", err));

        API.getMapReports().then(setReports).catch(console.error)
    }, []);

    const world: L.LatLngExpression[] = [
        [90, -180],
        [90, 180],
        [-90, 180],
        [-90, -180],
    ];

    const markerRef = useRef<L.Marker>(null);

    return (
        <Row className="d-flex flex-grow-1 position-relative vw-100 g-0">
            {!isLoaded && (
                <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{
                        zIndex: 2000,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }}
                >
                    <Spinner active/>
                </div>
            )}
            <Col className={"d-flex flex-column justify-content-end" + (newReportMode || selectedReport ? " col-12 col-lg-7" : " col-12")}
                 style={{pointerEvents: isLoaded ? 'auto' : 'none'}}>
                <MapContainer
                    center={[45.0703, 7.6869]}
                    zoom={12}
                    minZoom={12}
                    maxZoom={18}
                    zoomControl={true}
                    style={{height: '100%', width: '100%'}}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {reports.length > 0 && <ClusterMarkers reports={reports} setSelectedReport={ setSelectedReport } setNewReportMode={ setNewReportMode } />}

                    {isLoaded && (
                        <>
                            {selectedCoordinates && (
                                <Marker ref={markerRef} position={selectedCoordinates}>
                                    <Popup>
                                        {streetName || "Loading..."}
                                    </Popup>
                                </Marker>
                            )}
                            <Polygon
                                positions={[world, ...holes]}
                                pathOptions={{
                                    stroke: false,
                                    fillColor: "#000",
                                    fillOpacity: 0.7
                                }}
                                interactive={false}
                            />

                            {turinGeoJSON && (
                                <GeoJSON
                                    data={turinGeoJSON}
                                    style={{
                                        color: "#2c7fb8",
                                        weight: 2,
                                        fillOpacity: 0
                                    }}
                                />
                            )}

                            <MapClickHandler
                                holes={holes}
                                setCoordinates={setSelectedCoordinates}
                                newReportMode={newReportMode}
                                selectedReport={selectedReport}
                            />
                        </>
                    )}
                </MapContainer>

                {!newReportMode && isLoggedIn && isCitizen(user) && selectedCoordinates && (
                    <Button
                        className="btn-primary rounded-5 position-absolute bottom-0 start-50 translate-middle-x mb-3"
                        style={{zIndex: 1000}}
                        onClick={() => { setNewReportMode(true); setSelectedReport(undefined); }}
                    >
                        <i className="bi bi-plus-lg">&nbsp;</i>
                        New Report
                    </Button>
                )}
            </Col>
            {newReportMode && (
                <Col className="col-12 col-lg-5 p-0 position-absolute position-lg-relative h-100"
                     style={{
                         zIndex: 1001,
                         top: 0,
                         right: 0,
                         backgroundColor: 'white'
                     }}>
                    <ReportForm
                        coordinates={selectedCoordinates}
                        street={streetName}
                        toggleReportView={() => setNewReportMode(false)}
                    />
                </Col>
            )}

            {selectedReport && (
                <Col className="col-12 col-lg-5 p-0 position-absolute position-lg-relative h-100"
                     style={{
                         zIndex: 1001,
                         top: 0,
                         right: 0,
                         backgroundColor: 'white'
                     }}>                
                     <ReportDetailsPanel report={selectedReport} onClose={() => setSelectedReport(undefined)} />
                </Col>
            )}

        </Row>
    );
}

function ClusterMarkers({reports, setSelectedReport, setNewReportMode}: { reports: Report[], setSelectedReport: (report: Report | undefined) => void , setNewReportMode: (newReportMode: boolean) => void}) {

    const [bounds, setBounds] = useState<[number, number, number, number] | undefined>(undefined);
    const [zoom, setZoom] = useState<number>(12);
    const map = useMap();

    function updateMap() {
        const b = map.getBounds();
        setBounds([b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthWest().lat]);
        setZoom(map.getZoom());
    }

    const onMove = useCallback(() => {
        updateMap();
    }, [map]);

    useEffect(() => {
        updateMap();
    }, [map]);

    useEffect(() => {
        map.on('moveend', onMove);
        return () => {
            map.off('moveend', onMove);
        };
    }, [map, onMove]);

    const points = reports.map(r => ({
        type: "Feature",
        properties: { cluster: false, reportId: r.id, category: r.category, status: r.status },
        geometry: {
            type: "Point",
            coordinates: [
                r.coordinates[1],
                r.coordinates[0]
            ]
        }
    }));

    const { clusters, supercluster } = useSupercluster({
        points: points,
        bounds: bounds,
        zoom: zoom,
        options: { radius: 200, maxZoom: 17 }
    });

    return (<>
        {clusters.map(cluster => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const {
                cluster: isCluster,
                point_count: pointCount
            } = cluster.properties;

            if (isCluster) {
                return (
                    <Marker
                        key={`cluster-${cluster.id}`}
                        position={[latitude, longitude]}
                        icon={L.divIcon({
                            html: `<div style="background-color: rgba(0, 123, 255, 0.8); border-radius: 50%; width: ${30 + (pointCount / points.length) * 40}px; height: ${30 + (pointCount / points.length) * 40}px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${pointCount}</div>`,
                            className: '',
                            iconSize: L.point(30 + (pointCount / points.length) * 40, 30 + (pointCount / points.length) * 40)
                        })}
                        eventHandlers={{
                            click: () => {
                                const expansionZoom = Math.min(
                                    supercluster.getClusterExpansionZoom(cluster.id),
                                    18
                                );
                                map.setView([latitude, longitude], expansionZoom, {
                                    animate: true
                                });
                            }
                        }}
                    />
                );
            }
            return (
                <Marker
                    key={`report-${cluster.properties.reportId}`}
                    position={[latitude, longitude]}
                    icon={DefaultIcon}
                    eventHandlers={{
                        mouseover: (e) => { e.target.openPopup(); },
                        mouseout: (e) => { e.target.closePopup(); },
                        click: () => { setSelectedReport(reports.find(r => r.id === cluster.properties.reportId) || undefined); setNewReportMode(false); }
                    }}
                >
                    <Popup closeButton={false} >
                        <strong>Report ID:</strong> {cluster.properties.reportId}<br />
                        <strong>Category:</strong> {cluster.properties.category}<br />
                        <strong>Status:</strong> {cluster.properties.status}
                    </Popup>
                </Marker>
            );
        })}
    </>);
}