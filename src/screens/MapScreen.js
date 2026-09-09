import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getSingleRoute,
  MOCK_CHARGING_STATIONS,
  MOCK_CURRENT_LOCATION,
  MOCK_DESTINATION,
  ROUTE_PREFERENCES,
} from '../data/mockData';
import { getStationReviews, saveStationReview } from '../storage/storage';
import OpenStreetMap from '../components/OpenStreetMap';
import BatteryIndicator from '../components/BatteryIndicator';
import { useBattery } from '../context/BatteryContext';

const GPS_STATES = {
  ACTIVE: 'GPS Active',
  UNAVAILABLE: 'GPS Unavailable',
  DEAD_RECKONING: 'Dead Reckoning Active',
  ESTIMATING: 'Estimating Position',
};

export default function MapScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { batteryPercentage: currentBattery } = useBattery();

  const {
    source = 'Electronic City, Bengaluru',
    destination = 'Mysuru Palace, Mysuru',
    stops = [],
    preference = ROUTE_PREFERENCES.SAVED_PLACES,
    vehicle = 'Tata Nexon EV Max',
  } = route?.params || {};

  // Strictly ONLY ONE route for the selected mode
  const singleRoute = useMemo(() => getSingleRoute(preference), [preference]);

  // Charging Stations state with reviews
  const [stations, setStations] = useState(MOCK_CHARGING_STATIONS);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationModalVisible, setStationModalVisible] = useState(false);

  // Review Form state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Roadside Assistance / HELP state (Positioned at BOTTOM-LEFT)
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // GPS Telemetry State
  const [gpsState, setGpsState] = useState(GPS_STATES.ACTIVE);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);

  // Turn-by-Turn Instruction State (allows cycling or showing current step)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Load custom persisted reviews on mount
  useEffect(() => {
    loadPersistedReviews();
  }, []);

  const loadPersistedReviews = async () => {
    try {
      const updated = await Promise.all(
        MOCK_CHARGING_STATIONS.map(async (st) => {
          const userReviews = await getStationReviews(st.id);
          if (userReviews && userReviews.length > 0) {
            const combined = [...userReviews, ...st.reviews];
            const avg = (
              combined.reduce((sum, r) => sum + r.rating, 0) / combined.length
            ).toFixed(1);
            return {
              ...st,
              reviews: combined,
              rating: parseFloat(avg),
              reviewCount: combined.length,
            };
          }
          return st;
        })
      );
      setStations(updated);
    } catch (e) {
      console.error('Error loading persisted reviews:', e);
    }
  };

  // Format minutes to hours & mins
  const formatEta = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  // Open station details modal
  const handleOpenStation = (st) => {
    setSelectedStation(st);
    setShowAddReview(false);
    setNewReviewText('');
    setNewRating(5);
    setStationModalVisible(true);
  };

  // Submit review for selected station
  const handleAddReview = async () => {
    if (!newReviewText.trim()) {
      Alert.alert('Required', 'Please enter your review comments.');
      return;
    }

    setIsSubmittingReview(true);
    const reviewObj = {
      id: `rev_${Date.now()}`,
      author: 'You (EV Driver)',
      rating: newRating,
      comment: newReviewText.trim(),
      date: 'Just now',
    };

    // Persist to AsyncStorage
    await saveStationReview(selectedStation.id, reviewObj);

    // Update local state immediately
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
          reviewCount: newReviews.length,
        };
      }
      return st;
    });

    setStations(updatedStations);
    setSelectedStation(updatedStations.find((s) => s.id === selectedStation.id));
    setShowAddReview(false);
    setNewReviewText('');
    setIsSubmittingReview(false);
    Alert.alert('Review Added', 'Your review has been added to this charging station!');
  };

  // Roadside Assistance Dispatch
  const handleDispatchHelp = () => {
    setHelpModalVisible(false);
    Alert.alert(
      'Emergency Dispatched',
      `Roadside mobile fast-charging unit dispatched.\nCoordinates: ${MOCK_CURRENT_LOCATION.coordinatesDisplay}\nVehicle: ${vehicle}\nCurrent Battery: ${currentBattery}%\nStatus: ${gpsState}\nEstimated Tow/Charge ETA: 12 mins.`,
      [{ text: 'OK' }]
    );
  };

  // Turn-by-Turn Instruction Data
  const turnInstructions = singleRoute.turnInstructions || [
    { instruction: 'Continue on Corridor Route', distance: '1.2 km', icon: 'arrow-up' },
  ];
  const activeTurn = turnInstructions[currentTurnIndex] || turnInstructions[0];

  const handleNextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % turnInstructions.length);
  };

  // GPS Meta info
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
    <View style={styles.container}>
      {/* 1. OpenStreetMap Component (Covers full background) */}
      <OpenStreetMap
        source={{ name: source, latitude: 12.8452, longitude: 77.6602 }}
        destination={{ name: destination, latitude: 12.3052, longitude: 76.6552 }}
        currentLocation={MOCK_CURRENT_LOCATION}
        routeCoordinates={singleRoute.coordinates}
        stations={stations}
        onStationPress={handleOpenStation}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 2. Top Header HUD with Safe-Area Inset:
          LEFT: Back button
          CENTER: GPS state chip
          RIGHT: Editable Battery Indicator
      */}
      <View
        style={[
          styles.topHud,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityLabel="Go back to Route Planning"
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* GPS State Badge (Clickable to switch telemetry) */}
        <TouchableOpacity
          style={[styles.gpsBadge, { backgroundColor: gpsMeta.bg, borderColor: gpsMeta.color }]}
          onPress={() => setGpsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name={gpsMeta.icon} size={15} color={gpsMeta.color} />
          <Text style={[styles.gpsBadgeText, { color: gpsMeta.color }]}>{gpsState}</Text>
          <Ionicons name="chevron-down" size={12} color={gpsMeta.color} />
        </TouchableOpacity>

        {/* Editable Battery Indicator */}
        <BatteryIndicator />
      </View>

      {/* 3. Turn-by-Turn Direction Banner at TOP (Below Header HUD) */}
      <View style={styles.turnBannerWrapper}>
        <TouchableOpacity
          style={styles.turnBanner}
          onPress={handleNextTurn}
          activeOpacity={0.9}
        >
          <View style={styles.turnIconWrap}>
            <Ionicons
              name={
                activeTurn.icon === 'speedometer'
                  ? 'speedometer'
                  : activeTurn.icon === 'git-merge'
                  ? 'git-merge'
                  : activeTurn.icon === 'flash'
                  ? 'flash'
                  : activeTurn.icon === 'flag'
                  ? 'flag'
                  : activeTurn.icon === 'arrow-back'
                  ? 'arrow-back'
                  : activeTurn.icon === 'arrow-forward'
                  ? 'arrow-forward'
                  : 'arrow-up'
              }
              size={24}
              color="#10B981"
            />
          </View>
          <View style={styles.turnTextContainer}>
            <View style={styles.turnDistanceRow}>
              <Text style={styles.turnDistance}>{activeTurn.distance}</Text>
              <Text style={styles.turnStepHint}>
                Step {currentTurnIndex + 1}/{turnInstructions.length} • Tap for next
              </Text>
            </View>
            <Text style={styles.turnInstruction} numberOfLines={2}>
              {activeTurn.instruction}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 4. Quick Charging Station Bar on Map (Horizontal preview) */}
      <View style={styles.quickStationsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickStationsContent}
        >
          {stations.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.quickStationPill}
              onPress={() => handleOpenStation(st)}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={13} color="#10B981" />
              <Text style={styles.quickStationName} numberOfLines={1}>
                {st.name.split('-')[0].trim()}
              </Text>
              <Text style={styles.quickStationRating}>★ {st.rating}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. HELP Button (Relocated to BOTTOM-LEFT, above bottom sheet) */}
      <View
        style={[
          styles.bottomControlsRow,
          {
            bottom: 140 + Math.max(insets.bottom, 10),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
          activeOpacity={0.85}
          accessibilityLabel="Emergency Roadside Assistance"
        >
          <View style={styles.helpIconCircle}>
            <Ionicons name="medkit" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.helpButtonText}>HELP</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Map Bottom Information Sheet:
          Shows SINGLE active route metrics only.
          Alternate route cards are REMOVED.
      */}
      <View
        style={[
          styles.bottomInfoSheet,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 10,
          },
        ]}
      >
        <View style={styles.sheetHandle} />

        {/* Route Header Row */}
        <View style={styles.routeHeaderRow}>
          <View style={styles.routeHeaderLeft}>
            <View style={styles.routePillMode}>
              <Ionicons name="compass-outline" size={14} color="#059669" />
              <Text style={styles.routePillModeText}>{preference}</Text>
            </View>
            <Text style={styles.singleRouteName}>{singleRoute.name}</Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaText}>{formatEta(singleRoute.etaMinutes)}</Text>
            <Text style={styles.etaLabel}>{singleRoute.distanceKm} km</Text>
          </View>
        </View>

        {/* Route Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="battery-charging" size={16} color="#10B981" />
            <Text style={styles.metricVal}>{singleRoute.arrivalBattery}%</Text>
            <Text style={styles.metricLabel}>Dest. Battery</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="flash-outline" size={16} color="#0284C7" />
            <Text style={styles.metricVal}>{singleRoute.chargingStops}</Text>
            <Text style={styles.metricLabel}>EV Stops</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="leaf-outline" size={16} color="#059669" />
            <Text style={styles.metricVal}>{singleRoute.coolScore}/100</Text>
            <Text style={styles.metricLabel}>Cool Score</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="wallet-outline" size={16} color="#0F172A" />
            <Text style={styles.metricVal}>₹{singleRoute.chargingCost}</Text>
            <Text style={styles.metricLabel}>Est. Tariff</Text>
          </View>
        </View>
      </View>

      {/* 7. Charging Station Details & Reviews Modal */}
      <Modal
        visible={stationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStationModalVisible(false)}
      >
        <View style={styles.stationModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setStationModalVisible(false)}
          />
          <View style={styles.stationModalContent}>
            <View style={styles.sheetHandle} />

            {selectedStation && (
              <>
                <View style={styles.stationHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationTitle}>{selectedStation.name}</Text>
                    <Text style={styles.stationAddress}>{selectedStation.address}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setStationModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Badges Row */}
                <View style={styles.stationBadgesRow}>
                  <View style={styles.stationBadgeGreen}>
                    <Ionicons name="flash" size={13} color="#059669" />
                    <Text style={styles.stationBadgeGreenText}>
                      {selectedStation.chargingPower}
                    </Text>
                  </View>
                  <View style={styles.stationBadgeBlue}>
                    <Ionicons name="checkmark-circle" size={13} color="#0284C7" />
                    <Text style={styles.stationBadgeBlueText}>
                      {selectedStation.availability}
                    </Text>
                  </View>
                  <View style={styles.stationBadgeYellow}>
                    <Ionicons name="star" size={13} color="#D97706" />
                    <Text style={styles.stationBadgeYellowText}>
                      ★ {selectedStation.rating} ({selectedStation.reviews.length})
                    </Text>
                  </View>
                </View>

                {/* Price & Connector */}
                <View style={styles.stationInfoBox}>
                  <View>
                    <Text style={styles.infoLabel}>Tariff Rate</Text>
                    <Text style={styles.infoVal}>{selectedStation.estimatedPrice}</Text>
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Connector Types</Text>
                    <Text style={styles.infoVal}>{selectedStation.connectorType}</Text>
                  </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsHeaderRow}>
                  <Text style={styles.reviewsTitle}>
                    Community Reviews ({selectedStation.reviews.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addReviewBtn}
                    onPress={() => setShowAddReview(!showAddReview)}
                  >
                    <Ionicons
                      name={showAddReview ? 'close' : 'add-circle-outline'}
                      size={16}
                      color="#059669"
                    />
                    <Text style={styles.addReviewBtnText}>
                      {showAddReview ? 'Cancel' : '+ Add Review'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Add Review Inline Form */}
                {showAddReview && (
                  <View style={styles.addReviewCard}>
                    <Text style={styles.formLabel}>Select Rating:</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setNewRating(star)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons
                            name={star <= newRating ? 'star' : 'star-outline'}
                            size={26}
                            color={star <= newRating ? '#F59E0B' : '#CBD5E1'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Write your feedback (e.g. Charging speed, amenities, reliability...)"
                      placeholderTextColor="#94A3B8"
                      value={newReviewText}
                      onChangeText={setNewReviewText}
                      multiline
                      numberOfLines={3}
                    />

                    <TouchableOpacity
                      style={[
                        styles.submitReviewBtn,
                        isSubmittingReview && { opacity: 0.6 },
                      ]}
                      onPress={handleAddReview}
                      disabled={isSubmittingReview}
                    >
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                      <Text style={styles.submitReviewBtnText}>
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reviews List */}
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {selectedStation.reviews.map((rev) => (
                    <View key={rev.id} style={styles.reviewItem}>
                      <View style={styles.reviewTopRow}>
                        <View style={styles.reviewAuthorWrap}>
                          <Ionicons name="person-circle" size={20} color="#059669" />
                          <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[...Array(rev.rating)].map((_, i) => (
                            <Ionicons key={i} name="star" size={13} color="#F59E0B" />
                          ))}
                          <Text style={styles.reviewDate}>{rev.date}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{rev.comment}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 8. Roadside Assistance / HELP Modal */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.helpModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setHelpModalVisible(false)}
          />
          <View style={styles.helpModalCard}>
            <View style={styles.helpModalHeader}>
              <View style={styles.helpBadgeIcon}>
                <Ionicons name="medkit" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpModalTitle}>Roadside Assistance</Text>
                <Text style={styles.helpModalSub}>Emergency EV Tow & Rapid Boost Dispatch</Text>
              </View>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Telemetry Summary */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Estimated Coordinates:</Text>
                <Text style={styles.telemetryVal}>{MOCK_CURRENT_LOCATION.coordinatesDisplay}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>GPS Telemetry Mode:</Text>
                <Text style={[styles.telemetryVal, { color: gpsMeta.color, fontWeight: '800' }]}>
                  {gpsState}
                </Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Registered Vehicle:</Text>
                <Text style={styles.telemetryVal}>{vehicle}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Current EV Battery:</Text>
                <Text style={[styles.telemetryVal, { color: currentBattery > 20 ? '#10B981' : '#EF4444', fontWeight: '800' }]}>
                  {currentBattery}%
                </Text>
              </View>
            </View>

            <Text style={styles.helpConfirmText}>
              Do you want to dispatch emergency support to your current vehicle coordinates?
            </Text>

            {/* Action Buttons */}
            <View style={styles.helpActionsRow}>
              <TouchableOpacity
                style={styles.helpCancelBtn}
                onPress={() => setHelpModalVisible(false)}
              >
                <Text style={styles.helpCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpConfirmBtn}
                onPress={handleDispatchHelp}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.helpConfirmBtnText}>YES, Dispatch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. GPS Telemetry Simulation Switcher Modal */}
      <Modal
        visible={gpsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsModalVisible(false)}
      >
        <View style={styles.helpModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setGpsModalVisible(false)}
          />
          <View style={styles.gpsModalCard}>
            <Text style={styles.gpsModalTitle}>Simulate GPS Telemetry State</Text>
            <Text style={styles.gpsModalSub}>
              Demonstrate continuous EV navigation under fluctuating network and tunnel conditions.
            </Text>

            {Object.values(GPS_STATES).map((state) => {
              const isSelected = gpsState === state;
              return (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.gpsOption,
                    isSelected && styles.gpsOptionActive,
                  ]}
                  onPress={() => {
                    setGpsState(state);
                    setGpsModalVisible(false);
                  }}
                >
                  <Text style={[styles.gpsOptionText, isSelected && styles.gpsOptionTextActive]}>
                    {state}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  turnBannerWrapper: {
    position: 'absolute',
    top: 100,
    left: 14,
    right: 14,
    zIndex: 15,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  turnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turnTextContainer: {
    flex: 1,
  },
  turnDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  turnDistance: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  turnStepHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  turnInstruction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 17,
  },
  quickStationsContainer: {
    position: 'absolute',
    top: 190,
    left: 0,
    right: 0,
    zIndex: 14,
  },
  quickStationsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  quickStationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quickStationName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 130,
  },
  quickStationRating: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  bottomControlsRow: {
    position: 'absolute',
    left: 16,
    zIndex: 18,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  helpIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomInfoSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 15,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  routeHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  routePillMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  routePillModeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  singleRouteName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  etaBox: {
    alignItems: 'flex-end',
  },
  etaText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#CBD5E1',
  },
  stationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  stationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  stationAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  stationBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  stationBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stationBadgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  stationBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stationBadgeBlueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  stationBadgeYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stationBadgeYellowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  stationInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 2,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addReviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  addReviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 64,
    marginBottom: 10,
  },
  submitReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitReviewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStars: {
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
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  helpBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  helpModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  telemetryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpConfirmText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  helpActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  helpCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  helpCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  helpConfirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  helpConfirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  gpsModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  gpsModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 16,
  },
  gpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  gpsOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  gpsOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  gpsOptionTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
});
