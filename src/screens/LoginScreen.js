import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfile, saveProfile } from '../storage/storage';
import BatteryIndicator from '../components/BatteryIndicator';

const VEHICLE_TYPES = [
  { id: 'Car', label: 'Car', icon: 'car-outline' },
  { id: 'Scooty', label: 'Scooty', icon: 'bicycle-outline' },
  { id: 'Auto', label: 'Auto', icon: 'rickshaw-electric' },
];

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setName(profile.name || '');
        setMobileNumber(profile.mobileNumber || '');
        setVehicleType(profile.vehicleType || 'Car');
        setVehicleMake(profile.vehicleMake || '');
        setVehicleModel(profile.vehicleModel || '');
        setNumberPlate(profile.numberPlate || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your mobile number.');
      return;
    }
    if (!vehicleMake.trim() || !vehicleModel.trim()) {
      Alert.alert('Required Field', 'Please enter your vehicle make and model.');
      return;
    }
    if (!numberPlate.trim()) {
      Alert.alert('Required Field', 'Please enter your vehicle number plate.');
      return;
    }

    setLoading(true);
    const profileData = {
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      vehicleType,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      numberPlate: numberPlate.trim().toUpperCase(),
    };

    const success = await saveProfile(profileData);
    setLoading(false);

    if (success) {
      navigation.navigate('RoutePlanning', {
        userProfile: profileData,
      });
    } else {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header Bar with Safe-Area aware Battery Indicator */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.topBarBrand}>
          <Ionicons name="flash" size={18} color="#10B981" />
          <Text style={styles.topBarBrandText}>ELECTRIKE</Text>
        </View>
        <BatteryIndicator />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={32} color="#10B981" />
          </View>
          <Text style={styles.title}>ELECTRIKE</Text>
          <Text style={styles.subtitle}>Smart EV Routing & Charging Navigator</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Driver & Vehicle Setup</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex Rider"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>
          </View>

          {/* Vehicle Type Selector (Refreshed without neon yellow) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.vehicleTypeRow}>
              {VEHICLE_TYPES.map((v) => {
                const isSelected = vehicleType === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleTypeButton,
                      isSelected && styles.vehicleTypeButtonActive,
                    ]}
                    onPress={() => setVehicleType(v.id)}
                    activeOpacity={0.7}
                  >
                    {v.id === 'Auto' ? (
                      <MaterialCommunityIcons
                        name="rickshaw"
                        size={22}
                        color={isSelected ? '#065F46' : '#64748B'}
                      />
                    ) : (
                      <Ionicons
                        name={v.icon}
                        size={22}
                        color={isSelected ? '#065F46' : '#64748B'}
                      />
                    )}
                    <Text
                      style={[
                        styles.vehicleTypeText,
                        isSelected && styles.vehicleTypeTextActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Vehicle Make & Model Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Make</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Tata / Ather"
                  placeholderTextColor="#94A3B8"
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Model</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nexon EV"
                  placeholderTextColor="#94A3B8"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </View>
            </View>
          </View>

          {/* Number Plate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number Plate</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { textTransform: 'uppercase' }]}
                placeholder="e.g. KA 01 EV 2026"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={numberPlate}
                onChangeText={setNumberPlate}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Saving Profile...' : 'Continue to Route Planning'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Your vehicle details help Electrike optimize battery range and charging stops.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarBrandText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  vehicleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  vehicleTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  vehicleTypeTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 18,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
