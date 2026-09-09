/**
 * Electrike Mock Data
 * Contains mock routes, charging stations, trip histories, and single-route selection logic.
 */

export const ROUTE_PREFERENCES = {
  SAVED_PLACES: 'Saved Places',
  COST_PATH: 'Cost Path',
  TIME_PATH: 'Time Path',
  COOLEST_PATH: 'Coolest Path',
};

// 4 distinct corridors mapping 1:1 to the 4 Route Planning modes
export const MOCK_ROUTES = {
  [ROUTE_PREFERENCES.SAVED_PLACES]: {
    id: 'route_saved',
    preference: ROUTE_PREFERENCES.SAVED_PLACES,
    name: 'Saved Places Corridor',
    subtitle: 'Via Bengaluru-Mysuru Expressway (NH275)',
    distanceKm: 152,
    etaMinutes: 138,
    energyKwh: 28.2,
    arrivalBattery: 26,
    chargingCost: 310,
    chargingStops: 2,
    coolScore: 68,
    isSaved: true,
    tag: 'Frequent & Verified',
    turnInstructions: [
      { id: 't1', instruction: 'Head southwest on Hosur Rd towards Electronic City Toll', distance: '800 m', icon: 'arrow-up' },
      { id: 't2', instruction: 'Merge onto NICE Ring Road toward Expressway Exit', distance: '12 km', icon: 'git-merge' },
      { id: 't3', instruction: 'Take the Bengaluru-Mysuru Expressway (NH275)', distance: '45 km', icon: 'arrow-forward' },
      { id: 't4', instruction: 'Zeon Fast Charging Hub upcoming on left (Bidadi)', distance: '28 km', icon: 'flash' },
      { id: 't5', instruction: 'Take Exit 4 toward Mysuru Palace Ring Road', distance: '1.2 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Arrive at Mysuru Palace on your right', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 12.8452, longitude: 77.6602 }, // Bengaluru (Electronic City)
      { latitude: 12.8210, longitude: 77.5250 }, // Kengeri
      { latitude: 12.7950, longitude: 77.3850 }, // Bidadi
      { latitude: 12.7150, longitude: 77.2750 }, // Ramanagara
      { latitude: 12.6100, longitude: 77.1000 }, // Channapatna
      { latitude: 12.5250, longitude: 76.8950 }, // Mandya
      { latitude: 12.4150, longitude: 76.6950 }, // Srirangapatna
      { latitude: 12.3052, longitude: 76.6552 }, // Mysuru Palace
    ],
  },

  [ROUTE_PREFERENCES.COST_PATH]: {
    id: 'route_cost',
    preference: ROUTE_PREFERENCES.COST_PATH,
    name: 'Cost Path Corridor',
    subtitle: 'Via Kanakapura & Malavalli State Highway (NH948)',
    distanceKm: 158,
    etaMinutes: 148,
    energyKwh: 25.4,
    arrivalBattery: 32,
    chargingCost: 215, // Lowest charging tariff
    chargingStops: 1,
    coolScore: 76,
    isSaved: false,
    tag: 'Lowest Tariff',
    turnInstructions: [
      { id: 't1', instruction: 'Head west on Bannerghatta Link towards NH948', distance: '1.4 km', icon: 'arrow-back' },
      { id: 't2', instruction: 'Continue on Kanakapura Main Road towards Kaggalipura', distance: '18 km', icon: 'arrow-up' },
      { id: 't3', instruction: 'Pass Statiq Smart EV Hub near Green Valley', distance: '34 km', icon: 'flash' },
      { id: 't4', instruction: 'Slight left onto Malavalli-Bannur State Highway', distance: '42 km', icon: 'arrow-forward' },
      { id: 't5', instruction: 'Enter Bannur Rd towards Mysuru City limits', distance: '14 km', icon: 'arrow-up' },
      { id: 't6', instruction: 'Destination ahead: Mysuru Palace Gate 2', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 12.8452, longitude: 77.6602 }, // Bengaluru
      { latitude: 12.7750, longitude: 77.5600 }, // Kaggalipura
      { latitude: 12.5480, longitude: 77.4200 }, // Kanakapura
      { latitude: 12.4100, longitude: 77.1800 }, // Halaguru
      { latitude: 12.3850, longitude: 77.0500 }, // Malavalli
      { latitude: 12.3700, longitude: 76.8800 }, // Bannur
      { latitude: 12.3052, longitude: 76.6552 }, // Mysuru Palace
    ],
  },

  [ROUTE_PREFERENCES.TIME_PATH]: {
    id: 'route_time',
    preference: ROUTE_PREFERENCES.TIME_PATH,
    name: 'Time Path Corridor',
    subtitle: 'Via NICE Ring Road & Greenfield Super Expressway',
    distanceKm: 146,
    etaMinutes: 118, // Fastest ETA
    energyKwh: 29.5,
    arrivalBattery: 23,
    chargingCost: 335,
    chargingStops: 1,
    coolScore: 62,
    isSaved: false,
    tag: 'Fastest ETA',
    turnInstructions: [
      { id: 't1', instruction: 'Take NICE expressway toll ramp west', distance: '500 m', icon: 'arrow-forward' },
      { id: 't2', instruction: 'High-speed cruising on Bengaluru-Mysuru Expressway', distance: '68 km', icon: 'speedometer' },
      { id: 't3', instruction: 'Jio-bp pulse ultra-fast 120kW DC stop on right', distance: '30 km', icon: 'flash' },
      { id: 't4', instruction: 'Flyover bypass over Srirangapatna town', distance: '18 km', icon: 'arrow-up' },
      { id: 't5', instruction: 'Exit expressway directly into Mysuru Central Arterial', distance: '2.5 km', icon: 'arrow-back' },
      { id: 't6', instruction: 'Arrived at destination: Mysuru Palace', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 12.8452, longitude: 77.6602 }, // Bengaluru
      { latitude: 12.8300, longitude: 77.4900 }, // NICE Jn
      { latitude: 12.7500, longitude: 77.3200 }, // Ramanagara bypass
      { latitude: 12.5600, longitude: 76.9800 }, // Maddur bypass
      { latitude: 12.5100, longitude: 76.8800 }, // Mandya bypass
      { latitude: 12.4300, longitude: 76.6800 }, // Srirangapatna
      { latitude: 12.3052, longitude: 76.6552 }, // Mysuru Palace
    ],
  },

  [ROUTE_PREFERENCES.COOLEST_PATH]: {
    id: 'route_coolest',
    preference: ROUTE_PREFERENCES.COOLEST_PATH,
    name: 'Coolest Path Corridor',
    subtitle: 'Via Magadi & Nagamangala Forest Canopy',
    distanceKm: 166,
    etaMinutes: 156,
    energyKwh: 26.6,
    arrivalBattery: 29,
    chargingCost: 260,
    chargingStops: 1,
    coolScore: 94, // Max Tree Canopy & Thermal Shade
    isSaved: false,
    tag: 'Eco & Thermal',
    turnInstructions: [
      { id: 't1', instruction: 'Turn right towards Magadi Road forest corridor', distance: '600 m', icon: 'arrow-forward' },
      { id: 't2', instruction: 'Enter 70% tree canopy covered shaded boulevard', distance: '24 km', icon: 'leaf' },
      { id: 't3', instruction: 'Continue on State Highway 85 through Nagamangala', distance: '48 km', icon: 'arrow-up' },
      { id: 't4', instruction: 'Kazam Eco EV Charging station in shaded grove', distance: '32 km', icon: 'flash' },
      { id: 't5', instruction: 'Cross Kaveri river shaded bridge towards Mysuru', distance: '12 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Reached destination: Mysuru Palace', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 12.8452, longitude: 77.6602 }, // Bengaluru
      { latitude: 12.9600, longitude: 77.4000 }, // Tavarekere
      { latitude: 12.9560, longitude: 77.2280 }, // Magadi
      { latitude: 12.9200, longitude: 76.9500 }, // Kunigal
      { latitude: 12.8200, longitude: 76.7500 }, // Nagamangala
      { latitude: 12.4800, longitude: 76.7000 }, // Pandavapura
      { latitude: 12.3052, longitude: 76.6552 }, // Mysuru Palace
    ],
  },
};

