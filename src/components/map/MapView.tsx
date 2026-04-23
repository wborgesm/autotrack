"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface MarkerData {
  id: number;
  lat: number;
  lng: number;
  title: string;
  speed?: number;
}

interface MapViewProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
}

function MapBoundsUpdater({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}

export default function MapView({ markers, center = [-15.7801, -47.9292], zoom = 5 }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup>
            <div>
              <strong>{marker.title}</strong>
              {marker.speed !== undefined && (
                <p>Velocidade: {marker.speed.toFixed(1)} km/h</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <MapBoundsUpdater markers={markers} />
    </MapContainer>
  );
}
