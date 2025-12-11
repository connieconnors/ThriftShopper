// Utility functions for managing user preferences in localStorage

const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'thriftshopper_recently_viewed',
  SAVED_SEARCHES: 'thriftshopper_saved_searches',
  SAVED_MOODS: 'thriftshopper_saved_moods',
  SELECTED_VIBES: 'thriftshopper_selected_vibes',
};

export interface RecentlyViewedItem {
  listingId: string;
  title: string;
  imageUrl: string | null;
  viewedAt: number; // timestamp
}

export interface SavedSearch {
  id: string;
  query: string;
  createdAt: number;
}

export interface SavedMood {
  id: string;
  mood: string;
  createdAt: number;
}

// Recently Viewed
export function getRecentlyViewed(userId: string): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${STORAGE_KEYS.RECENTLY_VIEWED}_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const items: RecentlyViewedItem[] = JSON.parse(data);
    // Sort by viewedAt descending, limit to 20
    return items.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, 20);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(
  userId: string,
  listingId: string,
  title: string,
  imageUrl: string | null
) {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEYS.RECENTLY_VIEWED}_${userId}`;
    const existing = getRecentlyViewed(userId);
    
    // Remove if already exists
    const filtered = existing.filter(item => item.listingId !== listingId);
    
    // Add new item
    const newItem: RecentlyViewedItem = {
      listingId,
      title,
      imageUrl,
      viewedAt: Date.now(),
    };
    
    const updated = [newItem, ...filtered].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently viewed:', error);
  }
}

// Saved Searches
export function getSavedSearches(userId: string): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${STORAGE_KEYS.SAVED_SEARCHES}_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const searches: SavedSearch[] = JSON.parse(data);
    // Sort by createdAt descending, limit to 10
    return searches.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  } catch {
    return [];
  }
}

export function addSavedSearch(userId: string, query: string) {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const key = `${STORAGE_KEYS.SAVED_SEARCHES}_${userId}`;
    const existing = getSavedSearches(userId);
    
    // Remove if already exists
    const filtered = existing.filter(s => s.query.toLowerCase() !== query.toLowerCase());
    
    // Add new search
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      query: query.trim(),
      createdAt: Date.now(),
    };
    
    const updated = [newSearch, ...filtered].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving search:', error);
  }
}

export function removeSavedSearch(userId: string, searchId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEYS.SAVED_SEARCHES}_${userId}`;
    const existing = getSavedSearches(userId);
    const filtered = existing.filter(s => s.id !== searchId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing search:', error);
  }
}

// Saved Moods
export function getSavedMoods(userId: string): SavedMood[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${STORAGE_KEYS.SAVED_MOODS}_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const moods: SavedMood[] = JSON.parse(data);
    return moods.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function addSavedMood(userId: string, mood: string) {
  if (typeof window === 'undefined' || !mood.trim()) return;
  
  try {
    const key = `${STORAGE_KEYS.SAVED_MOODS}_${userId}`;
    const existing = getSavedMoods(userId);
    
    // Remove if already exists
    const filtered = existing.filter(m => m.mood.toLowerCase() !== mood.toLowerCase());
    
    // Add new mood
    const newMood: SavedMood = {
      id: Date.now().toString(),
      mood: mood.trim(),
      createdAt: Date.now(),
    };
    
    const updated = [newMood, ...filtered].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving mood:', error);
  }
}

// Selected Vibes (from mood wheel)
export function getSelectedVibes(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${STORAGE_KEYS.SELECTED_VIBES}_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function setSelectedVibes(userId: string, vibes: string[]) {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEYS.SELECTED_VIBES}_${userId}`;
    localStorage.setItem(key, JSON.stringify(vibes));
  } catch (error) {
    console.error('Error saving vibes:', error);
  }
}

