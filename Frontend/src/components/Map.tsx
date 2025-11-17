import {useEffect, useState} from "react";
import L, {LatLng, type LatLngExpression, type LeafletMouseEvent} from "leaflet";
import "leaflet/dist/leaflet.css";
import {Button, Col, Row, Spinner} from "design-react-kit";
import ReportForm from "./ReportForm.tsx";
import {isCitizen, type User} from "../models/Models.ts";

interface MapProps {
    isLoggedIn: boolean;
    user?: User;
}

export default function TurinMaskedMap({isLoggedIn, user}: MapProps) {
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [newReportMode, setNewReportMode] = useState<boolean>(false);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [selectedCoordinates, setSelectedCoordinates] = useState<LatLng | null>(null);
    const [streetName, setStreetName] = useState<string>("");

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

    useEffect(() => {
        const map = L.map("map", {
            zoomControl: true,
            minZoom: 11,
            maxZoom: 18,
        }).setView([45.0703, 7.6869], 12);

        setMapInstance(map);

        // --- Base tiles ---
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        // --- Fetch Turin boundary from Nominatim ---
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

                // --- World rectangle for dark overlay ---
                const world: LatLngExpression[] = [
                    [90, -180],
                    [90, 180],
                    [-90, 180],
                    [-90, -180],
                ];

                // --- Reverse the Turin polygon(s) to create holes ---
                const holes: LatLngExpression[][] = [];
                if (gj.type === "Polygon") {
                    const outer = gj.coordinates[0].map(
                        ([lng, lat]: [number, number]) => [lat, lng] as LatLngExpression
                    );
                    holes.push(outer.slice().reverse());
                } else if (gj.type === "MultiPolygon") {
                    gj.coordinates.forEach((poly: [number, number][][]) => {
                        const outer = poly[0].map(
                            ([lng, lat]: [number, number]) => [lat, lng] as LatLngExpression
                        );
                        holes.push(outer.slice().reverse());
                    });
                }

                // --- Add dark overlay (everything except Turin) ---
                L.polygon([world, ...holes], {
                    stroke: false,
                    fillColor: "#000",
                    fillOpacity: 0.7,
                    interactive: false,
                }).addTo(map);

                // --- Draw Turin border ---
                const borderLayer = L.geoJSON(gj, {
                    style: {color: "#2c7fb8", weight: 2, fillOpacity: 0},
                }).addTo(map);

                map.fitBounds(borderLayer.getBounds(), {padding: [20, 20]});

                // --- Polygon for inside-Turin detection ---
                //const turinArea = L.polygon(holes.map((h) => h.slice().reverse()));

                // --- Keep track of the last marker ---
                let currentMarker: L.Marker | null = null;

                // --- Handle clicks ---
                map.on("click", async (e: LeafletMouseEvent) => {
                    const {latlng} = e;

                    // Use ray-casting to check if the point is inside the polygon
                    let inside = false;
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
                                inside = true;
                                setSelectedCoordinates(latlng);
                                break;
                            }
                        }
                    }

                    if (!inside) return;

                    // --- Reverse-geocode to get street name ---
                    try {
                        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
                        const res = await fetch(url);
                        const data = await res.json();

                        const street =
                            (data.address?.road + " " + (data.address?.house_number || " ")) ||
                            data.address?.pedestrian ||
                            data.address?.footway ||
                            data.display_name ||
                            "Unnamed street";

                        // Remove previous marker
                        if (currentMarker) map.removeLayer(currentMarker);

                        // Add new marker with street name
                        currentMarker = L.marker(latlng)
                            .addTo(map)
                            .bindPopup(`<b>${street}</b>`)
                            .openPopup();

                        setStreetName(street);
                    } catch (error) {
                        console.error("Reverse geocoding failed:", error);
                    }
                });
                setIsLoaded(true);
            })
            .catch((err) => console.error("Failed to load Turin boundary:", err));

        // --- Cleanup on unmount ---
        return () => {
            map.remove();
        };
    }, []);

    useEffect(() => {
        if (mapInstance) {
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 100);
        }
    }, [newReportMode, mapInstance]);

    const changeMode = () => {
        setNewReportMode((prev) => !prev);
    }

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
                    <Spinner active />
                </div>
            )}
            <Col className={"d-flex flex-column justify-content-end" + (newReportMode ? "col-12 col-lg-7" : "col-12")} style={{pointerEvents: isLoaded ? 'auto' : 'none'}}>
                <div id="map" className="d-flex flex-grow-1"/>
                {!newReportMode && isLoggedIn && isCitizen(user) && selectedCoordinates && (
                    <Button
                        className="btn-primary rounded-5 position-absolute bottom-0 start-50 translate-middle-x mb-3"
                        style={{zIndex: 1000}}
                        onClick={changeMode}
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
                    <ReportForm coordinates={selectedCoordinates} street={streetName} toggleReportView={changeMode}/>
                </Col>
            )}
        </Row>
    );

}