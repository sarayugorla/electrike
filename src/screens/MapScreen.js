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
import * as Linking from 'expo-linking';
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
import { getRoute } from '../services/routingService';
import { getChargingStations } from '../services/chargingStationService';
import OpenStreetMap from '../components/OpenStreetMap';
import BatteryIndicator from '../components/BatteryIndicator';
import { useBattery } from '../context/BatteryContext';

const EMERGENCY_PHONE = '+9118001234567';

export default function MapScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { batteryPercentage: currentBattery } = useBattery();

  const {
    source = 'HITEC City, Madhapur',
    sourceCoords = null,
    destination = 'Rajiv Gandhi Int. Airport (RGIA)',
    destinationCoords = null,
    stops = [],
    preference = ROUTE_PREFERENCES.SAVED_PLACES,
    vehicle = 'Tata Nexon EV Max',
  } = route?.params || {};

  // Resolved coordinates with Hyderabad defaults
  const startLocation = useMemo(() => {
    return sourceCoords || {
      latitude: MOCK_CURRENT_LOCATION.latitude,
      longitude: MOCK_CURRENT_LOCATION.longitude,
      name: source,
    };
  }, [sourceCoords, source]);

  const endLocation = useMemo(() => {
    return destinationCoords || {
      latitude: MOCK_DESTINATION.latitude,
      longitude: MOCK_DESTINATION.longitude,
      name: destination,
    };
  }, [destinationCoords, destination]);

  // Fallback single corridor route from mockData
  const singleRoute = useMemo(() => getSingleRoute(preference), [preference]);

  // OSRM dynamic route state
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [osrmSteps, setOsrmSteps] = useState(null);

  // Charging Stations state with reviews
  const [stations, setStations] = useState(MOCK_CHARGING_STATIONS);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationModalVisible, setStationModalVisible] = useState(false);

  // Review Form state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Roadside Assistance / HELP state
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Internal GPS State
  const gpsState = 'GPS Active';

  // Turn-by-Turn Instruction State
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Fetch OSRM route dynamically on mount or coords change
  useEffect(() => {
    let isMounted = true;
    async function fetchOsrm() {
      try {
        const res = await getRoute(startLocation, endLocation);
        if (isMounted && res && res.coordinates && res.coordinates.length > 0) {
          setOsrmRoute(res);
          if (res.steps && res.steps.length > 0) {
            setOsrmSteps(res.steps);
          }
        }
      } catch (e) {
        console.warn('OSRM route fetch failed:', e);
      }
    }
    fetchOsrm();
    return () => {
      isMounted = false;
    };
  }, [startLocation, endLocation]);

  // Fetch charging stations on mount
  useEffect(() => {
    loadStationsAndReviews();
  }, [startLocation]);

  const loadStationsAndReviews = async () => {
    try {
      const fetchedStations = await getChargingStations({
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
      });

      const updated = await Promise.all(
        fetchedStations.map(async (st) => {
          const userReviews = await getStationReviews(st.id);
          if (userReviews && userReviews.length > 0) {
            const combined = [...userReviews, ...(st.reviews || [])];
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
      console.error('Error loading stations & reviews:', e);
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

    await saveStationReview(selectedStation.id, reviewObj);

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

  // Call Emergency Support
  const handleCallSupport = async () => {
    const telUrl = `tel:${EMERGENCY_PHONE}`;
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Helpline', `Call support team directly at ${EMERGENCY_PHONE}`);
      }
    } catch (e) {
      Alert.alert('Call Failed', `Please dial ${EMERGENCY_PHONE} manually.`);
    }
  };

  // Send Emergency SMS
  const handleSmsSupport = async () => {
    const coordsStr = `${startLocation.latitude.toFixed(4)}° N, ${startLocation.longitude.toFixed(4)}° E`;
    const message = `ELECTRIKE SOS:
Vehicle: ${vehicle}
Battery: ${currentBattery}%
Location: ${coordsStr} (${source})
Need immediate assistance.`;

    const smsUrl = `sms:${EMERGENCY_PHONE}?body=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(smsUrl);
    } catch (e) {
      Alert.alert('SMS Error', 'Could not open SMS composer.');
    }
  };

  // Turn-by-Turn Instruction Data: prefer real OSRM steps, fallback to mockData
  const turnInstructions =
    osrmSteps && osrmSteps.length > 0
      ? osrmSteps
      : singleRoute.turnInstructions || [
          { instruction: 'Continue on EV Corridor', distance: '1.2 km', icon: 'arrow-up' },
        ];

  // Clamp index in case step count changes after OSRM loads
  const safeIndex = Math.min(currentTurnIndex, turnInstructions.length - 1);
  const activeTurn = turnInstructions[safeIndex] || turnInstructions[0];

  const handleNextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % turnInstructions.length);
  };

  const effectiveDistance = osrmRoute?.distanceKm || singleRoute.distanceKm;
  const effectiveEtaMin = osrmRoute?.durationMin || singleRoute.etaMinutes;

  return (
    <View style={styles.container}>
      {/* 1. OpenStreetMap Component (Covers full background) */}
      <OpenStreetMap
        source={{
          name: source,
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
        }}
        destination={{
          name: destination,
          latitude: endLocation.latitude,
          longitude: endLocation.longitude,
        }}
        currentLocation={{
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
        }}
        routeCoordinates={osrmRoute?.coordinates || singleRoute.coordinates}
        stations={stations}
        onStationPress={handleOpenStation}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 2. Top Header HUD:
          LEFT: Back button
          RIGHT: Editable Battery Indicator
          (GPS Active dropdown removed as requested)
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

        {/* Editable Battery Indicator */}
        <BatteryIndicator />
      </View>

      {/* 3. Turn-by-Turn Direction Banner */}
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
                  : activeTurn.icon === 'leaf'
                  ? 'leaf'
                  : 'arrow-up'
              }
              size={24}
              color="#F8F7F2"
            />
          </View>
          <View style={styles.turnTextContainer}>
            <View style={styles.turnDistanceRow}>
              <Text style={styles.turnDistance}>{activeTurn.distance}</Text>
              <Text style={styles.turnStepHint}>
                Step {safeIndex + 1}/{turnInstructions.length} • Tap for next
              </Text>
            </View>
            <Text style={styles.turnInstruction} numberOfLines={2}>
              {activeTurn.instruction}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 4. Quick Charging Station Bar on Map */}
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

      {/* 5. Map Bottom Information Sheet:
          - Route Header
          - Distance & ETA 2-Card Row (Replaces 4 metrics)
          - Side-by-Side: Emergency Help + Network Status Cards
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
        </View>

        {/* 2-Card Summary Row (Distance & ETA only) */}
        <View style={styles.summaryTwoCardsRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardIconWrap}>
              <Ionicons name="speedometer-outline" size={20} color="#059669" />
            </View>
            <View>
              <Text style={styles.summaryCardValue}>{effectiveDistance} km</Text>
              <Text style={styles.summaryCardLabel}>Total Distance</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryCardIconWrap, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="time-outline" size={20} color="#0284C7" />
            </View>
            <View>
              <Text style={[styles.summaryCardValue, { color: '#0284C7' }]}>
                {formatEta(effectiveEtaMin)}
              </Text>
              <Text style={styles.summaryCardLabel}>Estimated ETA</Text>
            </View>
          </View>
        </View>

        {/* Side-by-Side Cards: Emergency Help (Left) + Network Status (Right) */}
        <View style={styles.sideBySideRow}>
          {/* Emergency Help Card */}
          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={() => setHelpModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.emergencyIconCircle}>
              <Ionicons name="medkit" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>Emergency Help</Text>
              <Text style={styles.emergencySub}>Vehicle Support Team</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>

          {/* Network Status Card */}
          <View style={styles.networkStatusCard}>
            <View style={styles.networkIconCircle}>
              <Ionicons name="wifi" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.networkTitle}>Network Status</Text>
              <Text style={styles.networkSub}>Online • 4G GPS</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      {/* 6. Charging Station Details & Reviews Modal */}
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
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Specs Badges */}
                <View style={styles.stationBadgesRow}>
                  <View style={styles.stationBadgeGreen}>
                    <Ionicons name="flash" size={12} color="#059669" />
                    <Text style={styles.stationBadgeGreenText}>
                      {selectedStation.chargingPower}
                    </Text>
                  </View>
                  <View style={styles.stationBadgeBlue}>
                    <Ionicons name="hardware-chip-outline" size={12} color="#0284C7" />
                    <Text style={styles.stationBadgeBlueText}>
                      {selectedStation.connectorType}
                    </Text>
                  </View>
                  <View style={styles.stationBadgeYellow}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.stationBadgeYellowText}>
                      {selectedStation.rating} ({selectedStation.reviewCount} reviews)
                    </Text>
                  </View>
                </View>

                {/* Pricing & Availability Info Box */}
                <View style={styles.stationInfoBox}>
                  <View>
                    <Text style={styles.infoLabel}>Estimated Tariff</Text>
                    <Text style={styles.infoVal}>{selectedStation.estimatedPrice}</Text>
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Bay Status</Text>
                    <Text style={[styles.infoVal, { color: '#059669' }]}>
                      {selectedStation.availability}
                    </Text>
                  </View>
                </View>

                {/* Community Reviews Header & Add Button */}
                <View style={styles.reviewsHeaderRow}>
                  <Text style={styles.reviewsTitle}>Community Reviews</Text>
                  <TouchableOpacity
                    style={styles.addReviewBtn}
                    onPress={() => setShowAddReview(!showAddReview)}
                  >
                    <Ionicons
                      name={showAddReview ? 'close' : 'add-circle'}
                      size={15}
                      color="#059669"
                    />
                    <Text style={styles.addReviewBtnText}>
                      {showAddReview ? 'Cancel' : 'Write Review'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Add Review Card */}
                {showAddReview && (
                  <View style={styles.addReviewCard}>
                    <Text style={styles.formLabel}>Rating (1-5 stars):</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                          <Ionicons
                            name={star <= newRating ? 'star' : 'star-outline'}
                            size={24}
                            color="#F59E0B"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Share your charging speed, queue time, or amenities..."
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
                  {selectedStation.reviews &&
                    selectedStation.reviews.map((rev) => (
                      <View key={rev.id} style={styles.reviewItem}>
                        <View style={styles.reviewTopRow}>
                          <View style={styles.reviewAuthorWrap}>
                            <Ionicons name="person-circle" size={20} color="#059669" />
                            <Text style={styles.reviewAuthor}>{rev.author}</Text>
                          </View>
                          <View style={styles.reviewStars}>
                            {[...Array(rev.rating || 5)].map((_, i) => (
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

      {/* 7. Roadside Assistance / HELP Modal (CALL & SMS) */}
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
                <Text style={styles.helpModalSub}>Emergency EV Support & Rapid Response</Text>
              </View>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Telemetry Summary */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>GPS Coordinates:</Text>
                <Text style={styles.telemetryVal}>
                  {startLocation.latitude.toFixed(4)}° N, {startLocation.longitude.toFixed(4)}° E
                </Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Registered Vehicle:</Text>
                <Text style={styles.telemetryVal}>{vehicle}</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Current EV Battery:</Text>
                <Text
                  style={[
                    styles.telemetryVal,
                    {
                      color: currentBattery > 20 ? '#10B981' : '#EF4444',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {currentBattery}%
                </Text>
              </View>
            </View>

            <Text style={styles.helpConfirmText}>
              Connect with our 24x7 EV roadside support team via direct call or emergency SMS.
            </Text>

            {/* Action Buttons: CALL & SMS */}
            <View style={styles.helpActionsRow}>
              {/* CALL button */}
              <TouchableOpacity
                style={styles.helpCallBtn}
                onPress={handleCallSupport}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.helpBtnText}>CALL</Text>
              </TouchableOpacity>

              {/* SMS button */}
              <TouchableOpacity
                style={styles.helpSmsBtn}
                onPress={handleSmsSupport}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                <Text style={styles.helpBtnText}>SMS</Text>
              </TouchableOpacity>

              {/* Cancel button */}
              <TouchableOpacity
                style={styles.helpCancelBtn}
                onPress={() => setHelpModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.helpCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
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
  turnBannerWrapper: {
    position: 'absolute',
    top: 88,
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
    top: 178,
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
    marginBottom: 10,
  },
  routeHeaderLeft: {
    flex: 1,
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
  summaryTwoCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  sideBySideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emergencyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  emergencySub: {
    fontSize: 10,
    color: '#991B1B',
    marginTop: 1,
  },
  networkStatusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  networkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  networkSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
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
    gap: 8,
  },
  helpCallBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  helpSmsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
