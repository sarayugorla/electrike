/**
 * Geocoding Service using OpenStreetMap Nominatim
 * Provides location autocomplete with focus on the Hyderabad metropolitan area.
 * Free and requires no API key.
 *
 * Features:
 * - Structured formatting: Place Name + Area / Locality, City, State
 * - Deduplication of near-identical results and physical campus overlap
 * - Prioritizes Hyderabad / Secunderabad and Telangana metro region
 * - Preserves latitude, longitude, and full usable address
 */

// Hyderabad metropolitan bounding box (approximate viewbox for soft biasing)
const HYDERABAD_VIEWBOX = '78.10,17.70,78.80,17.15';

/**
 * Normalizes a text string for comparison (removes punctuation, lowercases, trims)
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates approximate Euclidean distance between two coordinates in km
 */
function getApproxDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat1 - lat2) * 111;
  const dLon = (lon1 - lon2) * 111 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Extracts a clean, structured place representation from a Nominatim result.
 * Format:
 *   name: Place Name (e.g. "Inorbit Mall", "Kukatpally Metro Station")
 *   subtitle: Area / Locality, City, State (e.g. "Madhapur, Hyderabad, Telangana")
 */
function formatGeocodingItem(item) {
  const address = item.address || {};

  // 1. Determine Place Name
  const rawName =
    item.namedetails?.name ||
    item.name ||
    address.amenity ||
    address.building ||
    address.shop ||
    address.tourism ||
    address.leisure ||
    address.office ||
    address.railway ||
    address.aeroway ||
    address.historic ||
    address.suburb ||
    address.neighbourhood ||
    address.road ||
    item.display_name.split(',')[0];

  const primaryName = (rawName || '').trim();

  // 2. Determine Locality / Area
  let area =
    address.suburb ||
    address.neighbourhood ||
    address.locality ||
    address.quarter ||
    address.residential ||
    address.commercial ||
    address.city_district ||
    address.road ||
    '';

  // If area is identical to place name, try road or fallback
  if (normalizeString(area) === normalizeString(primaryName)) {
    area = address.road && normalizeString(address.road) !== normalizeString(primaryName)
      ? address.road
      : address.city_district || '';
  }

  // 3. Determine City / Town
  let city =
    address.city ||
    address.town ||
    address.municipality ||
    address.county ||
    '';

  const fullText = (item.display_name || '') + ' ' + (item.address?.state || '');
  if (!city) {
    if (fullText.includes('Secunderabad')) city = 'Secunderabad';
    else if (fullText.includes('Hyderabad')) city = 'Hyderabad';
    else city = address.state_district || 'Hyderabad';
  }

  // 4. Determine State
  const state = address.state || (fullText.includes('Telangana') ? 'Telangana' : 'Telangana');

  // Build clean "Area / Locality, City, State"
  const subtitleParts = [];
  if (area && normalizeString(area) !== normalizeString(primaryName)) {
    subtitleParts.push(area.trim());
  }
  if (city && normalizeString(city) !== normalizeString(primaryName) && normalizeString(city) !== normalizeString(area)) {
    subtitleParts.push(city.trim());
  }
  if (state && normalizeString(state) !== normalizeString(city)) {
    subtitleParts.push(state.trim());
  }

  const subtitle = subtitleParts.length > 0
    ? subtitleParts.join(', ')
    : 'Hyderabad, Telangana';

  const lat = parseFloat(item.lat);
  const lon = parseFloat(item.lon);

  // Check if inside Hyderabad metro region
  const isHyderabadRegion =
    lat >= 17.10 && lat <= 17.75 && lon >= 78.10 && lon <= 78.85;

  return {
    id: String(item.place_id || item.osm_id || Math.random()),
    name: primaryName,
    subtitle,
    displayName: item.display_name,
    latitude: lat,
    longitude: lon,
    isHyderabadRegion,
    category: item.category,
    type: item.type,
  };
}

/**
 * Deduplicates results while preserving legitimately different places that share the same name.
 * e.g., Multiple Starbucks branches in different localities are kept.
 * Nearby redundant POIs within the same building / campus (< 350m) with identical name are removed.
 */