/**
 * Returns strictly ONE route corresponding to the selected mode.
 */
export function getSingleRoute(preference = ROUTE_PREFERENCES.SAVED_PLACES) {
  const route = MOCK_ROUTES[preference] || MOCK_ROUTES[ROUTE_PREFERENCES.SAVED_PLACES];
  return route;
}

/**
 * Backwards compatibility helper returning single route
 */
export function getRecommendedRoutes(preference = ROUTE_PREFERENCES.SAVED_PLACES) {
  const single = getSingleRoute(preference);
  return {
    recommended: single,
    alternatives: [],
    all: [single],
    single,
  };
}

// Mock Charging Stations along the corridors with detailed reviews
export const MOCK_CHARGING_STATIONS = [
  {
    id: 'cs_1',
    name: 'Zeon Fast Charging Hub - Bidadi',
    address: 'NH 275, Near Toyota Industrial Plant, Bidadi',
    coordinate: { latitude: 12.7950, longitude: 77.3850 },
    chargingPower: '60 kW DC Fast Dual Gun',
    connectorType: 'CCS2 / Type 2 AC',
    estimatedPrice: '₹14.50 / kWh',
    availability: '3 of 4 Available',
    status: 'Available',
    rating: 4.8,
    reviewCount: 42,
    reviews: [
      {
        id: 'rev_1',
        author: 'Kiran Rao',
        rating: 5,
        comment: 'Fast charger and easy to locate. Great coffee shop right next door.',
        date: '2 days ago',
      },
      {
        id: 'rev_2',
        author: 'Deepa S.',
        rating: 5,
        comment: 'Worked seamlessly with RFID tap. Charged from 20% to 80% in 35 mins.',
        date: '1 week ago',
      },
      {
        id: 'rev_101',
        author: 'Naveen Kumar',
        rating: 4,
        comment: 'Well lit canopy area, clean washrooms, security guard was very helpful.',
        date: '2 weeks ago',
      },
    ],
  },
  {
    id: 'cs_2',
    name: 'Tata Power EZ Charge - Ramanagara',
    address: 'Expressway Service Road, Near Janapada Loka, Ramanagara',
    coordinate: { latitude: 12.7150, longitude: 77.2750 },
    chargingPower: '50 kW DC Fast Charger',
    connectorType: 'CCS2',
    estimatedPrice: '₹16.00 / kWh',
    availability: '1 of 2 Available',
    status: 'Available',
    rating: 4.4,
    reviewCount: 29,
    reviews: [
      {
        id: 'rev_3',
        author: 'Vikram Patel',
        rating: 4,
        comment: 'Reliable charger with shaded canopy. Quick OTP authentication.',
        date: '3 days ago',
      },
      {
        id: 'rev_4',
        author: 'Arjun M.',
        rating: 4,
        comment: 'Slight queue during Sunday evening peak, but excellent charging speed.',
        date: '2 weeks ago',
      },
      {
        id: 'rev_102',
        author: 'Sneha Joshi',
        rating: 5,
        comment: 'Perfect midpoint stop on the highway. App based start was instant.',
        date: '3 weeks ago',
      },
    ],
  },
  {
    id: 'cs_3',
    name: 'Jio-bp pulse - Mandya Express',
    address: 'Indian Oil Highway Complex, Mandya Bypass Mile 78',
    coordinate: { latitude: 12.5250, longitude: 76.8950 },
    chargingPower: '120 kW Ultra-Fast DC',
    connectorType: 'Dual CCS2',
    estimatedPrice: '₹15.20 / kWh',
    availability: '2 of 2 Available',
    status: 'Available',
    rating: 4.9,
    reviewCount: 65,
    reviews: [
      {
        id: 'rev_5',
        author: 'Sanjay Nair',
        rating: 5,
        comment: 'Blazing fast 120kW! Topped up in 20 minutes flat. 24/7 food court.',
        date: 'Yesterday',
      },
      {
        id: 'rev_6',
        author: 'Pooja K.',
        rating: 5,
        comment: 'Very clean, illuminated well at night. Highly recommended for long trips!',
        date: '4 days ago',
      },
    ],
  },
  {
    id: 'cs_4',
    name: 'Kazam EV Hub - Srirangapatna',
    address: 'Mysuru Highway Junction, Heritage Bypass, Srirangapatna',
    coordinate: { latitude: 12.4150, longitude: 76.6950 },
    chargingPower: '30 kW DC Fast',
    connectorType: 'CCS2 & GB/T',
    estimatedPrice: '₹13.80 / kWh',
    availability: '1 of 1 Available',
    status: 'Available',
    rating: 4.2,
    reviewCount: 19,
    reviews: [
      {
        id: 'rev_7',
        author: 'Manoj Hegde',
        rating: 4,
        comment: 'Affordable rates, easy scan-and-pay via UPI QR code.',
        date: '5 days ago',
      },
      {
        id: 'rev_103',
        author: 'Tanvi G.',
        rating: 5,
        comment: 'Pleasant temperature, nice tree shade while the car topped up.',
        date: '10 days ago',
      },
    ],
  },
  {
    id: 'cs_5',
    name: 'Statiq Smart EV Hub - Kanakapura',
    address: 'NH 948, Near Green Valley Resort, Kanakapura',
    coordinate: { latitude: 12.5480, longitude: 77.4200 },
    chargingPower: '60 kW DC Fast',
    connectorType: 'CCS2',
    estimatedPrice: '₹14.00 / kWh',
    availability: '2 of 2 Available',
    status: 'Available',
    rating: 4.7,
    reviewCount: 23,
    reviews: [
      {
        id: 'rev_8',
        author: 'Ramesh K.',
        rating: 5,
        comment: 'Great spot on the Kanakapura scenic route. Peaceful resort surroundings.',
        date: '3 days ago',
      },
      {
        id: 'rev_104',
        author: 'Harish Babu',
        rating: 4,
        comment: 'Good steady 55kW flow, clean drinking water available.',
        date: '1 week ago',
      },
    ],
  },
];

