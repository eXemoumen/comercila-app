import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sale, Supermarket, Order } from "@/types/index";
import { getSales, getSupermarkets, getOrders } from "@/utils/storage";

interface SearchResult {
  type: "sale" | "supermarket" | "order";
  id: string;
  title: string;
  subtitle: string;
  data: Sale | Supermarket | Order;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const searchData = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const [sales, supermarkets, orders] = await Promise.all([
          getSales(),
          getSupermarkets(),
          getOrders(),
        ]);

        const searchResults: SearchResult[] = [
          ...sales
            .filter(
              (sale) =>
                sale.supermarketName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                sale.id.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((sale) => ({
              type: "sale" as const,
              id: sale.id,
              title: `Vente - ${sale.supermarketName}`,
              subtitle: `${sale.quantity} pièces - ${sale.totalValue} DZD`,
              data: sale,
            })),
          ...supermarkets
            .filter(
              (sm) =>
                sm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sm.address.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((sm) => ({
              type: "supermarket" as const,
              id: sm.id,
              title: sm.name,
              subtitle: sm.address,
              data: sm,
            })),
          ...orders
            .filter(
              (order) =>
                order.supermarketName
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((order) => ({
              type: "order" as const,
              id: order.id,
              title: `Commande - ${order.supermarketName}`,
              subtitle: `${order.quantity} pièces`,
              data: order,
            })),
        ];

        setResults(searchResults);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchData, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    // Handle navigation based on result type
    switch (result.type) {
      case "sale":
        // Navigate to sales page with the sale ID
        window.location.href = `/sales/${result.id}`;
        break;
      case "supermarket":
        // Navigate to supermarket profile
        window.location.href = `/supermarkets/${result.id}`;
        break;
      case "order":
        // Navigate to orders page with the order ID
        window.location.href = `/orders/${result.id}`;
        break;
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl w-full max-w-2xl mt-20 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher des ventes, supermarchés, commandes... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-gray-500">{result.subtitle}</div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              Aucun résultat trouvé
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Commencez à taper pour rechercher...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