function deduplicateResults(items) {
  const result = [];

  for (const current of items) {
    const normName = normalizeString(current.name);
    const normSub = normalizeString(current.subtitle);

    // Check if we already have a near-duplicate
    const isDuplicate = result.some((existing) => {
      const existingName = normalizeString(existing.name);
      const existingSub = normalizeString(existing.subtitle);

      // Condition A: Exact same Place Name + same Locality/Subtitle
      if (normName === existingName && normSub === existingSub) {
        return true;
      }

      // Condition B: Same or overlapping name AND within 350m physical distance
      // (e.g. Inorbit Mall parking vs Inorbit Mall gate vs Inorbit Mall building)
      const isNameMatch =
        normName === existingName ||
        (normName.length > 5 && existingName.length > 5 && (normName.includes(existingName) || existingName.includes(normName)));

      if (isNameMatch) {
        const distKm = getApproxDistanceKm(
          current.latitude,
          current.longitude,
          existing.latitude,
          existing.longitude
        );
        if (distKm < 0.35) {
          return true; // Too close physically: redundant entry for the same place
        }
      }

      return false;
    });

    if (!isDuplicate) {
      result.push(current);
    }

    if (result.length >= 6) {
      break;
    }
  }

  return result;
}

/**
 * Searches for locations matching the given query string.
 * @param {string} query - The search query text
 * @returns {Promise<Array<{id: string, name: string, subtitle: string, displayName: string, latitude: number, longitude: number}>>}
 */
export async function searchLocations(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  try {
    // Soft bias toward Hyderabad via viewbox + bounded=0, limit=14 to allow deduplication
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=in&viewbox=${HYDERABAD_VIEWBOX}&bounded=0&limit=14&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Electrike-EV-Planner/1.0 (support@electrike.app)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Geocoding response not ok:', response.status);
      return getFallbackSuggestions(cleanQuery);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return getFallbackSuggestions(cleanQuery);
    }

    // Format all items
    const formatted = data.map(formatGeocodingItem);

    // Prioritize results within Hyderabad metropolitan area
    formatted.sort((a, b) => {
      if (a.isHyderabadRegion && !b.isHyderabadRegion) return -1;
      if (!a.isHyderabadRegion && b.isHyderabadRegion) return 1;
      return 0;
    });

    // Deduplicate and cap to top 6 distinct results
    const deduplicated = deduplicateResults(formatted);

    return deduplicated.length > 0 ? deduplicated : getFallbackSuggestions(cleanQuery);
  } catch (error) {
    console.warn('Geocoding request failed, using local suggestions:', error?.message);
    return getFallbackSuggestions(cleanQuery);
  }
}

/**
 * Curated Hyderabad locations fallback when offline or rate-limited
 */
const HYDERABAD_COMMON_PLACES = [
  {
    name: 'HITEC City',
    area: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4435,
    longitude: 78.3772,
  },
  {
    name: 'Gachibowli',
    area: 'Financial District',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4401,
    longitude: 78.3489,
  },
  {
    name: 'Inorbit Mall',
    area: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4338,
    longitude: 78.3840,
  },
  {
    name: 'Banjara Hills',
    area: 'Road No. 1',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4156,
    longitude: 78.4350,
  },
  {
    name: 'Jubilee Hills',
    area: 'Check Post',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4319,
    longitude: 78.4073,
  },
  {
    name: 'Kukatpally Metro Station',
    area: 'Kukatpally',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4938,
    longitude: 78.3995,
  },
  {
    name: 'Secunderabad Railway Station',
    area: 'Station Road',
    city: 'Secunderabad',
    state: 'Telangana',
    latitude: 17.4334,
    longitude: 78.5045,
  },
  {
    name: 'Rajiv Gandhi International Airport (RGIA)',
    area: 'Shamshabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.2403,
    longitude: 78.4294,
  },
  {
    name: 'Charminar',
    area: 'Old City',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.3616,
    longitude: 78.4747,
  },
  {
    name: 'Madhapur Cyber Towers',
    area: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4483,
    longitude: 78.3915,
  },
  {
    name: 'Kondapur',
    area: 'Botanical Garden',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4699,
    longitude: 78.3578,
  },
  {
    name: 'Ibrahimpatnam',
    area: 'Sagar Highway',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.1950,
    longitude: 78.6480,
  },
  {
    name: 'Maheshwaram Hardware Park',
    area: 'Maheshwaram',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.1330,
    longitude: 78.4290,
  },
];

function getFallbackSuggestions(query) {
  const q = normalizeString(query);
  const matched = HYDERABAD_COMMON_PLACES.filter(
    (p) =>
      normalizeString(p.name).includes(q) ||
      normalizeString(p.area).includes(q) ||
      normalizeString(p.city).includes(q)
  );

  return matched.slice(0, 6).map((p, idx) => {
    const subtitle = `${p.area}, ${p.city}, ${p.state}`;
    return {
      id: `local_${idx}_${p.name}`,
      name: p.name,
      subtitle,
      displayName: `${p.name}, ${subtitle}`,
      latitude: p.latitude,
      longitude: p.longitude,
      isHyderabadRegion: true,
    };
  });
}

export default {
  searchLocations,
};
