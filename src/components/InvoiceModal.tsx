"use client";

import type { Sale } from "../types/index";
import { Button } from "@/components/ui/button";
import { X, Mail, Printer, Share2 } from "lucide-react";
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
  const [showShareOptions, setShowShareOptions] = useState(false);

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

  const handleWhatsAppShare = () => {
    // Format the invoice details for WhatsApp
    const totalAmount = (sale.quantity * sale.pricePerUnit).toLocaleString(
      "fr-DZ"
    );
    const invoiceDate = new Date(sale.date).toLocaleDateString("fr-FR");

    const message =
      `*FACTURE N° ${sale.id}*\n` +
      `Date: ${invoiceDate}\n` +
      `Client: ${supermarketName}\n` +
      `Détails: ${sale.quantity} pièces × ${sale.pricePerUnit.toLocaleString(
        "fr-DZ"
      )} DZD\n` +
      `Cartons: ${sale.cartons}\n` +
      `Total: ${totalAmount} DZD\n` +
      `Statut: ${sale.isPaid ? "Payé" : "Non payé"}`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with the pre-filled message
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

    setShowShareOptions(false);
  };

  const handleViberShare = () => {
    // Format the invoice details for Viber
    const totalAmount = (sale.quantity * sale.pricePerUnit).toLocaleString(
      "fr-DZ"
    );
    const invoiceDate = new Date(sale.date).toLocaleDateString("fr-FR");

    const message =
      `FACTURE N° ${sale.id}\n` +
      `Date: ${invoiceDate}\n` +
      `Client: ${supermarketName}\n` +
      `Détails: ${sale.quantity} pièces × ${sale.pricePerUnit.toLocaleString(
        "fr-DZ"
      )} DZD\n` +
      `Cartons: ${sale.cartons}\n` +
      `Total: ${totalAmount} DZD\n` +
      `Statut: ${sale.isPaid ? "Payé" : "Non payé"}`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open Viber with the pre-filled message
    window.open(`viber://forward?text=${encodedMessage}`, "_blank");

    setShowShareOptions(false);
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

          {/* Share options dropdown */}
          {showShareOptions && (
            <div className="absolute bottom-[70px] right-4 bg-white shadow-lg rounded-md border p-2 w-48">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className="justify-start text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={handleWhatsAppShare}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                  onClick={handleViberShare}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.4.883C9.114.883 4.602.883 2.316 4.13 1.066 6.363.648 9.38.602 12.82c-.047 3.441-.094 9.884 6.045 11.608h.005l-.005 2.654s-.047 1.07.664 1.289c.85.27 1.35-.547 2.161-1.43.446-.482 1.059-1.196 1.523-1.74 4.19.352 7.407-.454 7.774-.575.85-.27 5.654-.889 6.442-7.258.82-6.885-.399-11.232-2.595-13.217l-.003-.003c-.662-.66-3.322-2.548-9.275-2.266-.001 0-.003 0-.005.001zm.147 1.685c5.113-.289 7.573 1.244 8.099 1.766h.003c1.87 1.691 2.46 5.352 1.771 10.838-.67 5.407-4.584 5.764-5.307 5.992-.307.101-3.209.836-6.841.586 0 0-2.714 3.266-3.562 4.114-.136.136-.3.181-.412.156-.16-.035-.207-.207-.205-.457l.027-4.016s-5.242-1.277-5.202-6.34c.039-5.063.466-7.652 1.516-9.546 1.828-2.741 5.589-2.816 7.657-3.093zm3.39 5.724s.294-.261.45-.24c0 0 .262.015.4.373.14.358.536 1.588.536 1.588s.15.374-.085.574c0 0-.085.089-.183.134-.097.045-.196.09-.196.09s-.202.099-.051.42c.15.321.706 1.51 1.486 2.453.909 1.094 2.116 1.876 2.401 2.051.285.176.446.134.595-.032.15-.165.637-.74.802-.99.165-.253.33-.21.56-.126.231.083 1.475.696 1.722.822.248.126.413.186.478.29.063.102.063.59-.15.16-.214 1.177-1.028 1.696-1.45 1.751-.422.055-.826.123-2.51-.525-3.417-1.32-5.352-4.817-5.514-5.046-.162-.229-.979-1.303-.979-2.49 0-1.185.614-1.766.827-2.004.214-.239.466-.303.626-.303zm-6.064-2.516a.496.496 0 01.498.496.498.498 0 01-.498.498.498.498 0 01-.497-.498c0-.273.223-.496.497-.496zm.756.431a.286.286 0 01.287.284.287.287 0 01-.574 0 .286.286 0 01.287-.284zm-1.543.065a.285.285 0 01.286.284.287.287 0 01-.573 0 .286.286 0 01.287-.284zm-.758 1.219a.287.287 0 01.287.284.287.287 0 01-.574 0 .286.286 0 01.287-.284zm.747 1.219a.284.284 0 01.286.284.285.285 0 01-.573 0 .288.288 0 01.287-.284zm1.536.065a.287.287 0 01.287.284.287.287 0 01-.574 0 .286.286 0 01.287-.284zm.757 1.22a.287.287 0 01.287.283.287.287 0 01-.574 0 .287.287 0 01.287-.284zm-2.29.693c-.22 0-.427-.175-.427-.36 0-.125 0-.244.002-.36.003-.22.209-.398.425-.398h.002c.22 0 .426.178.426.396v.003c0 .116.002.235.002.36 0 .184-.207.36-.428.36z" />
                  </svg>
                  Viber
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={handleSendEmail}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email
                </Button>
              </div>
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
              onClick={() => setShowShareOptions(!showShareOptions)}
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
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
