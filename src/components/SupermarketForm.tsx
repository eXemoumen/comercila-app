import { useState, useEffect } from "react";
import { Supermarket, ContactNumber } from "@/types/index";
import {
  getSupermarkets,
  addSupermarket,
  updateSupermarket,
} from "@/utils/storage";

interface SupermarketFormProps {
  onSubmit: (supermarket: Supermarket) => void;
  onCancel: () => void;
  initialData?: Supermarket;
}

export default function SupermarketForm({
  onSubmit,
  onCancel,
  initialData,
}: SupermarketFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [contactNumbers, setContactNumbers] = useState<ContactNumber[]>(
    initialData?.contactNumbers || [{ number: "", personName: "" }]
  );
  const [email, setEmail] = useState(initialData?.email || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supermarketData = {
      name,
      address,
      contactNumbers: contactNumbers.filter(
        (contact) => contact.number.trim() !== ""
      ),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      totalSales: initialData?.totalSales || 0,
      totalValue: initialData?.totalValue || 0,
      location: initialData?.location || {
        lat: 36.7538,
        lng: 3.0588,
        formattedAddress: address,
      },
    };

    if (initialData) {
      const updated = updateSupermarket(initialData.id, supermarketData);
      onSubmit(updated);
    } else {
      const newSupermarket = addSupermarket(supermarketData);
      onSubmit(newSupermarket);
    }
  };

  const addContactNumber = () => {
    setContactNumbers([...contactNumbers, { number: "", personName: "" }]);
  };

  const removeContactNumber = (index: number) => {
    setContactNumbers(contactNumbers.filter((_, i) => i !== index));
  };

  const updateContactNumber = (
    index: number,
    field: keyof ContactNumber,
    value: string
  ) => {
    const newNumbers = [...contactNumbers];
    newNumbers[index] = { ...newNumbers[index], [field]: value };
    setContactNumbers(newNumbers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contact Numbers
        </label>
        <div className="space-y-2">
          {contactNumbers.map((contact, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="tel"
                  value={contact.number}
                  onChange={(e) =>
                    updateContactNumber(index, "number", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Phone number"
                  required
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={contact.personName || ""}
                  onChange={(e) =>
                    updateContactNumber(index, "personName", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Contact person name (optional)"
                />
              </div>
              {contactNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContactNumber(index)}
                  className="mt-1 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addContactNumber}
            className="mt-2 rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
          >
            Add Contact Number
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email (Optional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {initialData ? "Update" : "Add"} Supermarket
        </button>
      </div>
    </form>
  );
}
