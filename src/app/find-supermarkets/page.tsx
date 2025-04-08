"use client";

import { useState, useEffect, useRef } from "react";
import { Supermarket as SupermarketType } from "@/types";
import { SupermarketMap } from "@/components/SupermarketMap";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, ChevronLeft } from "lucide-react";
import { getSupermarkets } from "@/utils/storage";

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function FindSupermarkets() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [supermarkets, setSupermarkets] = useState<SupermarketType[]>([]);
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<
    SupermarketType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )},Algeria&countrycodes=DZ&limit=5`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as GeocodingResult[];
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    handleSearchWithLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
  };

  const handleSearchWithLocation = async (location: {
    lat: number;
    lng: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["shop"="supermarket"](around:5000,${location.lat},${location.lng});
          way["shop"="supermarket"](around:5000,${location.lat},${location.lng});
          relation["shop"="supermarket"](around:5000,${location.lat},${location.lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const overpassResponse = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
          overpassQuery
        )}`
      );

      if (!overpassResponse.ok) {
        throw new Error(`HTTP error! status: ${overpassResponse.status}`);
      }

      const overpassData = await overpassResponse.json();
      console.log("Overpass response:", overpassData);

      const nearbySupermarkets: SupermarketType[] = overpassData.elements
        .filter(
          (element: { tags?: { name?: string } }) =>
            element.tags && element.tags.name
        )
        .map(
          (element: {
            id: number;
            tags: {
              name: string;
              "addr:street"?: string;
              "addr:city"?: string;
              "addr:full"?: string;
              phone?: string;
              "contact:phone"?: string;
              email?: string;
              "contact:email"?: string;
            };
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
          }) => {
            const address = element.tags["addr:street"]
              ? `${element.tags["addr:street"]}, ${
                  element.tags["addr:city"] || ""
                }`
              : element.tags["addr:full"] || "Adresse non disponible";

            return {
              id: element.id.toString(),
              name: element.tags.name,
              address: address,
              phone:
                element.tags.phone ||
                element.tags["contact:phone"] ||
                "Non disponible",
              email:
                element.tags.email ||
                element.tags["contact:email"] ||
                "Non disponible",
              location: {
                lat: element.lat || element.center?.lat || 0,
                lng: element.lon || element.center?.lon || 0,
                formattedAddress: address,
              },
            };
          }
        )
        .filter(
          (supermarket: SupermarketType) =>
            supermarket.location.lat &&
            supermarket.location.lng &&
            !isNaN(supermarket.location.lat) &&
            !isNaN(supermarket.location.lng)
        );

      console.log("Found nearby supermarkets:", nearbySupermarkets);
      setFilteredSupermarkets(nearbySupermarkets);
    } catch (error) {
      console.error("Error searching location:", error);
      setError(
        "Une erreur est survenue lors de la recherche. Veuillez réessayer."
      );
      setFilteredSupermarkets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredSupermarkets(supermarkets);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Searching for:", searchQuery);
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )},Algeria&countrycodes=DZ&limit=1`
      );

      if (!geocodeResponse.ok) {
        throw new Error(`HTTP error! status: ${geocodeResponse.status}`);
      }

      const geocodeData = (await geocodeResponse.json()) as GeocodingResult[];
      console.log("Geocoding response:", geocodeData);

      if (geocodeData && geocodeData.length > 0) {
        const location = {
          lat: parseFloat(geocodeData[0].lat),
          lng: parseFloat(geocodeData[0].lon),
        };
        console.log("Found location:", location);
        setSearchLocation(location);
        handleSearchWithLocation(location);
      } else {
        console.log("No location found");
        setError("Aucun lieu trouvé pour cette recherche en Algérie.");
        setFilteredSupermarkets([]);
        setSearchLocation(null);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setError(
        "Une erreur est survenue lors de la recherche. Veuillez réessayer."
      );
      setFilteredSupermarkets([]);
      setSearchLocation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSupermarkets = async () => {
      try {
        const loadedSupermarkets = await getSupermarkets();

        // Map the storage supermarkets to the expected SupermarketType format
        const mappedSupermarkets: SupermarketType[] = loadedSupermarkets.map(
          (sm) => ({
            id: sm.id,
            name: sm.name,
            address: sm.address,
            // Get the first phone number or fallback to a placeholder
            phone:
              sm.phoneNumbers && sm.phoneNumbers.length > 0
                ? sm.phoneNumbers[0].number
                : "Non disponible",
            email: sm.email || "Non disponible",
            totalSales: sm.totalSales,
            totalValue: sm.totalValue,
            location: sm.location,
          })
        );

        setSupermarkets(mappedSupermarkets);
        setFilteredSupermarkets(mappedSupermarkets);
      } catch (error) {
        console.error("Error loading supermarkets:", error);
        setError(
          "Une erreur est survenue lors du chargement des supermarchés."
        );
      }
    };
    loadSupermarkets();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 h-10 px-3 -ml-3"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Retour au Tableau de Bord</span>
            <span className="sm:hidden">Retour</span>
          </Button>
        </div>

        <div className="relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Entrez une adresse (ex: Kouba, Alger)"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="text-base font-medium">
                      {suggestion.display_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Algérie</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
          >
            <Search className="h-5 w-5 mr-2" />
            Rechercher
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 relative">
          <div className="w-full lg:w-1/2 h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
            <SupermarketMap
              supermarkets={filteredSupermarkets}
              userLocation={searchLocation || undefined}
            />
          </div>
          <div className="w-full lg:w-1/2 space-y-3 max-h-[500px] overflow-y-auto rounded-xl pr-2">
            {filteredSupermarkets.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-200 shadow-sm">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                Aucun supermarché trouvé dans cette zone.
              </div>
            ) : (
              filteredSupermarkets.map((supermarket) => (
                <Card
                  key={supermarket.id}
                  className="p-4 cursor-pointer transition-all hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 duration-200 border-gray-200"
                  onClick={() => {
                    if (
                      supermarket.location?.lat &&
                      supermarket.location?.lng
                    ) {
                      const searchQuery = `${encodeURIComponent(
                        supermarket.name
                      )}@${supermarket.location.lat},${
                        supermarket.location.lng
                      }`;
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
                        "_blank"
                      );
                    }
                  }}
                >
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg text-gray-800">
                      {supermarket.name}
                    </h3>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span className="flex-1">
                        {supermarket.location?.formattedAddress ||
                          supermarket.address}
                      </span>
                    </div>
                    {searchLocation && (
                      <div className="text-sm text-gray-500 pl-6">
                        Distance:{" "}
                        {calculateDistance(
                          searchLocation.lat,
                          searchLocation.lng,
                          supermarket.location.lat,
                          supermarket.location.lng
                        ).toFixed(1)}{" "}
                        km
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
