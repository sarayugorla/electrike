import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@electrike_profile',
  VEHICLES: '@electrike_vehicles',
  TRIPS: '@electrike_trips',
  SETTINGS: '@electrike_settings',
  BATTERY: '@electrike_battery',
  ACTIVE_VEHICLE_ID: '@electrike_active_vehicle_id',
  STATION_REVIEWS: '@electrike_station_reviews',
  SAVED_PLACES: '@electrike_saved_places',
};

// Default initial profile
export const DEFAULT_PROFILE = {
  name: 'Alex Rider',
  mobileNumber: '+91 98765 43210',
  vehicleType: 'Car',
  vehicleMake: 'Tata',
  vehicleModel: 'Nexon EV Max',
  numberPlate: 'KA 01 EV 2026',
};

// Default saved places (Home, Work, Other)
export const DEFAULT_SAVED_PLACES = {
  home: {
    id: 'home',
    label: 'Home',
    icon: 'home',
    name: 'Home Residence',
    address: 'Jubilee Hills, Road No. 36, Hyderabad',
    latitude: 17.4325,
    longitude: 78.4020,
  },
  work: {
    id: 'work',
    label: 'Work',
    icon: 'briefcase',
    name: 'Cyber Gateway',
    address: 'HITEC City, Madhapur, Hyderabad',
    latitude: 17.4485,
    longitude: 78.3780,
  },
  other: {
    id: 'other',
    label: 'Other',
    icon: 'star',
    name: 'Financial Club',
    address: 'Gachibowli, Financial District, Hyderabad',
    latitude: 17.4401,
    longitude: 78.3489,
  },
};

// Default initial vehicles list (only ONE active by default)
export const DEFAULT_VEHICLES = [
  {
    id: 'v1',
    name: 'Tata Nexon EV Max',
    type: 'Car',
    make: 'Tata',
    model: 'Nexon EV Max',
    numberPlate: 'KA 01 EV 2026',
    batteryPercentage: 84,
    batteryCapacityKwh: 40.5,
    isActive: true,
  },
  {
    id: 'v2',
    name: 'Ather 450X',
    type: 'Scooty',
    make: 'Ather',
    model: '450X Gen 3',
    numberPlate: 'KA 05 EQ 8899',
    batteryPercentage: 92,
    batteryCapacityKwh: 3.7,
    isActive: false,
  },
  {
    id: 'v3',
    name: 'Mahindra Treo',
    type: 'Auto',
    make: 'Mahindra',
    model: 'Treo Electric',
    numberPlate: 'KA 03 ET 4411',
    batteryPercentage: 68,
    batteryCapacityKwh: 7.37,
    isActive: false,
  },
];

/**
 * Fetch profile information from local storage
 */
export async function getProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error reading profile from AsyncStorage:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save profile information to local storage
 */
export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving profile to AsyncStorage:', error);
    return false;
  }
}

/**
 * Fetch list of saved vehicles
 */
