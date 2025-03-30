"use client";

import { Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InvoiceModalProps {
  sale: Sale;
  supermarketName: string;
  onClose: () => void;
}

export function InvoiceModal({
  sale,
  supermarketName,
  onClose,
}: InvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md mx-4 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Facture</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Invoice Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">FACTURE</h1>
              <p className="text-gray-600">N° {sale.id}</p>
              <p className="text-gray-600">
                Date: {new Date(sale.date).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {/* Customer Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Client</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-lg font-semibold">{supermarketName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  N° Client: {sale.supermarketId}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Détails</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {sale.quantity} pièces ×{" "}
                    {sale.pricePerUnit.toLocaleString("fr-DZ")} DZD
                  </span>
                  <span className="font-medium">
                    {(sale.quantity * sale.pricePerUnit).toLocaleString(
                      "fr-DZ"
                    )}{" "}
                    DZD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cartons</span>
                  <span className="font-medium">{sale.cartons}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">
                {(sale.quantity * sale.pricePerUnit).toLocaleString("fr-DZ")}{" "}
                DZD
              </span>
            </div>

            {/* Payment Status */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Statut de paiement</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sale.isPaid
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {sale.isPaid ? "Payé" : "Non payé"}
                </span>
              </div>
              {!sale.isPaid && sale.expectedPaymentDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Date de paiement prévue:{" "}
                  {new Date(sale.expectedPaymentDate).toLocaleDateString(
                    "fr-FR"
                  )}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="mt-6 text-sm text-gray-500">
              <p>Conditions de paiement:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Paiement à 30 jours</li>
                <li>Pas d&apos;escompte en cas de paiement anticipé</li>
                <li>
                  En cas de retard de paiement, une pénalité de 3 fois le taux
                  d&apos;intérêt légal sera appliquée
                </li>
              </ul>
            </div>

            {/* Signature Section */}
            <div className="mt-8 pt-8 border-t">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b border-gray-300 w-32 mb-2"></div>
                  <p className="text-sm text-gray-600">Client</p>
                </div>
                <div>
                  <div className="border-b border-gray-300 w-32 mb-2"></div>
                  <p className="text-sm text-gray-600">Vendeur</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Buttons */}
        <div className="p-4 border-t bg-white">
          <div className="flex justify-end space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300"
            >
              Exiter
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Imprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
