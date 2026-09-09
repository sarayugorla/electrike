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
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getProfile,
  saveProfile,
  getVehicles,
  saveVehicles,
  addVehicle,
} from '../storage/storage';

const VEHICLE_TYPES = [
  { id: 'Car', label: 'Car', icon: 'car-outline' },
  { id: 'Scooty', label: 'Scooty', icon: 'bicycle-outline' },
  { id: 'Auto', label: 'Auto', icon: 'rickshaw-electric' },
];

export default function ProfileScreen({ navigation }) {
  // Driver Information State
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Primary Vehicle Fields
  const [vehicleType, setVehicleType] = useState('Car');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');

  // Vehicles Garage State
  const [vehicles, setVehicles] = useState([]);
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);

  // New Vehicle Modal Fields
  const [newType, setNewType] = useState('Car');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const profile = await getProfile();
      const savedVehicles = await getVehicles();

      if (profile) {
        setName(profile.name || '');
        setMobileNumber(profile.mobileNumber || '');
        setVehicleType(profile.vehicleType || 'Car');
        setVehicleMake(profile.vehicleMake || '');
        setVehicleModel(profile.vehicleModel || '');
        setNumberPlate(profile.numberPlate || '');
      }

      if (savedVehicles) {
        setVehicles(savedVehicles);
      }
    } catch (e) {
      console.error('Error loading profile screen data:', e);
    }
  };

  // Save profile and primary vehicle changes
  const handleSaveChanges = async () => {
    if (!name.trim() || !mobileNumber.trim()) {
      Alert.alert('Required Fields', 'Please enter your name and mobile number.');
      return;
    }

    if (!vehicleMake.trim() || !vehicleModel.trim() || !numberPlate.trim()) {
      Alert.alert('Required Fields', 'Please complete your primary vehicle details.');
      return;
    }

    setIsSaving(true);
    const updatedProfile = {
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      vehicleType,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      numberPlate: numberPlate.trim().toUpperCase(),
    };

    const saved = await saveProfile(updatedProfile);

    // Update the vehicle in vehicles list if matching
    const updatedVehicles = vehicles.map((v, i) => {
      if (i === 0 || v.numberPlate === updatedProfile.numberPlate) {
        return {
          ...v,
          type: updatedProfile.vehicleType,
          make: updatedProfile.vehicleMake,
          model: updatedProfile.vehicleModel,
          name: `${updatedProfile.vehicleMake} ${updatedProfile.vehicleModel}`,
          numberPlate: updatedProfile.numberPlate,
        };
      }
      return v;
    });

    await saveVehicles(updatedVehicles);
    setVehicles(updatedVehicles);
    setIsSaving(false);

    if (saved) {
      Alert.alert('Success', 'Profile and vehicle information updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  // Add new vehicle to the garage
  const handleAddNewVehicle = async () => {
    if (!newMake.trim() || !newModel.trim() || !newPlate.trim()) {
      Alert.alert('Required Fields', 'Please fill in make, model, and plate number.');
      return;
    }

    const vehicleObj = {
      name: `${newMake.trim()} ${newModel.trim()}`,
      type: newType,
      make: newMake.trim(),
      model: newModel.trim(),
      numberPlate: newPlate.trim().toUpperCase(),
      batteryPercentage: 90,
    };

    const result = await addVehicle(vehicleObj);
    if (result) {
      setVehicles(result);
      setAddVehicleModalVisible(false);
      setNewMake('');
      setNewModel('');
      setNewPlate('');
      Alert.alert('Vehicle Added', `${vehicleObj.name} added to your garage!`);
    } else {
      Alert.alert('Error', 'Failed to add vehicle.');
    }
  };

  // Switch active primary vehicle form
  const handleSelectVehicleCard = (v) => {
    setVehicleType(v.type || 'Car');
    setVehicleMake(v.make || '');
    setVehicleModel(v.model || '');
    setNumberPlate(v.numberPlate || '');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar Header */}
        <View style={styles.avatarHeader}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color="#10B981" />
          </View>
          <Text style={styles.userName}>{name || 'Driver Profile'}</Text>
          <Text style={styles.userPhone}>{mobileNumber || '+91 - Registered EV Driver'}</Text>
        </View>

        {/* Section: Driver Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Driver Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#64748B" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Mobile Number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Section: Active Vehicle Details */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Active Vehicle Specs</Text>
            <Text style={styles.badgeActive}>Primary</Text>
          </View>

          {/* Vehicle Type Selector */}
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
                  >
                    {v.id === 'Auto' ? (
                      <MaterialCommunityIcons
                        name="rickshaw"
                        size={20}
                        color={isSelected ? '#0F172A' : '#64748B'}
                      />
                    ) : (
                      <Ionicons
                        name={v.icon}
                        size={20}
                        color={isSelected ? '#0F172A' : '#64748B'}
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

          {/* Make & Model */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Make</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                  placeholder="e.g. Tata"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Model</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  placeholder="e.g. Nexon EV"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Number Plate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number Plate</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={18} color="#64748B" style={styles.icon} />
              <TextInput
                style={[styles.input, { textTransform: 'uppercase' }]}
                value={numberPlate}
                onChangeText={setNumberPlate}
                placeholder="KA 01 EV 2026"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Section: Garage / Saved Vehicles */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>My EV Garage ({vehicles.length})</Text>
            <TouchableOpacity
              style={styles.addVehicleSmallBtn}
              onPress={() => setAddVehicleModalVisible(true)}
            >
              <Ionicons name="add-circle" size={16} color="#059669" />
              <Text style={styles.addVehicleSmallText}>+ Add Vehicle</Text>
            </TouchableOpacity>
          </View>

          {vehicles.map((veh, index) => {
            const isMatchingActive = veh.numberPlate === numberPlate;
            return (
              <TouchableOpacity
                key={veh.id || index}
                style={[
                  styles.garageItem,
                  isMatchingActive && styles.garageItemActive,
                ]}
                onPress={() => handleSelectVehicleCard(veh)}
              >
                <View style={styles.garageItemIconWrap}>
                  <Ionicons
                    name={
                      veh.type === 'Scooty'
                        ? 'bicycle'
                        : veh.type === 'Auto'
                        ? 'speedometer'
                        : 'car'
                    }
                    size={22}
                    color={isMatchingActive ? '#10B981' : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.garageItemName}>{veh.name || `${veh.make} ${veh.model}`}</Text>
                  <Text style={styles.garageItemSub}>
                    {veh.numberPlate} • {veh.type}
                  </Text>
                </View>
                {isMatchingActive && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSaveChanges}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Ionicons name="save-outline" size={20} color="#0F172A" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal
        visible={addVehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVehicleModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New EV</Text>
              <TouchableOpacity onPress={() => setAddVehicleModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={[styles.vehicleTypeRow, { marginBottom: 12 }]}>
              {VEHICLE_TYPES.map((v) => {
                const isSelected = newType === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleTypeButton,
                      isSelected && styles.vehicleTypeButtonActive,
                    ]}
                    onPress={() => setNewType(v.id)}
                  >
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

            {/* Make */}
            <Text style={styles.label}>Vehicle Make</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ather, MG, Ola, Hyundai"
              placeholderTextColor="#94A3B8"
              value={newMake}
              onChangeText={setNewMake}
            />

            {/* Model */}
            <Text style={styles.label}>Vehicle Model</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 450X, ZS EV, S1 Pro"
              placeholderTextColor="#94A3B8"
              value={newModel}
              onChangeText={setNewModel}
            />

            {/* Plate */}
            <Text style={styles.label}>Number Plate</Text>
            <TextInput
              style={[styles.modalInput, { textTransform: 'uppercase' }]}
              placeholder="e.g. KA 05 EQ 1234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={newPlate}
              onChangeText={setNewPlate}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddNewVehicle}
            >
              <Text style={styles.modalSubmitBtnText}>Add to Garage</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  avatarHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  badgeActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
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
    height: 46,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#10B981',
  },
  vehicleTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  vehicleTypeTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  addVehicleSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addVehicleSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  garageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  garageItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  garageItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  garageItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  garageItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
});
