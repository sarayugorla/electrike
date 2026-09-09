import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ROUTE_PREFERENCES } from '../data/mockData';
import { getProfile, getVehicles, setActiveVehicle } from '../storage/storage';
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

  // Trip Inputs
  const [source, setSource] = useState('Electronic City, Bengaluru');
  const [destination, setDestination] = useState('Mysuru Palace, Mysuru');
  const [intermediateStops, setIntermediateStops] = useState([]);

  // Route Preference (Default: Saved Places)
  const [selectedPreference, setSelectedPreference] = useState(ROUTE_PREFERENCES.SAVED_PLACES);

  // Reload vehicles and profile whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
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
        // Find explicitly active vehicle
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

  // Add intermediate stop (Max 3)
  const handleAddStop = () => {
    if (intermediateStops.length >= 3) {
      Alert.alert('Limit Reached', 'You can add a maximum of 3 intermediate stops.');
      return;
    }
    setIntermediateStops([...intermediateStops, '']);
  };

  // Update intermediate stop
  const handleUpdateStop = (text, index) => {
    const updated = [...intermediateStops];
    updated[index] = text;
    setIntermediateStops(updated);
  };

  // Remove intermediate stop
  const handleRemoveStop = (index) => {
    const updated = intermediateStops.filter((_, i) => i !== index);
    setIntermediateStops(updated);
  };

  // Switch Active Vehicle from dropdown modal
  const handleSelectVehicle = async (vehicle) => {
    const vName = vehicle.name || `${vehicle.make} ${vehicle.model}`;
    setSelectedVehicleName(vName);
    setActiveVehicleState(vehicle);
    await setActiveVehicle(vehicle.id);
    setVehicleModalVisible(false);
    await loadUserData();
  };

  // Find Routes
  const handleFindRoutes = () => {
    if (!source.trim()) {
      Alert.alert('Required Field', 'Please enter a starting point.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Required Field', 'Please enter a destination.');
      return;
    }

    const filteredStops = intermediateStops.filter((s) => s.trim().length > 0);

    navigation.navigate('Map', {
      source: source.trim(),
      destination: destination.trim(),
      stops: filteredStops,
      preference: selectedPreference,
      vehicle: selectedVehicleName,
      batteryPercentage,
    });
  };

  // Preference Definitions with Descriptions & Icons
  const PREFERENCE_OPTIONS = [
    {
      id: ROUTE_PREFERENCES.SAVED_PLACES,
      title: 'Saved Places',
      desc: 'Frequent & trusted corridors with verified charging',
      icon: 'bookmark-outline',
      badge: 'Fast & Direct',
    },
    {
      id: ROUTE_PREFERENCES.COST_PATH,
      title: 'Cost Path',
      desc: 'Optimized for lowest total charging tariffs',
      icon: 'wallet-outline',
      badge: 'Lowest Tariff',
    },
    {
      id: ROUTE_PREFERENCES.TIME_PATH,
      title: 'Time Path',
      desc: 'Fastest ETA with high-speed DC highway corridors',
      icon: 'time-outline',
      badge: 'Fastest ETA',
    },
    {
      id: ROUTE_PREFERENCES.COOLEST_PATH,
      title: 'Coolest Path',
      desc: 'High canopy shade, lower ambient heat & battery stress',
      icon: 'leaf-outline',
      badge: 'Eco & Thermal',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top App Bar with safe-area handling:
          LEFT: Hamburger menu
          CENTER / NEAR LEFT: Active vehicle dropdown pill
          RIGHT: Editable battery indicator
      */}
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

        {/* Active Vehicle Selector Pill (Restyled in cool blue/green, no neon yellow) */}
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

        {/* Editable Battery Indicator */}
        <BatteryIndicator />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Plan Your EV Journey</Text>
          <Text style={styles.pageSubtitle}>
            Thermal-aware routing, canopy shade & tariff optimization
          </Text>
        </View>

        {/* Trip Locations Card */}
        <View style={styles.tripCard}>
          <Text style={styles.cardHeaderTitle}>Route Locations</Text>

          {/* Source */}
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <View style={styles.verticalConnector} />
            </View>
            <View style={styles.inputFlex}>
              <Text style={styles.locationLabel}>Source</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter starting location"
                placeholderTextColor="#94A3B8"
                value={source}
                onChangeText={setSource}
              />
            </View>
          </View>

          {/* Intermediate Stops (Clean blue/green palette, NO orange) */}
          {intermediateStops.map((stop, index) => (
            <View key={`stop_${index}`} style={styles.locationRow}>
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
                    placeholder={`Intermediate stop ${index + 1} (e.g. charging/rest)`}
                    placeholderTextColor="#94A3B8"
                    value={stop}
                    onChangeText={(text) => handleUpdateStop(text, index)}
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

          {/* Destination */}
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
                onChangeText={setDestination}
              />
            </View>
          </View>
        </View>

        {/* Route Preference Section */}
        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Route Preference</Text>
          <Text style={styles.sectionSub}>
            Select optimization criteria for your single navigation corridor
          </Text>

          <View style={styles.preferenceGrid}>
            {PREFERENCE_OPTIONS.map((opt) => {
              const isSelected = selectedPreference === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.preferenceCard,
                    isSelected && styles.preferenceCardSelected,
                  ]}
                  onPress={() => setSelectedPreference(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.prefTopRow}>
                    <View
                      style={[
                        styles.prefIconWrap,
                        isSelected && styles.prefIconWrapSelected,
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={isSelected ? '#059669' : '#475569'}
                      />
                    </View>
                    <View
                      style={[
                        styles.prefBadge,
                        isSelected && styles.prefBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.prefBadgeText,
                          isSelected && styles.prefBadgeTextSelected,
                        ]}
                      >
                        {opt.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.prefTitle,
                      isSelected && styles.prefTitleSelected,
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={styles.prefDesc}>{opt.desc}</Text>

                  {isSelected && (
                    <View style={styles.activeCheckmark}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Find Routes Button */}
        <TouchableOpacity
          style={styles.findRoutesButton}
          onPress={handleFindRoutes}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.findRoutesButtonText}>Find Routes</Text>
        </TouchableOpacity>
      </ScrollView>

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
              {/* Profile */}
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

              {/* Activity */}
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

              {/* About */}
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
              <Text style={styles.drawerFooterSub}>Intelligent Thermal-Aware Routing</Text>
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
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  iconButton: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
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
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
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
    marginBottom: 12,
  },
  preferenceGrid: {
    gap: 10,
  },
  preferenceCard: {
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
    position: 'relative',
  },
  preferenceCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  prefTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prefIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefIconWrapSelected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  prefBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  prefBadgeSelected: {
    backgroundColor: '#10B981',
  },
  prefBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  prefBadgeTextSelected: {
    color: '#FFFFFF',
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  prefTitleSelected: {
    color: '#065F46',
  },
  prefDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  activeCheckmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  findRoutesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  findRoutesButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
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
});
