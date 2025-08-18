"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, ChevronRight, Search } from "lucide-react";
import { getSupermarkets, addSupermarket } from "@/utils/hybridStorage";
import type { Supermarket, PhoneNumber } from "@/utils/storage";

interface SupermarketsPageProps {
  onBack: () => void;
  onViewSupermarket: (id: string) => void;
}

export function SupermarketsPage({
  onBack,
  onViewSupermarket,
}: SupermarketsPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupermarket, setNewSupermarket] = useState({
    name: "",
    address: "",
    phone_numbers: [{ name: "", number: "" }],
    email: "",
    latitude: 36.7538,
    longitude: 3.0588,
  });
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<
    Supermarket[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Load supermarkets on component mount
  useEffect(() => {
    const loadSupermarkets = async () => {
      const loadedSupermarkets = await getSupermarkets();
      setSupermarkets(loadedSupermarkets);
      setFilteredSupermarkets(loadedSupermarkets);
    };
    loadSupermarkets();
  }, []);

  // Filter supermarkets based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSupermarkets(supermarkets);
    } else {
      const filtered = supermarkets.filter(
        (supermarket) =>
          supermarket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supermarket.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSupermarkets(filtered);
    }
  }, [searchQuery, supermarkets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make sure at least one phone number is provided
      if (!newSupermarket.phone_numbers[0].number) {
        alert("Veuillez entrer au moins un numéro de téléphone");
        setLoading(false);
        return;
      }

      // Try to geocode the address, but use default coordinates if it fails
      let latitude = 36.7538; // Default coordinates for Algeria
      let longitude = 3.0588;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            newSupermarket.address
          )}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
          console.log("Geocoding successful:", { latitude, longitude });
        } else {
          console.log("Geocoding failed, using default coordinates");
        }
      } catch (geocodingError) {
        console.log(
          "Geocoding service unavailable, using default coordinates:",
          geocodingError
        );
      }

      // Create a properly formatted supermarket object for Supabase
      const supabaseSupermarket = {
        name: newSupermarket.name,
        address: newSupermarket.address,
        latitude: latitude,
        longitude: longitude,
        email: newSupermarket.email || null,
        phone_numbers: newSupermarket.phone_numbers.filter(
          (p: PhoneNumber) => p.number.trim() !== ""
        ),
      };

      console.log("Adding supermarket:", supabaseSupermarket);

      // Add the supermarket
      const added = await addSupermarket(supabaseSupermarket);
      console.log("Added supermarket result:", added);

      if (added) {
        // Success - reset form and state
        setShowAddForm(false);
        alert("Supermarché ajouté avec succès!");

        // Reset form
        setNewSupermarket({
          name: "",
          address: "",
          phone_numbers: [{ name: "", number: "" }],
          email: "",
          latitude: 36.7538,
          longitude: 3.0588,
        });

        // Refresh the supermarkets list
        const loadedSupermarkets = await getSupermarkets();
        setSupermarkets(loadedSupermarkets);
        setFilteredSupermarkets(loadedSupermarkets);
      } else {
        // Failed to add
        alert(
          "Erreur: Impossible d'ajouter le supermarché. Vérifiez la console pour plus de détails."
        );
      }
    } catch (error) {
      console.error("Error adding supermarket:", error);
      alert("Une erreur s'est produite lors de l'ajout du supermarché");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Supermarchés</h1>
        </div>
        <Button
          size="sm"
          className="rounded-full px-3 shadow-sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un supermarché..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Add Supermarket Form */}
      {showAddForm && (
        <Card className="border-none shadow-md rounded-xl overflow-hidden mb-5">
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nom du Supermarché
              </label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={newSupermarket.name}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={newSupermarket.address}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                required
                placeholder="Adresse complète du supermarché"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nom du contact"
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  value={newSupermarket.phone_numbers[0].name}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phone_numbers: prev.phone_numbers.map((phone, index) =>
                        index === 0 ? { ...phone, name: e.target.value } : phone
                      ),
                    }))
                  }
                />
                <input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  className="flex-1 h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                  value={newSupermarket.phone_numbers[0].number}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phone_numbers: prev.phone_numbers.map((phone, index) =>
                        index === 0
                          ? { ...phone, number: e.target.value }
                          : phone
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email (Optionnel)
              </label>
              <input
                type="email"
                className="w-full h-12 rounded-xl border border-gray-200 px-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                value={newSupermarket.email}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Entrez l'email (optionnel)"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Ajout en cours..." : "Confirmer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {filteredSupermarkets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery.trim() === ""
              ? "Aucun supermarché enregistré"
              : `Aucun supermarché trouvé pour "${searchQuery}"`}
          </div>
        ) : (
          filteredSupermarkets.map((supermarket) => (
            <div
              key={supermarket.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              onClick={() => onViewSupermarket(supermarket.id)}
            >
              <div>
                <h3 className="font-medium">{supermarket.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {supermarket.address}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Voir détails</p>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
