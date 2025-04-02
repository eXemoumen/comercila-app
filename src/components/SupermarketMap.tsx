"use client";

import { useEffect, useState } from "react";
import { Supermarket } from "@/types";
import dynamic from "next/dynamic";

interface SupermarketMapProps {
  supermarkets: Supermarket[];
  userLocation?: { lat: number; lng: number };
}

// Dynamically import Leaflet with no SSR
const LeafletMapComponent = dynamic(() => import("./LeafletMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden bg-gray-100 animate-pulse" />
  ),
});

export function SupermarketMap({ supermarkets, userLocation }: SupermarketMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative h-[600px] w-full rounded-lg overflow-hidden bg-gray-100 animate-pulse" />
    );
  }

  return <LeafletMapComponent supermarkets={supermarkets} userLocation={userLocation} />;
} 