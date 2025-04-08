import { useState } from "react";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBackup, restoreBackup } from "@/utils/backup";

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBackup = async () => {
    try {
      setError(null);
      setSuccess(null);
      await createBackup();
      setSuccess("Sauvegarde créée avec succès");
    } catch (error) {
      setError("Erreur lors de la création de la sauvegarde");
      console.error("Backup error:", error);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);
      setIsRestoring(true);
      await restoreBackup(file);
      setSuccess("Données restaurées avec succès");
    } catch (error) {
      setError("Erreur lors de la restauration des données");
      console.error("Restore error:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible."
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Paramètres</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-500 p-3 rounded-lg border border-green-100">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">
              Sauvegarde des données
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={handleBackup}
              >
                <Download className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <label className="w-full">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                  disabled={isRestoring}
                />
                <Button
                  variant="outline"
                  className="w-full h-12"
                  disabled={isRestoring}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isRestoring ? "Restauration..." : "Restaurer"}
                </Button>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Données</h3>
            <Button
              variant="outline"
              className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleClearData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer toutes les données
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