// Initial mock activity / trip history
export const INITIAL_MOCK_TRIPS = [
  {
    id: 'trip_101',
    source: 'Electronic City, Bengaluru',
    destination: 'Mysuru Palace, Mysuru',
    stops: ['Ramanagara Silks'],
    date: 'Yesterday at 09:30 AM',
    vehicle: 'Tata Nexon EV Max',
    vehicleType: 'Car',
    preference: ROUTE_PREFERENCES.COOLEST_PATH,
    distanceKm: 166,
    durationMinutes: 156,
    energyConsumedKwh: 26.6,
    totalCost: '₹260',
    savedCo2Kg: '18.4 kg',
  },
  {
    id: 'trip_102',
    source: 'Indiranagar 100ft Rd, Bengaluru',
    destination: 'Nandi Hills Summit',
    stops: [],
    date: '04 Sep 2026, 06:15 AM',
    vehicle: 'Ather 450X',
    vehicleType: 'Scooty',
    preference: ROUTE_PREFERENCES.TIME_PATH,
    distanceKm: 62,
    durationMinutes: 75,
    energyConsumedKwh: 2.8,
    totalCost: '₹42',
    savedCo2Kg: '7.1 kg',
  },
  {
    id: 'trip_103',
    source: 'Whitefield Tech Park, Bengaluru',
    destination: 'Kempegowda Int. Airport (BLR)',
    stops: ['Budigere Cross'],
    date: '28 Aug 2026, 04:00 PM',
    vehicle: 'Tata Nexon EV Max',
    vehicleType: 'Car',
    preference: ROUTE_PREFERENCES.COST_PATH,
    distanceKm: 41,
    durationMinutes: 52,
    energyConsumedKwh: 7.2,
    totalCost: '₹95',
    savedCo2Kg: '4.8 kg',
  },
];

// Current mock location
export const MOCK_CURRENT_LOCATION = {
  latitude: 12.8452,
  longitude: 77.6602,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
  address: 'Electronic City Phase 1, Bengaluru',
  coordinatesDisplay: '12.8452° N, 77.6602° E',
};

export const MOCK_DESTINATION = {
  latitude: 12.3052,
  longitude: 76.6552,
  address: 'Mysuru Palace, Mysuru',
};
