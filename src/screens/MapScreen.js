import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRecommendedRoutes,
  MOCK_CHARGING_STATIONS,
  MOCK_CURRENT_LOCATION,
  MOCK_DESTINATION,
  ROUTE_PREFERENCES,
} from '../data/mockData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Safely import react-native-maps for native platforms
let MapView, Marker, Polyline, Callout;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  Callout = Maps.Callout;
} catch (e) {
  // Graceful fallback for non-native / unsupported bundler contexts
  MapView = null;
}

const GPS_STATES = {
  ACTIVE: 'GPS Active',
  UNAVAILABLE: 'GPS Unavailable',
  DEAD_RECKONING: 'Dead Reckoning Active',
  ESTIMATING: 'Estimating current position',
};

export default function MapScreen({ route, navigation }) {
  const {
    source = 'Electronic City, Bengaluru',
    destination = 'Mysuru Palace, Mysuru',
    stops = [],
    preference = ROUTE_PREFERENCES.SAVED_PLACES,
    vehicle = 'Tata Nexon EV Max',
    batteryPercentage = 84,
  } = route?.params || {};

  // Recommended & Alternative Routes
  const [routeData, setRouteData] = useState(() => getRecommendedRoutes(preference));
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // Charging Stations state with reviews
  const [stations, setStations] = useState(MOCK_CHARGING_STATIONS);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationModalVisible, setStationModalVisible] = useState(false);

  // Review Form state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');

  // Roadside Assistance / HELP state
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // GPS Telemetry State
  const [gpsState, setGpsState] = useState(GPS_STATES.ACTIVE);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);

  useEffect(() => {
    const data = getRecommendedRoutes(preference);
    setRouteData(data);
    setSelectedRouteId(data.recommended.id);
  }, [preference]);

  const activeRoute =
    routeData.all.find((r) => r.id === selectedRouteId) || routeData.recommended;

  // Format minutes to hours & mins
  const formatEta = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  // Open station details
  const handleOpenStation = (st) => {
    setSelectedStation(st);
    setShowAddReview(false);
    setNewReviewText('');
    setNewRating(5);
    setStationModalVisible(true);
  };

  // Submit review
  const handleAddReview = () => {
    if (!newReviewText.trim()) {
      Alert.alert('Required', 'Please enter your review feedback.');
      return;
    }

    const reviewObj = {
      id: `rev_${Date.now()}`,
      author: 'You (Driver)',
      rating: newRating,
      comment: newReviewText.trim(),
      date: 'Just now',
    };

    const updatedStations = stations.map((st) => {
      if (st.id === selectedStation.id) {
        const newReviews = [reviewObj, ...st.reviews];
        const avg = (
          newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length
        ).toFixed(1);
        return {
          ...st,
          reviews: newReviews,
          rating: parseFloat(avg),
          reviewCount: st.reviewCount + 1,
        };
      }
      return st;
    });

    setStations(updatedStations);
    setSelectedStation(updatedStations.find((s) => s.id === selectedStation.id));
    setShowAddReview(false);
    setNewReviewText('');
    Alert.alert('Thank you!', 'Your community charging review has been posted.');
  };

  // Handle Roadside Assistance Dispatch
  const handleDispatchHelp = () => {
    setHelpModalVisible(false);
    Alert.alert(
      'Emergency Dispatched',
      `Roadside assistance request sent to nearest tow truck.\nCoordinates: ${MOCK_CURRENT_LOCATION.coordinatesDisplay}\nVehicle: ${vehicle}\nEstimated Tow ETA: 14 mins.`,
      [{ text: 'OK' }]
    );
  };

  // Get status color and icon for GPS state
  const getGpsStatusMeta = () => {
    switch (gpsState) {
      case GPS_STATES.ACTIVE:
        return { color: '#10B981', bg: '#ECFDF5', icon: 'navigate-circle' };
      case GPS_STATES.UNAVAILABLE:
        return { color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle' };
      case GPS_STATES.DEAD_RECKONING:
        return { color: '#F59E0B', bg: '#FFFBEB', icon: 'compass' };
      case GPS_STATES.ESTIMATING:
        return { color: '#3B82F6', bg: '#EFF6FF', icon: 'sync' };
      default:
        return { color: '#10B981', bg: '#ECFDF5', icon: 'navigate-circle' };
    }
  };

  const gpsMeta = getGpsStatusMeta();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Floating Bar */}
      <View style={styles.topFloatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        {/* GPS State Badge (Clickable to inspect/toggle telemetry states) */}
        <TouchableOpacity
          style={[styles.gpsBadge, { backgroundColor: gpsMeta.bg, borderColor: gpsMeta.color }]}
          onPress={() => setGpsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name={gpsMeta.icon} size={15} color={gpsMeta.color} />
          <Text style={[styles.gpsBadgeText, { color: gpsMeta.color }]}>{gpsState}</Text>
          <Ionicons name="chevron-down" size={12} color={gpsMeta.color} />
        </TouchableOpacity>

        {/* HELP Button */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="medkit" size={16} color="#FFFFFF" />
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      {/* Map Content View */}
      <View style={styles.mapContainer}>
        {MapView && Platform.OS !== 'web' ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 12.5800,
              longitude: 77.1600,
              latitudeDelta: 1.2,
              longitudeDelta: 1.2,
            }}
          >
            {/* Source Marker */}
            <Marker
              coordinate={MOCK_CURRENT_LOCATION}
              title="Source (Start)"
              description={source}
              pinColor="green"
            />

            {/* Destination Marker */}
            <Marker
              coordinate={MOCK_DESTINATION}
              title="Destination"
              description={destination}
              pinColor="red"
            />

            {/* Charging Station Markers */}
            {stations.map((st) => (
              <Marker
                key={st.id}
                coordinate={st.coordinate}
                title={st.name}
                description={`${st.chargingPower} • ${st.estimatedPrice}`}
                onCalloutPress={() => handleOpenStation(st)}
              >
                <View style={styles.stationMapPin}>
                  <Ionicons name="flash" size={14} color="#0F172A" />
                </View>
              </Marker>
            ))}

            {/* Render 3 Polylines (Recommended visually stronger) */}
            {routeData.all.map((r) => {
              const isSelected = r.id === activeRoute.id;
              const isRecommended = r.id === routeData.recommended.id;
              return (
                <Polyline
                  key={r.id}
                  coordinates={r.coordinates}
                  strokeColor={
                    isSelected
                      ? '#10B981'
                      : isRecommended
                      ? '#6EE7B7'
                      : '#94A3B8'
                  }
                  strokeWidth={isSelected ? 6 : isRecommended ? 4 : 3}
                  lineDashPattern={isSelected ? undefined : [4, 4]}
                />
              );
            })}
          </MapView>
        ) : (
          /* Web / Vector Visual Map Representation */
          <View style={styles.webMapFallback}>
            <View style={styles.gridOverlay} />

            {/* Header Map Route Path Banner */}
            <View style={styles.routeCorridorVisual}>
              <View style={styles.corridorHeader}>
                <Ionicons name="map-outline" size={18} color="#059669" />
                <Text style={styles.corridorTitle}>Corridor View: {source} → {destination}</Text>
              </View>

              {/* Waypoints Flow */}
              <View style={styles.waypointFlow}>
                <View style={styles.waypointStep}>
                  <View style={[styles.stepDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.stepLabel} numberOfLines={1}>
                    {source.split(',')[0]}
                  </Text>
                  <Text style={styles.stepSub}>Start (84%)</Text>
                </View>

                {stops.map((s, idx) => (
                  <View key={`wp_${idx}`} style={styles.waypointStep}>
                    <View style={[styles.stepDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.stepLabel} numberOfLines={1}>{s}</Text>
                    <Text style={styles.stepSub}>Stop {idx + 1}</Text>
                  </View>
                ))}

                <View style={styles.waypointStep}>
                  <View style={[styles.stepDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.stepLabel} numberOfLines={1}>Fast Charger</Text>
                  <Text style={styles.stepSub}>Ramanagara</Text>
                </View>

                <View style={styles.waypointStep}>
                  <View style={[styles.stepDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.stepLabel} numberOfLines={1}>
                    {destination.split(',')[0]}
                  </Text>
                  <Text style={styles.stepSub}>Dest ({activeRoute.arrivalBattery}%)</Text>
                </View>
              </View>

              {/* Live Charging Stations quick selector */}
              <Text style={styles.stationsQuickTitle}>Charging Stations on Route:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationChipsRow}>
                {stations.map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={styles.stationChip}
                    onPress={() => handleOpenStation(st)}
                  >
                    <Ionicons name="flash" size={14} color="#10B981" />
                    <View>
                      <Text style={styles.stationChipName} numberOfLines={1}>{st.name.split('-')[0]}</Text>
                      <Text style={styles.stationChipPower}>{st.chargingPower} • ★ {st.rating}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Sheet: Route Cards & Metrics */}
      <View style={styles.bottomCardSheet}>
        {/* Route Selector Tabs (1 Recommended, 2 Alternatives) */}
        <View style={styles.routeTabsHeader}>
          <Text style={styles.routeTabsTitle}>Select Calculated Route (3 options)</Text>
          <Text style={styles.prefModePill}>{preference}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeCardsRow}>
          {routeData.all.map((routeItem) => {
            const isSelected = routeItem.id === activeRoute.id;
            const isRecommended = routeItem.id === routeData.recommended.id;

            return (
              <TouchableOpacity
                key={routeItem.id}
                style={[
                  styles.routeCard,
                  isSelected && styles.routeCardActive,
                  isRecommended && styles.routeCardRecommended,
                ]}
                onPress={() => setSelectedRouteId(routeItem.id)}
                activeOpacity={0.85}
              >
                {/* Badge */}
                <View style={styles.cardBadgeRow}>
                  {isRecommended ? (
                    <View style={styles.recommendedBadge}>
                      <Ionicons name="star" size={11} color="#0F172A" />
                      <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                    </View>
                  ) : (
                    <View style={styles.altBadge}>
                      <Text style={styles.altBadgeText}>ALTERNATIVE</Text>
                    </View>
                  )}
                  <Text style={styles.coolScoreBadge}>Cool {routeItem.coolScore}/100</Text>
                </View>

                {/* Route Name */}
                <Text style={styles.routeNameText}>{routeItem.name}</Text>
                <Text style={styles.routeSubText} numberOfLines={1}>{routeItem.subtitle}</Text>

                {/* Key Metrics */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{formatEta(routeItem.etaMinutes)}</Text>
                    <Text style={styles.metricKey}>ETA</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{routeItem.distanceKm} km</Text>
                    <Text style={styles.metricKey}>Distance</Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricVal, { color: '#10B981' }]}>
                      {routeItem.arrivalBattery}%
                    </Text>
                    <Text style={styles.metricKey}>Dest. Batt</Text>
                  </View>
                </View>

                {/* Tariff & Stops Preview */}
                <View style={styles.cardFooterMetrics}>
                  <Text style={styles.footerMetricText}>
                    ⚡ ₹{routeItem.chargingCost} charging • {routeItem.chargingStops} stop(s)
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Charging Station Modal / Bottom Sheet */}
      <Modal
        visible={stationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStationModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.stationModalContent}>
            <View style={styles.sheetHandle} />

            {selectedStation && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.75 }}>
                {/* Station Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationModalTitle}>{selectedStation.name}</Text>
                    <Text style={styles.stationModalAddress}>{selectedStation.address}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStationModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Specs Grid */}
                <View style={styles.stationSpecsRow}>
                  <View style={styles.specBox}>
                    <Ionicons name="flash-outline" size={18} color="#10B981" />
                    <Text style={styles.specVal}>{selectedStation.chargingPower}</Text>
                    <Text style={styles.specLabel}>Power Output</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Ionicons name="pricetag-outline" size={18} color="#059669" />
                    <Text style={styles.specVal}>{selectedStation.estimatedPrice}</Text>
                    <Text style={styles.specLabel}>Charging Tariff</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#3B82F6" />
                    <Text style={styles.specVal}>{selectedStation.availability}</Text>
                    <Text style={styles.specLabel}>Realtime Status</Text>
                  </View>
                </View>

                {/* Rating Overview */}
                <View style={styles.ratingOverviewRow}>
                  <View style={styles.ratingStarsBig}>
                    <Ionicons name="star" size={24} color="#F59E0B" />
                    <Text style={styles.ratingNumberBig}>{selectedStation.rating}</Text>
                  </View>
                  <Text style={styles.ratingCountText}>
                    Based on {selectedStation.reviewCount} community driver ratings
                  </Text>
                </View>

                {/* Reviews List */}
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsSectionHeader}>
                    <Text style={styles.reviewsSectionTitle}>Driver Reviews</Text>
                    <TouchableOpacity
                      style={styles.addReviewToggleBtn}
                      onPress={() => setShowAddReview(!showAddReview)}
                    >
                      <Ionicons
                        name={showAddReview ? 'close' : 'add-circle-outline'}
                        size={16}
                        color="#059669"
                      />
                      <Text style={styles.addReviewToggleText}>
                        {showAddReview ? 'Cancel' : '+ Add Review'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Add Review Form */}
                  {showAddReview && (
                    <View style={styles.addReviewCard}>
                      <Text style={styles.addReviewLabel}>Rate your charging experience:</Text>
                      {/* Star selector */}
                      <View style={styles.starRatingSelector}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setNewRating(star)}
                            style={{ padding: 4 }}
                          >
                            <Ionicons
                              name={star <= newRating ? 'star' : 'star-outline'}
                              size={28}
                              color="#F59E0B"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TextInput
                        style={styles.reviewTextInput}
                        placeholder="Share speed, cleanliness, amenities, or queue time..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                        value={newReviewText}
                        onChangeText={setNewReviewText}
                      />

                      <TouchableOpacity
                        style={styles.submitReviewBtn}
                        onPress={handleAddReview}
                      >
                        <Text style={styles.submitReviewBtnText}>Submit Review</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Existing Reviews */}
                  {selectedStation.reviews.map((rev) => (
                    <View key={rev.id} style={styles.reviewItemCard}>
                      <View style={styles.reviewItemHeader}>
                        <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        <View style={styles.reviewStarsRow}>
                          {[...Array(rev.rating)].map((_, i) => (
                            <Ionicons key={i} name="star" size={12} color="#F59E0B" />
                          ))}
                          <Text style={styles.reviewDate}>{rev.date}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{rev.comment}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Roadside Assistance / HELP Modal */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.helpModalBackdrop}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeaderBadge}>
              <Ionicons name="warning" size={32} color="#EF4444" />
            </View>

            <Text style={styles.helpTitle}>Roadside Assistance</Text>
            <Text style={styles.helpSubtitle}>Emergency EV Rescue & Towing Service</Text>

            {/* Diagnostic Information */}
            <View style={styles.helpTelemetryBox}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Coordinates:</Text>
                <Text style={styles.telemetryVal}>{MOCK_CURRENT_LOCATION.coordinatesDisplay}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Selected Vehicle:</Text>
                <Text style={styles.telemetryVal}>{vehicle}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Battery Level:</Text>
                <Text style={[styles.telemetryVal, { color: '#EF4444', fontWeight: '800' }]}>
                  {batteryPercentage}%
                </Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Position Mode:</Text>
                <Text style={styles.telemetryVal}>{gpsState}</Text>
              </View>
            </View>

            <Text style={styles.helpConfirmText}>
              Do you want to send your exact GPS coordinates and vehicle telemetry to the nearest tow truck and mobile EV charging service?
            </Text>

            <View style={styles.helpActionButtons}>
              <TouchableOpacity
                style={styles.helpCancelBtn}
                onPress={() => setHelpModalVisible(false)}
              >
                <Text style={styles.helpCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpYesBtn}
                onPress={handleDispatchHelp}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.helpYesBtnText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GPS Telemetry State Selector Modal */}
      <Modal
        visible={gpsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGpsModalVisible(false)}
        >
          <View style={styles.gpsStateModal}>
            <Text style={styles.gpsModalTitle}>Positioning Telemetry Status</Text>
            <Text style={styles.gpsModalDesc}>
              Select or test positioning signal scenarios:
            </Text>

            {Object.values(GPS_STATES).map((stateItem) => {
              const isSelected = gpsState === stateItem;
              return (
                <TouchableOpacity
                  key={stateItem}
                  style={[
                    styles.gpsStateOption,
                    isSelected && styles.gpsStateOptionSelected,
                  ]}
                  onPress={() => {
                    setGpsState(stateItem);
                    setGpsModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.gpsStateOptionText,
                      isSelected && styles.gpsStateOptionTextSelected,
                    ]}
                  >
                    {stateItem}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topFloatHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  stationMapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFF00',
    borderWidth: 2,
    borderColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 85,
    paddingHorizontal: 16,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: '#1E293B',
  },
  routeCorridorVisual: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  corridorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  corridorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  waypointFlow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  waypointStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  stepSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  stationsQuickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stationChipsRow: {
    flexDirection: 'row',
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stationChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stationChipPower: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  bottomCardSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  routeTabsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  routeTabsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefModePill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  routeCardsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  routeCard: {
    width: SCREEN_WIDTH * 0.76,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  routeCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  routeCardRecommended: {
    borderWidth: 2,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFF00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  altBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  altBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  coolScoreBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  routeNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  routeSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricKey: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  cardFooterMetrics: {
    alignItems: 'center',
  },
  footerMetricText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  stationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stationModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  stationModalAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stationSpecsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  ratingStarsBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumberBig: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
  },
  ratingCountText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addReviewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addReviewToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  addReviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  addReviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  starRatingSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  reviewTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  helpModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  helpCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  helpHeaderBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  helpTelemetryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 6,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpConfirmText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  helpActionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  helpCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  helpYesBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpYesBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsStateModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  gpsModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsModalDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  gpsStateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  gpsStateOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  gpsStateOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  gpsStateOptionTextSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
});
