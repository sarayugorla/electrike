import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@electrike_profile',
  VEHICLES: '@electrike_vehicles',
  TRIPS: '@electrike_trips',
  SETTINGS: '@electrike_settings',
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

// Default initial vehicles list
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
      return JSON.parse(raw);
    }
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
 * Add a new vehicle to the list
 */
export async function addVehicle(vehicle) {
  try {
    const current = await getVehicles();
    const newVehicle = {
      id: `v_${Date.now()}`,
      batteryPercentage: 100,
      batteryCapacityKwh: vehicle.type === 'Car' ? 35 : vehicle.type === 'Auto' ? 8 : 4,
      ...vehicle,
    };
    const updated = [newVehicle, ...current];
    await saveVehicles(updated);
    return updated;
  } catch (error) {
    console.error('Error adding vehicle to AsyncStorage:', error);
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

export default {
  getProfile,
  saveProfile,
  getVehicles,
  saveVehicles,
  addVehicle,
  getTrips,
  saveTrip,
  DEFAULT_PROFILE,
  DEFAULT_VEHICLES,
};
