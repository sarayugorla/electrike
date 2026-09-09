import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { INITIAL_MOCK_TRIPS } from '../data/mockData';
import { getTrips } from '../storage/storage';

export default function ActivityScreen({ navigation }) {
  const [trips, setTrips] = useState(INITIAL_MOCK_TRIPS);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const storedTrips = await getTrips();
      if (storedTrips && storedTrips.length > 0) {
        setTrips(storedTrips);
      }
    } catch (e) {
      console.error('Error loading trips:', e);
    }
  };

  // Handle "Use Again" button click
  const handleUseAgain = (trip) => {
    navigation.navigate('RoutePlanning', {
      prefillSource: trip.source,
      prefillDestination: trip.destination,
      prefillStops: trip.stops || [],
      prefillPreference: trip.preference,
      prefillVehicle: trip.vehicle,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconCircle}>
              <Ionicons name="leaf" size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.summaryTitle}>Eco Trip Activity</Text>
              <Text style={styles.summarySubtitle}>Logged EV corridors & thermal savings</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{trips.length}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>369 km</Text>
              <Text style={styles.statLabel}>Total Range</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#10B981' }]}>30.3 kg</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
          </View>
        </View>

        {/* Trips List Section */}
        <Text style={styles.sectionHeader}>Trip History</Text>

        {trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* Top row: Date/Time & Vehicle */}
            <View style={styles.tripTopRow}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text style={styles.dateText}>{trip.date}</Text>
              </View>
              <View style={styles.vehicleBadge}>
                <MaterialCommunityIcons name="car-electric" size={14} color="#059669" />
                <Text style={styles.vehicleText}>{trip.vehicle}</Text>
              </View>
            </View>

            {/* Route Locations */}
            <View style={styles.routeLocationsBlock}>
              {/* Source */}
              <View style={styles.locationItem}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationRole}>START</Text>
                  <Text style={styles.locationTitle}>{trip.source}</Text>
                </View>
              </View>

              <View style={styles.connectingLine} />

              {/* Destination */}
              <View style={styles.locationItem}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationRole}>DESTINATION</Text>
                  <Text style={styles.locationTitle}>{trip.destination}</Text>
                </View>
              </View>
            </View>

            {/* Trip Details Badge Row */}
            <View style={styles.prefRow}>
              <View style={styles.prefPill}>
                <Ionicons name="git-branch-outline" size={13} color="#059669" />
                <Text style={styles.prefPillText}>{trip.preference}</Text>
              </View>

              {trip.distanceKm && (
                <Text style={styles.metaStatText}>
                  {trip.distanceKm} km • {trip.durationMinutes} min
                </Text>
              )}
            </View>

            {/* Action Row: Use Again (Restyled without neon yellow) */}
            <View style={styles.tripActionRow}>
              <TouchableOpacity
                style={styles.useAgainButton}
                onPress={() => handleUseAgain(trip)}
                activeOpacity={0.85}
              >
                <Ionicons name="repeat" size={16} color="#FFFFFF" />
                <Text style={styles.useAgainText}>Use Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tripTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  routeLocationsBlock: {
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectingLine: {
    width: 2,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationRole: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  prefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prefPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  metaStatText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tripActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  useAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  useAgainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
