import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLogoWrap}>
            <Ionicons name="flash" size={32} color="#10B981" />
          </View>
          <Text style={styles.heroTitle}>ELECTRIKE</Text>
          <Text style={styles.heroTagline}>Next-Generation Thermal & Smart EV Navigation</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0 (Release Build)</Text>
          </View>
        </View>

        {/* Section 1: What is Electrike? */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>What is Electrike?</Text>
          </View>
          <Text style={styles.sectionBody}>
            Electrike is an intelligent, eco-centric EV navigation platform designed specifically for electric cars, scooters, and autos. Unlike conventional maps that only optimize for distance or traffic, Electrike factors in real-time thermal conditions, road canopy cover, battery discharge kinetics, charging tariffs, and dynamic charging station availability.
          </Text>
        </View>

        {/* Section 2: Key Features */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles-outline" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>Key Features</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Thermal-Aware Routing:</Text> Minimizes battery heat dissipation through shaded corridors.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Multi-Stop Itineraries:</Text> Seamlessly plan up to 3 intermediate stops with precise battery estimates.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Single-Corridor Focus:</Text> Dedicated optimal path tailored directly to your chosen priority.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Community Charging Reviews:</Text> Real-time 1–5 star driver feedback on charging speeds and charger availability.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Roadside Emergency Assist:</Text> Instant dispatch telemetry with live coordinates and vehicle battery telemetry.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Route Preferences */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>Route Preferences</Text>
          </View>
          <View style={styles.prefGrid}>
            <View style={styles.prefBox}>
              <Text style={styles.prefBoxTitle}>1. Saved Places</Text>
              <Text style={styles.prefBoxDesc}>
                Prioritizes familiar, verified corridors and frequent destinations.
              </Text>
            </View>
            <View style={styles.prefBox}>
              <Text style={styles.prefBoxTitle}>2. Cost Path</Text>
              <Text style={styles.prefBoxDesc}>
                Calculates routes that minimize charging costs and tariff rates.
              </Text>
            </View>
            <View style={styles.prefBox}>
              <Text style={styles.prefBoxTitle}>3. Time Path</Text>
              <Text style={styles.prefBoxDesc}>
                Finds the fastest corridor with high-speed DC fast chargers.
              </Text>
            </View>
            <View style={styles.prefBox}>
              <Text style={styles.prefBoxTitle}>4. Coolest Path</Text>
              <Text style={styles.prefBoxDesc}>
                Maximizes natural canopy cover and minimizes direct solar thermal load.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Charging Station Community */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>Charging Station Community</Text>
          </View>
          <Text style={styles.sectionBody}>
            Electrike empowers EV drivers through crowd-sourced station reviews. Rate charging power reliability, share connector availability, view kilowatt ratings, and help fellow drivers find verified working chargers on any corridor.
          </Text>
        </View>

        {/* Section 5: Emergency Assistance */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit-outline" size={22} color="#EF4444" />
            <Text style={styles.sectionTitle}>Emergency Assistance</Text>
          </View>
          <Text style={styles.sectionBody}>
            Never worry about running out of charge. Our integrated Roadside Assistance (HELP) button packages your live coordinates, battery percentage, and vehicle profile to dispatch nearby mobile EV fast-chargers or tow trucks in a single tap.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Electrike Technologies. All rights reserved.</Text>
          <Text style={styles.footerSub}>Engineered for the Sustainable Mobility Era</Text>
        </View>
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
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroTagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 12,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  prefGrid: {
    gap: 8,
    marginTop: 4,
  },
  prefBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prefBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  prefBoxDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
