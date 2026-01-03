"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Plus, 
  ChevronRight, 
  Search, 
  MapPin, 
  Phone, 
  Store,
  X,
  Loader2
} from "lucide-react";
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
  const [filteredSupermarkets, setFilteredSupermarkets] = useState<Supermarket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    const loadSupermarkets = async () => {
      setIsLoadingList(true);
      const loadedSupermarkets = await getSupermarkets();
      setSupermarkets(loadedSupermarkets);
      setFilteredSupermarkets(loadedSupermarkets);
      setIsLoadingList(false);
    };
    loadSupermarkets();
  }, []);

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
      if (!newSupermarket.phone_numbers[0].number) {
        alert("Veuillez entrer au moins un numéro de téléphone");
        setLoading(false);
        return;
      }

      let latitude = 36.7538;
      let longitude = 3.0588;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

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
        }
      } catch {
        console.log("Geocoding service unavailable, using default coordinates");
      }

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

      const added = await addSupermarket(supabaseSupermarket);

      if (added) {
        setShowAddForm(false);
        setNewSupermarket({
          name: "",
          address: "",
          phone_numbers: [{ name: "", number: "" }],
          email: "",
          latitude: 36.7538,
          longitude: 3.0588,
        });

        const loadedSupermarkets = await getSupermarkets();
        setSupermarkets(loadedSupermarkets);
        setFilteredSupermarkets(loadedSupermarkets);
      } else {
        alert("Erreur: Impossible d'ajouter le supermarché.");
      }
    } catch (error) {
      console.error("Error adding supermarket:", error);
      alert("Une erreur s'est produite lors de l'ajout du supermarché");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-xl hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Supermarchés</h1>
            <p className="text-sm text-gray-500">
              {supermarkets.length} client{supermarkets.length !== 1 ? 's' : ''} enregistré{supermarkets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un supermarché..."
          className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Add Supermarket Form */}
      {showAddForm && (
        <div className="premium-card overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Nouveau Supermarché</h3>
                <p className="text-white/80 text-xs">Ajoutez un nouveau client</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nom du Supermarché
              </label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={newSupermarket.name}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Supermarché Central"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Adresse</label>
              <input
                type="text"
                className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={newSupermarket.address}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Adresse complète"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contact</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom du contact"
                  className="h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
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
                  className="h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={newSupermarket.phone_numbers[0].number}
                  onChange={(e) =>
                    setNewSupermarket((prev) => ({
                      ...prev,
                      phone_numbers: prev.phone_numbers.map((phone, index) =>
                        index === 0 ? { ...phone, number: e.target.value } : phone
                      ),
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                type="email"
                className="w-full h-12 rounded-xl border-2 border-gray-100 px-4 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={newSupermarket.email}
                onChange={(e) =>
                  setNewSupermarket((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemple.com"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  "Confirmer"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Supermarkets List */}
      <div className="space-y-3">
        {isLoadingList ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="premium-card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSupermarkets.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery.trim() === ""
                ? "Aucun supermarché"
                : "Aucun résultat"}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery.trim() === ""
                ? "Commencez par ajouter votre premier client"
                : `Aucun supermarché trouvé pour "${searchQuery}"`}
            </p>
          </div>
        ) : (
          filteredSupermarkets.map((supermarket, index) => (
            <div
              key={supermarket.id}
              className="premium-card p-4 cursor-pointer group animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onViewSupermarket(supermarket.id)}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                  <Store className="w-6 h-6 text-indigo-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {supermarket.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{supermarket.address}</span>
                  </div>
                  {supermarket.phone_numbers && supermarket.phone_numbers.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{supermarket.phone_numbers[0].number}</span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
