/**
 * Electrike Mock Data
 * Contains mock routes, charging stations, trip histories, and recommendation logic.
 */

export const ROUTE_PREFERENCES = {
  SAVED_PLACES: 'Saved Places',
  COST_PATH: 'Cost Path',
  TIME_PATH: 'Time Path',
  COOLEST_PATH: 'Coolest Path',
};

// Route A, B, C exactly matching specifications
export const MOCK_ROUTES = [
  {
    id: 'route_a',
    name: 'Route A',
    subtitle: 'Via Bengaluru-Mysuru Expressway (NH275)',
    distanceKm: 152,
    etaMinutes: 140,
    energyKwh: 28.4,
    arrivalBattery: 24,
    chargingCost: 320,
    chargingStops: 2,
    coolScore: 65,
    isSaved: true,
    tag: 'Frequent & Direct',
    highlights: ['Fastest corridor', 'Multiple fast chargers', 'Smooth expressway'],
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
  {
    id: 'route_b',
    name: 'Route B',
    subtitle: 'Via Kanakapura & Malavalli State Highway (NH948)',
    distanceKm: 158,
    etaMinutes: 150,
    energyKwh: 26.1,
    arrivalBattery: 29,
    chargingCost: 245,
    chargingStops: 1,
    coolScore: 73,
    isSaved: false,
    tag: 'Budget & Economical',
    highlights: ['Lowest charging fee', 'Moderate elevation', 'Low congestion'],
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
  {
    id: 'route_c',
    name: 'Route C',
    subtitle: 'Via Magadi & Nagamangala Forest Canopy',
    distanceKm: 166,
    etaMinutes: 162,
    energyKwh: 27.2,
    arrivalBattery: 27,
    chargingCost: 280,
    chargingStops: 1,
    coolScore: 91,
    isSaved: false,
    tag: 'Eco-Scenic Canopy',
    highlights: ['Highest cool score', '70% tree canopy cover', 'Optimal battery thermal stability'],
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
];

/**
 * Recommendation Logic:
 * - Saved Places -> select the route marked saved/frequent
 * - Cost Path -> route with lowest chargingCost
 * - Time Path -> route with lowest etaMinutes
 * - Coolest Path -> route with highest coolScore
 * Returns { recommended: Route, alternatives: [Route, Route] }
 */
export function getRecommendedRoutes(preference = ROUTE_PREFERENCES.SAVED_PLACES) {
  const routes = [...MOCK_ROUTES];
  let recommended = null;

  switch (preference) {
    case ROUTE_PREFERENCES.SAVED_PLACES:
      recommended = routes.find((r) => r.isSaved) || routes[0];
      break;

    case ROUTE_PREFERENCES.COST_PATH:
      recommended = [...routes].sort((a, b) => a.chargingCost - b.chargingCost)[0];
      break;

    case ROUTE_PREFERENCES.TIME_PATH:
      recommended = [...routes].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
      break;

    case ROUTE_PREFERENCES.COOLEST_PATH:
      recommended = [...routes].sort((a, b) => b.coolScore - a.coolScore)[0];
      break;

    default:
      recommended = routes[0];
  }

  const alternatives = routes.filter((r) => r.id !== recommended.id);

  return {
    recommended,
    alternatives,
    all: [recommended, ...alternatives],
  };
}

// Mock Charging Stations
export const MOCK_CHARGING_STATIONS = [
  {
    id: 'cs_1',
    name: 'Zeon Fast Charging Hub - Bidadi',
    address: 'NH 275, Near Toyota Plant, Bidadi',
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
        comment: 'Super fast charging, great coffee shop next door while waiting.',
        date: '2 days ago',
      },
      {
        id: 'rev_2',
        author: 'Deepa S.',
        rating: 4,
        comment: 'Worked seamlessly with RFID tap. Charged from 20% to 80% in 35 mins.',
        date: '1 week ago',
      },
    ],
  },
  {
    id: 'cs_2',
    name: 'Tata Power EZ Charge - Ramanagara',
    address: 'Expressway Service Road, Ramanagara',
    coordinate: { latitude: 12.7150, longitude: 77.2750 },
    chargingPower: '50 kW DC Fast Charger',
    connectorType: 'CCS2',
    estimatedPrice: '₹16.00 / kWh',
    availability: '1 of 2 Available',
    status: 'Available',
    rating: 4.3,
    reviewCount: 28,
    reviews: [
      {
        id: 'rev_3',
        author: 'Vikram Patel',
        rating: 4,
        comment: 'Good reliable charger. Shaded parking spot.',
        date: '3 days ago',
      },
      {
        id: 'rev_4',
        author: 'Arjun M.',
        rating: 4,
        comment: 'Slight queue during peak weekend hours, but clean restroom facilities.',
        date: '2 weeks ago',
      },
    ],
  },
  {
    id: 'cs_3',
    name: 'Jio-bp pulse - Mandya Express',
    address: 'Indian Oil Petrol Pump Campus, Mandya Bypass',
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
        comment: 'Very clean, illuminated well at night. Highly recommended!',
        date: '4 days ago',
      },
    ],
  },
  {
    id: 'cs_4',
    name: 'Kazam EV Hub - Srirangapatna',
    address: 'Mysuru Highway junction, Srirangapatna',
    coordinate: { latitude: 12.4150, longitude: 76.6950 },
    chargingPower: '30 kW DC Fast',
    connectorType: 'CCS2 & GB/T',
    estimatedPrice: '₹13.80 / kWh',
    availability: '1 of 1 Available',
    status: 'Available',
    rating: 4.1,
    reviewCount: 19,
    reviews: [
      {
        id: 'rev_7',
        author: 'Manoj Hegde',
        rating: 4,
        comment: 'Affordable rates, easy scan-and-pay via UPI.',
        date: '5 days ago',
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
    rating: 4.6,
    reviewCount: 22,
    reviews: [
      {
        id: 'rev_8',
        author: 'Ramesh K.',
        rating: 5,
        comment: 'Great spot on the Kanakapura scenic route. Peaceful surroundings.',
        date: '3 days ago',
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
    durationMinutes: 162,
    energyConsumedKwh: 27.2,
    totalCost: '₹280',
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