export async function getVehicles() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.VEHICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure at least one vehicle is active
        const hasActive = parsed.some((v) => v.isActive);
        if (!hasActive) {
          parsed[0].isActive = true;
          await AsyncStorage.setItem(KEYS.VEHICLES, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
    await AsyncStorage.setItem(KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
    return DEFAULT_VEHICLES;
  } catch (error) {
    console.error('Error reading vehicles from AsyncStorage:', error);
    return DEFAULT_VEHICLES;
  }
}

/**
 * Save list of vehicles
 */
export async function saveVehicles(vehicles) {
  try {
    await AsyncStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
    return true;
  } catch (error) {
    console.error('Error saving vehicles to AsyncStorage:', error);
    return false;
  }
}

/**
 * Set active vehicle by ID (ensuring strictly only ONE vehicle is active)
 */
export async function setActiveVehicle(vehicleId) {
  try {
    const current = await getVehicles();
    let selectedVehicle = null;

    const updated = current.map((v) => {
      const isTarget = v.id === vehicleId || v.numberPlate === vehicleId;
      if (isTarget) selectedVehicle = v;
      return {
        ...v,
        isActive: isTarget,
      };
    });

    if (selectedVehicle) {
      await saveVehicles(updated);
      await AsyncStorage.setItem(KEYS.ACTIVE_VEHICLE_ID, selectedVehicle.id);

      // Sync active vehicle to profile
      const profile = await getProfile();
      const updatedProfile = {
        ...profile,
        vehicleType: selectedVehicle.type,
        vehicleMake: selectedVehicle.make,
        vehicleModel: selectedVehicle.model,
        numberPlate: selectedVehicle.numberPlate,
      };
      await saveProfile(updatedProfile);
    }

    return updated;
  } catch (error) {
    console.error('Error setting active vehicle:', error);
    return null;
  }
}

/**
 * Add a new vehicle to the list
 */
export async function addVehicle(vehicle) {
  try {
    const current = await getVehicles();
    const newVehicle = {
      id: `v_${Date.now()}`,
      batteryPercentage: 90,
      batteryCapacityKwh: vehicle.type === 'Car' ? 35 : vehicle.type === 'Auto' ? 8 : 4,
      isActive: false, // Newly added vehicle is not active by default unless it's the only one
      ...vehicle,
    };

    if (current.length === 0) {
      newVehicle.isActive = true;
    }

    const updated = [newVehicle, ...current];
    await saveVehicles(updated);
    return updated;
  } catch (error) {
    console.error('Error adding vehicle to AsyncStorage:', error);
    return null;
  }
}

/**
 * Delete a vehicle by ID.
 * If the active vehicle is removed, automatically select the first remaining vehicle.
 */
export async function deleteVehicle(vehicleId) {
  try {
    const current = await getVehicles();
    if (current.length <= 1) {
      // Cannot delete the only vehicle
      return { success: false, message: 'You must have at least one vehicle in your garage.' };
    }

    const targetVehicle = current.find((v) => v.id === vehicleId);
    const updated = current.filter((v) => v.id !== vehicleId);

    // If target was active, make the first remaining vehicle active
    if (targetVehicle && targetVehicle.isActive && updated.length > 0) {
      updated[0].isActive = true;
      // Sync to profile
      const profile = await getProfile();
      await saveProfile({
        ...profile,
        vehicleType: updated[0].type,
        vehicleMake: updated[0].make,
        vehicleModel: updated[0].model,
        numberPlate: updated[0].numberPlate,
      });
      await AsyncStorage.setItem(KEYS.ACTIVE_VEHICLE_ID, updated[0].id);
    }

    await saveVehicles(updated);
    return { success: true, vehicles: updated };
  } catch (error) {
    console.error('Error deleting vehicle from AsyncStorage:', error);
    return { success: false, message: 'Failed to delete vehicle.' };
  }
}

/**
 * Battery State Management (persists across screens & app reloads)
 */
export async function getBattery() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BATTERY);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return val;
      }
    }
    return 84; // Default initial battery
  } catch (error) {
    console.error('Error reading battery from AsyncStorage:', error);
    return 84;
  }
}

export async function saveBattery(percentage) {
  try {
    const val = Math.max(0, Math.min(100, Math.round(percentage)));
    await AsyncStorage.setItem(KEYS.BATTERY, val.toString());
    return val;
  } catch (error) {
    console.error('Error saving battery to AsyncStorage:', error);
    return percentage;
  }
}

/**
 * Station Reviews Persistence
 */
export async function getStationReviews(stationId) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATION_REVIEWS);
    if (raw) {
      const allReviews = JSON.parse(raw);
      return allReviews[stationId] || [];
    }
    return [];
  } catch (error) {
    console.error('Error reading station reviews:', error);
    return [];
  }
}

export async function saveStationReview(stationId, review) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATION_REVIEWS);
    const allReviews = raw ? JSON.parse(raw) : {};
    const existing = allReviews[stationId] || [];
    const updated = [review, ...existing];
    allReviews[stationId] = updated;
    await AsyncStorage.setItem(KEYS.STATION_REVIEWS, JSON.stringify(allReviews));
    return updated;
  } catch (error) {
    console.error('Error saving station review:', error);
    return null;
  }
}

/**
 * Fetch trip history
 */
export async function getTrips() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRIPS);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (error) {
    console.error('Error reading trips from AsyncStorage:', error);
    return null;
  }
}

/**
 * Save or append a new trip
 */
export async function saveTrip(trip) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRIPS);
    const existing = raw ? JSON.parse(raw) : [];
    const newTrip = {
      id: `trip_${Date.now()}`,
      date: new Date().toISOString(),
      ...trip,
    };
    const updated = [newTrip, ...existing];
    await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving trip to AsyncStorage:', error);
    return null;
  }
}

/**
 * Fetch saved places (Home, Work, Other)
 */
export async function getSavedPlaces() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVED_PLACES);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVED_PLACES, ...parsed };
    }
    return DEFAULT_SAVED_PLACES;
  } catch (error) {
    console.error('Error reading saved places from AsyncStorage:', error);
    return DEFAULT_SAVED_PLACES;
  }
}

/**
 * Save saved places
 */
export async function saveSavedPlaces(places) {
  try {
    await AsyncStorage.setItem(KEYS.SAVED_PLACES, JSON.stringify(places));
    return true;
  } catch (error) {
    console.error('Error saving saved places to AsyncStorage:', error);
    return false;
  }
}

export default {
  getProfile,
  saveProfile,
  getVehicles,
  saveVehicles,
  setActiveVehicle,
  addVehicle,
  deleteVehicle,
  getBattery,
  saveBattery,
  getStationReviews,
  saveStationReview,
  getTrips,
  saveTrip,
  getSavedPlaces,
  saveSavedPlaces,
  DEFAULT_PROFILE,
  DEFAULT_VEHICLES,
  DEFAULT_SAVED_PLACES,
};
