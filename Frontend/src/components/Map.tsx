import {useEffect} from "react";
import L, {type LatLngExpression, type LeafletMouseEvent} from "leaflet";
import "leaflet/dist/leaflet.css";

export default function TurinMaskedMap() {

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
                    } catch (error) {
                        console.error("Reverse geocoding failed:", error);
                    }
                });
            })
            .catch((err) => console.error("Failed to load Turin boundary:", err));

        // --- Cleanup on unmount ---
        return () => {
            map.remove();
        };
    }, []);

    return <div id="map" style={{height: "100vh", width: "100%"}}/>;
}