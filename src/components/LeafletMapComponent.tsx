"use client";

import { useEffect, useRef, useState } from "react";
import { Supermarket } from "@/utils/storage";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapComponentProps {
  supermarkets: Supermarket[];
  userLocation?: { lat: number; lng: number };
}

// Create a custom icon for supermarkets
const supermarketIcon = L.divIcon({
  className: "bg-red-500 rounded-full w-4 h-4 border-2 border-white",
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Create a custom icon for user location
const userIcon = L.divIcon({
  className: "bg-blue-500 rounded-full w-4 h-4 border-2 border-white",
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function LeafletMapComponent({ supermarkets, userLocation }: LeafletMapComponentProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Initialize map centered on Algeria
    const mapInstance = L.map("map").setView([36.7538, 3.0588], 6); // Centered on Algeria with zoom level 6
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Cleanup
    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    const newMarkers: L.Marker[] = [];

    // Add markers for supermarkets
    supermarkets.forEach(supermarket => {
      // Skip if location is missing or invalid
      if (!supermarket.latitude || !supermarket.longitude) {
        
        return;
      }

      try {
        const marker = L.marker([supermarket.latitude, supermarket.longitude], {
          icon: supermarketIcon
        })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${supermarket.name}</h3>
              <p class="text-sm text-gray-600">${supermarket.address}</p>
            </div>
          `)
          .addTo(map);

        marker.on("click", () => {
          const searchQuery = `${encodeURIComponent(supermarket.name)}@${supermarket.latitude},${supermarket.longitude}`;
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
            "_blank"
          );
        });

        newMarkers.push(marker);
      } catch (error) {
        console.error(`Error creating marker for supermarket ${supermarket.name}:`, error);
      }
    });

    // Add user location marker if available
    if (userLocation?.lat && userLocation?.lng) {
      try {
        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon
        }).addTo(map);
        newMarkers.push(userMarker);
      } catch (error) {
        console.error("Error creating user location marker:", error);
      }
    }

    markersRef.current = newMarkers;

    // Fit bounds to show all markers if there are any
    if (newMarkers.length > 0) {
      try {
        const bounds = L.latLngBounds(newMarkers.map(marker => marker.getLatLng()));
        map.fitBounds(bounds);
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [map, supermarkets, userLocation]);

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      <div id="map" className="h-full w-full" />
    </div>
  );
} 