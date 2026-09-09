import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBattery } from '../context/BatteryContext';

const PRESETS = [20, 50, 80, 100];

export default function BatteryIndicator({ style }) {
  const {
    batteryPercentage,
    updateBattery,
    isModalVisible,
    openBatteryModal,
    closeBatteryModal,
  } = useBattery();

  const [inputVal, setInputVal] = useState(batteryPercentage.toString());

  // Keep inputVal in sync when modal opens
  const handleOpen = () => {
    setInputVal(batteryPercentage.toString());
    openBatteryModal();
  };

  const handleSave = () => {
    const num = parseInt(inputVal, 10);
    if (!isNaN(num)) {
      updateBattery(num);
    }
    closeBatteryModal();
  };

  const handlePreset = (pct) => {
    setInputVal(pct.toString());
    updateBattery(pct);
  };

  const handleStep = (delta) => {
    const current = parseInt(inputVal, 10) || 0;
    const next = Math.max(0, Math.min(100, current + delta));
    setInputVal(next.toString());
    updateBattery(next);
  };

  // Dynamic icon and color based on percentage
  const getBatteryVisual = () => {
    if (batteryPercentage <= 20) {
      return {
        icon: 'battery-dead',
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FECACA',
      };
    }
    if (batteryPercentage <= 50) {
      return {
        icon: 'battery-half',
        color: '#0284C7',
        bg: '#F0F9FF',
        border: '#BAE6FD',
      };
    }
    return {
      icon: 'battery-charging',
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
    };
  };

  const visual = getBatteryVisual();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.badge,
          { backgroundColor: visual.bg, borderColor: visual.border },
          style,
        ]}
        onPress={handleOpen}
        activeOpacity={0.7}
        accessibilityLabel={`EV Battery at ${batteryPercentage} percent, tap to edit`}
        accessibilityRole="button"
      >
        <Ionicons name={visual.icon} size={17} color={visual.color} />
        <Text style={[styles.badgeText, { color: visual.color }]}>
          {batteryPercentage}%
        </Text>
        <Ionicons name="pencil-outline" size={11} color={visual.color} style={{ opacity: 0.8 }} />
      </TouchableOpacity>

      {/* Battery Percentage Editor Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBatteryModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeBatteryModal}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.headerIconWrap}>
                  <Ionicons name="flash" size={20} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Edit EV Battery</Text>
              </View>
              <TouchableOpacity onPress={closeBatteryModal} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Adjust your vehicle's simulated battery state for journey calculations.
            </Text>

            {/* Gauge Display */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeTextRow}>
                <Text style={styles.gaugeBigText}>
                  {inputVal ? Math.max(0, Math.min(100, parseInt(inputVal, 10) || 0)) : 0}%
                </Text>
                <Text style={styles.gaugeStatusLabel}>
                  {parseInt(inputVal, 10) > 20 ? 'Optimal Range' : 'Low Battery Warning'}
                </Text>
              </View>

              {/* Visual Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(0, Math.min(100, parseInt(inputVal, 10) || 0))}%`,
                      backgroundColor: parseInt(inputVal, 10) <= 20 ? '#EF4444' : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Steppers & Manual Input */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => handleStep(-10)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepButtonText}>-10%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => handleStep(-5)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepButtonText}>-5%</Text>
              </TouchableOpacity>

              <View style={styles.numericInputWrapper}>
                <TextInput
                  style={styles.numericInput}
                  value={inputVal}
                  onChangeText={(txt) => {
                    const clean = txt.replace(/[^0-9]/g, '');
                    if (clean === '') {
                      setInputVal('');
                    } else {
                      const num = Math.min(100, parseInt(clean, 10));
                      setInputVal(num.toString());
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>

              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => handleStep(5)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepButtonText}>+5%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => handleStep(10)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepButtonText}>+10%</Text>
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <View style={styles.presetSection}>
              <Text style={styles.presetLabel}>Quick Presets:</Text>
              <View style={styles.presetsRow}>
                {PRESETS.map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[
                      styles.presetChip,
                      parseInt(inputVal, 10) === pct && styles.presetChipActive,
                    ]}
                    onPress={() => handlePreset(pct)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        parseInt(inputVal, 10) === pct && styles.presetChipTextActive,
                      ]}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save & Apply Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#0F172A" />
              <Text style={styles.saveButtonText}>Apply Battery Level</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  gaugeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 18,
  },
  gaugeTextRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeBigText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
  },
  gaugeStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  stepButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  numericInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 76,
    justifyContent: 'center',
  },
  numericInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    padding: 0,
    minWidth: 36,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 2,
  },
  presetSection: {
    marginBottom: 20,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#065F46',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
});
