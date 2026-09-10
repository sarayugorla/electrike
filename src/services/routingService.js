/**
 * Map an OSRM maneuver type + modifier to an Ionicons icon name.
 */
function maneuverToIcon(type, modifier) {
  if (type === 'arrive') return 'flag';
  if (type === 'depart') return 'arrow-up';
  if (type === 'roundabout' || type === 'rotary') return 'git-merge';
  if (type === 'fork') return 'git-merge';
  if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') return 'arrow-back';
  if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') return 'arrow-forward';
  if (modifier === 'uturn') return 'arrow-undo';
  return 'arrow-up';
}

/**
 * Fetch driving route between start, optional waypoints, and end coordinates.
 * @param {{latitude: number, longitude: number}} start
 * @param {{latitude: number, longitude: number}} end
 * @param {Array<{latitude: number, longitude: number}>} [waypoints=[]]
 * @returns {Promise<{coordinates: Array<{latitude: number, longitude: number}>, distanceKm: number, durationMin: number, steps: Array} | null>}
 */
export async function getRoute(start, end, waypoints = []) {
  if (!start || !end || !start.latitude || !start.longitude || !end.latitude || !end.longitude) {
    return null;
  }

  try {
    // Construct coordinate list: lon,lat;lon,lat;...
    const coordsList = [
      `${start.longitude},${start.latitude}`,
      ...waypoints
        .filter((w) => w && w.latitude && w.longitude)
        .map((w) => `${w.longitude},${w.latitude}`),
      `${end.longitude},${end.latitude}`,
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsList}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('OSRM routing response not ok:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no routes:', data.code);
      return null;
    }

    const route = data.routes[0];
    const geoCoordinates = route.geometry?.coordinates || [];

    // Map [lon, lat] pairs to {latitude, longitude}
    const coordinates = geoCoordinates.map((pt) => ({
      latitude: pt[1],
      longitude: pt[0],
    }));

    const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
    const durationMin = Math.round(route.duration / 60);

    // Parse OSRM steps from all legs into a unified turn-by-turn array
    const steps = [];
    if (route.legs && route.legs.length > 0) {
      for (const leg of route.legs) {
        if (leg.steps && leg.steps.length > 0) {
          for (const step of leg.steps) {
            const maneuver = step.maneuver || {};
            const distM = step.distance || 0;
            const distLabel =
              distM >= 1000
                ? `${(distM / 1000).toFixed(1)} km`
                : `${Math.round(distM)} m`;
            const instruction =
              step.name && step.name.trim().length > 0
                ? `${maneuver.type ? maneuver.type.charAt(0).toUpperCase() + maneuver.type.slice(1) : 'Continue'} on ${step.name}`
                : (maneuver.type ? maneuver.type.charAt(0).toUpperCase() + maneuver.type.slice(1) : 'Continue');
            steps.push({
              instruction,
              distance: distLabel,
              icon: maneuverToIcon(maneuver.type, maneuver.modifier),
            });
          }
        }
      }
    }

    return {
      coordinates,
      distanceKm,
      durationMin,
      steps: steps.length > 0 ? steps : null,
    };
  } catch (error) {
    console.warn('OSRM routing failed:', error?.message);
    return null;
  }
}

export default {
  getRoute,
};
