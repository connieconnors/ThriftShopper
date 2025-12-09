// web/lib/utils/tagNormalizer.ts

// Normalizes a tag column value (moods, styles, intents) from DB to a string array
export function normalizeTagColumn(value: string[] | string | null | undefined): string[] {
  if (!value) return [];

  // If it's already an array, ensure each item is trimmed and cleaned
  if (Array.isArray(value)) {
    return value.map(tag => cleanAndFormatTag(tag)).filter(Boolean);
  }

  // If it's a JSON string with brackets, parse it
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(tag => cleanAndFormatTag(tag)).filter(Boolean);
      }
    } catch (e) {
      // If parsing fails, fall through to comma split
    }
  }

  // Otherwise treat as comma-separated string
  return value.split(',').map(tag => cleanAndFormatTag(tag)).filter(Boolean);
}

// Cleans and formats a single tag string
function cleanAndFormatTag(tag: string): string {
  let cleaned = String(tag).trim();
  // Remove leading/trailing quotes and brackets
  cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
  // Remove any remaining quotes or brackets in the middle
  cleaned = cleaned.replace(/["\[\]]/g, '');
  // Ensure space after commas within the text (e.g., "Home Decor,collectibles" -> "Home Decor, collectibles")
  cleaned = cleaned.replace(/,([^\s])/g, ', $1');
  return cleaned;
}

// Converts a string array of tags to a comma-separated string for database storage
export function tagsToDbFormat(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return tags.map(tag => cleanAndFormatTag(tag)).join(',');
}

