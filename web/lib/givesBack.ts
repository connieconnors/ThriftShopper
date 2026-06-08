export type GivesBackProfile = {
  gives_back?: boolean | null;
  gives_back_name?: string | null;
  gives_back_pct?: number | string | null;
  is_non_profit_org?: boolean | null;
};

/** Public badge only when seller opted in with complete charity details. */
export function showsGivesBackBadge(
  profile: GivesBackProfile | null | undefined
): boolean {
  if (!profile || profile.gives_back !== true) return false;
  const name = String(profile.gives_back_name ?? "").trim();
  const pct = String(profile.gives_back_pct ?? "").trim();
  return name.length > 0 && pct.length > 0;
}

export function validateGivesBackFields(opts: {
  enabled: boolean;
  name: string;
  pct: string;
}): string | null {
  if (!opts.enabled) return null;
  if (!opts.name.trim()) {
    return "Please enter who you give back to.";
  }
  if (!opts.pct.trim()) {
    return "Please enter an approximate percentage given back.";
  }
  return null;
}

export function serializeGivesBackForSave(opts: {
  enabled: boolean;
  name: string;
  pct: string;
  isNonProfit: boolean;
}) {
  if (!opts.enabled) {
    return {
      gives_back: false,
      gives_back_name: null,
      gives_back_pct: null,
      is_non_profit_org: false,
    };
  }
  return {
    gives_back: true,
    gives_back_name: opts.name.trim(),
    gives_back_pct: opts.pct.trim(),
    is_non_profit_org: opts.isNonProfit,
  };
}

export const GIVES_BACK_ENABLE_CONFIRM =
  "The Gives Back badge will appear on your shop and listings once you save. Only enable this if your charity details are accurate — buyers will see them publicly.";
