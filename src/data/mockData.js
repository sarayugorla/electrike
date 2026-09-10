/**
 * Electrike Mock Data
 * Contains mock routes, charging stations, trip histories, and single-route selection logic.
 * Default region: Hyderabad Metropolitan Area, Telangana.
 */

export const ROUTE_PREFERENCES = {
  SAVED_PLACES: 'Saved Places',
  COST_PATH: 'Cost Path',
  TIME_PATH: 'Time Path',
  COOLEST_PATH: 'Coolest Path',
};

// 4 distinct corridors mapping 1:1 to the 4 Route Planning modes in Hyderabad
export const MOCK_ROUTES = {
  [ROUTE_PREFERENCES.SAVED_PLACES]: {
    id: 'route_saved',
    preference: ROUTE_PREFERENCES.SAVED_PLACES,
    name: 'Saved Places Corridor',
    subtitle: 'Via Outer Ring Road (ORR Expressway)',
    distanceKm: 34.5,
    etaMinutes: 38,
    energyKwh: 6.8,
    arrivalBattery: 68,
    chargingCost: 180,
    chargingStops: 1,
    coolScore: 74,
    isSaved: true,
    tag: 'Frequent & Verified',
    turnInstructions: [
      { id: 't1', instruction: 'Head south on Hitech City Main Rd towards Cyber Towers', distance: '1.2 km', icon: 'arrow-up' },
      { id: 't2', instruction: 'Merge onto Nehru Outer Ring Road (ORR) via Gachibowli Interchange', distance: '8.5 km', icon: 'git-merge' },
      { id: 't3', instruction: 'Continue straight on ORR past Nanakramguda Toll Plaza', distance: '14 km', icon: 'arrow-forward' },
      { id: 't4', instruction: 'Jio-bp pulse EV Hub upcoming on service road (Shamshabad)', distance: '6.2 km', icon: 'flash' },
      { id: 't5', instruction: 'Take Exit 16 toward Rajiv Gandhi International Airport', distance: '2.8 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Arrive at RGIA Departure Ramp', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 17.4435, longitude: 78.3772 }, // HITEC City
      { latitude: 17.4401, longitude: 78.3489 }, // Gachibowli
      { latitude: 17.4180, longitude: 78.3420 }, // Nanakramguda ORR
      { latitude: 17.3750, longitude: 78.3650 }, // Appa Junction
      { latitude: 17.3320, longitude: 78.3980 }, // Rajendranagar ORR
      { latitude: 17.2750, longitude: 78.4210 }, // Shamshabad Toll
      { latitude: 17.2403, longitude: 78.4294 }, // RGIA Airport
    ],
  },

  [ROUTE_PREFERENCES.COST_PATH]: {
    id: 'route_cost',
    preference: ROUTE_PREFERENCES.COST_PATH,
    name: 'Cost Path Corridor',
    subtitle: 'Via Mehdipatnam & Attapur (Lowest Tariff)',
    distanceKm: 29.2,
    etaMinutes: 46,
    energyKwh: 5.4,
    arrivalBattery: 72,
    chargingCost: 120, // Lowest charging tariff
    chargingStops: 1,
    coolScore: 71,
    isSaved: false,
    tag: 'Lowest Tariff',
    turnInstructions: [
      { id: 't1', instruction: 'Head south on Road No. 1, Banjara Hills', distance: '1.5 km', icon: 'arrow-up' },
      { id: 't2', instruction: 'Cross Masab Tank Flyover towards Mehdipatnam', distance: '4.2 km', icon: 'arrow-forward' },
      { id: 't3', instruction: 'Continue on Attapur Ring Road past Pillar 140', distance: '7.8 km', icon: 'arrow-forward' },
      { id: 't4', instruction: 'Tata Power EZ Charge upcoming at Aramghar', distance: '5.1 km', icon: 'flash' },
      { id: 't5', instruction: 'Follow NH 44 Highway south to Shamshabad', distance: '8.4 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Arrive at destination', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 17.4156, longitude: 78.4350 }, // Banjara Hills
      { latitude: 17.3990, longitude: 78.4480 }, // Masab Tank
      { latitude: 17.3780, longitude: 78.4400 }, // Mehdipatnam
      { latitude: 17.3480, longitude: 78.4320 }, // Attapur
      { latitude: 17.3150, longitude: 78.4380 }, // Aramghar
      { latitude: 17.2550, longitude: 78.4310 }, // Shamshabad
      { latitude: 17.2403, longitude: 78.4294 }, // RGIA Airport
    ],
  },

  [ROUTE_PREFERENCES.TIME_PATH]: {
    id: 'route_time',
    preference: ROUTE_PREFERENCES.TIME_PATH,
    name: 'Time Path Corridor',
    subtitle: 'Via PVNR Elevated Expressway (Fastest)',
    distanceKm: 31.0,
    etaMinutes: 34,
    energyKwh: 6.2,
    arrivalBattery: 70,
    chargingCost: 195,
    chargingStops: 1,
    coolScore: 78,
    isSaved: false,
    tag: 'Fastest ETA',
    turnInstructions: [
      { id: 't1', instruction: 'Head southeast on Jubilee Hills Check Post Road', distance: '2.0 km', icon: 'arrow-up' },
      { id: 't2', instruction: 'Take the ramp onto PVNR Elevated Expressway', distance: '11.6 km', icon: 'git-merge' },
      { id: 't3', instruction: 'Descend at Aramghar Junction towards NH 44', distance: '3.4 km', icon: 'arrow-forward' },
      { id: 't4', instruction: 'Zeon Fast Charger accessible via NH44 service road', distance: '7.5 km', icon: 'flash' },
      { id: 't5', instruction: 'Take Airport Approach Flyover directly to terminal', distance: '4.8 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Arrive at Airport Departure Gate', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 17.4319, longitude: 78.4073 }, // Jubilee Hills
      { latitude: 17.4080, longitude: 78.4380 }, // Banjara / Masab Tank Ramp
      { latitude: 17.3820, longitude: 78.4410 }, // PVNR Mid-Span
      { latitude: 17.3420, longitude: 78.4360 }, // Upperpally
      { latitude: 17.3150, longitude: 78.4380 }, // Aramghar End
      { latitude: 17.2620, longitude: 78.4320 }, // Shamshabad
      { latitude: 17.2403, longitude: 78.4294 }, // RGIA Airport
    ],
  },

  [ROUTE_PREFERENCES.COOLEST_PATH]: {
    id: 'route_coolest',
    preference: ROUTE_PREFERENCES.COOLEST_PATH,
    name: 'Coolest Path Corridor',
    subtitle: 'Via Gandipet & Osman Sagar Scenic Green Belt',
    distanceKm: 42.0,
    etaMinutes: 49,
    energyKwh: 7.9,
    arrivalBattery: 65,
    chargingCost: 175,
    chargingStops: 1,
    coolScore: 92, // Highest eco & thermal score
    isSaved: false,
    tag: 'Greener & Shaded',
    turnInstructions: [
      { id: 't1', instruction: 'Head west from HITEC City towards Botanical Garden', distance: '3.2 km', icon: 'arrow-up' },
      { id: 't2', instruction: 'Take Gandipet Main Road through tree-lined forest canopy', distance: '9.5 km', icon: 'leaf' },
      { id: 't3', instruction: 'Pass picturesque Osman Sagar Lake bund view', distance: '8.0 km', icon: 'arrow-forward' },
      { id: 't4', instruction: 'Statiq Eco Station at Gandipet Resort hub', distance: '6.2 km', icon: 'flash' },
      { id: 't5', instruction: 'Connect through Himayat Sagar service bypass', distance: '9.8 km', icon: 'arrow-forward' },
      { id: 't6', instruction: 'Arrive at Shamshabad Southern Junction', distance: 'Destination', icon: 'flag' },
    ],
    coordinates: [
      { latitude: 17.4435, longitude: 78.3772 }, // HITEC City
      { latitude: 17.4620, longitude: 78.3600 }, // Botanical Garden / Kondapur
      { latitude: 17.4350, longitude: 78.3180 }, // Gandipet Lake approach
      { latitude: 17.3910, longitude: 78.2980 }, // Osman Sagar Scenic Bund
      { latitude: 17.3320, longitude: 78.3450 }, // Himayat Sagar Green Belt
      { latitude: 17.2720, longitude: 78.3980 }, // Airport Bypass
      { latitude: 17.2403, longitude: 78.4294 }, // RGIA Airport
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

// Mock Charging Stations in Hyderabad with detailed reviews
export const MOCK_CHARGING_STATIONS = [
  {
    id: 'cs_hyd_1',
    name: 'Tata Power EZ Charge - HITEC Cyber Towers',
    address: 'Cyber Towers Campus, Main Gateway, Madhapur, Hyderabad',
    coordinate: { latitude: 17.4485, longitude: 78.3780 },
    chargingPower: '60 kW DC Fast Dual Gun',
    connectorType: 'CCS2 / Type 2 AC',
    estimatedPrice: '₹15.50 / kWh',
    availability: '3 of 4 Available',
    status: 'Available',
    rating: 4.8,
    reviewCount: 38,
    reviews: [
      {
        id: 'rev_h1',
        author: 'Suresh Varma',
        rating: 5,
        comment: 'Very fast 60kW charging speed. Food court and clean restrooms right inside Cyber Towers.',
        date: '1 day ago',
      },
      {
        id: 'rev_h2',
        author: 'Pranathi Reddy',
        rating: 5,
        comment: 'Worked seamlessly with RFID tap and Tata Power EZ Charge app. 20% to 80% in 35 mins.',
        date: '5 days ago',
      },
      {
        id: 'rev_h3',
        author: 'Karthik Rao',
        rating: 4,
        comment: 'Dedicated EV parking bays with security staff assisting during busy office hours.',
        date: '2 weeks ago',
      },
    ],
  },
  {
    id: 'cs_hyd_2',
    name: 'Zeon Fast Charging Hub - Gachibowli ORR',
    address: 'Near Gachibowli Junction ORR Entry, Financial District, Hyderabad',
    coordinate: { latitude: 17.4360, longitude: 78.3520 },
    chargingPower: '120 kW Ultra-Fast DC',
    connectorType: 'Dual CCS2',
    estimatedPrice: '₹17.00 / kWh',
    availability: '2 of 2 Available',
    status: 'Available',
    rating: 4.9,
    reviewCount: 45,
    reviews: [
      {
        id: 'rev_h4',
        author: 'Venkat Naidu',
        rating: 5,
        comment: 'Blazing fast 120kW charger! Charged my EV6 in under 25 minutes. Ample space for large cars.',
        date: '2 days ago',
      },
      {
        id: 'rev_h5',
        author: 'Aditi Sharma',
        rating: 5,
        comment: 'Convenient 24x7 entry from Outer Ring Road. 24-hr cafeteria adjacent.',
        date: '1 week ago',
      },
    ],
  },
  {
    id: 'cs_hyd_3',
    name: 'Jio-bp pulse - Shamshabad Airport Plaza',
    address: 'Airport Approach Road, Near Rajiv Gandhi Int Airport, Shamshabad',
    coordinate: { latitude: 17.2550, longitude: 78.4310 },
    chargingPower: '60 kW DC Fast',
    connectorType: 'CCS2',
    estimatedPrice: '₹16.00 / kWh',
    availability: '3 of 4 Available',
    status: 'Available',
    rating: 4.6,
    reviewCount: 31,
    reviews: [
      {
        id: 'rev_h6',
        author: 'Rahul Sen',
        rating: 4,
        comment: 'Ideal pre-flight top up spot. Clear signage from the expressway toll gate.',
        date: '3 days ago',
      },
      {
        id: 'rev_h7',
        author: 'Ananya G.',
        rating: 5,
        comment: 'Clean premises, good illumination at night, instant activation via Jio-bp app.',
        date: '2 weeks ago',
      },
    ],
  },
  {
    id: 'cs_hyd_4',
    name: 'Statiq Smart EV Hub - Banjara Hills',
    address: 'Road No. 1, Near City Center Mall, Banjara Hills, Hyderabad',
    coordinate: { latitude: 17.4180, longitude: 78.4420 },
    chargingPower: '50 kW DC Fast',
    connectorType: 'CCS2 / CHAdeMO',
    estimatedPrice: '₹14.80 / kWh',
    availability: '1 of 2 Available',
    status: 'Available',
    rating: 4.5,
    reviewCount: 27,
    reviews: [
      {
        id: 'rev_h8',
        author: 'Mahesh B.',
        rating: 4,
        comment: 'Central location in Banjara Hills. Mall parking can get busy on weekends.',
        date: '4 days ago',
      },
      {
        id: 'rev_h9',
        author: 'Divya P.',
        rating: 5,
        comment: 'Well shaded canopy and staff helps plug in. Smooth contactless payment.',
        date: '1 week ago',
      },
    ],
  },
  {
    id: 'cs_hyd_5',
    name: 'Ather Grid & Statiq - Jubilee Hills 36',
    address: 'Road No. 36, Near Metro Pillar 1640, Jubilee Hills, Hyderabad',
    coordinate: { latitude: 17.4325, longitude: 78.4020 },
    chargingPower: '30 kW DC + Fast AC',
    connectorType: 'Type 2 AC / CCS2',
    estimatedPrice: '₹13.50 / kWh',
    availability: '4 of 4 Available',
    status: 'Available',
    rating: 4.7,
    reviewCount: 22,
    reviews: [
      {
        id: 'rev_h10',
        author: 'Vikram Joshi',
        rating: 5,
        comment: 'Reliable 2-wheeler and 4-wheeler hub. Plenty of cafes around while waiting.',
        date: '2 days ago',
      },
    ],
  },
];

// Initial mock activity / trip history in Hyderabad
export const INITIAL_MOCK_TRIPS = [
  {
    id: 'trip_101',
    source: 'HITEC City, Madhapur',
    destination: 'Rajiv Gandhi Int. Airport (RGIA)',
    stops: ['Gachibowli Junction'],
    date: 'Yesterday at 09:30 AM',
    vehicle: 'Tata Nexon EV Max',
    vehicleType: 'Car',
    preference: ROUTE_PREFERENCES.COOLEST_PATH,
    distanceKm: 42.0,
    durationMinutes: 49,
    energyConsumedKwh: 7.9,
    totalCost: '₹175',
    savedCo2Kg: '5.6 kg',
  },
  {
    id: 'trip_102',
    source: 'Banjara Hills, Road No. 1',
    destination: 'Financial District, Gachibowli',
    stops: [],
    date: '04 Sep 2026, 06:15 PM',
    vehicle: 'Ather 450X',
    vehicleType: 'Scooty',
    preference: ROUTE_PREFERENCES.TIME_PATH,
    distanceKm: 16.5,
    durationMinutes: 28,
    energyConsumedKwh: 1.8,
    totalCost: '₹28',
    savedCo2Kg: '2.4 kg',
  },
  {
    id: 'trip_103',
    source: 'Jubilee Hills, Road No. 36',
    destination: 'Secunderabad Junction',
    stops: ['Begumpet Flyover'],
    date: '28 Aug 2026, 03:00 PM',
    vehicle: 'Tata Nexon EV Max',
    vehicleType: 'Car',
    preference: ROUTE_PREFERENCES.COST_PATH,
    distanceKm: 18.2,
    durationMinutes: 36,
    energyConsumedKwh: 3.4,
    totalCost: '₹55',
    savedCo2Kg: '2.8 kg',
  },
];

// Current mock location (Hyderabad)
export const MOCK_CURRENT_LOCATION = {
  latitude: 17.4435,
  longitude: 78.3772,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
  address: 'HITEC City, Madhapur, Hyderabad',
  coordinatesDisplay: '17.4435° N, 78.3772° E',
};

export const MOCK_DESTINATION = {
  latitude: 17.2403,
  longitude: 78.4294,
  address: 'Rajiv Gandhi Int. Airport (RGIA), Shamshabad',
};
