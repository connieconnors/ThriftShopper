"use client";

import { Package } from "lucide-react";
import type { ShippingPreferences, ShippingPrimary } from "@/lib/shippingPreferences";

interface ShippingPreferenceFormProps {
  value: ShippingPreferences;
  onChange: (prefs: ShippingPreferences) => void;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function ShippingPreferenceForm({
  value,
  onChange,
  label = "How do you ship?",
  showLabel = true,
  disabled = false,
}: ShippingPreferenceFormProps) {
  const isLocalOnly = value.primary === "local_only";
  const optsDisabled = disabled;

  const setPrimary = (primary: ShippingPrimary) => {
    onChange({ ...value, primary });
    if (primary === "local_only") {
      onChange({ ...value, primary, localPickupAvailable: false, shipsIn1To2Days: false });
    }
  };

  return (
    <div className="space-y-4">
      {showLabel && (
        <label className="block font-medium" style={{ color: "#16193a" }}>
          {label}
        </label>
      )}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="shipping-primary"
            checked={value.primary === "free"}
            onChange={() => setPrimary("free")}
            disabled={optsDisabled}
            className="w-4 h-4 border-gray-300 text-[#16193a] focus:ring-[#16193a]"
          />
          <span className="text-gray-800">Free shipping (I cover all shipping costs)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="shipping-primary"
            checked={value.primary === "buyer_pays"}
            onChange={() => setPrimary("buyer_pays")}
            disabled={optsDisabled}
            className="w-4 h-4 border-gray-300 text-[#16193a] focus:ring-[#16193a]"
          />
          <span className="text-gray-800">Buyer pays shipping (calculated at checkout)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="shipping-primary"
            checked={value.primary === "local_only"}
            onChange={() => setPrimary("local_only")}
            disabled={optsDisabled}
            className="w-4 h-4 border-gray-300 text-[#16193a] focus:ring-[#16193a]"
          />
          <span className="text-gray-800">Local pickup only (no shipping available)</span>
        </label>
      </div>
      <div className="pl-6 space-y-2 border-l-2 border-gray-200">
        <label
          className={`flex items-center gap-3 ${isLocalOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            checked={value.localPickupAvailable}
            onChange={(e) => onChange({ ...value, localPickupAvailable: e.target.checked })}
            disabled={optsDisabled || isLocalOnly}
            className="h-4 w-4 accent-[#16193a] rounded border-gray-300 disabled:opacity-60"
          />
          <span className={isLocalOnly ? "text-gray-400" : "text-gray-700"}>Local pickup also available</span>
        </label>
        <label
          className={`flex items-center gap-3 ${isLocalOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            checked={value.shipsIn1To2Days}
            onChange={(e) => onChange({ ...value, shipsIn1To2Days: e.target.checked })}
            disabled={optsDisabled || isLocalOnly}
            className="h-4 w-4 accent-[#16193a] rounded border-gray-300 disabled:opacity-60"
          />
          <span className={isLocalOnly ? "text-gray-400" : "text-gray-700"}>Ships within 1-2 days</span>
        </label>
      </div>
    </div>
  );
}
