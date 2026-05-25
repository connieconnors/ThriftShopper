"use client";

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
    if (primary === "local_only") {
      onChange({
        ...value,
        primary,
        localPickupAvailable: false,
        shipsIn1To2Days: false,
        flatRate: null,
      });
      return;
    }
    if (primary === "free") {
      onChange({ ...value, primary, flatRate: null });
      return;
    }
    onChange({ ...value, primary });
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
          <span className="text-gray-800">Buyer pays shipping (flat amount)</span>
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
      {value.primary === "buyer_pays" && (
        <div className="pl-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Shipping amount
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.flatRate ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({
                  ...value,
                  flatRate: raw === "" ? null : Number(raw),
                });
              }}
              disabled={optsDisabled}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-gray-900"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Buyer pays this amount at checkout in addition to the item price.
          </p>
        </div>
      )}
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
