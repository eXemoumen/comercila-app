"use client";

import type { Sale } from "../types/index";
import { Button } from "@/components/ui/button";
import { X, Mail, Printer } from "lucide-react";
import { useState } from "react";

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
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    // Set sending state to show loading indicator
    setSending(true);

    try {
      // In a real implementation, you would:
      // 1. Generate a PDF of the invoice
      // 2. Send it to the client's email

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success message
      setSendSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSendSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error sending invoice:", error);
    } finally {
      setSending(false);
    }
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
          {sendSuccess && (
            <div className="mb-3 bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm">
              Facture envoyée avec succès !
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300"
            >
              Fermer
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-300"
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimer
            </Button>
            <Button
              onClick={handleSendEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={sending}
            >
              {sending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Envoi...
                </div>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
