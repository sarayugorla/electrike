import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROUTE_PREFERENCES, MOCK_CURRENT_LOCATION } from '../data/mockData';
import {
  getProfile,
  getVehicles,
  setActiveVehicle,
  getSavedPlaces,
  saveSavedPlaces,
  saveTrip,
} from '../storage/storage';
import { searchLocations } from '../services/geocodingService';
import BatteryIndicator from '../components/BatteryIndicator';
import { useBattery } from '../context/BatteryContext';

export default function RoutePlanningScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { batteryPercentage } = useBattery();

  // Navigation Menu Modal State
  const [menuVisible, setMenuVisible] = useState(false);

  // Profile & Vehicle State
  const [vehiclesList, setVehiclesList] = useState([]);
  const [activeVehicle, setActiveVehicleState] = useState(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState('Tata Nexon EV Max');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

  // Trip Inputs & Coordinates (Default: Hyderabad Metro Corridor)
  const [source, setSource] = useState('HITEC City, Madhapur');
  const [sourceLocation, setSourceLocation] = useState({
    latitude: 17.4435,
    longitude: 78.3772,
    name: 'HITEC City, Madhapur',
  });

  const [destination, setDestination] = useState('Rajiv Gandhi Int. Airport (RGIA)');
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 17.2403,
    longitude: 78.4294,
    name: 'Rajiv Gandhi Int. Airport (RGIA)',
  });

  const [intermediateStops, setIntermediateStops] = useState([]);

  // Autocomplete State
  const [activeSearchField, setActiveSearchField] = useState(null); // 'source' | 'destination' | stop_index
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef(null);

  // Route Preference (Default: Saved Places)
  const [selectedPreference, setSelectedPreference] = useState(ROUTE_PREFERENCES.SAVED_PLACES);

  // Saved Places State & Modal
  const [savedPlaces, setSavedPlacesState] = useState(null);
  const [savedPlacesModalVisible, setSavedPlacesModalVisible] = useState(false);
  const [editingPlaceKey, setEditingPlaceKey] = useState(null);
  const [editPlaceAddress, setEditPlaceAddress] = useState('');
  const [editPlaceCoords, setEditPlaceCoords] = useState(null);

  // Current Location state
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Reload vehicles, profile, and saved places on focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadSavedPlaces();
    }, [])
  );

  useEffect(() => {
    if (route.params) {
      if (route.params.prefillSource) setSource(route.params.prefillSource);
      if (route.params.prefillDestination) setDestination(route.params.prefillDestination);
      if (route.params.prefillStops) setIntermediateStops(route.params.prefillStops);
      if (route.params.prefillPreference) setSelectedPreference(route.params.prefillPreference);
      if (route.params.prefillVehicle) setSelectedVehicleName(route.params.prefillVehicle);
    }
  }, [route.params]);

  const loadUserData = async () => {
    try {
      const profile = await getProfile();
      const vehicles = await getVehicles();

      if (vehicles && vehicles.length > 0) {
        setVehiclesList(vehicles);
        const active = vehicles.find((v) => v.isActive) || vehicles[0];
        setActiveVehicleState(active);
        const name = active.name || `${active.make} ${active.model}`;
        if (!route.params?.prefillVehicle) {
          setSelectedVehicleName(name);
        }
      } else if (profile && profile.vehicleMake) {
        setSelectedVehicleName(`${profile.vehicleMake} ${profile.vehicleModel}`);
      }
    } catch (error) {
      console.error('Error loading user data in RoutePlanning:', error);
    }
  };

  const loadSavedPlaces = async () => {
    try {
      const places = await getSavedPlaces();
      setSavedPlacesState(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    }
  };

  // Autocomplete search handler with 400ms debounce
  const handleLocationQuery = (field, text, index = null) => {
    if (field === 'source') {
      setSource(text);
      setActiveSearchField('source');
    } else if (field === 'destination') {
      setDestination(text);
      setActiveSearchField('destination');
    } else if (field === 'stop') {
      const updated = [...intermediateStops];
      updated[index] = text;
      setIntermediateStops(updated);
      setActiveSearchField(`stop_${index}`);
    } else if (field === 'editSavedPlace') {
      setEditPlaceAddress(text);
      setActiveSearchField('editSavedPlace');
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion) => {
    const formattedAddress = suggestion.subtitle
      ? `${suggestion.name}, ${suggestion.subtitle.split(',')[0]}`
      : suggestion.name;

    if (activeSearchField === 'source') {
      setSource(formattedAddress);
      setSourceLocation({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        name: formattedAddress,
        address: suggestion.displayName || `${suggestion.name}, ${suggestion.subtitle}`,
      });
    } else if (activeSearchField === 'destination') {
      setDestination(formattedAddress);
      setDestinationLocation({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        name: formattedAddress,
        address: suggestion.displayName || `${suggestion.name}, ${suggestion.subtitle}`,
      });
    } else if (activeSearchField?.startsWith('stop_')) {
      const idx = parseInt(activeSearchField.replace('stop_', ''), 10);
      const updated = [...intermediateStops];
      updated[idx] = formattedAddress;
      setIntermediateStops(updated);
    } else if (activeSearchField === 'editSavedPlace') {
      setEditPlaceAddress(formattedAddress);
      setEditPlaceCoords({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
    }

    setSuggestions([]);
    setActiveSearchField(null);
  };

  // Add intermediate stop (Max 3)
  const handleAddStop = () => {
    if (intermediateStops.length >= 3) {
      Alert.alert('Limit Reached', 'You can add a maximum of 3 intermediate stops.');
      return;
    }
    setIntermediateStops([...intermediateStops, '']);
  };

  // Remove intermediate stop
  const handleRemoveStop = (index) => {
    const updated = intermediateStops.filter((_, i) => i !== index);
    setIntermediateStops(updated);
    if (activeSearchField === `stop_${index}`) {
      setActiveSearchField(null);
      setSuggestions([]);
    }
  };

  // Switch Active Vehicle
  const handleSelectVehicle = async (vehicle) => {
    const vName = vehicle.name || `${vehicle.make} ${vehicle.model}`;
    setSelectedVehicleName(vName);
    setActiveVehicleState(vehicle);
    await setActiveVehicle(vehicle.id);
    setVehicleModalVisible(false);
    await loadUserData();
  };

  // Select Preference Card
  const handleSelectPreference = (prefId) => {
    setSelectedPreference(prefId);
    if (prefId === ROUTE_PREFERENCES.SAVED_PLACES) {
      setSavedPlacesModalVisible(true);
    }
  };

  // Select a Saved Place as Destination and directly navigate to the Main Map page
  const handleChooseSavedPlace = async (place) => {
    if (!place || (!place.address && !place.name)) {
      Alert.alert('Unset Place', 'Please edit and configure this saved place first.');
      return;
    }

    const chosenName = place.name || place.address;
    const destCoords = {
      latitude: place.latitude || 17.385,
      longitude: place.longitude || 78.486,
      name: chosenName,
      address: place.address || chosenName,
    };

    // Determine Source:
    // 1. Use already selected Source if one exists
    // 2. Otherwise use current device location if available
    let effectiveSource = '';
    let effectiveSourceCoords = null;

    if (source && source.trim().length > 0) {
      effectiveSource = source.trim();
      effectiveSourceCoords = sourceLocation || {
        latitude: 17.4435,
        longitude: 78.3772,
        name: effectiveSource,
      };
    } else if (MOCK_CURRENT_LOCATION && MOCK_CURRENT_LOCATION.latitude) {
      effectiveSource = MOCK_CURRENT_LOCATION.address || 'Current Location';
      effectiveSourceCoords = {
        latitude: MOCK_CURRENT_LOCATION.latitude,
        longitude: MOCK_CURRENT_LOCATION.longitude,
        name: effectiveSource,
      };
    }

    // If no usable Source can be determined, inform user and remain on route planning screen
    if (!effectiveSource || !effectiveSourceCoords) {
      Alert.alert(
        'Source Location Required',
        'Please enter a starting location or enable GPS location before routing to your saved place.'
      );
      return;
    }

    // Update screen state
    setDestination(chosenName);
    setDestinationLocation(destCoords);
    setSelectedPreference(ROUTE_PREFERENCES.SAVED_PLACES);
    setSavedPlacesModalVisible(false);

    const filteredStops = intermediateStops.filter((s) => s && s.trim().length > 0);

    // Auto-save trip on journey initiation
    try {
      await saveTrip({
        source: effectiveSource,
        destination: chosenName,
        stops: filteredStops,
        preference: ROUTE_PREFERENCES.SAVED_PLACES,
        vehicle: selectedVehicleName,
        batteryPercentage,
        vehicleType: activeVehicle?.type || 'Car',
      });
    } catch (e) {
      console.warn('Failed to auto-save trip on saved place navigation:', e);
    }

    // Navigate directly to the Main Map page
    navigation.navigate('Map', {
      source: effectiveSource,
      sourceCoords: effectiveSourceCoords,
      destination: chosenName,
      destinationCoords: destCoords,
      stops: filteredStops,
      preference: ROUTE_PREFERENCES.SAVED_PLACES,
      vehicle: selectedVehicleName,
      batteryPercentage,
    });
  };

  // Save edited saved place
  const handleSavePlaceEdit = async (placeKey) => {
    if (!editPlaceAddress.trim()) {
      Alert.alert('Empty Address', 'Please provide a valid location or address.');
      return;
    }

    const currentPlaces = savedPlaces || {};
    const existing = currentPlaces[placeKey] || {};
    const updatedPlaces = {
      ...currentPlaces,
      [placeKey]: {
        ...existing,
        name: editPlaceAddress.trim(),
        address: editPlaceAddress.trim(),
        latitude: editPlaceCoords?.latitude || existing.latitude || 17.385,
        longitude: editPlaceCoords?.longitude || existing.longitude || 78.486,
      },
    };

    await saveSavedPlaces(updatedPlaces);
    setSavedPlacesState(updatedPlaces);
    setEditingPlaceKey(null);
    setEditPlaceAddress('');
    setEditPlaceCoords(null);
    setSuggestions([]);
    setActiveSearchField(null);
  };

  // Find Route (Journey Initiation: Auto-saves trip ONLY here)
  const handleFindRoutes = async () => {
    if (!source.trim()) {
      Alert.alert('Required Field', 'Please enter a starting point.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Required Field', 'Please enter a destination.');
      return;
    }

    const filteredStops = intermediateStops.filter((s) => s.trim().length > 0);

    // Auto-save trip record ONLY upon user tapping Find Route
    try {
      await saveTrip({
        source: source.trim(),
        destination: destination.trim(),
        stops: filteredStops,
        preference: selectedPreference,
        vehicle: selectedVehicleName,
        batteryPercentage,
        vehicleType: activeVehicle?.type || 'Car',
      });
    } catch (e) {
      console.warn('Failed to auto-save trip on find routes:', e);
    }

    navigation.navigate('Map', {
      source: source.trim(),
      sourceCoords: sourceLocation,
      destination: destination.trim(),
      destinationCoords: destinationLocation,
      stops: filteredStops,
      preference: selectedPreference,
      vehicle: selectedVehicleName,
      batteryPercentage,
    });
  };

  // 2x2 Route Modes Definition
  const PREFERENCE_OPTIONS = [
    {
      id: ROUTE_PREFERENCES.COST_PATH,
      title: 'Cost Path',
      desc: 'Lowest charging cost',
      icon: 'wallet-outline',
      badge: 'Lowest Tariff',
    },
    {
      id: ROUTE_PREFERENCES.TIME_PATH,
      title: 'Time Path',
      desc: 'Fastest estimated route',
      icon: 'time-outline',
      badge: 'Fastest ETA',
    },
    {
      id: ROUTE_PREFERENCES.COOLEST_PATH,
      title: 'Coolest Path',
      desc: 'Cooler, greener route',
      icon: 'leaf-outline',
      badge: 'Eco & Thermal',
    },
    {
      id: ROUTE_PREFERENCES.SAVED_PLACES,
      title: 'Saved Places',
      desc: 'Saved & frequent destinations',
      icon: 'bookmark-outline',
      badge: 'Quick Pick',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top App Bar with safe-area handling */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
          },
        ]}
      >
        {/* Hamburger Menu Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Open Navigation Menu"
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Active Vehicle Selector Pill */}
        <TouchableOpacity
          style={styles.vehiclePill}
          onPress={() => setVehicleModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="car-electric" size={17} color="#059669" />
          <Text style={styles.vehiclePillText} numberOfLines={1}>
            {selectedVehicleName}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#059669" />
        </TouchableOpacity>

        {/* Battery Indicator */}
        <BatteryIndicator />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>ELECTRIKE</Text>
          <Text style={styles.pageSubtitle}>Plan Your Journey</Text>
        </View>

        {/* Route Location Card */}
        <View style={styles.tripCard}>
          <Text style={styles.cardHeaderTitle}>Route Locations</Text>

          {/* Source Input */}
          <View style={styles.locationRow}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => {
                Alert.alert(
                  'Use Current Location',
                  'Use your current location as the source?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'YES',
                      onPress: async () => {
                        setIsFetchingLocation(true);
                        try {
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== 'granted') {
                            Alert.alert(
                              'Permission Denied',
                              'Location permission is required to use your current location as source.'
                            );
                            setIsFetchingLocation(false);
                            return;
                          }
                          const loc = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                          });
                          const { latitude, longitude } = loc.coords;
                          // Reverse geocode to get a human-readable address
                          const reverseResult = await Location.reverseGeocodeAsync({
                            latitude,
                            longitude,
                          });
                          let label = 'Current Location';
                          if (reverseResult && reverseResult.length > 0) {
                            const r = reverseResult[0];
                            const parts = [
                              r.name,
                              r.street,
                              r.district || r.subregion,
                              r.city,
                            ].filter(Boolean);
                            label = parts.slice(0, 2).join(', ') || 'Current Location';
                          }
                          setSource(label);
                          setSourceLocation({
                            latitude,
                            longitude,
                            name: label,
                          });
                        } catch (err) {
                          Alert.alert(
                            'Location Error',
                            'Unable to retrieve your current location. Please check your GPS settings.'
                          );
                        } finally {
                          setIsFetchingLocation(false);
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
              accessibilityLabel="Use current location as source"
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color="#10B981" style={{ width: 14, height: 14 }} />
              ) : (
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              )}
              <View style={styles.verticalConnector} />
            </TouchableOpacity>
            <View style={styles.inputFlex}>
              <Text style={styles.locationLabel}>Source</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter starting location"
                placeholderTextColor="#94A3B8"
                value={source}
                onChangeText={(text) => handleLocationQuery('source', text)}
                onFocus={() => setActiveSearchField('source')}
              />
            </View>
          </View>

          {/* Autocomplete suggestions for Source */}
          {activeSearchField === 'source' && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{item.name}</Text>
                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Intermediate Stops */}
          {intermediateStops.map((stop, index) => (
            <View key={`stop_${index}`}>
              <View style={styles.locationRow}>
                <View style={styles.iconContainer}>
                  <View style={[styles.dot, { backgroundColor: '#0284C7' }]} />
                  <View style={styles.verticalConnector} />
                </View>
                <View style={styles.inputFlex}>
                  <View style={styles.stopHeaderRow}>
                    <Text style={[styles.locationLabel, { color: '#0284C7' }]}>
                      Stop {index + 1}
                    </Text>
                    <View style={styles.stopBadge}>
                      <Text style={styles.stopBadgeText}>Intermediate</Text>
                    </View>
                  </View>
                  <View style={styles.stopInputWrapper}>
                    <TextInput
                      style={[styles.locationInput, styles.stopInput]}
                      placeholder={`Intermediate stop ${index + 1}`}
                      placeholderTextColor="#94A3B8"
                      value={stop}
                      onChangeText={(text) => handleLocationQuery('stop', text, index)}
                      onFocus={() => setActiveSearchField(`stop_${index}`)}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveStop(index)}
                      style={styles.removeStopBtn}
                      accessibilityLabel={`Remove stop ${index + 1}`}
                    >
                      <Ionicons name="close-circle" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Suggestions for intermediate stop */}
              {activeSearchField === `stop_${index}` && suggestions.length > 0 && (
                <View style={styles.suggestionsDropdown}>
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Ionicons name="location-outline" size={16} color="#0284C7" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionTitle}>{item.name}</Text>
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                          {item.displayName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Add Stop Button (Up to 3 stops) */}
          {intermediateStops.length < 3 && (
            <TouchableOpacity
              style={styles.addStopButton}
              onPress={handleAddStop}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={17} color="#059669" />
              <Text style={styles.addStopButtonText}>
                + Add Stop ({intermediateStops.length}/3)
              </Text>
            </TouchableOpacity>
          )}

          {/* Destination Input */}
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.inputFlex}>
              <Text style={styles.locationLabel}>Destination</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter destination location"
                placeholderTextColor="#94A3B8"
                value={destination}
                onChangeText={(text) => handleLocationQuery('destination', text)}
                onFocus={() => setActiveSearchField('destination')}
              />
            </View>
          </View>

          {/* Autocomplete suggestions for Destination */}
          {activeSearchField === 'destination' && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{item.name}</Text>
                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isSearching && (
            <View style={styles.searchingIndicatorRow}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.searchingText}>Searching locations...</Text>
            </View>
          )}
        </View>

        {/* Route Preference Section: 2x2 Grid */}
        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Route Preference</Text>
          <Text style={styles.sectionSub}>
            Choose optimization criteria for your EV corridor
          </Text>

          <View style={styles.gridContainer}>
            {PREFERENCE_OPTIONS.map((opt) => {
              const isSelected = selectedPreference === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.gridCard,
                    isSelected && styles.gridCardSelected,
                  ]}
                  onPress={() => handleSelectPreference(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.gridTopRow}>
                    <View
                      style={[
                        styles.gridIconWrap,
                        isSelected && styles.gridIconWrapSelected,
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={26}
                        color={isSelected ? '#059669' : '#475569'}
                      />
                    </View>
                    {isSelected && (
                      <View style={styles.gridCheckmark}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.gridTitle,
                      isSelected && styles.gridTitleSelected,
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={styles.gridDesc}>{opt.desc}</Text>

                  <View
                    style={[
                      styles.gridBadge,
                      isSelected && styles.gridBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gridBadgeText,
                        isSelected && styles.gridBadgeTextSelected,
                      ]}
                    >
                      {opt.badge}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* EV Sustainability Promotional Card */}
        <View style={styles.sustainabilityCard}>
          <Image
            source={require('../../assets/images/sustainability_card.png')}
            style={styles.sustainabilityImage}
            resizeMode="cover"
          />
          <View style={styles.sustainabilityOverlay}>
            <View style={styles.sustainabilityBadge}>
              <Ionicons name="leaf" size={12} color="#059669" />
              <Text style={styles.sustainabilityBadgeText}>EV Sustainability</Text>
            </View>
            <Text style={styles.sustainabilityTitle}>Drive Green,{`\n`}Save the Planet</Text>
            <Text style={styles.sustainabilitySub}>
              Every EV km saves ~120g CO₂ vs. petrol vehicles
            </Text>
          </View>
        </View>

        {/* Find Route Button (Green Accent Pill) */}
        <TouchableOpacity
          style={styles.findRouteButton}
          onPress={handleFindRoutes}
          activeOpacity={0.85}
        >
          <Text style={styles.findRouteButtonText}>Find Route</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Saved Places Modal */}
      <Modal
        visible={savedPlacesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSavedPlacesModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setSavedPlacesModalVisible(false);
            setEditingPlaceKey(null);
          }}
        >
          <View
            style={styles.savedPlacesSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.savedPlacesHeader}>
              <View>
                <Text style={styles.savedPlacesTitle}>Saved Places</Text>
                <Text style={styles.savedPlacesSub}>
                  Select to route immediately or edit destination
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSavedPlacesModalVisible(false);
                  setEditingPlaceKey(null);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {savedPlaces &&
                ['home', 'work', 'other'].map((key) => {
                  const place = savedPlaces[key];
                  if (!place) return null;
                  const isEditing = editingPlaceKey === key;

                  return (
                    <View key={key} style={styles.savedPlaceCard}>
                      <View style={styles.savedPlaceRow}>
                        <View style={styles.savedPlaceIconWrap}>
                          <Ionicons
                            name={
                              key === 'home'
                                ? 'home'
                                : key === 'work'
                                ? 'briefcase'
                                : 'star'
                            }
                            size={20}
                            color="#059669"
                          />
                        </View>

                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => handleChooseSavedPlace(place)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.savedPlaceLabel}>{place.label}</Text>
                          <Text style={styles.savedPlaceAddress} numberOfLines={2}>
                            {place.address || 'Tap edit to set address'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.editPlaceBtn}
                          onPress={() => {
                            if (isEditing) {
                              setEditingPlaceKey(null);
                            } else {
                              setEditingPlaceKey(key);
                              setEditPlaceAddress(place.address || '');
                              setEditPlaceCoords({
                                latitude: place.latitude,
                                longitude: place.longitude,
                              });
                            }
                          }}
                        >
                          <Ionicons
                            name={isEditing ? 'close' : 'pencil'}
                            size={16}
                            color="#059669"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Inline Edit Form for this Place */}
                      {isEditing && (
                        <View style={styles.editPlaceSection}>
                          <Text style={styles.editPlaceHeading}>Search & Set Location:</Text>
                          <TextInput
                            style={styles.editPlaceInput}
                            placeholder="Type address or landmark..."
                            placeholderTextColor="#94A3B8"
                            value={editPlaceAddress}
                            onChangeText={(text) => handleLocationQuery('editSavedPlace', text)}
                          />

                          {activeSearchField === 'editSavedPlace' && suggestions.length > 0 && (
                            <View style={styles.suggestionsDropdown}>
                              {suggestions.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={styles.suggestionItem}
                                  onPress={() => handleSelectSuggestion(item)}
                                >
                                  <Ionicons name="location-outline" size={16} color="#059669" />
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.suggestionTitle}>{item.name}</Text>
                                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                                      {item.displayName}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.savePlaceActionBtn}
                            onPress={() => handleSavePlaceEdit(key)}
                          >
                            <Text style={styles.savePlaceActionText}>Save Place</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Hamburger Drawer Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.drawerContainer,
              { paddingTop: Math.max(insets.top, 20) + 16 },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <View style={styles.drawerLogoWrap}>
                  <Ionicons name="flash" size={20} color="#10B981" />
                </View>
                <Text style={styles.drawerBrandText}>ELECTRIKE</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerItems}>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <View style={styles.drawerItemIcon}>
                  <Ionicons name="person-circle-outline" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerItemText}>Driver Profile & Garage</Text>
                  <Text style={styles.drawerItemSub}>Manage EV specs & vehicles</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Activity');
                }}
              >
                <View style={styles.drawerItemIcon}>
                  <Ionicons name="time-outline" size={24} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerItemText}>Trip Activity</Text>
                  <Text style={styles.drawerItemSub}>Past routes & CO₂ savings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('About');
                }}
              >
                <View style={styles.drawerItemIcon}>
                  <Ionicons name="information-circle-outline" size={24} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerItemText}>About Electrike</Text>
                  <Text style={styles.drawerItemSub}>Thermal tech & app details</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterVersion}>Electrike EV Navigator v1.0</Text>
              <Text style={styles.drawerFooterSub}>Hyderabad Metro Edition</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Vehicle Switcher Modal */}
      <Modal
        visible={vehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVehicleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setVehicleModalVisible(false)}
        >
          <View style={styles.vehicleSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Active Vehicle</Text>
              <Text style={styles.sheetSub}>Only 1 vehicle active at a time</Text>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {vehiclesList.map((v) => {
                const name = v.name || `${v.make} ${v.model}`;
                const isSelected = v.isActive || selectedVehicleName === name;
                return (
                  <TouchableOpacity
                    key={v.id || v.numberPlate}
                    style={[
                      styles.vehicleOption,
                      isSelected && styles.vehicleOptionSelected,
                    ]}
                    onPress={() => handleSelectVehicle(v)}
                  >
                    <View style={styles.vehicleOptionLeft}>
                      <View
                        style={[
                          styles.vehicleOptionIconWrap,
                          isSelected && { backgroundColor: '#ECFDF5' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            v.type === 'Scooty'
                              ? 'bicycle'
                              : v.type === 'Auto'
                              ? 'rickshaw'
                              : 'car-electric'
                          }
                          size={22}
                          color={isSelected ? '#059669' : '#64748B'}
                        />
                      </View>
                      <View style={styles.vehicleOptionInfo}>
                        <Text style={styles.vehicleOptionName}>{name}</Text>
                        <Text style={styles.vehicleOptionSub}>
                          {v.numberPlate} • {v.type} • {v.batteryCapacityKwh || 35} kWh
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.activePill}>
                        <Ionicons name="checkmark" size={14} color="#059669" />
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.manageVehiclesBtn}
              onPress={() => {
                setVehicleModalVisible(false);
                navigation.navigate('Profile');
              }}
            >
              <Ionicons name="settings-outline" size={18} color="#0F172A" />
              <Text style={styles.manageVehiclesBtnText}>Manage Garage in Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7', // Warm off-white
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFAF7',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBE6',
    zIndex: 10,
  },
  iconButton: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#F1F1EC',
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: '52%',
  },
  vehiclePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  iconContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
    paddingTop: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  verticalConnector: {
    width: 2,
    height: 38,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  inputFlex: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stopBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  stopBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  locationInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  stopInput: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  stopInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeStopBtn: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginLeft: 34,
    marginVertical: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addStopButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  suggestionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginHorizontal: 34,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  searchingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 34,
    marginTop: 4,
  },
  searchingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  preferenceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  gridCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  gridTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIconWrapSelected: {
    backgroundColor: '#D1FAE5',
  },
  gridCheckmark: {
    alignSelf: 'flex-start',
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  gridTitleSelected: {
    color: '#065F46',
  },
  gridDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 8,
  },
  gridBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  gridBadgeSelected: {
    backgroundColor: '#10B981',
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  gridBadgeTextSelected: {
    color: '#FFFFFF',
  },
  findRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669', // Brand green
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  findRouteButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  savedPlacesSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  savedPlacesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savedPlacesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  savedPlacesSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  savedPlaceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  savedPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedPlaceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedPlaceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  savedPlaceAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  editPlaceBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
  editPlaceSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  editPlaceHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  editPlaceInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  savePlaceActionBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  savePlaceActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 18,
  },
  drawerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBrandText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 4,
  },
  drawerItems: {
    gap: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerItemIcon: {
    marginRight: 10,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  drawerFooterVersion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerFooterSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  vehicleSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHeaderRow: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  vehicleOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  vehicleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  vehicleOptionInfo: {
    flex: 1,
  },
  vehicleOptionName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  manageVehiclesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 10,
  },
  manageVehiclesBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Sustainability Card
  sustainabilityCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  sustainabilityImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  sustainabilityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    padding: 18,
    justifyContent: 'flex-end',
  },
  sustainabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sustainabilityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  sustainabilityTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 22,
    marginBottom: 4,
  },
  sustainabilitySub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.1,
  },
});
